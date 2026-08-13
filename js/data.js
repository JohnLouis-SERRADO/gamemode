'use strict';

// =====================================================================
// Données de base : caractéristiques, compétences, modèles, progression.
// Les objets sont dans objets.js, les zones et monstres dans zones.js.
// =====================================================================

const AVATARS = ['⚔️', '🧙‍♂️', '🧝‍♀️', '🏹', '🛡️', '🗡️', '🔮', '🌿', '🐺', '🦊', '👑', '🎭'];

const CARACS = {
  for: { nom: 'Force',        emoji: '💪', desc: 'Augmente les dégâts physiques' },
  int: { nom: 'Intelligence', emoji: '🧠', desc: 'Augmente les dégâts magiques, les soins et le mana' },
  agi: { nom: 'Agilité',      emoji: '🏃', desc: 'Augmente l’initiative et les chances de critique' },
  vit: { nom: 'Vitalité',     emoji: '❤️', desc: 'Augmente les points de vie' },
};

const POINTS_CREATION = 10;   // points à répartir à la création
const STAT_BASE = 2;          // valeur de départ de chaque caractéristique
const STAT_MAX_CREATION = 8;  // maximum par caractéristique à la création
const NB_COMPETENCES = 4;     // compétences choisies à la création

const CATEGORIES = {
  physique: '⚔️ Physique',
  magie: '🔮 Magie',
  soutien: '✨ Soutien',
};

// cible : 'ennemi' | 'ennemis' | 'allie' | 'allies' | 'soi'
// type  : 'degats' | 'soin' | 'utilitaire'
const COMPETENCES = {
  'frappe-heroique': {
    nom: 'Frappe héroïque', emoji: '💥', categorie: 'physique', type: 'degats', cible: 'ennemi',
    stat: 'for', puissance: 8, ratio: 1.5, coutMp: 3, cooldown: 2,
    desc: 'Un coup puissant sur un ennemi. Dégâts basés sur la Force.',
  },
  'coup-etourdissant': {
    nom: 'Coup étourdissant', emoji: '🔨', categorie: 'physique', type: 'degats', cible: 'ennemi',
    stat: 'for', puissance: 5, ratio: 1.0, coutMp: 6, cooldown: 4,
    effet: { type: 'etourdi', duree: 1, chance: 0.75 },
    desc: 'Frappe un ennemi avec 75 % de chances de l’étourdir un tour.',
  },
  'tourbillon': {
    nom: 'Tourbillon', emoji: '🌀', categorie: 'physique', type: 'degats', cible: 'ennemis',
    stat: 'for', puissance: 4, ratio: 0.9, coutMp: 8, cooldown: 3,
    desc: 'Frappe tous les ennemis. Dégâts basés sur la Force.',
  },
  'lame-empoisonnee': {
    nom: 'Lame empoisonnée', emoji: '🗡️', categorie: 'physique', type: 'degats', cible: 'ennemi',
    stat: 'agi', puissance: 4, ratio: 1.0, coutMp: 5, cooldown: 3,
    effet: { type: 'poison', duree: 3 },
    desc: 'Blesse un ennemi et l’empoisonne pendant 3 tours.',
  },
  'tir-precis': {
    nom: 'Tir précis', emoji: '🏹', categorie: 'physique', type: 'degats', cible: 'ennemi',
    stat: 'agi', puissance: 7, ratio: 1.4, coutMp: 3, cooldown: 2, critBonus: 0.2,
    desc: 'Un tir précis avec +20 % de chances de critique. Basé sur l’Agilité.',
  },
  'pluie-de-fleches': {
    nom: 'Pluie de flèches', emoji: '🎯', categorie: 'physique', type: 'degats', cible: 'ennemis',
    stat: 'agi', puissance: 3, ratio: 0.8, coutMp: 8, cooldown: 3,
    desc: 'Crible tous les ennemis de flèches. Basé sur l’Agilité.',
  },
  'boule-de-feu': {
    nom: 'Boule de feu', emoji: '🔥', categorie: 'magie', type: 'degats', cible: 'ennemi',
    stat: 'int', puissance: 9, ratio: 1.5, coutMp: 5, cooldown: 2,
    desc: 'Une explosion de feu sur un ennemi. Basée sur l’Intelligence.',
  },
  'eclair': {
    nom: 'Éclair', emoji: '⚡', categorie: 'magie', type: 'degats', cible: 'ennemi',
    stat: 'int', puissance: 6, ratio: 1.2, coutMp: 4, cooldown: 0, critBonus: 0.15,
    desc: 'Un éclair rapide, utilisable à chaque tour. +15 % de critique.',
  },
  'nova-de-givre': {
    nom: 'Nova de givre', emoji: '❄️', categorie: 'magie', type: 'degats', cible: 'ennemis',
    stat: 'int', puissance: 4, ratio: 0.9, coutMp: 9, cooldown: 3,
    desc: 'Une vague de froid qui frappe tous les ennemis.',
  },
  'drain-de-vie': {
    nom: 'Drain de vie', emoji: '🧛', categorie: 'magie', type: 'degats', cible: 'ennemi',
    stat: 'int', puissance: 6, ratio: 1.1, coutMp: 6, cooldown: 3,
    effet: { type: 'drain', part: 0.5 },
    desc: 'Inflige des dégâts et vous soigne de la moitié des dégâts infligés.',
  },
  'soin': {
    nom: 'Soin', emoji: '✨', categorie: 'soutien', type: 'soin', cible: 'allie',
    stat: 'int', puissance: 10, ratio: 1.6, coutMp: 5, cooldown: 2,
    desc: 'Soigne un allié. Basé sur l’Intelligence.',
  },
  'cercle-de-soin': {
    nom: 'Cercle de soin', emoji: '🌿', categorie: 'soutien', type: 'soin', cible: 'allies',
    stat: 'int', puissance: 5, ratio: 1.0, coutMp: 9, cooldown: 4,
    desc: 'Soigne tous les membres du groupe.',
  },
  'bouclier-magique': {
    nom: 'Bouclier magique', emoji: '🛡️', categorie: 'soutien', type: 'utilitaire', cible: 'allie',
    stat: 'int', coutMp: 5, cooldown: 4,
    effet: { type: 'bouclier', duree: 3 },
    desc: 'Protège un allié avec un bouclier qui absorbe les dégâts (3 tours).',
  },
  'benediction': {
    nom: 'Bénédiction', emoji: '🙏', categorie: 'soutien', type: 'utilitaire', cible: 'allie',
    stat: 'int', coutMp: 4, cooldown: 4,
    effet: { type: 'benediction', duree: 3 },
    desc: 'Augmente les dégâts d’un allié de 30 % pendant 3 tours.',
  },
  'provocation': {
    nom: 'Provocation', emoji: '😤', categorie: 'soutien', type: 'utilitaire', cible: 'soi',
    stat: 'for', coutMp: 3, cooldown: 4,
    effet: { type: 'provocation', duree: 2 },
    desc: 'Force les ennemis à vous attaquer pendant 2 tours et vous donne un petit bouclier.',
  },
  'regeneration': {
    nom: 'Régénération', emoji: '💧', categorie: 'soutien', type: 'utilitaire', cible: 'allie',
    stat: 'int', coutMp: 5, cooldown: 4,
    effet: { type: 'regen', duree: 3 },
    desc: 'Un allié récupère des points de vie au début de chacun de ses 3 prochains tours.',
  },
  'concentration': {
    nom: 'Concentration', emoji: '🧘', categorie: 'soutien', type: 'utilitaire', cible: 'soi',
    stat: 'int', coutMp: 0, cooldown: 4,
    effet: { type: 'mana', valeur: 10 },
    desc: 'Vous méditez et récupérez 10 points de mana.',
  },
  'second-souffle': {
    nom: 'Second souffle', emoji: '🍃', categorie: 'soutien', type: 'soin', cible: 'soi',
    stat: 'vit', puissance: 8, ratio: 1.5, coutMp: 3, cooldown: 4,
    desc: 'Vous reprenez votre souffle et récupérez des points de vie (basé sur la Vitalité).',
  },
};

// Modèles rapides : pré-remplissent stats + compétences (modifiables ensuite).
const MODELES = [
  {
    nom: 'Guerrier', emoji: '⚔️',
    stats: { for: 7, int: 2, agi: 3, vit: 6 },
    competences: ['frappe-heroique', 'coup-etourdissant', 'provocation', 'second-souffle'],
  },
  {
    nom: 'Mage', emoji: '🔮',
    stats: { for: 2, int: 8, agi: 4, vit: 4 },
    competences: ['boule-de-feu', 'eclair', 'nova-de-givre', 'bouclier-magique'],
  },
  {
    nom: 'Archer', emoji: '🏹',
    stats: { for: 4, int: 2, agi: 8, vit: 4 },
    competences: ['tir-precis', 'pluie-de-fleches', 'lame-empoisonnee', 'concentration'],
  },
  {
    nom: 'Clerc', emoji: '🌿',
    stats: { for: 3, int: 6, agi: 3, vit: 6 },
    competences: ['soin', 'cercle-de-soin', 'benediction', 'regeneration'],
  },
];

// =====================================================================
// Progression (niveau 1 à 20)
// =====================================================================
const NIVEAU_MAX = 20;
const POINTS_PAR_NIVEAU = 2;
const NIVEAUX_NOUVELLE_COMPETENCE = [4, 8, 12, 16, 20];

// XP cumulée requise pour atteindre le niveau n.
function seuilXp(n) {
  return 14 * (n - 1) * (n - 1) + 30 * (n - 1);
}

function niveauPour(xp) {
  let n = 1;
  while (n < NIVEAU_MAX && xp >= seuilXp(n + 1)) n++;
  return n;
}

// =====================================================================
// Stats effectives : base + bonus d'équipement
// Champs possibles d'un bonus : for, int, agi, vit, pvMax, pmMax, crit (%)
// =====================================================================
function statsEffectives(p) {
  const s = { for: p.stats.for, int: p.stats.int, agi: p.stats.agi, vit: p.stats.vit, pvMax: 0, pmMax: 0, crit: 0 };
  Object.values(p.equipement || {}).forEach((idObjet) => {
    if (!idObjet) return;
    const objet = OBJETS[idObjet];
    if (!objet || !objet.bonus) return;
    Object.entries(objet.bonus).forEach(([cle, valeur]) => {
      s[cle] = (s[cle] || 0) + valeur;
    });
  });
  return s;
}

function maxHpDe(p) {
  const s = statsEffectives(p);
  return 25 + s.vit * 7 + (p.niveau - 1) * 6 + s.pvMax;
}

function maxMpDe(p) {
  const s = statsEffectives(p);
  return 8 + s.int * 3 + (p.niveau - 1) * 2 + s.pmMax;
}

// Borne les PV/PM courants après un changement d'équipement ou de niveau.
function bornerVie(p) {
  p.hp = Math.max(0, Math.min(maxHpDe(p), p.hp));
  p.mp = Math.max(0, Math.min(maxMpDe(p), p.mp));
}
