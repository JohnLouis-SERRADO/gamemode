'use strict';

// =====================================================================
// Catalogue d'objets : équipement, consommables, matériaux.
// type : 'equipement' | 'consommable' | 'materiau'
// slot : 'arme' | 'tete' | 'torse' | 'jambes' | 'accessoire'
// bonus : { for, int, agi, vit, pvMax, pmMax, crit (%) }
// prix : prix d'achat en boutique (absent = introuvable en boutique)
// prixVente : prix de vente d'un matériau (équipement/consommable : 40 % du prix)
// =====================================================================

const SLOTS_EQUIPEMENT = {
  arme: { nom: 'Arme', emoji: '⚔️' },
  tete: { nom: 'Tête', emoji: '🪖' },
  torse: { nom: 'Torse', emoji: '🥋' },
  jambes: { nom: 'Jambes', emoji: '👖' },
  acc1: { nom: 'Accessoire 1', emoji: '💍' },
  acc2: { nom: 'Accessoire 2', emoji: '📿' },
};

const OBJETS = {
  // ----- Armes : Force -----
  'epee-courte':      { nom: 'Épée courte', emoji: '🗡️', type: 'equipement', slot: 'arme', niveau: 1, prix: 40,  bonus: { for: 2 }, desc: 'Une lame simple et fiable.' },
  'lame-de-fer':      { nom: 'Lame de fer', emoji: '⚔️', type: 'equipement', slot: 'arme', niveau: 4, prix: 90,  bonus: { for: 4, vit: 1 }, desc: 'Forgée dans le fer des Collines.' },
  'epee-chevalier':   { nom: 'Épée de chevalier', emoji: '⚔️', type: 'equipement', slot: 'arme', niveau: 8, prix: 260, bonus: { for: 7, vit: 2 }, desc: 'L’arme des défenseurs de Valciel.' },
  'croc-de-guerre':   { nom: 'Croc de guerre', emoji: '🪓', type: 'equipement', slot: 'arme', niveau: 12, prix: 480, bonus: { for: 10, agi: 2 }, desc: 'Taillée pour les champs de bataille.' },
  'lame-crepuscule':  { nom: 'Lame du crépuscule', emoji: '🌘', type: 'equipement', slot: 'arme', niveau: 16, prixVente: 350, bonus: { for: 14, agi: 3, crit: 5 }, desc: 'Une lame légendaire, forgée à l’atelier seulement.' },

  // ----- Armes : Intelligence -----
  'baton-noueux':     { nom: 'Bâton noueux', emoji: '🪄', type: 'equipement', slot: 'arme', niveau: 1, prix: 40,  bonus: { int: 2 }, desc: 'Un bâton de novice, chargé d’une étincelle.' },
  'baton-sorcier':    { nom: 'Bâton de sorcier', emoji: '🔮', type: 'equipement', slot: 'arme', niveau: 4, prix: 90,  bonus: { int: 4, pmMax: 6 }, desc: 'Canalise le mana avec aisance.' },
  'sceptre-runique':  { nom: 'Sceptre runique', emoji: '✨', type: 'equipement', slot: 'arme', niveau: 8, prix: 260, bonus: { int: 7, pmMax: 10 }, desc: 'Gravé de runes anciennes.' },
  'baton-tempetes':   { nom: 'Bâton des tempêtes', emoji: '⚡', type: 'equipement', slot: 'arme', niveau: 12, prix: 480, bonus: { int: 10, pmMax: 14 }, desc: 'L’orage y gronde en permanence.' },
  'sceptre-neant':    { nom: 'Sceptre du néant', emoji: '🌀', type: 'equipement', slot: 'arme', niveau: 16, prixVente: 350, bonus: { int: 14, pmMax: 20, crit: 5 }, desc: 'Un artefact légendaire, forgé à l’atelier seulement.' },

  // ----- Armes : Agilité -----
  'arc-court':        { nom: 'Arc court', emoji: '🏹', type: 'equipement', slot: 'arme', niveau: 1, prix: 40,  bonus: { agi: 2 }, desc: 'Léger et maniable.' },
  'arc-chasse':       { nom: 'Arc de chasse', emoji: '🏹', type: 'equipement', slot: 'arme', niveau: 4, prix: 90,  bonus: { agi: 4, for: 1 }, desc: 'L’allié des pisteurs des Plaines.' },
  'arc-elfique':      { nom: 'Arc long elfique', emoji: '🏹', type: 'equipement', slot: 'arme', niveau: 8, prix: 260, bonus: { agi: 7, for: 2 }, desc: 'Un bois souple venu de la Forêt des Murmures.' },
  'arc-precision':    { nom: 'Arc de précision', emoji: '🎯', type: 'equipement', slot: 'arme', niveau: 12, prix: 480, bonus: { agi: 10, crit: 4 }, desc: 'Chaque flèche trouve sa cible.' },
  'arc-du-vent':      { nom: 'Arc du vent', emoji: '🌪️', type: 'equipement', slot: 'arme', niveau: 16, prixVente: 350, bonus: { agi: 14, crit: 8 }, desc: 'Un arc légendaire, forgé à l’atelier seulement.' },

  // ----- Tête -----
  'capuche-cuir':     { nom: 'Capuche de cuir', emoji: '🧢', type: 'equipement', slot: 'tete', niveau: 2, prix: 45,  bonus: { vit: 1, agi: 1 }, desc: 'Discrète et confortable.' },
  'casque-fer':       { nom: 'Casque de fer', emoji: '⛑️', type: 'equipement', slot: 'tete', niveau: 6, prix: 130, bonus: { vit: 2, pvMax: 10 }, desc: 'Protège des mauvais coups.' },
  'diademe-mage':     { nom: 'Diadème de mage', emoji: '👑', type: 'equipement', slot: 'tete', niveau: 6, prix: 130, bonus: { int: 2, pmMax: 8 }, desc: 'Aiguise l’esprit.' },
  'heaume-chevalier': { nom: 'Heaume de chevalier', emoji: '🪖', type: 'equipement', slot: 'tete', niveau: 10, prix: 300, bonus: { vit: 4, pvMax: 20 }, desc: 'Le heaume des champions.' },
  'couronne-mystique': { nom: 'Couronne mystique', emoji: '👑', type: 'equipement', slot: 'tete', niveau: 14, prixVente: 250, bonus: { int: 4, vit: 3, pmMax: 15 }, desc: 'Se fabrique à l’atelier seulement.' },

  // ----- Torse -----
  'tunique-lin':      { nom: 'Tunique de lin', emoji: '👕', type: 'equipement', slot: 'torse', niveau: 2, prix: 50,  bonus: { vit: 2 }, desc: 'Simple, mais mieux que rien.' },
  'cotte-mailles':    { nom: 'Cotte de mailles', emoji: '🥋', type: 'equipement', slot: 'torse', niveau: 6, prix: 150, bonus: { vit: 3, pvMax: 15 }, desc: 'Un classique des aventuriers.' },
  'robe-enchantee':   { nom: 'Robe enchantée', emoji: '🥻', type: 'equipement', slot: 'torse', niveau: 6, prix: 150, bonus: { int: 2, vit: 2, pmMax: 10 }, desc: 'Tissée de fils de mana.' },
  'plastron-fer':     { nom: 'Plastron de fer', emoji: '🛡️', type: 'equipement', slot: 'torse', niveau: 10, prix: 330, bonus: { vit: 5, pvMax: 25 }, desc: 'Une forteresse portable.' },
  'armure-draconique': { nom: 'Armure draconique', emoji: '🐲', type: 'equipement', slot: 'torse', niveau: 14, prixVente: 300, bonus: { vit: 6, for: 2, pvMax: 40 }, desc: 'Se forge à l’atelier avec des écailles de dragon.' },

  // ----- Jambes -----
  'pantalon-toile':   { nom: 'Pantalon de toile', emoji: '👖', type: 'equipement', slot: 'jambes', niveau: 2, prix: 40,  bonus: { vit: 1, agi: 1 }, desc: 'Pratique pour marcher loin.' },
  'jambieres-cuir':   { nom: 'Jambières de cuir', emoji: '🦵', type: 'equipement', slot: 'jambes', niveau: 6, prix: 120, bonus: { vit: 2, agi: 2 }, desc: 'Souples et résistantes.' },
  'jambieres-plates': { nom: 'Jambières de plates', emoji: '🦿', type: 'equipement', slot: 'jambes', niveau: 10, prix: 260, bonus: { vit: 4, pvMax: 15 }, desc: 'Lourdes, mais sûres.' },
  'jambieres-zephyr': { nom: 'Jambières du zéphyr', emoji: '💨', type: 'equipement', slot: 'jambes', niveau: 14, prixVente: 250, bonus: { agi: 4, vit: 3, crit: 3 }, desc: 'Se cousent à l’atelier seulement.' },

  // ----- Accessoires -----
  'anneau-force':     { nom: 'Anneau de force', emoji: '💍', type: 'equipement', slot: 'accessoire', niveau: 3, prix: 80,  bonus: { for: 2 }, desc: 'Un anneau qui durcit le poing.' },
  'anneau-esprit':    { nom: 'Anneau d’esprit', emoji: '💍', type: 'equipement', slot: 'accessoire', niveau: 3, prix: 80,  bonus: { int: 2 }, desc: 'Un anneau qui éclaircit les pensées.' },
  'anneau-vent':      { nom: 'Anneau de vent', emoji: '💍', type: 'equipement', slot: 'accessoire', niveau: 3, prix: 80,  bonus: { agi: 2 }, desc: 'Un anneau léger comme une brise.' },
  'amulette-vie':     { nom: 'Amulette de vie', emoji: '📿', type: 'equipement', slot: 'accessoire', niveau: 5, prix: 120, bonus: { pvMax: 15 }, desc: 'Bat doucement, comme un second cœur.' },
  'talisman-mana':    { nom: 'Talisman de mana', emoji: '🧿', type: 'equipement', slot: 'accessoire', niveau: 5, prix: 120, bonus: { pmMax: 10 }, desc: 'Une réserve d’énergie arcanique.' },
  'anneau-chasseur':  { nom: 'Anneau du chasseur', emoji: '💍', type: 'equipement', slot: 'accessoire', niveau: 9, prix: 280, bonus: { agi: 3, crit: 3 }, desc: 'Le fétiche des grands pisteurs.' },
  'medaillon-sage':   { nom: 'Médaillon du sage', emoji: '🏅', type: 'equipement', slot: 'accessoire', niveau: 9, prix: 280, bonus: { int: 4, pmMax: 8 }, desc: 'Transmis de sage en sage.' },
  'sceau-colosse':    { nom: 'Sceau du colosse', emoji: '🔱', type: 'equipement', slot: 'accessoire', niveau: 12, prix: 420, bonus: { for: 4, pvMax: 20 }, desc: 'Pèse lourd — dans tous les sens.' },
  'oeil-dragon':      { nom: 'Œil de dragon', emoji: '🐉', type: 'equipement', slot: 'accessoire', niveau: 15, prixVente: 400, bonus: { for: 3, int: 3, crit: 5 }, desc: 'Se sertit à l’atelier seulement.' },
  'coeur-givre':      { nom: 'Cœur de givre', emoji: '❄️', type: 'equipement', slot: 'accessoire', niveau: 15, prixVente: 300, bonus: { vit: 3, pvMax: 30 }, desc: 'Se taille à l’atelier seulement.' },

  // ----- Curiosités de l'Antiquaire -----
  'pendentif-lunaire': { nom: 'Pendentif lunaire', emoji: '🌙', type: 'equipement', slot: 'accessoire', niveau: 7, prix: 160, vendeur: 'antiquaire', bonus: { int: 3, vit: 1 }, desc: 'Capture un rayon de lune éternel.' },
  'broche-scarabee':   { nom: 'Broche scarabée', emoji: '🪲', type: 'equipement', slot: 'accessoire', niveau: 10, prix: 220, vendeur: 'antiquaire', bonus: { agi: 2, vit: 2, crit: 2 }, desc: 'Porte-bonheur des pilleurs de tombes.' },
  'anneau-sanguin':    { nom: 'Anneau sanguin', emoji: '🩸', type: 'equipement', slot: 'accessoire', niveau: 11, prix: 300, vendeur: 'antiquaire', bonus: { for: 3, pvMax: 15 }, desc: 'Bat au rythme de votre cœur.' },
  'orbe-des-dunes':    { nom: 'Orbe des dunes', emoji: '🔮', type: 'equipement', slot: 'accessoire', niveau: 13, prixVente: 130, bonus: { int: 3, agi: 2, crit: 2 }, desc: 'Se façonne à l’atelier avec des perles des sables.' },

  'potion-supreme-soin': { nom: 'Potion suprême de soin', emoji: '🍷', type: 'consommable', rarete: 'rare', prixVente: 60, effet: { type: 'pv', valeur: 120 }, desc: 'Rend 120 PV. Se distille à l’atelier.' },
  'potion-supreme-mana': { nom: 'Potion suprême de mana', emoji: '🍾', type: 'consommable', rarete: 'rare', prixVente: 70, effet: { type: 'pm', valeur: 60 }, desc: 'Rend 60 PM. Se distille à l’atelier.' },
  'bombe-ardente':       { nom: 'Bombe ardente', emoji: '🧨', type: 'consommable', rarete: 'rare', prixVente: 55, effet: { type: 'bombe', valeur: 50, chanceEtourdi: 0.15 }, desc: '~50 dégâts de feu à tous les ennemis (en combat).' },

  'antidote':          { nom: 'Antidote', emoji: '🧴', type: 'consommable', prix: 12, vendeur: 'antiquaire', effet: { type: 'antidote' }, desc: 'Dissipe le poison (en combat).' },
  'bombe-de-givre':    { nom: 'Bombe de givre', emoji: '💣', type: 'consommable', prix: 45, vendeur: 'antiquaire', effet: { type: 'bombe', valeur: 30, chanceEtourdi: 0.25 }, desc: 'Souffle glacial : ~30 dégâts à tous les ennemis, 25 % de chances de les étourdir.' },
  'elixir-heroique':   { nom: 'Élixir héroïque', emoji: '🏺', type: 'consommable', prix: 55, vendeur: 'antiquaire', effet: { type: 'elixir-benediction', duree: 3 }, desc: '+30 % de dégâts pendant 3 tours (en combat).' },

  // ----- Consommables -----
  'potion-soin':        { nom: 'Potion de soin', emoji: '🧪', type: 'consommable', prix: 15,  effet: { type: 'pv', valeur: 30 },  desc: 'Rend 30 PV.' },
  'grande-potion-soin': { nom: 'Grande potion de soin', emoji: '🍶', type: 'consommable', prix: 45,  effet: { type: 'pv', valeur: 80 },  desc: 'Rend 80 PV.' },
  'elixir-vie':         { nom: 'Élixir de vie', emoji: '⚗️', type: 'consommable', prix: 120, effet: { type: 'pv', valeur: 200 }, desc: 'Rend 200 PV.' },
  'potion-mana':        { nom: 'Potion de mana', emoji: '💙', type: 'consommable', prix: 20,  effet: { type: 'pm', valeur: 25 },  desc: 'Rend 25 PM.' },
  'grande-potion-mana': { nom: 'Grande potion de mana', emoji: '🫙', type: 'consommable', prix: 60,  effet: { type: 'pm', valeur: 60 },  desc: 'Rend 60 PM.' },

  // ----- Matériaux -----
  'fibre-sauvage':     { nom: 'Fibre sauvage', emoji: '🌿', type: 'materiau', prixVente: 3,  desc: 'Fibre végétale des Plaines.' },
  'herbe-lunaire':     { nom: 'Herbe lunaire', emoji: '🌙', type: 'materiau', prixVente: 5,  desc: 'Base de la plupart des potions.' },
  'peau-de-loup':      { nom: 'Peau de loup', emoji: '🐺', type: 'materiau', prixVente: 6,  desc: 'Un cuir souple et chaud.' },
  'defense-sanglier':  { nom: 'Défense de sanglier', emoji: '🐗', type: 'materiau', prixVente: 7,  desc: 'Dure comme la pierre.' },
  'soie-araignee':     { nom: 'Soie d’araignée', emoji: '🕸️', type: 'materiau', prixVente: 10, desc: 'Plus solide que l’acier, à poids égal.' },
  'bois-chene':        { nom: 'Bois de chêne', emoji: '🪵', type: 'materiau', prixVente: 9,  desc: 'Le cœur de la Forêt des Murmures.' },
  'seve-ambree':       { nom: 'Sève ambrée', emoji: '🍯', type: 'materiau', prixVente: 11, desc: 'Concentre l’énergie de la forêt.' },
  'minerai-cuivre':    { nom: 'Minerai de cuivre', emoji: '🟠', type: 'materiau', prixVente: 14, desc: 'Extrait des Collines de Cuivre.' },
  'minerai-fer':       { nom: 'Minerai de fer', emoji: '⛏️', type: 'materiau', prixVente: 22, desc: 'Le métal des armes sérieuses.' },
  'os-ancien':         { nom: 'Os ancien', emoji: '🦴', type: 'materiau', prixVente: 26, desc: 'Imprégné de vieille magie.' },
  'poussiere-spectre': { nom: 'Poussière de spectre', emoji: '👻', type: 'materiau', prixVente: 34, desc: 'Froide au toucher, quel que soit le temps.' },
  'cristal-givre':     { nom: 'Cristal de givre', emoji: '❄️', type: 'materiau', prixVente: 45, desc: 'Ne fond jamais.' },
  'noyau-golem':       { nom: 'Noyau de golem', emoji: '🗿', type: 'materiau', prixVente: 55, desc: 'Le cœur encore tiède d’un golem.' },
  'ecaille-draconique': { nom: 'Écaille draconique', emoji: '🐲', type: 'materiau', prixVente: 80, desc: 'Le matériau le plus précieux du royaume.' },
  'lotus-noir':         { nom: 'Lotus noir', emoji: '🪷', type: 'materiau', prixVente: 28, desc: 'Ne fleurit que dans la brume des marais.' },
  'perle-des-sables':   { nom: 'Perle des sables', emoji: '💠', type: 'materiau', prixVente: 55, desc: 'Le désert la polit pendant un siècle.' },

  // ----- Trophées uniques des boss (trouvés dans leurs coffres) -----
  'croc-de-l-alpha':      { nom: 'Croc de l’Alpha', emoji: '🐺', type: 'equipement', slot: 'accessoire', niveau: 4,  rarete: 'epique',     prixVente: 120, bonus: { for: 3, agi: 2 }, desc: 'Trophée du Loup Alpha des Plaines.' },
  'couronne-de-soie':     { nom: 'Couronne de soie', emoji: '🕷️', type: 'equipement', slot: 'tete',       niveau: 7,  rarete: 'epique',     prixVente: 160, bonus: { agi: 3, int: 2, pmMax: 8 }, desc: 'Trophée de la Matriarche des Murmures.' },
  'pagne-du-chef-orc':    { nom: 'Pagne du chef orc', emoji: '👹', type: 'equipement', slot: 'jambes',     niveau: 9,  rarete: 'epique',     prixVente: 190, bonus: { for: 3, vit: 3, pvMax: 15 }, desc: 'Trophée du Chef de guerre des Collines.' },
  'coeur-de-l-hydre':     { nom: 'Cœur de l’Hydre', emoji: '🐉', type: 'equipement', slot: 'accessoire', niveau: 11, rarete: 'epique',     prixVente: 240, bonus: { int: 4, vit: 2, pmMax: 12 }, desc: 'Trophée de l’Hydre des brumes. Il bat encore.' },
  'sceau-du-roi-dechu':   { nom: 'Sceau du Roi déchu', emoji: '💍', type: 'equipement', slot: 'accessoire', niveau: 13, rarete: 'legendaire', prixVente: 320, bonus: { int: 5, cha: 2, crit: 3 }, desc: 'Trophée du maître des Cryptes Oubliées.' },
  'dent-du-ver':          { nom: 'Dent du Ver colossal', emoji: '🪱', type: 'equipement', slot: 'arme',       niveau: 16, rarete: 'legendaire', prixVente: 400, bonus: { for: 12, cha: 3, crit: 4 }, desc: 'Trophée du Ver des sables. Encore acérée.' },
  'noyau-de-l-ancien':    { nom: 'Noyau de l’Ancien', emoji: '🌋', type: 'equipement', slot: 'accessoire', niveau: 17, rarete: 'legendaire', prixVente: 450, bonus: { vit: 5, pvMax: 30, cha: 2 }, desc: 'Trophée de l’Élémentaire ancien des Pics.' },
  'larme-du-gardien':     { nom: 'Larme du Gardien', emoji: '💧', type: 'equipement', slot: 'accessoire', niveau: 19, rarete: 'legendaire', prixVente: 600, bonus: { for: 4, int: 4, agi: 4, cha: 3 }, desc: 'Trophée du Gardien éternel des Profondeurs.' },
};

// Objet unique offert par le coffre de chaque boss de zone.
const COFFRES_BOSS = {
  loupAlpha: 'croc-de-l-alpha',
  araigneeMatriarche: 'couronne-de-soie',
  chefOrc: 'pagne-du-chef-orc',
  hydreBrumes: 'coeur-de-l-hydre',
  roiDechu: 'sceau-du-roi-dechu',
  verDesSables: 'dent-du-ver',
  elementaireAncien: 'noyau-de-l-ancien',
  gardienEternel: 'larme-du-gardien',
};

// Raretés des objets historiques (tout le reste est « commun »).
const RARETES_EXISTANTES = {
  inhabituel: ['lame-de-fer', 'baton-sorcier', 'arc-chasse', 'casque-fer', 'diademe-mage',
    'cotte-mailles', 'robe-enchantee', 'grande-potion-soin', 'grande-potion-mana', 'antidote',
    'bombe-de-givre', 'pendentif-lunaire'],
  rare: ['epee-chevalier', 'sceptre-runique', 'arc-elfique', 'heaume-chevalier', 'plastron-fer',
    'broche-scarabee', 'anneau-sanguin', 'elixir-heroique'],
  epique: ['croc-de-guerre', 'baton-tempetes', 'arc-precision', 'couronne-mystique',
    'orbe-des-dunes', 'armure-draconique', 'jambieres-zephyr', 'coeur-givre'],
  legendaire: ['lame-crepuscule', 'sceptre-neant', 'arc-du-vent', 'oeil-dragon'],
};
Object.entries(RARETES_EXISTANTES).forEach(([rarete, ids]) => {
  ids.forEach((id) => { if (OBJETS[id]) OBJETS[id].rarete = rarete; });
});

const PART_REVENTE = 0.4; // un équipement/consommable se revend 40 % de son prix

function prixVenteDe(idObjet) {
  const objet = OBJETS[idObjet];
  if (!objet) return 0;
  // Les objets sans prix de boutique (matériaux, légendaires d'atelier)
  // portent leur propre valeur de revente.
  if (objet.prixVente != null) return objet.prixVente;
  return Math.max(1, Math.round((objet.prix || 0) * PART_REVENTE));
}

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
  { suffixe: 'du Loup',      niveau: 3,  rarete: 'commun',     po: 18,  materiaux: { 'peau-de-loup': 2, 'fibre-sauvage': 2 } },
  { suffixe: 'du Sanglier',  niveau: 4,  rarete: 'commun',     po: 26,  materiaux: { 'defense-sanglier': 2, 'peau-de-loup': 1 } },
  { suffixe: 'des Murmures', niveau: 6,  rarete: 'inhabituel', po: 50,  materiaux: { 'bois-chene': 2, 'seve-ambree': 2 } },
  { suffixe: 'de la Veuve',  niveau: 7,  rarete: 'inhabituel', po: 65,  materiaux: { 'soie-araignee': 3, 'fibre-sauvage': 2 } },
  { suffixe: 'du Cuivre',    niveau: 8,  rarete: 'inhabituel', po: 80,  materiaux: { 'minerai-cuivre': 3, 'defense-sanglier': 1 } },
  { suffixe: 'du Marais',    niveau: 9,  rarete: 'rare',       po: 110, materiaux: { 'lotus-noir': 2, 'herbe-lunaire': 2, 'seve-ambree': 1 } },
  { suffixe: 'de Fer',       niveau: 11, rarete: 'rare',       po: 150, materiaux: { 'minerai-fer': 3, 'minerai-cuivre': 2 } },
  { suffixe: 'des Cryptes',  niveau: 12, rarete: 'rare',       po: 190, materiaux: { 'os-ancien': 2, 'poussiere-spectre': 2 } },
  { suffixe: 'des Dunes',    niveau: 13, rarete: 'rare',       po: 230, materiaux: { 'perle-des-sables': 2, 'minerai-fer': 2 } },
  { suffixe: 'du Spectre',   niveau: 14, rarete: 'epique',     po: 280, materiaux: { 'poussiere-spectre': 3, 'os-ancien': 2 } },
  { suffixe: 'des Glaces',   niveau: 15, rarete: 'epique',     po: 330, materiaux: { 'cristal-givre': 2, 'minerai-fer': 2 } },
  { suffixe: 'du Golem',     niveau: 16, rarete: 'epique',     po: 390, materiaux: { 'noyau-golem': 2, 'minerai-fer': 3 } },
  { suffixe: 'du Dragon',    niveau: 17, rarete: 'legendaire', po: 500, materiaux: { 'ecaille-draconique': 2, 'noyau-golem': 1, 'minerai-fer': 2 } },
  { suffixe: 'de l’Aube',    niveau: 19, rarete: 'legendaire', po: 650, materiaux: { 'ecaille-draconique': 2, 'cristal-givre': 2, 'perle-des-sables': 2 } },
];

const MULT_RARETE_CRAFT = { commun: 1, inhabituel: 1.12, rare: 1.25, epique: 1.4, legendaire: 1.6 };

SETS_CRAFT.forEach((serie) => {
  const mult = MULT_RARETE_CRAFT[serie.rarete];
  const principal = Math.max(2, Math.round(serie.niveau * 0.8 * mult));
  const secondaire = Math.max(1, Math.round(principal * 0.35));
  const idBase = serie.suffixe.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const pieces = [
    { cle: 'lame',      nom: `Lame ${serie.suffixe}`,      emoji: '⚔️', slot: 'arme',       bonus: { for: principal, vit: secondaire } },
    { cle: 'focus',     nom: `Focus ${serie.suffixe}`,     emoji: '🔮', slot: 'arme',       bonus: { int: principal, pmMax: secondaire * 3 } },
    { cle: 'arc',       nom: `Arc ${serie.suffixe}`,       emoji: '🏹', slot: 'arme',       bonus: { agi: principal, crit: secondaire } },
    { cle: 'armure',    nom: `Armure ${serie.suffixe}`,    emoji: '🛡️', slot: 'torse',      bonus: { vit: Math.max(1, Math.round(principal * 0.7)), pvMax: serie.niveau * 3 } },
    { cle: 'heaume',    nom: `Heaume ${serie.suffixe}`,    emoji: '🪖', slot: 'tete',       bonus: { vit: secondaire, pvMax: serie.niveau * 2 } },
    { cle: 'jambieres', nom: `Jambières ${serie.suffixe}`, emoji: '👖', slot: 'jambes',     bonus: { agi: secondaire, vit: secondaire, pvMax: serie.niveau } },
    { cle: 'talisman',  nom: `Talisman ${serie.suffixe}`,  emoji: '🧿', slot: 'accessoire', bonus: { cha: 1 + Math.floor(serie.niveau / 5), vit: secondaire, crit: secondaire } },
    { cle: 'grimoire',  nom: `Grimoire ${serie.suffixe}`,  emoji: '📖', slot: 'accessoire', bonus: { int: secondaire + 1, pmMax: secondaire * 2, cha: Math.max(1, Math.floor(serie.niveau / 7)) } },
  ];
  pieces.forEach((piece) => {
    const id = `${piece.cle}-${idBase}`;
    OBJETS[id] = {
      nom: piece.nom, emoji: piece.emoji, type: 'equipement', slot: piece.slot,
      niveau: serie.niveau, rarete: serie.rarete,
      prixVente: Math.round(serie.po * 0.6),
      bonus: piece.bonus,
      desc: `Série ${serie.suffixe} — se forge à l’atelier.`,
    };
    RECETTES.push({ resultat: id, niveau: serie.niveau, po: serie.po, materiaux: serie.materiaux });
  });
});
RECETTES.sort((a, b) => a.niveau - b.niveau);

// =====================================================================
// Butin d'aventure généré : ~1500 équipements introuvables en boutique.
// Ils tombent des coffres de boss, de la Tour et des contrats de guilde.
// Pour chaque archétype × niveau × rareté disponible, deux variantes.
// =====================================================================
const ARCHETYPES_BUTIN = [
  { cle: 'epee',     noms: ['Épée', 'Hache', 'Masse'],           emoji: '⚔️', slot: 'arme',       principal: 'for', secondaire: 'vit' },
  { cle: 'baton',    noms: ['Bâton', 'Sceptre', 'Orbe'],         emoji: '🪄', slot: 'arme',       principal: 'int', secondaire: 'cha' },
  { cle: 'arc',      noms: ['Arc', 'Dague', 'Arbalète'],         emoji: '🏹', slot: 'arme',       principal: 'agi', secondaire: 'for' },
  { cle: 'heaume',   noms: ['Heaume', 'Capuche', 'Diadème'],     emoji: '🪖', slot: 'tete',       principal: 'vit', secondaire: 'int' },
  { cle: 'plastron', noms: ['Plastron', 'Tunique', 'Cuirasse'],  emoji: '🛡️', slot: 'torse',      principal: 'vit', secondaire: 'for' },
  { cle: 'jambes',   noms: ['Jambières', 'Bottes', 'Grèves'],    emoji: '👖', slot: 'jambes',     principal: 'agi', secondaire: 'vit' },
  { cle: 'anneau',   noms: ['Anneau', 'Sceau', 'Chevalière'],    emoji: '💍', slot: 'accessoire', principal: 'cha', secondaire: 'agi' },
  { cle: 'amulette', noms: ['Amulette', 'Pendentif', 'Relique'], emoji: '📿', slot: 'accessoire', principal: 'int', secondaire: 'cha' },
];

// Qualificatifs sans accord de genre (formes en « de/du/des »).
const QUALIFICATIFS_BUTIN = {
  commun:     ['de recrue', 'd’apprenti', 'de fortune'],
  inhabituel: ['de vétéran', 'de la garde', 'du compagnon'],
  rare:       ['des runes', 'de l’enchanteur', 'des murmures'],
  epique:     ['des tempêtes', 'du zénith', 'des abysses'],
  legendaire: ['du crépuscule', 'des légendes', 'du phénix'],
  mythique:   ['des origines', 'du chaos', 'des Titans'],
  divin:      ['des dieux', 'de l’éternité', 'des étoiles'],
};

// Niveau minimal d'apparition et puissance de chaque rareté.
const PALIER_RARETE = { commun: 1, inhabituel: 1, rare: 3, epique: 6, legendaire: 10, mythique: 14, divin: 17 };
const MULT_RARETE_BUTIN = { commun: 0.8, inhabituel: 0.95, rare: 1.1, epique: 1.3, legendaire: 1.55, mythique: 1.8, divin: 2.15 };

ARCHETYPES_BUTIN.forEach((archetype) => {
  for (let niveau = 1; niveau <= 20; niveau++) {
    Object.keys(RARETES).forEach((rarete) => {
      if (niveau < PALIER_RARETE[rarete]) return;
      for (let variante = 0; variante < 2; variante++) {
        const nomBase = archetype.noms[(niveau + variante) % archetype.noms.length];
        const qualificatif = QUALIFICATIFS_BUTIN[rarete][(niveau + variante * 2) % 3];
        const mult = MULT_RARETE_BUTIN[rarete];
        const principal = Math.max(1, Math.round((2 + niveau * 0.85) * mult) + variante);
        const bonus = { [archetype.principal]: principal };
        if (niveau >= 4) bonus[archetype.secondaire] = Math.max(1, Math.round(principal * 0.35));
        if (archetype.slot === 'torse' || archetype.slot === 'tete') bonus.pvMax = Math.round(niveau * 2 * mult);
        if (archetype.principal === 'int') bonus.pmMax = Math.round(niveau * 1.5 * mult);
        if (rarete === 'mythique' || rarete === 'divin') bonus.crit = Math.round(2 + niveau * 0.25);
        OBJETS[`butin-${archetype.cle}-${rarete}-${niveau}-${variante}`] = {
          nom: `${nomBase} ${qualificatif}`,
          emoji: archetype.emoji, type: 'equipement', slot: archetype.slot,
          niveau, rarete,
          prixVente: Math.max(5, Math.round(niveau * 6 * mult)),
          bonus,
          desc: 'Butin d’aventure : coffres de boss, Tour Sans Fin et contrats de guilde.',
        };
      }
    });
  }
});

// =====================================================================
// Inventaire : liste de { id, qte }
// =====================================================================
function compterObjet(p, idObjet) {
  const entree = p.inventaire.find((e) => e.id === idObjet);
  return entree ? entree.qte : 0;
}

function ajouterObjet(p, idObjet, qte = 1) {
  const entree = p.inventaire.find((e) => e.id === idObjet);
  if (entree) entree.qte += qte;
  else p.inventaire.push({ id: idObjet, qte });
  // Compteurs de hauts faits : trouvailles de haut rang.
  const objet = OBJETS[idObjet];
  if (objet && p.compteurs) {
    const rarete = rareteDe(objet);
    if (rarete === 'legendaire' || rarete === 'mythique') p.compteurs.legendaires += qte;
    if (rarete === 'divin') p.compteurs.divins += qte;
  }
}

function retirerObjet(p, idObjet, qte = 1) {
  const entree = p.inventaire.find((e) => e.id === idObjet);
  if (!entree || entree.qte < qte) return false;
  entree.qte -= qte;
  if (entree.qte <= 0) p.inventaire = p.inventaire.filter((e) => e.qte > 0);
  return true;
}

function texteBonus(bonus) {
  if (!bonus) return '';
  const libelles = {
    for: '💪 FOR', int: '🧠 INT', agi: '🏃 AGI', vit: '❤️ VIT', cha: '🍀 CHA',
    pvMax: '❤️ PV max', pmMax: '💧 PM max', crit: '💥 Crit.',
  };
  return Object.entries(bonus)
    .map(([cle, valeur]) => `+${valeur}${cle === 'crit' ? ' %' : ''} ${libelles[cle] || cle}`)
    .join(' · ');
}
