'use strict';

// =====================================================================
// Bourg de Valciel : boutique (achat/vente), atelier de craft, auberge.
// =====================================================================

function rendreVille() {
  const zone = el('ville-lieux');
  zone.innerHTML = '';

  const lieux = [
    {
      emoji: '🛒', nom: 'Boutique', detail: 'Armes, armures, accessoires et potions',
      action: () => { rendreBoutique(); montrerEcran('ecran-boutique'); },
    },
    {
      emoji: '⚒️', nom: 'Atelier', detail: 'Fabriquez équipements et potions avec vos matériaux',
      action: () => { rendreAtelier(); montrerEcran('ecran-atelier'); },
    },
    {
      emoji: '🏺', nom: 'Antiquaire', detail: 'Curiosités rares : accessoires anciens et objets tactiques de combat',
      action: () => { rendreAntiquaire(); montrerEcran('ecran-antiquaire'); },
    },
    {
      emoji: '🔮', nom: 'L’Arcanium', detail: 'La magie en échoppe : les 68 grimoires de compétences, chez Dame Sibylle',
      action: () => { rendreArcanium(); montrerEcran('ecran-arcanium'); },
    },
    {
      emoji: '🏰', nom: 'Guilde des Aventuriers', detail: 'Trois contrats par jour : monstres, récolte, boss…',
      action: () => { rendreGuilde(); montrerEcran('ecran-guilde'); },
    },
    {
      emoji: '🛏️', nom: 'Auberge', detail: 'Repos gratuit : PV et PM restaurés pour toute l’équipe',
      action: () => {
        membresEquipe().forEach((m) => {
          m.hp = m.maxHp;
          m.mp = m.maxMp;
          sauvegarder(m);
        });
        rendreTopbar();
        afficherToast('🛏️ Une bonne nuit de sommeil : toute l’équipe est requinquée !');
      },
    },
    {
      emoji: '🍻', nom: 'Taverne', detail: 'Chat, classement et boss du monde — avec tous les joueurs',
      action: () => naviguer('taverne'),
    },
  ];

  lieux.forEach((lieu) => {
    const carte = document.createElement('div');
    carte.className = 'carte-zone';
    carte.innerHTML = `
      <div class="zone-emoji">${lieu.emoji}</div>
      <div class="zone-nom">${lieu.nom}</div>
      <div class="zone-desc">${lieu.detail}</div>`;
    rendreCliquable(carte, lieu.action);
    zone.appendChild(carte);
  });

  const retour = document.createElement('div');
  retour.className = 'carte-zone retour';
  retour.innerHTML = `
    <div class="zone-emoji">🗺️</div>
    <div class="zone-nom">Repartir à l'aventure</div>
    <div class="zone-desc">Retour à la carte des Royaumes</div>`;
  rendreCliquable(retour, () => naviguer('carte'));
  zone.appendChild(retour);
}

// =====================================================================
// Boutique
// =====================================================================
const ONGLETS_BOUTIQUE = [
  { id: 'armes', nom: '⚔️ Armes', filtre: (o) => o.type === 'equipement' && o.slot === 'arme' },
  { id: 'armures', nom: '🛡️ Armures', filtre: (o) => o.type === 'equipement' && ['tete', 'torse', 'jambes'].includes(o.slot) },
  { id: 'accessoires', nom: '💍 Accessoires', filtre: (o) => o.type === 'equipement' && o.slot === 'accessoire' },
  { id: 'potions', nom: '🧪 Potions', filtre: (o) => o.type === 'consommable' },
  { id: 'vendre', nom: '💰 Vendre' },
];

// ---------------------------------------------------------------------
// Sous-filtres des échoppes : rareté + type contextuel, en chips.
// ---------------------------------------------------------------------
const RARETES_FILTRABLES = ['commun', 'inhabituel', 'rare', 'epique', 'legendaire', 'mythique', 'divin'];

// Sous-types proposés selon l'onglet actif.
const SOUS_TYPES = {
  armes: [
    { id: 'force', nom: '💪 Force', filtre: (o) => o.bonus && o.bonus.for != null },
    { id: 'magie', nom: '🧠 Magie', filtre: (o) => o.bonus && o.bonus.int != null },
    { id: 'agilite', nom: '🏃 Agilité', filtre: (o) => o.bonus && o.bonus.agi != null && o.bonus.for == null && o.bonus.int == null },
  ],
  armures: [
    { id: 'tete', nom: '🪖 Tête', filtre: (o) => o.slot === 'tete' },
    { id: 'torse', nom: '🥋 Torse', filtre: (o) => o.slot === 'torse' },
    { id: 'jambes', nom: '👖 Jambes', filtre: (o) => o.slot === 'jambes' },
  ],
  potions: [
    { id: 'soins', nom: '❤️ Soins', filtre: (o) => ['pv', 'soin-groupe', 'regen'].includes(o.effet.type) },
    { id: 'mana', nom: '💧 Mana', filtre: (o) => o.effet.type === 'pm' },
    { id: 'combat', nom: '💥 Tactiques', filtre: (o) => !['pv', 'pm', 'soin-groupe', 'regen'].includes(o.effet.type) },
  ],
  antiquaire: [
    { id: 'equipement', nom: '💍 Curiosités', filtre: (o) => o.type === 'equipement' },
    { id: 'consommable', nom: '🧪 Objets de combat', filtre: (o) => o.type === 'consommable' },
  ],
};

let sousFiltres = { rarete: 'tous', type: 'tous' };

function rendreChipsFiltres(conteneur, contexte, surChangement) {
  const rangee = document.createElement('div');
  rangee.className = 'rangee-chips rangee-sous-filtres';
  const types = SOUS_TYPES[contexte] || [];
  if (types.length > 0) {
    [{ id: 'tous', nom: 'Tout' }, ...types].forEach((t) => {
      const chip = document.createElement('button');
      chip.className = 'chip chip-filtre' + (sousFiltres.type === t.id ? ' active' : '');
      chip.textContent = t.nom;
      chip.addEventListener('click', () => { sousFiltres.type = t.id; surChangement(); });
      rangee.appendChild(chip);
    });
    const separateur = document.createElement('span');
    separateur.className = 'separateur-chips';
    rangee.appendChild(separateur);
  }
  [['tous', '✨ Toutes raretés'], ...RARETES_FILTRABLES.map((r) => [r, RARETES[r].nom])].forEach(([id, nom]) => {
    const chip = document.createElement('button');
    chip.className = `chip chip-filtre chip-rar-${id}` + (sousFiltres.rarete === id ? ' active' : '');
    chip.textContent = nom;
    chip.addEventListener('click', () => { sousFiltres.rarete = id; surChangement(); });
    rangee.appendChild(chip);
  });
  conteneur.appendChild(rangee);
}

function passeSousFiltres(objet, contexte) {
  if (sousFiltres.rarete !== 'tous' && rareteDe(objet) !== sousFiltres.rarete) return false;
  if (sousFiltres.type !== 'tous') {
    const type = (SOUS_TYPES[contexte] || []).find((t) => t.id === sousFiltres.type);
    if (type && !type.filtre(objet)) return false;
  }
  return true;
}

let ongletBoutique = 'armes';

function rendreBoutique() {
  const p = persoActif();
  el('boutique-po').textContent = `💰 ${p.po} po`;

  const zoneOnglets = el('boutique-onglets');
  zoneOnglets.innerHTML = '';
  ONGLETS_BOUTIQUE.forEach((onglet) => {
    const btn = document.createElement('button');
    btn.className = 'onglet' + (ongletBoutique === onglet.id ? ' actif' : '');
    btn.textContent = onglet.nom;
    btn.addEventListener('click', () => {
      ongletBoutique = onglet.id;
      sousFiltres = { rarete: 'tous', type: 'tous' }; // chaque onglet repart à neuf
      rendreBoutique();
    });
    zoneOnglets.appendChild(btn);
  });

  const contenu = el('boutique-contenu');
  contenu.innerHTML = '';

  if (ongletBoutique === 'vendre') {
    rendreVente(contenu, p);
    return;
  }

  const onglet = ONGLETS_BOUTIQUE.find((o) => o.id === ongletBoutique);
  rendreChipsFiltres(contenu, ongletBoutique, () => rendreBoutique());
  const grille = document.createElement('div');
  grille.className = 'grille-inventaire';
  // Le stock s'étoffe avec le niveau : articles jusqu'à niveau+2, aperçus
  // verrouillés jusqu'à niveau+8 pour donner envie de progresser.
  const visibles = Object.entries(OBJETS)
    .filter(([, o]) => o.prix != null && !o.vendeur && onglet.filtre(o))
    .filter(([, o]) => !o.niveau || o.niveau <= p.niveau + 8)
    .filter(([, o]) => passeSousFiltres(o, ongletBoutique))
    .sort((a, b) => (a[1].niveau || 0) - (b[1].niveau || 0) || a[1].prix - b[1].prix);
  if (visibles.length === 0) {
    contenu.insertAdjacentHTML('beforeend', '<p class="aide">Rien en rayon avec ces filtres — le marchand hausse les épaules.</p>');
  }
  visibles.forEach(([id, objet]) => {
    grille.appendChild(carteArticleBoutique(p, id, objet, () => rendreBoutique()));
  });
  contenu.appendChild(grille);
}

// Carte d'article (boutique et antiquaire) : rareté colorée, verrouillage
// par niveau, bouton d'achat.
function carteArticleBoutique(p, id, objet, apresAchat) {
  const verrouille = objet.niveau && objet.niveau > p.niveau + 2;
  const carte = document.createElement('div');
  carte.className = `carte-objet bord-rar-${rareteDe(objet)}` + (verrouille ? ' article-verrouille' : '');
  if (verrouille) {
    carte.innerHTML = `
      <div class="objet-entete">🔒 <strong>${objet.nom}</strong> ${etiquetteRarete(objet)}</div>
      <div class="objet-desc">Le marchand vous le proposera au niveau ${objet.niveau - 2}.</div>
      ${objet.bonus ? `<div class="objet-bonus">${texteBonus(objet.bonus)}</div>` : ''}`;
    return carte;
  }
  const possede = compterObjet(p, id)
    + Object.values(p.equipement).filter((e) => e === id).length;
  carte.innerHTML = `
    <div class="objet-entete">${objet.emoji} <strong>${objet.nom}</strong> ${etiquetteRarete(objet)}${possede > 0 ? ` <span class="objet-qte">×${possede} possédé${possede > 1 ? 's' : ''}</span>` : ''}</div>
    <div class="objet-desc">${objet.desc || ''}</div>
    ${objet.bonus ? `<div class="objet-bonus">${texteBonus(objet.bonus)}</div>` : ''}
    ${texteSet(objet)}
    ${objet.type === 'equipement' ? `<div class="objet-niveau ${p.niveau < objet.niveau ? 'niveau-insuffisant' : ''}">niv. ${objet.niveau} requis</div>` : ''}`;
  const acheter = document.createElement('button');
  acheter.className = 'btn-choix btn-compact btn-achat';
  acheter.textContent = `Acheter — ${objet.prix} po`;
  acheter.disabled = p.po < objet.prix;
  acheter.addEventListener('click', () => {
    if (p.po < objet.prix) return;
    p.po -= objet.prix;
    ajouterObjet(p, id);
    sauvegarder(p);
    afficherToast(`${objet.emoji} ${objet.nom} acheté !`);
    apresAchat();
    rendreTopbar();
  });
  carte.appendChild(acheter);
  return carte;
}

function rendreVente(contenu, p) {
  if (p.inventaire.length === 0) {
    const vide = document.createElement('p');
    vide.className = 'aide';
    vide.textContent = 'Rien à vendre : votre sac est vide.';
    contenu.appendChild(vide);
    return;
  }
  const note = document.createElement('p');
  note.className = 'aide';
  note.textContent = 'Les équipements et potions se revendent 40 % de leur prix ; les matériaux, à leur juste valeur.';
  contenu.appendChild(note);

  // Vente groupée des matériaux : le petit confort des grandes fortunes.
  const materiaux = p.inventaire.filter((e) => OBJETS[e.id] && OBJETS[e.id].type === 'materiau');
  if (materiaux.length > 1) {
    const total = materiaux.reduce((somme, e) => somme + prixVenteDe(e.id) * e.qte, 0);
    const toutVendre = document.createElement('button');
    toutVendre.className = 'btn-choix';
    toutVendre.textContent = `💰 Vendre tous les matériaux — ${total} po`;
    toutVendre.addEventListener('click', () => {
      materiaux.forEach((e) => {
        const gain = prixVenteDe(e.id) * e.qte;
        if (retirerObjet(p, e.id, e.qte)) p.po += gain;
      });
      sauvegarder(p);
      afficherToast(`💰 Matériaux vendus : +${total} po !`);
      rendreBoutique();
      rendreTopbar();
    });
    contenu.appendChild(toutVendre);
  }

  const grille = document.createElement('div');
  grille.className = 'grille-inventaire';
  p.inventaire.forEach((entree) => {
    const objet = OBJETS[entree.id];
    if (!objet) return;
    const prix = prixVenteDe(entree.id);
    const carte = document.createElement('div');
    carte.className = 'carte-objet';
    carte.innerHTML = `
      <div class="objet-entete">${objet.emoji} <strong>${objet.nom}</strong> <span class="objet-qte">×${entree.qte}</span></div>
      <div class="objet-desc">${objet.desc || ''}</div>`;
    const vendre = document.createElement('button');
    vendre.className = 'btn-choix btn-compact';
    vendre.textContent = `Vendre 1 — ${prix} po`;
    vendre.addEventListener('click', () => {
      if (!retirerObjet(p, entree.id, 1)) return;
      p.po += prix;
      sauvegarder(p);
      afficherToast(`${objet.emoji} ${objet.nom} vendu (+${prix} po).`);
      rendreBoutique();
      rendreTopbar();
    });
    carte.appendChild(vendre);
    grille.appendChild(carte);
  });
  contenu.appendChild(grille);
}

// =====================================================================
// Antiquaire : curiosités rares
// =====================================================================
function rendreAntiquaire() {
  const p = persoActif();
  el('antiquaire-po').textContent = `💰 ${p.po} po`;
  const zone = el('antiquaire-contenu');
  zone.innerHTML = '';
  rendreChipsFiltres(zone, 'antiquaire', () => rendreAntiquaire());
  const grille = document.createElement('div');
  grille.className = 'grille-inventaire';
  const visibles = Object.entries(OBJETS)
    .filter(([, o]) => o.vendeur === 'antiquaire')
    .filter(([, o]) => !o.niveau || o.niveau <= p.niveau + 8)
    .filter(([, o]) => passeSousFiltres(o, 'antiquaire'))
    .sort((a, b) => (a[1].niveau || 0) - (b[1].niveau || 0) || a[1].prix - b[1].prix);
  if (visibles.length === 0) {
    zone.insertAdjacentHTML('beforeend', '<p class="aide">Rien dans cette vitrine-là. « Revenez fouiller une autre étagère », sourit l’antiquaire.</p>');
  }
  visibles.forEach(([id, objet]) => {
    grille.appendChild(carteArticleBoutique(p, id, objet, () => rendreAntiquaire()));
  });
  zone.appendChild(grille);
}

// =====================================================================
// L'Arcanium : la boutique de magie — tous les grimoires de compétences
// =====================================================================
let filtreArcanium = 'tous';

// Prix d'un grimoire de compétence : selon son coût en mana et sa recharge.
function prixGrimoire(comp) {
  return 90 + (comp.coutMp || 0) * 25 + (comp.cooldown || 0) * 15;
}

function rendreArcanium() {
  const p = persoActif();
  el('arcanium-po').textContent = `💰 ${p.po} po`;
  const zone = el('arcanium-contenu');
  zone.innerHTML = '';

  const aide = document.createElement('p');
  aide.className = 'aide';
  aide.textContent = 'Chaque grimoire enseigne une compétence, ajoutée à votre grimoire personnel (et équipée s’il reste une place parmi vos 8 actives). Les compétences signatures des classes ne s’achètent pas — elles se méritent à la création.';
  zone.appendChild(aide);

  // Sous-filtres par école de compétence
  const rangee = document.createElement('div');
  rangee.className = 'rangee-chips rangee-sous-filtres';
  [['tous', '✨ Toutes'], ...Object.entries(CATEGORIES)].forEach(([id, nom]) => {
    const chip = document.createElement('button');
    chip.className = 'chip chip-filtre' + (filtreArcanium === id ? ' active' : '');
    chip.textContent = nom;
    chip.addEventListener('click', () => { filtreArcanium = id; rendreArcanium(); });
    rangee.appendChild(chip);
  });
  zone.appendChild(rangee);

  const stats = statsEffectives(p);
  const inconnues = Object.entries(COMPETENCES)
    .filter(([id, comp]) => !p.grimoire.includes(id) && !comp.classe)
    .filter(([, comp]) => filtreArcanium === 'tous' || comp.categorie === filtreArcanium)
    .sort((a, b) => prixGrimoire(a[1]) - prixGrimoire(b[1]));
  if (inconnues.length === 0) {
    const fini = document.createElement('p');
    fini.className = 'aide';
    fini.textContent = '📚 Plus rien à apprendre dans cette école : Dame Sibylle s’incline bien bas.';
    zone.appendChild(fini);
    return;
  }
  const grille = document.createElement('div');
  grille.className = 'grille-competences';
  inconnues.forEach(([id, comp]) => {
    const carte = carteCompetence(id, comp, { stats });
    const prix = prixGrimoire(comp);
    const acheter = document.createElement('button');
    acheter.className = 'btn-choix btn-compact btn-achat';
    acheter.textContent = `📖 Étudier — ${prix} po`;
    acheter.disabled = p.po < prix;
    acheter.addEventListener('click', () => {
      if (p.po < prix || p.grimoire.includes(id)) return;
      p.po -= prix;
      apprendreCompetence(p, id);
      sauvegarder(p);
      afficherToast(`${comp.emoji} ${comp.nom} apprise ! ${p.competences.includes(id) ? 'Elle est équipée.' : 'Elle attend dans votre grimoire.'}`);
      rendreArcanium();
      rendreTopbar();
    });
    carte.appendChild(acheter);
    grille.appendChild(carte);
  });
  zone.appendChild(grille);
}

// =====================================================================
// Guilde des Aventuriers : contrats journaliers
// =====================================================================
function rendreGuilde() {
  const p = persoActif();
  normaliserPerso(p); // régénère les contrats si la date a changé
  const zone = el('guilde-contenu');
  zone.innerHTML = '';

  const intro = document.createElement('p');
  intro.className = 'sous-titre';
  intro.textContent = '« Trois contrats par jour, aventurier. Le tableau est remis à zéro chaque matin. »';
  zone.appendChild(intro);

  p.quetes.liste.forEach((quete) => {
    const complete = quete.fait >= quete.requis;
    const carte = document.createElement('div');
    carte.className = 'panneau carte-contrat' + (quete.reclamee ? ' contrat-reclame' : '');
    const pct = Math.round((quete.fait / quete.requis) * 100);
    carte.innerHTML = `
      <div class="objet-entete">${quete.emoji} <strong>${quete.texte}</strong>
        ${quete.reclamee ? '<span class="objet-qte">✔ récompense empochée</span>' : ''}</div>
      <div class="barre contrat"><div class="remplissage" style="width:${pct}%"></div>
        <span>${quete.fait} / ${quete.requis}</span></div>
      <div class="objet-bonus">🎁 ${quete.recompense.po} po · ⭐ ${quete.recompense.xp} XP${quete.recompense.coffre ? ' · 🎁 un objet surprise' : ''}</div>`;
    if (!quete.reclamee) {
      const reclamer = document.createElement('button');
      reclamer.className = complete ? 'btn-principal btn-compact' : 'btn-choix btn-compact';
      reclamer.textContent = complete ? '🎉 Réclamer la récompense' : 'Contrat en cours…';
      reclamer.disabled = !complete;
      reclamer.addEventListener('click', () => reclamerQuete(p, quete));
      carte.appendChild(reclamer);
    }
    zone.appendChild(carte);
  });

  const note = document.createElement('p');
  note.className = 'aide';
  note.textContent = `📜 Contrats remplis en tout : ${p.compteurs.quetes}. Les hauts faits de la Guilde attendent les plus assidus.`;
  zone.appendChild(note);
}

function reclamerQuete(p, quete) {
  if (quete.reclamee || quete.fait < quete.requis) return;
  quete.reclamee = true;
  p.compteurs.quetes++;
  const poGagne = Math.round(quete.recompense.po * multiplicateurOr(p));
  p.po += poGagne;
  p.compteurs.orTotal += poGagne;
  const lignes = [`💰 +${poGagne} po`, `⭐ +${quete.recompense.xp} XP`];
  // Le grand contrat du jour offre un objet tiré selon la chance.
  if (quete.recompense.coffre) {
    const s = statsEffectives(p);
    const rarete = tirerRarete(s.cha + 5);
    const pool = Object.entries(OBJETS).filter(([, o]) => rareteDe(o) === rarete
      && (o.type === 'materiau' || o.type === 'consommable'
        || (o.type === 'equipement' && o.niveau <= p.niveau + 3)));
    if (pool.length) {
      const [id, objet] = pool[alea(0, pool.length - 1)];
      ajouterObjet(p, id, 1);
      lignes.push(`${objet.emoji} ${objet.nom}${texteRarete(objet)}`);
    }
  }
  const niveaux = gagnerXp(p, quete.recompense.xp);
  if (niveaux > 0) {
    p.hp = p.maxHp;
    p.mp = p.maxMp;
    lignes.push(`🎉 ${p.nom} passe niveau ${p.niveau} !`);
  }
  verifierHautsFaits(p);
  sauvegarder(p);
  afficherToast(`🏰 Contrat honoré : ${lignes.join(' · ')}`);
  rendreGuilde();
  rendreTopbar();
}

// =====================================================================
// Atelier de craft
// =====================================================================
let filtresAtelier = { type: 'tous', realisables: false };

// Catégorie d'une recette selon l'objet produit.
function categorieRecette(recette) {
  const objet = OBJETS[recette.resultat];
  if (objet.type === 'consommable') return 'potions';
  if (objet.slot === 'arme') return 'armes';
  if (['tete', 'torse', 'jambes'].includes(objet.slot)) return 'armures';
  return 'accessoires';
}

function recetteRealisable(p, recette) {
  return p.niveau >= recette.niveau && p.po >= recette.po
    && Object.entries(recette.materiaux).every(([id, qte]) => compterObjet(p, id) >= qte);
}

function rendreAtelier() {
  const p = persoActif();
  el('atelier-po').textContent = `💰 ${p.po} po`;
  const zone = el('atelier-recettes');
  zone.innerHTML = '';

  // Sous-filtres : catégorie du résultat + « réalisables maintenant »
  const rangee = document.createElement('div');
  rangee.className = 'rangee-chips rangee-sous-filtres';
  [['tous', 'Tout'], ['potions', '🧪 Potions'], ['armes', '⚔️ Armes'], ['armures', '🛡️ Armures'], ['accessoires', '💍 Accessoires']]
    .forEach(([id, nom]) => {
      const chip = document.createElement('button');
      chip.className = 'chip chip-filtre' + (filtresAtelier.type === id ? ' active' : '');
      chip.textContent = nom;
      chip.addEventListener('click', () => { filtresAtelier.type = id; rendreAtelier(); });
      rangee.appendChild(chip);
    });
  const separateur = document.createElement('span');
  separateur.className = 'separateur-chips';
  rangee.appendChild(separateur);
  const chipRealisables = document.createElement('button');
  chipRealisables.className = 'chip chip-filtre' + (filtresAtelier.realisables ? ' active' : '');
  chipRealisables.textContent = '✅ Réalisables maintenant';
  chipRealisables.addEventListener('click', () => {
    filtresAtelier.realisables = !filtresAtelier.realisables;
    rendreAtelier();
  });
  rangee.appendChild(chipRealisables);
  zone.appendChild(rangee);

  // L'établi ne montre que les recettes proches du niveau du héros ;
  // le reste se débloque en progressant.
  const proches = RECETTES.filter((recette) => recette.niveau <= p.niveau + 2);
  const cachees = RECETTES.length - proches.length;
  const visibles = proches
    .filter((recette) => filtresAtelier.type === 'tous' || categorieRecette(recette) === filtresAtelier.type)
    .filter((recette) => !filtresAtelier.realisables || recetteRealisable(p, recette));
  if (visibles.length === 0) {
    zone.insertAdjacentHTML('beforeend', '<p class="aide">Aucune recette ne correspond à ces filtres pour l’instant.</p>');
  }

  visibles.forEach((recette) => {
    const objet = OBJETS[recette.resultat];
    const niveauOk = p.niveau >= recette.niveau;
    const carte = document.createElement('div');
    carte.className = `carte-recette bord-rar-${rareteDe(objet)}` + (niveauOk ? '' : ' verrouillee');

    let materiauxOk = true;
    const listeMateriaux = Object.entries(recette.materiaux).map(([id, qte]) => {
      const possede = compterObjet(p, id);
      const ok = possede >= qte;
      if (!ok) materiauxOk = false;
      return `<span class="ingredient ${ok ? 'ok' : 'manque'}">${OBJETS[id].emoji} ${OBJETS[id].nom} ${possede}/${qte}</span>`;
    }).join('');

    const orOk = p.po >= recette.po;
    carte.innerHTML = `
      <div class="objet-entete">${objet.emoji} <strong>${objet.nom}</strong> ${etiquetteRarete(objet)}</div>
      ${objet.bonus ? `<div class="objet-bonus">${texteBonus(objet.bonus)}</div>` : `<div class="objet-desc">${objet.desc || ''}</div>`}
      ${!niveauOk ? `<div class="objet-niveau niveau-insuffisant">niv. ${recette.niveau} requis</div>` : ''}
      <div class="ingredients">${listeMateriaux}
        <span class="ingredient ${orOk ? 'ok' : 'manque'}">💰 ${recette.po} po</span></div>`;

    const fabriquer = document.createElement('button');
    fabriquer.className = 'btn-choix btn-compact';
    fabriquer.textContent = '⚒️ Fabriquer';
    fabriquer.disabled = !(niveauOk && materiauxOk && orOk);
    fabriquer.addEventListener('click', () => {
      if (!(p.niveau >= recette.niveau && p.po >= recette.po)) return;
      const possible = Object.entries(recette.materiaux).every(([id, qte]) => compterObjet(p, id) >= qte);
      if (!possible) return;
      Object.entries(recette.materiaux).forEach(([id, qte]) => retirerObjet(p, id, qte));
      p.po -= recette.po;
      ajouterObjet(p, recette.resultat);
      p.compteurs.crafts++;
      progresserQuete(p, 'craft', 1);
      verifierHautsFaits(p);
      sauvegarder(p);
      afficherToast(`⚒️ ${objet.emoji} ${objet.nom} fabriqué !`);
      rendreAtelier();
      rendreTopbar();
    });
    carte.appendChild(fabriquer);
    zone.appendChild(carte);
  });

  if (cachees > 0) {
    const note = document.createElement('p');
    note.className = 'aide';
    note.textContent = `🔒 ${cachees} recette${cachees > 1 ? 's' : ''} de plus haut niveau attendent que vous progressiez…`;
    zone.appendChild(note);
  }
}
