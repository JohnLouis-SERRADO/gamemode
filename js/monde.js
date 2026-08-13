'use strict';

// =====================================================================
// Le monde : carte, zones, exploration, récolte, boss de zone,
// récompenses de combat et écran de butin.
// =====================================================================

function formatNombre(n) {
  return Number(n).toLocaleString('fr-FR');
}

// =====================================================================
// Carte du monde
// =====================================================================
function rendreCarte() {
  const p = persoActif();
  if (!p) return;

  // Bandeau d'équipe
  const bandeau = el('carte-equipe');
  bandeau.innerHTML = '';
  const membres = membresEquipe();
  const libelle = document.createElement('span');
  libelle.className = 'equipe-libelle';
  libelle.textContent = membres.length > 1 ? 'Expédition :' : 'En solo :';
  bandeau.appendChild(libelle);
  membres.forEach((m) => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = `${m.avatar} ${m.nom} (niv. ${m.niveau})`;
    bandeau.appendChild(chip);
  });
  const modifier = document.createElement('button');
  modifier.className = 'btn-choix btn-compact';
  modifier.textContent = '👥 Modifier l’équipe';
  modifier.addEventListener('click', () => {
    if (!etat.equipe.includes(p.id)) etat.equipe = [p.id];
    rendreEquipe();
    montrerEcran('ecran-equipe');
  });
  bandeau.appendChild(modifier);

  // Zones
  const zone = el('carte-zones');
  zone.innerHTML = '';

  const ville = document.createElement('div');
  ville.className = 'carte-zone ville';
  ville.innerHTML = `
    <div class="zone-emoji">🏘️</div>
    <div class="zone-nom">Bourg de Valciel</div>
    <div class="zone-plage">refuge</div>
    <div class="zone-desc">Boutique, atelier, auberge et taverne. Aucun danger — promis.</div>`;
  rendreCliquable(ville, () => naviguer('ville'));
  zone.appendChild(ville);

  ZONES.forEach((z) => {
    const verrouillee = p.niveau < z.niveauMin;
    const carte = document.createElement('div');
    carte.className = 'carte-zone' + (verrouillee ? ' verrouillee' : '');
    const bossVaincu = p.bossVaincus.includes(z.id);
    carte.innerHTML = `
      <div class="zone-emoji">${z.emoji}</div>
      <div class="zone-nom">${z.nom} ${bossVaincu ? '🏆' : ''}</div>
      <div class="zone-plage">${z.plage}</div>
      <div class="zone-desc">${verrouillee ? `🔒 Atteignez le niveau ${z.niveauMin} pour entrer.` : z.desc}</div>`;
    if (!verrouillee) {
      rendreCliquable(carte, () => {
        etat.zoneCourante = z;
        rendreZone(z);
        montrerEcran('ecran-zone');
      });
    }
    zone.appendChild(carte);
  });
}

// =====================================================================
// Écran de zone
// =====================================================================
function rendreZone(z) {
  const p = persoActif();
  const explorations = p.explorations[z.id] || 0;
  const bossPret = explorations >= EXPLORATIONS_POUR_BOSS;
  const boss = MONSTRES[z.boss];

  el('zone-entete').innerHTML = `
    <div class="entete-lieu">
      <h2>${z.emoji} ${z.nom} <span class="badge">${z.plage}</span></h2>
      <button class="btn-choix btn-compact" id="zone-retour">🗺️ Carte</button>
    </div>
    <p class="sous-titre gauche">${z.desc}</p>`;
  el('zone-retour').addEventListener('click', () => naviguer('carte'));

  const actions = el('zone-actions-liste');
  actions.innerHTML = '';

  const explorer_ = document.createElement('button');
  explorer_.className = 'btn-action-zone';
  explorer_.innerHTML = `<span class="action-zone-emoji">🗡️</span><strong>Explorer</strong>
    <span class="action-zone-detail">Partir en quête de combats et de découvertes</span>`;
  explorer_.addEventListener('click', () => explorer(z));
  actions.appendChild(explorer_);

  const recolter_ = document.createElement('button');
  recolter_.className = 'btn-action-zone';
  recolter_.innerHTML = `<span class="action-zone-emoji">🌿</span><strong>Récolter</strong>
    <span class="action-zone-detail">Ramasser des matériaux d’artisanat (gare aux embuscades !)</span>`;
  recolter_.addEventListener('click', () => recolter(z));
  actions.appendChild(recolter_);

  const bossBtn = document.createElement('button');
  bossBtn.className = 'btn-action-zone boss';
  bossBtn.disabled = !bossPret;
  bossBtn.innerHTML = `<span class="action-zone-emoji">${boss.emoji}</span><strong>Défier ${boss.nom}</strong>
    <span class="action-zone-detail">${bossPret
      ? 'Le maître des lieux vous attend. Bonne chance.'
      : `Explorez encore ${EXPLORATIONS_POUR_BOSS - explorations} fois pour le débusquer.`}</span>`;
  bossBtn.addEventListener('click', () => affronterBoss(z));
  actions.appendChild(bossBtn);

  const infos = el('zone-infos');
  const chipsMonstres = z.monstres
    .map((cle) => `<span class="chip">${MONSTRES[cle].emoji} ${MONSTRES[cle].nom}</span>`)
    .join('');
  const chipsMateriaux = z.recolte
    .map((entree) => `<span class="chip">${OBJETS[entree.id].emoji} ${OBJETS[entree.id].nom}</span>`)
    .join('');
  infos.innerHTML = `
    <div class="panneau">
      <h3>🐾 Créatures de la zone</h3>
      <div class="rangee-chips">${chipsMonstres}
        <span class="chip chip-boss">${boss.emoji} ${boss.nom} (boss)</span></div>
      <h3>⛏️ Matériaux récoltables</h3>
      <div class="rangee-chips">${chipsMateriaux}</div>
      <p class="aide">Explorations dans cette zone : ${explorations}${p.bossVaincus.includes(z.id) ? ' · 🏆 boss déjà vaincu (il peut être défié à nouveau)' : ''}</p>
    </div>`;
}

// =====================================================================
// Actions de zone
// =====================================================================
function tailleDuPack(taille) {
  let nb = taille;
  if (Math.random() < 0.35) nb++;
  if (nb > 1 && Math.random() < 0.25) nb--;
  return Math.max(1, Math.min(4, nb));
}

// Compose un pack en limitant à un seul soigneur : deux soigneurs qui se
// relaient rendraient le combat ingagnable à l'usure.
function composerPack(z, nb) {
  const estSoigneur = (cle) => MONSTRES[cle].attaques.some((a) => a.type === 'soin');
  const sansSoin = z.monstres.filter((cle) => !estSoigneur(cle));
  const cles = [];
  let soigneurs = 0;
  for (let i = 0; i < nb; i++) {
    let cle = z.monstres[alea(0, z.monstres.length - 1)];
    if (estSoigneur(cle)) {
      if (soigneurs >= 1 && sansSoin.length > 0) cle = sansSoin[alea(0, sansSoin.length - 1)];
      else soigneurs++;
    }
    cles.push(cle);
  }
  return cles;
}

function explorer(z) {
  const p = persoActif();
  p.explorations[z.id] = (p.explorations[z.id] || 0) + 1;
  sauvegarder(p);

  const tirage = Math.random();
  if (tirage < 0.72) {
    const cles = composerPack(z, tailleDuPack(membresEquipe().length));
    demarrerCombatZone(z, 'exploration', cles);
  } else if (tirage < 0.9) {
    // Trouvaille
    const objets = {};
    z.recolte.forEach((entree) => {
      if (Math.random() < entree.chance * 0.8) objets[entree.id] = (objets[entree.id] || 0) + 1;
    });
    const po = alea(3, 6 + 3 * z.niveauMin);
    const lignes = [`💰 +${po} pièces d'or pour chaque héros`];
    membresEquipe().forEach((m) => {
      m.po += po;
      Object.entries(objets).forEach(([id, qte]) => ajouterObjet(m, id, qte));
      sauvegarder(m);
    });
    Object.entries(objets).forEach(([id, qte]) => lignes.push(`${OBJETS[id].emoji} ${OBJETS[id].nom} ×${qte}`));
    afficherButin({
      titre: '🎁 Une trouvaille !',
      texte: 'Au détour du chemin, un coffre abandonné et quelques ressources.',
      lignes,
      retour: 'zone',
    });
  } else {
    // Moment paisible
    membresEquipe().forEach((m) => {
      m.hp = Math.min(m.maxHp, m.hp + Math.round(m.maxHp * 0.12));
      sauvegarder(m);
    });
    afficherButin({
      titre: '🌤️ Un moment de paix',
      texte: 'Aucun danger à l’horizon. Le groupe souffle un peu et reprend des forces.',
      lignes: ['❤️ +12 % de PV pour chaque héros'],
      retour: 'zone',
    });
  }
}

function recolter(z) {
  const objets = {};
  z.recolte.forEach((entree) => {
    if (Math.random() < entree.chance) objets[entree.id] = (objets[entree.id] || 0) + alea(1, 2);
  });
  if (Object.keys(objets).length === 0) objets[z.recolte[0].id] = 1;

  if (Math.random() < 0.25) {
    const cles = composerPack(z, Math.max(1, Math.min(4, membresEquipe().length)));
    afficherToast('⚠️ Une embuscade pendant la récolte !');
    demarrerCombatZone(z, 'embuscade', cles, { lootRecolte: objets });
  } else {
    const lignes = [];
    membresEquipe().forEach((m) => {
      Object.entries(objets).forEach(([id, qte]) => ajouterObjet(m, id, qte));
      sauvegarder(m);
    });
    Object.entries(objets).forEach(([id, qte]) => lignes.push(`${OBJETS[id].emoji} ${OBJETS[id].nom} ×${qte}`));
    afficherButin({
      titre: '🌿 Récolte fructueuse',
      texte: membresEquipe().length > 1 ? 'Chaque héros remplit son sac.' : 'Vous remplissez votre sac.',
      lignes,
      retour: 'zone',
    });
  }
}

function affronterBoss(z) {
  const p = persoActif();
  if ((p.explorations[z.id] || 0) < EXPLORATIONS_POUR_BOSS) return;
  demarrerCombatZone(z, 'boss', [z.boss]);
}

function demarrerCombatZone(z, genre, cles, options = {}) {
  demarrerCombat({
    genre,
    zone: z,
    monstresDef: cles.map((cle) => ({ ...MONSTRES[cle], cle })),
    lootRecolte: options.lootRecolte || null,
    equipe: membresEquipe(),
  });
}

// =====================================================================
// Boss du monde (multijoueur asynchrone)
// =====================================================================
function demarrerCombatBossMonde(boss) {
  const p = persoActif();
  const niveau = p.niveau;
  const monstre = {
    cle: null,
    nom: boss.nom, emoji: boss.emoji, niveau,
    hp: 80 + niveau * 55,
    atk: Math.round(7 + niveau * 2.1),
    agi: 8,
    xp: 0, po: [0, 0], drops: [],
    boss: true,
    attaques: [
      { nom: 'Coup dévastateur', emoji: '💥', mult: 1.2, poids: 2, type: 'mono' },
      { nom: 'Déferlante', emoji: '🌊', mult: 0.8, poids: 1, type: 'aoe' },
      { nom: 'Rugissement du monde', emoji: '🌍', mult: 0.9, poids: 1, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.3 } },
    ],
  };
  demarrerCombat({
    genre: 'bossMonde',
    zone: null,
    monstresDef: [monstre],
    manchesMax: 6,
    equipe: [p],
  });
}

// =====================================================================
// Fin de combat : récompenses, défaite, fuite
// =====================================================================
function tirerButinCombat(cb) {
  let xp = 0;
  let po = 0;
  const objets = {};
  cb.monstres.forEach((m) => {
    xp += m.xp || 0;
    if (m.po) po += alea(m.po[0], m.po[1]);
    (m.drops || []).forEach((d) => {
      if (Math.random() < d.chance) objets[d.id] = (objets[d.id] || 0) + 1;
    });
  });
  if (cb.lootRecolte) {
    Object.entries(cb.lootRecolte).forEach(([id, qte]) => { objets[id] = (objets[id] || 0) + qte; });
  }
  return { xp, po, objets };
}

function nettoyerApresCombat(m) {
  m.statuts = [];
  m.cooldowns = {};
  m.defense = false;
  m.ko = false;
  bornerVie(m);
}

function apresVictoire(cb) {
  if (cb.genre === 'bossMonde') { apresBossMonde(cb); return; }
  const butin = tirerButinCombat(cb);
  const membres = cb.equipe;
  const lignes = [];

  // Les packs grossissent avec l'équipe : le butin se partage donc entre
  // les membres (avec un léger bonus de groupe), sinon jouer à plusieurs
  // ferait progresser ~2,5× plus vite qu'en solo.
  const partage = membres.length;
  const bonusGroupe = partage > 1 ? 1.15 : 1;
  const xpParHeros = Math.max(1, Math.round((butin.xp / partage) * bonusGroupe));
  const poParHeros = Math.max(0, Math.round(butin.po / partage));

  if (cb.genre === 'boss') {
    lignes.push(`👑 ${MONSTRES[cb.zone.boss].nom} est vaincu ! Les environs respirent… pour l'instant.`);
  }
  lignes.push(`⭐ +${xpParHeros} XP par héros`);
  lignes.push(`💰 +${poParHeros} pièces d'or par héros`);

  // Les objets sont répartis aléatoirement entre les membres.
  const partsObjets = membres.map(() => ({}));
  Object.entries(butin.objets).forEach(([id, qte]) => {
    lignes.push(`${OBJETS[id].emoji} ${OBJETS[id].nom} ×${qte}${partage > 1 ? ' (réparti dans les sacs)' : ''}`);
    for (let i = 0; i < qte; i++) {
      const part = partsObjets[alea(0, partage - 1)];
      part[id] = (part[id] || 0) + 1;
    }
  });

  membres.forEach((m, i) => {
    if (m.hp <= 0) m.hp = 1; // les héros KO se relèvent après la victoire
    m.po += poParHeros;
    Object.entries(partsObjets[i]).forEach(([id, qte]) => ajouterObjet(m, id, qte));
    if (cb.genre === 'boss' && !m.bossVaincus.includes(cb.zone.id)) m.bossVaincus.push(cb.zone.id);
    const niveaux = gagnerXp(m, xpParHeros);
    nettoyerApresCombat(m);
    if (niveaux > 0) lignes.push(`🎉 ${m.avatar} ${m.nom} passe niveau ${m.niveau} ! PV et PM restaurés.`);
    sauvegarder(m);
  });

  afficherButin({
    titre: '🏆 Victoire !',
    texte: cb.genre === 'boss' ? 'Un exploit qui restera dans les chroniques de Valciel.' : 'Le champ de bataille vous appartient.',
    lignes,
    retour: 'zone',
  });
}

// Récompense matérielle du boss du monde, adaptée au niveau du héros :
// c'est notamment la source anticipée des matériaux légendaires.
function recompenseBossMonde(niveau) {
  if (niveau >= 16) return 'ecaille-draconique';
  if (niveau >= 12) return 'cristal-givre';
  if (niveau >= 8) return 'os-ancien';
  if (niveau >= 4) return 'minerai-fer';
  return 'seve-ambree';
}

async function apresBossMonde(cb) {
  const p = cb.equipe[0];
  const contribution = Math.max(0, Math.round(cb.degatsBossMonde || 0));
  const poGagne = Math.round(contribution / 5);
  const lignes = [
    `⚔️ Dégâts infligés au boss du monde : ${formatNombre(contribution)}`,
    `💰 +${poGagne} pièces d'or`,
  ];
  p.po += poGagne;
  if (contribution >= 250) {
    const idRecompense = recompenseBossMonde(p.niveau);
    ajouterObjet(p, idRecompense, 1);
    lignes.push(`${OBJETS[idRecompense].emoji} ${OBJETS[idRecompense].nom} ×1 — récompense de bravoure`);
  }
  if (p.hp <= 0) p.hp = 1;
  nettoyerApresCombat(p);
  sauvegarder(p);

  afficherButin({
    titre: '🌍 Assaut du monde',
    texte: 'Les dégâts de tous les joueurs, partout, s’additionnent contre le même boss.',
    lignes: [...lignes, '📡 Envoi de votre contribution au monde…'],
    retour: 'taverne',
  });

  const reponse = await envoyerDegatsBossMonde(contribution);
  const details = el('butin-details');
  if (!details || !el('ecran-butin').classList.contains('actif')) return;
  const derniere = details.querySelector('.ligne-butin:last-child');
  if (derniere) {
    if (reponse && reponse.vaincu) {
      derniere.textContent = `🎆 ${reponse.nom} s'effondre sous les coups des royaumes ! Une nouvelle menace apparaîtra bientôt…`;
    } else if (reponse) {
      derniere.textContent = `🌍 ${reponse.nom} : ${formatNombre(reponse.hp)} / ${formatNombre(reponse.hp_max)} PV restants.`;
    } else {
      derniere.textContent = '📡 Monde injoignable : votre contribution sera perdue cette fois-ci.';
    }
  }
}

function apresDefaite(cb) {
  if (cb.genre === 'bossMonde') {
    apresBossMonde(cb);
    return;
  }
  const membres = cb.equipe;
  const lignes = [];
  membres.forEach((m) => {
    const perte = Math.round(m.po * 0.1);
    m.po -= perte;
    m.hp = Math.max(1, Math.round(m.maxHp * 0.5));
    m.mp = Math.max(0, Math.round(m.maxMp * 0.5));
    nettoyerApresCombat(m);
    sauvegarder(m);
    if (perte > 0) lignes.push(`💸 ${m.avatar} ${m.nom} perd ${perte} po dans la déroute.`);
  });
  afficherButin({
    titre: '💫 Défaite…',
    texte: 'Des mains secourables vous ramènent au Bourg de Valciel. L’aubergiste ne pose pas de questions.',
    lignes: lignes.length ? lignes : ['Vous vous réveillez à l’auberge, un peu sonnés mais entiers.'],
    retour: 'ville',
  });
}

function apresFuite(cb) {
  cb.equipe.forEach((m) => {
    if (m.hp <= 0) m.hp = 1;
    nettoyerApresCombat(m);
    sauvegarder(m);
  });
  afficherToast('💨 Vous prenez la fuite !');
  if (cb.genre === 'bossMonde') {
    naviguer('taverne');
  } else if (etat.zoneCourante) {
    rendreZone(etat.zoneCourante);
    montrerEcran('ecran-zone');
  } else {
    naviguer('carte');
  }
}

// =====================================================================
// Écran de butin
// =====================================================================
function afficherButin({ titre, texte, lignes, retour }) {
  etat.butinRetour = retour || 'carte';
  el('butin-titre').textContent = titre;
  el('butin-texte').textContent = texte || '';
  const details = el('butin-details');
  details.innerHTML = '';
  (lignes || []).forEach((ligne) => {
    const div = document.createElement('div');
    div.className = 'ligne-butin';
    div.textContent = ligne;
    details.appendChild(div);
  });
  montrerEcran('ecran-butin');
}

function continuerApresButin() {
  const retour = etat.butinRetour || 'carte';
  if (retour === 'zone' && etat.zoneCourante) {
    rendreZone(etat.zoneCourante);
    montrerEcran('ecran-zone');
  } else if (retour === 'ville') {
    naviguer('ville');
  } else if (retour === 'taverne') {
    naviguer('taverne');
  } else {
    naviguer('carte');
  }
}
