'use strict';

// =====================================================================
// Artisanat : recettes, raffinage, séries et panoplies
// =====================================================================

// =====================================================================
// Recettes de l'atelier
// materiaux : { idObjet: quantité } ; po : coût en pièces d'or
// =====================================================================
const RECETTES = [
  { resultat: 'potion-soin',        niveau: 1,  po: 3,   materiaux: { 'herbe-lunaire': 2 } },
  { resultat: 'tunique-lin',        niveau: 1,  po: 8,   materiaux: { 'fibre-sauvage': 3 } },
  { resultat: 'anneau-force',       niveau: 3,  po: 30,  materiaux: { 'defense-sanglier': 2, 'fibre-sauvage': 2 } },
  { resultat: 'potion-mana',        niveau: 3,  po: 4,   materiaux: { 'herbe-lunaire': 1, 'seve-ambree': 1 } },
  { resultat: 'grande-potion-soin', niveau: 5,  po: 12,  materiaux: { 'herbe-lunaire': 3, 'soie-araignee': 1 } },
  { resultat: 'grande-potion-mana', niveau: 5,  po: 20,  materiaux: { 'seve-ambree': 2, 'herbe-lunaire': 2 } },
  { resultat: 'cotte-mailles',      niveau: 6,  po: 40,  materiaux: { 'minerai-cuivre': 3, 'peau-de-loup': 1 } },
  { resultat: 'antidote',           niveau: 8,  po: 5,   materiaux: { 'lotus-noir': 1, 'herbe-lunaire': 1 } },
  { resultat: 'arc-elfique',        niveau: 8,  po: 80,  materiaux: { 'bois-chene': 2, 'soie-araignee': 2 } },
  { resultat: 'elixir-heroique',    niveau: 9,  po: 25,  materiaux: { 'lotus-noir': 2, 'seve-ambree': 1 } },
  { resultat: 'potion-supreme-soin', niveau: 10, po: 30, materiaux: { 'herbe-lunaire': 3, 'lotus-noir': 2 } },
  { resultat: 'potion-supreme-mana', niveau: 11, po: 40, materiaux: { 'seve-ambree': 3, 'lotus-noir': 2 } },
  { resultat: 'bombe-ardente',       niveau: 12, po: 45, materiaux: { 'poussiere-spectre': 1, 'minerai-fer': 1, 'seve-ambree': 1 } },
  { resultat: 'orbe-des-dunes',     niveau: 13, po: 150, materiaux: { 'perle-des-sables': 2, 'minerai-cuivre': 2 } },
  { resultat: 'couronne-mystique',  niveau: 14, po: 200, materiaux: { 'cristal-givre': 1, 'poussiere-spectre': 2, 'minerai-cuivre': 2 } },
  { resultat: 'jambieres-zephyr',   niveau: 14, po: 200, materiaux: { 'soie-araignee': 2, 'peau-de-loup': 2, 'cristal-givre': 1 } },
  { resultat: 'coeur-givre',        niveau: 15, po: 250, materiaux: { 'cristal-givre': 2, 'noyau-golem': 1 } },
  { resultat: 'armure-draconique',  niveau: 16, po: 250, materiaux: { 'ecaille-draconique': 2, 'minerai-fer': 3, 'peau-de-loup': 2 } },
  { resultat: 'oeil-dragon',        niveau: 16, po: 350, materiaux: { 'ecaille-draconique': 1, 'cristal-givre': 1, 'noyau-golem': 1 } },
  { resultat: 'lame-crepuscule',    niveau: 16, po: 300, materiaux: { 'minerai-fer': 3, 'os-ancien': 2, 'ecaille-draconique': 1 } },
  { resultat: 'sceptre-neant',      niveau: 16, po: 300, materiaux: { 'cristal-givre': 2, 'poussiere-spectre': 3, 'noyau-golem': 1 } },
  { resultat: 'arc-du-vent',        niveau: 16, po: 300, materiaux: { 'cristal-givre': 2, 'soie-araignee': 2, 'ecaille-draconique': 1 } },
];

// =====================================================================
// Séries d'artisanat : 14 séries × 5 pièces, générées ci-dessous.
// Chaque série a son niveau, sa rareté, ses matériaux et son coût.
// =====================================================================
const SETS_CRAFT = [
  { suffixe: 'du Loup', armure: 'cuir',      niveau: 3,  rarete: 'commun',     po: 18,  materiaux: { 'peau-de-loup': 2, 'fibre-sauvage': 2 } },
  { suffixe: 'du Sanglier', armure: 'cuir',  niveau: 4,  rarete: 'commun',     po: 26,  materiaux: { 'defense-sanglier': 2, 'peau-de-loup': 1 } },
  { suffixe: 'des Murmures', armure: 'tissu', niveau: 6,  rarete: 'inhabituel', po: 50,  materiaux: { 'bois-chene': 2, 'seve-ambree': 2 } },
  { suffixe: 'de la Veuve', armure: 'tissu',  niveau: 7,  rarete: 'inhabituel', po: 65,  materiaux: { 'soie-araignee': 3, 'fibre-sauvage': 2 } },
  { suffixe: 'du Cuivre', armure: 'maille',    niveau: 8,  rarete: 'inhabituel', po: 80,  materiaux: { 'minerai-cuivre': 3, 'defense-sanglier': 1 } },
  { suffixe: 'du Marais', armure: 'tissu',    niveau: 9,  rarete: 'rare',       po: 110, materiaux: { 'lotus-noir': 2, 'herbe-lunaire': 2, 'seve-ambree': 1 } },
  { suffixe: 'de Fer', armure: 'plaque',       niveau: 11, rarete: 'rare',       po: 150, materiaux: { 'minerai-fer': 3, 'minerai-cuivre': 2 } },
  { suffixe: 'des Cryptes', armure: 'maille',  niveau: 12, rarete: 'rare',       po: 190, materiaux: { 'os-ancien': 2, 'poussiere-spectre': 2 } },
  { suffixe: 'des Dunes', armure: 'cuir',    niveau: 13, rarete: 'rare',       po: 230, materiaux: { 'perle-des-sables': 2, 'minerai-fer': 2 } },
  { suffixe: 'du Spectre', armure: 'tissu',   niveau: 14, rarete: 'epique',     po: 280, materiaux: { 'poussiere-spectre': 3, 'os-ancien': 2 } },
  { suffixe: 'des Glaces', armure: 'maille',   niveau: 15, rarete: 'epique',     po: 330, materiaux: { 'cristal-givre': 2, 'minerai-fer': 2 } },
  { suffixe: 'du Golem', armure: 'plaque',     niveau: 16, rarete: 'epique',     po: 390, materiaux: { 'noyau-golem': 2, 'minerai-fer': 3 } },
  { suffixe: 'du Dragon', armure: 'plaque',    niveau: 17, rarete: 'legendaire', po: 500, materiaux: { 'ecaille-draconique': 2, 'noyau-golem': 1, 'minerai-fer': 2 } },
  { suffixe: 'de l’Aube', armure: 'tissu',    niveau: 19, rarete: 'legendaire', po: 650, materiaux: { 'ecaille-draconique': 2, 'cristal-givre': 2, 'perle-des-sables': 2 } },
];

const MULT_RARETE_CRAFT = { commun: 1, inhabituel: 1.12, rare: 1.25, epique: 1.4, legendaire: 1.6, mythique: 1.85, divin: 2.2 };

// ---------------------------------------------------------------------
// Raffinage (v10) : les grandes séries exigent des matériaux raffinés,
// eux-mêmes fabriqués à partir de beaucoup de récolte brute. Il va
// falloir farmer — c'est le but.
// ---------------------------------------------------------------------
Object.assign(OBJETS, {
  'lingot-ferreux':    { nom: 'Lingot ferreux', emoji: '🧱', type: 'materiau', rarete: 'inhabituel', prixVente: 90, desc: 'Fer et cuivre fondus ensemble à l’atelier.' },
  'cuir-double':       { nom: 'Cuir doublé', emoji: '🟫', type: 'materiau', rarete: 'inhabituel', prixVente: 80, desc: 'Deux peaux, une couture, zéro courant d’air.' },
  'essence-sylvestre': { nom: 'Essence sylvestre', emoji: '🍃', type: 'materiau', rarete: 'rare', prixVente: 110, desc: 'La forêt distillée goutte à goutte.' },
  'toile-runique':     { nom: 'Toile runique', emoji: '🕸️', type: 'materiau', rarete: 'rare', prixVente: 150, desc: 'Tissée de poussière de spectre et de givre.' },
  'alliage-hurlant':   { nom: 'Alliage hurlant', emoji: '🔩', type: 'materiau', rarete: 'rare', prixVente: 260, desc: 'Il vibre encore du chant des falaises.' },
  'resine-de-jungle':  { nom: 'Résine de jungle', emoji: '🫙', type: 'materiau', rarete: 'rare', prixVente: 260, desc: 'Colle tout. Y compris les doigts. Surtout les doigts.' },
  'perle-de-magma':    { nom: 'Perle de magma', emoji: '🔴', type: 'materiau', rarete: 'epique', prixVente: 420, desc: 'Une goutte de volcan, ronde et patiente.' },
  'sel-d-abysse':      { nom: 'Sel d’abysse', emoji: '🧂', type: 'materiau', rarete: 'epique', prixVente: 420, desc: 'Le sel des larmes de sirène. Hors de prix, comme le chagrin.' },
  'moelle-titanesque': { nom: 'Moelle titanesque', emoji: '🦴', type: 'materiau', rarete: 'legendaire', prixVente: 680, desc: 'La force des géants, réduite en concentré.' },
  'quartz-eveille':    { nom: 'Quartz éveillé', emoji: '💠', type: 'materiau', rarete: 'legendaire', prixVente: 680, desc: 'Il cligne doucement quand on lui parle.' },
  'coeur-d-orage':     { nom: 'Cœur d’orage', emoji: '🌩️', type: 'materiau', rarete: 'mythique', prixVente: 1100, desc: 'Un orage entier, plié en huit.' },
  'fil-du-neant':      { nom: 'Fil du néant', emoji: '🧵', type: 'materiau', rarete: 'mythique', prixVente: 1100, desc: 'On coud avec du rien. Ça tient très bien.' },
});

// Recettes de raffinage : beaucoup de brut pour un seul raffiné.
[
  { resultat: 'lingot-ferreux',    niveau: 12, po: 25,  materiaux: { 'minerai-fer': 5, 'minerai-cuivre': 3 } },
  { resultat: 'cuir-double',       niveau: 10, po: 20,  materiaux: { 'peau-de-loup': 4, 'soie-araignee': 3 } },
  { resultat: 'essence-sylvestre', niveau: 12, po: 30,  materiaux: { 'seve-ambree': 4, 'herbe-lunaire': 4, 'lotus-noir': 3 } },
  { resultat: 'toile-runique',     niveau: 16, po: 45,  materiaux: { 'poussiere-spectre': 3, 'os-ancien': 2, 'cristal-givre': 2 } },
  { resultat: 'alliage-hurlant',   niveau: 24, po: 80,  materiaux: { 'basalte-poli': 4, 'cristal-hurleur': 2, 'plume-de-rokh': 2 } },
  { resultat: 'resine-de-jungle',  niveau: 24, po: 80,  materiaux: { 'liane-tressee': 4, 'orchidee-lunaire': 3, 'venin-concentre': 2 } },
  { resultat: 'perle-de-magma',    niveau: 32, po: 140, materiaux: { 'obsidienne-brute': 4, 'coeur-de-braise': 2, 'cendre-fertile': 3 } },
  { resultat: 'sel-d-abysse',      niveau: 32, po: 140, materiaux: { 'nacre-abyssale': 4, 'larme-de-sirene': 2, 'corail-sanglant': 3 } },
  { resultat: 'moelle-titanesque', niveau: 40, po: 240, materiaux: { 'os-de-geant': 4, 'peau-de-mammouth': 3, 'relique-antique': 1 } },
  { resultat: 'quartz-eveille',    niveau: 40, po: 240, materiaux: { 'bois-petrifie': 4, 'ambre-noir': 3, 'sphere-runique': 1 } },
  { resultat: 'coeur-d-orage',     niveau: 47, po: 400, materiaux: { 'fragment-de-foudre': 4, 'acier-celeste': 3, 'plume-d-archon': 1 } },
  { resultat: 'fil-du-neant',      niveau: 47, po: 400, materiaux: { 'etoffe-du-neant': 4, 'eclat-d-etoile': 3, 'essence-primordiale': 1 } },
].forEach((recette) => RECETTES.push(recette));

// Les grandes séries des Terres lointaines : chaque pièce coûte des
// matériaux raffinés en quantité — des heures de récolte bien investies.
SETS_CRAFT.push(
  { suffixe: 'des Falaises', armure: 'cuir',  niveau: 24, rarete: 'rare',       po: 320,  materiaux: { 'alliage-hurlant': 2, 'lingot-ferreux': 2 } },
  { suffixe: 'de Vaï-Sombre', armure: 'cuir', niveau: 28, rarete: 'epique',     po: 450,  materiaux: { 'resine-de-jungle': 2, 'cuir-double': 3, 'essence-sylvestre': 1 } },
  { suffixe: 'des Abysses', armure: 'maille',   niveau: 33, rarete: 'epique',     po: 620,  materiaux: { 'sel-d-abysse': 2, 'toile-runique': 2 } },
  { suffixe: 'du Béhémoth', armure: 'plaque',   niveau: 38, rarete: 'legendaire', po: 900,  materiaux: { 'perle-de-magma': 2, 'moelle-titanesque': 1, 'lingot-ferreux': 3 } },
  { suffixe: 'des Titans', armure: 'plaque',    niveau: 44, rarete: 'mythique',   po: 1400, materiaux: { 'moelle-titanesque': 2, 'quartz-eveille': 2, 'sel-d-abysse': 1 } },
  { suffixe: 'du Firmament', armure: 'tissu',  niveau: 50, rarete: 'divin',      po: 2200, materiaux: { 'coeur-d-orage': 2, 'fil-du-neant': 2, 'quartz-eveille': 1 } },
);

// ---------------------------------------------------------------------
// Métiers de récolte (v12) : chaque métier a son matériau signature,
// introuvable autrement — et son raffiné, qui alimente les artisans.
// ---------------------------------------------------------------------
Object.assign(OBJETS, {
  'pierre-magique': { nom: 'Pierre magique', emoji: '🧿', type: 'materiau', rarete: 'rare', prixVente: 60, desc: 'La fierté du mineur : une pierre qui rêve encore de la montagne.' },
  'cuir-primal':    { nom: 'Cuir primal', emoji: '🐆', type: 'materiau', rarete: 'rare', prixVente: 60, desc: 'La fierté du tanneur : un cuir qui se souvient d’avoir couru.' },
  'tissu-magique':  { nom: 'Tissu magique', emoji: '🧶', type: 'materiau', rarete: 'rare', prixVente: 60, desc: 'La fierté du tisseur : une étoffe tissée à même la rosée.' },
  'lingot-arcanique':  { nom: 'Lingot arcanique', emoji: '🔷', type: 'materiau', rarete: 'mythique', prixVente: 950, desc: 'Pierre magique et fer, fondus à la Forge. Il fredonne.' },
  'cuir-de-legende':   { nom: 'Cuir de légende', emoji: '🦬', type: 'materiau', rarete: 'mythique', prixVente: 950, desc: 'Tanné dans les règles de l’art — et un peu en dehors.' },
  'etoffe-enchantee':  { nom: 'Étoffe enchantée', emoji: '🪡', type: 'materiau', rarete: 'mythique', prixVente: 950, desc: 'Chaque fil est une petite promesse tenue.' },
});

// Raffinés de métier — un par artisan, gourmands en récolte spécialisée.
[
  { resultat: 'lingot-arcanique', niveau: 30, po: 200, materiaux: { 'pierre-magique': 4, 'lingot-ferreux': 2 } },
  { resultat: 'cuir-de-legende',  niveau: 30, po: 200, materiaux: { 'cuir-primal': 4, 'cuir-double': 2 } },
  { resultat: 'etoffe-enchantee', niveau: 30, po: 200, materiaux: { 'tissu-magique': 4, 'toile-runique': 2 } },
].forEach((recette) => RECETTES.push(recette));

// v17 : les matériaux RAFFINÉS rejoignent les familles de la halle aux
// matières — tout ce qui sert au craft peut désormais s'acheter (cher),
// selon le niveau du joueur.
Object.assign(FAMILLE_MATERIAU, {
  'lingot-ferreux': 'mine', 'alliage-hurlant': 'mine', 'perle-de-magma': 'mine',
  'quartz-eveille': 'mine', 'coeur-d-orage': 'mine', 'lingot-arcanique': 'mine',
  'cuir-double': 'peau', 'resine-de-jungle': 'peau', 'moelle-titanesque': 'peau',
  'cuir-de-legende': 'peau',
  'toile-runique': 'plante', 'fil-du-neant': 'plante', 'etoffe-enchantee': 'plante',
  'essence-sylvestre': 'plante', 'sel-d-abysse': 'plante',
});

// Le grand œuvre des artisans : une série qui exige les trois métiers.
SETS_CRAFT.push(
  { suffixe: 'des Trois Maîtres', armure: 'maille', niveau: 36, rarete: 'mythique', po: 1600, materiaux: { 'lingot-arcanique': 1, 'cuir-de-legende': 1, 'etoffe-enchantee': 1 } },
);

// L'alchimiste apprend à fabriquer les objets tactiques : potions,
// bombes et philtres, à base de plantes, venins et pierres magiques.
[
  { resultat: 'poudre-evasion',  niveau: 10, po: 20,  materiaux: { 'fibre-sauvage': 2, 'poussiere-spectre': 1 } },
  { resultat: 'trefle-seche',    niveau: 12, po: 45,  materiaux: { 'herbe-lunaire': 2, 'fibre-sauvage': 3 } },
  { resultat: 'bombe-de-givre',  niveau: 14, po: 40,  materiaux: { 'pierre-magique': 1, 'cristal-givre': 1, 'herbe-lunaire': 1 } },
  { resultat: 'fiole-acide',     niveau: 22, po: 50,  materiaux: { 'venin-concentre': 1, 'seve-ambree': 2 } },
  { resultat: 'bombe-foudre',    niveau: 24, po: 60,  materiaux: { 'pierre-magique': 1, 'cristal-hurleur': 1, 'lotus-noir': 1 } },
  { resultat: 'potion-colosse',  niveau: 26, po: 160, materiaux: { 'essence-sylvestre': 1, 'lotus-noir': 3, 'seve-ambree': 3 } },
  { resultat: 'elixir-titan',    niveau: 28, po: 90,  materiaux: { 'essence-sylvestre': 1, 'coeur-de-braise': 1 } },
  { resultat: 'bombe-obscure',   niveau: 30, po: 110, materiaux: { 'pierre-magique': 2, 'poussiere-spectre': 3, 'obsidienne-brute': 1 } },
].forEach((recette) => RECETTES.push(recette));

// =====================================================================
// Panoplies : équiper plusieurs pièces d'une même collection active des
// bonus supplémentaires (2 pièces, puis 4 pièces). Les paliers dépendent
// de la rareté de la panoplie ; certains donnent des passifs % XP ou or.
// =====================================================================
const SETS = {}; // idSet -> { nom, rarete }

const BONUS_SET_PAR_RARETE = {
  commun:     { 2: { pvMax: 8 },                   4: { vit: 2, xpBonus: 0.02 } },
  inhabituel: { 2: { pvMax: 12, pmMax: 5 },        4: { crit: 2, xpBonus: 0.03 } },
  rare:       { 2: { crit: 2, pvMax: 16 },         4: { xpBonus: 0.05, poBonus: 0.05 } },
  epique:     { 2: { crit: 3, pvMax: 25, cha: 1 }, 4: { xpBonus: 0.07, poBonus: 0.07, cha: 2 } },
  legendaire: { 2: { crit: 4, pvMax: 35, cha: 2 }, 4: { xpBonus: 0.1, poBonus: 0.1, for: 2, int: 2, dex: 2, vit: 2 } },
  mythique:   { 2: { crit: 5, pvMax: 50, cha: 2 }, 4: { xpBonus: 0.12, poBonus: 0.12, for: 3, int: 3, dex: 3, vit: 3 } },
  divin:      { 2: { crit: 6, pvMax: 70, cha: 3 }, 4: { xpBonus: 0.15, poBonus: 0.15, for: 4, int: 4, dex: 4, vit: 4 } },
};

// Texte d'un palier de bonus de panoplie (réutilise texteBonus, en
// traduisant les passifs % qui n'y figurent pas).
function textePalierSet(palier) {
  return Object.entries(palier).map(([cle, valeur]) => {
    if (cle === 'xpBonus') return `+${Math.round(valeur * 100)} % XP`;
    if (cle === 'poBonus') return `+${Math.round(valeur * 100)} % or`;
    return texteBonus({ [cle]: valeur });
  }).join(' · ');
}

// Bonus de panoplies actives d'un héros : compte les pièces équipées de
// chaque collection et cumule les paliers atteints.
function bonusSetActifs(p) {
  const parSet = {};
  Object.values(p.equipement || {}).forEach((idObjet) => {
    if (!idObjet) return;
    const objet = OBJETS[idObjet];
    if (objet && objet.set) parSet[objet.set] = (parSet[objet.set] || 0) + 1;
  });
  const cumul = { stats: {}, xpBonus: 0, poBonus: 0, actifs: [] };
  Object.entries(parSet).forEach(([idSet, pieces]) => {
    const set = SETS[idSet];
    if (!set || pieces < 2) return;
    const paliers = BONUS_SET_PAR_RARETE[set.rarete];
    const atteints = [];
    [2, 4].forEach((seuil) => {
      if (pieces < seuil) return;
      atteints.push(seuil);
      Object.entries(paliers[seuil]).forEach(([cle, valeur]) => {
        if (cle === 'xpBonus') cumul.xpBonus += valeur;
        else if (cle === 'poBonus') cumul.poBonus += valeur;
        else cumul.stats[cle] = (cumul.stats[cle] || 0) + valeur;
      });
    });
    cumul.actifs.push({ idSet, nom: set.nom, rarete: set.rarete, pieces, atteints });
  });
  return cumul;
}

// Multiplicateur d'or gagné : familier + panoplies + équipement.
// Les reliques de Chronique portent un bonus d'or (`poBonus`) qui n'était
// jusqu'ici jamais compté nulle part — il l'est désormais.
function multiplicateurOr(p) {
  const familier = familierActif(p);
  const equipement = Object.values(p.equipement || {}).reduce((somme, id) => {
    const objet = id && OBJETS[id];
    return somme + ((objet && objet.bonus && objet.bonus.poBonus) || 0);
  }, 0);
  return 1 + ((familier && familier.bonus.poBonus) || 0) + bonusSetActifs(p).poBonus + equipement;
}

// Ligne d'affichage de la panoplie d'un objet (cartes d'inventaire/boutique).
function texteSet(objet) {
  if (!objet || !objet.set || !SETS[objet.set]) return '';
  const set = SETS[objet.set];
  const paliers = BONUS_SET_PAR_RARETE[set.rarete];
  return `<div class="objet-set" title="2 pièces : ${textePalierSet(paliers[2])} — 4 pièces : ${textePalierSet(paliers[4])}">⚙️ ${set.nom} <span class="set-paliers">(2 p. : ${textePalierSet(paliers[2])} · 4 p. : ${textePalierSet(paliers[4])})</span></div>`;
}

// ---------------------------------------------------------------------
// Cohérence du craft (v12.2) : chaque pièce exige EN PLUS de la recette
// de sa série les matériaux bruts de SA filière — forge (pierres et
// minerais), tannerie (cuirs et dépouilles), tisserand/alchimiste
// (plantes et fibres) — choisis dans la tranche de niveau de la série.
// Résultat : on récolte sur toutes les cartes, et chaque sous-classe
// de récolteur devient précieuse pour un pan de l'artisanat.
// ---------------------------------------------------------------------
const ECHELLE_FILIERE = {
  mine:   [[1, 'minerai-cuivre'], [14, 'minerai-fer'], [22, 'basalte-poli'], [30, 'obsidienne-brute'], [38, 'bois-petrifie'], [46, 'fragment-de-foudre']],
  peau:   [[1, 'peau-de-loup'], [14, 'os-ancien'], [22, 'plume-de-rokh'], [30, 'corail-sanglant'], [38, 'os-de-geant'], [46, 'plume-d-archon']],
  plante: [[1, 'fibre-sauvage'], [14, 'lotus-noir'], [22, 'liane-tressee'], [30, 'nacre-abyssale'], [38, 'cendre-fertile'], [46, 'etoffe-du-neant']],
};
const SIGNATURE_FILIERE = { mine: 'pierre-magique', peau: 'cuir-primal', plante: 'tissu-magique' };

// À quelle filière de récolte appartient une pièce d'équipement ?
function filiereDeSlot(slot) {
  if (slot === 'mains' || slot === 'pieds') return 'peau';      // la Tannerie
  if (slot === 'accessoire') return 'plante';                    // le Tisserand
  return 'mine';                                                 // la Forge
}

function materiauxDePiece(serie, slot) {
  const filiere = filiereDeSlot(slot);
  let brut = ECHELLE_FILIERE[filiere][0][1];
  ECHELLE_FILIERE[filiere].forEach(([seuil, id]) => { if (serie.niveau >= seuil) brut = id; });
  const materiaux = { ...serie.materiaux };
  materiaux[brut] = (materiaux[brut] || 0) + 2;
  // Dès le niveau 20, les matériaux signatures des sous-classes entrent
  // dans la danse : le mineur forge pour les guerriers, le tanneur
  // chausse les agiles, le tisseur pare les mages.
  if (serie.niveau >= 20) {
    const signature = SIGNATURE_FILIERE[filiere];
    materiaux[signature] = (materiaux[signature] || 0) + 1;
  }
  return materiaux;
}

// Le générateur de pièces, sorti en fonction : les Marches Fêlées
// ajoutent leurs propres séries après le chargement de ce fichier.
function construireSeriesCraft(series) {
  series.forEach((serie) => {
  const mult = MULT_RARETE_CRAFT[serie.rarete];
  // v20 : l'artisanat passe par la même échelle que le butin et l'étal
  // (voir progression.js) — avec la petite prime qui récompense la forge.
  const principal = Math.max(2, Math.round(statPrincipaleObjet(serie.niveau, mult) * 1.1));
  const secondaire = statSecondaireObjet(principal);
  const idBase = serie.suffixe.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const pieces = [
    { cle: 'lame',      nom: `Lame ${serie.suffixe}`,      emoji: '⚔️', slot: 'arme', familleArme: 'lame',    bonus: { for: principal, vit: secondaire } },
    { cle: 'focus',     nom: `Focus ${serie.suffixe}`,     emoji: '🔮', slot: 'arme', familleArme: 'baton',   bonus: { int: principal, pmMax: secondaire * 3 } },
    { cle: 'arc',       nom: `Arc ${serie.suffixe}`,       emoji: '🏹', slot: 'arme', familleArme: 'arc',     bonus: { dex: principal, crit: secondaire } },
    { cle: 'calice',    nom: `Calice ${serie.suffixe}`,    emoji: '🕊️', slot: 'arme', familleArme: 'calice',  bonus: { esp: principal, pmMax: secondaire * 3 } },
    { cle: 'faux',      nom: `Faux ${serie.suffixe}`,      emoji: '🌑', slot: 'arme', familleArme: 'runique', bonus: { int: principal, vit: secondaire } },
    { cle: 'pavois',    nom: `Pavois ${serie.suffixe}`,    emoji: '🛡️', slot: 'arme', familleArme: 'pavois',  bonus: { vit: principal, tenacite: sousCaracObjet(serie.niveau, mult) } },
    { cle: 'armure',    nom: `Armure ${serie.suffixe}`,    emoji: '🛡️', slot: 'torse',      bonus: { vit: Math.max(1, Math.round(principal * 0.7)), pvMax: reservePvObjet(serie.niveau, mult * 2.2) } },
    { cle: 'heaume',    nom: `Heaume ${serie.suffixe}`,    emoji: '🪖', slot: 'tete',       bonus: { vit: secondaire, pvMax: reservePvObjet(serie.niveau, mult * 1.5) } },
    { cle: 'jambieres', nom: `Jambières ${serie.suffixe}`, emoji: '👖', slot: 'jambes',     bonus: { dex: secondaire, vit: secondaire, pvMax: reservePvObjet(serie.niveau, mult * 0.8) } },
    { cle: 'talisman',  nom: `Talisman ${serie.suffixe}`,  emoji: '🧿', slot: 'accessoire', bonus: { cha: Math.max(1, Math.round(secondaire * 0.6)), vit: secondaire, crit: sousCaracObjet(serie.niveau, mult) } },
    { cle: 'grimoire',  nom: `Grimoire ${serie.suffixe}`,  emoji: '📖', slot: 'accessoire', bonus: { int: secondaire + 1, pmMax: reservePmObjet(serie.niveau, mult * 1.4), cha: Math.max(1, Math.round(secondaire * 0.5)) } },
    { cle: 'gants',     nom: `Gants ${serie.suffixe}`,     emoji: '🧤', slot: 'mains',      bonus: { for: secondaire, dex: secondaire, tenacite: sousCaracObjet(serie.niveau, mult) } },
    { cle: 'bottes',    nom: `Bottes ${serie.suffixe}`,    emoji: '🥾', slot: 'pieds',      bonus: { dex: secondaire, vit: secondaire, celerite: sousCaracObjet(serie.niveau, mult) } },
  ];
  SETS[`craft-${idBase}`] = { nom: `Série ${serie.suffixe}`, rarete: serie.rarete };
  pieces.forEach((piece) => {
    // Un id généré ne doit JAMAIS écraser un objet écrit à la main : la
    // série « de Fer » produisait 'lame-de-fer'… l'id exact de l'épée du
    // catalogue, qui disparaissait alors des rayons de l'armurerie (et
    // mutait dans les sacs des joueurs qui la possédaient).
    let id = `${piece.cle}-${idBase}`;
    if (OBJETS[id]) id = `craft-${id}`;
    OBJETS[id] = {
      nom: piece.nom, emoji: piece.emoji, type: 'equipement', slot: piece.slot,
      // Une pièce d'armure porte la matière de sa série ; une arme, sa famille.
      armure: piece.familleArme ? null : (SLOTS_ARMURE.includes(piece.slot) ? serie.armure : null),
      familleArme: piece.familleArme || null,
      niveau: serie.niveau, rarete: serie.rarete,
      prixVente: Math.round(serie.po * 0.6),
      bonus: piece.bonus,
      set: `craft-${idBase}`,
      desc: `Série ${serie.suffixe} — se forge à l’atelier.`,
    };
    RECETTES.push({ resultat: id, niveau: serie.niveau, po: serie.po, materiaux: materiauxDePiece(serie, piece.slot) });
  });
  });
}

construireSeriesCraft(SETS_CRAFT);
RECETTES.sort((a, b) => a.niveau - b.niveau);
