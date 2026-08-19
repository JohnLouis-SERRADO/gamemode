'use strict';

// =====================================================================
// Expéditions multi-écrans : chaque joueur sur son propre appareil.
// Le chef du groupe héberge la simulation de combat (moteur local) et
// publie l'état après chaque tour ; les membres affichent l'état reçu
// et envoient leur action quand c'est leur tour.
// =====================================================================

let minuterieLobby = null;
let minuterieCombatDistant = null;
let minuterieVeilleGroupe = null;

// v20 : le groupe survit à un rechargement de page. Sans ça, le seul moyen
// de rafraîchir un héros était de recharger — ce qui faisait perdre le
// groupe et obligeait à en recréer un.
const CLE_STOCKAGE_GROUPE = 'gamemode2.groupe';

function arreterSondagesGroupe() {
  if (minuterieLobby) { clearInterval(minuterieLobby); minuterieLobby = null; }
  if (minuterieCombatDistant) { clearInterval(minuterieCombatDistant); minuterieCombatDistant = null; }
  if (minuterieVeilleGroupe) { clearInterval(minuterieVeilleGroupe); minuterieVeilleGroupe = null; }
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
//
// v20 : cet instantané est REJOUÉ en continu (voir pousserSnapshotGroupe).
// Les maximums sont recalculés ici plutôt que lus tels quels : équiper une
// arme ou monter de niveau change maxHp/maxMp, et le salon doit le voir.
function snapshotPourGroupe(p) {
  const maxHp = maxHpDe(p);
  const maxMp = maxMpDe(p);
  return {
    id: p.cloud.id,
    nom: p.nom,
    avatar: p.avatar,
    race: p.race || 'humain',
    classe: p.classe || 'aventurier',
    // v20 : la spécialité voyage avec le héros — le passif de l'Invocateur
    // (deux créatures au lieu d'une) dépend de sa sous-classe.
    sousClasse: p.sousClasse || null,
    voie: p.voie || null,
    eveil: p.eveil && p.eveil.id ? { id: p.eveil.id } : null,
    niveau: p.niveau,
    statsEff: statsEffectives(p),
    maxHp,
    maxMp,
    hp: Math.max(0, Math.min(maxHp, Math.round(p.hp))),
    mp: Math.max(0, Math.min(maxMp, Math.round(p.mp))),
    competences: p.competences,
    rangs: p.rangs || {},
    bossVaincus: p.bossVaincus,
    familiers: p.familiers,
    // v16 : la progression qui ouvre les expéditions de groupe.
    tourMax: p.tourMax || 0,
    tourBoss: p.tourBoss || { normal: 0, heroique: 0, cauchemar: 0 },
    donjonsDebloques: typeof donjonsDebloquesPour === 'function' ? donjonsDebloquesPour(p) : [],
    // v16.2 : l'Ascension éternelle en groupe — épopées terminées + records.
    epopeesFinies: DONJONS.filter((d) => !d.chronique && progresDonjon(p, d.id).fini > 0).map((d) => d.id),
    ascensions: p.ascensions || {},
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
    sousClasse: m.sousClasse || null, voie: m.voie || null, eveil: m.eveil || null,
    stats: {
      for: m.statsEff.for, int: m.statsEff.int, dex: m.statsEff.dex,
      esp: m.statsEff.esp || 0, vit: m.statsEff.vit, cha: m.statsEff.cha || 0,
    },
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
// v20 : le héros vit, le salon suit.
//
// Avant, l'instantané n'était envoyé qu'une fois — à la création ou à
// l'arrivée. Passer à l'auberge, gagner un niveau, apprendre une
// compétence ou changer d'équipement ne changeait rien pour les autres :
// le chef lançait l'expédition avec des héros figés. On ne pouvait s'en
// sortir qu'en rechargeant la page… ce qui faisait perdre le groupe.
//
// Désormais l'instantané est republié dès qu'il change, tant qu'on est
// au salon. La signature évite de bombarder le serveur pour rien.
// =====================================================================
async function pousserSnapshotGroupe(force) {
  const groupe = etat.groupeLigne;
  const p = persoActif();
  if (!groupe || !p || !p.cloud || !etat.enLigne) return false;
  const snapshot = snapshotPourGroupe(p);
  const signature = JSON.stringify(snapshot);
  if (!force && signature === groupe.signatureSnapshot) return false;
  const ok = await apiRequete('/rest/v1/rpc/groupe_maj_snapshot', {
    methode: 'POST',
    corps: {
      p_id: p.cloud.id, p_token: p.cloud.token,
      p_groupe: groupe.id, p_snapshot: snapshot,
    },
  }).catch(() => null);
  // Un refus (expédition déjà lancée, ancien serveur) ne mémorise rien :
  // le prochain battement réessaiera.
  if (ok === true) groupe.signatureSnapshot = signature;
  return ok === true;
}

// --- Mémoire du groupe (survit au rechargement de page) ---------------
function memoriserGroupeLigne() {
  try {
    const groupe = etat.groupeLigne;
    const p = persoActif();
    if (groupe && p) {
      localStorage.setItem(CLE_STOCKAGE_GROUPE, JSON.stringify({
        id: groupe.id, code: groupe.code, heros: p.id,
      }));
    } else {
      localStorage.removeItem(CLE_STOCKAGE_GROUPE);
    }
  } catch (e) { /* stockage indisponible : le groupe vit en mémoire */ }
}

function oublierGroupeLigne() {
  arreterSondagesGroupe();
  etat.groupeLigne = null;
  memoriserGroupeLigne();
}

function estMembreDuGroupe(ligne, p) {
  return !!(ligne && p && p.cloud
    && (ligne.membres || []).some((m) => m.id === p.cloud.id));
}

// Au démarrage : si le héros était dans un groupe encore vivant, on le
// retrouve. Recharger la page ne coûte donc plus le groupe.
async function restaurerGroupeLigne() {
  if (etat.groupeLigne || !etat.enLigne) return;
  let memo = null;
  try { memo = JSON.parse(localStorage.getItem(CLE_STOCKAGE_GROUPE) || 'null'); } catch (e) { memo = null; }
  if (!memo || !memo.id) return;
  const p = persoActif();
  if (!p || !p.cloud || (memo.heros && memo.heros !== p.id)) return;
  const ligne = await lireGroupe(memo.id);
  if (!ligne || ligne.statut === 'clos' || !estMembreDuGroupe(ligne, p)) {
    try { localStorage.removeItem(CLE_STOCKAGE_GROUPE); } catch (e) { /* rien à oublier */ }
    return;
  }
  etat.groupeLigne = {
    id: ligne.id, code: ligne.code, chef: ligne.chef_id === p.cloud.id,
    zoneChoisie: ligne.zone_id || ZONES[0].id,
    difficulteChoisie: ligne.difficulte || 'normal',
    genreChoisi: ligne.genre || 'exploration',
    seqTraite: 0, signatureLobby: '', signatureSnapshot: '',
  };
  memoriserGroupeLigne();
  // Un chef qui recharge en pleine expédition emporte la simulation avec
  // lui : le groupe resterait bloqué en « aventure », impossible à
  // relancer. On le ramène au salon, tout le monde s'y retrouve.
  if (ligne.statut === 'aventure' && etat.groupeLigne.chef) {
    await apiRequete('/rest/v1/rpc/groupe_publier', {
      methode: 'POST',
      corps: {
        p_id: p.cloud.id, p_token: p.cloud.token, p_groupe: ligne.id,
        p_etat: null, p_seq_traite: Number.MAX_SAFE_INTEGER, p_statut: 'lobby',
      },
    }).catch(() => {});
  }
  afficherToast(`↩️ Votre groupe ${ligne.code} vous attend — Taverne › « Retrouver mon groupe ».`);
  demarrerVeilleGroupe();
}

// =====================================================================
// v16.3 : la progression du CHEF ouvre les expéditions — aucune limite
// imposée par les autres membres, aucun bridage de puissance. Le chef
// choisit, tout le monde grimpe, et le record de CHACUN progresse.
// =====================================================================
function etagesTourBossDuChef(p) {
  const dispo = ['normal'];
  const records = p.tourBoss || { normal: 0, heroique: 0, cauchemar: 0 };
  if (records.normal >= 3) dispo.push('heroique');
  if (records.heroique >= 3) dispo.push('cauchemar');
  return dispo;
}

function epopeesFiniesDuChef(p) {
  return DONJONS.filter((d) => !d.chronique && progresDonjon(p, d.id).fini > 0).map((d) => d.id);
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
    seqTraite: 0, signatureLobby: '', signatureSnapshot: '',
  };
  memoriserGroupeLigne();
  ouvrirLobbyGroupe();
}

async function rejoindreGroupeLigne(code) {
  const p = await preparerHerosPourGroupe();
  if (!p) return;
  // Contrainte cachée du corps à corps : il chasse seul, définitivement.
  if (reglagePassif(p, 'groupeInterdit', false)) {
    afficherToast('🚫 Votre Éveil vous interdit de rejoindre une expédition : vous chassez seul.');
    return;
  }
  const resultat = await apiRequete('/rest/v1/rpc/groupe_rejoindre', {
    methode: 'POST',
    corps: { p_id: p.cloud.id, p_token: p.cloud.token, p_code: code, p_snapshot: snapshotPourGroupe(p) },
  }).catch(() => null);
  if (!resultat || resultat.erreur || !resultat.groupe_id) {
    afficherToast(resultat && resultat.erreur ? `❌ ${resultat.erreur}` : 'Impossible de rejoindre ce groupe.');
    return;
  }
  etat.groupeLigne = {
    id: resultat.groupe_id, code: resultat.code, chef: false,
    seqTraite: 0, signatureLobby: '', signatureSnapshot: '',
  };
  memoriserGroupeLigne();
  ouvrirLobbyGroupe();
}

async function quitterGroupeLigne() {
  const p = persoActif();
  const groupe = etat.groupeLigne;
  oublierGroupeLigne();
  if (groupe && p && p.cloud) {
    // Un départ perdu par le réseau laissait un fantôme dans le groupe —
    // que le chef attendait 60 s par manche. On retente une fois.
    const partir = () => apiRequete('/rest/v1/rpc/groupe_quitter', {
      methode: 'POST',
      corps: { p_id: p.cloud.id, p_token: p.cloud.token, p_groupe: groupe.id },
    });
    partir().catch(() => { setTimeout(() => { partir().catch(() => {}); }, 5000); });
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
      // Le joueur a navigué ailleurs (auberge, boutique, temple…) : le
      // salon passe en veille — il continue de publier l'état du héros et
      // de guetter le départ de l'expédition. v20 : plus besoin de rester
      // planté devant l'écran du groupe pour aller se soigner.
      demarrerVeilleGroupe();
      return;
    }
    // On publie AVANT de lire : la liste affichée contient déjà nos
    // propres PV/PM/niveau à jour.
    await pousserSnapshotGroupe();
    const ligne = await lireGroupe(groupe.id);
    if (!ligne || ligne.statut === 'clos') {
      afficherToast('Le groupe a été dissous.');
      oublierGroupeLigne();
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

// =====================================================================
// v20 : la veille de groupe — le groupe vit même quand on regarde
// ailleurs. Le héros peut filer à l'auberge, à la boutique ou au temple :
// son instantané continue de partir, et si le chef lance l'expédition,
// son écran le rejoint tout seul.
// =====================================================================
function demarrerVeilleGroupe() {
  arreterSondagesGroupe();
  if (!etat.groupeLigne) return;
  const tick = async () => {
    const groupe = etat.groupeLigne;
    if (!groupe) { arreterSondagesGroupe(); return; }
    const p = persoActif();
    const ligne = await lireGroupe(groupe.id);
    if (!ligne || ligne.statut === 'clos') {
      oublierGroupeLigne();
      afficherToast('Le groupe a été dissous.');
      return;
    }
    // Exclu par le chef, ou héros changé entre-temps : on oublie sans bruit.
    if (!estMembreDuGroupe(ligne, p)) { oublierGroupeLigne(); return; }
    if (ligne.statut === 'aventure' && !groupe.chef) {
      // On ne détourne ni un combat en cours ni l'écran-titre : la place
      // reste tenue, le chef patiente 60 s avant de mettre en garde.
      if (!combatEnCours() && !el('ecran-titre').classList.contains('actif')) {
        demarrerSuiviCombatDistant();
      }
      return;
    }
    if (ligne.statut === 'lobby') {
      // Le dénouement a pu se jouer PENDANT que ce héros regardait
      // ailleurs : sa part (récompense… ou mort du groupe) l'attend dans
      // le résultat publié — sinon son état divergeait de tous les autres
      // écrans, jusqu'à esquiver la mort commune.
      const resultat = ligne.etat && ligne.etat.resultat;
      if (resultat && resultat.jeton && groupe.dernierResultat !== resultat.jeton
        && p && p.cloud && resultat.recompenses && resultat.recompenses[p.cloud.id]
        && !combatEnCours()) {
        groupe.dernierResultat = resultat.jeton;
        memoriserGroupeLigne();
        appliquerRecompenseGroupe(p, resultat.recompenses[p.cloud.id]);
        if (!resultat.recompenses[p.cloud.id].defaite) {
          afficherToast(`${resultat.titre} — votre part de l'expédition vous a été remise.`);
        }
      }
      await pousserSnapshotGroupe();
    }
  };
  tick();
  minuterieVeilleGroupe = setInterval(tick, 3000);
}

function rendreLobbyGroupe(ligne) {
  const groupe = etat.groupeLigne;
  const p = persoActif();
  // Ne re-rend que si quelque chose a changé (préserve les sélecteurs).
  // v20 : PV, PM et compétences entrent dans la signature — sortir de
  // l'auberge doit se VOIR sur l'écran de tout le monde.
  const signature = JSON.stringify([ligne.statut, ligne.membres.map(
    (m) => [m.nom, m.niveau, m.hp, m.maxHp, m.mp, m.maxMp, (m.competences || []).length])]);
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
    // La forme réelle de chacun, en direct : on voit son compagnon
    // remonter ses PV à l'auberge sans quitter le salon.
    chip.textContent = `${m.avatar || '⚔️'} ${m.nom} (niv. ${m.niveau})${m.id === ligne.chef_id ? ' 👑' : ''}`
      + ` · ❤️ ${m.hp}/${m.maxHp} · 💙 ${m.mp}/${m.maxMp}`;
    chips.appendChild(chip);
  });
  panneauMembres.appendChild(chips);
  const aideFraicheur = document.createElement('p');
  aideFraicheur.className = 'aide';
  aideFraicheur.textContent = '🔄 Chaque héros est publié en direct : auberge, niveaux, compétences et '
    + 'équipement arrivent ici tout seuls — inutile de recharger la page.';
  panneauMembres.appendChild(aideFraicheur);
  zone.appendChild(panneauMembres);

  if (groupe.chef) {
    const panneauLancement = document.createElement('div');
    panneauLancement.className = 'panneau';
    panneauLancement.innerHTML = '<h3>🗺️ Préparer l’expédition</h3>';

    const ligneChoix = document.createElement('div');
    ligneChoix.className = 'rangee-boutons';

    // v16 : six genres d'expédition — zones, tours et donjons, ouverts par
    // la progression du CHEF (v16.3 : plus aucune limite des membres).
    const selectGenre = document.createElement('select');
    selectGenre.className = 'select-groupe';
    [['exploration', '🗡️ Explorer une zone'], ['boss', '👑 Boss de zone'],
      ['tour', `🗼 Tour Sans Fin — étage ${(p.tourMax || 0) + 1}`],
      ['tourBoss', `🏯 Tour des Boss`],
      ['assautDonjon', '🏰 Assaut de donjon (boss final)'],
      ['ascension', '⛰️ Ascension éternelle (épopées, étages infinis)']].forEach(([valeur, libelle]) => {
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
    const difficultesBoss = etagesTourBossDuChef(p);
    Object.entries(DIFFICULTES).forEach(([cle, d]) => {
      const option = document.createElement('option');
      option.value = cle;
      option.textContent = `${d.emoji} ${d.nom}`;
      if (groupe.difficulteChoisie === cle) option.selected = true;
      selectDifficulte.appendChild(option);
    });
    selectDifficulte.addEventListener('change', () => { groupe.difficulteChoisie = selectDifficulte.value; });

    // Les donjons dont le CHEF a ouvert les portes.
    const communs = typeof donjonsDebloquesPour === 'function' ? donjonsDebloquesPour(p) : [];
    const selectDonjon = document.createElement('select');
    selectDonjon.className = 'select-groupe';
    if (communs.length === 0) {
      const option = document.createElement('option');
      option.textContent = '🔒 Aucun donjon débloqué par le chef';
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

    // v16.2 : les épopées dont le CHEF a écrit la fin — l'Ascension
    // éternelle s'ouvre à elles, à l'étage de SON record.
    const epopeesCommunes = epopeesFiniesDuChef(p);
    const selectEpopee = document.createElement('select');
    selectEpopee.className = 'select-groupe';
    if (epopeesCommunes.length === 0) {
      const option = document.createElement('option');
      option.textContent = '🔒 Aucune épopée terminée par le chef';
      option.disabled = true;
      option.selected = true;
      selectEpopee.appendChild(option);
    } else {
      epopeesCommunes.forEach((id) => {
        const d = DONJONS_PAR_ID[id];
        if (!d) return;
        const option = document.createElement('option');
        option.value = id;
        option.textContent = `${d.emoji} ${d.nom} — étage ${recordAscension(p, id) + 1}`;
        if (groupe.epopeeChoisie === id) option.selected = true;
        selectEpopee.appendChild(option);
      });
    }

    const aideGenre = document.createElement('p');
    aideGenre.className = 'aide';
    const majVisibilite = () => {
      const genre = groupe.genreChoisi;
      selectZone.classList.toggle('cache', genre !== 'exploration' && genre !== 'boss');
      selectDifficulte.classList.toggle('cache', genre !== 'exploration' && genre !== 'boss' && genre !== 'tourBoss');
      selectDonjon.classList.toggle('cache', genre !== 'assautDonjon');
      selectEpopee.classList.toggle('cache', genre !== 'ascension');
      if (genre === 'tour') {
        aideGenre.textContent = `🗼 L'équipe grimpe l'étage ${(p.tourMax || 0) + 1} — la Tour telle que le chef l'a gravée, chacun à pleine puissance. Victoire = le record de chacun progresse.`;
      } else if (genre === 'tourBoss') {
        aideGenre.textContent = `🏯 Étage ${((p.tourBoss || {})[groupe.difficulteChoisie] || 0) + 1} — difficultés ouvertes par le chef : ${difficultesBoss.map((d) => DIFFICULTES[d].nom).join(', ')}.`;
      } else if (genre === 'assautDonjon') {
        aideGenre.textContent = communs.length
          ? '🏰 Affrontez ensemble le boss final d’un donjon débloqué par le chef (l’histoire, elle, se vit en solo).'
          : '🏰 Le chef n’a encore débloqué aucun donjon — à lui de progresser dans ses histoires !';
      } else if (genre === 'ascension') {
        aideGenre.textContent = epopeesCommunes.length
          ? '⛰️ Des étages SANS FIN, enchaînés sans soin ni retour au salon : écho du boss tous les 5 étages, épreuve au d20 tous les 3 — le meilleur de l\'équipe s\'y colle. On grimpe jusqu\'à la MORT ou l\'abandon, et le record de chacun progresse à chaque étage.'
          : '⛰️ L\'Ascension éternelle s\'ouvre dès que le chef a TERMINÉ une épopée.';
      } else {
        aideGenre.textContent = '⚔️ Chacun combat à PLEINE puissance — mais attention : la défaite d\'une expédition de groupe est MORTELLE (vraie mort, comme en solo).';
      }
    };
    selectGenre.addEventListener('change', () => { groupe.genreChoisi = selectGenre.value; majVisibilite(); });
    selectDifficulte.addEventListener('change', majVisibilite);
    selectEpopee.addEventListener('change', () => { groupe.epopeeChoisie = selectEpopee.value; });
    majVisibilite();

    ligneChoix.appendChild(selectGenre);
    ligneChoix.appendChild(selectZone);
    ligneChoix.appendChild(selectDifficulte);
    ligneChoix.appendChild(selectDonjon);
    ligneChoix.appendChild(selectEpopee);
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
    const etage = (p.tourMax || 0) + 1;
    const z = zonePourEtage(etage);
    const multTour = 1 + etage * 0.06;
    const cles = etage % 5 === 0 ? [z.boss] : composerPack(z, tailleDuPack(membres));
    defs = cles.map((cle) => ({
      ...MONSTRES[cle], cle,
      hp: Math.round(MONSTRES[cle].hp * multTour),
      atk: Math.round(MONSTRES[cle].atk * multTour),
    }));
    // Le même genre que le solo : « exploration » supprimait silencieusement
    // tout le butin de matériaux (et autorisait la fuite dans la Tour).
    genreCombat = 'tour';
    zoneCombat = z;
    difficulte = 'normal';
    titre = `🗼 Tour Sans Fin — Étage ${etage} (groupe)`;
    intro = `L'équipe grimpe l'étage ${etage} — la Tour telle que le chef l'a gravée. Victoire = le record de chacun progresse !`;
    groupeExtra = { tourEtage: etage };
  } else if (genre === 'tourBoss') {
    if (p.niveau < 10) {
      afficherToast('🏯 La Tour des Boss s’ouvre au niveau 10 (le chef).');
      return;
    }
    const dispo = etagesTourBossDuChef(p);
    if (!dispo.includes(difficulte)) difficulte = dispo[dispo.length - 1];
    const etage = ((p.tourBoss || {})[difficulte] || 0) + 1;
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
    genreCombat = 'tourBoss'; // comme en solo : les boss de tour gardent leur butin
    zoneCombat = null;
    titre = `🏯 Tour des Boss — Étage ${etage} (groupe)`;
    intro = `${defs[0].nom} garde l'étage ${etage}. L'équipe grimpe depuis le record du chef.`;
    groupeExtra = { tourBoss: { etage, difficulte } };
  } else if (genre === 'assautDonjon') {
    const communs = typeof donjonsDebloquesPour === 'function' ? donjonsDebloquesPour(p) : [];
    const idDonjon = communs.includes(groupe.donjonChoisi) ? groupe.donjonChoisi : communs[0];
    const donjon = idDonjon ? DONJONS_PAR_ID[idDonjon] : null;
    if (!donjon) {
      afficherToast('🏰 Le chef n’a encore débloqué aucun donjon.');
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
    genreCombat = 'donjon'; // comme en solo : le boss d'un donjon garde son butin
    zoneCombat = null;
    difficulte = 'normal';
    titre = `🏰 ${donjon.emoji} ${donjon.nom} — l'assaut du boss`;
    intro = boss.intro || 'Le maître du donjon vous attend de pied ferme.';
    groupeExtra = { assautDonjon: donjon.id };
  } else if (genre === 'ascension') {
    // v16.2 : l'Ascension éternelle en groupe — délégué à la fonction
    // d'étage, qui sait aussi enchaîner sans repasser par le salon.
    const communes = epopeesFiniesDuChef(p);
    const idEpopee = communes.includes(groupe.epopeeChoisie) ? groupe.epopeeChoisie : communes[0];
    if (!idEpopee || !DONJONS_PAR_ID[idEpopee]) {
      afficherToast('⛰️ L’Ascension s’ouvre dès que le chef a terminé une épopée.');
      return;
    }
    lancerEtageAscensionGroupe(idEpopee, recordAscension(p, idEpopee) + 1, null);
    return;
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
  // La lecture vient APRÈS groupe_lancer : le groupe n'est plus au salon,
  // plus aucun instantané ne peut atterrir — ce qu'on lit est définitif,
  // et c'est bien la dernière version publiée par chacun (auberge comprise).
  let groupeFrais = null;
  for (let essai = 0; essai < 3 && !groupeFrais; essai++) {
    groupeFrais = await lireGroupe(groupe.id);
    if (!groupeFrais) await attendre(1200);
  }
  if (!groupeFrais) {
    // lireGroupe renvoie null sur une erreur réseau : lire `.membres`
    // dessus crashait le chef et laissait les membres attendre à jamais.
    afficherToast('📡 Le monde n’a pas répondu — retour au salon, relancez l’expédition.');
    ouvrirLobbyGroupe();
    return;
  }
  const membresFrais = groupeFrais.membres;
  const equipe = membresFrais.map((m) => {
    if (m.id === p.cloud.id) { p.bid = p.cloud.id; return p; }
    return creerJoueurDistant(m);
  });
  // v16.3 : chacun combat à pleine puissance — aucun bridage de groupe.
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
  });
}

// =====================================================================
// v16.2 : un étage d'Ascension éternelle en groupe. Sait démarrer depuis
// le salon (équipe fraîche) ET enchaîner les étages (équipe conservée :
// pas de soin entre les salles, c'est la règle de l'Ascension).
// =====================================================================
async function lancerEtageAscensionGroupe(idDonjon, etage, equipePrecedente) {
  const groupe = etat.groupeLigne;
  const p = persoActif();
  const donjon = DONJONS_PAR_ID[idDonjon];
  if (!groupe || !donjon) { afficherToast('⛰️ Le groupe s’est dissous.'); return; }

  const ok = await apiRequete('/rest/v1/rpc/groupe_lancer', {
    methode: 'POST',
    corps: {
      p_id: p.cloud.id, p_token: p.cloud.token, p_groupe: groupe.id,
      p_zone: ZONES[0].id, p_difficulte: 'normal', p_genre: 'ascension',
    },
  }).catch(() => null);
  if (!ok) { afficherToast('Lancement impossible.'); return; }
  arreterSondagesGroupe();
  groupe.seqTraite = 0;

  let groupeFrais = null;
  for (let essai = 0; essai < 3 && !groupeFrais; essai++) {
    groupeFrais = await lireGroupe(groupe.id);
    if (!groupeFrais) await attendre(1200);
  }
  if (!groupeFrais) {
    afficherToast('📡 Le monde n’a pas répondu — retour au salon, relancez l’Ascension.');
    ouvrirLobbyGroupe();
    return;
  }
  const membresFrais = groupeFrais.membres;
  // L'équipe : conservée d'un étage à l'autre (PV compris), en écartant
  // ceux qui ont quitté le groupe entre-temps.
  let equipe = (equipePrecedente || [])
    .filter((j) => j.type === 'joueur' && membresFrais.some((m) => m.id === j.bid));
  if (equipe.length === 0) {
    equipe = membresFrais.map((m) => {
      if (m.id === p.cloud.id) { p.bid = p.cloud.id; return p; }
      return creerJoueurDistant(m);
    });
  }
  equipe.forEach((j) => { if (j.hp <= 0) j.hp = 1; });

  const multEquipe = 1 + 0.35 * (equipe.length - 1);
  const multAtkEquipe = 1 + 0.1 * (equipe.length - 1);
  const croissanceHp = 1 + 0.15 * (etage - 1);
  const croissanceAtk = 1 + 0.06 * (etage - 1);

  let defs;
  let intro;
  if (etage % 5 === 0) {
    const cleBoss = bossDeLEpopee(donjon);
    const base = defMonstreDonjon(cleBoss);
    defs = [{
      ...base,
      cle: cleBoss,
      nom: `Écho de ${base.nom}`,
      hp: Math.round(base.hp * croissanceHp * multEquipe),
      atk: Math.round(base.atk * croissanceAtk * multAtkEquipe),
      xp: Math.round(base.xp * (0.5 + etage * 0.05)),
    }];
    intro = `⛰️ Étage ${etage} — le donjon reforme l'écho de son maître, plus dense à chaque cycle.`;
  } else {
    const pool = monstresDeLEpopee(donjon);
    const nb = Math.min(4, 2 + Math.floor(etage / 6));
    defs = Array.from({ length: nb }, () => {
      const cle = pool[alea(0, pool.length - 1)];
      const base = defMonstreDonjon(cle);
      return {
        ...base,
        cle,
        hp: Math.round(base.hp * croissanceHp * multEquipe),
        atk: Math.round(base.atk * croissanceAtk * multAtkEquipe),
      };
    });
    intro = `⛰️ Étage ${etage} — le donjon rebat ses cartes et vous oppose une salle nouvelle.`;
  }

  demarrerCombat({
    // « ascension » : hors des genres de carte, donc le butin de matériaux
    // tombe — et hors des genres fuyables, donc on grimpe jusqu'à la mort
    // ou l'abandon, la règle de l'Ascension.
    genre: 'ascension',
    zone: null,
    difficulte: 'normal',
    titre: `⛰️ ${donjon.nom} — Ascension, étage ${etage} (groupe)`,
    intro,
    monstresDef: defs,
    equipe,
    groupe: { id: groupe.id, hote: true, seqTraite: 0 },
    groupeExtra: { ascension: { id: donjon.id, etage } },
  });

  // Tous les 3 étages (hors paliers de boss), le donjon éprouve l'équipe
  // AVANT le combat : le plus doué s'y colle, le sort de tous en dépend.
  if (etage % 5 !== 0 && etage % 3 === 0) {
    const cb = etat.combat;
    const statsPossibles = ['for', 'int', 'dex', 'vit', 'cha'];
    const stat = statsPossibles[Math.floor(etage / 3) % statsPossibles.length];
    const difficulteJet = 12 + Math.round(donjon.niveauMin * 0.6) + etage;
    let champion = equipe[0];
    equipe.forEach((j) => { if (statDe(j, stat) > statDe(champion, stat)) champion = j; });
    const bonus = statDe(champion, stat);
    const de = alea(1, 20);
    const total = de + bonus;
    const reussite = de === 20 || (de !== 1 && total >= difficulteJet);
    const nomStat = CARACS[stat].nom;
    journal(`🎲 Le donjon vous éprouve — épreuve ${/^[aeioué]/i.test(nomStat) ? `d’${nomStat}` : `de ${nomStat}`} (difficulté ${difficulteJet}) : ${champion.nom} s'y colle. ${de}${de === 20 ? ' 🌟 NATUREL' : de === 1 ? ' 💀 naturel' : ''} + ${bonus} = ${total} — ${reussite ? '✅ Réussite !' : '❌ Échec…'}`);
    cb.equipe.forEach((j) => {
      if (reussite) {
        j.hp = Math.min(j.maxHp, j.hp + Math.round(j.maxHp * 0.12));
        j.mp = Math.min(j.maxMp, j.mp + Math.round(j.maxMp * 0.15));
      } else {
        j.hp = Math.max(1, j.hp - Math.round(j.maxHp * 0.15));
      }
    });
    journal(reussite
      ? '✨ Une alcôve s\'ouvre dans la pierre : l\'équipe souffle (+12 % PV, +15 % PM) avant que la salle ne se referme en arène.'
      : '💢 Le donjon vous secoue comme un sablier (−15 % PV) — et il n\'en a pas fini avec vous.');
  }
  rendreCombat();
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
      statsEff: j.type === 'invocation' ? j.stats : statsEffectives(j),
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
  zone.innerHTML = `<div class="actions-entete"><span class="avatar-grand">${echapper(c.avatar)}</span>
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
    // v22 : « pas assez de mana » ne suffit plus à refuser un sort — le
    // Chevalier Noir a le droit de le payer en sang, ici comme en solo.
    if (!comp || !j.competences.includes(action.compId)
      || (j.cooldowns[action.compId] || 0) > 0
      || !peutPayerSort(j, coutMpDe(comp, statsEffectives(j), j.maxMp))) {
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

  // 'rejouer' (le pas gratuit de la Danselame) ne peut pas rendre la main
  // à un écran distant au milieu du tour du chef : le bonus du pas est
  // conservé, le tour est consommé. C'est la seule différence en groupe.
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
    // Les tours paient leur prime d'étage, comme en solo ; l'Ascension
    // verse sa prime d'or (12 po par étage, la règle du solo).
    const multEtage = extra.tourEtage ? 1 + extra.tourEtage * 0.12
      : (extra.tourBoss ? 1 + extra.tourBoss.etage * 0.15 : 1);
    const bonusPoAscension = extra.ascension ? extra.ascension.etage * 12 : 0;
    const xpParHeros = Math.max(1, Math.round((butin.xp * multEtage / partage) * bonusGroupe));
    const poParHeros = Math.max(0, Math.round((butin.po * multEtage + bonusPoAscension) / partage));
    lignes.push(`⭐ ${texteGainXp(cb.equipe, xpParHeros)} par héros`);
    lignes.push(`💰 +${formatNombre(poParHeros)} pièces d'or par héros`);
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
      if (extra.ascension) recompenses[j.bid].ascension = extra.ascension;
    });
    if (extra.tourEtage) lignes.push(`🗼 Étage ${extra.tourEtage} gravé ensemble : le record de chacun progresse !`);
    if (extra.tourBoss) lignes.push(`🏯 Étage ${extra.tourBoss.etage} (${DIFFICULTES[extra.tourBoss.difficulte].nom}) vaincu ensemble : record pour chacun !`);
    if (extra.assautDonjon && DONJONS_PAR_ID[extra.assautDonjon]) {
      lignes.push(`🏰 Le boss de « ${DONJONS_PAR_ID[extra.assautDonjon].nom} » est tombé sous l'assaut du groupe !`);
    }
    if (extra.ascension) lignes.push(`⛰️ Étage ${extra.ascension.etage} conquis ensemble — le donjon reconstruit déjà le suivant, un peu plus haut, un peu plus dur.`);
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
  // Le jeton identifie CE résultat : un membre absent au dénouement le
  // retrouve à sa prochaine veille, et personne ne l'applique deux fois.
  const jeton = `${cb.groupe.id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  cb.resultatGroupe = { type, titre: titres[type], lignes, recompenses, jeton };
  publierEtatGroupe(cb, 'lobby');

  const maRecompense = recompenses[p.cloud.id];
  appliquerRecompenseGroupe(p, maRecompense);
  // v16.2 : en Ascension, le chef enchaîne les étages sans repasser par
  // le salon — les autres écrans suivent automatiquement.
  const equipeConservee = cb.equipe;
  const boutons = (type === 'victoire' && extra.ascension)
    ? [{
      texte: `⬆️ Étage ${extra.ascension.etage + 1} (groupe) ➜`,
      classe: 'btn-principal',
      action: () => lancerEtageAscensionGroupe(extra.ascension.id, extra.ascension.etage + 1, equipeConservee),
    }]
    : undefined;
  afficherButin({
    titre: type === 'victoire' && extra.ascension ? `⛰️ Étage ${extra.ascension.etage} conquis !` : titres[type],
    texte: partage > 1 ? 'Chaque écran reçoit sa part.' : '',
    lignes: lignes.concat(maRecompense && maRecompense.lignesCoffre ? maRecompense.lignesCoffre : []),
    retour: 'groupe-ligne',
    boutons,
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
  // v26 : elles versent aussi leurs Sceaux — « monter n'importe quel
  // escalier finance la Tour de l'Éveil », en groupe comme en solo.
  if (recompense.tourEtage) {
    if (p.tourMax < recompense.tourEtage) p.tourMax = recompense.tourEtage;
    progresserQuete(p, 'tour', 1);
    if (p.niveau >= NIVEAU_TOUR_EVEIL && typeof gagnerSceaux === 'function') {
      const gain = gagnerSceaux(p, recompense.tourEtage);
      if (gain.normaux > 0) afficherToast(`🔹 +${gain.normaux} Sceau${gain.normaux > 1 ? 'x' : ''}${gain.majeurs > 0 ? ' et 💠 1 Sceau Majeur' : ''} (Tour en groupe).`);
    }
    if (typeof franchirPalierDeSauvegarde === 'function') {
      franchirPalierDeSauvegarde(p, 'tour', recompense.tourEtage);
    }
  }
  if (recompense.tourBoss && p.tourBoss) {
    const { etage, difficulte } = recompense.tourBoss;
    if ((p.tourBoss[difficulte] || 0) < etage) p.tourBoss[difficulte] = etage;
    progresserQuete(p, 'tourBoss', 1);
    if (p.niveau >= NIVEAU_TOUR_EVEIL && typeof gagnerSceaux === 'function') {
      const gain = gagnerSceaux(p, etage);
      if (gain.normaux > 0) afficherToast(`🔹 +${gain.normaux} Sceau${gain.normaux > 1 ? 'x' : ''}${gain.majeurs > 0 ? ' et 💠 1 Sceau Majeur' : ''} (Tour des Boss en groupe).`);
    }
    if (typeof franchirPalierDeSauvegarde === 'function') {
      franchirPalierDeSauvegarde(p, `tourBoss:${difficulte}`, etage);
    }
  }
  // v16.2 : chaque étage d'Ascension conquis en groupe grave le record.
  if (recompense.ascension) {
    if (!p.ascensions || typeof p.ascensions !== 'object') p.ascensions = {};
    if (recompense.ascension.etage > (p.ascensions[recompense.ascension.id] || 0)) {
      p.ascensions[recompense.ascension.id] = recompense.ascension.etage;
    }
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
      etat.combat = null;
      oublierGroupeLigne();
      afficherToast('Le groupe a été dissous.');
      naviguer('taverne');
      return;
    }
    // La fraîcheur de la publication trahit un chef déconnecté — dit UNE
    // fois par épisode, pas à chaque tick de 1,3 s.
    if (ligne.statut === 'aventure' && Date.now() - new Date(ligne.maj).getTime() > 30000) {
      if (!groupe.alerteChefMuette) {
        groupe.alerteChefMuette = true;
        afficherToast('📡 Le chef semble déconnecté…');
      }
    } else {
      groupe.alerteChefMuette = false;
    }
    if (ligne.statut === 'lobby') {
      arreterSondagesGroupe();
      const resultat = ligne.etat && ligne.etat.resultat;
      etat.combat = null;
      const dejaApplique = resultat && resultat.jeton && groupe.dernierResultat === resultat.jeton;
      if (resultat && !dejaApplique) {
        const p = persoActif();
        if (resultat.jeton) {
          groupe.dernierResultat = resultat.jeton;
          memoriserGroupeLigne();
        }
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
      zone.innerHTML = `<div class="actions-entete"><span class="avatar-grand">${echapper(cb.actif.avatar)}</span>
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
