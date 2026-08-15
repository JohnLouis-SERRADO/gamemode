'use strict';

// =====================================================================
// Bourg de Valciel (v12) : la ville est découpée en quartiers — trois
// boutiques spécialisées, quatre ateliers d'artisans, et la grand-place.
// =====================================================================

// Les trois boutiques partagent le même écran, chacune avec sa vitrine.
const BOUTIQUES = {
  armes: {
    emoji: '🗡️', nom: 'À la Bonne Lame', titre: '🗡️ Armurerie « À la Bonne Lame »',
    detail: 'L’armurerie du bourg : armes du commun au légendaire (mythique et divin se méritent)',
    accueil: '« Une lame pour chaque bras, un prix pour chaque bourse. Le mythique ? Ça ne s’achète pas, ça se gagne. » — maître Brisefer',
    onglets: ['armes', 'vendre'],
  },
  armures: {
    emoji: '🛡️', nom: 'Le Bastion', titre: '🛡️ Halle d’armures « Le Bastion »',
    detail: 'Casques, cuirasses, gantelets, jambières et bottes — des pieds à la tête',
    accueil: '« Revenez entier, on fait aussi les retouches. » — dame Ferraille',
    onglets: ['armures', 'vendre'],
  },
  bazar: {
    emoji: '💍', nom: 'Le Bazar Étincelant', titre: '💍 « Le Bazar Étincelant »',
    detail: 'Accessoires, potions et fioles de voyage — tout ce qui brille ou pétille',
    accueil: '« Touchez avec les yeux, achetez avec le cœur. » — Zibeline',
    onglets: ['accessoires', 'potions', 'vendre'],
  },
};

function ouvrirBoutique(idBoutique) {
  boutiqueCourante = idBoutique;
  ongletBoutique = BOUTIQUES[idBoutique].onglets[0];
  sousFiltres = { rarete: 'tous', type: 'tous' };
  rendreBoutique();
  montrerEcran('ecran-boutique');
}

function rendreVille() {
  const zone = el('ville-lieux');
  zone.innerHTML = '';

  const quartiers = [
    {
      titre: '🏪 Le quartier marchand',
      note: 'Trois vitrines spécialisées, une échoppe de curiosités et la magie en rayon.',
      lieux: [
        ...Object.entries(BOUTIQUES).map(([id, b]) => ({
          emoji: b.emoji, nom: b.nom, detail: b.detail,
          action: () => ouvrirBoutique(id),
        })),
        {
          emoji: '🏺', nom: 'Antiquaire', detail: 'Curiosités rares : accessoires anciens et objets tactiques de combat',
          action: () => { rendreAntiquaire(); montrerEcran('ecran-antiquaire'); },
        },
        {
          emoji: '🔮', nom: 'L’Arcanium', detail: 'La magie en échoppe : les grimoires de compétences, chez Dame Sibylle',
          action: () => { rendreArcanium(); montrerEcran('ecran-arcanium'); },
        },
      ],
    },
    {
      titre: '⚒️ La cour des artisans',
      note: 'Quatre maîtres, sept raretés (jusqu’au Divin ✨) et les panoplies à bonus passifs : le vrai grand équipement se FABRIQUE ici, selon votre niveau.',
      lieux: Object.entries(ARTISANS).map(([id, a]) => ({
        emoji: a.emoji, nom: a.nom, detail: a.detail,
        action: () => ouvrirAtelier(id),
      })),
    },
    {
      titre: '🧺 La halle aux matières',
      note: 'Trois fournisseurs : TOUS les matériaux de craft (bruts, raffinés, signatures) selon votre niveau — à prix fournisseur, car récolter reste la voie du malin.',
      lieux: Object.entries(FOURNISSEURS).map(([id, f]) => ({
        emoji: f.emoji, nom: f.nom, detail: f.detail,
        action: () => ouvrirFournisseur(id),
      })),
    },
    {
      titre: '🏛️ La grand-place',
      note: 'Contrats, repos et rumeurs : le cœur battant du bourg.',
      lieux: [
        {
          emoji: '🏰', nom: 'Guilde des Aventuriers', detail: 'Six contrats au tableau, trois récompenses par jour',
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
      ],
    },
  ];

  quartiers.forEach((quartier) => {
    const separateur = document.createElement('div');
    separateur.className = 'separateur-donjons separateur-quartier';
    separateur.innerHTML = `<strong>${quartier.titre}</strong> — ${quartier.note}`;
    zone.appendChild(separateur);
    quartier.lieux.forEach((lieu) => {
      const carte = document.createElement('div');
      carte.className = 'carte-zone';
      carte.innerHTML = `
        <div class="zone-emoji">${lieu.emoji}</div>
        <div class="zone-nom">${lieu.nom}</div>
        <div class="zone-desc">${lieu.detail}</div>`;
      rendreCliquable(carte, lieu.action);
      zone.appendChild(carte);
    });
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
  { id: 'armures', nom: '🛡️ Armures', filtre: (o) => o.type === 'equipement' && ['tete', 'torse', 'mains', 'jambes', 'pieds'].includes(o.slot) },
  { id: 'accessoires', nom: '💍 Accessoires', filtre: (o) => o.type === 'equipement' && o.slot === 'accessoire' },
  { id: 'potions', nom: '🧪 Potions', filtre: (o) => o.type === 'consommable' },
  { id: 'vendre', nom: '💰 Vendre' },
];

// ---------------------------------------------------------------------
// Sous-filtres des échoppes : rareté + type contextuel, en chips.
// ---------------------------------------------------------------------
const RARETES_FILTRABLES = ['commun', 'inhabituel', 'rare', 'epique', 'legendaire', 'mythique', 'divin'];

// Sous-types proposés selon l'onglet actif.
// (le contexte 'vente' est branché plus bas, après sa définition)
const SOUS_TYPES = {
  armes: [
    { id: 'force', nom: '💪 Force', filtre: (o) => o.bonus && o.bonus.for != null },
    { id: 'magie', nom: '🧠 Magie', filtre: (o) => o.bonus && o.bonus.int != null },
    { id: 'agilite', nom: '🏃 Agilité', filtre: (o) => o.bonus && o.bonus.agi != null && o.bonus.for == null && o.bonus.int == null },
  ],
  armures: [
    { id: 'tete', nom: '🪖 Tête', filtre: (o) => o.slot === 'tete' },
    { id: 'torse', nom: '🥋 Torse', filtre: (o) => o.slot === 'torse' },
    { id: 'mains', nom: '🧤 Mains', filtre: (o) => o.slot === 'mains' },
    { id: 'jambes', nom: '👖 Jambes', filtre: (o) => o.slot === 'jambes' },
    { id: 'pieds', nom: '🥾 Pieds', filtre: (o) => o.slot === 'pieds' },
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
let boutiqueCourante = 'armes';

function rendreBoutique() {
  const p = persoActif();
  const config = BOUTIQUES[boutiqueCourante];
  el('boutique-titre').textContent = config.titre;
  el('boutique-accueil').textContent = config.accueil;
  el('boutique-po').textContent = `💰 ${p.po} po`;

  const zoneOnglets = el('boutique-onglets');
  zoneOnglets.innerHTML = '';
  ONGLETS_BOUTIQUE.filter((o) => config.onglets.includes(o.id)).forEach((onglet) => {
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

// v17 : la vente affiche TOUTES les infos des objets (rareté, bonus,
// panoplie, niveau) et se filtre comme les rayons d'achat.
const SOUS_TYPES_VENTE = [
  { id: 'equipement', nom: '⚔️ Équipements', filtre: (o) => o.type === 'equipement' },
  { id: 'consommable', nom: '🧪 Consommables', filtre: (o) => o.type === 'consommable' },
  { id: 'materiau', nom: '⛏️ Matériaux', filtre: (o) => o.type === 'materiau' },
];
SOUS_TYPES.vente = SOUS_TYPES_VENTE;

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
  rendreChipsFiltres(contenu, 'vente', () => rendreBoutique());

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
  const visibles = p.inventaire.filter((entree) => {
    const objet = OBJETS[entree.id];
    return objet && passeSousFiltres(objet, 'vente');
  });
  if (visibles.length === 0) {
    contenu.insertAdjacentHTML('beforeend', '<p class="aide">Rien dans le sac ne correspond à ces filtres.</p>');
  }
  visibles.forEach((entree) => {
    const objet = OBJETS[entree.id];
    const prix = prixVenteDe(entree.id);
    const carte = document.createElement('div');
    carte.className = `carte-objet bord-rar-${rareteDe(objet)}`;
    carte.innerHTML = `
      <div class="objet-entete">${objet.emoji} <strong>${objet.nom}</strong> ${etiquetteRarete(objet)} <span class="objet-qte">×${entree.qte}</span></div>
      <div class="objet-desc">${objet.desc || ''}</div>
      ${objet.bonus ? `<div class="objet-bonus">${texteBonus(objet.bonus)}</div>` : ''}
      ${texteSet(objet)}
      ${objet.type === 'equipement' ? `<div class="objet-niveau">niv. ${objet.niveau} requis</div>` : ''}`;
    const rangee = document.createElement('div');
    rangee.className = 'rangee-boutons';
    [[1, `Vendre 1 — ${prix} po`], [entree.qte, `Tout — ${formatNombre(prix * entree.qte)} po`]].forEach(([qte, libelle], index) => {
      if (index === 1 && entree.qte < 2) return;
      const vendre = document.createElement('button');
      vendre.className = 'btn-choix btn-compact';
      vendre.textContent = libelle;
      vendre.addEventListener('click', () => {
        const vendu = Math.min(qte, compterObjet(p, entree.id));
        if (vendu <= 0 || !retirerObjet(p, entree.id, vendu)) return;
        p.po += prix * vendu;
        sauvegarder(p);
        afficherToast(`${objet.emoji} ${objet.nom} ×${vendu} vendu (+${formatNombre(prix * vendu)} po).`);
        rendreBoutique();
        rendreTopbar();
      });
      rangee.appendChild(vendre);
    });
    carte.appendChild(rangee);
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
// v16.1 : la halle aux matières — trois fournisseurs de matériaux de
// craft, un par filière de récolte. Les prix piquent (4× la valeur de
// rachat) : récolter reste la voie du malin, acheter celle du pressé.
// Les matériaux SIGNATURES ne s'y vendent jamais — c'est la fierté des
// spécialistes (récolte… ou comptoir des joueurs).
// =====================================================================
const FOURNISSEURS = {
  mine: {
    emoji: '⛏️', nom: 'La Minière', titre: '⛏️ Comptoir minier « La Minière »',
    detail: 'Pierres, minerais et cristaux au détail — la montagne mise en rayon',
    accueil: '« La montagne donne à qui paie comptant. » — Grive la Prospectrice',
    famille: 'mine',
  },
  peau: {
    emoji: '🐾', nom: 'Le Séchoir', titre: '🐾 Négoce de dépouilles « Le Séchoir »',
    detail: 'Peaux, os et plumes pendus aux poutres — la chasse vendue au poids',
    accueil: '« Tout ce qui court, rampe ou vole finit ici un jour. » — le Vieux Marloux',
    famille: 'peau',
  },
  plante: {
    emoji: '🌿', nom: 'L’Herboristerie', titre: '🌿 « L’Herboristerie des Brumes »',
    detail: 'Plantes, fibres et étoffes rares — cueillies, séchées, étiquetées',
    accueil: '« Chaque feuille a son usage, et chaque usage a son prix. » — Mélisse',
    famille: 'plante',
  },
};

let fournisseurCourant = 'mine';
let NIVEAU_MATERIAU = null;

// À quel niveau de héros un matériau devient-il « de votre monde » ?
// On prend la zone la plus accessible qui le donne (récolte ou butin) —
// et pour les raffinés, le niveau de leur recette d'atelier.
function niveauMateriau(id) {
  if (!NIVEAU_MATERIAU) {
    NIVEAU_MATERIAU = {};
    const noter = (idMat, niveau) => {
      if (NIVEAU_MATERIAU[idMat] == null || niveau < NIVEAU_MATERIAU[idMat]) NIVEAU_MATERIAU[idMat] = niveau;
    };
    ZONES.forEach((z) => {
      (z.recolte || []).forEach((e) => noter(e.id, z.niveauMin));
      [...(z.monstres || []), z.boss].forEach((cle) => {
        ((MONSTRES[cle] || {}).drops || []).forEach((d) => noter(d.id, z.niveauMin));
      });
    });
    // Les matériaux raffinés (fabriqués à l'atelier) suivent leur recette.
    RECETTES.forEach((recette) => {
      const objet = OBJETS[recette.resultat];
      if (objet && objet.type === 'materiau') noter(recette.resultat, recette.niveau);
    });
  }
  return NIVEAU_MATERIAU[id] || 1;
}

function prixAchatMateriau(id) {
  // Les matériaux signatures des métiers se paient au prix fort (6×) :
  // les récolter reste infiniment plus malin.
  const signature = Object.values(SIGNATURE_FILIERE).includes(id);
  return Math.max(4, prixVenteDe(id) * (signature ? 6 : 4));
}

function ouvrirFournisseur(idFournisseur) {
  fournisseurCourant = idFournisseur;
  sousFiltres = { rarete: 'tous', type: 'tous' };
  rendreFournisseur();
  montrerEcran('ecran-fournisseur');
}

function rendreFournisseur() {
  const p = persoActif();
  const f = FOURNISSEURS[fournisseurCourant];
  el('fournisseur-titre').textContent = f.titre;
  el('fournisseur-po').textContent = `💰 ${formatNombre(p.po)} po`;
  const zone = el('fournisseur-contenu');
  zone.innerHTML = `<p class="sous-titre gauche">${f.accueil}</p>
    <p class="aide">Prix fournisseur : <strong>4× la valeur de rachat</strong> — la récolte reste la voie du malin. Le comptoir reprend aussi vos surplus de la filière, au prix plein.</p>`;

  // v17 : filtre de rareté sur l'étal du fournisseur.
  rendreChipsFiltres(zone, null, () => rendreFournisseur());
  const grille = document.createElement('div');
  grille.className = 'grille-inventaire';
  const signature = SIGNATURE_FILIERE[f.famille];
  // v17 : TOUT ce qui sert au craft s'achète — bruts, raffinés et même
  // les signatures (au prix fort, niveau 20+), selon le niveau du joueur.
  Object.entries(OBJETS)
    .filter(([id, o]) => o.type === 'materiau' && FAMILLE_MATERIAU[id] === f.famille)
    .filter(([, o]) => passeSousFiltres(o, null))
    .sort((a, b) => niveauMateriau(a[0]) - niveauMateriau(b[0]) || prixVenteDe(a[0]) - prixVenteDe(b[0]))
    .forEach(([id, objet]) => {
      const estSignature = id === signature;
      const niveau = estSignature ? Math.max(20, niveauMateriau(id)) : niveauMateriau(id);
      const verrouille = niveau > p.niveau;
      const prix = prixAchatMateriau(id);
      const possede = compterObjet(p, id);
      const carte = document.createElement('div');
      carte.className = `carte-objet bord-rar-${rareteDe(objet)}` + (verrouille ? ' article-verrouille' : '');
      carte.innerHTML = `
        <div class="objet-entete">${verrouille ? '🔒 ' : ''}${objet.emoji} <strong>${objet.nom}</strong> ${etiquetteRarete(objet)}</div>
        <div class="objet-desc">${objet.desc || ''}${estSignature ? ' <em>(fierté des spécialistes : prix fort, 6× la valeur)</em>' : ''}</div>
        <div class="objet-niveau${verrouille ? ' niveau-insuffisant' : ''}">niv. ${niveau}${verrouille ? ` — revenez au niveau ${niveau}` : ''} · en sac : ${possede}</div>`;
      if (!verrouille) {
        const rangee = document.createElement('div');
        rangee.className = 'rangee-boutons';
        [[1, `Acheter — ${formatNombre(prix)} po`], [5, `×5 — ${formatNombre(prix * 5)} po`]].forEach(([qte, libelle]) => {
          const btn = document.createElement('button');
          btn.className = 'btn-choix btn-compact' + (qte === 1 ? ' btn-achat' : '');
          btn.textContent = libelle;
          btn.disabled = p.po < prix * qte;
          btn.addEventListener('click', () => {
            if (p.po < prix * qte) return;
            p.po -= prix * qte;
            ajouterObjet(p, id, qte);
            sauvegarder(p);
            afficherToast(`${objet.emoji} ${objet.nom} ×${qte} pour ${formatNombre(prix * qte)} po.`);
            rendreFournisseur();
            rendreTopbar();
          });
          rangee.appendChild(btn);
        });
        carte.appendChild(rangee);
      }
      grille.appendChild(carte);
    });
  zone.appendChild(grille);

  // Rachat : le fournisseur reprend les matériaux de SA filière.
  const aRacheter = p.inventaire
    .filter((e) => e.qte > 0 && OBJETS[e.id] && OBJETS[e.id].type === 'materiau' && FAMILLE_MATERIAU[e.id] === f.famille);
  const titreVente = document.createElement('h3');
  titreVente.className = 'titre-grimoire';
  titreVente.textContent = `💰 ${f.nom} rachète vos matériaux`;
  zone.appendChild(titreVente);
  if (aRacheter.length === 0) {
    zone.insertAdjacentHTML('beforeend', '<p class="aide">Rien de la filière dans votre sac pour le moment — la récolte vous tend les bras.</p>');
    return;
  }
  const grilleVente = document.createElement('div');
  grilleVente.className = 'grille-inventaire';
  aRacheter.forEach((entree) => {
    const objet = OBJETS[entree.id];
    const prixUnite = prixVenteDe(entree.id);
    const carte = document.createElement('div');
    carte.className = 'carte-objet';
    carte.innerHTML = `
      <div class="objet-entete">${objet.emoji} <strong>${objet.nom}</strong> <span class="objet-qte">×${entree.qte}</span></div>
      <div class="objet-niveau">${formatNombre(prixUnite)} po pièce</div>`;
    const rangee = document.createElement('div');
    rangee.className = 'rangee-boutons';
    [[1, `Vendre ×1 — ${formatNombre(prixUnite)} po`], [entree.qte, `Tout — ${formatNombre(prixUnite * entree.qte)} po`]].forEach(([qte, libelle], index) => {
      if (index === 1 && entree.qte < 2) return;
      const btn = document.createElement('button');
      btn.className = 'btn-choix btn-compact';
      btn.textContent = libelle;
      btn.addEventListener('click', () => {
        const vendu = Math.min(qte, compterObjet(p, entree.id));
        if (vendu <= 0) return;
        retirerObjet(p, entree.id, vendu);
        p.po += prixUnite * vendu;
        p.compteurs.orTotal += prixUnite * vendu;
        sauvegarder(p);
        afficherToast(`💰 ${objet.emoji} ${objet.nom} ×${vendu} — +${formatNombre(prixUnite * vendu)} po.`);
        rendreFournisseur();
        rendreTopbar();
      });
      rangee.appendChild(btn);
    });
    carte.appendChild(rangee);
    grilleVente.appendChild(carte);
  });
  zone.appendChild(grilleVente);
}

// =====================================================================
// L'Arcanium : la boutique de magie — tous les grimoires de compétences
// =====================================================================
let filtreArcanium = 'tous';

// Prix d'un grimoire de compétence : selon son coût en mana et sa recharge.
// La recharge est plafonnée à 6 tours dans le calcul : les invocations
// portent un cooldown sentinelle de 99 (« une fois par combat ») qui,
// pris au pied de la lettre, ferait exploser la note.
function prixGrimoire(comp) {
  const recharge = Math.min(comp.cooldown || 0, 6);
  return 90 + (comp.coutMp || 0) * 25 + recharge * 15;
}

function rendreArcanium() {
  const p = persoActif();
  el('arcanium-po').textContent = `💰 ${p.po} po`;
  const zone = el('arcanium-contenu');
  zone.innerHTML = '';

  const aide = document.createElement('p');
  aide.className = 'aide';
  aide.textContent = 'C’est ici — et NULLE PART ailleurs — qu’on apprend de nouveaux sorts : monter de niveau n’en offre aucun. Chaque grimoire enseigne une compétence COMMUNE, ajoutée à votre grimoire personnel (et équipée s’il reste une place parmi vos 8 actives). Les compétences de classe (signature, voies et arbre) ne s’achètent jamais — elles vous reviennent de droit : 5 dès le niveau 1, puis une aux niveaux 5, 10 et 15.';
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

  const dejaReclamees = p.quetes.liste.filter((q) => q.reclamee).length;
  const quotaAtteint = dejaReclamees >= RECLAMATIONS_GUILDE_PAR_JOUR;
  const intro = document.createElement('p');
  intro.className = 'sous-titre';
  intro.textContent = `« Six contrats au tableau chaque matin, du commun au divin — plus le contrat est rare, plus il exige, plus il paie. Mais la caisse ne règle que ${RECLAMATIONS_GUILDE_PAR_JOUR} récompenses par jour : choisissez bien. » (${dejaReclamees}/${RECLAMATIONS_GUILDE_PAR_JOUR} réclamées aujourd'hui)`;
  zone.appendChild(intro);

  p.quetes.liste.forEach((quete) => {
    const complete = quete.fait >= quete.requis;
    const rarete = quete.rarete || 'commun';
    const carte = document.createElement('div');
    carte.className = `panneau carte-contrat bord-rar-${rarete}` + (quete.reclamee ? ' contrat-reclame' : '');
    const pct = Math.round((quete.fait / quete.requis) * 100);
    carte.innerHTML = `
      <div class="objet-entete">${quete.emoji} <strong>${quete.texte}</strong>
        <span class="rarete rar-${rarete}">${RARETES[rarete] ? RARETES[rarete].nom : rarete}</span>
        ${quete.reclamee ? '<span class="objet-qte">✔ récompense empochée</span>' : ''}</div>
      <div class="barre contrat"><div class="remplissage" style="width:${pct}%"></div>
        <span>${quete.fait} / ${quete.requis}</span></div>
      <div class="objet-bonus">🎁 ${quete.recompense.po} po · ⭐ ${quete.recompense.xp} XP${quete.recompense.coffre ? ` · 🎁 un objet surprise${(quete.recompense.bonusCoffre || 0) > 0 ? ' (chance dopée par la rareté du contrat)' : ''}` : ''}</div>`;
    if (!quete.reclamee) {
      const reclamer = document.createElement('button');
      reclamer.className = complete && !quotaAtteint ? 'btn-principal btn-compact' : 'btn-choix btn-compact';
      reclamer.textContent = quotaAtteint
        ? '🔒 Quota du jour atteint (3/3)'
        : (complete ? '🎉 Réclamer la récompense' : 'Contrat en cours…');
      reclamer.disabled = !complete || quotaAtteint;
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
  if (p.quetes.liste.filter((q) => q.reclamee).length >= RECLAMATIONS_GUILDE_PAR_JOUR) {
    afficherToast('🏰 La caisse est fermée : 3 récompenses par jour. Revenez demain !');
    return;
  }
  quete.reclamee = true;
  p.compteurs.quetes++;
  const poGagne = Math.round(quete.recompense.po * multiplicateurOr(p));
  p.po += poGagne;
  p.compteurs.orTotal += poGagne;
  const lignes = [`💰 +${poGagne} po`, `⭐ +${quete.recompense.xp} XP`];
  // Le grand contrat du jour offre un objet tiré selon la chance — et la
  // rareté du contrat dope encore le tirage.
  if (quete.recompense.coffre) {
    const s = statsEffectives(p);
    const rarete = tirerRarete(s.cha + 5 + (quete.recompense.bonusCoffre || 0));
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
// La cour des artisans (v12) : quatre maîtres se partagent les recettes.
// Forge (armes + armures lourdes + métaux), Tannerie (mains/pieds + cuirs),
// Tisserand (accessoires + étoffes), Alchimiste (potions + essences).
// =====================================================================
const ARTISANS = {
  forge: {
    emoji: '🔨', nom: 'La Forge', titre: '🔨 La Forge — Sigrid, maîtresse de fer',
    detail: 'Forgeron & maître de fer : armes, casques, cuirasses, jambières — et les lingots pour les nourrir',
    accueil: '« Le fer écoute qui le chauffe. Parlez-lui fort. » — Sigrid',
    chips: [['tous', 'Tout'], ['armes', '⚔️ Armes'], ['armures', '🛡️ Armures'], ['raffinage', '🧱 Raffinage']],
  },
  tannerie: {
    emoji: '🧤', nom: 'La Tannerie', titre: '🧤 La Tannerie — Karv, maître-tanneur',
    detail: 'Gants et bottes taillés dans le cuir des bêtes — et les cuirs raffinés qui vont avec',
    accueil: '« Chaque bête a deux vies. La seconde vous va comme un gant. » — Karv',
    chips: [['tous', 'Tout'], ['armures', '🧤 Cuirs (mains & pieds)'], ['raffinage', '🟫 Raffinage']],
  },
  tisserand: {
    emoji: '🧵', nom: 'Le Tisserand', titre: '🧵 Le Tisserand — Aracine, fileuse d’étoffes',
    detail: 'Accessoires, talismans et capes — tissés de toiles runiques et de fils d’ailleurs',
    accueil: '« Tout tient à un fil. Autant qu’il soit solide. » — Aracine',
    chips: [['tous', 'Tout'], ['accessoires', '💍 Accessoires'], ['raffinage', '🧵 Raffinage']],
  },
  alchimiste: {
    emoji: '⚗️', nom: 'L’Alchimiste', titre: '⚗️ L’Alchimiste — Griotte, maîtresse des fioles',
    detail: 'Potions de PV et de mana, bombes, élixirs tactiques — tout ce qui se boit ou explose',
    accueil: '« Si ça fume, c’est normal. Si ça fume VERT, courez. » — Griotte',
    chips: [['tous', 'Tout'], ['soins', '❤️ Soins & mana'], ['tactiques', '💥 Tactiques'], ['raffinage', '⚗️ Raffinage']],
  },
};

// Chaque matériau raffiné a son artisan attitré.
const ARTISAN_RAFFINAGE = {
  'lingot-ferreux': 'forge', 'alliage-hurlant': 'forge', 'perle-de-magma': 'forge',
  'quartz-eveille': 'forge', 'coeur-d-orage': 'forge', 'lingot-arcanique': 'forge',
  'cuir-double': 'tannerie', 'resine-de-jungle': 'tannerie', 'moelle-titanesque': 'tannerie',
  'cuir-de-legende': 'tannerie',
  'toile-runique': 'tisserand', 'fil-du-neant': 'tisserand', 'etoffe-enchantee': 'tisserand',
  'essence-sylvestre': 'alchimiste', 'sel-d-abysse': 'alchimiste',
};

// À quel artisan appartient une recette ?
function artisanDeRecette(recette) {
  const objet = OBJETS[recette.resultat];
  if (objet.type === 'materiau') return ARTISAN_RAFFINAGE[recette.resultat] || 'forge';
  if (objet.type === 'consommable') return 'alchimiste';
  if (objet.slot === 'arme' || ['tete', 'torse', 'jambes'].includes(objet.slot)) return 'forge';
  if (['mains', 'pieds'].includes(objet.slot)) return 'tannerie';
  return 'tisserand';
}

let filtresAtelier = { type: 'tous', realisables: false };
let atelierCourant = 'forge';

function ouvrirAtelier(idArtisan) {
  atelierCourant = idArtisan;
  filtresAtelier = { type: 'tous', realisables: false };
  rendreAtelier();
  montrerEcran('ecran-atelier');
}

// Catégorie d'une recette selon l'objet produit (pour les chips).
function categorieRecette(recette) {
  const objet = OBJETS[recette.resultat];
  if (objet.type === 'materiau') return 'raffinage';
  if (objet.type === 'consommable') {
    return ['pv', 'pm', 'soin-groupe', 'regen'].includes(objet.effet.type) ? 'soins' : 'tactiques';
  }
  if (objet.slot === 'arme') return 'armes';
  if (['tete', 'torse', 'jambes', 'mains', 'pieds'].includes(objet.slot)) return 'armures';
  return 'accessoires';
}

function recetteRealisable(p, recette) {
  return p.niveau >= recette.niveau && p.po >= recette.po
    && Object.entries(recette.materiaux).every(([id, qte]) => compterObjet(p, id) >= qte);
}

function rendreAtelier() {
  const p = persoActif();
  const config = ARTISANS[atelierCourant];
  el('atelier-titre').textContent = config.titre;
  el('atelier-accueil').textContent = config.accueil;
  el('atelier-po').textContent = `💰 ${p.po} po`;
  const zone = el('atelier-recettes');
  zone.innerHTML = '';

  // Sous-filtres : catégorie du résultat + « réalisables maintenant »
  const rangee = document.createElement('div');
  rangee.className = 'rangee-chips rangee-sous-filtres';
  config.chips.forEach(([id, nom]) => {
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

  // L'établi de CET artisan : ses recettes jusqu'au niveau du héros +6 —
  // les prochaines apparaissent grisées avec leur cadenas, pour donner
  // envie. Le reste attend plus loin sur la route.
  const chezLui = RECETTES.filter((recette) => artisanDeRecette(recette) === atelierCourant);
  const proches = chezLui.filter((recette) => recette.niveau <= p.niveau + 6);
  const cachees = chezLui.length - proches.length;
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
    carte.className = `carte-recette bord-rar-${rareteDe(objet)}` + (niveauOk ? '' : ' verrouillee element-verrouille');

    let materiauxOk = true;
    const listeMateriaux = Object.entries(recette.materiaux).map(([id, qte]) => {
      const possede = compterObjet(p, id);
      const ok = possede >= qte;
      if (!ok) materiauxOk = false;
      return `<span class="ingredient ${ok ? 'ok' : 'manque'}">${OBJETS[id].emoji} ${OBJETS[id].nom} ${possede}/${qte}</span>`;
    }).join('');

    const orOk = p.po >= recette.po;
    carte.innerHTML = `
      <div class="objet-entete">${niveauOk ? '' : '🔒 '}${objet.emoji} <strong>${objet.nom}</strong> ${etiquetteRarete(objet)}</div>
      ${objet.bonus ? `<div class="objet-bonus">${texteBonus(objet.bonus)}</div>` : `<div class="objet-desc">${objet.desc || ''}</div>`}
      ${texteSet(objet)}
      ${!niveauOk ? `<div class="objet-niveau niveau-insuffisant">🔒 se débloque au niveau ${recette.niveau}</div>` : ''}
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
