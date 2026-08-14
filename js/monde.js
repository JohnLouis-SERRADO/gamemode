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

  // La Tour Sans Fin : combats enchaînés sans repos, de plus en plus durs.
  const tourVerrouillee = p.niveau < 3;
  const tour = document.createElement('div');
  tour.className = 'carte-zone tour-sans-fin' + (tourVerrouillee ? ' verrouillee' : '');
  tour.innerHTML = `
    <div class="zone-emoji">🗼</div>
    <div class="zone-nom">Tour Sans Fin ${p.tourMax > 0 ? `· record : étage ${p.tourMax}` : ''}</div>
    <div class="zone-plage">défi — expédition solo ou locale</div>
    <div class="zone-desc">${tourVerrouillee
    ? '🔒 Atteignez le niveau 3 pour tenter l’ascension.'
    : 'Des étages infinis, aucun repos entre les combats, un butin qui grimpe à chaque palier. Jusqu’où monterez-vous ?'}</div>`;
  if (!tourVerrouillee) rendreCliquable(tour, () => demarrerTour());
  zone.appendChild(tour);

  // La Tour des Boss : que des boss, avec paliers de difficulté.
  const tourBossVerrouillee = p.niveau < 10;
  const meilleurRecord = Math.max(p.tourBoss.normal, p.tourBoss.heroique, p.tourBoss.cauchemar);
  const tourBoss = document.createElement('div');
  tourBoss.className = 'carte-zone tour-sans-fin tour-des-boss' + (tourBossVerrouillee ? ' verrouillee' : '');
  tourBoss.innerHTML = `
    <div class="zone-emoji">🏯</div>
    <div class="zone-nom">Tour des Boss ${meilleurRecord > 0 ? `· record : étage ${meilleurRecord}` : ''}</div>
    <div class="zone-plage">défi — solo ou équipe · 3 difficultés</div>
    <div class="zone-desc">${tourBossVerrouillee
    ? '🔒 Atteignez le niveau 10 pour défier les seigneurs des Royaumes.'
    : 'Un boss par étage, du premier loup au Dévoreur de Mondes. Normal, Héroïque puis Cauchemar : chaque difficulté a son record.'}</div>`;
  if (!tourBossVerrouillee) rendreCliquable(tourBoss, () => ouvrirTourBoss());
  zone.appendChild(tourBoss);

  // Donjons d'histoire : aventures scénarisées à choix.
  rendreCartesDonjons(zone, p);
}

// =====================================================================
// Écran de zone
// =====================================================================
function rendreZone(z) {
  const p = persoActif();
  const explorations = p.explorations[z.id] || 0;
  const bossPret = explorations >= EXPLORATIONS_POUR_BOSS;
  const boss = MONSTRES[z.boss];
  if (!DIFFICULTES[etat.difficulte] || !difficulteDebloquee(p, z, etat.difficulte)) {
    etat.difficulte = 'normal';
  }

  el('zone-entete').innerHTML = `
    <div class="entete-lieu">
      <h2>${z.emoji} ${z.nom} <span class="badge">${z.plage}</span></h2>
      <button class="btn-choix btn-compact" id="zone-retour">🗺️ Carte</button>
    </div>
    <p class="sous-titre gauche">${z.desc}</p>
    <div class="rangee-chips" id="zone-difficultes"></div>`;
  el('zone-retour').addEventListener('click', () => naviguer('carte'));

  // Sélecteur de difficulté
  const zoneDiff = el('zone-difficultes');
  Object.entries(DIFFICULTES).forEach(([cle, d]) => {
    const debloquee = difficulteDebloquee(p, z, cle);
    const chip = document.createElement('button');
    chip.className = 'chip chip-difficulte' + (etat.difficulte === cle ? ' active' : '') + (debloquee ? '' : ' verrouillee');
    chip.disabled = !debloquee;
    chip.textContent = `${d.emoji} ${d.nom}`;
    chip.title = debloquee
      ? (cle === 'normal' ? 'Difficulté de base' : `Monstres renforcés, récompenses ×${d.xp}`)
      : (cle === 'heroique' ? 'Vainquez le boss de la zone pour débloquer'
        : `Boss vaincu + niveau ${z.niveauMin + 6} requis`);
    chip.addEventListener('click', () => {
      etat.difficulte = cle;
      rendreZone(z);
    });
    zoneDiff.appendChild(chip);
  });

  const actions = el('zone-actions-liste');
  actions.innerHTML = '';

  const explorer_ = document.createElement('button');
  explorer_.className = 'btn-action-zone';
  explorer_.innerHTML = `<span class="action-zone-emoji">🗡️</span><strong>Explorer</strong>
    <span class="action-zone-detail">Partir en quête de combats et de découvertes</span>`;
  explorer_.addEventListener('click', () => explorer(z));
  actions.appendChild(explorer_);

  // v12 : trois façons de récolter — chacune nourrit son métier, et la
  // spécialité du héros (sa sous-classe de récolteur) brille d'une étoile.
  Object.entries(METIERS).forEach(([idMetier, metier]) => {
    const m = metierDe(p, idMetier);
    const specialite = p.metierPrincipal === idMetier;
    const pool = z.recolte.filter((e) => FAMILLE_MATERIAU[e.id] === metier.famille);
    const noms = pool.map((e) => `${OBJETS[e.id].emoji} ${OBJETS[e.id].nom}`).join(', ');
    const btn = document.createElement('button');
    btn.className = 'btn-action-zone';
    btn.innerHTML = `<span class="action-zone-emoji">${metier.emoji}</span><strong>${metier.action}${specialite ? ' ⭐' : ''}</strong>
      <span class="action-zone-detail">${noms || `${OBJETS[metier.exclusif].emoji} ${OBJETS[metier.exclusif].nom} (traces à débusquer)`}
      · ${metier.nom} niv. ${m.niveau}${specialite ? ' · spécialité' : ''}</span>`;
    btn.addEventListener('click', () => recolter(z, idMetier));
    actions.appendChild(btn);
  });

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
  // Matériaux groupés par métier : on sait tout de suite quoi venir y faire.
  const chipsMateriaux = Object.values(METIERS).map((metier) => {
    const pool = z.recolte.filter((e) => FAMILLE_MATERIAU[e.id] === metier.famille);
    const chips = pool
      .map((e) => `<span class="chip">${OBJETS[e.id].emoji} ${OBJETS[e.id].nom}</span>`)
      .join('');
    return `<span class="chip chip-metier">${metier.emoji} ${metier.action}</span>${chips
      || `<span class="chip">${OBJETS[metier.exclusif].emoji} ${OBJETS[metier.exclusif].nom} (traces)</span>`}`;
  }).join(' ');
  infos.innerHTML = `
    <div class="panneau">
      <h3>🐾 Créatures de la zone</h3>
      <div class="rangee-chips">${chipsMonstres}
        <span class="chip chip-boss">${boss.emoji} ${boss.nom} (boss)</span></div>
      <h3>⛏️ Matériaux récoltables <span class="badge">🍀 la Chance enrichit la moisson</span></h3>
      <div class="rangee-chips">${chipsMateriaux}</div>
      <p class="aide">Explorations dans cette zone : ${explorations}${p.bossVaincus.includes(z.id) ? ' · 🏆 boss déjà vaincu (il peut être défié à nouveau)' : ''}</p>
    </div>`;
}

// =====================================================================
// Actions de zone
// =====================================================================
// Score de puissance moyen de l'équipe : la somme des stats effectives.
// Plus les héros sont puissants, plus les packs sont fournis — les
// combats restent dynamiques et durent un peu plus longtemps.
function scorePuissance(membres) {
  if (!membres.length) return 0;
  return membres.reduce((somme, m) => {
    const s = statsEffectives(m);
    return somme + s.for + s.int + s.agi + s.vit + (s.cha || 0);
  }, 0) / membres.length;
}

function bonusTaillePack(membres) {
  const score = scorePuissance(membres);
  if (score >= 90) return 2;
  if (score >= 50) return 1;
  return 0;
}

function tailleDuPack(membres) {
  let nb = membres.length + bonusTaillePack(membres);
  if (Math.random() < 0.35) nb++;
  if (nb > 1 && Math.random() < 0.25) nb--;
  return Math.max(1, Math.min(6, nb));
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
  progresserQuete(p, 'exploration', 1);
  sauvegarder(p);

  const tirage = Math.random();
  if (tirage < 0.06) {
    // 🌟 Un monstre doré surgit : redoutable, mais le butin est triplé.
    const cle = z.monstres[alea(0, z.monstres.length - 1)];
    const base = MONSTRES[cle];
    const dore = {
      ...base,
      cle,
      nom: `${base.nom} doré`,
      emoji: '🌟',
      hp: Math.round(base.hp * 2.2),
      atk: Math.round(base.atk * 1.25),
      xp: base.xp * 3,
      po: [base.po[0] * 3, base.po[1] * 3],
      drops: (base.drops || []).map((d) => ({ id: d.id, chance: Math.min(1, d.chance * 2.5) })),
    };
    afficherToast('🌟 Un monstre doré apparaît ! Sa fourrure vaut de l’or…');
    demarrerCombatZone(z, 'exploration', [], { monstresDef: [dore] });
    return;
  }
  if (tirage < 0.11) {
    marchandNomade(z);
    return;
  }
  if (tirage < 0.72) {
    const cles = composerPack(z, tailleDuPack(membresEquipe()));
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

// v12 : la récolte se fait par métier (miner / dépecer / herboriser).
// La Chance améliore les probabilités ET les prises rares ; le niveau
// de métier améliore les quantités et le matériau signature. Et la
// SPÉCIALITÉ (sous-classe de récolteur) démultiplie tout : un tisseur
// spécialiste ramasse plus de plantes qu'un mineur de passage — d'autant
// plus que sa Chance est haute.
function recolter(z, idMetier) {
  const p = persoActif();
  const metier = METIERS[idMetier] || METIERS.tisseur;
  progresserQuete(p, 'recolte', 1);

  const s = statsEffectives(p);
  const multChance = multChanceDrop(s.cha); // jusqu'à ×2 avec la Chance
  const specialiste = p.metierPrincipal === idMetier;
  const multSpec = specialiste ? multSpecialite(s.cha) : 1; // ×1.3 à ×1.6 selon la Chance
  const niveauM = metierDe(p, idMetier).niveau;
  const bonusQte = Math.floor(niveauM / 3) + (specialiste ? 1 : 0); // la spécialité ajoute sa part

  const pool = z.recolte.filter((e) => FAMILLE_MATERIAU[e.id] === metier.famille);
  const objets = {};
  pool.forEach((entree) => {
    if (Math.random() < Math.min(0.95, entree.chance * multChance * multSpec)) {
      objets[entree.id] = (objets[entree.id] || 0) + alea(1, 2) + bonusQte;
    }
  });
  // Le matériau signature du métier se trouve partout — d'autant plus
  // souvent qu'on est chanceux, expérimenté… et spécialisé.
  const chanceExclusif = Math.min(0.9, (0.1 + niveauM * 0.04) * multChance * multSpec);
  if (pool.length === 0 || Math.random() < chanceExclusif) {
    objets[metier.exclusif] = (objets[metier.exclusif] || 0) + 1 + Math.floor(niveauM / 5) + (specialiste ? 1 : 0);
  }
  if (Object.keys(objets).length === 0) {
    objets[pool.length ? pool[0].id : metier.exclusif] = 1;
  }

  // Tout le monde pratique : chaque héros progresse dans le métier du
  // jour — deux fois plus vite si c'est SA spécialité.
  const xpBase = alea(2, 4);
  membresEquipe().forEach((m) => {
    gagnerXpMetier(m, idMetier, m.metierPrincipal === idMetier ? xpBase * 2 : xpBase);
  });

  if (Math.random() < 0.25) {
    const membres = membresEquipe();
    const cles = composerPack(z, Math.max(1, Math.min(5, membres.length + bonusTaillePack(membres))));
    afficherToast(`⚠️ ${metier.emoji} Une embuscade pendant la récolte !`);
    demarrerCombatZone(z, 'embuscade', cles, { lootRecolte: objets });
  } else {
    const lignes = [];
    membresEquipe().forEach((m) => {
      Object.entries(objets).forEach(([id, qte]) => ajouterObjet(m, id, qte));
      sauvegarder(m);
    });
    Object.entries(objets).forEach(([id, qte]) => lignes.push(`${OBJETS[id].emoji} ${OBJETS[id].nom} ×${qte}`));
    const mProg = metierDe(p, idMetier);
    lignes.push(`${metier.emoji} ${metier.nom} niv. ${mProg.niveau}${mProg.niveau < NIVEAU_MAX_METIER ? ` (${mProg.xp}/${seuilXpMetier(mProg.niveau)} XP)` : ' (maître)'}${specialiste ? ' · ⭐ spécialité : moisson enrichie, progression ×2' : ''}`);
    afficherButin({
      titre: `${metier.emoji} ${metier.action} : belle moisson`,
      texte: membresEquipe().length > 1 ? 'Chaque héros remplit son sac.' : 'Vous remplissez votre sac.',
      lignes,
      retour: 'zone',
    });
  }
}

function affronterBoss(z) {
  const p = persoActif();
  if ((p.explorations[z.id] || 0) < EXPLORATIONS_POUR_BOSS) return;
  // Une équipe puissante attire l'attention : le boss vient escorté.
  const escorte = bonusTaillePack(membresEquipe());
  const cles = [z.boss];
  for (let i = 0; i < escorte; i++) cles.push(z.monstres[alea(0, z.monstres.length - 1)]);
  demarrerCombatZone(z, 'boss', cles);
}

// Le marchand nomade : trois articles au hasard, 30 % de remise.
function marchandNomade(z) {
  const p = persoActif();
  const candidats = Object.entries(OBJETS).filter(([, o]) => o.prix != null);
  const choix = [];
  while (choix.length < 3 && candidats.length > 0) {
    const [id, objet] = candidats.splice(alea(0, candidats.length - 1), 1)[0];
    choix.push([id, objet]);
  }
  afficherButin({
    titre: '🧞 Un marchand nomade !',
    texte: 'Sorti de nulle part, il déballe son tapis : −30 % sur tout. Il sera loin demain.',
    lignes: [],
    retour: 'zone',
  });
  const details = el('butin-details');
  choix.forEach(([id, objet]) => {
    const prixReduit = Math.max(1, Math.round(objet.prix * 0.7));
    const carte = document.createElement('div');
    carte.className = 'carte-objet';
    carte.innerHTML = `
      <div class="objet-entete">${objet.emoji} <strong>${objet.nom}</strong></div>
      <div class="objet-desc">${objet.desc || ''}</div>
      ${objet.bonus ? `<div class="objet-bonus">${texteBonus(objet.bonus)}</div>` : ''}`;
    const acheter = document.createElement('button');
    acheter.className = 'btn-choix btn-compact btn-achat';
    acheter.textContent = `Acheter — ${prixReduit} po (au lieu de ${objet.prix})`;
    acheter.disabled = p.po < prixReduit;
    acheter.addEventListener('click', () => {
      if (p.po < prixReduit) return;
      p.po -= prixReduit;
      ajouterObjet(p, id);
      sauvegarder(p);
      rendreTopbar();
      acheter.disabled = true;
      acheter.textContent = `${objet.emoji} Acheté !`;
      afficherToast(`${objet.emoji} ${objet.nom} acheté à prix d'ami.`);
    });
    carte.appendChild(acheter);
    details.appendChild(carte);
  });
}

function demarrerCombatZone(z, genre, cles, options = {}) {
  const mult = DIFFICULTES[etat.difficulte] || DIFFICULTES.normal;
  const defs = (options.monstresDef || cles.map((cle) => ({ ...MONSTRES[cle], cle })))
    .map((def) => ({
      ...def,
      hp: Math.round(def.hp * mult.hp),
      atk: Math.round(def.atk * mult.atk),
    }));
  demarrerCombat({
    genre,
    zone: z,
    difficulte: etat.difficulte,
    monstresDef: defs,
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
  const difficulte = DIFFICULTES[cb.difficulte] || DIFFICULTES.normal;
  const evenement = multiplicateursEvenement();
  // La chance moyenne de l'équipe améliore les probabilités de butin.
  const chaMoyenne = cb.equipe.length
    ? cb.equipe.reduce((somme, j) => somme + (statsEffectives(j).cha || 0), 0) / cb.equipe.length
    : 0;
  let chanceEquipe = multChanceDrop(chaMoyenne);
  // Trèfles séchés : chaque héros sous statut fortune ajoute +30 % de butin.
  cb.equipe.forEach((j) => {
    if ((j.statuts || []).some((s) => s.type === 'fortune')) chanceEquipe *= 1.3;
  });
  let xp = 0;
  let po = 0;
  const objets = {};
  cb.monstres.forEach((m) => {
    xp += m.xp || 0;
    if (m.po) po += alea(m.po[0], m.po[1]);
    (m.drops || []).forEach((d) => {
      if (Math.random() < Math.min(1, d.chance * difficulte.drop * evenement.drop * chanceEquipe)) {
        objets[d.id] = (objets[d.id] || 0) + 1;
      }
    });
  });
  xp = Math.round(xp * difficulte.xp * evenement.xp);
  po = Math.round(po * difficulte.po * evenement.po) + (cb.orVole || 0);
  if (cb.lootRecolte) {
    Object.entries(cb.lootRecolte).forEach(([id, qte]) => { objets[id] = (objets[id] || 0) + qte; });
  }
  return { xp, po, objets };
}

// =====================================================================
// Coffre de boss : trophée unique + tirages pondérés par la chance
// =====================================================================
function ouvrirCoffreBoss(p, zone, difficulte) {
  const s = statsEffectives(p);
  const objets = {};
  const lignes = [];
  const dejaVaincu = (p.bossVaincus || []).includes(zone.id);
  const unique = COFFRES_BOSS[zone.boss];
  lignes.push(dejaVaincu ? '🎁 Le boss laisse un coffre…' : '🎁 Première victoire : le boss laisse son coffre scellé !');
  // Le trophée unique du boss : garanti la première fois, 15 % ensuite.
  if (unique && (!dejaVaincu || Math.random() < 0.15)) {
    objets[unique] = (objets[unique] || 0) + 1;
    const o = OBJETS[unique];
    lignes.push(`✨ ${o.emoji} ${o.nom}${texteRarete(o)} — trophée unique !`);
  }
  // Le familier du boss peut se cacher dans le coffre (20 %).
  let familier = null;
  const idFamilier = Object.keys(FAMILIERS).find((id) => FAMILIERS[id].source === zone.boss);
  if (idFamilier && !(p.familiers || []).includes(idFamilier) && Math.random() < 0.2) {
    familier = idFamilier;
    lignes.push(`🐾 ${FAMILIERS[idFamilier].emoji} ${FAMILIERS[idFamilier].nom} sort du coffre et vous adopte !`);
  }
  let tirages = 2 + (Math.random() < 0.5 ? 1 : 0);
  if (difficulte === 'heroique' && Math.random() < 0.5) tirages++;
  if (difficulte === 'cauchemar') tirages++;
  for (let i = 0; i < tirages; i++) {
    const rarete = tirerRarete(s.cha);
    const pool = Object.entries(OBJETS).filter(([, o]) => rareteDe(o) === rarete
      && (o.type === 'materiau' || o.type === 'consommable'
        || (o.type === 'equipement' && o.niveau <= p.niveau + 3)));
    if (!pool.length) continue;
    const [id, o] = pool[alea(0, pool.length - 1)];
    objets[id] = (objets[id] || 0) + 1;
    lignes.push(`${o.emoji} ${o.nom}${texteRarete(o)}`);
  }
  return { objets, lignes, familier };
}

// =====================================================================
// La Tour Sans Fin : étages enchaînés sans repos
// =====================================================================
function zonePourEtage(etage) {
  return ZONES[Math.min(ZONES.length - 1, Math.floor((etage - 1) / 2.5))];
}

function demarrerTour() {
  etat.tour = { etage: 1 };
  afficherToast('🗼 L’ascension commence ! Aucun repos entre les étages…');
  demarrerCombatTourEtage(1);
}

function demarrerCombatTourEtage(etage) {
  etat.tour = { etage };
  const z = zonePourEtage(etage);
  const mult = 1 + etage * 0.06;
  const estPalier = etage % 5 === 0;
  const cles = estPalier ? [z.boss] : composerPack(z, tailleDuPack(membresEquipe()));
  const defs = cles.map((cle) => ({
    ...MONSTRES[cle], cle,
    hp: Math.round(MONSTRES[cle].hp * mult),
    atk: Math.round(MONSTRES[cle].atk * mult),
  }));
  demarrerCombat({
    genre: 'tour',
    zone: z,
    tourEtage: etage,
    monstresDef: defs,
    equipe: membresEquipe(),
  });
}

function apresVictoireTour(cb) {
  const etage = cb.tourEtage;
  const membres = cb.equipe;
  const partage = membres.length;
  const estPalier = etage % 5 === 0;
  const lignes = [];

  const butin = tirerButinCombat(cb);
  const multTour = 1 + etage * 0.12;
  const xpParHeros = Math.max(1, Math.round((butin.xp * multTour) / partage));
  const poParHeros = Math.max(0, Math.round((butin.po * multTour) / partage));
  lignes.push(`⭐ +${xpParHeros} XP et 💰 +${poParHeros} po par héros (prime d'étage +${Math.round(etage * 12)} %)`);
  Object.entries(butin.objets).forEach(([id, qte]) => {
    lignes.push(`${OBJETS[id].emoji} ${OBJETS[id].nom}${texteRarete(OBJETS[id])} ×${qte}`);
  });

  membres.forEach((m) => {
    if (m.hp <= 0) m.hp = 1;
    const poGagne = Math.round(poParHeros * multiplicateurOr(m));
    m.po += poGagne;
    m.compteurs.orTotal += poGagne;
    m.compteurs.monstres += cb.monstres.length;
    progresserQuete(m, 'monstres', cb.monstres.length);
    progresserQuete(m, 'tour', 1);
    Object.entries(butin.objets).forEach(([id, qte]) => ajouterObjet(m, id, qte));
    if (m.tourMax < etage) m.tourMax = etage;

    // Palier (étages 5, 10, 15…) : coffre de la Tour + familier éventuel
    if (estPalier) {
      const s = statsEffectives(m);
      for (let i = 0; i < 2; i++) {
        const rarete = tirerRarete(s.cha + etage);
        const pool = Object.entries(OBJETS).filter(([, o]) => rareteDe(o) === rarete
          && (o.type === 'materiau' || o.type === 'consommable'
            || (o.type === 'equipement' && o.niveau <= m.niveau + 3)));
        if (pool.length) {
          const [id, objet] = pool[alea(0, pool.length - 1)];
          ajouterObjet(m, id, 1);
          lignes.push(`🎁 Coffre de la Tour : ${objet.emoji} ${objet.nom}${texteRarete(objet)}`);
        }
      }
      const idFamilier = FAMILIERS_TOUR[etage];
      if (idFamilier && !m.familiers.includes(idFamilier)) {
        m.familiers.push(idFamilier);
        lignes.push(`🐾 ${FAMILIERS[idFamilier].emoji} ${FAMILIERS[idFamilier].nom} vous rejoint — gardien de l'étage ${etage} !`);
      }
    }

    const niveaux = gagnerXp(m, xpParHeros);
    verifierHautsFaits(m);
    nettoyerApresCombat(m); // ne soigne pas : la Tour ne pardonne rien
    if (niveaux > 0) lignes.push(`🎉 ${m.avatar} ${m.nom} passe niveau ${m.niveau} ! PV et PM restaurés.`);
    sauvegarder(m);
  });

  const vies = membres.map((m) => `${m.avatar} ${m.hp}/${m.maxHp} PV`).join(' · ');
  afficherButin({
    titre: `🗼 Étage ${etage} vaincu !`,
    texte: `${estPalier ? 'Un palier ! Le coffre de la Tour s’ouvre. ' : ''}Pas de repos : ${vies}.`,
    lignes,
    retour: 'carte',
    boutons: [
      {
        texte: `⬆️ Étage ${etage + 1} — ennemis +${Math.round((etage + 1) * 6)} %`,
        classe: 'btn-principal',
        action: () => demarrerCombatTourEtage(etage + 1),
      },
      {
        texte: '🏳️ Redescendre en gardant les gains',
        action: () => {
          etat.tour = null;
          afficherToast(`🗼 Belle ascension : étage ${etage} atteint !`);
          naviguer('carte');
        },
      },
    ],
  });
}

// =====================================================================
// La Tour des Boss : un boss par étage, solo ou en équipe locale,
// trois difficultés à débloquer, un record par difficulté.
// =====================================================================
const CYCLE_TOUR_BOSS = ['loupAlpha', 'araigneeMatriarche', 'chefOrc', 'hydreBrumes',
  'roiDechu', 'verDesSables', 'elementaireAncien', 'gardienEternel',
  'matriarcheSarpense', 'rokhTempetueux', 'leviathanCorallien', 'behemothCendre',
  'avatarQuartz', 'roiOssements', 'archonteTempete', 'devoreurMondes'];

function ouvrirTourBoss() {
  const p = persoActif();
  const records = p.tourBoss;
  const lignes = [
    `⚔️ Normal — record : étage ${records.normal}`,
    `🔥 Héroïque — record : étage ${records.heroique}${records.normal >= 3 ? '' : ' · 🔒 atteignez l’étage 3 en Normal'}`,
    `💀 Cauchemar — record : étage ${records.cauchemar}${records.heroique >= 3 ? '' : ' · 🔒 atteignez l’étage 3 en Héroïque'}`,
  ];
  const boutons = [{ texte: '⚔️ Grimper en Normal', classe: 'btn-principal', action: () => demarrerTourBoss('normal') }];
  if (records.normal >= 3) boutons.push({ texte: '🔥 Grimper en Héroïque', classe: 'btn-choix', action: () => demarrerTourBoss('heroique') });
  if (records.heroique >= 3) boutons.push({ texte: '💀 Grimper en Cauchemar', classe: 'btn-choix', action: () => demarrerTourBoss('cauchemar') });
  boutons.push({ texte: '🗺️ Revenir à la carte', action: () => naviguer('carte') });
  afficherButin({
    titre: '🏯 La Tour des Boss',
    texte: 'Un boss par étage — du Loup Alpha au Dévoreur de Mondes, puis le cycle reprend, toujours plus féroce. Solo ou en équipe locale. Chaque difficulté garde son propre record.',
    lignes,
    boutons,
    retour: 'carte',
  });
}

function demarrerTourBoss(difficulte) {
  etat.tourBoss = { etage: 1, difficulte };
  afficherToast(`🏯 Tour des Boss — ${DIFFICULTES[difficulte].emoji} ${DIFFICULTES[difficulte].nom} : étage 1 !`);
  demarrerCombatTourBossEtage(1);
}

function demarrerCombatTourBossEtage(etage) {
  const contexte = etat.tourBoss;
  contexte.etage = etage;
  const membres = membresEquipe();
  const diff = DIFFICULTES[contexte.difficulte];
  const cle = CYCLE_TOUR_BOSS[(etage - 1) % CYCLE_TOUR_BOSS.length];
  const cycle = Math.floor((etage - 1) / CYCLE_TOUR_BOSS.length);
  const base = MONSTRES[cle];
  // Chaque étage renforce le boss ; chaque cycle complet le transcende.
  const multHp = diff.hp * (1 + etage * 0.08 + cycle * 0.6) * (1 + 0.35 * (membres.length - 1));
  const def = {
    ...base,
    cle,
    nom: cycle > 0 ? `${base.nom} transcendé` : base.nom,
    hp: Math.round(base.hp * multHp),
    atk: Math.round(base.atk * diff.atk * (1 + etage * 0.03)),
  };
  demarrerCombat({
    genre: 'tourBoss',
    zone: null,
    difficulte: contexte.difficulte,
    titre: `🏯 Tour des Boss — Étage ${etage}`,
    intro: `${def.nom} garde l'étage ${etage}. Pas de repos entre les étages !`,
    monstresDef: [def],
    equipe: membres,
  });
}

function apresVictoireTourBoss(cb) {
  const contexte = etat.tourBoss;
  const etage = contexte ? contexte.etage : 1;
  const difficulte = contexte ? contexte.difficulte : 'normal';
  const membres = cb.equipe;
  const partage = membres.length;
  const butin = tirerButinCombat(cb);
  const multEtage = 1 + etage * 0.15;
  const xpParHeros = Math.max(1, Math.round((butin.xp * multEtage) / partage));
  const poParHeros = Math.max(0, Math.round((butin.po * multEtage) / partage));
  const lignes = [`⭐ +${xpParHeros} XP et 💰 +${poParHeros} po par héros (prime d'étage +${Math.round(etage * 15)} %)`];
  Object.entries(butin.objets).forEach(([id, qte]) => {
    lignes.push(`${OBJETS[id].emoji} ${OBJETS[id].nom}${texteRarete(OBJETS[id])} ×${qte}`);
  });

  membres.forEach((m) => {
    if (m.hp <= 0) m.hp = 1;
    const poGagne = Math.round(poParHeros * multiplicateurOr(m));
    m.po += poGagne;
    m.compteurs.orTotal += poGagne;
    m.compteurs.monstres += cb.monstres.length;
    progresserQuete(m, 'monstres', cb.monstres.length);
    progresserQuete(m, 'tourBoss', 1);
    Object.entries(butin.objets).forEach(([id, qte]) => ajouterObjet(m, id, qte));
    // Coffre de l'étage : deux tirages dopés par l'étage et la difficulté.
    const s = statsEffectives(m);
    const tirages = difficulte === 'cauchemar' ? 3 : 2;
    for (let i = 0; i < tirages; i++) {
      const rarete = tirerRarete(s.cha + etage * 2);
      const pool = Object.entries(OBJETS).filter(([, o]) => rareteDe(o) === rarete
        && (o.type === 'materiau' || o.type === 'consommable'
          || (o.type === 'equipement' && o.niveau <= m.niveau + 3)));
      if (pool.length) {
        const [id, objet] = pool[alea(0, pool.length - 1)];
        ajouterObjet(m, id, 1);
        lignes.push(`🎁 Coffre du boss : ${objet.emoji} ${objet.nom}${texteRarete(objet)}`);
      }
    }
    if (m.tourBoss[difficulte] < etage) m.tourBoss[difficulte] = etage;
    const niveaux = gagnerXp(m, xpParHeros);
    verifierHautsFaits(m);
    nettoyerApresCombat(m); // pas de soin entre les étages
    if (niveaux > 0) lignes.push(`🎉 ${m.avatar} ${m.nom} passe niveau ${m.niveau} ! PV et PM restaurés.`);
    sauvegarder(m);
  });

  const vies = membres.map((m) => `${m.avatar} ${m.hp}/${m.maxHp} PV`).join(' · ');
  const prochain = MONSTRES[CYCLE_TOUR_BOSS[etage % CYCLE_TOUR_BOSS.length]];
  afficherButin({
    titre: `🏯 Étage ${etage} vaincu !`,
    texte: `${DIFFICULTES[difficulte].emoji} ${DIFFICULTES[difficulte].nom} · Pas de repos : ${vies}.`,
    lignes,
    retour: 'carte',
    boutons: [
      {
        texte: `⬆️ Étage ${etage + 1} — ${prochain.emoji} ${prochain.nom}`,
        classe: 'btn-principal',
        action: () => demarrerCombatTourBossEtage(etage + 1),
      },
      {
        texte: '🏳️ Redescendre en gardant les gains',
        action: () => {
          etat.tourBoss = null;
          afficherToast(`🏯 Record ${DIFFICULTES[difficulte].nom} : étage ${etage} !`);
          naviguer('carte');
        },
      },
    ],
  });
}

function nettoyerApresCombat(m) {
  m.statuts = [];
  m.cooldowns = {};
  m.defense = false;
  m.ko = false;
  bornerVie(m);
}

function apresVictoire(cb) {
  if (cb.groupe && cb.groupe.hote) { apresCombatGroupeHote(cb, 'victoire'); return; }
  if (cb.genre === 'bossMonde') { apresBossMonde(cb); return; }
  if (cb.genre === 'tour') { apresVictoireTour(cb); return; }
  if (cb.genre === 'tourBoss') { apresVictoireTourBoss(cb); return; }
  if (cb.genre === 'donjon') { apresVictoireDonjon(cb); return; }
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
    lignes.push(`${OBJETS[id].emoji} ${OBJETS[id].nom}${texteRarete(OBJETS[id])} ×${qte}${partage > 1 ? ' (réparti dans les sacs)' : ''}`);
    for (let i = 0; i < qte; i++) {
      const part = partsObjets[alea(0, partage - 1)];
      part[id] = (part[id] || 0) + 1;
    }
  });

  // Un boss abattu laisse un coffre pour chaque héros présent.
  const familiersGagnes = membres.map(() => null);
  if (cb.genre === 'boss') {
    membres.forEach((m, i) => {
      const coffre = ouvrirCoffreBoss(m, cb.zone, cb.difficulte);
      Object.entries(coffre.objets).forEach(([id, qte]) => {
        partsObjets[i][id] = (partsObjets[i][id] || 0) + qte;
      });
      familiersGagnes[i] = coffre.familier;
      coffre.lignes.forEach((ligne, idx) => {
        lignes.push(partage > 1 && idx === 0 ? `${m.avatar} ${m.nom} — ${ligne}` : ligne);
      });
    });
  }

  membres.forEach((m, i) => {
    if (m.hp <= 0) m.hp = 1; // les héros KO se relèvent après la victoire
    const poGagne = Math.round(poParHeros * multiplicateurOr(m));
    m.po += poGagne;
    Object.entries(partsObjets[i]).forEach(([id, qte]) => ajouterObjet(m, id, qte));
    if (familiersGagnes[i] && !m.familiers.includes(familiersGagnes[i])) m.familiers.push(familiersGagnes[i]);
    if (cb.genre === 'boss' && !m.bossVaincus.includes(cb.zone.id)) m.bossVaincus.push(cb.zone.id);
    const niveaux = gagnerXp(m, xpParHeros);
    // Progression des compteurs et contrats de guilde
    m.compteurs.monstres += cb.monstres.length;
    m.compteurs.orTotal += poGagne;
    progresserQuete(m, 'monstres', cb.monstres.length);
    if (cb.genre === 'boss') progresserQuete(m, 'boss', 1);
    verifierHautsFaits(m);
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
  if (cb.groupe && cb.groupe.hote) { apresCombatGroupeHote(cb, 'defaite'); return; }
  if (cb.genre === 'bossMonde') {
    apresBossMonde(cb);
    return;
  }
  if (cb.genre === 'donjon') { apresDefaiteDonjon(cb); return; }
  const lignesContexte = [];
  if (cb.genre === 'tour' && etat.tour) {
    lignesContexte.push(`🗼 La Tour Sans Fin garde votre record : étage ${persoActif().tourMax}.`);
    etat.tour = null;
  }
  if (cb.genre === 'tourBoss' && etat.tourBoss) {
    lignesContexte.push(`🏯 Le boss de l'étage ${etat.tourBoss.etage} de la Tour des Boss a eu le dernier mot.`);
    etat.tourBoss = null;
  }
  // v14 : une expédition qui tombe, c'est la MORT — et la mort a un prix.
  cb.equipe.forEach((m) => nettoyerApresCombat(m));
  traiterMortEquipe(cb, lignesContexte);
}

function apresFuite(cb) {
  if (cb.groupe && cb.groupe.hote) { apresCombatGroupeHote(cb, 'fuite'); return; }
  cb.equipe.forEach((m) => {
    if (m.hp <= 0) m.hp = 1;
    nettoyerApresCombat(m);
    sauvegarder(m);
  });
  // Fuir un étage d'Ascension, c'est abandonner l'ascension (record gardé).
  if (cb.ascension && etat.ascension) etat.ascension = null;
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
function afficherButin({ titre, texte, lignes, retour, boutons }) {
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
  // Boutons personnalisés (ex. Tour : continuer ou redescendre)
  const zoneBoutons = el('butin-boutons');
  zoneBoutons.innerHTML = '';
  const defaut = el('butin-continuer');
  if (boutons && boutons.length) {
    defaut.classList.add('cache');
    boutons.forEach((bouton) => {
      const btn = document.createElement('button');
      btn.className = bouton.classe || 'btn-choix';
      btn.textContent = bouton.texte;
      btn.addEventListener('click', bouton.action);
      zoneBoutons.appendChild(btn);
    });
  } else {
    defaut.classList.remove('cache');
  }
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
  } else if (retour === 'groupe-ligne' && etat.groupeLigne) {
    ouvrirLobbyGroupe();
  } else {
    naviguer('carte');
  }
}
