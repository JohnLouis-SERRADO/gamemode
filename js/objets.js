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
};

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
  { resultat: 'arc-elfique',        niveau: 8,  po: 80,  materiaux: { 'bois-chene': 2, 'soie-araignee': 2 } },
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
  const libelles = { for: '💪 FOR', int: '🧠 INT', agi: '🏃 AGI', vit: '❤️ VIT', pvMax: '❤️ PV max', pmMax: '💧 PM max', crit: '💥 Crit.' };
  return Object.entries(bonus)
    .map(([cle, valeur]) => `+${valeur}${cle === 'crit' ? ' %' : ''} ${libelles[cle] || cle}`)
    .join(' · ');
}
