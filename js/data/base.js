'use strict';

// =====================================================================
// Socle : avatars, caractéristiques, races, raretés, métiers, invocations
// =====================================================================

const AVATARS = ['⚔️', '🧙‍♂️', '🧝‍♀️', '🏹', '🛡️', '🗡️', '🔮', '🌿', '🐺', '🦊', '👑', '🎭'];

// =====================================================================
// v19 — Caractéristiques, modèle Final Fantasy XIV.
//
// On sépare désormais deux familles, comme le fait FF XIV :
//
//  • les ATTRIBUTS PRINCIPAUX, où le joueur investit ses points de niveau.
//    Chacun porte un rôle : c'est lui qui décide de la puissance brute.
//  • les SOUS-CARACTÉRISTIQUES, qui ne s'achètent pas — elles se portent.
//    Elles viennent de l'équipement et font toute la personnalité d'un
//    build : frapper fort mais au hasard, ou moins fort mais tout le temps.
// =====================================================================
const CARACS = {
  for: { nom: 'Force',        emoji: '💪', desc: 'Augmente les dégâts physiques de mêlée' },
  dex: { nom: 'Dextérité',    emoji: '🎯', desc: 'Augmente les dégâts physiques à distance' },
  int: { nom: 'Intelligence', emoji: '🧠', desc: 'Augmente les dégâts magiques' },
  esp: { nom: 'Esprit',       emoji: '🕊️', desc: 'Augmente la puissance des soins et des boucliers' },
  vit: { nom: 'Vitalité',     emoji: '❤️', desc: 'Augmente les points de vie — et les dégâts du Gardien' },
  cha: { nom: 'Chance',       emoji: '🍀', desc: 'Augmente les trouvailles et la rareté du butin' },
};

// Les sous-caractéristiques ne se répartissent pas : elles se trouvent.
// `pourcent` indique si la valeur s'affiche et se lit comme un pourcentage.
const SOUS_CARACS = {
  crit:     { nom: 'Critique',      emoji: '💥', pourcent: true,  desc: 'Fréquence des coups critiques (×1,5 de dégâts)' },
  direct:   { nom: 'Coup direct',   emoji: '🎲', pourcent: true,  desc: 'Chance d’un coup net à +25 %, sans se cumuler au critique' },
  deter:    { nom: 'Détermination', emoji: '⚖️', pourcent: true,  desc: 'Augmente TOUS les dégâts et TOUS les soins, sans hasard' },
  tenacite: { nom: 'Ténacité',      emoji: '🛡️', pourcent: true,  desc: 'Réduit les dégâts subis et renforce les vôtres — pièces de plaque' },
  celerite: { nom: 'Célérité',      emoji: '💨', pourcent: true,  desc: 'Augmente l’initiative et raccourcit les recharges' },
  piete:    { nom: 'Piété',         emoji: '💧', pourcent: true,  desc: 'Augmente le mana maximum et sa régénération' },
};

// Bornes des sous-caractéristiques : au-delà, le rendement est perdu.
// Elles empêchent qu'un build à 100 % d'esquive ou de réduction existe.
const PLAFONDS_SOUS_CARACS = { crit: 60, direct: 50, deter: 60, tenacite: 40, celerite: 50, piete: 100 };

const POINTS_CREATION = 12;   // points à répartir à la création (6 attributs)
const STAT_BASE = 2;          // valeur de départ de chaque caractéristique
const STAT_MAX_CREATION = 8;  // maximum par caractéristique à la création
const NB_COMPETENCES = 4;          // compétences choisies à la création
const MAX_COMPETENCES_ACTIVES = 8; // compétences équipables en même temps

// =====================================================================
// Races : un passif unique chacune
// =====================================================================
const RACES = {
  humain:  { nom: 'Humain',  emoji: '🧑', passif: 'Ambition',             desc: '+10 % d’expérience gagnée.' },
  elfe:    { nom: 'Elfe',    emoji: '🧝', passif: 'Précision millénaire', desc: '+5 % de chances de coup critique.' },
  nain:    { nom: 'Nain',    emoji: '⛏️', passif: 'Peau de pierre',       desc: 'Dégâts subis réduits de 10 %.' },
  orc:     { nom: 'Orc',     emoji: '👹', passif: 'Sang de guerre',       desc: '+15 % de dégâts sous 40 % de PV.' },
  felin:   { nom: 'Félin',   emoji: '🐱', passif: 'Neuf vies',            desc: 'Une fois par combat, survit à un coup fatal avec 1 PV.' },
  sylvain: { nom: 'Sylvain', emoji: '🌳', passif: 'Sève vitale',          desc: 'Régénère 2 % de ses PV max au début de chaque tour.' },
};

function raceDe(p) {
  return RACES[p.race] || RACES.humain;
}

// =====================================================================
// Raretés des objets
// =====================================================================
const RARETES = {
  commun:     { nom: 'Commun',     poids: 100 },
  inhabituel: { nom: 'Inhabituel', poids: 45 },
  rare:       { nom: 'Rare',       poids: 16 },
  epique:     { nom: 'Épique',     poids: 5 },
  legendaire: { nom: 'Légendaire', poids: 1.2 },
  mythique:   { nom: 'Mythique',   poids: 0.35 },
  divin:      { nom: 'Divin',      poids: 0.08 },
};

function rareteDe(objet) {
  return objet && objet.rarete ? objet.rarete : 'commun';
}

function etiquetteRarete(objet) {
  const cle = rareteDe(objet);
  return `<span class="rarete rar-${cle}">${RARETES[cle].nom}</span>`;
}

// Version texte brut (journal de butin) : rien pour le commun.
function texteRarete(objet) {
  const cle = rareteDe(objet);
  return cle === 'commun' ? '' : ` 〔${RARETES[cle].nom}〕`;
}

// La chance améliore la probabilité de butin…
function multChanceDrop(cha) {
  return Math.min(2, 1 + (cha || 0) * 0.02);
}

// …et tire les coffres vers les hautes raretés.
function tirerRarete(cha) {
  const bonus = 1 + (cha || 0) * 0.06;
  const entrees = Object.entries(RARETES).map(([cle, r]) => [
    cle,
    cle === 'commun' ? r.poids : r.poids * bonus,
  ]);
  let total = entrees.reduce((somme, [, poids]) => somme + poids, 0);
  let tirage = Math.random() * total;
  for (const [cle, poids] of entrees) {
    tirage -= poids;
    if (tirage <= 0) return cle;
  }
  return 'commun';
}

// =====================================================================
// Métiers de récolte (v12) : mineur, tanneur, tisseur. Dans chaque zone,
// on choisit SA façon de récolter — et la chance améliore la moisson.
// =====================================================================
const METIERS = {
  mineur: {
    nom: 'Mineur', emoji: '⛏️', action: 'Miner', exclusif: 'pierre-magique', famille: 'mine',
    detail: 'Pierres, minerais et cristaux — et parfois une pierre magique',
  },
  tanneur: {
    nom: 'Tanneur', emoji: '🔪', action: 'Dépecer', exclusif: 'cuir-primal', famille: 'peau',
    detail: 'Cuirs, os et dépouilles de bêtes — et parfois un cuir primal',
  },
  tisseur: {
    nom: 'Tisseur', emoji: '🌿', action: 'Herboriser', exclusif: 'tissu-magique', famille: 'plante',
    detail: 'Plantes, fibres et étoffes — et parfois un tissu magique',
  },
};

const NIVEAU_MAX_METIER = 10;
// XP nécessaire pour passer du niveau n au suivant.
function seuilXpMetier(niveau) { return 12 + niveau * 8; }

// Spécialité (sous-classe de récolte) : débloquée au niveau 5 — le choix
// est alors obligatoire (fenêtre dédiée). Le premier choix est gratuit,
// en changer coûte de l'or — on ne renie pas son métier à la légère.
const NIVEAU_SPECIALITE = 5;
const COUT_CHANGEMENT_SPECIALITE = 1000;
// Le spécialiste récolte mieux — d'autant plus que sa Chance est haute.
function multSpecialite(cha) { return 1 + 0.3 * multChanceDrop(cha); }

// Chaque matériau récoltable appartient à une famille de métier.
const FAMILLE_MATERIAU = {
  // ⛏️ pierres, minerais, cristaux (mineur)
  'minerai-cuivre': 'mine', 'minerai-fer': 'mine', 'perle-des-sables': 'mine', 'cristal-givre': 'mine',
  'noyau-golem': 'mine', 'basalte-poli': 'mine', 'cristal-hurleur': 'mine', 'obsidienne-brute': 'mine',
  'coeur-de-braise': 'mine', 'bois-petrifie': 'mine', 'ambre-noir': 'mine', 'sphere-runique': 'mine',
  'fragment-de-foudre': 'mine', 'acier-celeste': 'mine', 'eclat-d-etoile': 'mine', 'relique-antique': 'mine',
  'pierre-magique': 'mine',
  // 🔪 dépouilles de bêtes et de monstres (tanneur)
  'peau-de-loup': 'peau', 'soie-araignee': 'peau', 'os-ancien': 'peau', 'poussiere-spectre': 'peau',
  'ecaille-draconique': 'peau', 'venin-concentre': 'peau', 'plume-de-rokh': 'peau', 'corail-sanglant': 'peau',
  'os-de-geant': 'peau', 'peau-de-mammouth': 'peau', 'plume-d-archon': 'peau', 'cuir-primal': 'peau',
  // 🌿 plantes, fibres et étoffes (tisseur)
  'fibre-sauvage': 'plante', 'herbe-lunaire': 'plante', 'bois-chene': 'plante', 'seve-ambree': 'plante',
  'lotus-noir': 'plante', 'liane-tressee': 'plante', 'orchidee-lunaire': 'plante', 'cendre-fertile': 'plante',
  'nacre-abyssale': 'plante', 'larme-de-sirene': 'plante', 'etoffe-du-neant': 'plante',
  'essence-primordiale': 'plante', 'tissu-magique': 'plante',
};

// =====================================================================
// Invocations (v15) : des créatures qu'on appelle en combat. Une seule
// par héros à la fois ; elle a 4 compétences qu'elle paie en mana (ou en
// PV quand le mana manque), agit seule et au hasard, reste jusqu'à sa
// mort ou la fin du combat. Ses stats sont des fractions de celles de
// son maître — jamais au-dessus — et elle naît avec 50 % de son mana.
// =====================================================================
const INVOCATIONS = {
  'loup-spectral': {
    nom: 'Loup spectral', emoji: '🐺', pvPct: 0.55,
    stats: { for: 0.7, int: 0.2, dex: 0.9, vit: 0.6, cha: 0.3 },
    competences: ['morsure-du-loup', 'lame-dans-l-ombre', 'rafale-de-coups', 'instinct-sauvage'],
    desc: 'Un écho des meutes des Plaines : crocs rapides, loyauté d’outre-brume.',
  },
  'golem-de-basalte': {
    nom: 'Golem de basalte', emoji: '🗿', pvPct: 0.9,
    stats: { for: 0.8, int: 0.1, dex: 0.2, vit: 1.0, cha: 0.1 },
    competences: ['provocation', 'frappe-heroique', 'verdict-de-fer', 'second-souffle'],
    desc: 'Un fragment des Pics qui a accepté de marcher : il encaisse, il provoque, il tient.',
  },
  'feu-follet': {
    nom: 'Feu follet', emoji: '🔥', pvPct: 0.35,
    stats: { for: 0.1, int: 0.95, dex: 0.7, vit: 0.35, cha: 0.5 },
    competences: ['boule-de-feu', 'eclair', 'combustion', 'mur-de-flammes'],
    desc: 'Une étincelle échappée de la Forge première — fragile, furieuse, incendiaire.',
  },
  'ondine-des-marees': {
    nom: 'Ondine des marées', emoji: '💧', pvPct: 0.5,
    stats: { for: 0.2, int: 0.85, dex: 0.5, vit: 0.6, cha: 0.6 },
    competences: ['soin', 'cercle-de-soin', 'regeneration', 'fleche-de-givre'],
    desc: 'Une goutte du Sanctuaire des Marées : elle soigne les siens et gifle les autres.',
  },
  'corbeau-d-orage': {
    nom: 'Corbeau d’orage', emoji: '🐦‍⬛', pvPct: 0.4,
    stats: { for: 0.3, int: 0.75, dex: 0.95, vit: 0.4, cha: 0.6 },
    competences: ['chaine-d-eclairs', 'eclair', 'totem-tonnerre', 'voile-de-fumee'],
    desc: 'Un éclat des Falaises Hurlantes à plumes : vif, bruyant, électrique.',
  },
  'ombre-de-nihelm': {
    nom: 'Ombre de Nihelm', emoji: '🕳️', pvPct: 0.45,
    stats: { for: 0.4, int: 0.9, dex: 0.8, vit: 0.45, cha: 0.4 },
    competences: ['faux-spectrale', 'drain-de-vie', 'horde-spectrale', 'terreur'],
    desc: 'Un pan du gouffre qui a choisi un maître — pour l’instant.',
  },
};

const CATEGORIES = {
  physique: '⚔️ Physique',
  magie: '🔮 Magie',
  soutien: '✨ Soutien',
  invocation: '🐾 Invocations',
};

// Espace insécable tous les trois chiffres : « 250 000 po » se lit d'un
// coup d'œil, « 250000 po » se compte. Défini ici, dans le premier
// fichier chargé, parce que tout l'affichage s'en sert.
function formatNombre(n) {
  return Number(n).toLocaleString('fr-FR');
}
