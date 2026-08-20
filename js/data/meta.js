'use strict';

// =====================================================================
// Méta-progression : familiers, hauts faits, contrats de guilde, difficultés
// =====================================================================

// =====================================================================
// Familiers : compagnons à bonus passif, gagnés sur les boss et la Tour
// =====================================================================
const FAMILIERS = {
  'louveteau':        { nom: 'Louveteau', emoji: '🐺', bonus: { for: 2 }, desc: '+2 Force', source: 'loupAlpha' },
  'mygale-soyeuse':   { nom: 'Mygale soyeuse', emoji: '🕷️', bonus: { dex: 2 }, desc: '+2 Dextérité', source: 'araigneeMatriarche' },
  'gobelin-mascotte': { nom: 'Gobelin mascotte', emoji: '👺', bonus: { poBonus: 0.1 }, desc: '+10 % d’or gagné', source: 'chefOrc' },
  'bebe-hydre':       { nom: 'Bébé hydre', emoji: '🐉', bonus: { int: 2 }, desc: '+2 Intelligence', source: 'hydreBrumes' },
  'chauve-souris':    { nom: 'Chauve-souris royale', emoji: '🦇', bonus: { crit: 3 }, desc: '+3 % critique', source: 'roiDechu' },
  'scarabee-dore':    { nom: 'Scarabée doré', emoji: '🪲', bonus: { cha: 3 }, desc: '+3 Chance', source: 'verDesSables' },
  'renardeau-polaire': { nom: 'Renardeau polaire', emoji: '🦊', bonus: { vit: 2 }, desc: '+2 Vitalité', source: 'elementaireAncien' },
  'dragonnet':        { nom: 'Dragonnet', emoji: '🐲', bonus: { for: 2, int: 2 }, desc: '+2 Force, +2 Intelligence', source: 'gardienEternel' },
  'feu-follet':       { nom: 'Feu follet', emoji: '✨', bonus: { xpBonus: 0.05 }, desc: '+5 % d’XP gagnée', source: 'tour-5' },
  'golem-de-poche':   { nom: 'Golem de poche', emoji: '🗿', bonus: { pvMax: 25 }, desc: '+25 PV max', source: 'tour-10' },
  'chaton-celeste':   { nom: 'Chaton céleste', emoji: '🐱', bonus: { cha: 2, crit: 2 }, desc: '+2 Chance, +2 % critique', source: 'tour-15' },
  'phenix-miniature': { nom: 'Phénix miniature', emoji: '🐦‍🔥', bonus: { xpBonus: 0.05, poBonus: 0.05 }, desc: '+5 % XP et or', source: 'tour-20' },
  'salamandre-de-forge': { nom: 'Salamandre de forge', emoji: '🦎', bonus: { for: 2, cha: 2 }, desc: '+2 Force, +2 Chance', source: 'donjon-volcan' },
  // v28 — Le chenil s'agrandit : chaque grande histoire et chaque sommet
  // laisse désormais son compagnon, et chacun apporte un vrai bonus.
  'poussin-de-rokh':  { nom: 'Poussin de rokh', emoji: '🐦', bonus: { dex: 2, celerite: 2 }, desc: '+2 Dextérité, +2 % célérité', source: 'rokhTempetueux' },
  'coralline':        { nom: 'Coralline', emoji: '🪸', bonus: { esp: 3 }, desc: '+3 Esprit', source: 'leviathanCorallien' },
  'echo-du-neant':    { nom: 'Écho du Néant', emoji: '🌌', bonus: { deter: 3 }, desc: '+3 % détermination', source: 'devoreurMondes' },
  'ondin-de-poche':   { nom: 'Ondin de poche', emoji: '🫧', bonus: { esp: 2, pmMax: 15 }, desc: '+2 Esprit, +15 PM max', source: 'donjon-sanctuaire' },
  'griffonneau-celeste': { nom: 'Griffonneau céleste', emoji: '🦅', bonus: { crit: 2, celerite: 2 }, desc: '+2 % critique, +2 % célérité', source: 'donjon-couronne-celeste' },
  'ombre-apprivoisee': { nom: 'Ombre apprivoisée', emoji: '🕳️', bonus: { int: 2, crit: 2 }, desc: '+2 Intelligence, +2 % critique', source: 'donjon-nihelm' },
  'sablier-eveille':  { nom: 'Sablier éveillé', emoji: '⏳', bonus: { celerite: 4 }, desc: '+4 % célérité', source: 'donjon-temps-brise' },
  'lueur-de-fin':     { nom: 'Lueur de fin', emoji: '🕯️', bonus: { xpBonus: 0.03, poBonus: 0.03 }, desc: '+3 % XP et or', source: 'donjon-neant' },
  'carpe-lunaire':    { nom: 'Carpe lunaire', emoji: '🐟', bonus: { piete: 4 }, desc: '+4 % piété', source: 'tour-25' },
  'hibou-des-sommets': { nom: 'Hibou des sommets', emoji: '🦉', bonus: { xpBonus: 0.07 }, desc: '+7 % d’XP gagnée', source: 'tour-30' },
};

// Familier obtenu par palier de la Tour Sans Fin (première ascension).
const FAMILIERS_TOUR = {
  5: 'feu-follet', 10: 'golem-de-poche', 15: 'chaton-celeste', 20: 'phenix-miniature',
  25: 'carpe-lunaire', 30: 'hibou-des-sommets',
};

function familierActif(p) {
  return p.familier ? FAMILIERS[p.familier] : null;
}

// =====================================================================
// Hauts faits : chacun débloque un titre affichable.
//
// v28 — Certains titres portent désormais un BONUS, appliqué uniquement
// quand le titre est PORTÉ (un seul à la fois, depuis la fiche du héros) :
//   • caractéristiques et sous-caractéristiques → statsEffectives ;
//   • xpBonus → xpReelle · poBonus → multiplicateurOr ;
//   • degatsBonus → infligerDegats · soinsBonus → soigner.
// Porter un titre redevient un choix, pas seulement une coquetterie.
// =====================================================================
function titreActifDe(p) {
  return p && p.titre ? HAUTS_FAITS.find((h) => h.id === p.titre) || null : null;
}

function bonusTitre(p, cle) {
  const titre = titreActifDe(p);
  return (titre && titre.bonus && titre.bonus[cle]) || 0;
}

// Libellé lisible du bonus d'un titre, pour la fiche du héros et le codex.
function texteBonusTitre(bonus) {
  return Object.entries(bonus || {}).map(([cle, valeur]) => {
    if (cle === 'xpBonus') return `+${Math.round(valeur * 100)} % XP`;
    if (cle === 'poBonus') return `+${Math.round(valeur * 100)} % or`;
    if (cle === 'degatsBonus') return `+${Math.round(valeur * 100)} % dégâts`;
    if (cle === 'soinsBonus') return `+${Math.round(valeur * 100)} % soins`;
    if (typeof CARACS !== 'undefined' && CARACS[cle]) return `+${valeur} ${CARACS[cle].nom}`;
    if (typeof SOUS_CARACS !== 'undefined' && SOUS_CARACS[cle]) return `+${valeur} % ${SOUS_CARACS[cle].nom.toLowerCase()}`;
    if (cle === 'pvMax') return `+${valeur} PV max`;
    if (cle === 'pmMax') return `+${valeur} PM max`;
    return `+${valeur} ${cle}`;
  }).join(', ');
}
const HAUTS_FAITS = [
  { id: 'niveau-5',    nom: 'Apprenti héros', emoji: '🌱', titre: 'l’Apprenti', desc: 'Atteindre le niveau 5', cond: (p) => p.niveau >= 5 },
  { id: 'niveau-10',   nom: 'Aventurier confirmé', emoji: '⚔️', titre: 'le Vétéran', desc: 'Atteindre le niveau 10', cond: (p) => p.niveau >= 10 },
  { id: 'niveau-15',   nom: 'Héros des royaumes', emoji: '🛡️', titre: 'le Champion', desc: 'Atteindre le niveau 15', cond: (p) => p.niveau >= 15 },
  { id: 'niveau-20',   nom: 'Légende vivante', emoji: '👑', titre: 'la Légende', desc: 'Atteindre le niveau 20', cond: (p) => p.niveau >= 20 },
  { id: 'monstres-50', nom: 'Chasseur', emoji: '🏹', titre: 'le Chasseur', desc: 'Vaincre 50 monstres', cond: (p) => p.compteurs.monstres >= 50 },
  { id: 'monstres-250', nom: 'Fléau des monstres', emoji: '💀', titre: 'le Fléau', desc: 'Vaincre 250 monstres', cond: (p) => p.compteurs.monstres >= 250 },
  { id: 'boss-1',      nom: 'Tueur de boss', emoji: '👑', titre: 'Tueur de Boss', desc: 'Vaincre un boss de zone', cond: (p) => p.bossVaincus.length >= 1 },
  { id: 'boss-8',      nom: 'Vainqueur des huit', emoji: '🌍', titre: 'des Huit Royaumes', desc: 'Vaincre les 8 boss de zone', cond: (p) => p.bossVaincus.length >= 8 },
  { id: 'or-1000',     nom: 'Bourse bien garnie', emoji: '💰', titre: 'aux Poches d’Or', desc: 'Amasser 1 000 po au total', cond: (p) => p.compteurs.orTotal >= 1000 },
  { id: 'or-10000',    nom: 'Fortune de Valciel', emoji: '🏦', titre: 'le Crésus', desc: 'Amasser 10 000 po au total', cond: (p) => p.compteurs.orTotal >= 10000 },
  { id: 'craft-10',    nom: 'Artisan', emoji: '⚒️', titre: 'l’Artisan', desc: 'Fabriquer 10 objets', cond: (p) => p.compteurs.crafts >= 10 },
  { id: 'craft-50',    nom: 'Maître forgeron', emoji: '🔨', titre: 'le Forgeron', desc: 'Fabriquer 50 objets', cond: (p) => p.compteurs.crafts >= 50 },
  { id: 'quetes-10',   nom: 'Contractuel', emoji: '📜', titre: 'de la Guilde', desc: 'Remplir 10 contrats de guilde', cond: (p) => p.compteurs.quetes >= 10 },
  { id: 'quetes-50',   nom: 'Pilier de guilde', emoji: '🏰', titre: 'Pilier de Guilde', desc: 'Remplir 50 contrats de guilde', cond: (p) => p.compteurs.quetes >= 50 },
  { id: 'legendaire-1', nom: 'Toucheur de légende', emoji: '🌟', titre: 'le Fortuné', desc: 'Obtenir un objet légendaire (ou mieux)', cond: (p) => p.compteurs.legendaires >= 1 },
  { id: 'divin-1',     nom: 'Élu des dieux', emoji: '⚡', titre: 'l’Élu', desc: 'Obtenir un objet divin', cond: (p) => p.compteurs.divins >= 1 },
  { id: 'tour-5',      nom: 'Grimpeur', emoji: '🗼', titre: 'du Cinquième Étage', desc: 'Atteindre l’étage 5 de la Tour', cond: (p) => p.tourMax >= 5 },
  { id: 'tour-10',     nom: 'Conquérant des hauteurs', emoji: '🪜', titre: 'des Hauteurs', desc: 'Atteindre l’étage 10 de la Tour', cond: (p) => p.tourMax >= 10 },
  { id: 'tour-20',     nom: 'Sommet du monde', emoji: '🏔️', titre: 'du Sommet', desc: 'Atteindre l’étage 20 de la Tour', cond: (p) => p.tourMax >= 20 },
  { id: 'familiers-3', nom: 'Meneur de meute', emoji: '🐾', titre: 'le Dresseur', desc: 'Adopter 3 familiers', cond: (p) => p.familiers.length >= 3 },
  { id: 'donjon-crypte',      nom: 'Paix au Roi Oublié', emoji: '🏛️', titre: 'le Libérateur', desc: 'Terminer « La Crypte du Roi Oublié »', cond: (p) => donjonFini(p, 'crypte') },
  { id: 'donjon-laboratoire', nom: 'Fin de l’expérience', emoji: '🧪', titre: 'l’Alchimiste', desc: 'Terminer « Le Laboratoire de Frivole »', cond: (p) => donjonFini(p, 'laboratoire') },
  { id: 'donjon-brise-brume', nom: 'Brumes dissipées', emoji: '⛵', titre: 'des Brumes', desc: 'Terminer « Le Brise-Brume »', cond: (p) => donjonFini(p, 'brise-brume') },
  { id: 'donjon-volcan',      nom: 'Cœur du Volcan', emoji: '🌋', titre: 'Forgé au Feu', desc: 'Terminer « Le Cœur du Volcan »', cond: (p) => donjonFini(p, 'volcan') },
  { id: 'donjons-tous',       nom: 'Toutes les histoires', emoji: '📖', titre: 'le Chroniqueur', desc: 'Terminer les 4 donjons fondateurs', cond: (p) => ['crypte', 'laboratoire', 'brise-brume', 'volcan'].every((id) => donjonFini(p, id)) },
  { id: 'donjon-sanctuaire',  nom: 'Marées apaisées', emoji: '🌊', titre: 'des Marées', desc: 'Terminer « Le Sanctuaire des Marées »', cond: (p) => donjonFini(p, 'sanctuaire') },
  { id: 'donjon-couronne',    nom: 'Porteur de la Couronne', emoji: '👑', titre: 'Céleste', desc: 'Terminer « La Couronne Céleste »', cond: (p) => donjonFini(p, 'couronne-celeste') },
  { id: 'donjon-nihelm',      nom: 'Fossoyeur d’ombres', emoji: '🕳️', titre: 'de Nihelm', desc: 'Terminer le défi 50 « Le Gouffre de Nihelm »', cond: (p) => donjonFini(p, 'nihelm') },
  { id: 'donjon-temps-brise', nom: 'Maître des heures', emoji: '⏰', titre: 'Hors du Temps', desc: 'Terminer le défi 60 « La Forteresse du Temps Brisé »', cond: (p) => donjonFini(p, 'temps-brise') },
  { id: 'donjon-neant',       nom: 'Face au Néant', emoji: '👁️', titre: 'Fin des Histoires', desc: 'Terminer le défi 70 « L’Œil du Néant »', cond: (p) => donjonFini(p, 'neant') },
  { id: 'chroniques-5',       nom: 'Conteur des terres', emoji: '📜', titre: 'le Conteur', desc: 'Terminer 5 Chroniques des terres', cond: (p) => DONJONS.filter((d) => d.chronique && donjonFini(p, d.id)).length >= 5 },
  // Ce haut fait s'appelait « les 16 Chroniques » — il y en a 26 depuis
  // les Marches Fêlées, et il se décrochait donc aux deux tiers du
  // chemin en annonçant la fin. Il redevient ce qu'il est : un palier.
  // La complétion, elle, a désormais son propre haut fait, compté sur
  // le nombre RÉEL de Chroniques : ajouter une carte au monde ajoutera
  // sa Chronique au décompte sans qu'il faille y repenser.
  { id: 'chroniques-16',      nom: 'Mémoire des Royaumes', emoji: '📚', titre: 'Mémoire Vivante', desc: 'Terminer 16 Chroniques des terres', cond: (p) => DONJONS.filter((d) => d.chronique && donjonFini(p, d.id)).length >= 16 },
  { id: 'chroniques-toutes',  nom: 'Toutes les terres racontées', emoji: '🗺️', titre: 'le Grand Chroniqueur', desc: 'Terminer la Chronique de chaque carte du monde', cond: (p) => DONJONS.filter((d) => d.chronique).every((d) => donjonFini(p, d.id)) },
  { id: 'ascension-10',       nom: 'Dix étages plus haut', emoji: '⛰️', titre: 'l’Ascensionniste', desc: 'Atteindre l’étage 10 d’une Ascension éternelle', cond: (p) => p.ascensions && Object.values(p.ascensions).some((e) => e >= 10) },
  { id: 'tour-boss-8',        nom: 'Fléau des seigneurs', emoji: '🏯', titre: 'Tueur de Rois', desc: 'Atteindre l’étage 8 de la Tour des Boss', cond: (p) => p.tourBoss && Math.max(p.tourBoss.normal, p.tourBoss.heroique, p.tourBoss.cauchemar) >= 8 },
  { id: 'niveau-35',          nom: 'Au-delà des Royaumes', emoji: '🌅', titre: 'des Terres lointaines', desc: 'Atteindre le niveau 35', cond: (p) => p.niveau >= 35 },
  { id: 'niveau-50',          nom: 'Sommet du possible', emoji: '🌟', titre: 'l’Éternel', desc: 'Atteindre le niveau 50', cond: (p) => p.niveau >= 50 },
  // v28 — La route continue après le 50 : les grands jalons de la fin de
  // partie ont leurs titres, et les plus durs portent un bonus.
  { id: 'niveau-60',   nom: 'Aux portes de l’Éveil', emoji: '🗝️', titre: 'des Hautes Marches', desc: 'Atteindre le niveau 60', cond: (p) => p.niveau >= 60 },
  { id: 'niveau-80',   nom: 'L’Éveil accompli', emoji: '🔮', titre: 'l’Éveillé', desc: 'Atteindre le niveau 80', cond: (p) => p.niveau >= 80 },
  { id: 'niveau-100',  nom: 'Au bout des cent', emoji: '💯', titre: 'Centenaire de Valciel', desc: 'Atteindre le niveau 100', cond: (p) => p.niveau >= 100,
    bonus: { for: 2, dex: 2, int: 2, esp: 2, vit: 2, cha: 2 } },
  { id: 'monstres-1000', nom: 'Fléau des mille crocs', emoji: '⚔️', titre: 'le Purgateur', desc: 'Vaincre 1 000 monstres', cond: (p) => p.compteurs.monstres >= 1000,
    bonus: { degatsBonus: 0.03 } },
  { id: 'or-100000',   nom: 'Trésor vivant', emoji: '👑', titre: 'le Magnat', desc: 'Amasser 100 000 po au total', cond: (p) => p.compteurs.orTotal >= 100000,
    bonus: { poBonus: 0.05 } },
  { id: 'quetes-200',  nom: 'Âme de la Guilde', emoji: '🏛️', titre: 'Main de la Guilde', desc: 'Remplir 200 contrats de guilde', cond: (p) => p.compteurs.quetes >= 200,
    bonus: { xpBonus: 0.03 } },
  { id: 'craft-200',   nom: 'Main de maître', emoji: '🛠️', titre: 'le Grand Artisan', desc: 'Fabriquer 200 objets', cond: (p) => p.compteurs.crafts >= 200,
    bonus: { cha: 3 } },
  { id: 'familiers-8', nom: 'Grand cortège', emoji: '🐾', titre: 'le Meneur de Meute', desc: 'Adopter 8 familiers', cond: (p) => p.familiers.length >= 8,
    bonus: { vit: 3 } },
  { id: 'ascension-50', nom: 'Au-delà des échos', emoji: '⛰️', titre: 'l’Infatigable', desc: 'Atteindre l’étage 50 d’une Ascension éternelle', cond: (p) => p.ascensions && Object.values(p.ascensions).some((e) => e >= 50),
    bonus: { crit: 2 } },
  { id: 'tour-40',     nom: 'Plus haut que le ciel', emoji: '🌤️', titre: 'des Nuées', desc: 'Atteindre l’étage 40 de la Tour', cond: (p) => p.tourMax >= 40 },
  { id: 'soigneur-devoue', nom: 'Cœur immense', emoji: '💞', titre: 'la Bonne Étoile', desc: 'Prodiguer 50 000 points de soin', cond: (p) => (p.compteurs.soinsProdigues || 0) >= 50000,
    bonus: { soinsBonus: 0.03 } },
];

function donjonFini(p, idDonjon) {
  return !!(p.donjons && p.donjons[idDonjon] && p.donjons[idDonjon].fini > 0);
}

// =====================================================================
// Contrats de guilde : 3 quêtes journalières tirées par date
// =====================================================================
const MODELES_QUETES = [
  { type: 'monstres',    emoji: '⚔️', min: 6, max: 14, texte: (n) => `Vaincre ${n} monstres` },
  { type: 'recolte',     emoji: '🌿', min: 2, max: 4,  texte: (n) => `Récolter ${n} fois dans les zones` },
  { type: 'boss',        emoji: '👑', min: 1, max: 1,  texte: () => 'Vaincre un boss de zone' },
  { type: 'craft',       emoji: '⚒️', min: 2, max: 3,  texte: (n) => `Fabriquer ${n} objets à l’atelier` },
  { type: 'exploration', emoji: '🗺️', min: 4, max: 8,  texte: (n) => `Explorer ${n} fois` },
  { type: 'tour',        emoji: '🗼', min: 2, max: 4,  texte: (n) => `Gravir ${n} étages de la Tour`, niveauMin: 3 },
  { type: 'donjon',      emoji: '📖', min: 1, max: 1,  texte: () => 'Terminer un donjon d’histoire', niveauMin: 4 },
  { type: 'tourBoss',    emoji: '🏯', min: 1, max: 3,  texte: (n) => `Vaincre ${n} étage${n > 1 ? 's' : ''} de la Tour des Boss`, niveauMin: 10 },
  { type: 'monstres',    emoji: '💀', min: 18, max: 30, texte: (n) => `Purger les Royaumes : ${n} monstres` },
  { type: 'recolte',     emoji: '🧺', min: 5, max: 8,  texte: (n) => `Grande cueillette : récolter ${n} fois` },
  { type: 'craft',       emoji: '🏭', min: 4, max: 6,  texte: (n) => `Production en série : fabriquer ${n} objets`, niveauMin: 6 },
];

// Trois récompenses par jour, pas une de plus : il faut choisir.
const RECLAMATIONS_GUILDE_PAR_JOUR = 3;

// v17 : chaque contrat a désormais une RARETÉ, tirée au sort — plus le
// contrat est rare, plus il exige… et plus il paie. Les contrats rares et
// au-delà offrent toujours un objet, tiré avec un bonus de chance.
const RARETES_QUETES = [
  { cle: 'commun',     poids: 38, multRequis: 1,   multRecompense: 1,   bonusCoffre: 0 },
  { cle: 'inhabituel', poids: 26, multRequis: 1.2, multRecompense: 1.4, bonusCoffre: 0 },
  { cle: 'rare',       poids: 18, multRequis: 1.5, multRecompense: 2,   bonusCoffre: 4 },
  { cle: 'epique',     poids: 10, multRequis: 1.9, multRecompense: 2.8, bonusCoffre: 8 },
  { cle: 'legendaire', poids: 5,  multRequis: 2.4, multRecompense: 4,   bonusCoffre: 14 },
  { cle: 'mythique',   poids: 2,  multRequis: 3,   multRecompense: 5.5, bonusCoffre: 20 },
  { cle: 'divin',      poids: 1,  multRequis: 3.6, multRecompense: 7.5, bonusCoffre: 28 },
];

function tirerRareteQuete(alea2) {
  const total = RARETES_QUETES.reduce((somme, r) => somme + r.poids, 0);
  let tirage = alea2() * total;
  for (const r of RARETES_QUETES) {
    tirage -= r.poids;
    if (tirage <= 0) return r;
  }
  return RARETES_QUETES[0];
}

// Générateur pseudo-aléatoire déterministe (même jour → mêmes contrats).
function grainePseudoAleatoire(graine) {
  let h = 0;
  for (let i = 0; i < graine.length; i++) h = (h * 31 + graine.charCodeAt(i)) >>> 0;
  return () => {
    h = (h * 1103515245 + 12345) >>> 0;
    return (h >>> 8) / 16777216;
  };
}

function genererQuetesDuJour(p) {
  const date = new Date().toISOString().slice(0, 10);
  const alea2 = grainePseudoAleatoire(date + '|' + p.id);
  // Pas de contrat inaccessible : la Tour et les donjons demandent un niveau.
  const disponibles = MODELES_QUETES.filter((m) => !m.niveauMin || p.niveau >= m.niveauMin);
  // Six contrats par jour, tous différents — mais trois récompenses au plus.
  // v28 : différents jusqu'au TYPE. Trois paires de modèles partagent un
  // identifiant de type, et deux contrats jumeaux avançaient ensemble :
  // un seul combat nourrissait deux lignes. Un type, une ligne.
  const typesDistincts = new Set(disponibles.map((m) => m.type));
  const nbContrats = Math.min(6, typesDistincts.size);
  const indices = [];
  const typesPris = new Set();
  while (indices.length < nbContrats) {
    const i = Math.floor(alea2() * disponibles.length);
    if (indices.includes(i) || typesPris.has(disponibles[i].type)) continue;
    indices.push(i);
    typesPris.add(disponibles[i].type);
  }
  return {
    date,
    liste: indices.map((i, position) => {
      const modele = disponibles[i];
      const rarete = tirerRareteQuete(alea2);
      const base = modele.min + Math.floor(alea2() * (modele.max - modele.min + 1));
      const requis = Math.max(modele.min, Math.round(base * rarete.multRequis));
      return {
        type: modele.type, emoji: modele.emoji,
        rarete: rarete.cle,
        texte: modele.texte(requis), requis, fait: 0, reclamee: false,
        recompense: {
          // v19 : un contrat divin de niveau 50 rapportait ~11 100 po, et la
          // Guilde en paie trois par jour — soit 30 000 po sans combattre,
          // quand une pièce légendaire en coûtait 2 870. L'or est divisé par
          // 2,5 ; l'XP, elle, ne bouge pas : le problème n'a jamais été là.
          po: Math.round((25 + p.niveau * 8) * (1 + position * 0.5) * rarete.multRecompense / 2.5),
          xp: Math.round((15 + p.niveau * 9) * (1 + position * 0.5) * rarete.multRecompense),
          coffre: position >= 4 || rarete.bonusCoffre > 0,
          bonusCoffre: rarete.bonusCoffre,
        },
      };
    }),
  };
}

// =====================================================================
// Niveaux de difficulté des zones
// =====================================================================
const DIFFICULTES = {
  normal:    { nom: 'Normal',    emoji: '⚔️', hp: 1,   atk: 1,    xp: 1,    po: 1,    drop: 1 },
  heroique:  { nom: 'Héroïque',  emoji: '🔥', hp: 1.5, atk: 1.35, xp: 1.75, po: 1.75, drop: 1.35 },
  cauchemar: { nom: 'Cauchemar', emoji: '💀', hp: 2.2, atk: 1.7,  xp: 2.5,  po: 2.5,  drop: 1.8 },
};

// Héroïque : boss de la zone vaincu. Cauchemar : en plus, 6 niveaux au-dessus
// du niveau d'entrée de la zone.
function difficulteDebloquee(p, zone, cle) {
  if (cle === 'normal') return true;
  if (cle === 'heroique') return p.bossVaincus.includes(zone.id);
  return p.bossVaincus.includes(zone.id) && p.niveau >= zone.niveauMin + 6;
}
