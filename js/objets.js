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
  'gants-du-voleur':      { nom: 'Gants du voleur repenti', emoji: '🧤', type: 'equipement', slot: 'accessoire', niveau: 8, rarete: 'rare', prix: 210, vendeur: 'antiquaire', bonus: { agi: 3, cha: 2 }, desc: '« Repenti », précise l’étiquette, deux fois.' },
  'ceinturon-cloute':     { nom: 'Ceinturon clouté', emoji: '🥋', type: 'equipement', slot: 'accessoire', niveau: 9, rarete: 'rare', prix: 240, vendeur: 'antiquaire', bonus: { for: 3, pvMax: 10 }, desc: 'Ayant appartenu à un champion de lutte naine.' },
  'boussole-detraquee':   { nom: 'Boussole détraquée', emoji: '🧭', type: 'equipement', slot: 'accessoire', niveau: 11, rarete: 'rare', prix: 300, vendeur: 'antiquaire', bonus: { agi: 3, int: 2, crit: 2 }, desc: 'Elle n’indique pas le nord, mais toujours quelque chose d’intéressant.' },
  'chope-runique':        { nom: 'Chope runique', emoji: '🍻', type: 'equipement', slot: 'accessoire', niveau: 12, rarete: 'rare', prix: 330, vendeur: 'antiquaire', bonus: { vit: 4, cha: 2 }, desc: 'Grave « santé ! » en sept langues mortes.' },
  'cape-mitee':           { nom: 'Cape mitée (mais magique)', emoji: '🧥', type: 'equipement', slot: 'accessoire', niveau: 14, rarete: 'epique', prix: 420, vendeur: 'antiquaire', bonus: { int: 4, vit: 3, pmMax: 12 }, desc: 'Les trous seraient « décoratifs », jure l’antiquaire.' },
  'dent-requin-fossile':  { nom: 'Dent de requin fossile', emoji: '🦈', type: 'equipement', slot: 'accessoire', niveau: 15, rarete: 'epique', prix: 480, vendeur: 'antiquaire', bonus: { for: 5, crit: 3 }, desc: 'Le requin, lui, date d’avant les Royaumes.' },
  'sablier-fele':         { nom: 'Sablier fêlé', emoji: '⏳', type: 'equipement', slot: 'accessoire', niveau: 17, rarete: 'epique', prix: 590, vendeur: 'antiquaire', bonus: { agi: 5, cha: 3, crit: 3 }, desc: 'Son sable remonte, certains soirs.' },
  'idole-sans-nom':       { nom: 'Idole sans nom', emoji: '🗿', type: 'equipement', slot: 'accessoire', niveau: 19, rarete: 'epique', prix: 750, vendeur: 'antiquaire', bonus: { for: 3, int: 3, agi: 3, vit: 3, cha: 3 }, desc: 'Personne ne sait qui elle représente. Elle, si.' },

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
  'crochet-de-sarpense':  { nom: 'Crochet de Sarpense', emoji: '🐍', type: 'equipement', slot: 'arme', niveau: 28, rarete: 'epique', prixVente: 700, bonus: { agi: 18, for: 6, crit: 4 }, desc: 'Trophée de la Matriarche de Vaï-Sombre.' },
  'serre-du-rokh':        { nom: 'Serre du Rokh', emoji: '🦅', type: 'equipement', slot: 'accessoire', niveau: 28, rarete: 'epique', prixVente: 700, bonus: { agi: 8, for: 6, esquive: 4 }, desc: 'Trophée du Rokh Tempétueux des Falaises.' },
  'fanon-du-leviathan':   { nom: 'Fanon du Léviathan', emoji: '🐋', type: 'equipement', slot: 'accessoire', niveau: 36, rarete: 'legendaire', prixVente: 1100, bonus: { int: 10, vit: 8, pmMax: 30 }, desc: 'Trophée du maître des Abysses d’Émeraude.' },
  'coeur-du-behemoth':    { nom: 'Cœur du Béhémoth', emoji: '🌋', type: 'equipement', slot: 'accessoire', niveau: 36, rarete: 'legendaire', prixVente: 1100, bonus: { for: 10, vit: 8, pvMax: 45, blocage: 4 }, desc: 'Trophée du Béhémoth de la Steppe. Il bat encore, lentement.' },
  'oeil-de-quartz':       { nom: 'Œil de Quartz', emoji: '💎', type: 'equipement', slot: 'tete', niveau: 44, rarete: 'legendaire', prixVente: 1600, bonus: { int: 14, vit: 8, crit: 6, pmMax: 30 }, desc: 'Trophée de l’Avatar de la Forêt Pétrifiée.' },
  'couronne-d-ossements': { nom: 'Couronne d’Ossements', emoji: '👑', type: 'equipement', slot: 'tete', niveau: 44, rarete: 'legendaire', prixVente: 1600, bonus: { for: 14, vit: 8, pvMax: 60, blocage: 5 }, desc: 'Trophée du Roi de la Vallée des Géants.' },
  'aile-de-l-archonte':   { nom: 'Aile de l’Archonte', emoji: '🕊️', type: 'equipement', slot: 'accessoire', niveau: 50, rarete: 'mythique', prixVente: 2400, bonus: { agi: 14, int: 10, crit: 8, esquive: 6 }, desc: 'Trophée de l’Archonte de la Tempête. Elle bat encore la mesure de l’orage.' },
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
  { suffixe: 'des Falaises',  niveau: 24, rarete: 'rare',       po: 320,  materiaux: { 'alliage-hurlant': 2, 'lingot-ferreux': 2 } },
  { suffixe: 'de Vaï-Sombre', niveau: 28, rarete: 'epique',     po: 450,  materiaux: { 'resine-de-jungle': 2, 'cuir-double': 3, 'essence-sylvestre': 1 } },
  { suffixe: 'des Abysses',   niveau: 33, rarete: 'epique',     po: 620,  materiaux: { 'sel-d-abysse': 2, 'toile-runique': 2 } },
  { suffixe: 'du Béhémoth',   niveau: 38, rarete: 'legendaire', po: 900,  materiaux: { 'perle-de-magma': 2, 'moelle-titanesque': 1, 'lingot-ferreux': 3 } },
  { suffixe: 'des Titans',    niveau: 44, rarete: 'mythique',   po: 1400, materiaux: { 'moelle-titanesque': 2, 'quartz-eveille': 2, 'sel-d-abysse': 1 } },
  { suffixe: 'du Firmament',  niveau: 50, rarete: 'divin',      po: 2200, materiaux: { 'coeur-d-orage': 2, 'fil-du-neant': 2, 'quartz-eveille': 1 } },
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
  { suffixe: 'des Trois Maîtres', niveau: 36, rarete: 'mythique', po: 1600, materiaux: { 'lingot-arcanique': 1, 'cuir-de-legende': 1, 'etoffe-enchantee': 1 } },
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
  legendaire: { 2: { crit: 4, pvMax: 35, cha: 2 }, 4: { xpBonus: 0.1, poBonus: 0.1, for: 2, int: 2, agi: 2, vit: 2 } },
  mythique:   { 2: { crit: 5, pvMax: 50, cha: 2 }, 4: { xpBonus: 0.12, poBonus: 0.12, for: 3, int: 3, agi: 3, vit: 3 } },
  divin:      { 2: { crit: 6, pvMax: 70, cha: 3 }, 4: { xpBonus: 0.15, poBonus: 0.15, for: 4, int: 4, agi: 4, vit: 4 } },
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

// Multiplicateur d'or gagné : familier + panoplies.
function multiplicateurOr(p) {
  const familier = familierActif(p);
  return 1 + ((familier && familier.bonus.poBonus) || 0) + bonusSetActifs(p).poBonus;
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
    { cle: 'gants',     nom: `Gants ${serie.suffixe}`,     emoji: '🧤', slot: 'mains',      bonus: { for: secondaire, agi: secondaire, blocage: Math.max(1, Math.floor(serie.niveau / 8)) } },
    { cle: 'bottes',    nom: `Bottes ${serie.suffixe}`,    emoji: '🥾', slot: 'pieds',      bonus: { agi: secondaire, vit: secondaire, esquive: Math.max(1, Math.floor(serie.niveau / 8)) } },
  ];
  SETS[`craft-${idBase}`] = { nom: `Série ${serie.suffixe}`, rarete: serie.rarete };
  pieces.forEach((piece) => {
    const id = `${piece.cle}-${idBase}`;
    OBJETS[id] = {
      nom: piece.nom, emoji: piece.emoji, type: 'equipement', slot: piece.slot,
      niveau: serie.niveau, rarete: serie.rarete,
      prixVente: Math.round(serie.po * 0.6),
      bonus: piece.bonus,
      set: `craft-${idBase}`,
      desc: `Série ${serie.suffixe} — se forge à l’atelier.`,
    };
    RECETTES.push({ resultat: id, niveau: serie.niveau, po: serie.po, materiaux: materiauxDePiece(serie, piece.slot) });
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
  { cle: 'gants',    noms: ['Gants', 'Gantelets', 'Mitaines'],   emoji: '🧤', slot: 'mains',      principal: 'for', secondaire: 'agi', defensif: 'blocage' },
  { cle: 'jambes',   noms: ['Jambières', 'Grèves', 'Cuissards'], emoji: '👖', slot: 'jambes',     principal: 'agi', secondaire: 'vit' },
  { cle: 'bottes',   noms: ['Bottes', 'Sandales', 'Solerets'],   emoji: '🥾', slot: 'pieds',      principal: 'agi', secondaire: 'vit', defensif: 'esquive' },
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

// Jusqu'au niveau 20 : toutes les raretés, deux variantes. Au-delà
// (niveaux 21 à 50) : une variante, raretés épique et plus seulement —
// le haut niveau se joue dans les hautes raretés.
ARCHETYPES_BUTIN.forEach((archetype) => {
  for (let niveau = 1; niveau <= 50; niveau++) {
    const variantes = niveau <= 20 ? 2 : 1;
    Object.keys(RARETES).forEach((rarete) => {
      if (niveau < PALIER_RARETE[rarete]) return;
      if (niveau > 20 && !['epique', 'legendaire', 'mythique', 'divin'].includes(rarete)) return;
      for (let variante = 0; variante < variantes; variante++) {
        const nomBase = archetype.noms[(niveau + variante) % archetype.noms.length];
        const qualificatif = QUALIFICATIFS_BUTIN[rarete][(niveau + variante * 2) % 3];
        const mult = MULT_RARETE_BUTIN[rarete];
        const principal = Math.max(1, Math.round((2 + niveau * 0.85) * mult) + variante);
        const bonus = { [archetype.principal]: principal };
        if (niveau >= 4) bonus[archetype.secondaire] = Math.max(1, Math.round(principal * 0.35));
        if (archetype.slot === 'torse' || archetype.slot === 'tete') bonus.pvMax = Math.round(niveau * 2 * mult);
        if (archetype.principal === 'int') bonus.pmMax = Math.round(niveau * 1.5 * mult);
        if (rarete === 'mythique' || rarete === 'divin') bonus.crit = Math.round(2 + niveau * 0.25);
        // Gants et bottes portent les stats défensives (blocage/esquive)
        // à partir de la rareté rare et du niveau 8.
        if (archetype.defensif && niveau >= 8 && !['commun', 'inhabituel'].includes(rarete)) {
          bonus[archetype.defensif] = Math.max(1, Math.round(1 + niveau * 0.12 * mult));
        }
        // Les objets partageant un même qualificatif forment une panoplie.
        const indexQualificatif = (niveau + variante * 2) % 3;
        const idSet = `butin-${rarete}-${indexQualificatif}`;
        if (!SETS[idSet]) SETS[idSet] = { nom: `Panoplie ${qualificatif}`, rarete };
        OBJETS[`butin-${archetype.cle}-${rarete}-${niveau}-${variante}`] = {
          nom: `${nomBase} ${qualificatif}`,
          emoji: archetype.emoji, type: 'equipement', slot: archetype.slot,
          niveau, rarete,
          prixVente: Math.max(5, Math.round(niveau * 6 * mult)),
          bonus,
          set: idSet,
          desc: 'Butin d’aventure : coffres de boss, Tour Sans Fin et contrats de guilde.',
        };
      }
    });
  }
});

// =====================================================================
// Catalogue du marchand : équipements générés, niveaux 1 à 50.
// v17 : le marchand ne vend QUE du commun → épique (le légendaire, le
// mythique et le divin se méritent : butin, boss ou artisans), et ses
// pièces n'ont AUCUN bonus de panoplie ni skill passif — pour ça, il
// faut passer chez les artisans ou partir à l'aventure.
// =====================================================================
const QUALIFICATIFS_BOUTIQUE = {
  commun:     ['de l’échoppe', 'du colporteur', 'de série'],
  inhabituel: ['de l’artisan', 'du bourg', 'de bonne facture'],
  rare:       ['de maître', 'du comptoir doré', 'd’exception'],
  epique:     ['de la Grande Foire', 'du maître-marchand', 'de prestige'],
};

// Fenêtre de niveaux où le marchand propose chaque rareté (jusqu'au 50).
const FENETRES_BOUTIQUE = {
  commun: [1, 8], inhabituel: [3, 14], rare: [6, 30], epique: [10, 50],
};
const MULT_STAT_BOUTIQUE = { commun: 0.7, inhabituel: 0.85, rare: 1.0, epique: 1.15 };
const MULT_PRIX_BOUTIQUE = { commun: 1, inhabituel: 1.6, rare: 2.6, epique: 4.2 };

ARCHETYPES_BUTIN.forEach((archetype) => {
  for (let niveau = 1; niveau <= 50; niveau++) {
    Object.entries(FENETRES_BOUTIQUE).forEach(([rarete, [debut, fin]]) => {
      if (niveau < debut || niveau > fin) return;
      const indexQualificatif = niveau % 3;
      const qualificatif = QUALIFICATIFS_BOUTIQUE[rarete][indexQualificatif];
      const nomBase = archetype.noms[niveau % archetype.noms.length];
      const mult = MULT_STAT_BOUTIQUE[rarete];
      const principal = Math.max(1, Math.round((2 + niveau * 0.85) * mult));
      const bonus = { [archetype.principal]: principal };
      if (niveau >= 4) bonus[archetype.secondaire] = Math.max(1, Math.round(principal * 0.35));
      if (archetype.slot === 'torse' || archetype.slot === 'tete') bonus.pvMax = Math.round(niveau * 2 * mult);
      if (archetype.principal === 'int') bonus.pmMax = Math.round(niveau * 1.5 * mult);
      if (archetype.defensif && niveau >= 8 && ['rare', 'epique'].includes(rarete)) {
        bonus[archetype.defensif] = Math.max(1, Math.round(1 + niveau * 0.1 * mult));
      }
      OBJETS[`marchand-${archetype.cle}-${rarete}-${niveau}`] = {
        nom: `${nomBase} ${qualificatif}`,
        emoji: archetype.emoji, type: 'equipement', slot: archetype.slot,
        niveau, rarete,
        prix: Math.max(8, Math.round((10 + niveau * 8) * MULT_PRIX_BOUTIQUE[rarete])),
        bonus,
        desc: `Collection du marchand — sans bonus de panoplie : l'exceptionnel se gagne, il ne s'achète pas.`,
      };
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
    blocage: '🛡️ Blocage', esquive: '💨 Esquive',
  };
  const enPourcent = ['crit', 'blocage', 'esquive'];
  return Object.entries(bonus)
    .map(([cle, valeur]) => `+${valeur}${enPourcent.includes(cle) ? ' %' : ''} ${libelles[cle] || cle}`)
    .join(' · ');
}
