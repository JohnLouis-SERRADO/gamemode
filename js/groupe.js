'use strict';

// =====================================================================
// Expéditions multi-écrans : chaque joueur sur son propre appareil.
// Le chef du groupe héberge la simulation de combat (moteur local) et
// publie l'état après chaque tour ; les membres affichent l'état reçu
// et envoient leur action quand c'est leur tour.
// =====================================================================

let minuterieLobby = null;
let minuterieCombatDistant = null;

function arreterSondagesGroupe() {
  if (minuterieLobby) { clearInterval(minuterieLobby); minuterieLobby = null; }
  if (minuterieCombatDistant) { clearInterval(minuterieCombatDistant); minuterieCombatDistant = null; }
}

async function lireGroupe(idGroupe) {
  try {
    const lignes = await apiRequete(`/rest/v1/groupes?id=eq.${idGroupe}&select=*`);
    return lignes && lignes[0] ? lignes[0] : null;
  } catch (e) {
    return null;
  }
}

// Instantané du héros envoyé au groupe (stats effectives précalculées).
function snapshotPourGroupe(p) {
  return {
    id: p.cloud.id,
    nom: p.nom,
    avatar: p.avatar,
    race: p.race || 'humain',
    classe: p.classe || 'aventurier',
    niveau: p.niveau,
    statsEff: statsEffectives(p),
    maxHp: p.maxHp,
    maxMp: p.maxMp,
    hp: p.hp,
    mp: p.mp,
    competences: p.competences,
    rangs: p.rangs || {},
    bossVaincus: p.bossVaincus,
    familiers: p.familiers,
    // v16 : la progression qui ouvre les expéditions de groupe.
    tourMax: p.tourMax || 0,
    tourBoss: p.tourBoss || { normal: 0, heroique: 0, cauchemar: 0 },
    donjonsDebloques: typeof donjonsDebloquesPour === 'function' ? donjonsDebloquesPour(p) : [],
    potions: p.inventaire.filter((e) => OBJETS[e.id] && OBJETS[e.id].type === 'consommable')
      .map((e) => ({ id: e.id, qte: e.qte })),
  };
}

// Reconstruit un combattant pilotable à partir d'un instantané distant.
function creerJoueurDistant(m) {
  return {
    type: 'joueur', distant: true,
    id: 'distant-' + m.id, bid: m.id,
    nom: m.nom, avatar: m.avatar, race: m.race || 'humain', niveau: m.niveau,
    classe: m.classe || 'aventurier',
    stats: { for: m.statsEff.for, int: m.statsEff.int, agi: m.statsEff.agi, vit: m.statsEff.vit, cha: m.statsEff.cha || 0 },
    statsEff: m.statsEff,
    maxHp: m.maxHp, maxMp: m.maxMp, hp: m.hp, mp: m.mp,
    competences: m.competences || [],
    rangs: m.rangs || {},
    inventaire: (m.potions || []).map((e) => ({ ...e })),
    equipement: {}, statuts: [], cooldowns: {}, defense: false, ko: false,
    explorations: {}, bossVaincus: m.bossVaincus || [], familiers: m.familiers || [],
    pointsEnAttente: 0, competencesEnAttente: 0, po: 0, xp: 0,
  };
}

// =====================================================================
// v16 : ce que le GROUPE a débloqué — toujours calé sur le moins avancé,
// pour que l'expédition reste cohérente pour tout le monde.
// =====================================================================
function etageTourGroupe(membres) {
  return Math.min(...membres.map((m) => m.tourMax || 0)) + 1;
}

function difficultesTourBossGroupe(membres) {
  const dispo = ['normal'];
  if (membres.every((m) => ((m.tourBoss || {}).normal || 0) >= 3)) dispo.push('heroique');
  if (membres.every((m) => ((m.tourBoss || {}).heroique || 0) >= 3)) dispo.push('cauchemar');
  return dispo;
}

function etageTourBossGroupe(membres, difficulte) {
  return Math.min(...membres.map((m) => ((m.tourBoss || {})[difficulte]) || 0)) + 1;
}

function donjonsCommunsGroupe(membres) {
  if (!membres.length) return [];
  return membres.reduce(
    (communs, m) => communs.filter((id) => (m.donjonsDebloques || []).includes(id)),
    [...(membres[0].donjonsDebloques || [])],
  );
}

// Le nivelage : chacun est bridé au niveau du moins aguerri du groupe.
function nivelageGroupe(membres) {
  const niveauBas = Math.min(...membres.map((m) => m.niveau || 1));
  const facteurs = {};
  membres.forEach((m) => {
    if ((m.niveau || 1) > niveauBas) facteurs[m.id] = niveauBas / m.niveau;
  });
  return { niveauBas, facteurs: Object.keys(facteurs).length ? facteurs : null };
}

// =====================================================================
// Créer / rejoindre / quitter
// =====================================================================
async function preparerHerosPourGroupe() {
  const p = persoActif();
  if (!etat.enLigne) { afficherToast('Le monde en ligne est injoignable.'); return null; }
  if (!p.cloud) await creerPersonnageCloud(p);
  if (!p.cloud) { afficherToast('Impossible de relier ce héros au monde.'); return null; }
  return p;
}

async function creerGroupeLigne() {
  const p = await preparerHerosPourGroupe();
  if (!p) return;
  const resultat = await apiRequete('/rest/v1/rpc/groupe_creer', {
    methode: 'POST',
    corps: { p_id: p.cloud.id, p_token: p.cloud.token, p_snapshot: snapshotPourGroupe(p) },
  }).catch(() => null);
  if (!resultat || !resultat.groupe_id) { afficherToast('Création du groupe impossible.'); return; }
  etat.groupeLigne = {
    id: resultat.groupe_id, code: resultat.code, chef: true,
    zoneChoisie: 'plaines', difficulteChoisie: 'normal', genreChoisi: 'exploration',
    seqTraite: 0, signatureLobby: '',
  };
  ouvrirLobbyGroupe();
}

async function rejoindreGroupeLigne(code) {
  const p = await preparerHerosPourGroupe();
  if (!p) return;
  const resultat = await apiRequete('/rest/v1/rpc/groupe_rejoindre', {
    methode: 'POST',
    corps: { p_id: p.cloud.id, p_token: p.cloud.token, p_code: code, p_snapshot: snapshotPourGroupe(p) },
  }).catch(() => null);
  if (!resultat || resultat.erreur || !resultat.groupe_id) {
    afficherToast(resultat && resultat.erreur ? `❌ ${resultat.erreur}` : 'Impossible de rejoindre ce groupe.');
    return;
  }
  etat.groupeLigne = { id: resultat.groupe_id, code: resultat.code, chef: false, seqTraite: 0, signatureLobby: '' };
  ouvrirLobbyGroupe();
}

async function quitterGroupeLigne() {
  const p = persoActif();
  const groupe = etat.groupeLigne;
  arreterSondagesGroupe();
  etat.groupeLigne = null;
  if (groupe && p && p.cloud) {
    apiRequete('/rest/v1/rpc/groupe_quitter', {
      methode: 'POST',
      corps: { p_id: p.cloud.id, p_token: p.cloud.token, p_groupe: groupe.id },
    }).catch(() => {});
  }
  naviguer('taverne');
}

// =====================================================================
// Salon d'attente (lobby)
// =====================================================================
function ouvrirLobbyGroupe() {
  arreterSondagesGroupe();
  if (etat.groupeLigne) etat.groupeLigne.signatureLobby = '';
  montrerEcran('ecran-groupe-ligne');
  const tick = async () => {
    const groupe = etat.groupeLigne;
    if (!groupe) { arreterSondagesGroupe(); return; }
    if (!el('ecran-groupe-ligne').classList.contains('actif')) {
      // Le joueur a navigué ailleurs : on met le salon en pause
      // (il peut revenir via la taverne).
      arreterSondagesGroupe();
      return;
    }
    const ligne = await lireGroupe(groupe.id);
    if (!ligne || ligne.statut === 'clos') {
      afficherToast('Le groupe a été dissous.');
      arreterSondagesGroupe();
      etat.groupeLigne = null;
      naviguer('taverne');
      return;
    }
    if (ligne.statut === 'aventure' && !groupe.chef) {
      arreterSondagesGroupe();
      demarrerSuiviCombatDistant();
      return;
    }
    rendreLobbyGroupe(ligne);
  };
  tick();
  minuterieLobby = setInterval(tick, 2000);
}

function rendreLobbyGroupe(ligne) {
  const groupe = etat.groupeLigne;
  const p = persoActif();
  // Ne re-rend que si quelque chose a changé (préserve les sélecteurs)
  const signature = JSON.stringify([ligne.statut, ligne.membres.map((m) => m.nom + m.niveau)]);
  if (signature === groupe.signatureLobby) return;
  groupe.signatureLobby = signature;

  const zone = el('groupe-ligne-contenu');
  zone.innerHTML = '';

  const panneauCode = document.createElement('div');
  panneauCode.className = 'panneau centre-texte';
  panneauCode.innerHTML = `
    <h3>Code du groupe</h3>
    <div class="code-groupe">${echapper(groupe.code)}</div>
    <p class="aide">Vos amis ouvrent le jeu sur leur appareil → Taverne → « Rejoindre avec un code ».
    Chacun joue son tour depuis son propre écran !</p>`;
  zone.appendChild(panneauCode);

  const panneauMembres = document.createElement('div');
  panneauMembres.className = 'panneau';
  panneauMembres.innerHTML = `<h3>👥 Aventuriers présents (${ligne.membres.length}/4)</h3>`;
  const chips = document.createElement('div');
  chips.className = 'rangee-chips';
  ligne.membres.forEach((m) => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = `${m.avatar || '⚔️'} ${m.nom} (niv. ${m.niveau})${m.id === ligne.chef_id ? ' 👑' : ''}`;
    chips.appendChild(chip);
  });
  panneauMembres.appendChild(chips);
  zone.appendChild(panneauMembres);

  if (groupe.chef) {
    const panneauLancement = document.createElement('div');
    panneauLancement.className = 'panneau';
    panneauLancement.innerHTML = '<h3>🗺️ Préparer l’expédition</h3>';

    const ligneChoix = document.createElement('div');
    ligneChoix.className = 'rangee-boutons';

    // v16 : cinq genres d'expédition — zones, tours et donjons débloqués.
    const membres = ligne.membres;
    const selectGenre = document.createElement('select');
    selectGenre.className = 'select-groupe';
    [['exploration', '🗡️ Explorer une zone'], ['boss', '👑 Boss de zone'],
      ['tour', `🗼 Tour Sans Fin — étage ${etageTourGroupe(membres)}`],
      ['tourBoss', `🏯 Tour des Boss`],
      ['assautDonjon', '🏰 Assaut de donjon (boss final)']].forEach(([valeur, libelle]) => {
      const option = document.createElement('option');
      option.value = valeur;
      option.textContent = libelle;
      if (groupe.genreChoisi === valeur) option.selected = true;
      selectGenre.appendChild(option);
    });

    const selectZone = document.createElement('select');
    selectZone.className = 'select-groupe';
    ZONES.filter((z) => p.niveau >= z.niveauMin).forEach((z) => {
      const option = document.createElement('option');
      option.value = z.id;
      option.textContent = `${z.emoji} ${z.nom} (${z.plage})`;
      if (groupe.zoneChoisie === z.id) option.selected = true;
      selectZone.appendChild(option);
    });
    selectZone.addEventListener('change', () => { groupe.zoneChoisie = selectZone.value; });

    const selectDifficulte = document.createElement('select');
    selectDifficulte.className = 'select-groupe';
    const difficultesBoss = difficultesTourBossGroupe(membres);
    Object.entries(DIFFICULTES).forEach(([cle, d]) => {
      const option = document.createElement('option');
      option.value = cle;
      option.textContent = `${d.emoji} ${d.nom}`;
      if (groupe.difficulteChoisie === cle) option.selected = true;
      selectDifficulte.appendChild(option);
    });
    selectDifficulte.addEventListener('change', () => { groupe.difficulteChoisie = selectDifficulte.value; });

    // Les donjons dont TOUTE l'équipe a ouvert les portes.
    const communs = donjonsCommunsGroupe(membres);
    const selectDonjon = document.createElement('select');
    selectDonjon.className = 'select-groupe';
    if (communs.length === 0) {
      const option = document.createElement('option');
      option.textContent = '🔒 Aucun donjon débloqué par toute l’équipe';
      option.disabled = true;
      option.selected = true;
      selectDonjon.appendChild(option);
    } else {
      communs.forEach((id) => {
        const d = DONJONS_PAR_ID[id];
        if (!d) return;
        const option = document.createElement('option');
        option.value = id;
        option.textContent = `${d.emoji} ${d.nom}`;
        if (groupe.donjonChoisi === id) option.selected = true;
        selectDonjon.appendChild(option);
      });
    }
    selectDonjon.addEventListener('change', () => { groupe.donjonChoisi = selectDonjon.value; });

    const aideGenre = document.createElement('p');
    aideGenre.className = 'aide';
    const majVisibilite = () => {
      const genre = groupe.genreChoisi;
      selectZone.classList.toggle('cache', genre !== 'exploration' && genre !== 'boss');
      selectDifficulte.classList.toggle('cache', genre !== 'exploration' && genre !== 'boss' && genre !== 'tourBoss');
      selectDonjon.classList.toggle('cache', genre !== 'assautDonjon');
      if (genre === 'tour') {
        aideGenre.textContent = `🗼 L'équipe grimpe ensemble : l'étage ${etageTourGroupe(membres)} (celui du moins avancé). Victoire = le record de chacun progresse.`;
      } else if (genre === 'tourBoss') {
        aideGenre.textContent = `🏯 Étage ${etageTourBossGroupe(membres, groupe.difficulteChoisie)} — difficultés ouvertes à toute l'équipe : ${difficultesBoss.map((d) => DIFFICULTES[d].nom).join(', ')}. Niveau 10 requis pour chacun.`;
      } else if (genre === 'assautDonjon') {
        aideGenre.textContent = communs.length
          ? '🏰 Affrontez ensemble le boss final d’un donjon que TOUTE l’équipe a débloqué (l’histoire, elle, se vit en solo).'
          : '🏰 Personne ne partage encore de donjon débloqué — progressez chacun dans vos histoires !';
      } else {
        aideGenre.textContent = '⚖️ En groupe, les plus aguerris sont bridés au niveau du moins avancé — et la défaite est MORTELLE (vraie mort, comme en solo).';
      }
    };
    selectGenre.addEventListener('change', () => { groupe.genreChoisi = selectGenre.value; majVisibilite(); });
    selectDifficulte.addEventListener('change', majVisibilite);
    majVisibilite();

    ligneChoix.appendChild(selectGenre);
    ligneChoix.appendChild(selectZone);
    ligneChoix.appendChild(selectDifficulte);
    ligneChoix.appendChild(selectDonjon);
    panneauLancement.appendChild(ligneChoix);
    panneauLancement.appendChild(aideGenre);

    const lancer = document.createElement('button');
    lancer.className = 'btn-principal';
    lancer.textContent = '⚔️ Lancer l’expédition';
    lancer.addEventListener('click', () => lancerExpeditionGroupe(ligne));
    panneauLancement.appendChild(lancer);
    zone.appendChild(panneauLancement);
  } else {
    const attente = document.createElement('div');
    attente.className = 'panneau';
    attente.innerHTML = '<h3>⏳ En attente du chef…</h3><p class="aide">Le chef choisit la zone et la difficulté. Le combat s’affichera ici automatiquement.</p>';
    zone.appendChild(attente);
  }

  const quitter = document.createElement('button');
  quitter.className = 'btn-choix';
  quitter.textContent = '🚪 Quitter le groupe';
  quitter.addEventListener('click', quitterGroupeLigne);
  zone.appendChild(quitter);
}

async function lancerExpeditionGroupe(ligne) {
  const groupe = etat.groupeLigne;
  const p = persoActif();
  const genre = groupe.genreChoisi;
  const membres = ligne.membres;
  const zone = zonePar(groupe.zoneChoisie) || ZONES[0];
  const nbHeros = membres.length;
  const multEquipe = 1 + 0.35 * (nbHeros - 1);
  const multAtkEquipe = 1 + 0.1 * (nbHeros - 1);

  // v16 : composer l'expédition selon le genre — toujours calée sur le
  // moins avancé du groupe ("débloqué par TOUTE l'équipe").
  let defs;
  let genreCombat = 'exploration';
  let zoneCombat = zone;
  let difficulte = groupe.difficulteChoisie;
  let titre = null;
  let intro = null;
  let groupeExtra = null;

  if (genre === 'exploration' || genre === 'boss') {
    if (!difficulteDebloquee(p, zone, difficulte)) {
      afficherToast(`${DIFFICULTES[difficulte].emoji} Difficulté non débloquée pour cette zone (par le chef).`);
      return;
    }
    const mult = DIFFICULTES[difficulte] || DIFFICULTES.normal;
    const cles = genre === 'boss' ? [zone.boss] : composerPack(zone, tailleDuPack(membres));
    defs = cles.map((cle) => ({
      ...MONSTRES[cle], cle,
      hp: Math.round(MONSTRES[cle].hp * mult.hp),
      atk: Math.round(MONSTRES[cle].atk * mult.atk),
    }));
    genreCombat = genre === 'boss' ? 'boss' : 'exploration';
  } else if (genre === 'tour') {
    const etage = etageTourGroupe(membres);
    const z = zonePourEtage(etage);
    const multTour = 1 + etage * 0.06;
    const cles = etage % 5 === 0 ? [z.boss] : composerPack(z, tailleDuPack(membres));
    defs = cles.map((cle) => ({
      ...MONSTRES[cle], cle,
      hp: Math.round(MONSTRES[cle].hp * multTour),
      atk: Math.round(MONSTRES[cle].atk * multTour),
    }));
    genreCombat = 'exploration';
    zoneCombat = z;
    difficulte = 'normal';
    titre = `🗼 Tour Sans Fin — Étage ${etage} (groupe)`;
    intro = `L'équipe grimpe ensemble : l'étage ${etage}, celui du moins avancé. Victoire = le record de chacun progresse !`;
    groupeExtra = { tourEtage: etage };
  } else if (genre === 'tourBoss') {
    if (membres.some((m) => (m.niveau || 1) < 10)) {
      afficherToast('🏯 La Tour des Boss exige le niveau 10 — pour CHAQUE membre du groupe.');
      return;
    }
    const dispo = difficultesTourBossGroupe(membres);
    if (!dispo.includes(difficulte)) difficulte = dispo[dispo.length - 1];
    const etage = etageTourBossGroupe(membres, difficulte);
    const diff = DIFFICULTES[difficulte];
    const cle = CYCLE_TOUR_BOSS[(etage - 1) % CYCLE_TOUR_BOSS.length];
    const cycle = Math.floor((etage - 1) / CYCLE_TOUR_BOSS.length);
    const base = MONSTRES[cle];
    defs = [{
      ...base, cle,
      nom: cycle > 0 ? `${base.nom} transcendé` : base.nom,
      hp: Math.round(base.hp * diff.hp * (1 + etage * 0.08 + cycle * 0.6) * multEquipe),
      atk: Math.round(base.atk * diff.atk * (1 + etage * 0.03) * multAtkEquipe),
    }];
    genreCombat = 'boss';
    zoneCombat = null;
    titre = `🏯 Tour des Boss — Étage ${etage} (groupe)`;
    intro = `${defs[0].nom} garde l'étage ${etage}. L'équipe grimpe depuis le record du moins avancé.`;
    groupeExtra = { tourBoss: { etage, difficulte } };
  } else if (genre === 'assautDonjon') {
    const communs = donjonsCommunsGroupe(membres);
    const idDonjon = communs.includes(groupe.donjonChoisi) ? groupe.donjonChoisi : communs[0];
    const donjon = idDonjon ? DONJONS_PAR_ID[idDonjon] : null;
    if (!donjon) {
      afficherToast('🏰 Aucun donjon n’est débloqué par TOUTE l’équipe.');
      return;
    }
    const boss = bossDeDonjon(donjon);
    if (!boss) { afficherToast('🏰 Ce donjon n’a pas de boss à assaillir.'); return; }
    const base = defMonstreDonjon(boss.monstre);
    defs = [{
      ...base, cle: boss.monstre,
      hp: Math.round(base.hp * multEquipe),
      atk: Math.round(base.atk * multAtkEquipe),
    }];
    genreCombat = 'boss';
    zoneCombat = null;
    difficulte = 'normal';
    titre = `🏰 ${donjon.emoji} ${donjon.nom} — l'assaut du boss`;
    intro = boss.intro || 'Le maître du donjon vous attend de pied ferme.';
    groupeExtra = { assautDonjon: donjon.id };
  }

  const ok = await apiRequete('/rest/v1/rpc/groupe_lancer', {
    methode: 'POST',
    corps: {
      p_id: p.cloud.id, p_token: p.cloud.token, p_groupe: groupe.id,
      p_zone: zone.id, p_difficulte: difficulte, p_genre: genre,
    },
  }).catch(() => null);
  if (!ok) { afficherToast('Lancement impossible.'); return; }
  arreterSondagesGroupe();
  groupe.seqTraite = 0;

  // Le chef héberge le combat : son vrai héros + les instantanés distants.
  const membresFrais = (await lireGroupe(groupe.id)).membres;
  const equipe = membresFrais.map((m) => {
    if (m.id === p.cloud.id) { p.bid = p.cloud.id; return p; }
    return creerJoueurDistant(m);
  });
  // v16 : le nivelage — chacun est bridé au niveau du moins aguerri.
  const nivelage = nivelageGroupe(membresFrais);
  demarrerCombat({
    genre: genreCombat,
    zone: zoneCombat,
    difficulte,
    titre,
    intro,
    monstresDef: defs,
    equipe,
    groupe: { id: groupe.id, hote: true, seqTraite: 0 },
    groupeExtra,
    nivelage: nivelage.facteurs,
  });
  if (nivelage.facteurs) {
    journal(`⚖️ L'équipe se cale sur le niveau ${nivelage.niveauBas} : les plus aguerris brident leur puissance.`);
    rendreCombat();
  }
}

// =====================================================================
// Côté chef (hôte) : publication d'état et tours distants
// =====================================================================
function serialiserCombat(cb) {
  return {
    genre: cb.genre,
    difficulte: cb.difficulte,
    manche: cb.manche,
    termine: cb.termine,
    enAttenteDe: cb.enAttenteDe || null,
    titre: el('combat-titre').textContent,
    journal: cb.journalLignes.slice(-30),
    monstres: cb.monstres.map((m) => ({
      id: m.id, nom: m.nom, emoji: m.emoji, niveau: m.niveau,
      hp: m.hp, maxHp: m.maxHp, statuts: m.statuts, mort: m.mort, boss: !!m.boss,
    })),
    equipe: cb.equipe.map((j) => ({
      type: j.type, bid: j.bid || null, maitre: j.maitre || null,
      nom: j.nom, avatar: j.avatar, emoji: j.emoji || null,
      race: j.race, niveau: j.niveau, ligne: j.ligne || null,
      hp: j.hp, maxHp: j.maxHp, mp: j.mp, maxMp: j.maxMp,
      statsEff: j.type === 'invocation' ? j.stats : statsCombat(j),
      statuts: j.statuts, ko: j.ko, mort: j.mort || false, defense: j.defense,
      cooldowns: j.cooldowns, competences: j.competences,
      potions: (j.inventaire || [])
        .filter((e) => OBJETS[e.id] && OBJETS[e.id].type === 'consommable')
        .map((e) => ({ id: e.id, qte: e.qte })),
    })),
    resultat: cb.resultatGroupe || null,
  };
}

async function publierEtatGroupe(cb, statut) {
  const p = persoActif();
  if (!p || !p.cloud || !cb.groupe) return;
  await apiRequete('/rest/v1/rpc/groupe_publier', {
    methode: 'POST',
    corps: {
      p_id: p.cloud.id, p_token: p.cloud.token, p_groupe: cb.groupe.id,
      p_etat: serialiserCombat(cb), p_seq_traite: cb.groupe.seqTraite || 0,
      p_statut: statut || null,
    },
  }).catch(() => {});
}

// Attend l'action d'un héros distant (60 s maximum, sinon il se défend).
async function tourJoueurDistant(c) {
  const cb = etat.combat;
  cb.enAttenteDe = c.bid;
  rendreCombat();
  const zone = el('zone-actions');
  zone.innerHTML = `<div class="actions-entete"><span class="avatar-grand">${c.avatar}</span>
    <div>Au tour de <strong>${echapper(c.nom)}</strong> — il joue sur son propre écran…<br>
    <span class="actions-vie">⏳ En attente de son action</span></div></div>`;
  await publierEtatGroupe(cb);

  const debut = Date.now();
  let actionRecue = null;
  while (!actionRecue && Date.now() - debut < 60000 && !cb.termine) {
    await attendre(1300);
    const ligne = await lireGroupe(cb.groupe.id);
    if (!ligne || ligne.statut !== 'aventure') break;
    const entree = (ligne.actions || []).find(
      (a) => a.joueur === c.bid && a.seq > (cb.groupe.seqTraite || 0));
    if (entree) {
      cb.groupe.seqTraite = entree.seq;
      actionRecue = entree.action;
    }
  }
  cb.enAttenteDe = null;
  if (cb.termine) return;
  if (!actionRecue) {
    journal(`⏳ ${c.nom} tarde à agir : il se met en garde.`);
    actionRecue = { genre: 'defense' };
  }
  executerActionDistante(c, actionRecue);
  rendreCombat();
}

function executerActionDistante(j, a) {
  const cb = etat.combat;
  let action = { genre: a.genre, compId: a.compId, idObjet: a.idObjet };

  // Validation légère : compétence connue, mana et recharge disponibles.
  if (action.genre === 'competence') {
    const comp = COMPETENCES[action.compId];
    if (!comp || !j.competences.includes(action.compId)
      || (j.cooldowns[action.compId] || 0) > 0 || j.mp < comp.coutMp) {
      action = { genre: 'defense' };
    }
  }
  if (action.genre === 'objet') {
    const objet = OBJETS[action.idObjet];
    if (!objet || compterObjet(j, action.idObjet) < 1) action = { genre: 'defense' };
  }

  // Résolution de la cible envoyée par le membre.
  let cible = null;
  const comp = action.compId ? COMPETENCES[action.compId] : null;
  const cibleType = action.genre === 'attaque' ? 'ennemi' : (comp ? comp.cible : null);
  if (cibleType === 'ennemi') {
    cible = cb.monstres.find((m) => m.id === a.cibleId && !m.mort)
      || cb.monstres.find((m) => !m.mort);
    if (!cible) return;
  } else if (cibleType === 'allie') {
    cible = cb.equipe.find((x) => x.bid === a.cibleId && !x.ko)
      || cb.equipe.find((x) => !x.ko);
  } else if (cibleType === 'soi') {
    cible = j;
  }

  const issue = executerActionCoeur(j, action, cible);
  if (issue === 'fuite') {
    cb.termine = true;
    cb.actif = null;
    rendreCombat();
    setTimeout(() => apresFuite(cb), 500);
  }
}

// Fin de combat côté chef : calcule et publie les récompenses de chacun.
function apresCombatGroupeHote(cb, type) {
  const p = persoActif();
  const lignes = [];
  const recompenses = {};
  // v16 : les invocations ne comptent ni dans le partage ni dans les gains.
  cb.equipe = cb.equipe.filter((j) => j.type !== 'invocation');
  const partage = cb.equipe.length;
  const extra = cb.groupeExtra || {};

  if (type === 'victoire') {
    const butin = tirerButinCombat(cb);
    const bonusGroupe = partage > 1 ? 1.15 : 1;
    // Les tours paient leur prime d'étage, comme en solo.
    const multEtage = extra.tourEtage ? 1 + extra.tourEtage * 0.12
      : (extra.tourBoss ? 1 + extra.tourBoss.etage * 0.15 : 1);
    const xpParHeros = Math.max(1, Math.round((butin.xp * multEtage / partage) * bonusGroupe));
    const poParHeros = Math.max(0, Math.round(butin.po * multEtage / partage));
    lignes.push(`⭐ +${xpParHeros} XP par héros`);
    lignes.push(`💰 +${poParHeros} pièces d'or par héros`);
    const parts = {};
    cb.equipe.forEach((j) => { parts[j.bid] = {}; });
    Object.entries(butin.objets).forEach(([id, qte]) => {
      lignes.push(`${OBJETS[id].emoji} ${OBJETS[id].nom} ×${qte}${partage > 1 ? ' (réparti)' : ''}`);
      for (let i = 0; i < qte; i++) {
        const heureux = cb.equipe[alea(0, partage - 1)];
        parts[heureux.bid][id] = (parts[heureux.bid][id] || 0) + 1;
      }
    });
    cb.equipe.forEach((j) => {
      recompenses[j.bid] = {
        xp: xpParHeros, po: poParHeros, objets: parts[j.bid],
        nbMonstres: cb.monstres.length,
        potionsConsommees: (cb.consosDistantes && cb.consosDistantes[j.bid]) || {},
        hpFinal: Math.max(1, j.hp), mpFinal: j.mp,
      };
      // Un boss de zone abattu en groupe : coffre pour chacun.
      if (cb.genre === 'boss' && cb.zone) {
        const coffre = ouvrirCoffreBoss(j, cb.zone, cb.difficulte);
        Object.entries(coffre.objets).forEach(([id, qte]) => {
          recompenses[j.bid].objets[id] = (recompenses[j.bid].objets[id] || 0) + qte;
        });
        recompenses[j.bid].lignesCoffre = coffre.lignes;
        recompenses[j.bid].bossVaincu = cb.zone.id;
        recompenses[j.bid].familier = coffre.familier;
      }
      // v16 : les tours gravées en groupe font progresser le record de CHACUN.
      if (extra.tourEtage) recompenses[j.bid].tourEtage = extra.tourEtage;
      if (extra.tourBoss) recompenses[j.bid].tourBoss = extra.tourBoss;
    });
    if (extra.tourEtage) lignes.push(`🗼 Étage ${extra.tourEtage} gravé ensemble : le record de chacun progresse !`);
    if (extra.tourBoss) lignes.push(`🏯 Étage ${extra.tourBoss.etage} (${DIFFICULTES[extra.tourBoss.difficulte].nom}) vaincu ensemble : record pour chacun !`);
    if (extra.assautDonjon && DONJONS_PAR_ID[extra.assautDonjon]) {
      lignes.push(`🏰 Le boss de « ${DONJONS_PAR_ID[extra.assautDonjon].nom} » est tombé sous l'assaut du groupe !`);
    }
  } else if (type === 'defaite') {
    // v16 : la défaite en groupe est MORTELLE — la vraie mort, comme en
    // solo, appliquée par chaque écran sur son propre héros.
    lignes.push('💀 Le groupe est anéanti… La mort prend son dû sur chaque écran : équipement porté, familier, la moitié de la bourse et un niveau.');
    cb.equipe.forEach((j) => {
      recompenses[j.bid] = {
        xp: 0, po: 0, objets: {}, defaite: true,
        potionsConsommees: (cb.consosDistantes && cb.consosDistantes[j.bid]) || {},
      };
    });
  } else {
    lignes.push('💨 Le groupe s’est échappé. Pas de butin, pas de regrets.');
    cb.equipe.forEach((j) => {
      recompenses[j.bid] = {
        xp: 0, po: 0, objets: {},
        potionsConsommees: (cb.consosDistantes && cb.consosDistantes[j.bid]) || {},
        hpFinal: Math.max(1, j.hp), mpFinal: j.mp,
      };
    });
  }

  const titres = { victoire: '🏆 Victoire du groupe !', defaite: '💫 Défaite du groupe…', fuite: '💨 Repli du groupe' };
  cb.resultatGroupe = { type, titre: titres[type], lignes, recompenses };
  publierEtatGroupe(cb, 'lobby');

  const maRecompense = recompenses[p.cloud.id];
  appliquerRecompenseGroupe(p, maRecompense);
  afficherButin({
    titre: titres[type],
    texte: partage > 1 ? 'Chaque écran reçoit sa part.' : '',
    lignes: lignes.concat(maRecompense && maRecompense.lignesCoffre ? maRecompense.lignesCoffre : []),
    retour: 'groupe-ligne',
  });
}

function appliquerRecompenseGroupe(p, recompense) {
  if (!recompense) return;
  // v16 : la défaite du groupe déclenche la vraie mort — pertes
  // définitives, écran au crâne et retour dans le passé, comme en solo.
  if (recompense.defaite) {
    Object.entries(recompense.potionsConsommees || {}).forEach(([id, qte]) => retirerObjet(p, id, qte));
    const bilan = appliquerMortHeros(p);
    rendreTopbar();
    afficherEcranMort([bilan], ['💀 L’expédition du groupe a été anéantie.']);
    return;
  }
  if (recompense.bossVaincu && !p.bossVaincus.includes(recompense.bossVaincu)) {
    p.bossVaincus.push(recompense.bossVaincu);
  }
  if (recompense.familier && !p.familiers.includes(recompense.familier)) {
    p.familiers.push(recompense.familier);
    afficherToast(`🐾 ${FAMILIERS[recompense.familier].emoji} ${FAMILIERS[recompense.familier].nom} vous adopte !`);
  }
  if (recompense.nbMonstres) {
    p.compteurs.monstres += recompense.nbMonstres;
    progresserQuete(p, 'monstres', recompense.nbMonstres);
  }
  if (recompense.bossVaincu) progresserQuete(p, 'boss', 1);
  // v16 : les tours gravées en groupe font progresser les records solo.
  if (recompense.tourEtage) {
    if (p.tourMax < recompense.tourEtage) p.tourMax = recompense.tourEtage;
    progresserQuete(p, 'tour', 1);
  }
  if (recompense.tourBoss && p.tourBoss) {
    const { etage, difficulte } = recompense.tourBoss;
    if ((p.tourBoss[difficulte] || 0) < etage) p.tourBoss[difficulte] = etage;
    progresserQuete(p, 'tourBoss', 1);
  }
  p.compteurs.orTotal += Math.max(0, recompense.po || 0);
  p.po += recompense.po || 0;
  Object.entries(recompense.objets || {}).forEach(([id, qte]) => ajouterObjet(p, id, qte));
  Object.entries(recompense.potionsConsommees || {}).forEach(([id, qte]) => retirerObjet(p, id, qte));
  const niveaux = gagnerXp(p, recompense.xp || 0);
  nettoyerApresCombat(p);
  if (niveaux > 0) {
    afficherToast(`🎉 ${p.avatar} ${p.nom} passe niveau ${p.niveau} !`);
  } else {
    p.hp = Math.min(p.maxHp, recompense.hpFinal != null ? recompense.hpFinal : p.hp);
    p.mp = Math.min(p.maxMp, recompense.mpFinal != null ? recompense.mpFinal : p.mp);
  }
  verifierHautsFaits(p);
  sauvegarder(p);
  rendreTopbar();
}

// =====================================================================
// Côté membre : suivi du combat publié par le chef
// =====================================================================
function demarrerSuiviCombatDistant() {
  arreterSondagesGroupe();
  const tick = async () => {
    const groupe = etat.groupeLigne;
    if (!groupe) { arreterSondagesGroupe(); return; }
    const ligne = await lireGroupe(groupe.id);
    if (!ligne || ligne.statut === 'clos') {
      arreterSondagesGroupe();
      etat.combat = null;
      etat.groupeLigne = null;
      afficherToast('Le groupe a été dissous.');
      naviguer('taverne');
      return;
    }
    // La fraîcheur de la publication trahit un chef déconnecté.
    if (ligne.statut === 'aventure' && Date.now() - new Date(ligne.maj).getTime() > 30000) {
      afficherToast('📡 Le chef semble déconnecté…');
    }
    if (ligne.statut === 'lobby') {
      arreterSondagesGroupe();
      const resultat = ligne.etat && ligne.etat.resultat;
      etat.combat = null;
      if (resultat) {
        const p = persoActif();
        const maRecompense = resultat.recompenses[p.cloud.id];
        appliquerRecompenseGroupe(p, maRecompense);
        afficherButin({
          titre: resultat.titre,
          texte: 'Votre part de l’expédition partagée.',
          lignes: resultat.lignes.concat(maRecompense && maRecompense.lignesCoffre ? maRecompense.lignesCoffre : []),
          retour: 'groupe-ligne',
        });
      } else {
        ouvrirLobbyGroupe();
      }
      return;
    }
    if (ligne.etat) majCombatDistant(ligne.etat);
  };
  tick();
  minuterieCombatDistant = setInterval(tick, 1300);
}

function majCombatDistant(recu) {
  const p = persoActif();
  let cb = etat.combat;
  if (!cb || !cb.distant) {
    cb = etat.combat = {
      distant: true,
      genre: recu.genre,
      difficulte: recu.difficulte,
      zone: null,
      manche: 0,
      termine: false,
      cibleEnAttente: null,
      finTour: null,
      modeActions: null,
      actionEnvoyee: false,
      journalLignes: [],
      monstres: [], equipe: [],
      groupe: etat.groupeLigne ? { id: etat.groupeLigne.id, hote: false } : null,
      enAttenteDe: null,
      manchesMax: null,
      actif: null,
    };
  }

  const monTourAvant = cb.enAttenteDe === (p.cloud && p.cloud.id);
  cb.genre = recu.genre;
  cb.manche = recu.manche;
  cb.termine = recu.termine;
  cb.enAttenteDe = recu.enAttenteDe;
  cb.journalLignes = recu.journal || [];
  cb.monstres = (recu.monstres || []).map((m) => ({ ...m, type: 'monstre' }));
  cb.equipe = (recu.equipe || []).map((j, index) => ({
    ...j, type: j.type || 'joueur', id: j.bid || `c${index}`,
    inventaire: (j.potions || []).map((e) => ({ ...e })),
  }));
  cb.actif = cb.equipe.find((j) => j.type === 'joueur' && j.bid === recu.enAttenteDe) || null;

  if (!el('ecran-combat').classList.contains('actif')) montrerEcran('ecran-combat');
  el('combat-titre').textContent = recu.titre || 'Expédition de groupe';
  el('combat-manche').textContent = recu.manche ? `Manche ${recu.manche}` : '';
  rendreCombat();

  const monTour = recu.enAttenteDe === (p.cloud && p.cloud.id);
  if (monTour && !cb.actionEnvoyee) {
    // Ne pas écraser un choix de cible ou un menu d'objets en cours.
    const dejaAffiche = monTourAvant
      && (cb.cibleEnAttente || cb.modeActions || el('zone-actions').querySelector('.btn-action'));
    if (!dejaAffiche) {
      const moi = cb.equipe.find((j) => j.bid === p.cloud.id);
      if (moi) {
        cb.modeActions = null;
        cb.cibleEnAttente = null;
        rendreActions(moi);
      }
    }
  } else if (!monTour) {
    cb.actionEnvoyee = false;
    cb.cibleEnAttente = null;
    const zone = el('zone-actions');
    if (cb.actif) {
      zone.innerHTML = `<div class="actions-entete"><span class="avatar-grand">${cb.actif.avatar}</span>
        <div>Au tour de <strong>${echapper(cb.actif.nom)}</strong> (sur son écran)…</div></div>`;
    } else {
      zone.innerHTML = '';
    }
  }
}

// Le membre envoie son action au chef.
async function envoyerActionGroupe(action, cible) {
  const cb = etat.combat;
  const p = persoActif();
  if (!cb || !cb.distant || !etat.groupeLigne || cb.actionEnvoyee) return;
  cb.actionEnvoyee = true;
  cb.cibleEnAttente = null;
  const charge = {
    genre: action.genre,
    compId: action.compId || null,
    idObjet: action.idObjet || null,
    cibleId: cible ? (cible.type === 'monstre' ? cible.id : cible.bid) : null,
  };
  el('zone-actions').innerHTML = `<div class="actions-entete">
    <div>⏳ Action envoyée… le chef résout le tour.</div></div>`;
  const ok = await apiRequete('/rest/v1/rpc/groupe_agir', {
    methode: 'POST',
    corps: { p_id: p.cloud.id, p_token: p.cloud.token, p_groupe: etat.groupeLigne.id, p_action: charge },
  }).catch(() => false);
  if (!ok) {
    cb.actionEnvoyee = false;
    afficherToast('Envoi impossible, réessayez.');
    const moi = cb.equipe.find((j) => j.bid === p.cloud.id);
    if (moi) rendreActions(moi);
  }
}
