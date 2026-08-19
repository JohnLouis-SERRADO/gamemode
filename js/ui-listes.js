'use strict';

// =====================================================================
// v19 — LISTES PARCOURABLES : recherche, tri, pagination.
//
// Le jeu affichait ses catalogues d'un seul bloc. Mesuré sur mobile :
// 81 182 px de défilement pour l'armurerie, soit quatre-vingt-dix écrans,
// 3 195 éléments dans le DOM, et aucun moyen de trouver quoi que ce soit.
//
// Ce module fournit une liste réutilisable — barre de recherche, tris,
// pagination, compteur, état vide — pour que toutes les listes du jeu se
// comportent pareil : la boutique, l'atelier, le sac, l'Arcanium, la
// halle aux matières et le comptoir d'échange.
// =====================================================================

// Douze cartes par page : au-delà, on retombe dans le défilement sans fin
// qu'on cherche justement à supprimer. Mesuré sur mobile, une page tient
// en trois à quatre écrans, contrôles compris.
const PAR_PAGE_DEFAUT = 12;

// L'état de chaque liste (recherche en cours, page, tri) survit aux
// re-rendus : sinon, acheter un objet remettrait la liste au début.
const etatListes = {};

function etatListe(cle) {
  if (!etatListes[cle]) etatListes[cle] = { recherche: '', page: 1, tri: 'pertinence' };
  return etatListes[cle];
}

// Réinitialise une liste — à l'ouverture d'un écran, pour ne pas hériter
// d'une recherche tapée la fois précédente.
function reinitialiserListe(cle) {
  etatListes[cle] = { recherche: '', page: 1, tri: 'pertinence' };
}

// Comparaison souple : sans accents, sans casse. « epee » doit trouver
// « Épée », et « elfik » ne doit rien trouver du tout.
function normaliserTexte(texte) {
  return String(texte || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Tous les mots de la requête doivent apparaître, dans n'importe quel
// ordre : « fer epee » trouve « Épée de fer ».
function correspond(texteObjet, requete) {
  if (!requete) return true;
  const cible = normaliserTexte(texteObjet);
  return normaliserTexte(requete).split(/\s+/).filter(Boolean)
    .every((mot) => cible.includes(mot));
}

// Le texte sur lequel porte la recherche pour un objet du catalogue :
// son nom, sa description, sa rareté, son emplacement et ses bonus. Taper
// « critique » doit sortir les pièces qui en donnent.
function texteRecherchableObjet(objet) {
  if (!objet) return '';
  const morceaux = [objet.nom, objet.desc, (RARETES[rareteDe(objet)] || {}).nom];
  if (objet.slot) morceaux.push((SLOTS_EQUIPEMENT[objet.slot] || {}).nom || objet.slot);
  if (objet.niveau) morceaux.push(`niveau ${objet.niveau}`);
  Object.keys(objet.bonus || {}).forEach((cle) => {
    morceaux.push((CARACS[cle] || SOUS_CARACS[cle] || {}).nom || cle);
  });
  if (objet.set && SETS[objet.set]) morceaux.push(SETS[objet.set].nom);
  // La matière et la famille d'arme sont écrites sur chaque carte
  // (« 🧵 Tissu », « ⚔️ Lame lourde ») : ce qu'on lit doit se chercher.
  if (objet.armure && typeof CATEGORIES_ARMURE === 'object' && CATEGORIES_ARMURE[objet.armure]) {
    morceaux.push(CATEGORIES_ARMURE[objet.armure].nom);
  }
  if (objet.familleArme && typeof FAMILLES_ARME === 'object' && FAMILLES_ARME[objet.familleArme]) {
    morceaux.push(FAMILLES_ARME[objet.familleArme].nom);
  }
  return morceaux.filter(Boolean).join(' ');
}

// Idem pour une compétence : nom, description, catégorie, statistique.
function texteRecherchableCompetence(comp) {
  if (!comp) return '';
  return [comp.nom, comp.desc, (CARACS[comp.stat] || {}).nom, comp.categorie]
    .filter(Boolean).join(' ');
}

// ---------------------------------------------------------------------
// Les tris proposés. `pertinence` garde l'ordre d'origine de la liste,
// qui porte déjà du sens (niveau croissant chez les artisans, par exemple).
// ---------------------------------------------------------------------
const ORDRE_RARETE = ['commun', 'inhabituel', 'rare', 'epique', 'legendaire', 'mythique', 'divin'];

const TRIS_OBJETS = {
  pertinence: { nom: '↕️ Par défaut', comparer: null },
  niveau: { nom: '📈 Niveau', comparer: (a, b) => (a.objet.niveau || 0) - (b.objet.niveau || 0) },
  'niveau-desc': { nom: '📉 Niveau ↓', comparer: (a, b) => (b.objet.niveau || 0) - (a.objet.niveau || 0) },
  rarete: {
    nom: '✨ Rareté ↓',
    comparer: (a, b) => ORDRE_RARETE.indexOf(rareteDe(b.objet)) - ORDRE_RARETE.indexOf(rareteDe(a.objet)),
  },
  prix: { nom: '💰 Prix', comparer: (a, b) => (a.prix || 0) - (b.prix || 0) },
  'prix-desc': { nom: '💰 Prix ↓', comparer: (a, b) => (b.prix || 0) - (a.prix || 0) },
  nom: { nom: '🔤 Nom', comparer: (a, b) => normaliserTexte(a.objet.nom).localeCompare(normaliserTexte(b.objet.nom)) },
};

// =====================================================================
// Le composant : une barre de recherche, des tris, une liste paginée.
//
// options :
//   cle        identifiant de la liste (mémorise recherche, tri, page)
//   conteneur  élément qui reçoit la barre, la liste et le pied
//   elements   tableau d'entrées quelconques
//   texteDe    (element) => texte sur lequel chercher
//   rendre     (element, index) => élément DOM à afficher
//   tris       objet de tris disponibles (facultatif)
//   trierAvec  (element) => { objet, prix } pour les tris d'objets
//   parPage    nombre d'éléments par page (24 par défaut)
//   placeholder texte de la barre de recherche
//   vide       message quand la recherche ne donne rien
//   nomListe   ce qu'on compte : « objets », « recettes »…
// =====================================================================
function rendreListeFiltrable(options) {
  const {
    cle, conteneur, elements, texteDe, rendre,
    tris = null, trierAvec = null,
    parPage = PAR_PAGE_DEFAUT,
    placeholder = 'Rechercher…',
    vide = 'Aucun résultat pour cette recherche.',
    nomListe = 'résultats',
  } = options;
  const etat = etatListe(cle);

  // Chaque liste vit dans son propre bloc, réutilisé d'un rendu à l'autre.
  // Sans lui, taper une lettre ajoutait une seconde liste sous la première
  // au lieu de la remplacer — le filtre marchait, mais on lisait la liste
  // périmée restée au-dessus.
  let bloc = conteneur.querySelector(`:scope > .bloc-liste[data-liste="${cle}"]`);
  if (!bloc) {
    bloc = document.createElement('div');
    bloc.className = 'bloc-liste';
    bloc.dataset.liste = cle;
    conteneur.appendChild(bloc);
  }
  bloc.innerHTML = '';
  const rafraichir = () => rendreListeFiltrable(options);

  // v26 — Une seule rangée pour chercher, trier et compter. Les trois
  // contrôles occupaient trois bandeaux empilés : sur mobile, le premier
  // article commençait sous la ligne de flottaison.
  const outils = document.createElement('div');
  outils.className = 'barre-outils';
  bloc.appendChild(outils);

  // --- La barre de recherche -----------------------------------------
  const barre = document.createElement('div');
  barre.className = 'barre-recherche';
  const champ = document.createElement('input');
  champ.type = 'search';
  champ.className = 'champ-recherche';
  champ.placeholder = placeholder;
  champ.value = etat.recherche;
  champ.setAttribute('aria-label', placeholder);
  champ.autocomplete = 'off';
  // On filtre à la frappe, sans bouton : c'est ce qu'on attend d'une
  // barre de recherche, et ça évite un aller-retour de plus.
  champ.addEventListener('input', () => {
    etat.recherche = champ.value;
    etat.page = 1;
    rafraichir();
    // Le re-rendu recrée le champ : on lui rend le curseur là où il était.
    const nouveau = bloc.querySelector('.champ-recherche');
    if (nouveau) {
      nouveau.focus();
      nouveau.setSelectionRange(nouveau.value.length, nouveau.value.length);
    }
  });
  barre.appendChild(champ);

  if (etat.recherche) {
    const effacer = document.createElement('button');
    effacer.className = 'btn-effacer-recherche';
    effacer.type = 'button';
    effacer.title = 'Effacer la recherche';
    effacer.setAttribute('aria-label', 'Effacer la recherche');
    effacer.textContent = '✕';
    effacer.addEventListener('click', () => {
      etat.recherche = '';
      etat.page = 1;
      rafraichir();
    });
    barre.appendChild(effacer);
  }
  outils.appendChild(barre);

  // --- Les tris -------------------------------------------------------
  if (tris) {
    // Sept boutons de tri poussaient le premier article six cents pixels
    // plus bas. On les replie : la recherche reste la seule chose visible,
    // et le tri courant s'affiche dans le résumé.
    const repli = document.createElement('details');
    repli.className = 'affiner';
    if (etat.tri !== 'pertinence') repli.open = true;
    const resume = document.createElement('summary');
    resume.textContent = `⇅ Trier — ${(tris[etat.tri] || tris.pertinence).nom.replace(/^[^ ]+ /, '')}`;
    repli.appendChild(resume);
    const rangee = document.createElement('div');
    rangee.className = 'rangee-chips rangee-tris';
    Object.entries(tris).forEach(([id, tri]) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip chip-tri' + (etat.tri === id ? ' active' : '');
      chip.textContent = tri.nom;
      chip.addEventListener('click', () => { etat.tri = id; etat.page = 1; rafraichir(); });
      rangee.appendChild(chip);
    });
    repli.appendChild(rangee);
    outils.appendChild(repli);
  }

  // --- Filtrage et tri ------------------------------------------------
  let visibles = elements.filter((e) => correspond(texteDe(e), etat.recherche));
  const tri = tris && tris[etat.tri];
  if (tri && tri.comparer && trierAvec) {
    visibles = visibles
      .map((e) => ({ e, cle: trierAvec(e) }))
      .sort((a, b) => tri.comparer(a.cle, b.cle))
      .map((x) => x.e);
  }

  // --- Compteur -------------------------------------------------------
  const total = visibles.length;
  const pages = Math.max(1, Math.ceil(total / parPage));
  if (etat.page > pages) etat.page = pages;
  const debut = (etat.page - 1) * parPage;
  const tranche = visibles.slice(debut, debut + parPage);

  const compteur = document.createElement('p');
  compteur.className = 'compteur-liste';
  // Le nombre de résultats change à chaque frappe sans que rien ne bouge
  // à l'écran pour qui ne voit pas la liste : on l'annonce.
  compteur.setAttribute('aria-live', 'polite');
  compteur.textContent = total === 0
    ? `Aucun ${nomListe.replace(/s$/, '')}`
    : `${formatNombre(total)} ${nomListe}${total > parPage ? ` — ${formatNombre(debut + 1)} à ${formatNombre(debut + tranche.length)}` : ''}`;
  outils.appendChild(compteur);

  // --- La liste -------------------------------------------------------
  if (total === 0) {
    const message = document.createElement('p');
    message.className = 'aide etat-vide';
    message.textContent = etat.recherche
      ? `Rien ne correspond à « ${etat.recherche} ».`
      : vide;
    bloc.appendChild(message);
    return;
  }

  const liste = document.createElement('div');
  liste.className = options.classeListe || 'liste-resultats';
  tranche.forEach((e, i) => {
    const carte = rendre(e, debut + i);
    if (carte) liste.appendChild(carte);
  });
  bloc.appendChild(liste);

  // --- Pagination -----------------------------------------------------
  if (pages > 1) {
    const pied = document.createElement('div');
    pied.className = 'pagination';

    const bouton = (libelle, page, desactive, titre) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn-choix btn-compact btn-page';
      b.textContent = libelle;
      if (titre) b.title = titre;
      b.disabled = desactive;
      b.addEventListener('click', () => {
        etat.page = page;
        rafraichir();
        bloc.scrollIntoView({ block: 'start', behavior: 'smooth' });
      });
      return b;
    };

    pied.appendChild(bouton('‹ Précédent', etat.page - 1, etat.page <= 1));
    const position = document.createElement('span');
    position.className = 'position-page';
    position.textContent = `Page ${etat.page} / ${pages}`;
    pied.appendChild(position);
    pied.appendChild(bouton('Suivant ›', etat.page + 1, etat.page >= pages));
    bloc.appendChild(pied);
  }
}

// =====================================================================
// Comparaison à l'équipé — la vraie question du joueur devant une pièce :
// « est-ce mieux que ce que je porte ? »
//
// Renvoie l'objet actuellement porté dans l'emplacement visé, et le
// tableau des écarts, prêt à afficher.
// =====================================================================
function slotsPourObjet(objet) {
  if (!objet || objet.type !== 'equipement') return [];
  return objet.slot === 'accessoire' ? ['acc1', 'acc2'] : [objet.slot];
}

// La pièce portée à comparer : pour un accessoire, la plus faible des deux,
// puisque c'est celle qu'on remplacerait.
function objetPorteComparable(p, objet) {
  const slots = slotsPourObjet(objet);
  if (!slots.length) return null;
  const portes = slots.map((slot) => ({ slot, objet: OBJETS[p.equipement[slot]] || null }));
  const vide = portes.find((x) => !x.objet);
  if (vide) return vide;
  return portes.sort((a, b) => valeurIndicative(a.objet) - valeurIndicative(b.objet))[0];
}

// Une valeur d'ensemble grossière, juste pour comparer deux pièces entre
// elles : la somme des bonus, pondérée par ce qui compte vraiment.
function valeurIndicative(objet) {
  if (!objet || !objet.bonus) return 0;
  return Object.entries(objet.bonus).reduce((somme, [cle, valeur]) => {
    if (CARACS[cle]) return somme + valeur * 6;
    if (SOUS_CARACS[cle]) return somme + valeur * 8;
    if (cle === 'pvMax') return somme + valeur * 0.8;
    if (cle === 'pmMax') return somme + valeur * 0.6;
    return somme;
  }, 0);
}

// Les écarts entre une pièce et celle qui est portée, sous forme lisible.
function ecartsAvecPorte(p, objet) {
  if (!p || !objet || objet.type !== 'equipement') return null;
  const porte = objetPorteComparable(p, objet);
  if (!porte) return null;
  const actuel = porte.objet;
  const cles = new Set([
    ...Object.keys(objet.bonus || {}),
    ...Object.keys((actuel && actuel.bonus) || {}),
  ]);
  const lignes = [];
  cles.forEach((cle) => {
    const avant = ((actuel && actuel.bonus) || {})[cle] || 0;
    const apres = (objet.bonus || {})[cle] || 0;
    const delta = apres - avant;
    if (delta === 0) return;
    const meta = CARACS[cle] || SOUS_CARACS[cle];
    const libelle = meta ? `${meta.emoji} ${meta.nom}` : cle;
    const pourcent = SOUS_CARACS[cle] ? ' %' : '';
    lignes.push({ cle, delta, texte: `${delta > 0 ? '+' : ''}${delta}${pourcent} ${libelle}` });
  });
  return {
    slot: porte.slot,
    actuel,
    lignes,
    gain: valeurIndicative(objet) - valeurIndicative(actuel),
  };
}

// Le bloc HTML de comparaison, à glisser dans une carte d'objet.
function texteComparaison(p, objet) {
  const ecarts = ecartsAvecPorte(p, objet);
  if (!ecarts) return '';
  if (!ecarts.actuel) {
    return '<div class="comparaison comparaison-vide">✨ Emplacement libre</div>';
  }
  if (!ecarts.lignes.length) return '';
  const classe = ecarts.gain > 0 ? 'comparaison-mieux' : (ecarts.gain < 0 ? 'comparaison-moins' : '');
  const badge = ecarts.gain > 0
    ? '<span class="badge-mieux">▲ mieux que l’équipé</span>'
    : (ecarts.gain < 0 ? '<span class="badge-moins">▼ moins bien</span>' : '');
  const details = ecarts.lignes
    .map((l) => `<span class="ecart ${l.delta > 0 ? 'ecart-plus' : 'ecart-moins'}">${l.texte}</span>`)
    .join('');
  return `<div class="comparaison ${classe}" title="Comparé à ${ecarts.actuel.nom}">${badge}${details}</div>`;
}
