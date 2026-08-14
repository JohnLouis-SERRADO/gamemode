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
    niveau: p.niveau,
    statsEff: statsEffectives(p),
    maxHp: p.maxHp,
    maxMp: p.maxMp,
    hp: p.hp,
    mp: p.mp,
    competences: p.competences,
    bossVaincus: p.bossVaincus,
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
    stats: { for: m.statsEff.for, int: m.statsEff.int, agi: m.statsEff.agi, vit: m.statsEff.vit, cha: m.statsEff.cha || 0 },
    statsEff: m.statsEff,
    maxHp: m.maxHp, maxMp: m.maxMp, hp: m.hp, mp: m.mp,
    competences: m.competences || [],
    inventaire: (m.potions || []).map((e) => ({ ...e })),
    equipement: {}, statuts: [], cooldowns: {}, defense: false, ko: false,
    explorations: {}, bossVaincus: m.bossVaincus || [], pointsEnAttente: 0, competencesEnAttente: 0, po: 0, xp: 0,
  };
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
    Object.entries(DIFFICULTES).forEach(([cle, d]) => {
      const option = document.createElement('option');
      option.value = cle;
      option.textContent = `${d.emoji} ${d.nom}`;
      if (groupe.difficulteChoisie === cle) option.selected = true;
      selectDifficulte.appendChild(option);
    });
    selectDifficulte.addEventListener('change', () => { groupe.difficulteChoisie = selectDifficulte.value; });

    const selectGenre = document.createElement('select');
    selectGenre.className = 'select-groupe';
    [['exploration', '🗡️ Explorer'], ['boss', '👑 Boss de zone']].forEach(([valeur, libelle]) => {
      const option = document.createElement('option');
      option.value = valeur;
      option.textContent = libelle;
      if (groupe.genreChoisi === valeur) option.selected = true;
      selectGenre.appendChild(option);
    });
    selectGenre.addEventListener('change', () => { groupe.genreChoisi = selectGenre.value; });

    ligneChoix.appendChild(selectZone);
    ligneChoix.appendChild(selectDifficulte);
    ligneChoix.appendChild(selectGenre);
    panneauLancement.appendChild(ligneChoix);

    const lancer = document.createElement('button');
    lancer.className = 'btn-principal';
    lancer.textContent = '⚔️ Lancer le combat';
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
  const zone = zonePar(groupe.zoneChoisie) || ZONES[0];
  if (!difficulteDebloquee(p, zone, groupe.difficulteChoisie)) {
    afficherToast(`${DIFFICULTES[groupe.difficulteChoisie].emoji} Difficulté non débloquée pour cette zone (par le chef).`);
    return;
  }
  const ok = await apiRequete('/rest/v1/rpc/groupe_lancer', {
    methode: 'POST',
    corps: {
      p_id: p.cloud.id, p_token: p.cloud.token, p_groupe: groupe.id,
      p_zone: zone.id, p_difficulte: groupe.difficulteChoisie, p_genre: groupe.genreChoisi,
    },
  }).catch(() => null);
  if (!ok) { afficherToast('Lancement impossible.'); return; }
  arreterSondagesGroupe();
  groupe.seqTraite = 0;

  // Le chef héberge le combat : son vrai héros + les instantanés distants.
  const membres = (await lireGroupe(groupe.id)).membres;
  const equipe = membres.map((m) => {
    if (m.id === p.cloud.id) { p.bid = p.cloud.id; return p; }
    return creerJoueurDistant(m);
  });
  const mult = DIFFICULTES[groupe.difficulteChoisie] || DIFFICULTES.normal;
  const cles = groupe.genreChoisi === 'boss'
    ? [zone.boss]
    : composerPack(zone, tailleDuPack(equipe.length));
  const defs = cles.map((cle) => ({
    ...MONSTRES[cle], cle,
    hp: Math.round(MONSTRES[cle].hp * mult.hp),
    atk: Math.round(MONSTRES[cle].atk * mult.atk),
  }));
  demarrerCombat({
    genre: groupe.genreChoisi === 'boss' ? 'boss' : 'exploration',
    zone,
    difficulte: groupe.difficulteChoisie,
    monstresDef: defs,
    equipe,
    groupe: { id: groupe.id, hote: true, seqTraite: 0 },
  });
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
      bid: j.bid, nom: j.nom, avatar: j.avatar, race: j.race, niveau: j.niveau,
      hp: j.hp, maxHp: j.maxHp, mp: j.mp, maxMp: j.maxMp,
      statsEff: statsEffectives(j),
      statuts: j.statuts, ko: j.ko, defense: j.defense,
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
  const partage = cb.equipe.length;

  if (type === 'victoire') {
    const butin = tirerButinCombat(cb);
    const bonusGroupe = partage > 1 ? 1.15 : 1;
    const xpParHeros = Math.max(1, Math.round((butin.xp / partage) * bonusGroupe));
    const poParHeros = Math.max(0, Math.round(butin.po / partage));
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
      }
    });
  } else if (type === 'defaite') {
    lignes.push('💫 Le groupe est vaincu… Chacun se réveille à l’auberge (−10 % de ses po).');
    cb.equipe.forEach((j) => {
      recompenses[j.bid] = {
        xp: 0, po: 0, objets: {}, defaite: true,
        potionsConsommees: (cb.consosDistantes && cb.consosDistantes[j.bid]) || {},
        hpFinal: Math.max(1, Math.round(j.maxHp * 0.5)), mpFinal: Math.round(j.maxMp * 0.5),
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
  if (recompense.bossVaincu && !p.bossVaincus.includes(recompense.bossVaincu)) {
    p.bossVaincus.push(recompense.bossVaincu);
  }
  p.po += recompense.po || 0;
  if (recompense.defaite) p.po = Math.max(0, p.po - Math.round(p.po * 0.1));
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
  cb.equipe = (recu.equipe || []).map((j) => ({
    ...j, type: 'joueur', id: j.bid,
    inventaire: (j.potions || []).map((e) => ({ ...e })),
  }));
  cb.actif = cb.equipe.find((j) => j.bid === recu.enAttenteDe) || null;

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
