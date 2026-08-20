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
  { resultat: 'bombe-ardente',       niveau: 12, po: 45, materiaux: { 'venin-concentre': 1, 'minerai-cuivre': 1, 'seve-ambree': 1 } },
  { resultat: 'orbe-des-dunes',     niveau: 28, po: 420, materiaux: { 'perle-des-sables': 2, 'minerai-fer': 2 } },
  { resultat: 'couronne-mystique',  niveau: 64, po: 2400, materiaux: { 'cristal-givre': 1, 'poussiere-spectre': 2, 'nacre-abyssale': 2 } },
  { resultat: 'jambieres-zephyr',   niveau: 16, po: 220, materiaux: { 'soie-araignee': 2, 'peau-de-loup': 2, 'ambre-noir': 1 } },
  { resultat: 'coeur-givre',        niveau: 68, po: 2800, materiaux: { 'cristal-givre': 2, 'noyau-golem': 1 } },
  { resultat: 'armure-draconique',  niveau: 68, po: 3000, materiaux: { 'ecaille-draconique': 2, 'noyau-golem': 1, 'peau-de-mammouth': 2 } },
  { resultat: 'oeil-dragon',        niveau: 68, po: 3200, materiaux: { 'ecaille-draconique': 1, 'cristal-givre': 1, 'noyau-golem': 1 } },
  { resultat: 'lame-crepuscule',    niveau: 68, po: 3000, materiaux: { 'obsidienne-brute': 3, 'os-ancien': 2, 'ecaille-draconique': 1 } },
  { resultat: 'sceptre-neant',      niveau: 68, po: 3000, materiaux: { 'cristal-givre': 2, 'poussiere-spectre': 3, 'noyau-golem': 1 } },
  { resultat: 'arc-du-vent',        niveau: 68, po: 3000, materiaux: { 'cristal-givre': 2, 'plume-d-archon': 1, 'ecaille-draconique': 1 } },
];

// =====================================================================
// Séries d'artisanat : une trentaine de séries de 13 pièces, générées
// ci-dessous (le codex compte le chiffre exact à chaque publication).
// Chaque série a son niveau, sa rareté, ses matériaux et son coût.
// =====================================================================
// v26 — Les séries suivent la nouvelle route du monde : chaque acte a
// ses panoplies, forgées avec les matériaux de SES terres.
const SETS_CRAFT = [
  // Acte I — Le Réveil des Terres Sauvages (niv. 1-20)
  { suffixe: 'du Loup', armure: 'cuir',      niveau: 3,  rarete: 'commun',     po: 18,  materiaux: { 'peau-de-loup': 2, 'fibre-sauvage': 2 } },
  { suffixe: 'du Sanglier', armure: 'cuir',  niveau: 5,  rarete: 'commun',     po: 30,  materiaux: { 'defense-sanglier': 2, 'peau-de-loup': 1 } },
  { suffixe: 'des Murmures', armure: 'tissu', niveau: 7,  rarete: 'inhabituel', po: 55,  materiaux: { 'bois-chene': 2, 'seve-ambree': 2 } },
  { suffixe: 'de la Veuve', armure: 'tissu',  niveau: 9,  rarete: 'inhabituel', po: 75,  materiaux: { 'soie-araignee': 3, 'fibre-sauvage': 2 } },
  { suffixe: 'du Marais', armure: 'tissu',    niveau: 11, rarete: 'rare',       po: 120, materiaux: { 'lotus-noir': 2, 'herbe-lunaire': 2, 'seve-ambree': 1 } },
  { suffixe: 'de Vaï-Sombre', armure: 'cuir', niveau: 13, rarete: 'rare',       po: 170, materiaux: { 'liane-tressee': 3, 'orchidee-lunaire': 2, 'venin-concentre': 1 } },
  { suffixe: 'de l’Aube', armure: 'maille',   niveau: 15, rarete: 'rare',       po: 210, materiaux: { 'resine-de-jungle': 1, 'liane-tressee': 2, 'lotus-noir': 2 } },
  { suffixe: 'du Spectre', armure: 'tissu',   niveau: 17, rarete: 'epique',     po: 280, materiaux: { 'bois-petrifie': 2, 'ambre-noir': 2 } },
  { suffixe: 'du Golem', armure: 'plaque',    niveau: 19, rarete: 'epique',     po: 340, materiaux: { 'quartz-eveille': 1, 'bois-petrifie': 2, 'sphere-runique': 1 } },
  // Acte II — L'Épreuve des Arides (niv. 20-40)
  { suffixe: 'de Fer', armure: 'plaque',      niveau: 21, rarete: 'rare',       po: 380, materiaux: { 'minerai-fer': 3, 'minerai-cuivre': 2 } },
  { suffixe: 'du Cuivre', armure: 'maille',   niveau: 23, rarete: 'rare',       po: 430, materiaux: { 'lingot-ferreux': 1, 'minerai-cuivre': 3, 'peau-de-loup': 1 } },
  { suffixe: 'des Falaises', armure: 'cuir',  niveau: 27, rarete: 'rare',       po: 520, materiaux: { 'alliage-hurlant': 1, 'basalte-poli': 3, 'plume-de-rokh': 2 } },
  { suffixe: 'des Dunes', armure: 'cuir',     niveau: 29, rarete: 'epique',     po: 600, materiaux: { 'perle-des-sables': 2, 'basalte-poli': 2, 'lingot-ferreux': 1 } },
  { suffixe: 'du Béhémoth', armure: 'plaque', niveau: 35, rarete: 'epique',     po: 780, materiaux: { 'perle-de-magma': 1, 'obsidienne-brute': 3, 'lingot-ferreux': 2 } },
  { suffixe: 'des Titans', armure: 'plaque',  niveau: 39, rarete: 'legendaire', po: 950, materiaux: { 'moelle-titanesque': 1, 'os-de-geant': 3, 'peau-de-mammouth': 2 } },
  // Acte III — Les Mémoires Perdues (niv. 40-60)
  { suffixe: 'des Cryptes', armure: 'maille', niveau: 41, rarete: 'epique',     po: 1100, materiaux: { 'os-ancien': 3, 'poussiere-spectre': 2 } },
  { suffixe: 'des Glaces', armure: 'maille',  niveau: 45, rarete: 'epique',     po: 1300, materiaux: { 'toile-runique': 1, 'echo-fossilise': 2, 'os-ancien': 2 } },
  { suffixe: 'du Dragon', armure: 'plaque',   niveau: 53, rarete: 'legendaire', po: 1800, materiaux: { 'graine-renversee': 2, 'echo-fossilise': 2, 'sphere-runique': 2 } },
];

const MULT_RARETE_CRAFT = { commun: 1, inhabituel: 1.12, rare: 1.25, epique: 1.4, legendaire: 1.6, mythique: 1.85, divin: 2.2 };

// ---------------------------------------------------------------------
// Raffinage (v10) : les grandes séries exigent des matériaux raffinés,
// eux-mêmes fabriqués à partir de beaucoup de récolte brute. Il va
// falloir farmer — c'est le but.
// ---------------------------------------------------------------------
Object.assign(OBJETS, {
  'lingot-ferreux':    { nom: 'Lingot ferreux', emoji: '🧱', type: 'materiau', rarete: 'rare', prixVente: 130, desc: 'Fer et cuivre fondus ensemble à l’atelier.' },
  'cuir-double':       { nom: 'Cuir doublé', emoji: '🟫', type: 'materiau', rarete: 'inhabituel', prixVente: 30, desc: 'Deux peaux, une couture, zéro courant d’air.' },
  'essence-sylvestre': { nom: 'Essence sylvestre', emoji: '🍃', type: 'materiau', rarete: 'inhabituel', prixVente: 40, desc: 'La forêt distillée goutte à goutte.' },
  'toile-runique':     { nom: 'Toile runique', emoji: '🕸️', type: 'materiau', rarete: 'epique', prixVente: 300, desc: 'Tissée de poussière de spectre et de givre.' },
  'alliage-hurlant':   { nom: 'Alliage hurlant', emoji: '🔩', type: 'materiau', rarete: 'rare', prixVente: 180, desc: 'Il vibre encore du chant des falaises.' },
  'resine-de-jungle':  { nom: 'Résine de jungle', emoji: '🫙', type: 'materiau', rarete: 'rare', prixVente: 70, desc: 'Colle tout. Y compris les doigts. Surtout les doigts.' },
  'perle-de-magma':    { nom: 'Perle de magma', emoji: '🔴', type: 'materiau', rarete: 'epique', prixVente: 260, desc: 'Une goutte de volcan, ronde et patiente.' },
  'sel-d-abysse':      { nom: 'Sel d’abysse', emoji: '🧂', type: 'materiau', rarete: 'epique', prixVente: 600, desc: 'Le sel des larmes de sirène. Hors de prix, comme le chagrin.' },
  'moelle-titanesque': { nom: 'Moelle titanesque', emoji: '🦴', type: 'materiau', rarete: 'epique', prixVente: 300, desc: 'La force des géants, réduite en concentré.' },
  'quartz-eveille':    { nom: 'Quartz éveillé', emoji: '💠', type: 'materiau', rarete: 'rare', prixVente: 90, desc: 'Il cligne doucement quand on lui parle.' },
  'coeur-d-orage':     { nom: 'Cœur d’orage', emoji: '🌩️', type: 'materiau', rarete: 'legendaire', prixVente: 850, desc: 'Un orage entier, plié en huit.' },
  'fil-du-neant':      { nom: 'Fil du néant', emoji: '🧵', type: 'materiau', rarete: 'mythique', prixVente: 1250, desc: 'On coud avec du rien. Ça tient très bien.' },
});

// Recettes de raffinage : beaucoup de brut pour un seul raffiné.
[
  { resultat: 'lingot-ferreux',    niveau: 22, po: 60,  materiaux: { 'minerai-fer': 5, 'minerai-cuivre': 3 } },
  { resultat: 'cuir-double',       niveau: 8,  po: 20,  materiaux: { 'peau-de-loup': 4, 'soie-araignee': 3 } },
  { resultat: 'essence-sylvestre', niveau: 10, po: 30,  materiaux: { 'seve-ambree': 4, 'herbe-lunaire': 4, 'lotus-noir': 3 } },
  { resultat: 'toile-runique',     niveau: 42, po: 320, materiaux: { 'poussiere-spectre': 3, 'os-ancien': 2, 'echo-fossilise': 2 } },
  { resultat: 'alliage-hurlant',   niveau: 26, po: 130, materiaux: { 'basalte-poli': 4, 'cristal-hurleur': 2, 'plume-de-rokh': 2 } },
  { resultat: 'resine-de-jungle',  niveau: 14, po: 60,  materiaux: { 'liane-tressee': 4, 'orchidee-lunaire': 3, 'venin-concentre': 2 } },
  { resultat: 'perle-de-magma',    niveau: 34, po: 220, materiaux: { 'obsidienne-brute': 4, 'coeur-de-braise': 2, 'cendre-fertile': 3 } },
  { resultat: 'sel-d-abysse',      niveau: 62, po: 780, materiaux: { 'nacre-abyssale': 4, 'larme-de-sirene': 2, 'corail-sanglant': 3 } },
  { resultat: 'moelle-titanesque', niveau: 38, po: 260, materiaux: { 'os-de-geant': 4, 'peau-de-mammouth': 3, 'relique-antique': 1 } },
  { resultat: 'quartz-eveille',    niveau: 18, po: 90,  materiaux: { 'bois-petrifie': 4, 'ambre-noir': 3, 'sphere-runique': 1 } },
  { resultat: 'coeur-d-orage',     niveau: 72, po: 1200, materiaux: { 'fragment-de-foudre': 4, 'acier-celeste': 3, 'plume-d-archon': 1 } },
  { resultat: 'fil-du-neant',      niveau: 84, po: 1800, materiaux: { 'etoffe-du-neant': 4, 'eclat-d-etoile': 3, 'essence-primordiale': 1 } },
].forEach((recette) => RECETTES.push(recette));

// Les grandes séries des Terres lointaines : chaque pièce coûte des
// matériaux raffinés en quantité — des heures de récolte bien investies.
// Acte IV — L'Abîme Élémen-Terre (niv. 60-77) : les grandes séries
// élémentaires, gourmandes en matériaux raffinés.
SETS_CRAFT.push(
  { suffixe: 'des Abysses', armure: 'maille',  niveau: 63, rarete: 'legendaire', po: 2800, materiaux: { 'sel-d-abysse': 1, 'nacre-abyssale': 3, 'corail-sanglant': 2 } },
  { suffixe: 'du Blizzard', armure: 'maille',  niveau: 67, rarete: 'legendaire', po: 3200, materiaux: { 'cristal-givre': 3, 'peau-de-mammouth': 2, 'sel-d-abysse': 1 } },
  { suffixe: 'du Magma', armure: 'plaque',     niveau: 70, rarete: 'legendaire', po: 3600, materiaux: { 'noyau-golem': 2, 'ecaille-draconique': 2, 'coeur-de-braise': 3 } },
  { suffixe: 'du Firmament', armure: 'tissu',  niveau: 73, rarete: 'mythique',   po: 4200, materiaux: { 'coeur-d-orage': 1, 'acier-celeste': 3, 'fragment-de-foudre': 3 } },
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
  { resultat: 'etoffe-enchantee', niveau: 30, po: 200, materiaux: { 'tissu-magique': 4, 'essence-sylvestre': 2 } },
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
  { suffixe: 'des Trois Maîtres', armure: 'maille', niveau: 47, rarete: 'mythique', po: 2200, materiaux: { 'lingot-arcanique': 1, 'cuir-de-legende': 1, 'etoffe-enchantee': 1 } },
);

// L'alchimiste apprend à fabriquer les objets tactiques : potions,
// bombes et philtres, à base de plantes, venins et pierres magiques.
[
  { resultat: 'poudre-evasion',  niveau: 10, po: 20,  materiaux: { 'fibre-sauvage': 2, 'lotus-noir': 1 } },
  { resultat: 'trefle-seche',    niveau: 12, po: 45,  materiaux: { 'herbe-lunaire': 2, 'fibre-sauvage': 3 } },
  { resultat: 'bombe-de-givre',  niveau: 14, po: 40,  materiaux: { 'pierre-magique': 1, 'ambre-noir': 1, 'herbe-lunaire': 1 } },
  { resultat: 'fiole-acide',     niveau: 14, po: 50,  materiaux: { 'venin-concentre': 1, 'seve-ambree': 2 } },
  { resultat: 'bombe-foudre',    niveau: 26, po: 60,  materiaux: { 'pierre-magique': 1, 'cristal-hurleur': 1, 'lotus-noir': 1 } },
  { resultat: 'potion-colosse',  niveau: 26, po: 160, materiaux: { 'essence-sylvestre': 1, 'lotus-noir': 3, 'seve-ambree': 3 } },
  { resultat: 'elixir-titan',    niveau: 34, po: 90,  materiaux: { 'essence-sylvestre': 1, 'coeur-de-braise': 1 } },
  { resultat: 'bombe-obscure',   niveau: 42, po: 110, materiaux: { 'pierre-magique': 2, 'poussiere-spectre': 3, 'obsidienne-brute': 1 } },
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

// Multiplicateur d'or gagné : familier + panoplies + équipement + titre.
// Les reliques de Chronique portent un bonus d'or (`poBonus`) qui n'était
// jusqu'ici jamais compté nulle part — il l'est désormais.
function multiplicateurOr(p) {
  const familier = familierActif(p);
  const equipement = Object.values(p.equipement || {}).reduce((somme, id) => {
    const objet = id && OBJETS[id];
    return somme + ((objet && objet.bonus && objet.bonus.poBonus) || 0);
  }, 0);
  // v28 : le titre porté peut remplir la bourse, comme le familier.
  const titre = typeof bonusTitre === 'function' ? bonusTitre(p, 'poBonus') : 0;
  // « Poches percées » : le Voleur repart toujours avec plus.
  return 1 + ((familier && familier.bonus.poBonus) || 0) + bonusSetActifs(p).poBonus + equipement
    + titre + reglagePassif(p, 'bonusOr', 0);
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
  mine:   [[1, 'minerai-cuivre'], [16, 'bois-petrifie'], [20, 'minerai-fer'], [32, 'obsidienne-brute'], [64, 'cristal-givre'], [74, 'verre-de-mer'], [89, 'braise-crepusculaire']],
  peau:   [[1, 'peau-de-loup'], [12, 'venin-concentre'], [24, 'plume-de-rokh'], [36, 'peau-de-mammouth'], [40, 'os-ancien'], [60, 'corail-sanglant'], [77, 'plume-d-archon']],
  plante: [[1, 'fibre-sauvage'], [8, 'lotus-noir'], [12, 'liane-tressee'], [32, 'cendre-fertile'], [48, 'graine-renversee'], [60, 'nacre-abyssale'], [83, 'etoffe-du-neant']],
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
    { cle: 'pavois',    nom: `Pavois ${serie.suffixe}`,    emoji: '🛡️', slot: 'arme', familleArme: 'pavois',  bonus: { vit: principal, deter: sousCaracObjet(serie.niveau, mult) } },
    { cle: 'armure',    nom: `Armure ${serie.suffixe}`,    emoji: '🛡️', slot: 'torse',      bonus: { vit: Math.max(1, Math.round(principal * 0.7)), pvMax: reservePvObjet(serie.niveau, mult * 2.2) } },
    { cle: 'heaume',    nom: `Heaume ${serie.suffixe}`,    emoji: '🪖', slot: 'tete',       bonus: { vit: secondaire, pvMax: reservePvObjet(serie.niveau, mult * 1.5) } },
    { cle: 'jambieres', nom: `Jambières ${serie.suffixe}`, emoji: '👖', slot: 'jambes',     bonus: { dex: secondaire, vit: secondaire, pvMax: reservePvObjet(serie.niveau, mult * 0.8) } },
    { cle: 'talisman',  nom: `Talisman ${serie.suffixe}`,  emoji: '🧿', slot: 'accessoire', bonus: { cha: Math.max(1, Math.round(secondaire * 0.6)), vit: secondaire, crit: sousCaracObjet(serie.niveau, mult) } },
    { cle: 'grimoire',  nom: `Grimoire ${serie.suffixe}`,  emoji: '📖', slot: 'accessoire', bonus: { int: secondaire + 1, pmMax: reservePmObjet(serie.niveau, mult * 1.4), cha: Math.max(1, Math.round(secondaire * 0.5)) } },
    { cle: 'gants',     nom: `Gants ${serie.suffixe}`,     emoji: '🧤', slot: 'mains',      bonus: { for: secondaire, dex: secondaire, deter: sousCaracObjet(serie.niveau, mult) } },
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
