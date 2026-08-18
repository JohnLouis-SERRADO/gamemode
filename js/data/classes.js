'use strict';

// =====================================================================
// Classes : modèles, signatures, arbres de classe, points de maîtrise
// =====================================================================

// Modèles rapides : pré-remplissent stats + compétences (modifiables ensuite).
const MODELES = [
  {
    nom: 'Guerrier', emoji: '⚔️',
    stats: { for: 7, int: 2, dex: 3, vit: 6, cha: 2 },
    competences: ['frappe-heroique', 'coup-etourdissant', 'provocation', 'second-souffle'],
  },
  {
    nom: 'Mage', emoji: '🔮',
    stats: { for: 2, int: 8, dex: 4, vit: 4, cha: 2 },
    competences: ['boule-de-feu', 'eclair', 'nova-de-givre', 'bouclier-magique'],
  },
  {
    nom: 'Archer', emoji: '🏹',
    stats: { for: 4, int: 2, dex: 8, vit: 4, cha: 2 },
    competences: ['tir-precis', 'pluie-de-fleches', 'lame-empoisonnee', 'concentration'],
  },
  {
    nom: 'Clerc', emoji: '🌿',
    stats: { for: 3, int: 6, dex: 3, vit: 6, cha: 2 },
    competences: ['soin', 'cercle-de-soin', 'benediction', 'regeneration'],
  },
  {
    nom: 'Paladin', emoji: '⚖️',
    stats: { for: 5, int: 4, dex: 2, vit: 7, cha: 2 },
    competences: ['frappe-heroique', 'soin', 'bouclier-magique', 'provocation'],
  },
  {
    nom: 'Nécromancien', emoji: '💀',
    stats: { for: 2, int: 8, dex: 3, vit: 5, cha: 2 },
    competences: ['drain-de-vie', 'boule-de-feu', 'lame-empoisonnee', 'concentration'],
  },
  {
    nom: 'Moine', emoji: '🥋',
    stats: { for: 4, int: 2, dex: 7, vit: 5, cha: 2 },
    competences: ['second-souffle', 'tir-precis', 'coup-etourdissant', 'concentration'],
  },
  {
    nom: 'Barde', emoji: '🎵',
    stats: { for: 3, int: 6, dex: 5, vit: 4, cha: 2 },
    competences: ['soin', 'benediction', 'regeneration', 'concentration'],
  },
  {
    nom: 'Rôdeur', emoji: '🐺',
    stats: { for: 4, int: 2, dex: 7, vit: 4, cha: 3 },
    competences: ['tir-precis', 'pluie-de-fleches', 'lame-empoisonnee', 'second-souffle'],
  },
  {
    nom: 'Assassin', emoji: '🗡️',
    stats: { for: 3, int: 2, dex: 8, vit: 3, cha: 4 },
    competences: ['lame-empoisonnee', 'tir-precis', 'concentration', 'second-souffle'],
  },
  {
    nom: 'Berserker', emoji: '🪓',
    stats: { for: 8, int: 1, dex: 4, vit: 5, cha: 2 },
    competences: ['tourbillon', 'frappe-heroique', 'coup-etourdissant', 'second-souffle'],
  },
  {
    nom: 'Templier', emoji: '🛡️',
    stats: { for: 6, int: 3, dex: 1, vit: 8, cha: 2 },
    competences: ['frappe-heroique', 'provocation', 'bouclier-magique', 'soin'],
  },
  {
    nom: 'Élémentaliste', emoji: '🌪️',
    stats: { for: 1, int: 8, dex: 3, vit: 4, cha: 4 },
    competences: ['boule-de-feu', 'eclair', 'nova-de-givre', 'concentration'],
  },
  {
    nom: 'Druide', emoji: '🐻',
    stats: { for: 3, int: 6, dex: 2, vit: 6, cha: 3 },
    competences: ['soin', 'cercle-de-soin', 'regeneration', 'drain-de-vie'],
  },
  {
    nom: 'Invocateur', emoji: '🐉',
    stats: { for: 2, int: 7, dex: 3, vit: 4, cha: 4 },
    competences: ['invoquer-feu-follet', 'drain-de-vie', 'eclair', 'concentration'],
  },
  {
    nom: 'Pyromancien', emoji: '🔥',
    stats: { for: 2, int: 8, dex: 2, vit: 4, cha: 4 },
    competences: ['boule-de-feu', 'eclair', 'drain-de-vie', 'concentration'],
  },
  {
    nom: 'Givremage', emoji: '❄️',
    stats: { for: 1, int: 8, dex: 3, vit: 5, cha: 3 },
    competences: ['nova-de-givre', 'eclair', 'bouclier-magique', 'concentration'],
  },
  {
    nom: 'Chaman', emoji: '🌩️',
    stats: { for: 3, int: 6, dex: 2, vit: 5, cha: 4 },
    competences: ['eclair', 'cercle-de-soin', 'benediction', 'regeneration'],
  },
  {
    nom: 'Voleur', emoji: '💰',
    stats: { for: 3, int: 2, dex: 7, vit: 3, cha: 5 },
    competences: ['lame-empoisonnee', 'coup-etourdissant', 'tir-precis', 'concentration'],
  },
  {
    nom: 'Danselame', emoji: '🌸',
    stats: { for: 4, int: 2, dex: 7, vit: 4, cha: 3 },
    competences: ['tir-precis', 'pluie-de-fleches', 'second-souffle', 'concentration'],
  },
];

// =====================================================================
// Classes : chaque modèle de création est une classe à part entière.
// Les 68 compétences classiques sont communes à tous ; chaque classe a
// en plus une SIGNATURE exclusive, améliorable avec des points de
// maîtrise (voir CADENCE_MAITRISE plus bas — rang 5 maximum).
// =====================================================================
MODELES.forEach((m) => {
  m.id = m.nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-');
});

// =====================================================================
// v19 : les modèles ont été écrits pour cinq caractéristiques. L'Esprit
// vient d'en faire six, et la dotation de création a grandi d'autant.
// Plutôt que de réécrire vingt tableaux à la main — ce que le lot des
// classes fera pour de bon —, on les remet ici au bon total : l'Esprit à
// sa valeur de base, puis le reliquat versé là où il reste de la place,
// en respectant le plafond de création.
// =====================================================================
const TOTAL_STATS_CREATION = POINTS_CREATION + Object.keys(CARACS).length * STAT_BASE;

MODELES.forEach((m) => {
  Object.keys(CARACS).forEach((cle) => {
    if (m.stats[cle] == null) m.stats[cle] = STAT_BASE;
  });
  const total = () => Object.keys(CARACS).reduce((somme, cle) => somme + m.stats[cle], 0);
  // On verse d'abord dans ce que le modèle privilégie déjà : un Guerrier
  // reste un Guerrier, il ne devient pas polyvalent par accident.
  const parPriorite = Object.keys(CARACS).sort((a, b) => m.stats[b] - m.stats[a]);
  let garde = 0;
  while (total() < TOTAL_STATS_CREATION && garde++ < 100) {
    const cible = parPriorite.find((cle) => m.stats[cle] < STAT_MAX_CREATION);
    if (!cible) break;
    m.stats[cible]++;
  }
});

// Les sorts d'invocation : un par créature, une seule invocation vivante
// par héros — sauf l'Invocateur 🐉, qui en entretient deux à la fois —,
// un seul appel par combat (long rituel).
Object.assign(COMPETENCES, {
  'invoquer-loup-spectral': {
    nom: 'Invoquer le Loup spectral', emoji: '🐺', categorie: 'invocation', type: 'invocation',
    cible: 'soi', invocation: 'loup-spectral', coutMp: 10, cooldown: 99,
    desc: 'Appelle un loup spectral qui combat à vos côtés : crocs rapides et frappes d’ombre.',
  },
  'invoquer-golem-de-basalte': {
    nom: 'Invoquer le Golem de basalte', emoji: '🗿', categorie: 'invocation', type: 'invocation',
    cible: 'soi', invocation: 'golem-de-basalte', coutMp: 12, cooldown: 99,
    desc: 'Dresse un golem massif qui provoque les ennemis et encaisse à votre place.',
  },
  'invoquer-feu-follet': {
    nom: 'Invoquer le Feu follet', emoji: '🔥', categorie: 'invocation', type: 'invocation',
    cible: 'soi', invocation: 'feu-follet', coutMp: 12, cooldown: 99,
    desc: 'Libère une étincelle vivante qui bombarde les ennemis de flammes.',
  },
  'invoquer-ondine': {
    nom: 'Invoquer l’Ondine des marées', emoji: '💧', categorie: 'invocation', type: 'invocation',
    cible: 'soi', invocation: 'ondine-des-marees', coutMp: 13, cooldown: 99,
    desc: 'Fait jaillir une ondine qui soigne l’équipe et gifle de givre.',
  },
  'invoquer-corbeau-d-orage': {
    nom: 'Invoquer le Corbeau d’orage', emoji: '🐦‍⬛', categorie: 'invocation', type: 'invocation',
    cible: 'soi', invocation: 'corbeau-d-orage', coutMp: 13, cooldown: 99,
    desc: 'Appelle un corbeau crépitant qui foudroie au hasard des courants.',
  },
  'invoquer-ombre-de-nihelm': {
    nom: 'Invoquer l’Ombre de Nihelm', emoji: '🕳️', categorie: 'invocation', type: 'invocation',
    cible: 'soi', invocation: 'ombre-de-nihelm', coutMp: 15, cooldown: 99,
    desc: 'Arrache au gouffre une ombre faucheuse qui draine et terrifie.',
  },
});

const COMPETENCES_SIGNATURE = {
  'signature-panache':            { nom: 'Panache', emoji: '🎩', classe: 'aventurier', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'for', puissance: 10, ratio: 1.5, critBonus: 0.1, coutMp: 8, cooldown: 4, desc: 'Le coup d’éclat de ceux qui n’ont pas choisi de voie — et les ont toutes un peu prises.' },
  'signature-lame-du-champion':   { nom: 'Lame du champion', emoji: '🏆', classe: 'guerrier', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'for', puissance: 12, ratio: 1.8, critBonus: 0.1, coutMp: 8, cooldown: 4, desc: 'La botte secrète des maîtres d’armes de Valciel.' },
  'signature-comete-arcanique':   { nom: 'Comète arcanique', emoji: '☄️', classe: 'mage', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 14, ratio: 1.7, coutMp: 10, cooldown: 4, desc: 'Faire tomber le ciel sur une seule tête.' },
  'signature-fleche-du-destin':   { nom: 'Flèche du destin', emoji: '🎯', classe: 'archer', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'dex', puissance: 10, ratio: 1.6, critBonus: 0.25, coutMp: 8, cooldown: 4, desc: 'Une seule flèche. Elle sait où aller.' },
  'signature-lumiere-salvatrice': { nom: 'Lumière salvatrice', emoji: '🌅', classe: 'clerc', signature: true, categorie: 'signature', type: 'soin', cible: 'allies', stat: 'int', puissance: 10, ratio: 1.2, coutMp: 12, cooldown: 5, desc: 'Une aube en plein combat : soigne généreusement toute l’équipe.' },
  'signature-verdict-celeste':    { nom: 'Verdict céleste', emoji: '⚡', classe: 'paladin', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'for', puissance: 10, ratio: 1.4, effet: { type: 'etourdi', duree: 1, chance: 0.5 }, coutMp: 10, cooldown: 5, desc: 'Le jugement tombe du ciel — et il assomme, une fois sur deux.' },
  'signature-moisson-d-ames':     { nom: 'Moisson d’âmes', emoji: '🌑', classe: 'necromancien', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 6, ratio: 1.0, effet: { type: 'drain', part: 0.5 }, coutMp: 12, cooldown: 5, desc: 'Faucher tous les ennemis et récolter la moitié en vie.' },
  'signature-cent-poings':        { nom: 'Cent poings', emoji: '👊', classe: 'moine', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'dex', puissance: 3, ratio: 0.7, coups: 4, coutMp: 9, cooldown: 4, desc: 'Quatre frappes, un seul battement de cœur.' },
  'signature-crescendo':          { nom: 'Crescendo', emoji: '🎼', classe: 'barde', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 8, ratio: 1.2, coutMp: 10, cooldown: 5, desc: 'Le dernier mouvement, fortissimo : la salle entière l’encaisse.' },
  'signature-meute-fantome':      { nom: 'Meute fantôme', emoji: '🐺', classe: 'rodeur', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'dex', puissance: 7, ratio: 1.1, coutMp: 10, cooldown: 5, desc: 'Des loups d’esprit surgissent des fourrés sur tout ce qui bouge.' },
  'signature-danse-macabre':      { nom: 'Danse macabre', emoji: '🩸', classe: 'assassin', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'dex', puissance: 8, ratio: 1.3, coups: 2, critBonus: 0.15, coutMp: 10, cooldown: 5, desc: 'Deux pas, deux lames, plus de partenaire.' },
  'signature-colere-du-sang':     { nom: 'Colère du sang', emoji: '🌋', classe: 'berserker', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'for', puissance: 16, ratio: 2.0, coutMp: 10, cooldown: 5, desc: 'Le coup que même le Berserker ne contrôle plus vraiment.' },
  'signature-rempart-sacre':      { nom: 'Rempart sacré', emoji: '🏰', classe: 'templier', signature: true, categorie: 'signature', type: 'utilitaire', cible: 'allies', effet: { type: 'bouclier', duree: 3 }, coutMp: 12, cooldown: 6, desc: 'Un mur de foi se dresse devant toute l’équipe.' },
  'signature-cataclysme':         { nom: 'Cataclysme', emoji: '🌪️', classe: 'elementaliste', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 9, ratio: 1.15, coutMp: 13, cooldown: 6, desc: 'Les quatre éléments, tous en colère, tous en même temps.' },
  'signature-courroux-sylvestre': { nom: 'Courroux sylvestre', emoji: '🌿', classe: 'druide', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 10, ratio: 1.5, effet: { type: 'poison', duree: 3 }, coutMp: 10, cooldown: 5, desc: 'La forêt entière se souvient — et elle mord.' },
  'signature-avatar-primordial':  { nom: 'Avatar primordial', emoji: '🐲', classe: 'invocateur', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 13, ratio: 1.6, coutMp: 11, cooldown: 5, desc: 'L’espace d’un instant, l’invocation dépasse l’invocateur.' },
  'signature-supernova':          { nom: 'Supernova', emoji: '💥', classe: 'pyromancien', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 10, ratio: 1.2, coutMp: 14, cooldown: 6, desc: 'Tout brûle. Vraiment tout.' },
  'signature-zero-absolu':        { nom: 'Zéro absolu', emoji: '🧊', classe: 'givremage', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 11, ratio: 1.5, effet: { type: 'etourdi', duree: 1, chance: 0.6 }, coutMp: 12, cooldown: 6, desc: 'Là où le froid s’arrête, l’ennemi aussi.' },
  'signature-tempete-ancestrale': { nom: 'Tempête ancestrale', emoji: '🌩️', classe: 'chaman', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 8, ratio: 1.1, effet: { type: 'affaibli', duree: 2 }, coutMp: 13, cooldown: 6, desc: 'Tous les ancêtres grondent à la fois — les ennemis en ressortent diminués.' },
  'signature-casse-du-siecle':    { nom: 'Casse du siècle', emoji: '💎', classe: 'voleur', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'dex', puissance: 9, ratio: 1.4, effet: { type: 'vol-or' }, coutMp: 9, cooldown: 5, desc: 'Frapper fort ET repartir avec la caisse.' },
  'signature-ballet-mortel':      { nom: 'Ballet mortel', emoji: '🌸', classe: 'danselame', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'dex', puissance: 6, ratio: 0.9, coups: 2, coutMp: 12, cooldown: 6, desc: 'Deux passages de danse, et les pétales retombent sur un champ de bataille.' },
};
Object.assign(COMPETENCES, COMPETENCES_SIGNATURE);

// ---------------------------------------------------------------------
// Arbre de classe : 3 compétences supplémentaires par classe, débloquées
// automatiquement aux niveaux 5, 10 et 15 (4 par classe avec la
// signature de création). Les points de maîtrise s'y investissent aussi.
// ---------------------------------------------------------------------
const COMPETENCES_CLASSE = {
  // Guerrier
  'guerrier-garde-de-fer':    { classe: 'guerrier', niveauRequis: 5, nom: 'Garde de fer', emoji: '🛡️', categorie: 'signature', type: 'utilitaire', cible: 'soi', effet: { type: 'bouclier', duree: 3, stat: 'for' }, coutMp: 6, cooldown: 4, desc: 'Un bouclier forgé dans la pure discipline martiale.' },
  'guerrier-brise-garde':     { classe: 'guerrier', niveauRequis: 10, nom: 'Brise-garde', emoji: '💢', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'for', puissance: 9, ratio: 1.3, effet: { type: 'affaibli', duree: 2 }, coutMp: 8, cooldown: 4, desc: 'Fracasse la défense : l’ennemi frappe −30 % pendant 2 tours.' },
  'guerrier-assaut-final':    { classe: 'guerrier', niveauRequis: 15, nom: 'Assaut final', emoji: '⚡', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'for', puissance: 14, ratio: 1.9, critBonus: 0.15, coutMp: 12, cooldown: 5, desc: 'Le coup qu’on n’apprend qu’aux maîtres d’armes.' },
  // Mage
  'mage-flux-arcanique':      { classe: 'mage', niveauRequis: 5, nom: 'Flux arcanique', emoji: '🌀', categorie: 'signature', type: 'utilitaire', cible: 'soi', effet: { type: 'mana', valeur: 12 }, coutMp: 0, cooldown: 4, desc: 'Aspire le mana ambiant : +12 PM.' },
  'mage-orbe-fracassant':     { classe: 'mage', niveauRequis: 10, nom: 'Orbe fracassant', emoji: '🔮', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 11, ratio: 1.5, coutMp: 9, cooldown: 4, desc: 'Un orbe dense comme une étoile naine.' },
  'mage-tempete-de-mana':     { classe: 'mage', niveauRequis: 15, nom: 'Tempête de mana', emoji: '🌌', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 9, ratio: 1.15, coutMp: 13, cooldown: 5, desc: 'Le mana brut balaie tout le champ de bataille.' },
  // Archer
  'archer-fleche-entravante': { classe: 'archer', niveauRequis: 5, nom: 'Flèche entravante', emoji: '🪢', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'dex', puissance: 6, ratio: 1.0, effet: { type: 'etourdi', duree: 1, chance: 0.35 }, coutMp: 6, cooldown: 4, desc: 'Une flèche câblée qui entrave la cible.' },
  'archer-double-tir':        { classe: 'archer', niveauRequis: 10, nom: 'Double tir', emoji: '🏹', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'dex', puissance: 5, ratio: 0.9, coups: 2, coutMp: 8, cooldown: 4, desc: 'Deux flèches encochées d’un seul geste.' },
  'archer-deluge':            { classe: 'archer', niveauRequis: 15, nom: 'Déluge de traits', emoji: '🌧️', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'dex', puissance: 8, ratio: 1.1, coutMp: 12, cooldown: 5, desc: 'Le ciel disparaît sous les flèches.' },
  // Clerc
  'clerc-priere-fervente':    { classe: 'clerc', niveauRequis: 5, nom: 'Prière fervente', emoji: '🙏', categorie: 'signature', type: 'soin', cible: 'allie', stat: 'int', puissance: 8, ratio: 1.1, coutMp: 7, cooldown: 3, desc: 'Un soin rapide porté par la foi.' },
  'clerc-chatiment-lumineux': { classe: 'clerc', niveauRequis: 10, nom: 'Châtiment lumineux', emoji: '🌟', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 10, ratio: 1.3, coutMp: 8, cooldown: 4, desc: 'La lumière aussi sait frapper.' },
  'clerc-sanctuaire':         { classe: 'clerc', niveauRequis: 15, nom: 'Sanctuaire', emoji: '⛪', categorie: 'signature', type: 'utilitaire', cible: 'allies', effet: { type: 'regen', duree: 3 }, coutMp: 13, cooldown: 6, desc: 'Un havre béni : toute l’équipe régénère 3 tours.' },
  // Paladin
  'paladin-serment':          { classe: 'paladin', niveauRequis: 5, nom: 'Serment de bataille', emoji: '📜', categorie: 'signature', type: 'utilitaire', cible: 'soi', effet: { type: 'benediction', duree: 2 }, coutMp: 7, cooldown: 5, desc: 'Un serment qui affûte la lame : +30 % de dégâts.' },
  'paladin-lame-consacree':   { classe: 'paladin', niveauRequis: 10, nom: 'Lame consacrée', emoji: '🗡️', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'for', puissance: 10, ratio: 1.4, effet: { type: 'drain', part: 0.3 }, coutMp: 9, cooldown: 4, desc: 'Frappe sacrée qui rend un tiers des dégâts en vie.' },
  'paladin-egide':            { classe: 'paladin', niveauRequis: 15, nom: 'Égide du juste', emoji: '🛡️', categorie: 'signature', type: 'utilitaire', cible: 'allies', effet: { type: 'bouclier', duree: 3, stat: 'for' }, coutMp: 13, cooldown: 6, desc: 'Un rempart de foi couvre toute l’équipe.' },
  // Nécromancien
  'necromancien-toucher-glacial': { classe: 'necromancien', niveauRequis: 5, nom: 'Toucher glacial', emoji: '🥶', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 8, ratio: 1.2, effet: { type: 'affaibli', duree: 2 }, coutMp: 7, cooldown: 3, desc: 'Le froid de la tombe engourdit les bras.' },
  'necromancien-siphon':      { classe: 'necromancien', niveauRequis: 10, nom: 'Siphon d’âme', emoji: '🌪️', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 9, ratio: 1.3, effet: { type: 'drain', part: 0.6 }, coutMp: 9, cooldown: 4, desc: 'Aspire la vie — 60 % des dégâts vous reviennent.' },
  'necromancien-hiver-des-ames': { classe: 'necromancien', niveauRequis: 15, nom: 'Hiver des âmes', emoji: '☠️', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 8, ratio: 1.1, effet: { type: 'poison', stat: 'int', duree: 2 }, coutMp: 13, cooldown: 5, desc: 'Un froid qui ronge tous les ennemis, tour après tour.' },
  // Moine
  'moine-souffle-interieur':  { classe: 'moine', niveauRequis: 5, nom: 'Souffle intérieur', emoji: '🧘', categorie: 'signature', type: 'utilitaire', cible: 'soi', effet: { type: 'regen', duree: 3, stat: 'dex' }, coutMp: 6, cooldown: 4, desc: 'Le souffle circule : régénération pendant 3 tours.' },
  'moine-paume-sismique':     { classe: 'moine', niveauRequis: 10, nom: 'Paume sismique', emoji: '💥', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'dex', puissance: 8, ratio: 1.2, effet: { type: 'etourdi', duree: 1, chance: 0.45 }, coutMp: 8, cooldown: 4, desc: 'Une paume qui fait trembler la terre — et la cible.' },
  'moine-mille-mains':        { classe: 'moine', niveauRequis: 15, nom: 'Mille mains', emoji: '👐', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'dex', puissance: 4, ratio: 0.8, coups: 3, coutMp: 11, cooldown: 5, desc: 'Trois frappes — l’œil n’en voit qu’une.' },
  // Barde
  'barde-berceuse-brutale':   { classe: 'barde', niveauRequis: 5, nom: 'Berceuse brutale', emoji: '🎶', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 4, ratio: 0.7, effet: { type: 'etourdi', duree: 1, chance: 0.55 }, coutMp: 7, cooldown: 4, desc: 'Une berceuse si efficace qu’elle assomme.' },
  'barde-refrain-vivifiant':  { classe: 'barde', niveauRequis: 10, nom: 'Refrain vivifiant', emoji: '💞', categorie: 'signature', type: 'soin', cible: 'allies', stat: 'int', puissance: 6, ratio: 0.9, coutMp: 10, cooldown: 5, desc: 'Un refrain qui recoud les plaies de toute l’équipe.' },
  'barde-solo-epique':        { classe: 'barde', niveauRequis: 15, nom: 'Solo épique', emoji: '🎸', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 12, ratio: 1.5, critBonus: 0.2, coutMp: 11, cooldown: 5, desc: 'Le riff que les chroniques retiendront.' },
  // Rôdeur
  'rodeur-piege-a-machoires': { classe: 'rodeur', niveauRequis: 5, nom: 'Piège à mâchoires', emoji: '🪤', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'dex', puissance: 6, ratio: 1.0, effet: { type: 'etourdi', duree: 1, chance: 0.4 }, coutMp: 6, cooldown: 4, desc: 'Clac. La proie n’ira nulle part.' },
  'rodeur-fleches-barbelees': { classe: 'rodeur', niveauRequis: 10, nom: 'Flèches barbelées', emoji: '🏹', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'dex', puissance: 7, ratio: 1.1, effet: { type: 'poison', stat: 'dex', duree: 2 }, coutMp: 8, cooldown: 4, desc: 'Des pointes qui restent — et qui travaillent.' },
  'rodeur-appel-de-la-meute': { classe: 'rodeur', niveauRequis: 15, nom: 'Appel de la meute', emoji: '🐺', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'dex', puissance: 8, ratio: 1.15, coutMp: 12, cooldown: 5, desc: 'La forêt répond : crocs pour tout le monde.' },
  // Assassin
  'assassin-preparation':     { classe: 'assassin', niveauRequis: 5, nom: 'Préparation mortelle', emoji: '🧪', categorie: 'signature', type: 'utilitaire', cible: 'soi', effet: { type: 'benediction', duree: 2 }, coutMp: 6, cooldown: 5, desc: 'Lames huilées, souffle calé : +30 % de dégâts.' },
  'assassin-jugulaire':       { classe: 'assassin', niveauRequis: 10, nom: 'Jugulaire', emoji: '🩸', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'dex', puissance: 9, ratio: 1.35, critBonus: 0.25, coutMp: 9, cooldown: 4, desc: 'Viser là où tout s’arrête.' },
  'assassin-execution':       { classe: 'assassin', niveauRequis: 15, nom: 'Exécution silencieuse', emoji: '🌑', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'dex', puissance: 13, ratio: 1.7, coutMp: 12, cooldown: 6, desc: 'Personne n’a rien vu. Surtout pas la cible.' },
  // Berserker
  'berserker-hurlement':      { classe: 'berserker', niveauRequis: 5, nom: 'Hurlement barbare', emoji: '🗣️', categorie: 'signature', type: 'utilitaire', cible: 'soi', effet: { type: 'benediction', duree: 2 }, coutMp: 5, cooldown: 4, desc: 'Un cri qui fait bouillir le sang : +30 % de dégâts.' },
  'berserker-fracas':         { classe: 'berserker', niveauRequis: 10, nom: 'Fracas tellurique', emoji: '🪓', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'for', puissance: 11, ratio: 1.5, coutMp: 9, cooldown: 4, desc: 'La hache d’abord, les questions jamais.' },
  'berserker-seisme':         { classe: 'berserker', niveauRequis: 15, nom: 'Séisme de rage', emoji: '🌋', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'for', puissance: 9, ratio: 1.2, coutMp: 13, cooldown: 6, desc: 'Quand la rage frappe le sol, le sol se venge sur les autres.' },
  // Templier
  'templier-foi':             { classe: 'templier', niveauRequis: 5, nom: 'Foi inébranlable', emoji: '✝️', categorie: 'signature', type: 'utilitaire', cible: 'soi', effet: { type: 'bouclier', duree: 3, stat: 'for' }, coutMp: 6, cooldown: 4, desc: 'La foi, plus dure que l’acier.' },
  'templier-marteau-saint':   { classe: 'templier', niveauRequis: 10, nom: 'Marteau saint', emoji: '🔨', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'for', puissance: 9, ratio: 1.3, effet: { type: 'etourdi', duree: 1, chance: 0.4 }, coutMp: 9, cooldown: 4, desc: 'Le jugement pèse trois quintaux.' },
  'templier-croisade':        { classe: 'templier', niveauRequis: 15, nom: 'Croisade', emoji: '⚔️', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'for', puissance: 8, ratio: 1.1, coutMp: 13, cooldown: 6, desc: 'Un seul templier, tous les fronts.' },
  // Élémentaliste
  'elementaliste-brume':      { classe: 'elementaliste', niveauRequis: 5, nom: 'Bouclier de brume', emoji: '🌫️', categorie: 'signature', type: 'utilitaire', cible: 'allies', effet: { type: 'bouclier', duree: 2 }, coutMp: 9, cooldown: 5, desc: 'La brume amortit les coups de toute l’équipe.' },
  'elementaliste-lames-de-vent': { classe: 'elementaliste', niveauRequis: 10, nom: 'Lames de vent', emoji: '🌬️', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 6, ratio: 0.95, coups: 2, coutMp: 9, cooldown: 4, desc: 'L’air tranche deux fois, sans prévenir.' },
  'elementaliste-fureur':     { classe: 'elementaliste', niveauRequis: 15, nom: 'Fureur des éléments', emoji: '🌪️', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 10, ratio: 1.25, coutMp: 14, cooldown: 6, desc: 'Feu, glace, foudre et pierre — d’un seul geste.' },
  // Druide
  'druide-peau-d-ecorce':     { classe: 'druide', niveauRequis: 5, nom: 'Peau d’écorce', emoji: '🌳', categorie: 'signature', type: 'utilitaire', cible: 'soi', effet: { type: 'bouclier', duree: 3 }, coutMp: 6, cooldown: 4, desc: 'L’écorce pousse plus vite que les plaies.' },
  'druide-lianes':            { classe: 'druide', niveauRequis: 10, nom: 'Lianes constrictrices', emoji: '🌿', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 8, ratio: 1.2, effet: { type: 'etourdi', duree: 1, chance: 0.4 }, coutMp: 8, cooldown: 4, desc: 'La forêt attrape, serre, et ne s’excuse pas.' },
  'druide-tempete-de-ronces': { classe: 'druide', niveauRequis: 15, nom: 'Tempête de ronces', emoji: '🥀', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 8, ratio: 1.1, effet: { type: 'poison', stat: 'int', duree: 2 }, coutMp: 13, cooldown: 6, desc: 'Des ronces partout. Vraiment partout.' },
  // Invocateur
  'invocateur-serviteur':     { classe: 'invocateur', niveauRequis: 5, nom: 'Serviteur d’éther', emoji: '👻', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 7, ratio: 1.05, coutMp: 6, cooldown: 2, desc: 'Un petit serviteur zélé, à recharge courte.' },
  'invocateur-nuee':          { classe: 'invocateur', niveauRequis: 10, nom: 'Nuée d’esprits', emoji: '🦇', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 7, ratio: 1.0, coutMp: 10, cooldown: 4, desc: 'Le ciel se remplit de choses qui mordent.' },
  'invocateur-leviathan':     { classe: 'invocateur', niveauRequis: 15, nom: 'Léviathan éphémère', emoji: '🐋', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 14, ratio: 1.7, coutMp: 13, cooldown: 6, desc: 'Trois secondes d’existence. Une seule suffit.' },
  // Pyromancien
  'pyromancien-etincelle':    { classe: 'pyromancien', niveauRequis: 5, nom: 'Étincelle vive', emoji: '✨', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 6, ratio: 1.0, coutMp: 4, cooldown: 2, desc: 'Petite flamme, grande habitude.' },
  'pyromancien-lance-ardente': { classe: 'pyromancien', niveauRequis: 10, nom: 'Lance ardente', emoji: '🔥', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 10, ratio: 1.4, coutMp: 9, cooldown: 4, desc: 'Une lance de feu blanc, droit au cœur.' },
  'pyromancien-meteores':     { classe: 'pyromancien', niveauRequis: 15, nom: 'Pluie de météores', emoji: '☄️', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 11, ratio: 1.25, coutMp: 15, cooldown: 6, desc: 'Le ciel tombe. En morceaux. Enflammés.' },
  // Givremage
  'givremage-morsure':        { classe: 'givremage', niveauRequis: 5, nom: 'Morsure du froid', emoji: '❄️', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 7, ratio: 1.05, effet: { type: 'affaibli', duree: 2 }, coutMp: 6, cooldown: 3, desc: 'Le froid engourdit les muscles ennemis.' },
  'givremage-prison':         { classe: 'givremage', niveauRequis: 10, nom: 'Prison de glace', emoji: '🧊', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 6, ratio: 0.9, effet: { type: 'etourdi', duree: 1, chance: 0.6 }, coutMp: 9, cooldown: 5, desc: 'Un cercueil translucide, livré à domicile.' },
  'givremage-ere-glaciaire':  { classe: 'givremage', niveauRequis: 15, nom: 'Ère glaciaire', emoji: '🏔️', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 9, ratio: 1.15, effet: { type: 'affaibli', duree: 2 }, coutMp: 14, cooldown: 6, desc: 'Dix mille ans d’hiver, condensés en un instant.' },
  // Chaman
  'chaman-benediction':       { classe: 'chaman', niveauRequis: 5, nom: 'Bénédiction des esprits', emoji: '🪶', categorie: 'signature', type: 'utilitaire', cible: 'allies', effet: { type: 'regen', duree: 2 }, coutMp: 9, cooldown: 5, desc: 'Les ancêtres veillent : régénération pour l’équipe.' },
  'chaman-foudre-ancestrale': { classe: 'chaman', niveauRequis: 10, nom: 'Foudre ancestrale', emoji: '⚡', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 10, ratio: 1.35, coutMp: 9, cooldown: 4, desc: 'Un éclair vieux de mille ans, toujours vaillant.' },
  'chaman-grand-esprit':      { classe: 'chaman', niveauRequis: 15, nom: 'Grand Esprit', emoji: '🦬', categorie: 'signature', type: 'soin', cible: 'allies', stat: 'int', puissance: 9, ratio: 1.1, coutMp: 14, cooldown: 6, desc: 'Le Grand Esprit se penche sur l’équipe entière.' },
  // Voleur
  'voleur-poche-percee':      { classe: 'voleur', niveauRequis: 5, nom: 'Poche percée', emoji: '🪙', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'dex', puissance: 6, ratio: 1.0, effet: { type: 'vol-or' }, coutMp: 5, cooldown: 3, desc: 'Frapper ET encaisser — littéralement.' },
  'voleur-sournoise':         { classe: 'voleur', niveauRequis: 10, nom: 'Attaque sournoise', emoji: '🗡️', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'dex', puissance: 8, ratio: 1.25, critBonus: 0.2, coutMp: 8, cooldown: 4, desc: 'Par derrière, c’est plus poli — personne ne voit venir.' },
  'voleur-mille-bourses':     { classe: 'voleur', niveauRequis: 15, nom: 'Mille bourses', emoji: '💰', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'dex', puissance: 7, ratio: 1.0, effet: { type: 'vol-or' }, coutMp: 12, cooldown: 5, desc: 'Tout le monde paie. C’est la tournée du voleur.' },
  // Danselame
  'danselame-pas-de-cote':    { classe: 'danselame', niveauRequis: 5, nom: 'Pas de côté', emoji: '🩰', categorie: 'signature', type: 'utilitaire', cible: 'soi', effet: { type: 'bouclier', duree: 2, stat: 'dex' }, coutMp: 5, cooldown: 4, desc: 'Céléritér, c’est danser plus vite que la lame.' },
  'danselame-petales':        { classe: 'danselame', niveauRequis: 10, nom: 'Tourbillon de pétales', emoji: '🌸', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'dex', puissance: 6, ratio: 0.9, coutMp: 9, cooldown: 4, desc: 'Joli de loin. De près, tranchant.' },
  'danselame-derniere-valse': { classe: 'danselame', niveauRequis: 15, nom: 'Dernière valse', emoji: '💃', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'dex', puissance: 7, ratio: 1.0, coups: 3, coutMp: 12, cooldown: 6, desc: 'Trois temps, trois lames, un salut final.' },
  // Aventurier
  'aventurier-systeme-d':     { classe: 'aventurier', niveauRequis: 5, nom: 'Système D', emoji: '🧰', categorie: 'signature', type: 'utilitaire', cible: 'soi', effet: { type: 'mana', valeur: 10 }, coutMp: 0, cooldown: 4, desc: 'On fait avec ce qu’on a — et ça marche.' },
  'aventurier-opportuniste':  { classe: 'aventurier', niveauRequis: 10, nom: 'Coup opportuniste', emoji: '🎯', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'for', puissance: 8, ratio: 1.2, critBonus: 0.15, coutMp: 7, cooldown: 3, desc: 'Frapper exactement quand il ne faut pas — pour l’autre.' },
  'aventurier-grand-numero':  { classe: 'aventurier', niveauRequis: 15, nom: 'Le Grand Numéro', emoji: '🎪', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'for', puissance: 8, ratio: 1.1, coutMp: 12, cooldown: 5, desc: 'Un peu de tout, beaucoup de panache, dégâts pour tous.' },

  // ----- v17 : compétences de BASE de classe (niveau 1) -----
  // Chaque classe possède désormais exactement 8 compétences exclusives :
  // 4 de base (niv. 1), la signature (niv. 1) et l'arbre (niv. 5/10/15).
  // Guerrier
  'guerrier-taillade':        { classe: 'guerrier', niveauRequis: 1, nom: 'Taillade', emoji: '🗡️', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'for', puissance: 6, ratio: 1.2, coutMp: 4, cooldown: 2, desc: 'Le coup d’école des maîtres d’armes : simple, propre, efficace.' },
  'guerrier-coup-de-bouclier': { classe: 'guerrier', niveauRequis: 1, nom: 'Coup de bouclier', emoji: '🛡️', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'for', puissance: 5, ratio: 0.9, effet: { type: 'etourdi', duree: 1, chance: 0.4 }, coutMp: 6, cooldown: 4, desc: 'Le bouclier aussi sait frapper : 40 % de chances d’étourdir.' },
  'guerrier-cri-de-ralliement': { classe: 'guerrier', niveauRequis: 1, nom: 'Cri de ralliement', emoji: '📣', categorie: 'signature', type: 'utilitaire', cible: 'allies', effet: { type: 'benediction', duree: 2 }, coutMp: 8, cooldown: 5, desc: 'Un cri qui redresse les échines : +30 % de dégâts pour tous.' },
  'guerrier-endurance':       { classe: 'guerrier', niveauRequis: 1, nom: 'Endurance du vétéran', emoji: '🏋️', categorie: 'signature', type: 'soin', cible: 'soi', stat: 'vit', puissance: 6, ratio: 1.2, coutMp: 4, cooldown: 4, desc: 'Serrer les dents, souffler, repartir.' },
  // Mage
  'mage-trait-arcanique':     { classe: 'mage', niveauRequis: 1, nom: 'Trait arcanique', emoji: '✨', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 5, ratio: 1.1, coutMp: 3, cooldown: 0, desc: 'Le b.a.-ba du mage : un trait de mana pur, à volonté.' },
  'mage-explosion-runique':   { classe: 'mage', niveauRequis: 1, nom: 'Explosion runique', emoji: '💥', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 4, ratio: 0.85, coutMp: 8, cooldown: 3, desc: 'Une rune tracée, un mot, et tout le monde recule.' },
  'mage-barriere':            { classe: 'mage', niveauRequis: 1, nom: 'Barrière arcanique', emoji: '🔷', categorie: 'signature', type: 'utilitaire', cible: 'allie', stat: 'int', effet: { type: 'bouclier', duree: 3 }, coutMp: 6, cooldown: 4, desc: 'Un mur de mana entre un allié et les ennuis.' },
  'mage-siphon-de-mana':      { classe: 'mage', niveauRequis: 1, nom: 'Siphon de mana', emoji: '🌀', categorie: 'signature', type: 'utilitaire', cible: 'soi', effet: { type: 'mana', valeur: 8 }, coutMp: 0, cooldown: 3, desc: 'Aspirer le mana ambiant, comme on reprend son souffle.' },
  // Archer
  'archer-fleche-perforante': { classe: 'archer', niveauRequis: 1, nom: 'Flèche perforante', emoji: '🏹', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'dex', puissance: 7, ratio: 1.3, critBonus: 0.15, coutMp: 4, cooldown: 2, desc: 'Une flèche qui ne demande pas la permission aux armures.' },
  'archer-tir-double':        { classe: 'archer', niveauRequis: 1, nom: 'Tir double', emoji: '🎯', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'dex', puissance: 3, ratio: 0.7, coups: 2, coutMp: 6, cooldown: 3, desc: 'Deux flèches, un seul geste.' },
  'archer-fleche-trempee':    { classe: 'archer', niveauRequis: 1, nom: 'Flèche trempée', emoji: '🧪', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'dex', puissance: 4, ratio: 0.9, effet: { type: 'poison', duree: 2 }, coutMp: 6, cooldown: 3, desc: 'La pointe a mariné toute la nuit. La cible s’en souviendra.' },
  'archer-oeil-de-lynx':      { classe: 'archer', niveauRequis: 1, nom: 'Œil de lynx', emoji: '👁️', categorie: 'signature', type: 'utilitaire', cible: 'soi', effet: { type: 'benediction', duree: 2 }, coutMp: 5, cooldown: 5, desc: 'Le monde ralentit, la cible grossit : +30 % de dégâts.' },
  // Clerc
  'clerc-mot-de-soin':        { classe: 'clerc', niveauRequis: 1, nom: 'Mot de soin', emoji: '💞', categorie: 'signature', type: 'soin', cible: 'allie', stat: 'int', puissance: 8, ratio: 1.3, coutMp: 4, cooldown: 2, desc: 'Un seul mot, bien choisi — et la plaie se referme.' },
  'clerc-eclat-sacre':        { classe: 'clerc', niveauRequis: 1, nom: 'Éclat sacré', emoji: '🌟', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 6, ratio: 1.1, coutMp: 5, cooldown: 2, desc: 'La lumière n’est pas toujours douce.' },
  'clerc-priere-protection':  { classe: 'clerc', niveauRequis: 1, nom: 'Prière de protection', emoji: '🙏', categorie: 'signature', type: 'utilitaire', cible: 'allie', stat: 'int', effet: { type: 'bouclier', duree: 3 }, coutMp: 6, cooldown: 4, desc: 'Une prière murmurée qui pèse comme un bouclier.' },
  'clerc-souffle-vital':      { classe: 'clerc', niveauRequis: 1, nom: 'Souffle vital', emoji: '🍃', categorie: 'signature', type: 'utilitaire', cible: 'allie', stat: 'int', effet: { type: 'regen', duree: 3 }, coutMp: 6, cooldown: 4, desc: 'La vie revient par petites vagues, trois tours durant.' },
  // Templier (complète ses voies)
  'templier-garde-sacree':    { classe: 'templier', niveauRequis: 1, nom: 'Garde sacrée', emoji: '⛨', categorie: 'signature', type: 'utilitaire', cible: 'soi', effet: { type: 'provocation', duree: 2 }, coutMp: 4, cooldown: 4, desc: 'Tous les coups pour lui — c’est exactement le plan.' },
  'templier-lame-de-lumiere': { classe: 'templier', niveauRequis: 1, nom: 'Lame de lumière', emoji: '🌅', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'for', puissance: 7, ratio: 1.2, coutMp: 5, cooldown: 2, desc: 'L’acier béni tranche plus droit.' },
  'templier-serment-protecteur': { classe: 'templier', niveauRequis: 1, nom: 'Serment protecteur', emoji: '📜', categorie: 'signature', type: 'utilitaire', cible: 'allie', stat: 'for', effet: { type: 'bouclier', duree: 3, stat: 'for' }, coutMp: 6, cooldown: 4, desc: 'Un serment gravé dans le fer, offert à un allié.' },
  // Aventurier
  'aventurier-coup-improvise': { classe: 'aventurier', niveauRequis: 1, nom: 'Coup improvisé', emoji: '🪵', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'for', puissance: 6, ratio: 1.1, coutMp: 4, cooldown: 2, desc: 'Une chaise, un tabouret, un coude — tout fait arme.' },
  'aventurier-botte-secrete': { classe: 'aventurier', niveauRequis: 1, nom: 'Botte secrète', emoji: '🤺', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'dex', puissance: 6, ratio: 1.1, critBonus: 0.2, coutMp: 5, cooldown: 3, desc: 'Apprise dans une taverne, jamais oubliée.' },
  'aventurier-trousse-de-secours': { classe: 'aventurier', niveauRequis: 1, nom: 'Trousse de secours', emoji: '🩹', categorie: 'signature', type: 'soin', cible: 'allie', stat: 'vit', puissance: 8, ratio: 1.2, coutMp: 5, cooldown: 4, desc: 'Bandages, aiguille, gnôle : la médecine du terrain.' },
  'aventurier-poudre-d-escampette': { classe: 'aventurier', niveauRequis: 1, nom: 'Poudre d’escampette', emoji: '💨', categorie: 'signature', type: 'utilitaire', cible: 'soi', effet: { type: 'bouclier', duree: 2 }, coutMp: 4, cooldown: 4, desc: 'Un nuage de poussière, et les coups passent à côté.' },
  // Compléments (1 base pour les classes à 3 voies)
  'barde-note-percante':      { classe: 'barde', niveauRequis: 1, nom: 'Note perçante', emoji: '🎶', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 6, ratio: 1.1, coutMp: 5, cooldown: 2, desc: 'Un contre-ut qui fait saigner les oreilles.' },
  'rodeur-fleche-traqueuse':  { classe: 'rodeur', niveauRequis: 1, nom: 'Flèche traqueuse', emoji: '🪶', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'dex', puissance: 6, ratio: 1.15, critBonus: 0.15, coutMp: 5, cooldown: 2, desc: 'Elle suit la proie comme un chien de chasse.' },
  'assassin-lame-vive':       { classe: 'assassin', niveauRequis: 1, nom: 'Lame vive', emoji: '🔪', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'dex', puissance: 4, ratio: 0.9, coutMp: 4, cooldown: 0, desc: 'Vite sortie, vite rentrée — personne n’a rien vu.' },
  'berserker-defi-sauvage':   { classe: 'berserker', niveauRequis: 1, nom: 'Défi sauvage', emoji: '🗯️', categorie: 'signature', type: 'utilitaire', cible: 'soi', effet: { type: 'provocation', duree: 2 }, coutMp: 4, cooldown: 4, desc: '« Par ici, les ennuis ! » — et les ennuis obéissent.' },
  'elementaliste-etincelle':  { classe: 'elementaliste', niveauRequis: 1, nom: 'Étincelle élémentaire', emoji: '⚡', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 5, ratio: 1.0, coutMp: 4, cooldown: 0, desc: 'Un peu de feu, un peu de foudre — à volonté.' },
  'druide-rosee-vivifiante':  { classe: 'druide', niveauRequis: 1, nom: 'Rosée vivifiante', emoji: '💧', categorie: 'signature', type: 'soin', cible: 'allie', stat: 'int', puissance: 8, ratio: 1.3, coutMp: 5, cooldown: 2, desc: 'La forêt soigne les siens à l’aube.' },
  'invocateur-etreinte-d-ether': { classe: 'invocateur', niveauRequis: 1, nom: 'Étreinte d’éther', emoji: '🫧', categorie: 'signature', type: 'utilitaire', cible: 'soi', effet: { type: 'mana', valeur: 8 }, coutMp: 0, cooldown: 3, desc: 'Puiser dans l’éther le mana des prochains liens.' },
  'pyromancien-onde-de-chaleur': { classe: 'pyromancien', niveauRequis: 1, nom: 'Onde de chaleur', emoji: '🌡️', categorie: 'signature', type: 'utilitaire', cible: 'soi', effet: { type: 'benediction', duree: 2 }, coutMp: 5, cooldown: 5, desc: 'L’air tremble autour du pyromancien : +30 % de dégâts.' },
  'givremage-eclat-de-givre': { classe: 'givremage', niveauRequis: 1, nom: 'Éclat de givre', emoji: '🌨️', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 4, ratio: 0.9, coutMp: 3, cooldown: 0, desc: 'Un éclat froid, lancé sans y penser.' },
  'voleur-lancer-de-couteau': { classe: 'voleur', niveauRequis: 1, nom: 'Lancer de couteau', emoji: '🗡️', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'dex', puissance: 5, ratio: 1.0, critBonus: 0.1, coutMp: 4, cooldown: 0, desc: 'Il en a toujours un de plus dans la manche.' },
  'danselame-arabesque':      { classe: 'danselame', niveauRequis: 1, nom: 'Arabesque', emoji: '🩰', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'dex', puissance: 5, ratio: 1.0, coutMp: 4, cooldown: 2, desc: 'Un pas tourné, une lame tendue — le duel devient danse.' },
};
Object.assign(COMPETENCES, COMPETENCES_CLASSE);

// ---------------------------------------------------------------------
// v17 : les « Voies » (Paladin, Nécromancien, Moine…) quittent le pool
// commun : elles deviennent des compétences DE CLASSE exclusives, apprises
// dès le niveau 1 par leur classe. Le pool commun (Arcanium, création,
// montées de niveau) ne garde que les vraies bases universelles — fini le
// mélange entre compétences de classe et compétences de tout le monde.
// ---------------------------------------------------------------------
const VOIES_CLASSES = {
  paladin: ['chatiment-sacre', 'jugement', 'aura-protection', 'imposition-mains'],
  necromancien: ['faux-spectrale', 'peste', 'terreur', 'pacte-sombre'],
  moine: ['rafale-de-coups', 'paume-zephyr', 'meditation-profonde', 'poing-dragon'],
  barde: ['chant-heroique', 'melodie-apaisante', 'fausse-note'],
  rodeur: ['morsure-du-loup', 'ronces-etrangleuses', 'instinct-sauvage'],
  assassin: ['lame-dans-l-ombre', 'voile-de-fumee', 'mise-a-mort'],
  berserker: ['dechainement', 'cri-de-guerre', 'fureur-sanglante'],
  templier: ['verdict-de-fer'],
  elementaliste: ['orage-elementaire', 'lance-de-glace', 'bouclier-de-lave'],
  druide: ['griffes-d-ours', 'essaim-piqueur', 'seve-regeneratrice'],
  invocateur: ['familier-flamboyant', 'horde-spectrale', 'pacte-du-golem'],
  pyromancien: ['deflagration', 'mur-de-flammes', 'combustion'],
  givremage: ['fleche-de-givre', 'blizzard', 'armure-de-glace'],
  chaman: ['totem-tonnerre', 'chaine-d-eclairs', 'totem-gardien', 'esprits-ancetres'],
  voleur: ['vol-a-la-tire', 'coup-bas', 'poussiere-aveuglante'],
  danselame: ['valse-des-lames', 'estocade-gracieuse', 'danse-du-vent'],
};
Object.entries(VOIES_CLASSES).forEach(([classe, ids]) => {
  ids.forEach((id) => {
    if (COMPETENCES[id]) Object.assign(COMPETENCES[id], { classe, niveauRequis: 1 });
  });
});

const CLASSES = {
  aventurier: { nom: 'Aventurier', emoji: '🎒', signature: 'signature-panache' },
};
MODELES.forEach((m) => {
  CLASSES[m.id] = {
    nom: m.nom,
    emoji: m.emoji,
    signature: Object.keys(COMPETENCES_SIGNATURE).find((id) => COMPETENCES_SIGNATURE[id].classe === m.id),
  };
});

function classeDe(p) {
  return CLASSES[p.classe] || CLASSES.aventurier;
}

// =====================================================================
// Points de maîtrise : un par palier de niveau atteint, à investir dans
// les compétences de classe (chaque rang : +15 % de puissance, rang 5 max).
//
// v22 — CE QUI N'ALLAIT PAS. Les paliers montaient jusqu'au niveau 100
// depuis la v19, mais TOUS les écrans du jeu annonçaient encore « niveaux
// 3, 6, 9, 12, 15 et 18 » — la liste de la v8, six points, écrite à la
// main. Un joueur qui recevait un point au niveau 22 puis au 26 avait
// raison de trouver le jeu incohérent : la règle affichée s'arrêtait au 18.
//
// La cadence est désormais la SOURCE : la liste des paliers en découle, et
// la phrase affichée aussi. Les trois ne peuvent plus se contredire.
// =====================================================================
const CADENCE_MAITRISE = [
  { jusqu: 18, tousLes: 3 },   // le début : un point tous les 3 niveaux
  { jusqu: 50, tousLes: 4 },   // puis tous les 4
  { jusqu: 100, tousLes: 5 },  // et tous les 5 jusqu'au bout de la route
];

const SEUILS_MAITRISE = (() => {
  const seuils = [];
  let precedent = 0;
  CADENCE_MAITRISE.forEach((tranche) => {
    for (let n = precedent + tranche.tousLes; n <= tranche.jusqu; n += tranche.tousLes) seuils.push(n);
    precedent = seuils.length ? seuils[seuils.length - 1] : precedent;
  });
  return seuils;
})();

const RANG_SIGNATURE_MAX = 5;

// Combien de points la carrière entière rapporte, et ce qu'on peut en
// faire : deux chiffres que le joueur doit pouvoir lire, pas deviner.
const TOTAL_POINTS_MAITRISE = SEUILS_MAITRISE.length;
const COMPETENCES_MAITRISABLES = Math.floor(TOTAL_POINTS_MAITRISE / RANG_SIGNATURE_MAX);

function pointsMaitrisePourNiveau(niveau) {
  return SEUILS_MAITRISE.filter((seuil) => niveau >= seuil).length;
}

// Le prochain palier après `niveau`, ou null quand il n'y en a plus.
function prochainSeuilMaitrise(niveau) {
  return SEUILS_MAITRISE.find((seuil) => seuil > niveau) || null;
}

// La phrase qui décrit la cadence — produite à partir de la cadence
// elle-même, jamais recopiée à la main.
function texteCadenceMaitrise() {
  const morceaux = CADENCE_MAITRISE.map((tranche, i) => {
    const debut = i === 0 ? '' : 'puis ';
    return `${debut}tous les ${tranche.tousLes} niveaux jusqu’au ${tranche.jusqu}`;
  });
  return morceaux.join(', ');
}

// Et le compte complet, pour que personne n'ait à le refaire de tête.
function texteBudgetMaitrise() {
  return `${texteCadenceMaitrise()} — soit ${TOTAL_POINTS_MAITRISE} points sur toute la carrière, `
    + `de quoi porter ${COMPETENCES_MAITRISABLES} de vos 8 compétences de classe au rang ${RANG_SIGNATURE_MAX}. À vous de choisir lesquelles.`;
}

function rangDe(p, compId) {
  return (p.rangs && p.rangs[compId]) || 0;
}
