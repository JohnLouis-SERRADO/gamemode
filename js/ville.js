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
    btn.addEventListener('click', () => { ongletBoutique = onglet.id; rendreBoutique(); });
    zoneOnglets.appendChild(btn);
  });

  const contenu = el('boutique-contenu');
  contenu.innerHTML = '';

  if (ongletBoutique === 'vendre') {
    rendreVente(contenu, p);
    return;
  }

  const onglet = ONGLETS_BOUTIQUE.find((o) => o.id === ongletBoutique);
  const grille = document.createElement('div');
  grille.className = 'grille-inventaire';
  Object.entries(OBJETS)
    .filter(([, o]) => o.prix != null && onglet.filtre(o))
    .sort((a, b) => (a[1].niveau || 0) - (b[1].niveau || 0) || a[1].prix - b[1].prix)
    .forEach(([id, objet]) => {
      const possede = compterObjet(p, id)
        + Object.values(p.equipement).filter((e) => e === id).length;
      const carte = document.createElement('div');
      carte.className = 'carte-objet';
      carte.innerHTML = `
        <div class="objet-entete">${objet.emoji} <strong>${objet.nom}</strong>${possede > 0 ? ` <span class="objet-qte">×${possede} possédé${possede > 1 ? 's' : ''}</span>` : ''}</div>
        <div class="objet-desc">${objet.desc || ''}</div>
        ${objet.bonus ? `<div class="objet-bonus">${texteBonus(objet.bonus)}</div>` : ''}
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
        rendreBoutique();
        rendreTopbar();
      });
      carte.appendChild(acheter);
      grille.appendChild(carte);
    });
  contenu.appendChild(grille);
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
// Atelier de craft
// =====================================================================
function rendreAtelier() {
  const p = persoActif();
  el('atelier-po').textContent = `💰 ${p.po} po`;
  const zone = el('atelier-recettes');
  zone.innerHTML = '';

  RECETTES.forEach((recette) => {
    const objet = OBJETS[recette.resultat];
    const niveauOk = p.niveau >= recette.niveau;
    const carte = document.createElement('div');
    carte.className = 'carte-recette' + (niveauOk ? '' : ' verrouillee');

    let materiauxOk = true;
    const listeMateriaux = Object.entries(recette.materiaux).map(([id, qte]) => {
      const possede = compterObjet(p, id);
      const ok = possede >= qte;
      if (!ok) materiauxOk = false;
      return `<span class="ingredient ${ok ? 'ok' : 'manque'}">${OBJETS[id].emoji} ${OBJETS[id].nom} ${possede}/${qte}</span>`;
    }).join('');

    const orOk = p.po >= recette.po;
    carte.innerHTML = `
      <div class="objet-entete">${objet.emoji} <strong>${objet.nom}</strong></div>
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
      sauvegarder(p);
      afficherToast(`⚒️ ${objet.emoji} ${objet.nom} fabriqué !`);
      rendreAtelier();
      rendreTopbar();
    });
    carte.appendChild(fabriquer);
    zone.appendChild(carte);
  });
}
