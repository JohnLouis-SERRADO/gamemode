'use strict';

// =====================================================================
// Catalogue écrit à la main : équipement, consommables, matériaux, trophées
// =====================================================================

// =====================================================================
// Catalogue d'objets : équipement, consommables, matériaux.
// type : 'equipement' | 'consommable' | 'materiau'
// slot : 'arme' | 'tete' | 'torse' | 'jambes' | 'accessoire'
// bonus : { for, int, dex, vit, pvMax, pmMax, crit (%) }
// prix : prix d'achat en boutique (absent = introuvable en boutique)
// prixVente : prix de vente d'un matériau (équipement/consommable : 40 % du prix)
// =====================================================================

const SLOTS_EQUIPEMENT = {
  arme: { nom: 'Arme', emoji: '⚔️' },
  tete: { nom: 'Tête', emoji: '🪖' },
  torse: { nom: 'Torse', emoji: '🥋' },
  mains: { nom: 'Mains', emoji: '🧤' },
  jambes: { nom: 'Jambes', emoji: '👖' },
  pieds: { nom: 'Pieds', emoji: '🥾' },
  acc1: { nom: 'Accessoire 1', emoji: '💍' },
  acc2: { nom: 'Accessoire 2', emoji: '📿' },
};

const OBJETS = {
  // ----- Armes : Force -----
  'epee-courte':      { nom: 'Épée courte', emoji: '🗡️', type: 'equipement', slot: 'arme', niveau: 1, prix: 40,  bonus: { for: 2 }, desc: 'Une lame simple et fiable.' },
  'lame-de-fer':      { nom: 'Lame de fer', emoji: '⚔️', type: 'equipement', slot: 'arme', niveau: 4, prix: 90,  bonus: { for: 4, vit: 1 }, desc: 'Forgée dans le fer des Collines.' },
  'epee-chevalier':   { nom: 'Épée de chevalier', emoji: '⚔️', type: 'equipement', slot: 'arme', niveau: 8, prix: 260, bonus: { for: 7, vit: 2 }, desc: 'L’arme des défenseurs de Valciel.' },
  'croc-de-guerre':   { nom: 'Croc de guerre', emoji: '🪓', type: 'equipement', slot: 'arme', niveau: 12, prix: 480, bonus: { for: 10, dex: 2 }, desc: 'Taillée pour les champs de bataille.' },
  'lame-crepuscule':  { nom: 'Lame du crépuscule', emoji: '🌘', type: 'equipement', slot: 'arme', niveau: 16, prixVente: 350, bonus: { for: 14, dex: 3, crit: 5 }, desc: 'Une lame légendaire, forgée à l’atelier seulement.' },

  // ----- Armes : Intelligence -----
  'baton-noueux':     { nom: 'Bâton noueux', emoji: '🪄', type: 'equipement', slot: 'arme', niveau: 1, prix: 40,  bonus: { int: 2 }, desc: 'Un bâton de novice, chargé d’une étincelle.' },
  'baton-sorcier':    { nom: 'Bâton de sorcier', emoji: '🔮', type: 'equipement', slot: 'arme', niveau: 4, prix: 90,  bonus: { int: 4, pmMax: 6 }, desc: 'Canalise le mana avec aisance.' },
  'sceptre-runique':  { nom: 'Sceptre runique', emoji: '✨', type: 'equipement', slot: 'arme', niveau: 8, prix: 260, bonus: { int: 7, pmMax: 10 }, desc: 'Gravé de runes anciennes.' },
  'baton-tempetes':   { nom: 'Bâton des tempêtes', emoji: '⚡', type: 'equipement', slot: 'arme', niveau: 12, prix: 480, bonus: { int: 10, pmMax: 14 }, desc: 'L’orage y gronde en permanence.' },
  'sceptre-neant':    { nom: 'Sceptre du néant', emoji: '🌀', type: 'equipement', slot: 'arme', niveau: 16, prixVente: 350, bonus: { int: 14, pmMax: 20, crit: 5 }, desc: 'Un artefact légendaire, forgé à l’atelier seulement.' },

  // ----- Armes : Dextérité -----
  'arc-court':        { nom: 'Arc court', emoji: '🏹', type: 'equipement', slot: 'arme', niveau: 1, prix: 40,  bonus: { dex: 2 }, desc: 'Léger et maniable.' },
  'arc-chasse':       { nom: 'Arc de chasse', emoji: '🏹', type: 'equipement', slot: 'arme', niveau: 4, prix: 90,  bonus: { dex: 4, for: 1 }, desc: 'L’allié des pisteurs des Plaines.' },
  'arc-elfique':      { nom: 'Arc long elfique', emoji: '🏹', type: 'equipement', slot: 'arme', niveau: 8, prix: 260, bonus: { dex: 7, for: 2 }, desc: 'Un bois souple venu de la Forêt des Murmures.' },
  'arc-precision':    { nom: 'Arc de précision', emoji: '🎯', type: 'equipement', slot: 'arme', niveau: 12, prix: 480, bonus: { dex: 10, crit: 4 }, desc: 'Chaque flèche trouve sa cible.' },
  'arc-du-vent':      { nom: 'Arc du vent', emoji: '🌪️', type: 'equipement', slot: 'arme', niveau: 16, prixVente: 350, bonus: { dex: 14, crit: 8 }, desc: 'Un arc légendaire, forgé à l’atelier seulement.' },

  // ----- Tête -----
  'capuche-cuir':     { nom: 'Capuche de cuir', emoji: '🧢', type: 'equipement', slot: 'tete', niveau: 2, prix: 45,  bonus: { vit: 1, dex: 1 }, desc: 'Discrète et confortable.' },
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
  'pantalon-toile':   { nom: 'Pantalon de toile', emoji: '👖', type: 'equipement', slot: 'jambes', niveau: 2, prix: 40,  bonus: { vit: 1, dex: 1 }, desc: 'Pratique pour marcher loin.' },
  'jambieres-cuir':   { nom: 'Jambières de cuir', emoji: '🦵', type: 'equipement', slot: 'jambes', niveau: 6, prix: 120, bonus: { vit: 2, dex: 2 }, desc: 'Souples et résistantes.' },
  'jambieres-plates': { nom: 'Jambières de plates', emoji: '🦿', type: 'equipement', slot: 'jambes', niveau: 10, prix: 260, bonus: { vit: 4, pvMax: 15 }, desc: 'Lourdes, mais sûres.' },
  'jambieres-zephyr': { nom: 'Jambières du zéphyr', emoji: '💨', type: 'equipement', slot: 'jambes', niveau: 14, prixVente: 250, bonus: { dex: 4, vit: 3, crit: 3 }, desc: 'Se cousent à l’atelier seulement.' },

  // ----- Accessoires -----
  'anneau-force':     { nom: 'Anneau de force', emoji: '💍', type: 'equipement', slot: 'accessoire', niveau: 3, prix: 80,  bonus: { for: 2 }, desc: 'Un anneau qui durcit le poing.' },
  'anneau-esprit':    { nom: 'Anneau d’esprit', emoji: '💍', type: 'equipement', slot: 'accessoire', niveau: 3, prix: 80,  bonus: { int: 2 }, desc: 'Un anneau qui éclaircit les pensées.' },
  'anneau-vent':      { nom: 'Anneau de vent', emoji: '💍', type: 'equipement', slot: 'accessoire', niveau: 3, prix: 80,  bonus: { dex: 2 }, desc: 'Un anneau léger comme une brise.' },
  'amulette-vie':     { nom: 'Amulette de vie', emoji: '📿', type: 'equipement', slot: 'accessoire', niveau: 5, prix: 120, bonus: { pvMax: 15 }, desc: 'Bat doucement, comme un second cœur.' },
  'talisman-mana':    { nom: 'Talisman de mana', emoji: '🧿', type: 'equipement', slot: 'accessoire', niveau: 5, prix: 120, bonus: { pmMax: 10 }, desc: 'Une réserve d’énergie arcanique.' },
  'anneau-chasseur':  { nom: 'Anneau du chasseur', emoji: '💍', type: 'equipement', slot: 'accessoire', niveau: 9, prix: 280, bonus: { dex: 3, crit: 3 }, desc: 'Le fétiche des grands pisteurs.' },
  'medaillon-sage':   { nom: 'Médaillon du sage', emoji: '🏅', type: 'equipement', slot: 'accessoire', niveau: 9, prix: 280, bonus: { int: 4, pmMax: 8 }, desc: 'Transmis de sage en sage.' },
  'sceau-colosse':    { nom: 'Sceau du colosse', emoji: '🔱', type: 'equipement', slot: 'accessoire', niveau: 12, prix: 420, bonus: { for: 4, pvMax: 20 }, desc: 'Pèse lourd — dans tous les sens.' },
  'oeil-dragon':      { nom: 'Œil de dragon', emoji: '🐉', type: 'equipement', slot: 'accessoire', niveau: 15, prixVente: 400, bonus: { for: 3, int: 3, crit: 5 }, desc: 'Se sertit à l’atelier seulement.' },
  'coeur-givre':      { nom: 'Cœur de givre', emoji: '❄️', type: 'equipement', slot: 'accessoire', niveau: 15, prixVente: 300, bonus: { vit: 3, pvMax: 30 }, desc: 'Se taille à l’atelier seulement.' },

  // ----- Curiosités de l'Antiquaire -----
  'pendentif-lunaire': { nom: 'Pendentif lunaire', emoji: '🌙', type: 'equipement', slot: 'accessoire', niveau: 7, prix: 160, vendeur: 'antiquaire', bonus: { int: 3, vit: 1 }, desc: 'Capture un rayon de lune éternel.' },
  'broche-scarabee':   { nom: 'Broche scarabée', emoji: '🪲', type: 'equipement', slot: 'accessoire', niveau: 10, prix: 220, vendeur: 'antiquaire', bonus: { dex: 2, vit: 2, crit: 2 }, desc: 'Porte-bonheur des pilleurs de tombes.' },
  'anneau-sanguin':    { nom: 'Anneau sanguin', emoji: '🩸', type: 'equipement', slot: 'accessoire', niveau: 11, prix: 300, vendeur: 'antiquaire', bonus: { for: 3, pvMax: 15 }, desc: 'Bat au rythme de votre cœur.' },
  'orbe-des-dunes':    { nom: 'Orbe des dunes', emoji: '🔮', type: 'equipement', slot: 'accessoire', niveau: 13, prixVente: 130, bonus: { int: 3, dex: 2, crit: 2 }, desc: 'Se façonne à l’atelier avec des perles des sables.' },

  'potion-supreme-soin': { nom: 'Potion suprême de soin', emoji: '🍷', type: 'consommable', rarete: 'rare', prixVente: 60, effet: { type: 'pv', valeur: 120 }, desc: 'Rend 120 PV. Se distille à l’atelier.' },
  'potion-supreme-mana': { nom: 'Potion suprême de mana', emoji: '🍾', type: 'consommable', rarete: 'rare', prixVente: 70, effet: { type: 'pm', valeur: 60 }, desc: 'Rend 60 PM. Se distille à l’atelier.' },
  'bombe-ardente':       { nom: 'Bombe ardente', emoji: '🧨', type: 'consommable', rarete: 'rare', prixVente: 55, effet: { type: 'bombe', valeur: 50, chanceEtourdi: 0.15 }, desc: '~50 dégâts de feu à tous les ennemis (en combat).' },

  'antidote':          { nom: 'Antidote', emoji: '🧴', type: 'consommable', prix: 12, vendeur: 'antiquaire', effet: { type: 'antidote' }, desc: 'Dissipe le poison (en combat).' },
  'bombe-de-givre':    { nom: 'Bombe de givre', emoji: '💣', type: 'consommable', prix: 45, vendeur: 'antiquaire', effet: { type: 'bombe', valeur: 30, chanceEtourdi: 0.25 }, desc: 'Souffle glacial : ~30 dégâts à tous les ennemis, 25 % de chances de les étourdir.' },
  'elixir-heroique':   { nom: 'Élixir héroïque', emoji: '🏺', type: 'consommable', prix: 55, vendeur: 'antiquaire', effet: { type: 'elixir-benediction', duree: 3 }, desc: '+30 % de dégâts pendant 3 tours (en combat).' },

  // ----- Nouveaux étals de l'Antiquaire : objets tactiques de combat -----
  'parchemin-soins':      { nom: 'Parchemin de soins partagés', emoji: '📜', type: 'consommable', rarete: 'rare', prix: 65, vendeur: 'antiquaire', effet: { type: 'soin-groupe', valeur: 60 }, desc: 'Rend 60 PV à toute l’équipe (en combat).' },
  'parchemin-soins-sup':  { nom: 'Grand parchemin de soins', emoji: '📜', type: 'consommable', rarete: 'epique', prix: 160, vendeur: 'antiquaire', effet: { type: 'soin-groupe', valeur: 150 }, desc: 'Rend 150 PV à toute l’équipe (en combat).' },
  'potion-regeneration':  { nom: 'Potion de régénération', emoji: '🌿', type: 'consommable', rarete: 'inhabituel', prix: 40, vendeur: 'antiquaire', effet: { type: 'regen', valeur: 12, duree: 4 }, desc: 'Régénère 12 PV par tour pendant 4 tours (en combat).' },
  'philtre-bouclier':     { nom: 'Philtre de bouclier', emoji: '🫧', type: 'consommable', rarete: 'inhabituel', prix: 45, vendeur: 'antiquaire', effet: { type: 'bouclier', valeur: 60, duree: 3 }, desc: 'Un bouclier qui absorbe 60 dégâts (en combat).' },
  'grand-philtre-bouclier': { nom: 'Grand philtre de bouclier', emoji: '🛡️', type: 'consommable', rarete: 'epique', prix: 120, vendeur: 'antiquaire', effet: { type: 'bouclier', valeur: 150, duree: 3 }, desc: 'Un bouclier qui absorbe 150 dégâts (en combat).' },
  'elixir-purete':        { nom: 'Élixir de pureté', emoji: '✨', type: 'consommable', prix: 30, vendeur: 'antiquaire', effet: { type: 'purge' }, desc: 'Dissipe poison, affaiblissement et étourdissement (en combat).' },
  'trefle-seche':         { nom: 'Trèfle séché à quatre feuilles', emoji: '🍀', type: 'consommable', rarete: 'rare', prix: 55, vendeur: 'antiquaire', effet: { type: 'fortune' }, desc: 'Porte-bonheur : +30 % de chances de butin sur ce combat.' },
  'poudre-evasion':       { nom: 'Poudre d’évasion', emoji: '💨', type: 'consommable', prix: 25, vendeur: 'antiquaire', effet: { type: 'fuite' }, desc: 'Fuite garantie d’un combat d’exploration ou d’embuscade.' },
  'bombe-foudre':         { nom: 'Bombe de foudre', emoji: '⚡', type: 'consommable', rarete: 'rare', prix: 70, vendeur: 'antiquaire', effet: { type: 'bombe', valeur: 35, chanceEtourdi: 0.4 }, desc: '~35 dégâts à tous les ennemis, 40 % de chances de les étourdir.' },
  'fiole-acide':          { nom: 'Fiole d’acide instable', emoji: '🧫', type: 'consommable', rarete: 'rare', prix: 60, vendeur: 'antiquaire', effet: { type: 'bombe', valeur: 25, chanceAffaibli: 1 }, desc: '~25 dégâts à tous les ennemis, qui ressortent affaiblis (−30 % dégâts, 2 tours).' },
  'bombe-obscure':        { nom: 'Bombe obscure', emoji: '🕳️', type: 'consommable', rarete: 'epique', prix: 130, vendeur: 'antiquaire', effet: { type: 'bombe', valeur: 80 }, desc: 'Une détonation d’ombre : ~80 dégâts à tous les ennemis.' },
  'elixir-titan':         { nom: 'Élixir du titan', emoji: '🗿', type: 'consommable', rarete: 'epique', prix: 110, vendeur: 'antiquaire', effet: { type: 'elixir-benediction', duree: 5 }, desc: '+30 % de dégâts pendant 5 tours (en combat).' },
  'potion-colosse':       { nom: 'Potion du colosse', emoji: '🍯', type: 'consommable', rarete: 'epique', prix: 210, vendeur: 'antiquaire', effet: { type: 'pv', valeur: 300 }, desc: 'Rend 300 PV.' },
  'hydromel-braves':      { nom: 'Hydromel des braves', emoji: '🍺', type: 'consommable', rarete: 'rare', prix: 95, vendeur: 'antiquaire', effet: { type: 'pm', valeur: 100 }, desc: 'Rend 100 PM.' },

  // ----- Nouveaux étals de l'Antiquaire : curiosités d'équipement -----
  'patte-de-lapin':       { nom: 'Patte de lapin usée', emoji: '🐰', type: 'equipement', slot: 'accessoire', niveau: 4, rarete: 'inhabituel', prix: 90, vendeur: 'antiquaire', bonus: { cha: 2 }, desc: 'Elle n’a pas porté chance au lapin, mais qui sait.' },
  'monocle-savant':       { nom: 'Monocle du savant', emoji: '🧐', type: 'equipement', slot: 'accessoire', niveau: 6, rarete: 'inhabituel', prix: 150, vendeur: 'antiquaire', bonus: { int: 3, cha: 1 }, desc: 'On y voit plus clair — surtout dans les grimoires.' },
  'gants-du-voleur':      { nom: 'Gants du voleur repenti', emoji: '🧤', type: 'equipement', slot: 'accessoire', niveau: 8, rarete: 'rare', prix: 210, vendeur: 'antiquaire', bonus: { dex: 3, cha: 2 }, desc: '« Repenti », précise l’étiquette, deux fois.' },
  'ceinturon-cloute':     { nom: 'Ceinturon clouté', emoji: '🥋', type: 'equipement', slot: 'accessoire', niveau: 9, rarete: 'rare', prix: 240, vendeur: 'antiquaire', bonus: { for: 3, pvMax: 10 }, desc: 'Ayant appartenu à un champion de lutte naine.' },
  'boussole-detraquee':   { nom: 'Boussole détraquée', emoji: '🧭', type: 'equipement', slot: 'accessoire', niveau: 11, rarete: 'rare', prix: 300, vendeur: 'antiquaire', bonus: { dex: 3, int: 2, crit: 2 }, desc: 'Elle n’indique pas le nord, mais toujours quelque chose d’intéressant.' },
  'chope-runique':        { nom: 'Chope runique', emoji: '🍻', type: 'equipement', slot: 'accessoire', niveau: 12, rarete: 'rare', prix: 330, vendeur: 'antiquaire', bonus: { vit: 4, cha: 2 }, desc: 'Grave « santé ! » en sept langues mortes.' },
  'cape-mitee':           { nom: 'Cape mitée (mais magique)', emoji: '🧥', type: 'equipement', slot: 'accessoire', niveau: 14, rarete: 'epique', prix: 420, vendeur: 'antiquaire', bonus: { int: 4, vit: 3, pmMax: 12 }, desc: 'Les trous seraient « décoratifs », jure l’antiquaire.' },
  'dent-requin-fossile':  { nom: 'Dent de requin fossile', emoji: '🦈', type: 'equipement', slot: 'accessoire', niveau: 15, rarete: 'epique', prix: 480, vendeur: 'antiquaire', bonus: { for: 5, crit: 3 }, desc: 'Le requin, lui, date d’avant les Royaumes.' },
  'sablier-fele':         { nom: 'Sablier fêlé', emoji: '⏳', type: 'equipement', slot: 'accessoire', niveau: 17, rarete: 'epique', prix: 590, vendeur: 'antiquaire', bonus: { dex: 5, cha: 3, crit: 3 }, desc: 'Son sable remonte, certains soirs.' },
  'idole-sans-nom':       { nom: 'Idole sans nom', emoji: '🗿', type: 'equipement', slot: 'accessoire', niveau: 19, rarete: 'legendaire', prix: 750, vendeur: 'antiquaire', bonus: { for: 3, int: 3, dex: 3, vit: 3, cha: 3 }, desc: 'Personne ne sait qui elle représente. Elle, si.' },

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
  'croc-de-l-alpha':      { nom: 'Croc de l’Alpha', emoji: '🐺', type: 'equipement', slot: 'accessoire', niveau: 4,  rarete: 'epique',     prixVente: 120, bonus: { for: 3, dex: 2 }, desc: 'Trophée du Loup Alpha des Plaines.' },
  'couronne-de-soie':     { nom: 'Couronne de soie', emoji: '🕷️', type: 'equipement', slot: 'tete',       niveau: 7,  rarete: 'epique',     prixVente: 160, bonus: { dex: 3, int: 2, pmMax: 8 }, desc: 'Trophée de la Matriarche des Murmures.' },
  'pagne-du-chef-orc':    { nom: 'Pagne du chef orc', emoji: '👹', type: 'equipement', slot: 'jambes',     niveau: 9,  rarete: 'epique',     prixVente: 190, bonus: { for: 3, vit: 3, pvMax: 15 }, desc: 'Trophée du Chef de guerre des Collines.' },
  'coeur-de-l-hydre':     { nom: 'Cœur de l’Hydre', emoji: '🐉', type: 'equipement', slot: 'accessoire', niveau: 11, rarete: 'epique',     prixVente: 240, bonus: { int: 4, vit: 2, pmMax: 12 }, desc: 'Trophée de l’Hydre des brumes. Il bat encore.' },
  'sceau-du-roi-dechu':   { nom: 'Sceau du Roi déchu', emoji: '💍', type: 'equipement', slot: 'accessoire', niveau: 13, rarete: 'legendaire', prixVente: 320, bonus: { int: 5, cha: 2, crit: 3 }, desc: 'Trophée du maître des Cryptes Oubliées.' },
  'dent-du-ver':          { nom: 'Dent du Ver colossal', emoji: '🪱', type: 'equipement', slot: 'arme',       niveau: 16, rarete: 'legendaire', prixVente: 400, bonus: { for: 12, cha: 3, crit: 4 }, desc: 'Trophée du Ver des sables. Encore acérée.' },
  'noyau-de-l-ancien':    { nom: 'Noyau de l’Ancien', emoji: '🌋', type: 'equipement', slot: 'accessoire', niveau: 17, rarete: 'legendaire', prixVente: 450, bonus: { vit: 5, pvMax: 30, cha: 2 }, desc: 'Trophée de l’Élémentaire ancien des Pics.' },
  'larme-du-gardien':     { nom: 'Larme du Gardien', emoji: '💧', type: 'equipement', slot: 'accessoire', niveau: 19, rarete: 'legendaire', prixVente: 600, bonus: { for: 4, int: 4, dex: 4, cha: 3 }, desc: 'Trophée du Gardien éternel des Profondeurs.' },
};

// ----- Matériaux des Terres lointaines (v10, niv. 22-50) -----
Object.assign(OBJETS, {
  'liane-tressee':      { nom: 'Liane tressée', emoji: '🌿', type: 'materiau', prixVente: 40, desc: 'Souple comme une corde, solide comme une chaîne.' },
  'orchidee-lunaire':   { nom: 'Orchidée lunaire', emoji: '🌸', type: 'materiau', prixVente: 65, desc: 'Ne fleurit que sous la pleine lune de la jungle.' },
  'venin-concentre':    { nom: 'Venin concentré', emoji: '🧪', type: 'materiau', prixVente: 80, desc: 'À manipuler avec des gants. Deux paires.' },
  'basalte-poli':       { nom: 'Basalte poli', emoji: '🪨', type: 'materiau', prixVente: 40, desc: 'Poli par mille ans de vents hurlants.' },
  'plume-de-rokh':      { nom: 'Plume de rokh', emoji: '🪶', type: 'materiau', prixVente: 65, desc: 'Plus grande qu’un bouclier, plus légère qu’un souffle.' },
  'cristal-hurleur':    { nom: 'Cristal hurleur', emoji: '💎', type: 'materiau', prixVente: 85, desc: 'Il siffle quand le vent tourne. Et le vent tourne toujours.' },
  'nacre-abyssale':     { nom: 'Nacre abyssale', emoji: '🐚', type: 'materiau', prixVente: 70, desc: 'Elle garde la lumière des lanternes englouties.' },
  'corail-sanglant':    { nom: 'Corail sanglant', emoji: '🪸', type: 'materiau', prixVente: 95, desc: 'Rouge profond. Personne ne demande pourquoi.' },
  'larme-de-sirene':    { nom: 'Larme de sirène', emoji: '💧', type: 'materiau', prixVente: 150, desc: 'Un chagrin cristallisé, précieux et froid.' },
  'cendre-fertile':     { nom: 'Cendre fertile', emoji: '🌫️', type: 'materiau', prixVente: 70, desc: 'Tout y repousse — même ce qu’on préférerait éteint.' },
  'obsidienne-brute':   { nom: 'Obsidienne brute', emoji: '🖤', type: 'materiau', prixVente: 95, desc: 'Un tranchant naturel qui n’attend que la meule.' },
  'coeur-de-braise':    { nom: 'Cœur de braise', emoji: '❤️‍🔥', type: 'materiau', prixVente: 150, desc: 'Chaud au toucher, des années après.' },
  'bois-petrifie':      { nom: 'Bois pétrifié', emoji: '🪵', type: 'materiau', prixVente: 110, desc: 'Un arbre devenu pierre — le grain du bois y est encore.' },
  'ambre-noir':         { nom: 'Ambre noir', emoji: '🟤', type: 'materiau', prixVente: 140, desc: 'Quelque chose est figé dedans. Ne regardez pas trop longtemps.' },
  'sphere-runique':     { nom: 'Sphère runique', emoji: '🔮', type: 'materiau', prixVente: 220, desc: 'Les runes tournent lentement à l’intérieur.' },
  'os-de-geant':        { nom: 'Os de géant', emoji: '🦴', type: 'materiau', prixVente: 110, desc: 'Un seul fémur ferait une charpente.' },
  'peau-de-mammouth':   { nom: 'Peau de mammouth', emoji: '🦣', type: 'materiau', prixVente: 140, desc: 'Assez pour tailler trois manteaux et une tente.' },
  'relique-antique':    { nom: 'Relique antique', emoji: '⚱️', type: 'materiau', prixVente: 220, desc: 'D’avant les Royaumes. D’avant beaucoup de choses.' },
  'fragment-de-foudre': { nom: 'Fragment de foudre', emoji: '⚡', type: 'materiau', prixVente: 160, desc: 'Un éclair figé en plein zigzag.' },
  'acier-celeste':      { nom: 'Acier céleste', emoji: '⚙️', type: 'materiau', prixVente: 210, desc: 'Forgé dans les nuages, trempé dans l’orage.' },
  'plume-d-archon':     { nom: 'Plume d’Archon', emoji: '🕊️', type: 'materiau', prixVente: 320, desc: 'Elle flotte à deux doigts de votre paume, toujours.' },
  'etoffe-du-neant':    { nom: 'Étoffe du néant', emoji: '🌌', type: 'materiau', prixVente: 160, desc: 'Un tissu découpé dans l’absence de tout.' },
  'eclat-d-etoile':     { nom: 'Éclat d’étoile', emoji: '⭐', type: 'materiau', prixVente: 210, desc: 'Encore tiède. Encore un peu vivant.' },
  'essence-primordiale': { nom: 'Essence primordiale', emoji: '✨', type: 'materiau', prixVente: 350, desc: 'La matière première du monde, en flacon.' },

  // ----- Trophées uniques des boss des Terres lointaines -----
  'crochet-de-sarpense':  { nom: 'Crochet de Sarpense', emoji: '🐍', type: 'equipement', slot: 'arme', niveau: 28, rarete: 'epique', prixVente: 700, bonus: { dex: 18, for: 6, crit: 4 }, desc: 'Trophée de la Matriarche de Vaï-Sombre.' },
  'serre-du-rokh':        { nom: 'Serre du Rokh', emoji: '🦅', type: 'equipement', slot: 'accessoire', niveau: 28, rarete: 'epique', prixVente: 700, bonus: { dex: 8, for: 6, celerite: 4 }, desc: 'Trophée du Rokh Tempétueux des Falaises.' },
  'fanon-du-leviathan':   { nom: 'Fanon du Léviathan', emoji: '🐋', type: 'equipement', slot: 'accessoire', niveau: 36, rarete: 'legendaire', prixVente: 1100, bonus: { int: 10, vit: 8, pmMax: 30 }, desc: 'Trophée du maître des Abysses d’Émeraude.' },
  'coeur-du-behemoth':    { nom: 'Cœur du Béhémoth', emoji: '🌋', type: 'equipement', slot: 'accessoire', niveau: 36, rarete: 'legendaire', prixVente: 1100, bonus: { for: 10, vit: 8, pvMax: 45, tenacite: 4 }, desc: 'Trophée du Béhémoth de la Steppe. Il bat encore, lentement.' },
  'oeil-de-quartz':       { nom: 'Œil de Quartz', emoji: '💎', type: 'equipement', slot: 'tete', niveau: 44, rarete: 'legendaire', prixVente: 1600, bonus: { int: 14, vit: 8, crit: 6, pmMax: 30 }, desc: 'Trophée de l’Avatar de la Forêt Pétrifiée.' },
  'couronne-d-ossements': { nom: 'Couronne d’Ossements', emoji: '👑', type: 'equipement', slot: 'tete', niveau: 44, rarete: 'legendaire', prixVente: 1600, bonus: { for: 14, vit: 8, pvMax: 60, tenacite: 5 }, desc: 'Trophée du Roi de la Vallée des Géants.' },
  'aile-de-l-archonte':   { nom: 'Aile de l’Archonte', emoji: '🕊️', type: 'equipement', slot: 'accessoire', niveau: 50, rarete: 'mythique', prixVente: 2400, bonus: { dex: 14, int: 10, crit: 8, celerite: 6 }, desc: 'Trophée de l’Archonte de la Tempête. Elle bat encore la mesure de l’orage.' },
  'singularite-apprivoisee': { nom: 'Singularité apprivoisée', emoji: '🕳️', type: 'equipement', slot: 'accessoire', niveau: 50, rarete: 'mythique', prixVente: 2400, bonus: { for: 12, int: 12, vit: 8, pvMax: 60 }, desc: 'Trophée du Dévoreur de Mondes. Ne pas secouer.' },
});

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
  matriarcheSarpense: 'crochet-de-sarpense',
  rokhTempetueux: 'serre-du-rokh',
  leviathanCorallien: 'fanon-du-leviathan',
  behemothCendre: 'coeur-du-behemoth',
  avatarQuartz: 'oeil-de-quartz',
  roiOssements: 'couronne-d-ossements',
  archonteTempete: 'aile-de-l-archonte',
  devoreurMondes: 'singularite-apprivoisee',
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

// =====================================================================
// v19 — La revente, revue à la baisse.
//
// Un équipement se revendait 40 % de son prix d'achat. Combiné au butin
// de coffre (trois à cinq pièces par boss), cela faisait du sac une
// machine à or : il suffisait de tout ramasser et de tout revendre.
//
// La part descend à 22 %, et elle est DÉGRESSIVE avec la rareté : plus
// une pièce est précieuse, moins la revente en rend — pour qu'un objet
// légendaire se garde, s'échange ou se démonte, plutôt qu'il ne finisse
// systématiquement au comptoir du premier marchand venu.
// =====================================================================
const PART_REVENTE = 0.22;
const REVENTE_PAR_RARETE = {
  commun: 1, inhabituel: 0.95, rare: 0.85, epique: 0.75,
  legendaire: 0.65, mythique: 0.55, divin: 0.45,
};

function prixVenteDe(idObjet) {
  const objet = OBJETS[idObjet];
  if (!objet) return 0;
  // Les matériaux portent leur propre valeur : elle vient de la récolte,
  // pas d'un prix de boutique, et le rééquilibrage ne les concerne pas.
  if (objet.prixVente != null) return objet.prixVente;
  const part = PART_REVENTE * (REVENTE_PAR_RARETE[rareteDe(objet)] || 1);
  return Math.max(1, Math.round((objet.prix || 0) * part));
}
