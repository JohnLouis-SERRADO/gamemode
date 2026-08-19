'use strict';

// =====================================================================
// Le monde : carte, zones, exploration, récolte, boss de zone,
// récompenses de combat et écran de butin.
// =====================================================================

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

  // v19 : les cartes se regroupent par acte du fil conducteur. Tout était
  // empilé dans un seul défilement de dix écrans, verrouillé compris.
  const groupes = [];
  ACTES_MONDE.forEach((acte) => {
    const zones = ZONES.filter((z) => z.acte === acte.id);
    if (zones.length) groupes.push({ acte, zones });
  });

  // v26 : la carte se lit comme un livre — chaque terre est un chapitre
  // numéroté du grand récit, l'épilogue vient après le Trône.
  const numeroChapitre = (z) => {
    if (z.id === 'dernier-point') return 'Épilogue';
    return `Chapitre ${ZONES.indexOf(z) + 1}`;
  };

  const carteDeZone = (z) => {
    const verrouillee = p.niveau < z.niveauMin;
    const carte = document.createElement('div');
    carte.className = 'carte-zone' + (verrouillee ? ' verrouillee' : '');
    const bossVaincu = p.bossVaincus.includes(z.id);
    carte.innerHTML = `
      <div class="zone-emoji">${z.emoji}${verrouillee ? '<span class="cadenas-zone">🔒</span>' : ''}</div>
      <div class="zone-chapitre">${numeroChapitre(z)}</div>
      <div class="zone-nom">${z.nom} ${bossVaincu ? '🏆' : ''}</div>
      <div class="zone-plage">${z.plage} · ${texteRecommandation(p, z.niveauMin)}</div>
      <div class="zone-desc">${verrouillee ? `🔒 Atteignez le niveau ${z.niveauMin} pour entrer.` : z.desc}</div>`;
    if (!verrouillee) {
      rendreCliquable(carte, () => {
        etat.zoneCourante = z;
        rendreZone(z);
        montrerEcran('ecran-zone');
      });
    }
    return carte;
  };

  groupes.forEach(({ acte, zones }) => {
    const ouvertes = zones.filter((z) => p.niveau >= z.niveauMin);
    const fermees = zones.filter((z) => p.niveau < z.niveauMin);
    // Un acte dont aucune carte n'est accessible reste replié : inutile de
    // faire défiler dix cartes verrouillées avant d'atteindre les siennes.
    const toutFerme = ouvertes.length === 0;

    const bloc = document.createElement('section');
    bloc.className = 'acte-monde' + (toutFerme ? ' acte-verrouille' : '');

    // La progression de l'acte se lit d'un coup d'œil : ses boss couchés.
    const trophees = zones.filter((z) => p.bossVaincus.includes(z.id)).length;

    const entete = document.createElement('button');
    entete.type = 'button';
    entete.className = 'acte-entete';
    entete.setAttribute('aria-expanded', String(!toutFerme));
    entete.innerHTML = `
      <span class="acte-identite">
        <span class="acte-titre">${acte.emoji} ${acte.nom}</span>
        <span class="acte-resume">${acte.resume}</span>
      </span>
      <span class="acte-plage">${acte.plage} · ${zones.length} carte${zones.length > 1 ? 's' : ''}${
        trophees ? ` · 🏆 ${trophees}/${zones.length}` : ''}${
        fermees.length ? ` · ${fermees.length} 🔒` : ''}</span>
      <span class="acte-chevron">${toutFerme ? '▸' : '▾'}</span>`;

    const contenu = document.createElement('div');
    contenu.className = 'acte-cartes grille-zones';
    if (toutFerme) contenu.classList.add('cache');
    zones.forEach((z) => contenu.appendChild(carteDeZone(z)));

    entete.addEventListener('click', () => {
      const replie = contenu.classList.toggle('cache');
      entete.setAttribute('aria-expanded', String(!replie));
      entete.querySelector('.acte-chevron').textContent = replie ? '▸' : '▾';
    });

    bloc.appendChild(entete);
    bloc.appendChild(contenu);
    zone.appendChild(bloc);
  });

  // La Tour Sans Fin : combats enchaînés sans repos, de plus en plus durs.
  const tourVerrouillee = p.niveau < 3;
  const tour = document.createElement('div');
  tour.className = 'carte-zone tour-sans-fin' + (tourVerrouillee ? ' verrouillee' : '');
  tour.innerHTML = `
    <div class="zone-emoji">🗼${tourVerrouillee ? '<span class="cadenas-zone">🔒</span>' : ''}</div>
    <div class="zone-nom">Tour Sans Fin ${p.tourMax > 0 ? `· record : étage ${p.tourMax}` : ''}</div>
    <div class="zone-plage">défi — expédition solo ou locale · ${texteRecommandation(p, 3)}</div>
    <div class="zone-desc">${tourVerrouillee
    ? '🔒 Atteignez le niveau 3 pour tenter l’ascension.'
    : `Des étages infinis, aucun repos entre les combats, un butin qui grimpe à chaque palier. ⛑️ Point de sauvegarde tous les ${PALIER_SAUVEGARDE_TOUR} étages${
      palierAtteint(p, 'tour') > 0 ? ` — le vôtre : étage ${palierAtteint(p, 'tour')}` : ''}. Jusqu’où monterez-vous ?`}</div>`;
  if (!tourVerrouillee) rendreCliquable(tour, () => demarrerTour());
  zone.appendChild(tour);

  // La Tour des Boss : que des boss, avec paliers de difficulté.
  const tourBossVerrouillee = p.niveau < 10;
  const meilleurRecord = Math.max(p.tourBoss.normal, p.tourBoss.heroique, p.tourBoss.cauchemar);
  const tourBoss = document.createElement('div');
  tourBoss.className = 'carte-zone tour-sans-fin tour-des-boss' + (tourBossVerrouillee ? ' verrouillee' : '');
  tourBoss.innerHTML = `
    <div class="zone-emoji">🏯${tourBossVerrouillee ? '<span class="cadenas-zone">🔒</span>' : ''}</div>
    <div class="zone-nom">Tour des Boss ${meilleurRecord > 0 ? `· record : étage ${meilleurRecord}` : ''}</div>
    <div class="zone-plage">défi — solo ou équipe · 3 difficultés · ${texteRecommandation(p, 10)}</div>
    <div class="zone-desc">${tourBossVerrouillee
    ? '🔒 Atteignez le niveau 10 pour défier les seigneurs des Royaumes.'
    : `Un boss par étage, du premier loup au Dévoreur de Mondes. Normal, Héroïque puis Cauchemar : chaque difficulté a son record — et son point de sauvegarde tous les ${PALIER_SAUVEGARDE_TOUR} étages.`}</div>`;
  if (!tourBossVerrouillee) rendreCliquable(tourBoss, () => ouvrirTourBoss());
  zone.appendChild(tourBoss);

  // Donjons d'histoire : aventures scénarisées à choix.
  rendreCartesDonjons(zone, p);
}

// =====================================================================
// Écran de zone
// =====================================================================
// =====================================================================
// v20 — LES CINQ MODES D'UNE CARTE
//
// « Explorer » faisait tout : combats, filons, herbes, histoires,
// champions, dépeçage. On ne savait plus ce qu'on venait chercher, et
// une carte riche en minerai se jouait exactement comme une carte riche
// en plantes — puisque tout tombait du même bouton.
//
// Chaque carte propose désormais les MÊMES cinq modes, et chaque mode a
// SA ressource :
//
//   🧭 Expédition — l'aventure : combats, histoires uniques, champions,
//                   marchand nomade, menace du boss. Aucun matériau de
//                   récolte : l'expédition rapporte de l'or et des vivres.
//   ⛏️ Miner      — filière « mine »   : pierres, minerais, cristaux
//   🌿 Récolte    — filière « plante » : plantes, fibres, étoffes
//   🔪 Chasse     — filière « peau »   : cuirs, os, dépouilles. Une battue
//                   se gagne au combat : les peaux se prennent sur la bête.
//   👑 Boss       — le maître des lieux
//
// Les trois modes de récolte lisent la MÊME table (z.recolte), filtrée
// par la famille du métier. Attribuer un matériau à un mode, c'est donc
// simplement l'ajouter à la carte : la répartition suit toute seule.
// =====================================================================
const MODES_ZONE = [
  {
    id: 'expedition', emoji: '🧭', nom: 'Expédition',
    detail: 'L’aventure : combats, histoires uniques 📜, champions ⭐, marchand nomade 🛒.',
  },
  { id: 'mine', emoji: '⛏️', nom: 'Miner', metier: 'mineur', aide: '⚠️ une embuscade est toujours possible' },
  { id: 'plante', emoji: '🌿', nom: 'Récolte', metier: 'tisseur', aide: '⚠️ une embuscade est toujours possible' },
  { id: 'peau', emoji: '🔪', nom: 'Chasse', metier: 'tanneur', aide: '⚔️ une battue : les peaux se prennent au combat' },
  { id: 'boss', emoji: '👑', nom: 'Boss' },
];

// Ce qu'un mode de récolte rapporte sur CETTE carte.
function materiauxDuMode(z, mode) {
  const metier = METIERS[mode.metier];
  if (!metier) return [];
  return (z.recolte || []).filter((e) => FAMILLE_MATERIAU[e.id] === metier.famille);
}

// Les vivres d'une trouvaille d'expédition : jamais des matériaux
// d'artisanat — ceux-là appartiennent aux trois modes de récolte.
const VIVRES_EXPEDITION = [
  { id: 'potion-soin', niveauMin: 1 },
  { id: 'potion-mana', niveauMin: 6 },
  { id: 'grande-potion-soin', niveauMin: 14 },
  { id: 'grande-potion-mana', niveauMin: 22 },
  { id: 'potion-supreme-soin', niveauMin: 38 },
  { id: 'potion-supreme-mana', niveauMin: 52 },
  { id: 'elixir-vie', niveauMin: 70 },
];

function rendreZone(z) {
  const p = persoActif();
  const explorations = p.explorations[z.id] || 0;
  const bossVaincu = p.bossVaincus.includes(z.id);
  const boss = MONSTRES[z.boss];
  etat.menaces = etat.menaces || {};
  const menace = etat.menaces[z.id];
  if (!DIFFICULTES[etat.difficulte] || !difficulteDebloquee(p, z, etat.difficulte)) {
    etat.difficulte = 'normal';
  }

  el('zone-entete').innerHTML = `
    <div class="entete-lieu">
      <h2>${z.emoji} ${z.nom} <span class="badge">${z.plage}</span> ${texteRecommandation(p, z.niveauMin)}</h2>
      <button class="btn-choix btn-compact" id="zone-retour">🗺️ Carte</button>
    </div>
    ${(() => {
    // Le chapitre et l'acte : la carte se lit comme un livre, l'écran de
    // la terre rappelle où l'on en est du récit.
    const acte = ACTES_MONDE.find((a) => a.id === z.acte);
    const chapitre = z.id === 'dernier-point' ? 'Épilogue' : `Chapitre ${ZONES.indexOf(z) + 1}`;
    return acte ? `<p class="zone-fil">${chapitre} · ${acte.emoji} ${acte.nom}</p>` : '';
  })()}
    <p class="sous-titre gauche">${z.desc}</p>
    ${menace ? `<p class="bandeau-menace">⚠️ <strong>Un très grand danger vous guette…</strong> ${boss.emoji} ${boss.nom} rôde : il peut surgir à chaque exploration. Restez sur vos gardes — ou repartez tant qu'il est temps.</p>` : ''}
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

  MODES_ZONE.forEach((mode) => {
    const bouton = document.createElement('button');
    bouton.className = `btn-action-zone mode-${mode.id}`;

    if (mode.id === 'expedition') {
      bouton.innerHTML = `<span class="action-zone-emoji">${mode.emoji}</span><strong>${mode.nom}${menace ? ' ⚠️' : ''}</strong>
        <span class="action-zone-detail">${mode.detail}${bossVaincu ? '' : ' Et le maître des lieux rôde 👑…'}</span>`;
      bouton.addEventListener('click', () => explorer(z));
    } else if (mode.id === 'boss') {
      bouton.classList.toggle('action-verrouillee', !bossVaincu);
      bouton.disabled = !bossVaincu;
      bouton.innerHTML = `<span class="action-zone-emoji">${bossVaincu ? boss.emoji : '🔒'}</span><strong>Défier ${boss.nom}</strong>
        <span class="action-zone-detail">${bossVaincu
    ? '🏆 Boss vaincu : re-combattez-le autant que vous voulez !'
    : '🔒 Vainquez-le une première fois pour débloquer le défi — il rôde quelque part dans la zone…'}</span>`;
      bouton.addEventListener('click', () => affronterBoss(z));
    } else {
      // Les trois modes de récolte : chacun ANNONCE ce qu'il rapporte ici.
      const metier = METIERS[mode.metier];
      const m = metierDe(p, mode.metier);
      const specialiste = p.metierPrincipal === mode.metier;
      const butin = materiauxDuMode(z, mode)
        .map((e) => `${OBJETS[e.id].emoji} ${OBJETS[e.id].nom}`).join(' · ');
      bouton.innerHTML = `<span class="action-zone-emoji">${mode.emoji}</span><strong>${mode.nom}</strong>
        <span class="action-zone-detail">${butin}</span>
        <span class="action-zone-meta">
          <span class="chip chip-metier">${metier.emoji} ${metier.nom} niv. ${m.niveau}${specialiste ? ' ⭐' : ''}</span>
          <span class="action-zone-aide">${mode.aide}</span>
        </span>`;
      bouton.addEventListener('click', () => (mode.id === 'peau' ? chasser(z) : recolter(z, mode.metier)));
    }
    actions.appendChild(bouton);
  });

  const infos = el('zone-infos');
  const chipsMonstres = z.monstres
    .map((cle) => `<span class="chip">${MONSTRES[cle].emoji} ${MONSTRES[cle].nom}</span>`)
    .join('');
  // Les matériaux de la carte, rangés sous le mode qui les rapporte : on
  // sait d'un coup d'œil quoi venir y chercher, et par quelle porte.
  const chipsMateriaux = MODES_ZONE.filter((mode) => mode.metier).map((mode) => {
    const metier = METIERS[mode.metier];
    const m = metierDe(p, mode.metier);
    const chips = materiauxDuMode(z, mode)
      .map((e) => `<span class="chip">${OBJETS[e.id].emoji} ${OBJETS[e.id].nom}</span>`)
      .join('');
    return `<span class="chip chip-metier">${mode.emoji} ${mode.nom} · ${metier.nom} niv. ${m.niveau}${p.metierPrincipal === mode.metier ? ' ⭐' : ''}</span>${chips
      || `<span class="chip">${OBJETS[metier.exclusif].emoji} ${OBJETS[metier.exclusif].nom} (traces)</span>`}`;
  }).join(' ');
  const histoires = HISTOIRES_ZONES[z.id] || [];
  const vues = ((p.histoiresVues || {})[z.id] || []).length;
  infos.innerHTML = `
    <div class="panneau">
      <h3>🐾 Créatures de la zone</h3>
      <div class="rangee-chips">${chipsMonstres}
        <span class="chip chip-boss">${boss.emoji} ${boss.nom} (boss)</span></div>
      <h3>🎒 Matériaux, par mode de récolte <span class="badge">🍀 la Chance enrichit la moisson</span></h3>
      <div class="rangee-chips">${chipsMateriaux}</div>
      <p class="aide">📜 Histoires découvertes ici : ${vues}/${histoires.length} · Expéditions : ${explorations}${bossVaincu ? ' · 🏆 boss vaincu — défi libre débloqué' : ''}</p>
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
    return somme + s.for + s.int + s.dex + s.vit + (s.cha || 0);
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

// v17 : l'exploration unifiée — UNE action, tous les visages de la carte.
// Combats (avec dépeçage), filons, herbes, histoires uniques, mini-boss,
// marchand, trouvailles… et la menace du boss, qui frappe sans prévenir.
function explorer(z) {
  const p = persoActif();
  p.explorations[z.id] = (p.explorations[z.id] || 0) + 1;
  progresserQuete(p, 'exploration', 1);
  sauvegarder(p);

  // ⚠️ La menace est armée : le boss peut surgir À TOUT MOMENT, au plus
  // tard 8 explorations après l'avertissement. On ne sait jamais quand.
  etat.menaces = etat.menaces || {};
  const menace = etat.menaces[z.id];
  if (menace) {
    menace.compteur++;
    if (menace.compteur >= menace.declencheA) {
      delete etat.menaces[z.id];
      const boss = MONSTRES[z.boss];
      afficherToast(`${boss.emoji} Le danger vous a trouvés !`);
      affronterBoss(z, true);
      return;
    }
  }

  // v20 : l'expédition ne récolte plus. Les filons appartiennent à Miner,
  // les herbes à Récolte, les peaux à Chasse. Ce qui reste ici, c'est
  // l'aventure — et ce qu'on trouve en chemin : de l'or et des vivres.
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
  if (tirage < 0.18) {
    // ⭐ Un mini-boss : le champion local, plus coriace, mieux garni.
    const champion = miniBossDe(z);
    afficherToast(`⭐ ${champion.emoji} ${champion.nom} vous barre la route !`);
    demarrerCombatZone(z, 'exploration', [], { monstresDef: [champion] });
    return;
  }
  if (tirage < 0.30 && evenementHistoire(z)) {
    return;
  }
  if (tirage < 0.36 && !p.bossVaincus.includes(z.id) && !etat.menaces[z.id]) {
    evenementMenaceBoss(z);
    return;
  }
  if (tirage < 0.82) {
    const cles = composerPack(z, tailleDuPack(membresEquipe()));
    demarrerCombatZone(z, 'exploration', cles);
  } else if (tirage < 0.93) {
    // 🎁 Une trouvaille : de l'or, et des vivres pour la route. Plus
    // aucun matériau de récolte — ceux-là se méritent au bon mode.
    const objets = {};
    const vivres = VIVRES_EXPEDITION.filter((v) => v.niveauMin <= z.niveauMin);
    const vivre = vivres[vivres.length - 1];
    if (vivre && Math.random() < 0.6) objets[vivre.id] = alea(1, 2);
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
      texte: 'Au détour du chemin, un coffre abandonné : de la monnaie, et de quoi tenir la route.',
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

// L'avertissement : un très grand danger approche. Rester… ou repartir ?
// S'il reste, le boss frappera au plus tard 8 explorations plus tard —
// sans prévenir.
function evenementMenaceBoss(z) {
  const boss = MONSTRES[z.boss];
  afficherButin({
    titre: '⚠️ Un très grand danger vous guette…',
    texte: `Le sol tremble. Les créatures fuient. ${boss.emoji} ${boss.nom}, le maître des lieux, a senti votre présence — il vous traque désormais. Personne ne sait quand il frappera… mais il frappera.`,
    lignes: [
      `${boss.emoji} ${boss.nom} peut surgir à CHAQUE exploration, à tout moment.`,
      '⏳ Il attaquera au plus tard dans les 8 prochaines explorations.',
      '🏃 Repartir maintenant vous met à l’abri — mais il faudra bien l’affronter un jour pour débloquer son défi.',
    ],
    retour: 'zone',
    boutons: [
      {
        texte: '⚔️ Rester malgré le danger',
        classe: 'btn-principal',
        action: () => {
          etat.menaces = etat.menaces || {};
          etat.menaces[z.id] = { compteur: 0, declencheA: alea(1, 8) };
          afficherToast(`⚠️ ${boss.nom} vous traque… Chaque pas peut être le dernier.`);
          rendreZone(z);
          montrerEcran('ecran-zone');
        },
      },
      {
        texte: '🏃 Repartir vers la carte',
        action: () => {
          afficherToast('🏃 Vous quittez la zone — le danger reste derrière vous… pour cette fois.');
          naviguer('carte');
        },
      },
    ],
  });
}

// Filon ou coin d'herboriste : on récolte (métier concerné), ou on passe.
// 🔪 LA CHASSE — le mode de la filière « peau ».
//
// Miner et Récolter se font au calme, la pioche ou le panier à la main.
// Les cuirs, eux, sont sur la bête : la chasse est donc une BATTUE. On
// piste le gibier de la carte, on l'affronte, et les dépouilles se
// dépècent sur place — automatiquement, puisque c'est tout l'objet du
// mode (voir apresVictoire).
function chasser(z) {
  const p = persoActif();
  progresserQuete(p, 'recolte', 1);
  sauvegarder(p);
  const membres = membresEquipe();
  // Une battue lève plus de gibier qu'une rencontre de hasard.
  const cles = composerPack(z, Math.max(2, Math.min(5, tailleDuPack(membres) + 1)));
  const metier = METIERS.tanneur;
  const gibier = materiauxDuMode(z, { metier: 'tanneur' })
    .map((e) => `${OBJETS[e.id].emoji} ${OBJETS[e.id].nom}`).join(', ')
    || `${OBJETS[metier.exclusif].emoji} ${OBJETS[metier.exclusif].nom}`;
  afficherToast(`🔪 La battue commence — on chasse pour : ${gibier}`);
  demarrerCombatZone(z, 'chasse', cles, {
    intro: 'Vous levez le gibier de la carte : la battue est engagée !',
  });
}

// 📜 Une histoire unique de la carte : chacune ne se vit qu'une fois.
function evenementHistoire(z) {
  const p = persoActif();
  const histoires = HISTOIRES_ZONES[z.id] || [];
  if (!histoires.length) return false;
  p.histoiresVues = p.histoiresVues || {};
  const vues = p.histoiresVues[z.id] = p.histoiresVues[z.id] || [];
  const restantes = histoires.map((h, i) => [h, i]).filter(([, i]) => !vues.includes(i));
  if (!restantes.length) return false;
  const [histoire, index] = restantes[alea(0, restantes.length - 1)];
  vues.push(index);

  const lignes = [];
  const r = histoire.recompense || {};
  const equipe = membresEquipe();
  equipe.forEach((m) => {
    if (r.po) { const gain = Math.round(r.po * multiplicateurOr(m)); m.po += gain; m.compteurs.orTotal += gain; }
    if (r.xp) gagnerXp(m, r.xp);
    if (r.soinPct) m.hp = Math.min(m.maxHp, m.hp + Math.round(m.maxHp * r.soinPct));
    if (r.materiau && OBJETS[r.materiau]) ajouterObjet(m, r.materiau, 1);
    sauvegarder(m);
  });
  if (r.po) lignes.push(`💰 ${texteGainPo(equipe, r.po)} pour chaque héros`);
  if (r.xp) lignes.push(`⭐ ${texteGainXp(equipe, r.xp)} pour chaque héros`);
  if (r.soinPct) lignes.push(`❤️ +${Math.round(r.soinPct * 100)} % de PV pour chaque héros`);
  if (r.materiau && OBJETS[r.materiau]) lignes.push(`${OBJETS[r.materiau].emoji} ${OBJETS[r.materiau].nom} ×1 pour chaque héros`);
  lignes.push(`📜 Histoire ${vues.length}/${histoires.length} ${deLaCarte(z.nom)} — chacune ne se vit qu'une fois.`);
  afficherButin({
    titre: `📜 ${histoire.titre}`,
    texte: histoire.texte,
    lignes,
    retour: 'zone',
  });
  rendreTopbar();
  return true;
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
  // L'écran de butin parle le langage des MODES, pas celui des métiers :
  // le joueur a cliqué « Récolte », il ne doit pas lire « Herboriser ».
  const mode = MODES_ZONE.find((x) => x.metier === idMetier) || MODES_ZONE[2];
  progresserQuete(p, 'recolte', 1);

  const s = statsEffectives(p);
  const multChance = multChanceDrop(chanceButin(p)); // jusqu'à ×2 avec la Chance
  const specialiste = p.metierPrincipal === idMetier;
  const multSpec = specialiste ? multSpecialite(s.cha) : 1; // ×1.3 à ×1.6 selon la Chance
  const niveauM = metierDe(p, idMetier).niveau;
  const bonusQte = Math.floor(niveauM / 3) + (specialiste ? 1 : 0); // la spécialité ajoute sa part

  // v19 : l'aube gonfle l'herboristerie et fait affleurer les filons ; la
  // pluie aide les plantes. Récolter au bon moment devient une décision.
  const multMonde = multRecolteMonde(metier.famille);
  const pool = z.recolte.filter((e) => FAMILLE_MATERIAU[e.id] === metier.famille);
  const objets = {};
  pool.forEach((entree) => {
    if (Math.random() < Math.min(0.95, entree.chance * multChance * multSpec * multMonde)) {
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
    demarrerCombatZone(z, 'embuscade', cles, { lootRecolte: objets, filiereRecolte: metier.famille });
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
      titre: `${mode.emoji} ${mode.nom} : belle moisson`,
      texte: membresEquipe().length > 1 ? 'Chaque héros remplit son sac.' : 'Vous remplissez votre sac.',
      lignes,
      retour: 'zone',
    });
  }
}

// v17 : le boss ne se DÉFIE librement qu'une fois vaincu une première
// fois — avant ça, c'est lui qui vous trouve (menace d'exploration).
function affronterBoss(z, embuscadeBoss = false) {
  const p = persoActif();
  if (!embuscadeBoss && !p.bossVaincus.includes(z.id)) return;
  // Une équipe puissante attire l'attention : le boss vient escorté.
  const escorte = bonusTaillePack(membresEquipe());
  const cles = [z.boss];
  for (let i = 0; i < escorte; i++) cles.push(z.monstres[alea(0, z.monstres.length - 1)]);
  demarrerCombatZone(z, 'boss', cles, embuscadeBoss ? {
    intro: `${MONSTRES[z.boss].emoji} ${MONSTRES[z.boss].nom} surgit — le grand danger annoncé, c'était lui !`,
  } : {});
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
    acheter.textContent = `Acheter — ${formatNombre(prixReduit)} po (au lieu de ${formatNombre(objet.prix)})`;
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
    filiereRecolte: options.filiereRecolte || null,
    intro: options.intro || null,
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
    dex: 8,
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
// v20 : quelle filière de matériaux un combat a-t-il le droit de rendre ?
//
// La règle des cinq modes vaut sur une CARTE du monde, et là seulement :
//   • une battue (Chasse) rapporte des peaux ;
//   • une embuscade rapporte la filière qu'on était en train de récolter ;
//   • une expédition et un boss de carte n'en rapportent aucune — l'un
//     paie en or et en vivres, l'autre en coffre et en trophée.
//
// Les donjons, les deux tours et le boss du monde ne sont pas des modes
// d'une carte : ils gardent leurs propres tables de butin, intactes.
// Renvoie 'toutes' quand rien n'est filtré, null quand tout l'est.
const GENRES_DE_CARTE = ['exploration', 'embuscade', 'chasse', 'boss'];

function filiereAutorisee(cb) {
  if (!GENRES_DE_CARTE.includes(cb.genre)) return 'toutes';
  if (cb.genre === 'chasse') return METIERS.tanneur.famille;
  if (cb.genre === 'embuscade') return cb.filiereRecolte || null;
  return null;
}

function tirerButinCombat(cb) {
  const difficulte = DIFFICULTES[cb.difficulte] || DIFFICULTES.normal;
  const evenement = multiplicateursEvenement();
  // La chance moyenne de l'équipe améliore les probabilités de butin.
  const chaMoyenne = cb.equipe.length
    ? cb.equipe.reduce((somme, j) => somme + chanceButin(j), 0) / cb.equipe.length
    : 0;
  let chanceEquipe = multChanceDrop(chaMoyenne);
  // Trèfles séchés : chaque héros sous statut fortune ajoute +30 % de butin.
  cb.equipe.forEach((j) => {
    if ((j.statuts || []).some((s) => s.type === 'fortune')) chanceEquipe *= 1.3;
  });
  // v19 : l'heure qu'il est compte. Le jour paie mieux, la nuit donne plus.
  // (déclaré AVANT la boucle des drops, qui s'en sert : le déclarer après
  // figeait tout écran de victoire — zone morte temporelle.)
  const monde = mondeMaintenant();
  const filiere = filiereAutorisee(cb);
  let xp = 0;
  let po = 0;
  const objets = {};
  cb.monstres.forEach((m) => {
    xp += m.xp || 0;
    if (m.po) po += alea(m.po[0], m.po[1]);
    (m.drops || []).forEach((d) => {
      // v20 : c'est le MODE qui décide de la filière ramassée, jusque
      // dans le butin des monstres. Une battue rapporte des peaux, une
      // embuscade pendant qu'on mine rapporte du minerai, et une
      // expédition ne rapporte aucun matériau d'artisanat.
      const famille = FAMILLE_MATERIAU[d.id];
      if (famille && filiere !== 'toutes' && famille !== filiere) return;
      const chanceMonde = d.chance * difficulte.drop * evenement.drop * chanceEquipe
        * (monde.effets.butin || 1);
      if (Math.random() < Math.min(1, chanceMonde)) {
        objets[d.id] = (objets[d.id] || 0) + 1;
      }
    });
  });
  xp = Math.round(xp * difficulte.xp * evenement.xp);
  po = Math.round(po * difficulte.po * evenement.po * (monde.effets.or || 1)) + (cb.orVole || 0);
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
    const rarete = tirerRarete(chanceButin(p));
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
// v22 — LES POINTS DE SAUVEGARDE DES TOURS.
//
// CE QUI N'ALLAIT PAS. Les tours d'exploration se grimpent sans repos
// jusqu'à la mort. C'est leur règle, et elle est bonne — mais elle
// signifiait aussi que tomber à l'étage 47 renvoyait à l'étage 1. Deux
// heures d'ascension effacées, et la seule façon de progresser était de
// refaire chaque fois les quarante premiers étages, qui ne présentent plus
// aucun danger. Le mode s'auto-sabotait.
//
// LA RÈGLE DE LA v22. Tous les DIX étages, un palier de repos : l'équipe
// souffle (PV et PM rendus) et le palier est gravé sur chaque héros. Une
// ascension suivante peut repartir de là — ou du bas, pour ceux qui
// veulent la course complète. Entre deux paliers, rien ne change : aucun
// soin, aucune pitié.
//
// Les trois escaliers du jeu suivent la même règle : Tour Sans Fin, Tour
// des Boss (un palier par difficulté) et Ascension éternelle (un palier
// par épopée). Solo comme en groupe.
// =====================================================================
const PALIER_SAUVEGARDE_TOUR = 10;

function paliersDe(p) {
  if (!p.paliersTour || typeof p.paliersTour !== 'object') {
    p.paliersTour = { tour: 0, tourBoss: { normal: 0, heroique: 0, cauchemar: 0 }, ascension: {} };
  }
  if (!p.paliersTour.tourBoss) p.paliersTour.tourBoss = { normal: 0, heroique: 0, cauchemar: 0 };
  if (!p.paliersTour.ascension) p.paliersTour.ascension = {};
  return p.paliersTour;
}

// Le dernier palier gravé pour un escalier donné. `cle` vaut 'tour',
// 'tourBoss:<difficulté>' ou 'ascension:<idDonjon>'.
function palierAtteint(p, cle) {
  const paliers = paliersDe(p);
  const [famille, detail] = cle.split(':');
  if (famille === 'tour') return paliers.tour || 0;
  if (famille === 'tourBoss') return paliers.tourBoss[detail] || 0;
  return paliers.ascension[detail] || 0;
}

function graverPalier(p, cle, etage) {
  const paliers = paliersDe(p);
  const [famille, detail] = cle.split(':');
  if (famille === 'tour') paliers.tour = Math.max(paliers.tour || 0, etage);
  else if (famille === 'tourBoss') paliers.tourBoss[detail] = Math.max(paliers.tourBoss[detail] || 0, etage);
  else paliers.ascension[detail] = Math.max(paliers.ascension[detail] || 0, etage);
}

function estPalierDeSauvegarde(etage) {
  return etage > 0 && etage % PALIER_SAUVEGARDE_TOUR === 0;
}

// Un palier franchi : on grave, on souffle, on le dit. Renvoie la ligne à
// afficher dans l'écran de butin, ou null si ce n'était pas un palier.
function franchirPalierDeSauvegarde(m, cle, etage) {
  if (!estPalierDeSauvegarde(etage)) return null;
  graverPalier(m, cle, etage);
  m.statuts = [];
  bornerVie(m);
  m.hp = m.maxHp;
  m.mp = m.maxMp;
  return `⛑️ Point de sauvegarde — étage ${etage} : ${m.avatar} ${m.nom} souffle (PV et PM rendus). La prochaine ascension pourra repartir d'ici.`;
}

// Le petit dialogue « d'où repart-on ? », commun aux trois escaliers.
// Sans palier gravé, on lance directement : pas de clic pour rien.
function demanderDepartAscension({ titre, texte, cle, lancer, retour }) {
  const p = persoActif();
  const palier = palierAtteint(p, cle);
  if (palier <= 0) { lancer(1); return; }
  afficherButin({
    titre,
    texte,
    lignes: [
      `⛑️ Point de sauvegarde le plus haut : étage ${palier}.`,
      `Un nouveau point se grave tous les ${PALIER_SAUVEGARDE_TOUR} étages — et l'équipe y reprend son souffle.`,
    ],
    retour: retour || 'carte',
    boutons: [
      {
        texte: `⛑️ Reprendre à l'étage ${palier + 1}`,
        classe: 'btn-principal',
        action: () => lancer(palier + 1),
      },
      { texte: '🗼 Repartir de l’étage 1', action: () => lancer(1) },
      { texte: '🗺️ Revenir à la carte', action: () => naviguer(retour || 'carte') },
    ],
  });
}

// =====================================================================
// La Tour Sans Fin : étages enchaînés sans repos
// =====================================================================
function zonePourEtage(etage) {
  return ZONES[Math.min(ZONES.length - 1, Math.floor((etage - 1) / 2.5))];
}

function demarrerTour() {
  demanderDepartAscension({
    titre: '🗼 La Tour Sans Fin',
    texte: 'Aucun repos entre les étages — sauf aux points de sauvegarde. D’où l’équipe part-elle ?',
    cle: 'tour',
    lancer: (etage) => {
      etat.tour = { etage };
      afficherToast(etage > 1
        ? `🗼 L’ascension reprend à l’étage ${etage} !`
        : '🗼 L’ascension commence ! Aucun repos entre les étages…');
      demarrerCombatTourEtage(etage);
    },
  });
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

// Les deux Tours alimentent la même bourse de Sceaux : monter n'importe
// quel escalier finance la Tour de l'Éveil. On ne récolte qu'à partir du
// niveau requis, sinon les Sceaux s'accumuleraient sans rien à en faire.
function recolterSceaux(m, etage, lignes) {
  if (m.niveau < NIVEAU_TOUR_EVEIL) return;
  const gain = gagnerSceaux(m, etage);
  if (m.distant) return;
  const majeur = gain.majeurs > 0 ? ' et 💠 1 Sceau Majeur' : '';
  lignes.push(`🔹 +${gain.normaux} Sceau${gain.normaux > 1 ? 'x' : ''}${majeur} — à dépenser à la Tour de l'Éveil`);
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
  lignes.push(`⭐ ${texteGainXp(membres, xpParHeros)} et 💰 ${texteGainPo(membres, poParHeros)} par héros (prime d'étage +${Math.round(etage * 12)} %)`);
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
    recolterSceaux(m, etage, lignes);

    // Palier (étages 5, 10, 15…) : coffre de la Tour + familier éventuel
    if (estPalier) {
      const s = statsEffectives(m);
      for (let i = 0; i < 2; i++) {
        const rarete = tirerRarete(chanceButin(m) + etage);
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
        if (!m.distant) {
          annoncerDeblocage({ emoji: FAMILIERS[idFamilier].emoji, titre: `Familier adopté : ${FAMILIERS[idFamilier].nom}`, texte: `${FAMILIERS[idFamilier].desc} — gardien de l'étage ${etage} de la Tour.` });
        }
      }
    }

    const niveaux = gagnerXp(m, xpParHeros);
    verifierHautsFaits(m);
    nettoyerApresCombat(m); // ne soigne pas : la Tour ne pardonne rien
    // …sauf tous les dix étages, où l'on grave le passage et où l'on souffle.
    const repos = franchirPalierDeSauvegarde(m, 'tour', etage);
    if (repos) lignes.push(repos);
    if (niveaux > 0) lignes.push(`🎉 ${m.avatar} ${m.nom} passe niveau ${m.niveau} ! PV et PM restaurés.`);
    sauvegarder(m);
  });

  const vies = membres.map((m) => `${m.avatar} ${m.hp}/${m.maxHp} PV`).join(' · ');
  afficherButin({
    titre: `🗼 Étage ${etage} vaincu !${estPalierDeSauvegarde(etage) ? ' ⛑️ Point de sauvegarde' : ''}`,
    texte: `${estPalier ? 'Un palier ! Le coffre de la Tour s’ouvre. ' : ''}${
      estPalierDeSauvegarde(etage)
        ? `L’équipe campe et repart à neuf : ${vies}.`
        : `Pas de repos : ${vies}.`}`,
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
  const palier = (cle) => {
    const p2 = palierAtteint(p, `tourBoss:${cle}`);
    return p2 > 0 ? ` · ⛑️ sauvegarde : étage ${p2}` : '';
  };
  const lignes = [
    `⚔️ Normal — record : étage ${records.normal}${palier('normal')}`,
    `🔥 Héroïque — record : étage ${records.heroique}${palier('heroique')}${records.normal >= 3 ? '' : ' · 🔒 atteignez l’étage 3 en Normal'}`,
    `💀 Cauchemar — record : étage ${records.cauchemar}${palier('cauchemar')}${records.heroique >= 3 ? '' : ' · 🔒 atteignez l’étage 3 en Héroïque'}`,
    `⛑️ Un point de sauvegarde se grave tous les ${PALIER_SAUVEGARDE_TOUR} étages, par difficulté.`,
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
  demanderDepartAscension({
    titre: `🏯 Tour des Boss — ${DIFFICULTES[difficulte].emoji} ${DIFFICULTES[difficulte].nom}`,
    texte: 'Un boss par étage, sans repos entre eux — sauf aux points de sauvegarde. D’où l’équipe part-elle ?',
    cle: `tourBoss:${difficulte}`,
    lancer: (etage) => {
      etat.tourBoss = { etage, difficulte };
      afficherToast(`🏯 Tour des Boss — ${DIFFICULTES[difficulte].emoji} ${DIFFICULTES[difficulte].nom} : étage ${etage} !`);
      demarrerCombatTourBossEtage(etage);
    },
  });
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
  const lignes = [`⭐ ${texteGainXp(membres, xpParHeros)} et 💰 ${texteGainPo(membres, poParHeros)} par héros (prime d'étage +${Math.round(etage * 15)} %)`];
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
      const rarete = tirerRarete(chanceButin(m) + etage * 2);
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
    recolterSceaux(m, etage, lignes);
    const niveaux = gagnerXp(m, xpParHeros);
    verifierHautsFaits(m);
    nettoyerApresCombat(m); // pas de soin entre les étages…
    const repos = franchirPalierDeSauvegarde(m, `tourBoss:${difficulte}`, etage);
    if (repos) lignes.push(repos);                 // …sauf tous les dix
    if (niveaux > 0) lignes.push(`🎉 ${m.avatar} ${m.nom} passe niveau ${m.niveau} ! PV et PM restaurés.`);
    sauvegarder(m);
  });

  const vies = membres.map((m) => `${m.avatar} ${m.hp}/${m.maxHp} PV`).join(' · ');
  const prochain = MONSTRES[CYCLE_TOUR_BOSS[etage % CYCLE_TOUR_BOSS.length]];
  afficherButin({
    titre: `🏯 Étage ${etage} vaincu !${estPalierDeSauvegarde(etage) ? ' ⛑️ Point de sauvegarde' : ''}`,
    texte: `${DIFFICULTES[difficulte].emoji} ${DIFFICULTES[difficulte].nom} · ${
      estPalierDeSauvegarde(etage) ? `L’équipe campe et repart à neuf : ${vies}.` : `Pas de repos : ${vies}.`}`,
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
  lignes.push(`⭐ ${texteGainXp(membres, xpParHeros)} par héros`);
  lignes.push(`💰 ${texteGainPo(membres, poParHeros)} par héros`);

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

  // ⭐ Un champion (mini-boss) vaincu laisse un petit coffre à chacun.
  if (cb.genre !== 'boss' && cb.monstres.some((m) => m.miniBoss)) {
    membres.forEach((m, i) => {
      const s = statsEffectives(m);
      const rarete = tirerRarete(chanceButin(m) + 3);
      const pool = Object.entries(OBJETS).filter(([, o]) => rareteDe(o) === rarete
        && (o.type === 'materiau' || o.type === 'consommable'
          || (o.type === 'equipement' && o.niveau <= m.niveau + 3)));
      if (pool.length) {
        const [id, o] = pool[alea(0, pool.length - 1)];
        partsObjets[i][id] = (partsObjets[i][id] || 0) + 1;
        lignes.push(`⭐ Coffre du champion : ${o.emoji} ${o.nom}${texteRarete(o)}`);
      }
    });
  }

  // v17 : premier boss de zone vaincu → le défi libre et l'Héroïque s'ouvrent.
  const premierBossDeZone = cb.genre === 'boss' && cb.zone
    && membres.some((m) => !m.distant && !m.bossVaincus.includes(cb.zone.id));

  membres.forEach((m, i) => {
    if (m.hp <= 0) m.hp = 1; // les héros KO se relèvent après la victoire
    const poGagne = Math.round(poParHeros * multiplicateurOr(m));
    m.po += poGagne;
    Object.entries(partsObjets[i]).forEach(([id, qte]) => ajouterObjet(m, id, qte));
    if (familiersGagnes[i] && !m.familiers.includes(familiersGagnes[i])) {
      m.familiers.push(familiersGagnes[i]);
      const compagnon = FAMILIERS[familiersGagnes[i]];
      if (!m.distant && compagnon) {
        annoncerDeblocage({ emoji: compagnon.emoji, titre: `Familier adopté : ${compagnon.nom}`, texte: `${compagnon.desc} — équipez-le depuis la fiche du héros.` });
      }
    }
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

  if (premierBossDeZone && typeof annoncerDeblocage === 'function') {
    const boss = MONSTRES[cb.zone.boss];
    annoncerDeblocage({
      emoji: '👑',
      titre: 'Défi du boss débloqué !',
      texte: `${boss.emoji} ${boss.nom} est vaincu : vous pouvez désormais le défier à volonté depuis ${cb.zone.nom}, autant de fois que vous le voulez.`,
    });
    annoncerDeblocage({
      emoji: '🔥',
      titre: 'Difficulté Héroïque débloquée !',
      texte: `${cb.zone.nom} s'ouvre en Héroïque : monstres renforcés, récompenses accrues.`,
    });
  }

  // v20 : le dépeçage appartient à la CHASSE, et à elle seule. Il n'est
  // plus un bouton optionnel après n'importe quel combat : c'est la
  // récolte du mode, elle tombe donc d'office et sans qu'on la demande.
  if (cb.genre === 'chasse' && cb.zone) depecerDepouilles(cb, null, lignes);

  afficherButin({
    titre: cb.genre === 'chasse' ? '🔪 Battue réussie !'
      : (cb.monstres.some((m) => m.miniBoss) ? '⭐ Champion vaincu !' : '🏆 Victoire !'),
    texte: cb.genre === 'boss' ? 'Un exploit qui restera dans les chroniques de Valciel.'
      : (cb.genre === 'chasse' ? 'Les bêtes sont à terre : on dépèce sur place.' : 'Le champ de bataille vous appartient.'),
    lignes,
    retour: 'zone',
  });
}

// 🔪 Le dépeçage : la récolte du tanneur, à même les dépouilles du combat.
// v20 : le dépeçage est la récolte du mode Chasse. Il se fait d'office
// à la fin de la battue et pousse ses lignes dans le butin — c'est la
// raison d'être du mode, plus un bonus qu'on pouvait oublier de cliquer.
function depecerDepouilles(cb, bouton, lignes) {
  if (cb.depece) return;
  cb.depece = true;
  const z = cb.zone;
  const metier = METIERS.tanneur;
  const pool = (z.recolte || []).filter((e) => FAMILLE_MATERIAU[e.id] === metier.famille);
  const nb = cb.monstres.length;
  const xpBase = alea(3, 5);
  cb.equipe.filter((m) => m.type !== 'invocation' && !m.distant).forEach((m) => {
    const s = statsEffectives(m);
    const specialiste = m.metierPrincipal === 'tanneur';
    const niveauM = metierDe(m, 'tanneur').niveau;
    const multSpec = specialiste ? multSpecialite(s.cha) : 1;
    const gains = {};
    for (let i = 0; i < nb; i++) {
      if (pool.length && Math.random() < Math.min(0.95, 0.75 * multChanceDrop(chanceButin(m)) * multSpec)) {
        const entree = pool[alea(0, pool.length - 1)];
        gains[entree.id] = (gains[entree.id] || 0) + 1 + Math.floor(niveauM / 3);
      }
    }
    const chanceExclusif = Math.min(0.9, (0.1 + niveauM * 0.04) * multChanceDrop(chanceButin(m)) * multSpec);
    if (!Object.keys(gains).length || Math.random() < chanceExclusif) {
      gains[metier.exclusif] = (gains[metier.exclusif] || 0) + 1 + (specialiste ? 1 : 0);
    }
    gagnerXpMetier(m, 'tanneur', specialiste ? xpBase * 2 : xpBase);
    Object.entries(gains).forEach(([id, qte]) => ajouterObjet(m, id, qte));
    sauvegarder(m);
    const texte = `🔪 ${m.avatar} ${m.nom} dépèce : ${Object.entries(gains)
      .map(([id, qte]) => `${OBJETS[id].emoji} ${OBJETS[id].nom} ×${qte}`).join(', ')}`;
    if (lignes) lignes.push(texte);
    else {
      const details = el('butin-details');
      if (details) {
        const div = document.createElement('div');
        div.className = 'ligne-butin';
        div.textContent = texte;
        details.appendChild(div);
      }
    }
  });
  const mProg = metierDe(persoActif(), 'tanneur');
  if (lignes) {
    lignes.push(`${metier.emoji} ${metier.nom} niv. ${mProg.niveau}${mProg.niveau < NIVEAU_MAX_METIER
      ? ` (${mProg.xp}/${seuilXpMetier(mProg.niveau)} XP)` : ' (maître)'}`);
  }
  if (bouton) {
    bouton.disabled = true;
    bouton.textContent = '🔪 Dépouilles récupérées ✓';
  }
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
  if (typeof dissiperInvocations === 'function') dissiperInvocations(cb);
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
