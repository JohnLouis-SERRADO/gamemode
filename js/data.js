'use strict';

// =====================================================================
// Données du jeu : caractéristiques, compétences, modèles, monstres,
// rencontres et progression.
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
const NB_COMPETENCES = 4;     // compétences à choisir à la création

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
// Monstres
// attaques : { nom, emoji, mult, poids, type ('mono'|'aoe'|'soin'), valeur?, effet? }
// =====================================================================
const MONSTRES = {
  gobelin: {
    nom: 'Gobelin', emoji: '👺', hp: 26, atk: 6, agi: 4, xp: 12,
    attaques: [
      { nom: 'Coup de gourdin', emoji: '🏏', mult: 1.0, poids: 3, type: 'mono' },
      { nom: 'Morsure sournoise', emoji: '🦷', mult: 1.3, poids: 1, type: 'mono' },
    ],
  },
  loup: {
    nom: 'Loup', emoji: '🐺', hp: 30, atk: 8, agi: 7, xp: 14,
    attaques: [
      { nom: 'Coup de crocs', emoji: '🦷', mult: 1.0, poids: 3, type: 'mono' },
      { nom: 'Bond sauvage', emoji: '💨', mult: 1.25, poids: 1, type: 'mono' },
    ],
  },
  loupAlpha: {
    nom: 'Loup alpha', emoji: '🐺', hp: 48, atk: 11, agi: 8, xp: 25,
    attaques: [
      { nom: 'Morsure féroce', emoji: '🦷', mult: 1.2, poids: 2, type: 'mono' },
      { nom: 'Frénésie', emoji: '🌪️', mult: 1.5, poids: 1, type: 'mono' },
    ],
  },
  squelette: {
    nom: 'Squelette', emoji: '💀', hp: 28, atk: 8, agi: 4, xp: 15,
    attaques: [
      { nom: 'Coup d’épée rouillée', emoji: '🗡️', mult: 1.0, poids: 3, type: 'mono' },
      { nom: 'Griffure d’os', emoji: '🦴', mult: 1.2, poids: 1, type: 'mono' },
    ],
  },
  archerSquelette: {
    nom: 'Archer squelette', emoji: '🏹', hp: 24, atk: 9, agi: 6, xp: 18,
    attaques: [
      { nom: 'Tir d’os', emoji: '🏹', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Volée d’os', emoji: '🎯', mult: 0.6, poids: 1, type: 'aoe' },
    ],
  },
  pretreDechu: {
    nom: 'Prêtre déchu', emoji: '🧟', hp: 30, atk: 7, agi: 4, xp: 20,
    attaques: [
      { nom: 'Châtiment', emoji: '☠️', mult: 1.1, poids: 2, type: 'mono' },
      { nom: 'Prière noire', emoji: '🩸', poids: 2, type: 'soin', valeur: 14 },
    ],
  },
  orc: {
    nom: 'Orc', emoji: '👹', hp: 44, atk: 10, agi: 3, xp: 22,
    attaques: [
      { nom: 'Coup de hache', emoji: '🪓', mult: 1.0, poids: 3, type: 'mono' },
      { nom: 'Charge brutale', emoji: '💢', mult: 1.35, poids: 1, type: 'mono' },
    ],
  },
  chamanGobelin: {
    nom: 'Chaman gobelin', emoji: '🧙', hp: 28, atk: 7, agi: 5, xp: 20,
    attaques: [
      { nom: 'Malédiction', emoji: '🕷️', mult: 0.9, poids: 2, type: 'mono', effet: { type: 'poison', degats: 3, duree: 2 } },
      { nom: 'Totem de soin', emoji: '🪅', poids: 2, type: 'soin', valeur: 12 },
    ],
  },
  golem: {
    nom: 'Golem ancien', emoji: '🗿', hp: 60, hpParJoueur: 30, atk: 13, agi: 2, xp: 60,
    attaques: [
      { nom: 'Coup de poing', emoji: '👊', mult: 1.0, poids: 2, type: 'mono' },
      { nom: 'Écrasement', emoji: '💥', mult: 1.25, poids: 2, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.3 } },
      { nom: 'Tremblement', emoji: '🌋', mult: 0.7, poids: 1, type: 'aoe' },
    ],
  },
};

// =====================================================================
// Rencontres du donjon (composition selon le nombre de joueurs n)
// =====================================================================
const RENCONTRES = [
  {
    nom: 'L’embuscade gobeline',
    intro: 'Des ricanements résonnent dans l’entrée du donjon…',
    composition: (n) => Array(n + 1).fill('gobelin'),
  },
  {
    nom: 'La meute affamée',
    intro: 'Des yeux jaunes brillent dans l’obscurité.',
    composition: (n) => [...Array(n).fill('loup'), 'loupAlpha'],
  },
  {
    nom: 'La crypte oubliée',
    intro: 'Les os des anciens gardiens se relèvent…',
    composition: (n) => [...Array(n).fill('squelette'), 'archerSquelette', 'pretreDechu'],
  },
  {
    nom: 'La salle des gardes',
    intro: 'Les orcs de garde saisissent leurs haches.',
    composition: (n) => [...Array(Math.max(2, n)).fill('orc'), 'chamanGobelin'],
  },
  {
    nom: 'Le gardien des Profondeurs',
    intro: 'Le sol tremble. Le gardien s’éveille.',
    composition: (n) => ['golem', 'gobelin', 'gobelin', ...(n >= 4 ? ['orc'] : [])],
  },
];

// =====================================================================
// Progression
// =====================================================================
const SEUILS_XP = [0, 40, 100, 180, 280]; // XP cumulée requise pour les niveaux 1 à 5
const NIVEAU_MAX = SEUILS_XP.length;
const POINTS_PAR_NIVEAU = 2;
const NIVEAUX_NOUVELLE_COMPETENCE = [3, 5];

function niveauPour(xp) {
  let niveau = 1;
  for (let i = 0; i < SEUILS_XP.length; i++) {
    if (xp >= SEUILS_XP[i]) niveau = i + 1;
  }
  return Math.min(niveau, NIVEAU_MAX);
}

function maxHpPour(stats, niveau) {
  return 25 + stats.vit * 7 + (niveau - 1) * 5;
}

function maxMpPour(stats, niveau) {
  return 8 + stats.int * 3 + (niveau - 1) * 2;
}
