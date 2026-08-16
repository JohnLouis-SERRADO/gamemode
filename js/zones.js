'use strict';

// =====================================================================
// Monstres et zones du monde.
// Un monstre : hp, atk, agi, xp, po [min,max], drops [{id, chance}],
// attaques [{nom, emoji, mult, poids, type 'mono'|'aoe'|'soin', valeur?, effet?}]
// =====================================================================

const MONSTRES = {
  // ----- Plaines de l'Aube (niv. 1-3) -----
  gobelin: {
    nom: 'Gobelin', emoji: '👺', niveau: 1, hp: 24, atk: 5, agi: 4, xp: 20, po: [4, 8],
    drops: [{ id: 'fibre-sauvage', chance: 0.35 }, { id: 'herbe-lunaire', chance: 0.2 }],
    attaques: [
      { nom: 'Coup de gourdin', emoji: '🏏', mult: 1.0, poids: 3, type: 'mono' },
      { nom: 'Morsure sournoise', emoji: '🦷', mult: 1.3, poids: 1, type: 'mono' },
    ],
  },
  loup: {
    nom: 'Loup', emoji: '🐺', niveau: 2, hp: 30, atk: 7, agi: 7, xp: 26, po: [5, 9],
    drops: [{ id: 'peau-de-loup', chance: 0.5 }],
    attaques: [
      { nom: 'Coup de crocs', emoji: '🦷', mult: 1.0, poids: 3, type: 'mono' },
      { nom: 'Bond sauvage', emoji: '💨', mult: 1.25, poids: 1, type: 'mono' },
    ],
  },
  sanglier: {
    nom: 'Sanglier', emoji: '🐗', niveau: 2, hp: 36, atk: 8, agi: 4, xp: 30, po: [5, 10],
    drops: [{ id: 'defense-sanglier', chance: 0.45 }],
    attaques: [
      { nom: 'Coup de boutoir', emoji: '💢', mult: 1.0, poids: 3, type: 'mono' },
      { nom: 'Charge furieuse', emoji: '🌪️', mult: 1.35, poids: 1, type: 'mono' },
    ],
  },
  loupAlpha: {
    nom: 'Loup alpha', emoji: '🐺', niveau: 3, boss: true, hp: 95, atk: 11, agi: 8, xp: 110, po: [25, 40],
    drops: [{ id: 'peau-de-loup', chance: 1 }, { id: 'herbe-lunaire', chance: 0.5 }],
    attaques: [
      { nom: 'Morsure féroce', emoji: '🦷', mult: 1.2, poids: 2, type: 'mono' },
      { nom: 'Hurlement déchirant', emoji: '🌙', mult: 0.7, poids: 1, type: 'aoe' },
      { nom: 'Frénésie', emoji: '🌪️', mult: 1.5, poids: 1, type: 'mono' },
    ],
  },

  // ----- Forêt des Murmures (niv. 3-6) -----
  araignee: {
    nom: 'Araignée géante', emoji: '🕷️', niveau: 4, hp: 48, atk: 10, agi: 8, xp: 45, po: [8, 14],
    drops: [{ id: 'soie-araignee', chance: 0.5 }],
    attaques: [
      { nom: 'Morsure venimeuse', emoji: '🕷️', mult: 0.9, poids: 2, type: 'mono', effet: { type: 'poison', degats: 3, duree: 2 } },
      { nom: 'Coup de pattes', emoji: '🦴', mult: 1.1, poids: 2, type: 'mono' },
    ],
  },
  bandit: {
    nom: 'Bandit', emoji: '🦹', niveau: 4, hp: 55, atk: 11, agi: 6, xp: 48, po: [14, 24],
    drops: [{ id: 'fibre-sauvage', chance: 0.3 }, { id: 'herbe-lunaire', chance: 0.25 }],
    attaques: [
      { nom: 'Coup de dague', emoji: '🗡️', mult: 1.0, poids: 3, type: 'mono' },
      { nom: 'Coup fourré', emoji: '🎭', mult: 1.35, poids: 1, type: 'mono' },
    ],
  },
  treant: {
    nom: 'Tréant', emoji: '🌳', niveau: 5, hp: 75, atk: 12, agi: 3, xp: 56, po: [10, 16],
    drops: [{ id: 'bois-chene', chance: 0.6 }, { id: 'seve-ambree', chance: 0.35 }],
    attaques: [
      { nom: 'Branche lourde', emoji: '🪵', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Étreinte de racines', emoji: '🌱', mult: 0.8, poids: 1, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.25 } },
    ],
  },
  araigneeMatriarche: {
    nom: 'Matriarche soyeuse', emoji: '🕸️', niveau: 6, boss: true, hp: 190, atk: 15, agi: 9, xp: 190, po: [50, 80],
    drops: [{ id: 'soie-araignee', chance: 1 }, { id: 'soie-araignee', chance: 0.6 }, { id: 'seve-ambree', chance: 0.5 }],
    attaques: [
      { nom: 'Crochets ruisselants', emoji: '🕷️', mult: 1.1, poids: 2, type: 'mono', effet: { type: 'poison', degats: 5, duree: 3 } },
      { nom: 'Toile étouffante', emoji: '🕸️', mult: 0.6, poids: 1, type: 'aoe' },
      { nom: 'Assaut des pattes', emoji: '💢', mult: 1.3, poids: 2, type: 'mono' },
    ],
  },

  // ----- Collines de Cuivre (niv. 6-10) -----
  orc: {
    nom: 'Orc', emoji: '👹', niveau: 7, hp: 95, atk: 16, agi: 5, xp: 75, po: [18, 30],
    drops: [{ id: 'minerai-cuivre', chance: 0.4 }],
    attaques: [
      { nom: 'Coup de hache', emoji: '🪓', mult: 1.0, poids: 3, type: 'mono' },
      { nom: 'Charge brutale', emoji: '💢', mult: 1.35, poids: 1, type: 'mono' },
    ],
  },
  chamanGobelin: {
    nom: 'Chaman gobelin', emoji: '🧙', niveau: 7, hp: 80, atk: 14, agi: 6, xp: 78, po: [18, 30],
    drops: [{ id: 'herbe-lunaire', chance: 0.5 }, { id: 'minerai-cuivre', chance: 0.3 }],
    attaques: [
      { nom: 'Malédiction', emoji: '🕷️', mult: 0.9, poids: 2, type: 'mono', effet: { type: 'poison', degats: 5, duree: 2 } },
      { nom: 'Totem de soin', emoji: '🪅', poids: 2, type: 'soin', valeur: 22 },
    ],
  },
  golemMineur: {
    nom: 'Golem mineur', emoji: '🪨', niveau: 8, hp: 130, atk: 17, agi: 3, xp: 88, po: [20, 34],
    drops: [{ id: 'minerai-cuivre', chance: 0.5 }, { id: 'minerai-fer', chance: 0.35 }, { id: 'noyau-golem', chance: 0.12 }],
    attaques: [
      { nom: 'Poing de pierre', emoji: '👊', mult: 1.0, poids: 3, type: 'mono' },
      { nom: 'Éboulement', emoji: '🪨', mult: 0.65, poids: 1, type: 'aoe' },
    ],
  },
  chefOrc: {
    nom: 'Chef de guerre orc', emoji: '👹', niveau: 10, boss: true, hp: 320, atk: 22, agi: 7, xp: 300, po: [90, 140],
    drops: [{ id: 'minerai-fer', chance: 1 }, { id: 'minerai-cuivre', chance: 0.8 }, { id: 'minerai-fer', chance: 0.5 }],
    attaques: [
      { nom: 'Hache tourbillonnante', emoji: '🪓', mult: 0.7, poids: 2, type: 'aoe' },
      { nom: 'Coup massif', emoji: '💥', mult: 1.3, poids: 2, type: 'mono' },
      { nom: 'Rugissement de guerre', emoji: '📢', mult: 1.0, poids: 1, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.35 } },
    ],
  },

  // ----- Marais de Brumeciel (niv. 8-11) -----
  grenouilleGeante: {
    nom: 'Grenouille colossale', emoji: '🐸', niveau: 9, hp: 150, atk: 19, agi: 7, xp: 92, po: [22, 36],
    drops: [{ id: 'herbe-lunaire', chance: 0.4 }, { id: 'lotus-noir', chance: 0.3 }],
    attaques: [
      { nom: 'Coup de langue', emoji: '👅', mult: 1.0, poids: 3, type: 'mono' },
      { nom: 'Bond écrasant', emoji: '💢', mult: 1.3, poids: 1, type: 'mono' },
    ],
  },
  sorciereMarais: {
    nom: 'Sorcière des marais', emoji: '🧙‍♀️', niveau: 9, hp: 135, atk: 18, agi: 6, xp: 96, po: [24, 38],
    drops: [{ id: 'lotus-noir', chance: 0.45 }, { id: 'herbe-lunaire', chance: 0.3 }],
    attaques: [
      { nom: 'Malédiction du bourbier', emoji: '🕸️', mult: 0.9, poids: 2, type: 'mono', effet: { type: 'poison', degats: 6, duree: 2 } },
      { nom: 'Brume revigorante', emoji: '🌫️', poids: 2, type: 'soin', valeur: 30 },
    ],
  },
  serpentVoile: {
    nom: 'Serpent des voiles', emoji: '🐍', niveau: 10, hp: 140, atk: 21, agi: 11, xp: 100, po: [24, 40],
    drops: [{ id: 'lotus-noir', chance: 0.25 }, { id: 'herbe-lunaire', chance: 0.3 }],
    attaques: [
      { nom: 'Crochets furtifs', emoji: '🦷', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Danse hypnotique', emoji: '💫', mult: 0.7, poids: 1, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.25 } },
    ],
  },
  hydreBrumes: {
    nom: 'Hydre des brumes', emoji: '🐉', niveau: 11, boss: true, hp: 420, atk: 26, agi: 8, xp: 380, po: [120, 180],
    drops: [{ id: 'lotus-noir', chance: 1 }, { id: 'lotus-noir', chance: 0.7 }, { id: 'seve-ambree', chance: 0.6 }],
    attaques: [
      { nom: 'Triple morsure', emoji: '🦷', mult: 1.2, poids: 2, type: 'mono' },
      { nom: 'Souffle de brume', emoji: '🌫️', mult: 0.7, poids: 2, type: 'aoe' },
      { nom: 'Régénérescence', emoji: '💧', poids: 1, type: 'soin', valeur: 60 },
    ],
  },

  // ----- Cryptes Oubliées (niv. 10-14) -----
  squelette: {
    nom: 'Squelette', emoji: '💀', niveau: 11, hp: 130, atk: 22, agi: 6, xp: 105, po: [26, 40],
    drops: [{ id: 'os-ancien', chance: 0.5 }],
    attaques: [
      { nom: 'Épée rouillée', emoji: '🗡️', mult: 1.0, poids: 3, type: 'mono' },
      { nom: 'Griffure d’os', emoji: '🦴', mult: 1.25, poids: 1, type: 'mono' },
    ],
  },
  archerSquelette: {
    nom: 'Archer squelette', emoji: '🏹', niveau: 11, hp: 115, atk: 24, agi: 9, xp: 110, po: [26, 40],
    drops: [{ id: 'os-ancien', chance: 0.4 }],
    attaques: [
      { nom: 'Tir d’os', emoji: '🏹', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Volée d’os', emoji: '🎯', mult: 0.6, poids: 1, type: 'aoe' },
    ],
  },
  pretreDechu: {
    nom: 'Prêtre déchu', emoji: '🧟', niveau: 12, hp: 140, atk: 21, agi: 6, xp: 118, po: [30, 46],
    drops: [{ id: 'poussiere-spectre', chance: 0.35 }, { id: 'os-ancien', chance: 0.3 }],
    attaques: [
      { nom: 'Châtiment', emoji: '☠️', mult: 1.1, poids: 2, type: 'mono' },
      { nom: 'Prière noire', emoji: '🩸', poids: 2, type: 'soin', valeur: 38 },
    ],
  },
  spectre: {
    nom: 'Spectre', emoji: '👻', niveau: 12, hp: 125, atk: 25, agi: 11, xp: 122, po: [30, 48],
    drops: [{ id: 'poussiere-spectre', chance: 0.55 }],
    attaques: [
      { nom: 'Toucher glacial', emoji: '🥶', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Hurlement d’outre-tombe', emoji: '😱', mult: 0.8, poids: 1, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.25 } },
    ],
  },
  roiDechu: {
    nom: 'Roi déchu', emoji: '🫅', niveau: 14, boss: true, hp: 520, atk: 30, agi: 8, xp: 480, po: [160, 240],
    drops: [{ id: 'os-ancien', chance: 1 }, { id: 'poussiere-spectre', chance: 1 }, { id: 'poussiere-spectre', chance: 0.6 }],
    attaques: [
      { nom: 'Lame maudite', emoji: '⚔️', mult: 1.2, poids: 2, type: 'mono' },
      { nom: 'Vague nécrotique', emoji: '🌊', mult: 0.7, poids: 2, type: 'aoe' },
      { nom: 'Malédiction royale', emoji: '👑', mult: 0.9, poids: 1, type: 'mono', effet: { type: 'poison', degats: 8, duree: 3 } },
    ],
  },

  // ----- Désert d'Ambrezine (niv. 12-16) -----
  scorpionGeant: {
    nom: 'Scorpion géant', emoji: '🦂', niveau: 13, hp: 185, atk: 27, agi: 9, xp: 135, po: [34, 52],
    drops: [{ id: 'os-ancien', chance: 0.3 }, { id: 'perle-des-sables', chance: 0.2 }],
    attaques: [
      { nom: 'Pince broyeuse', emoji: '🦞', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Dard venimeux', emoji: '🪡', mult: 0.9, poids: 2, type: 'mono', effet: { type: 'poison', degats: 7, duree: 2 } },
    ],
  },
  banditDunes: {
    nom: 'Bandit des dunes', emoji: '🏴‍☠️', niveau: 13, hp: 175, atk: 26, agi: 10, xp: 138, po: [45, 70],
    drops: [{ id: 'perle-des-sables', chance: 0.15 }, { id: 'fibre-sauvage', chance: 0.3 }],
    attaques: [
      { nom: 'Sabre courbe', emoji: '⚔️', mult: 1.0, poids: 3, type: 'mono' },
      { nom: 'Estocade traîtresse', emoji: '🎭', mult: 1.35, poids: 1, type: 'mono' },
    ],
  },
  elementaireSable: {
    nom: 'Élémentaire de sable', emoji: '🌪️', niveau: 14, hp: 200, atk: 29, agi: 7, xp: 148, po: [36, 56],
    drops: [{ id: 'perle-des-sables', chance: 0.4 }],
    attaques: [
      { nom: 'Tourbillon de sable', emoji: '🌪️', mult: 0.65, poids: 1, type: 'aoe' },
      { nom: 'Poigne des dunes', emoji: '🪤', mult: 0.9, poids: 1, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.3 } },
      { nom: 'Lame de silice', emoji: '🔪', mult: 1.1, poids: 2, type: 'mono' },
    ],
  },
  verDesSables: {
    nom: 'Ver des sables colossal', emoji: '🪱', niveau: 16, boss: true, hp: 650, atk: 36, agi: 6, xp: 560, po: [200, 300],
    drops: [{ id: 'perle-des-sables', chance: 1 }, { id: 'perle-des-sables', chance: 0.6 }, { id: 'minerai-fer', chance: 0.8 }],
    attaques: [
      { nom: 'Engloutissement', emoji: '🕳️', mult: 1.3, poids: 2, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.25 } },
      { nom: 'Séisme des dunes', emoji: '🌋', mult: 0.75, poids: 2, type: 'aoe' },
      { nom: 'Jet d’acide', emoji: '🧪', mult: 0.9, poids: 1, type: 'mono', effet: { type: 'poison', degats: 9, duree: 2 } },
    ],
  },

  // ----- Pics Gelés (niv. 14-18) -----
  loupGlaces: {
    nom: 'Loup des glaces', emoji: '🐺', niveau: 15, hp: 190, atk: 30, agi: 12, xp: 155, po: [40, 60],
    drops: [{ id: 'peau-de-loup', chance: 0.5 }, { id: 'cristal-givre', chance: 0.3 }],
    attaques: [
      { nom: 'Crocs gelés', emoji: '🦷', mult: 1.0, poids: 3, type: 'mono' },
      { nom: 'Bond glacial', emoji: '❄️', mult: 1.3, poids: 1, type: 'mono' },
    ],
  },
  elementaireGivre: {
    nom: 'Élémentaire de givre', emoji: '🧊', niveau: 15, hp: 175, atk: 32, agi: 8, xp: 162, po: [40, 62],
    drops: [{ id: 'cristal-givre', chance: 0.5 }],
    attaques: [
      { nom: 'Javelot de glace', emoji: '🧊', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Souffle glacial', emoji: '🌬️', mult: 0.65, poids: 1, type: 'aoe' },
    ],
  },
  yeti: {
    nom: 'Yéti', emoji: '🦍', niveau: 16, hp: 260, atk: 34, agi: 6, xp: 175, po: [45, 70],
    drops: [{ id: 'peau-de-loup', chance: 0.6 }, { id: 'cristal-givre', chance: 0.35 }],
    attaques: [
      { nom: 'Poing colossal', emoji: '👊', mult: 1.25, poids: 2, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.2 } },
      { nom: 'Roulade de neige', emoji: '☃️', mult: 0.7, poids: 1, type: 'aoe' },
      { nom: 'Coup balayé', emoji: '💢', mult: 1.0, poids: 2, type: 'mono' },
    ],
  },
  elementaireAncien: {
    nom: 'Élémentaire ancien', emoji: '🌨️', niveau: 18, boss: true, hp: 800, atk: 40, agi: 10, xp: 650, po: [260, 380],
    drops: [{ id: 'cristal-givre', chance: 1 }, { id: 'cristal-givre', chance: 1 }, { id: 'noyau-golem', chance: 0.6 }],
    attaques: [
      { nom: 'Tempête de givre', emoji: '🌨️', mult: 0.75, poids: 2, type: 'aoe' },
      { nom: 'Lance de glace', emoji: '🧊', mult: 1.3, poids: 2, type: 'mono' },
      { nom: 'Prison de glace', emoji: '🧊', mult: 0.6, poids: 1, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.6 } },
    ],
  },

  // ----- Cœur des Profondeurs (niv. 18-20) -----
  golemAncien: {
    nom: 'Golem ancien', emoji: '🗿', niveau: 19, hp: 380, atk: 42, agi: 4, xp: 240, po: [60, 90],
    drops: [{ id: 'noyau-golem', chance: 0.5 }, { id: 'minerai-fer', chance: 0.4 }],
    attaques: [
      { nom: 'Écrasement', emoji: '💥', mult: 1.25, poids: 2, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.3 } },
      { nom: 'Tremblement', emoji: '🌋', mult: 0.7, poids: 1, type: 'aoe' },
      { nom: 'Coup de poing', emoji: '👊', mult: 1.0, poids: 2, type: 'mono' },
    ],
  },
  ombre: {
    nom: 'Ombre', emoji: '🌑', niveau: 19, hp: 300, atk: 45, agi: 14, xp: 250, po: [60, 95],
    drops: [{ id: 'poussiere-spectre', chance: 0.7 }],
    attaques: [
      { nom: 'Lame d’ombre', emoji: '🌑', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Voile de ténèbres', emoji: '🌫️', mult: 0.65, poids: 1, type: 'aoe' },
    ],
  },
  dragonnet: {
    nom: 'Dragonnet', emoji: '🐉', niveau: 19, hp: 320, atk: 44, agi: 11, xp: 255, po: [65, 95],
    drops: [{ id: 'ecaille-draconique', chance: 0.45 }],
    attaques: [
      { nom: 'Souffle ardent', emoji: '🔥', mult: 0.7, poids: 1, type: 'aoe' },
      { nom: 'Coup de griffes', emoji: '🐾', mult: 1.1, poids: 3, type: 'mono' },
    ],
  },
  gardienEternel: {
    nom: 'Gardien éternel', emoji: '⚱️', niveau: 20, boss: true, hp: 1200, atk: 50, agi: 9, xp: 900, po: [350, 500],
    drops: [
      { id: 'ecaille-draconique', chance: 1 }, { id: 'ecaille-draconique', chance: 0.5 },
      { id: 'noyau-golem', chance: 1 }, { id: 'cristal-givre', chance: 0.8 },
    ],
    attaques: [
      { nom: 'Jugement', emoji: '⚖️', mult: 1.3, poids: 2, type: 'mono' },
      { nom: 'Séisme', emoji: '🌋', mult: 0.8, poids: 2, type: 'aoe' },
      { nom: 'Regard pétrifiant', emoji: '👁️', mult: 0.6, poids: 1, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.5 } },
    ],
  },
};

// =====================================================================
// Zones du monde
// =====================================================================
const EXPLORATIONS_POUR_BOSS = 3;

const ZONES = [
  {
    id: 'plaines', nom: 'Plaines de l’Aube', emoji: '🌾', niveauMin: 1, plage: 'niv. 1-3',
    desc: 'Des prairies dorées où rôdent gobelins et bêtes sauvages. Le point de départ de tous les aventuriers.',
    monstres: ['gobelin', 'loup', 'sanglier'], boss: 'loupAlpha',
    recolte: [{ id: 'fibre-sauvage', chance: 0.9 }, { id: 'herbe-lunaire', chance: 0.55 }],
  },
  {
    id: 'foret', nom: 'Forêt des Murmures', emoji: '🌲', niveauMin: 3, plage: 'niv. 3-6',
    desc: 'Une forêt dense où les arbres semblent chuchoter. Méfiez-vous des toiles entre les branches.',
    monstres: ['araignee', 'bandit', 'treant'], boss: 'araigneeMatriarche',
    recolte: [{ id: 'bois-chene', chance: 0.8 }, { id: 'seve-ambree', chance: 0.5 }, { id: 'soie-araignee', chance: 0.25 }],
  },
  {
    id: 'collines', nom: 'Collines de Cuivre', emoji: '⛰️', niveauMin: 6, plage: 'niv. 6-10',
    desc: 'Des collines rousses percées de mines. Les clans orcs y font régner leur loi.',
    monstres: ['orc', 'chamanGobelin', 'golemMineur'], boss: 'chefOrc',
    recolte: [{ id: 'minerai-cuivre', chance: 0.8 }, { id: 'minerai-fer', chance: 0.45 }],
  },
  {
    id: 'marais', nom: 'Marais de Brumeciel', emoji: '🐸', niveauMin: 8, plage: 'niv. 8-11',
    desc: 'Des eaux stagnantes voilées de brume, où fleurit le précieux lotus noir. Ne buvez pas l’eau.',
    monstres: ['grenouilleGeante', 'sorciereMarais', 'serpentVoile'], boss: 'hydreBrumes',
    recolte: [{ id: 'lotus-noir', chance: 0.6 }, { id: 'herbe-lunaire', chance: 0.5 }, { id: 'seve-ambree', chance: 0.35 }],
  },
  {
    id: 'cryptes', nom: 'Cryptes Oubliées', emoji: '🕯️', niveauMin: 10, plage: 'niv. 10-14',
    desc: 'Les tombeaux d’un royaume disparu. Ses habitants n’apprécient pas les visites.',
    monstres: ['squelette', 'archerSquelette', 'pretreDechu', 'spectre'], boss: 'roiDechu',
    recolte: [{ id: 'os-ancien', chance: 0.8 }, { id: 'poussiere-spectre', chance: 0.4 }],
  },
  {
    id: 'desert', nom: 'Désert d’Ambrezine', emoji: '🏜️', niveauMin: 12, plage: 'niv. 12-16',
    desc: 'Un océan de dunes ambrées. Sous le sable dorment des perles… et des choses qui n’aiment pas être dérangées.',
    monstres: ['scorpionGeant', 'banditDunes', 'elementaireSable'], boss: 'verDesSables',
    recolte: [{ id: 'perle-des-sables', chance: 0.5 }, { id: 'minerai-fer', chance: 0.4 }, { id: 'os-ancien', chance: 0.3 }],
  },
  {
    id: 'pics', nom: 'Pics Gelés', emoji: '🏔️', niveauMin: 14, plage: 'niv. 14-18',
    desc: 'Des sommets balayés par le blizzard. Le froid y est une arme, et les cristaux un trésor.',
    monstres: ['loupGlaces', 'elementaireGivre', 'yeti'], boss: 'elementaireAncien',
    recolte: [{ id: 'cristal-givre', chance: 0.75 }, { id: 'minerai-fer', chance: 0.35 }],
  },
  {
    id: 'profondeurs', nom: 'Cœur des Profondeurs', emoji: '🌋', niveauMin: 18, plage: 'niv. 18-20',
    desc: 'Le cœur incandescent du monde, où veille le Gardien éternel. Le défi ultime.',
    monstres: ['golemAncien', 'ombre', 'dragonnet'], boss: 'gardienEternel',
    recolte: [{ id: 'noyau-golem', chance: 0.5 }, { id: 'ecaille-draconique', chance: 0.3 }, { id: 'poussiere-spectre', chance: 0.5 }],
  },
];

// =====================================================================
// Terres lointaines (v10, niveaux 22-50) : quatre paliers, chacun avec
// DEUX zones jumelles aux récoltes radicalement différentes. À partir
// du palier 38, les monstres sont taillés pour une équipe.
// =====================================================================
Object.assign(MONSTRES, {
  // ----- Jungle de Vaï-Sombre (niv. 22-28) — plantes et venins -----
  panthereOmbre: {
    nom: 'Panthère d’ombre', emoji: '🐆', niveau: 24, hp: 381, atk: 39, agi: 14, xp: 198, po: [24, 48],
    drops: [{ id: 'liane-tressee', chance: 0.4 }, { id: 'venin-concentre', chance: 0.2 }],
    attaques: [
      { nom: 'Griffes jumelles', emoji: '🐾', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Bond des ténèbres', emoji: '🌑', mult: 1.4, poids: 1, type: 'mono' },
    ],
  },
  grenouilleDard: {
    nom: 'Grenouille-dard', emoji: '🐸', niveau: 23, hp: 352, atk: 37, agi: 11, xp: 183, po: [22, 44],
    drops: [{ id: 'venin-concentre', chance: 0.35 }, { id: 'orchidee-lunaire', chance: 0.2 }],
    attaques: [
      { nom: 'Langue-harpon', emoji: '👅', mult: 1.0, poids: 3, type: 'mono' },
      { nom: 'Crachat venimeux', emoji: '🧪', mult: 0.8, poids: 2, type: 'mono', effet: { type: 'poison', degats: 12, duree: 2 } },
    ],
  },
  hommeLiane: {
    nom: 'Homme-liane', emoji: '🌿', niveau: 26, hp: 443, atk: 42, agi: 8, xp: 230, po: [26, 52],
    drops: [{ id: 'liane-tressee', chance: 0.5 }, { id: 'orchidee-lunaire', chance: 0.25 }],
    attaques: [
      { nom: 'Fouet de liane', emoji: '🌿', mult: 1.0, poids: 3, type: 'mono' },
      { nom: 'Sève réparatrice', emoji: '💚', valeur: 52, poids: 1, type: 'soin', nomSoin: true },
    ],
  },
  matriarcheSarpense: {
    nom: 'Matriarche Sarpense', emoji: '🐍', niveau: 28, boss: true, hp: 2142, atk: 56, agi: 12, xp: 1325, po: [168, 280],
    drops: [{ id: 'orchidee-lunaire', chance: 1 }, { id: 'venin-concentre', chance: 0.8 }],
    attaques: [
      { nom: 'Morsure colossale', emoji: '🐍', mult: 1.2, poids: 3, type: 'mono' },
      { nom: 'Étreinte broyeuse', emoji: '💫', mult: 0.9, poids: 1, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.3 } },
      { nom: 'Nuée de serpenteaux', emoji: '🐍', mult: 0.75, poids: 1, type: 'aoe', effet: { type: 'poison', degats: 14, duree: 2 } },
    ],
  },

  // ----- Falaises Hurlantes (niv. 22-28) — minéral et plumes -----
  harpieHurlante: {
    nom: 'Harpie hurlante', emoji: '🦅', niveau: 23, hp: 352, atk: 37, agi: 13, xp: 183, po: [22, 44],
    drops: [{ id: 'plume-de-rokh', chance: 0.4 }, { id: 'cristal-hurleur', chance: 0.15 }],
    attaques: [
      { nom: 'Serres plongeantes', emoji: '🦅', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Cri perçant', emoji: '📢', mult: 0.7, poids: 1, type: 'aoe', effet: { type: 'affaibli', duree: 2 } },
    ],
  },
  gargouilleVigie: {
    nom: 'Gargouille-vigie', emoji: '🗿', niveau: 25, hp: 411, atk: 40, agi: 6, xp: 214, po: [25, 50],
    drops: [{ id: 'basalte-poli', chance: 0.5 }],
    attaques: [
      { nom: 'Poing de pierre', emoji: '🗿', mult: 1.15, poids: 3, type: 'mono' },
      { nom: 'Chute contrôlée', emoji: '💢', mult: 1.45, poids: 1, type: 'mono' },
    ],
  },
  elementaireBourrasque: {
    nom: 'Élémentaire de bourrasque', emoji: '🌬️', niveau: 27, hp: 476, atk: 43, agi: 14, xp: 247, po: [27, 54],
    drops: [{ id: 'cristal-hurleur', chance: 0.35 }, { id: 'plume-de-rokh', chance: 0.3 }],
    attaques: [
      { nom: 'Rafale tranchante', emoji: '🌬️', mult: 1.0, poids: 2, type: 'mono' },
      { nom: 'Tourbillon hurlant', emoji: '🌪️', mult: 0.8, poids: 1, type: 'aoe' },
    ],
  },
  rokhTempetueux: {
    nom: 'Rokh Tempétueux', emoji: '🦅', niveau: 28, boss: true, hp: 2142, atk: 56, agi: 15, xp: 1325, po: [168, 280],
    drops: [{ id: 'plume-de-rokh', chance: 1 }, { id: 'basalte-poli', chance: 0.8 }],
    attaques: [
      { nom: 'Piqué foudroyant', emoji: '⚡', mult: 1.25, poids: 3, type: 'mono' },
      { nom: 'Battement d’ouragan', emoji: '🌪️', mult: 0.8, poids: 2, type: 'aoe' },
    ],
  },

  // ----- Abysses d'Émeraude (niv. 30-36) — trésors de la mer -----
  mureneRodeuse: {
    nom: 'Murène rôdeuse', emoji: '🐍', niveau: 31, hp: 620, atk: 49, agi: 12, xp: 322, po: [31, 62],
    drops: [{ id: 'nacre-abyssale', chance: 0.4 }, { id: 'corail-sanglant', chance: 0.2 }],
    attaques: [
      { nom: 'Morsure éclair', emoji: '⚡', mult: 1.15, poids: 3, type: 'mono' },
      { nom: 'Reptation sournoise', emoji: '🌊', mult: 1.4, poids: 1, type: 'mono' },
    ],
  },
  crabeCuirasse: {
    nom: 'Crabe cuirassé', emoji: '🦀', niveau: 32, hp: 659, atk: 50, agi: 6, xp: 342, po: [32, 64],
    drops: [{ id: 'corail-sanglant', chance: 0.45 }, { id: 'nacre-abyssale', chance: 0.25 }],
    attaques: [
      { nom: 'Pince-étau', emoji: '🦀', mult: 1.1, poids: 3, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.2 } },
      { nom: 'Carapace projetée', emoji: '🛡️', mult: 0.85, poids: 1, type: 'aoe' },
    ],
  },
  sireneFuneste: {
    nom: 'Sirène funeste', emoji: '🧜‍♀️', niveau: 34, hp: 741, atk: 53, agi: 11, xp: 384, po: [34, 68],
    drops: [{ id: 'larme-de-sirene', chance: 0.3 }, { id: 'nacre-abyssale', chance: 0.3 }],
    attaques: [
      { nom: 'Complainte déchirante', emoji: '🎶', mult: 1.0, poids: 2, type: 'mono', effet: { type: 'affaibli', duree: 2 } },
      { nom: 'Chant des abysses', emoji: '💙', valeur: 68, poids: 1, type: 'soin' },
    ],
  },
  leviathanCorallien: {
    nom: 'Léviathan Corallien', emoji: '🐋', niveau: 36, boss: true, hp: 5210, atk: 70, agi: 10, xp: 3070, po: [216, 360],
    drops: [{ id: 'larme-de-sirene', chance: 1 }, { id: 'corail-sanglant', chance: 0.9 }],
    attaques: [
      { nom: 'Mâchoire océane', emoji: '🐋', mult: 1.2, poids: 3, type: 'mono' },
      { nom: 'Raz-de-marée', emoji: '🌊', mult: 0.85, poids: 2, type: 'aoe' },
      { nom: 'Harpon de corail', emoji: '🔱', mult: 1.45, poids: 1, type: 'mono' },
    ],
  },

  // ----- Steppe des Cendres (niv. 30-36) — feu et os -----
  chacalCendre: {
    nom: 'Chacal cendré', emoji: '🐺', niveau: 31, hp: 620, atk: 49, agi: 13, xp: 322, po: [31, 62],
    drops: [{ id: 'cendre-fertile', chance: 0.45 }],
    attaques: [
      { nom: 'Crocs fumants', emoji: '🔥', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Meute de cendre', emoji: '💨', mult: 0.8, poids: 1, type: 'aoe' },
    ],
  },
  salamandreBraise: {
    nom: 'Salamandre de braise', emoji: '🦎', niveau: 33, hp: 699, atk: 52, agi: 10, xp: 362, po: [33, 66],
    drops: [{ id: 'coeur-de-braise', chance: 0.25 }, { id: 'obsidienne-brute', chance: 0.35 }],
    attaques: [
      { nom: 'Langue de feu', emoji: '🔥', mult: 1.05, poids: 3, type: 'mono', effet: { type: 'poison', degats: 15, duree: 2 } },
      { nom: 'Queue incandescente', emoji: '☄️', mult: 1.35, poids: 1, type: 'mono' },
    ],
  },
  ogreMagmatique: {
    nom: 'Ogre magmatique', emoji: '👹', niveau: 35, hp: 783, atk: 55, agi: 7, xp: 406, po: [35, 70],
    drops: [{ id: 'obsidienne-brute', chance: 0.45 }, { id: 'coeur-de-braise', chance: 0.2 }],
    attaques: [
      { nom: 'Massue en fusion', emoji: '🌋', mult: 1.2, poids: 3, type: 'mono' },
      { nom: 'Piétinement sismique', emoji: '💢', mult: 0.85, poids: 1, type: 'aoe', effet: { type: 'etourdi', duree: 1, chance: 0.2 } },
    ],
  },
  behemothCendre: {
    nom: 'Béhémoth de Cendre', emoji: '🌋', niveau: 36, boss: true, hp: 5210, atk: 70, agi: 8, xp: 3070, po: [216, 360],
    drops: [{ id: 'coeur-de-braise', chance: 1 }, { id: 'obsidienne-brute', chance: 0.9 }],
    attaques: [
      { nom: 'Poing de basalte', emoji: '🌋', mult: 1.2, poids: 3, type: 'mono' },
      { nom: 'Nuée ardente', emoji: '🔥', mult: 0.85, poids: 2, type: 'aoe', effet: { type: 'poison', degats: 16, duree: 2 } },
    ],
  },

  // ----- Forêt Pétrifiée (niv. 38-44, équipe conseillée) -----
  treantPetrifie: {
    nom: 'Tréant pétrifié', emoji: '🗿', niveau: 39, hp: 1450, atk: 61, agi: 6, xp: 501, po: [39, 78],
    drops: [{ id: 'bois-petrifie', chance: 0.45 }, { id: 'ambre-noir', chance: 0.2 }],
    attaques: [
      { nom: 'Branche de granit', emoji: '🪨', mult: 1.15, poids: 3, type: 'mono' },
      { nom: 'Racines sismiques', emoji: '💢', mult: 0.85, poids: 1, type: 'aoe' },
    ],
  },
  basilicRunique: {
    nom: 'Basilic runique', emoji: '🦎', niveau: 41, hp: 1599, atk: 63, agi: 11, xp: 552, po: [41, 82],
    drops: [{ id: 'ambre-noir', chance: 0.4 }, { id: 'sphere-runique', chance: 0.12 }],
    attaques: [
      { nom: 'Regard pétrifiant', emoji: '👁️', mult: 0.95, poids: 2, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.3 } },
      { nom: 'Morsure gravée', emoji: '🦷', mult: 1.25, poids: 2, type: 'mono' },
    ],
  },
  moissonneurRunique: {
    nom: 'Moissonneur runique', emoji: '⚱️', niveau: 43, hp: 1747, atk: 66, agi: 9, xp: 606, po: [43, 86],
    drops: [{ id: 'sphere-runique', chance: 0.2 }, { id: 'bois-petrifie', chance: 0.4 }],
    attaques: [
      { nom: 'Faux de quartz', emoji: '⚱️', mult: 1.2, poids: 3, type: 'mono', effet: { type: 'drain', part: 0.35 } },
      { nom: 'Moisson d’éclats', emoji: '💎', mult: 0.85, poids: 1, type: 'aoe' },
    ],
  },
  avatarQuartz: {
    nom: 'Avatar de Quartz', emoji: '💎', niveau: 44, boss: true, hp: 7712, atk: 85, agi: 9, xp: 3170, po: [264, 440],
    drops: [{ id: 'sphere-runique', chance: 1 }, { id: 'ambre-noir', chance: 0.9 }],
    attaques: [
      { nom: 'Lame cristalline', emoji: '💎', mult: 1.2, poids: 3, type: 'mono' },
      { nom: 'Éclats en éventail', emoji: '✨', mult: 0.85, poids: 2, type: 'aoe' },
      { nom: 'Prisme écrasant', emoji: '🔷', mult: 1.5, poids: 1, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.25 } },
    ],
  },

  // ----- Vallée des Géants (niv. 38-44, équipe conseillée) -----
  geantDechu: {
    nom: 'Géant déchu', emoji: '🗿', niveau: 39, hp: 1450, atk: 61, agi: 6, xp: 501, po: [39, 78],
    drops: [{ id: 'os-de-geant', chance: 0.45 }, { id: 'peau-de-mammouth', chance: 0.2 }],
    attaques: [
      { nom: 'Revers de montagne', emoji: '🗿', mult: 1.2, poids: 3, type: 'mono' },
      { nom: 'Frappe au sol', emoji: '💢', mult: 0.85, poids: 1, type: 'aoe', effet: { type: 'etourdi', duree: 1, chance: 0.2 } },
    ],
  },
  mammouthSpectral: {
    nom: 'Mammouth spectral', emoji: '🦣', niveau: 41, hp: 1599, atk: 63, agi: 7, xp: 552, po: [41, 82],
    drops: [{ id: 'peau-de-mammouth', chance: 0.45 }, { id: 'os-de-geant', chance: 0.3 }],
    attaques: [
      { nom: 'Charge d’outre-monde', emoji: '👻', mult: 1.25, poids: 3, type: 'mono' },
      { nom: 'Barrissement glacé', emoji: '🌫️', mult: 0.8, poids: 1, type: 'aoe', effet: { type: 'affaibli', duree: 2 } },
    ],
  },
  chamanOsseux: {
    nom: 'Chaman des os', emoji: '💀', niveau: 43, hp: 1747, atk: 66, agi: 9, xp: 606, po: [43, 86],
    drops: [{ id: 'relique-antique', chance: 0.15 }, { id: 'os-de-geant', chance: 0.4 }],
    attaques: [
      { nom: 'Volée d’esquilles', emoji: '🦴', mult: 1.05, poids: 2, type: 'mono' },
      { nom: 'Chant des ancêtres géants', emoji: '💚', valeur: 92, poids: 1, type: 'soin' },
    ],
  },
  roiOssements: {
    nom: 'Roi des Ossements', emoji: '👑', niveau: 44, boss: true, hp: 7712, atk: 85, agi: 8, xp: 3170, po: [264, 440],
    drops: [{ id: 'relique-antique', chance: 1 }, { id: 'peau-de-mammouth', chance: 0.9 }],
    attaques: [
      { nom: 'Sceptre fémoral', emoji: '🦴', mult: 1.2, poids: 3, type: 'mono' },
      { nom: 'Avalanche d’os', emoji: '☠️', mult: 0.85, poids: 2, type: 'aoe' },
      { nom: 'Poigne sépulcrale', emoji: '🪦', mult: 1.3, poids: 1, type: 'mono', effet: { type: 'drain', part: 0.4 } },
    ],
  },

  // ----- Citadelle de Foudre (niv. 46-50, équipe requise) -----
  sentinelleAcier: {
    nom: 'Sentinelle d’acier', emoji: '🤖', niveau: 47, hp: 2091, atk: 72, agi: 9, xp: 721, po: [47, 94],
    drops: [{ id: 'acier-celeste', chance: 0.35 }, { id: 'fragment-de-foudre', chance: 0.4 }],
    attaques: [
      { nom: 'Lame à induction', emoji: '⚡', mult: 1.15, poids: 3, type: 'mono' },
      { nom: 'Surtension', emoji: '💥', mult: 0.85, poids: 1, type: 'aoe', effet: { type: 'etourdi', duree: 1, chance: 0.2 } },
    ],
  },
  vouivreOrage: {
    nom: 'Vouivre d’orage', emoji: '🐉', niveau: 48, hp: 2183, atk: 74, agi: 13, xp: 751, po: [48, 96],
    drops: [{ id: 'fragment-de-foudre', chance: 0.45 }, { id: 'plume-d-archon', chance: 0.1 }],
    attaques: [
      { nom: 'Souffle voltaïque', emoji: '⚡', mult: 1.1, poids: 2, type: 'mono' },
      { nom: 'Tempête d’ailes', emoji: '🌩️', mult: 0.85, poids: 2, type: 'aoe' },
    ],
  },
  forgeronFoudroye: {
    nom: 'Forgeron foudroyé', emoji: '⚒️', niveau: 49, hp: 2278, atk: 75, agi: 8, xp: 782, po: [49, 98],
    drops: [{ id: 'acier-celeste', chance: 0.4 }, { id: 'fragment-de-foudre', chance: 0.35 }],
    attaques: [
      { nom: 'Marteau conducteur', emoji: '⚒️', mult: 1.25, poids: 3, type: 'mono' },
      { nom: 'Gerbe d’étincelles', emoji: '✨', mult: 0.8, poids: 1, type: 'aoe', effet: { type: 'affaibli', duree: 2 } },
    ],
  },
  archonteTempete: {
    nom: 'Archonte de la Tempête', emoji: '⛈️', niveau: 50, boss: true, hp: 9916, atk: 96, agi: 12, xp: 4070, po: [300, 500],
    drops: [{ id: 'plume-d-archon', chance: 1 }, { id: 'acier-celeste', chance: 0.9 }],
    attaques: [
      { nom: 'Jugement fulgurant', emoji: '⚡', mult: 1.25, poids: 3, type: 'mono' },
      { nom: 'Orage total', emoji: '⛈️', mult: 0.9, poids: 2, type: 'aoe' },
      { nom: 'Lance du firmament', emoji: '🌩️', mult: 1.5, poids: 1, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.3 } },
    ],
  },

  // ----- Néant Scintillant (niv. 46-50, équipe requise) -----
  horreurDuVide: {
    nom: 'Horreur du vide', emoji: '👁️', niveau: 47, hp: 2091, atk: 72, agi: 11, xp: 721, po: [47, 94],
    drops: [{ id: 'etoffe-du-neant', chance: 0.45 }],
    attaques: [
      { nom: 'Tentacule d’ailleurs', emoji: '🌀', mult: 1.15, poids: 3, type: 'mono', effet: { type: 'drain', part: 0.35 } },
      { nom: 'Regard impossible', emoji: '👁️', mult: 0.8, poids: 1, type: 'aoe', effet: { type: 'affaibli', duree: 2 } },
    ],
  },
  tisseuseEtoiles: {
    nom: 'Tisseuse d’étoiles', emoji: '🕷️', niveau: 48, hp: 2183, atk: 74, agi: 12, xp: 751, po: [48, 96],
    drops: [{ id: 'eclat-d-etoile', chance: 0.4 }, { id: 'etoffe-du-neant', chance: 0.3 }],
    attaques: [
      { nom: 'Fil de constellation', emoji: '✨', mult: 1.1, poids: 2, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.25 } },
      { nom: 'Toile cosmique', emoji: '🕸️', mult: 0.85, poids: 2, type: 'aoe' },
    ],
  },
  echoNeant: {
    nom: 'Écho du néant', emoji: '🌌', niveau: 49, hp: 2278, atk: 75, agi: 13, xp: 782, po: [49, 98],
    drops: [{ id: 'essence-primordiale', chance: 0.12 }, { id: 'eclat-d-etoile', chance: 0.35 }],
    attaques: [
      { nom: 'Réplique d’annihilation', emoji: '🌌', mult: 1.2, poids: 3, type: 'mono' },
      { nom: 'Résonance du rien', emoji: '🔇', mult: 0.85, poids: 1, type: 'aoe' },
    ],
  },
  devoreurMondes: {
    nom: 'Dévoreur de Mondes', emoji: '🕳️', niveau: 50, boss: true, hp: 9916, atk: 96, agi: 11, xp: 4070, po: [300, 500],
    drops: [{ id: 'essence-primordiale', chance: 1 }, { id: 'eclat-d-etoile', chance: 0.9 }],
    attaques: [
      { nom: 'Gueule d’horizon', emoji: '🕳️', mult: 1.25, poids: 3, type: 'mono', effet: { type: 'drain', part: 0.4 } },
      { nom: 'Effondrement local', emoji: '🌌', mult: 0.9, poids: 2, type: 'aoe' },
    ],
  },
});

ZONES.push(
  {
    id: 'jungle-vai', nom: 'Jungle de Vaï-Sombre', emoji: '🌴', niveauMin: 22, plage: 'niv. 22-28',
    desc: 'Une jungle si dense que le jour n’y descend jamais tout à fait. Tout y pousse, tout y mord.',
    monstres: ['grenouilleDard', 'panthereOmbre', 'hommeLiane'], boss: 'matriarcheSarpense',
    recolte: [{ id: 'liane-tressee', chance: 0.8 }, { id: 'orchidee-lunaire', chance: 0.5 }, { id: 'venin-concentre', chance: 0.3 }],
  },
  {
    id: 'falaises-hurlantes', nom: 'Falaises Hurlantes', emoji: '🪨', niveauMin: 22, plage: 'niv. 22-28',
    desc: 'Des à-pics battus par des vents qui hurlent des noms. Le minerai y est superbe — l’accrochage aussi.',
    monstres: ['harpieHurlante', 'gargouilleVigie', 'elementaireBourrasque'], boss: 'rokhTempetueux',
    recolte: [{ id: 'basalte-poli', chance: 0.8 }, { id: 'plume-de-rokh', chance: 0.5 }, { id: 'cristal-hurleur', chance: 0.3 }],
  },
  {
    id: 'abysses-emeraude', nom: 'Abysses d’Émeraude', emoji: '🐚', niveauMin: 30, plage: 'niv. 30-36',
    desc: 'Une cité engloutie dont les lanternes brûlent encore sous l’eau. Ses trésors n’attendent que des poumons solides.',
    monstres: ['mureneRodeuse', 'crabeCuirasse', 'sireneFuneste'], boss: 'leviathanCorallien',
    recolte: [{ id: 'nacre-abyssale', chance: 0.7 }, { id: 'corail-sanglant', chance: 0.45 }, { id: 'larme-de-sirene', chance: 0.25 }],
  },
  {
    id: 'steppe-cendres', nom: 'Steppe des Cendres', emoji: '🌋', niveauMin: 30, plage: 'niv. 30-36',
    desc: 'Une plaine grise où la terre couve encore. Les cendres fertilisent tout — surtout les ennuis.',
    monstres: ['chacalCendre', 'salamandreBraise', 'ogreMagmatique'], boss: 'behemothCendre',
    recolte: [{ id: 'cendre-fertile', chance: 0.7 }, { id: 'obsidienne-brute', chance: 0.45 }, { id: 'coeur-de-braise', chance: 0.25 }],
  },
  {
    id: 'foret-petrifiee', nom: 'Forêt Pétrifiée', emoji: '🗿', niveauMin: 38, plage: 'niv. 38-44 · équipe conseillée',
    desc: 'Une forêt changée en pierre en une seule nuit, il y a mille ans. Les arbres se souviennent. En équipe, de préférence.',
    monstres: ['treantPetrifie', 'basilicRunique', 'moissonneurRunique'], boss: 'avatarQuartz',
    recolte: [{ id: 'bois-petrifie', chance: 0.75 }, { id: 'ambre-noir', chance: 0.45 }, { id: 'sphere-runique', chance: 0.2 }],
  },
  {
    id: 'vallee-geants', nom: 'Vallée des Géants', emoji: '🦴', niveauMin: 38, plage: 'niv. 38-44 · équipe conseillée',
    desc: 'Le cimetière des géants d’avant les Royaumes. Leurs os valent des fortunes — et ils y tiennent. Venez accompagnés.',
    monstres: ['geantDechu', 'mammouthSpectral', 'chamanOsseux'], boss: 'roiOssements',
    recolte: [{ id: 'os-de-geant', chance: 0.75 }, { id: 'peau-de-mammouth', chance: 0.45 }, { id: 'relique-antique', chance: 0.2 }],
  },
  {
    id: 'citadelle-foudre', nom: 'Citadelle de Foudre', emoji: '⛈️', niveauMin: 46, plage: 'niv. 46-50 · équipe requise',
    desc: 'La forteresse volante des Archontes, échouée entre deux nuages. Tout y est sous tension. Ne venez pas seul.',
    monstres: ['sentinelleAcier', 'vouivreOrage', 'forgeronFoudroye'], boss: 'archonteTempete',
    recolte: [{ id: 'fragment-de-foudre', chance: 0.7 }, { id: 'acier-celeste', chance: 0.4 }, { id: 'plume-d-archon', chance: 0.15 }],
  },
  {
    id: 'neant-scintillant', nom: 'Néant Scintillant', emoji: '🌌', niveauMin: 46, plage: 'niv. 46-50 · équipe requise',
    desc: 'Une déchirure dans le monde, pleine d’étoiles qui ne sont pas les nôtres. Ce qui en sort n’a pas de nom. Équipe obligatoire — sérieusement.',
    monstres: ['horreurDuVide', 'tisseuseEtoiles', 'echoNeant'], boss: 'devoreurMondes',
    recolte: [{ id: 'etoffe-du-neant', chance: 0.7 }, { id: 'eclat-d-etoile', chance: 0.4 }, { id: 'essence-primordiale', chance: 0.15 }],
  },
);

function zonePar(idZone) {
  return ZONES.find((z) => z.id === idZone);
}

// =====================================================================
// v17 : HISTOIRES DES TERRES — chaque carte cache des histoires uniques,
// découvertes au hasard de l'exploration. Chacune ne se vit qu'une fois
// (collection par héros) ; quand tout est découvert, la carte n'a plus
// de secrets — et le dit.
// recompense : { po?, xp?, soinPct?, materiau? (id de z.recolte) }
// =====================================================================
// =====================================================================
// v19 : LES CHRONIQUES DES TERRES — chaque carte porte UNE histoire
// suivie, en six chapitres qui se découvrent DANS L'ORDRE, au fil des
// explorations. Un personnage récurrent, une intrigue qui monte, et un
// dernier chapitre qui désigne le boss et lâche le présage : à partir de
// là, la créature traque le héros et peut surgir à tout moment.
//   { titre, chapitres: [{ titre, texte, recompense }] }
//   recompense : { po?, xp?, soinPct?, materiau? }
// =====================================================================
const HISTOIRES_ZONES = {
  'plaines': {
    titre: 'La dette de la bergère',
    chapitres: [
      { titre: 'Chapitre 1 — Les épouvantails tournés', texte: 'Depuis trois nuits, tous les épouvantails des Plaines regardent l’ouest. Le vent vient du nord. Personne au village ne les a déplacés, et personne ne tient à s’en charger.', recompense: { po: 12 } },
      { titre: 'Chapitre 2 — Le compte d’Aude', texte: 'Aude, bergère, compte ses bêtes deux fois par jour depuis qu’il en manque une à chaque pleine lune. Pas de sang, pas de laine aux ronces, pas de trace de lutte. « On ne me les prend pas », dit-elle sans quitter l’ouest des yeux. « Elles s’en vont. »', recompense: { xp: 20 } },
      { titre: 'Chapitre 3 — Le sentier mâché', texte: 'Un camp de gobelins plié en hâte. Sur une peau tendue, un calendrier de nuits marquées à l’ocre : les dates sont celles d’Aude, ce qui ne rassure personne. Le long du sentier de l’ouest, l’herbe-lunaire est arrachée par touffes régulières, à hauteur de brebis.', recompense: { materiau: 'herbe-lunaire' } },
      { titre: 'Chapitre 4 — Ce qu’Aude n’avait pas dit', texte: 'Aude finit par parler. La nuit des étoiles rouges, c’est elle qui a mené son agneau vers l’ouest, contre un hiver doux et un troupeau épargné. Depuis, elle honore l’échéance à chaque pleine lune. Le troupeau ne s’enfuit pas : il est livré. Elle recoud vos plaies pendant qu’elle raconte ; ça lui occupe les mains.', recompense: { soinPct: 0.25 } },
      { titre: 'Chapitre 5 — Le bâton planté', texte: 'Cette lune-ci, Aude plante son bâton dans la terre et ne conduit personne. Les loups ont cessé de chasser : ils longent les haies sans hâte, comme on relève une garde. Les gobelins ont plié leurs tentes, les sangliers ont quitté les blés. La plaine n’a jamais été aussi calme.', recompense: { po: 18, xp: 25 } },
      { titre: 'Chapitre 6 — L’agneau devenu grand', texte: 'L’agneau d’Aude a grandi : c’est le Loup alpha, et puisqu’on ne lui apporte plus son dû, il vient le prendre. Sur le sentier de l’ouest, il a flairé l’herbe coupée et la main qui l’a coupée. Il connaît votre odeur, maintenant. Il viendra à la prochaine lune, et il n’aura besoin de personne pour lui ouvrir l’enclos.', recompense: { xp: 45 } },
    ],
  },
  'foret': {
    titre: 'L’entonnoir de soie',
    chapitres: [
      { titre: 'Chapitre 1 — Les toiles vides', texte: 'Sur une demi-lieue, les arbres ont cessé de murmurer. À la place, des toiles neuves tendues d’un tronc à l’autre, larges comme des draps. Aucune n’abrite d’araignée. Aucune n’a pris la moindre mouche.', recompense: { po: 25 } },
      { titre: 'Chapitre 2 — Les relevés de Perrin', texte: 'Perrin, cartographe, recopie les toiles depuis vingt ans et vend aux bûcherons les routes qu’il y lit. Cette année, ses clients ne repassent plus commander. Il vous montre ses derniers relevés : les fils ne dessinent plus des chemins, mais des cercles, et tous se resserrent vers le même point.', recompense: { xp: 35 } },
      { titre: 'Chapitre 3 — Les larmes de sève', texte: 'Sur le terrain, les coupes fraîches s’alignent en un couloir bien droit, ce qui n’arrive jamais par hasard dans une forêt. Les tréants s’en sont écartés de trois pas dans le même mois — un arbre qui marche, ça se remarque. Là où ils se tenaient, la sève ambrée a coulé et durci en larmes grosses comme le poing.', recompense: { materiau: 'seve-ambree' } },
      { titre: 'Chapitre 4 — Vingt ans de bons services', texte: 'Perrin superpose vingt ans de relevés sous sa lampe. Les toiles ne lui indiquaient pas des routes : elles lui indiquaient où faire couper, et il a obéi chaque fois, contre bon prix. Vingt ans à mesurer pour quelqu’un qui ne sait pas écrire mais qui tisse très bien. Il vous laisse son onguent de sève ; il dit qu’il n’en aura plus l’usage.', recompense: { soinPct: 0.3 } },
      { titre: 'Chapitre 5 — Le col du couloir', texte: 'Les bandits ont déserté la route : la forêt « prend sa part » désormais, et ils n’ont pas les moyens de faire concurrence. Les araignées descendent le couloir en file, du haut vers le bas, sans se disputer un seul fil. Perrin brûle ses cartes, puis va se planter à l’entrée avec une lanterne, pour prévenir ceux qui passeraient encore.', recompense: { po: 38, xp: 50 } },
      { titre: 'Chapitre 6 — Ce qui attend au fond', texte: 'Le couloir n’est pas un chemin : c’est un entonnoir, et la Matriarche soyeuse en occupe le fond depuis vingt ans. Elle n’a jamais eu à tisser grand. Il suffisait de faire abattre les arbres au bon endroit et d’attendre que la forêt descende. Vous avez tiré sur un de ses fils en récoltant la sève ; elle l’a senti bouger. Elle ne vous laissera pas le loisir d’arriver jusqu’au fond.', recompense: { xp: 90 } },
    ],
  },
  'collines': {
    titre: 'L’écho qui commande',
    chapitres: [
      { titre: 'Chapitre 1 — Un seul mot', texte: 'Les clans se défiaient d’une colline à l’autre à qui hurlerait le plus fort ; ce mois-ci, plus personne ne crie. L’écho de la vallée, lui, continue, avec ses trois secondes de retard habituelles. Il répète un seul mot, toujours le même : « encore ».', recompense: { po: 40 } },
      { titre: 'Chapitre 2 — La colonne « ailleurs »', texte: 'Ordha pèse le minerai à la sortie des galeries depuis quinze ans, et ses registres sont d’une propreté exemplaire. Le cuivre part vers le marché, comme toujours. Le fer a triplé et ne descend plus. Elle vous montre la colonne des destinations, où elle a fini par écrire « ailleurs ». Quinze ans qu’elle n’avait pas eu à inventer une case.', recompense: { xp: 60 } },
      { titre: 'Chapitre 3 — La galerie hors plan', texte: 'Les convois de fer montent au lieu de descendre, jusqu’à une galerie qui ne figure sur aucun plan de mine. Dedans, plus de pioches : des moules, des enclumes, et une chaleur qui ne vient pas de la roche. Ordha vous laisse emporter une gueuse de fer, à titre de pièce comptable, dit-elle.', recompense: { materiau: 'minerai-fer' } },
      { titre: 'Chapitre 4 — La cadence', texte: 'Au fond de la galerie, un chaman gobelin frappe l’enclume à intervalles réguliers, et la vallée reprend le coup de versant en versant. L’écho fidèle n’a jamais été un écho : c’est un ordre relayé jusqu’aux dernières collines, que tous les clans reçoivent en même temps. Voilà pourquoi personne ne se défie plus — on ne se dispute pas quand on a la même consigne. Ordha soigne vos brûlures et referme son registre.', recompense: { soinPct: 0.35 } },
      { titre: 'Chapitre 5 — La balance devant la porte', texte: 'Les convois ne cachent plus rien : haches neuves, plaques, mors de guerre, tout remonte vers le versant nord. Les golems mineurs ne creusent plus, ils portent, et ils ne redescendent pas. Ordha refuse de peser une charge de plus et pose sa balance en travers de l’entrée. On lui accorde une nuit pour changer d’avis.', recompense: { po: 60, xp: 80 } },
      { titre: 'Chapitre 6 — Le compte est juste', texte: 'Le Chef de guerre orc n’a jamais voulu de mineurs : il voulait un arsenal, et il l’a fait sortir des collines cuillerée par cuillerée, sans qu’un clan songe à le contredire. La balance d’Ordha lui a appris qu’il manquait une gueuse au total, et qui l’avait emportée. Il a demandé votre nom au chaman, qui le lui a donné. La cadence a changé : le mot que la vallée répète, désormais, c’est le vôtre.', recompense: { xp: 150 } },
    ],
  },
  'marais': {
    titre: 'Le couvercle de Brumeciel',
    chapitres: [
      { titre: 'Chapitre 1 — L’eau qui baisse', texte: 'Le marais perd un pouce d’eau par semaine, sans que rien ne s’écoule nulle part. Les lotus noirs se retrouvent à sec sur la vase et fleurissent quand même, ce qui n’est pas dans leurs habitudes. Les crapauds, eux, ont cessé de chanter.', recompense: { po: 50 } },
      { titre: 'Chapitre 2 — Le thé de Ganne', texte: 'Ganne tient son échoppe de thés légèrement prophétiques au bord du chenal. Elle a déménagé trois fois cette année, toujours pour suivre l’eau. Elle vous sert une tasse : au fond, les feuilles dessinent un cercle qui se referme. « Ça, dit-elle, ce n’est pas de la prophétie. C’est de l’arithmétique. »', recompense: { xp: 72 } },
      { titre: 'Chapitre 3 — La rue basse', texte: 'La vase découverte n’est pas de la vase : ce sont des marches, un quai, une rue bordée de maisons. Un village entier, noyé volontairement, dit Ganne, « pour boucher quelque chose ». Sur les seuils, les lotus noirs ont pris racine dans les joints et fleurissent en rang. Vous en cueillez un ; Ganne détourne les yeux.', recompense: { materiau: 'lotus-noir' } },
      { titre: 'Chapitre 4 — Ce que les lanternes balisent', texte: 'Ganne ouvre enfin le registre de sa lignée. Le marais n’est pas un marais, c’est un couvercle : on a noyé la vallée en une saison, il y a deux siècles, et les sorcières se relaient depuis pour tenir le niveau. Les lanternes des noyés ne balisent pas un chemin sûr, elles balisent la digue. L’eau qui baisse n’est donc pas un phénomène, c’est une fuite. Elle vous soigne, puis vous conseille de dormir tant que c’est encore une option.', recompense: { soinPct: 0.4 } },
      { titre: 'Chapitre 5 — La brume tiède', texte: 'La brume monte à mesure que l’eau descend, tiède, régulière, et elle sent l’haleine. Les serpents des voiles quittent les roseaux par centaines, tous dans le même sens, et les grenouilles colossales ne mangent plus rien. Ganne verse ses réserves de lotus noir dans le chenal — trois générations de récolte en une nuit — puis reste debout sur son ponton pour voir si ça tient.', recompense: { po: 75, xp: 100 } },
      { titre: 'Chapitre 6 — Ce qu’on avait mis dessous', texte: 'Ce n’est pas la digue qui perd son eau : c’est l’Hydre des brumes qui la boit, tête après tête, depuis qu’elle a fini de dormir. On ne l’a pas enfermée dans le marais — on a fait le marais autour d’elle, et deux siècles durant, cela a suffi. Le silence des crapauds s’explique enfin : elle écoute. Elle vous a entendu descendre la rue basse, et elle remonte déjà le chenal.', recompense: { xp: 180 } },
    ],
  },
  'cryptes': {
    titre: 'Le compte des bougies',
    chapitres: [
      { titre: 'Chapitre 1 — Les mèches taillées', texte: 'Dans la crypte basse, toutes les bougies sont neuves. Cire fraîche, mèches taillées net, pas une coulure. Les morts n’ont pas besoin de lumière, et pourtant quelqu’un paie l’éclairage.', recompense: { po: 60 } },
      { titre: 'Chapitre 2 — La cirière Ombeline', texte: 'À l’entrée de la nécropole, Ombeline vend des cierges depuis quarante ans. Elle en livre trois cents par mois à un client qu’elle n’a jamais vu, payés d’avance en pièces à l’effigie d’un roi que personne ne reconnaît. « Bon payeur », dit-elle. Puis, plus bas : « Mauvais voisin. »', recompense: { xp: 85 } },
      { titre: 'Chapitre 3 — Le registre d’Ombeline', texte: 'Son livre de comptes remonte à sa grand-mère : même commande, même écriture, même main qui ne tremble pas. Depuis que les dalles se descellent, la commande a doublé. Vous recopiez les chiffres au dos d’un fémur, faute de papier dans la région.', recompense: { materiau: 'os-ancien' } },
      { titre: 'Chapitre 4 — Ce que les bougies éclairent', texte: 'Vous recomptez les flammes, couloir par couloir, et Ombeline pointe avec vous. Aucune ne balise un chemin : chacune brûle devant un cercueil vide. Ce n’est pas un éclairage, c’est un inventaire. Pour réfléchir, vous vous asseyez dans l’un des cercueils, remarquablement confortable ; elle vous laisse une heure et un bandage.', recompense: { soinPct: 0.4 } },
      { titre: 'Chapitre 5 — Ombeline ferme boutique', texte: 'Les bougies s’allument devant vous et ne s’éteignent plus derrière. Ombeline cloue ses volets : elle a enfin reconnu le sceau qui timbre ses commandes, celui du couronnement. Elle vous règle ses arriérés d’un coup — elle ne compte plus tenir de comptes.', recompense: { po: 90, xp: 115 } },
      { titre: 'Chapitre 6 — L’appel du Roi déchu', texte: 'Le Roi déchu n’a jamais abdiqué : il fait l’appel. Une bougie par soldat retrouvé, un cercueil refermé par nom prononcé, et l’armée est presque au complet. Il en reste une, à l’écart, posée sur un couvercle taillé à votre mesure. Elle vient de s’allumer.', recompense: { xp: 210 } },
    ],
  },
  'desert': {
    titre: 'Les bornes penchées',
    chapitres: [
      { titre: 'Chapitre 1 — Le sable remonte le vent', texte: 'Les dunes d’Ambrezine migrent contre le vent, de trois pas par nuit. Les bornes de la route caravanière penchent toutes du même côté, vers un point du désert où il n’y a rien. Rien, précisément : c’est ce qui intrigue.', recompense: { po: 70 } },
      { titre: 'Chapitre 2 — Nazir le borneur', texte: 'Nazir replante les bornes que le sable avale, une saison sur deux, payé par les caravanes. Cette année, il les a replantées trois fois. « Elles glissent toutes vers le même endroit, dit-il. Moi je borne, je ne discute pas. »', recompense: { xp: 95 } },
      { titre: 'Chapitre 3 — Le tracé', texte: 'Vous relevez avec lui la dérive de chaque borne, puis vous joignez les points : ce n’est pas une ligne, c’est une spirale. En son centre, le sable est trié si finement que les perles remontent seules. Nazir refuse d’en ramasser. Vous n’avez pas ses scrupules.', recompense: { materiau: 'perle-des-sables' } },
      { titre: 'Chapitre 4 — La règle des caravaniers', texte: 'Nazir récite la vieille consigne des convois : ne jamais planter une borne droite. On croyait à une astuce contre le vent ; c’était un code, et l’inclinaison disait de quel côté la chose tournait, dessous. Sous chaque borne, les anciens avaient creusé une citerne pour les guetteurs. La vôtre est encore pleine, et l’eau est bonne.', recompense: { soinPct: 0.45 } },
      { titre: 'Chapitre 5 — Nazir arrache', texte: 'À l’aube, le sable bourdonne : les élémentaires quittent la plaine pour les rochers, et les bandits des dunes lèvent le camp sans rien voler. Nazir, lui, s’est mis à arracher ses bornes. « On ne borne pas un lit. On le quitte. » Il vous verse sa saison entière pour l’escorter jusqu’à la roche.', recompense: { po: 105, xp: 130 } },
      { titre: 'Chapitre 6 — Ce qu’il refuse de digérer', texte: 'Le Ver des sables colossal tourne dans son lit depuis toujours, lentement, et la spirale se resserre parce qu’on lui prend ses perles — les seules choses qu’il recrache. Chaque poignée emportée le fait remonter d’une coudée. Ce matin, le centre du tracé a bougé : il est exactement sous vos pieds.', recompense: { xp: 240 } },
    ],
  },
  'pics': {
    titre: 'La carte de givre',
    chapitres: [
      { titre: 'Chapitre 1 — Le dessin du matin', texte: 'Chaque matin, le givre dessine sur les volets du refuge la même carte du massif : arêtes, cols, glaciers, tout y est. Tout, sauf une vallée, laissée blanche. Le givre a le droit de mal dessiner ; il n’a pas le droit d’être aussi précis.', recompense: { po: 85 } },
      { titre: 'Chapitre 2 — Hesva, gardienne des Trois-Vents', texte: 'Hesva tient le refuge des Trois-Vents et découpe ses volets gelés depuis dix-huit ans, une planche par hiver, rangées au grenier. On les compare : le blanc n’est pas au même endroit d’une année sur l’autre. Il se rapproche du refuge, régulièrement, comme un rendez-vous qu’on aurait pris sans elle.', recompense: { xp: 110 } },
      { titre: 'Chapitre 3 — La vallée blanche', texte: 'Vous montez jusqu’à la tache. Le blizzard s’arrête net à son entrée et n’y entre pas, par égard pour quelque chose. À l’intérieur, pas un flocon : des cristaux de givre alignés en rangs réguliers, taillés à la même hauteur. On ne récolte pas ça. On l’élève.', recompense: { materiau: 'cristal-givre' } },
      { titre: 'Chapitre 4 — Le grenier', texte: 'Hesva monte voir de ses yeux et comprend avant vous. Le froid du massif ne tombe pas du ciel : il est prélevé, rangé, mis en réserve. Les cristaux ne sont pas des pierres précieuses, c’est du froid en bocal, et la vallée blanche est un grenier. Vous y dormez sans grelotter pour la première fois depuis des semaines. Le silence, en revanche, ne rassure personne.', recompense: { soinPct: 0.45 } },
      { titre: 'Chapitre 5 — Hesva rentre son bois', texte: 'Les rangs se vident vite désormais : trois par nuit, puis dix. Les loups des glaces descendent, les yétis suivent, et le blizzard qui contournait le refuge par politesse a cessé d’être poli. Hesva rentre son bois et vous confie la caisse du livre d’or — trois siècles de mercis, en pièces. « Je tiens la porte. Vous, montez. »', recompense: { po: 125, xp: 150 } },
      { titre: 'Chapitre 6 — L’inventaire', texte: 'L’Élémentaire ancien a été tout ce froid, autrefois, avant de se disperser. Depuis, il se rassemble, cristal par cristal, hiver après hiver. Ce qu’on lui prend, il le recompte, et la montagne a beaucoup donné ces temps-ci, à un visiteur en particulier. Ce matin, le givre a dessiné le refuge, et sur le seuil une silhouette à votre taille.', recompense: { xp: 270 } },
    ],
  },
  'profondeurs': {
    titre: 'Le moule-mère',
    chapitres: [
      { titre: 'Chapitre 1 — Sept minutes, puis six', texte: 'La faille du Cœur expire un air brûlant toutes les sept minutes, depuis qu’on la mesure. Cette semaine : six minutes quarante, puis six minutes dix. Rien d’autre n’a changé dans les Profondeurs. Le monde respire simplement plus vite, et personne en bas ne trouve cela inquiétant — ce qui est inquiétant.', recompense: { po: 100 } },
      { titre: 'Chapitre 2 — Damaris, fondeuse', texte: 'Damaris tient la seule forge assez chaude du monde et règle ses coulées sur le souffle de la faille depuis quarante ans. Depuis peu, ses bronzes sortent faux : jamais ratés, toujours autres. Chaque pièce porte le même visage, qu’elle n’a pas gravé et que personne ne connaît. Elle l’appelle « le client ».', recompense: { xp: 120 } },
      { titre: 'Chapitre 3 — Le relèvement', texte: 'Les golems anciens ont interrompu leurs rondes et se sont tournés dans la même direction ; les dragonnets ont déserté leur autel. Vous prenez les alignements avec Damaris : tout vise un point sous le lac de lave figée. En chemin, un golem immobile s’ouvre proprement en deux, comme un moule qu’on démoule. À l’intérieur, un noyau encore tiède, frappé du même visage.', recompense: { materiau: 'noyau-golem' } },
      { titre: 'Chapitre 4 — Pièces de rechange', texte: 'Les golems ne gardent pas les Profondeurs : ils en sortent. Les monnaies au visage inconnu, les coulées fausses de Damaris, les golems eux-mêmes — une seule matrice, en dessous, qui fabrique ses propres pièces détachées. Le Cœur n’abrite pas un gardien : le Cœur est le gardien, et il s’entretient. Il répare d’ailleurs tout ce qui traîne dans son ventre, vous compris, le temps d’un souffle.', recompense: { soinPct: 0.5 } },
      { titre: 'Chapitre 5 — Damaris casse ses moules', texte: 'Quatre minutes entre deux souffles. Les golems s’agenouillent en rang, les ombres se plaquent aux parois, et le lac de verre reflète des gestes que vous n’avez pas encore faits. Damaris brise ses moules un à un et pousse son feu au maximum : « S’il se lève, il voudra une forge chaude. Autant qu’il la trouve. » Elle vous confie quarante ans d’économies pour tenir la galerie.', recompense: { po: 150, xp: 165 } },
      { titre: 'Chapitre 6 — Le Gardien éternel', texte: 'Il n’est pas éternel par miracle, mais par entretien : il se refond, se recompte, se remplace. Depuis des mois l’inventaire ne tombe plus juste — noyaux, écailles, poussière, tout ce qu’un visiteur remonte à la surface. Ce matin, la dernière coulée de Damaris est sortie avec un autre visage : le vôtre, en creux, prêt à servir. Le Gardien éternel a un moule à votre nom, et il monte le chercher.', recompense: { xp: 300 } },
    ],
  },
  'jungle-vai': {
    titre: 'L’heure des orchidées',
    chapitres: [
      { titre: 'Chapitre 1 — Quatre heures d’avance', texte: 'Les orchidées lunaires se sont toutes ouvertes en même temps, quatre heures trop tôt. Les chasseurs qui règlent leurs montres dessus ont manqué leurs rendez-vous, et le font savoir. Personne ne demande ce qui a pu avancer l’horloge d’une jungle entière.', recompense: { po: 115 } },
      { titre: 'Chapitre 2 — Le recenseur', texte: 'Fenn Orsat compte les orchidées de Vaï-Sombre depuis dix-neuf ans, pour la guilde, à la fleur près. Il ouvre son registre : c’est la troisième avance de la saison, et chacune est plus grande que la précédente. « Elles ne se trompent pas, dit-il. Elles se dépêchent. »', recompense: { xp: 135 } },
      { titre: 'Chapitre 3 — Le cercle qui se ferme', texte: 'Vous reportez les avances de Fenn sur sa carte : elles dessinent un anneau, et l’anneau se resserre. Les panthères ont quitté le centre, les hommes-lianes ont déplacé leurs ponts vers l’extérieur. Fenn vous confie une fleur marquée à son encre, au cas où vous iriez voir au milieu.', recompense: { materiau: 'orchidee-lunaire' } },
      { titre: 'Chapitre 4 — Ce que comptait Fenn', texte: 'Au centre, un couloir de végétation écartée, droit, large comme une route. Fenn compare ses relevés et pâlit : l’orchidée ne pousse que là où le grand serpent est passé, son venin fertilise la terre. Depuis dix-neuf ans, il dressait la carte des allées et venues d’une seule bête. Vous vous asseyez dans le couloir pour digérer la nouvelle ; la terre y est tiède, et curieusement réparatrice.', recompense: { soinPct: 0.5 } },
      { titre: 'Chapitre 5 — Les ponts coupés', texte: 'Les grenouilles-dards ont migré vers la canopée, les hommes-lianes ont tranché leurs propres ponts derrière eux. L’anneau s’est refermé cette nuit : il ne fait plus qu’une fleur de large. Fenn refuse de redescendre, s’installe à la dernière orchidée et taille sa plume. « Quelqu’un doit noter l’heure. »', recompense: { po: 175, xp: 190 } },
      { titre: 'Chapitre 6 — Celle qui revient pondre', texte: 'La Matriarche Sarpense est revenue pondre au centre de sa spirale, là où elle est née : la jungle a poussé sur son venin, elle reprend son bien. Les orchidées ne mesuraient pas le temps, elles mesuraient son souffle. Elle a reniflé le vôtre sur le registre de Fenn, et elle vient. À côté de vous, une fleur s’ouvre : il n’est pas l’heure.', recompense: { xp: 340 } },
    ],
  },
  'falaises-hurlantes': {
    titre: 'Le nom que le vent apprend',
    chapitres: [
      { titre: 'Chapitre 1 — Onze minutes de silence', texte: 'À l’aube, les Falaises Hurlantes se sont tues. Onze minutes exactement : les cristaux hurleurs ont retenu leur souffle et les gargouilles ont toutes tourné la tête du même côté. De mémoire de berger, la falaise n’avait jamais rien fait d’aussi impoli.', recompense: { po: 115 } },
      { titre: 'Chapitre 2 — L’accordeuse', texte: 'Mirande Sault accorde la falaise : elle égalise les cristaux pour que les bergers se repèrent au son. Selon elle, la roche ne s’est pas tue — elle a perdu une note, la plus grave. « Quelque chose chante en dessous, dit-elle. Trop bas pour vos oreilles. Pas pour les miennes. »', recompense: { xp: 135 } },
      { titre: 'Chapitre 3 — La note d’en dessous', texte: 'La note manquante revient chaque aube, un peu plus grave. Les harpies ont cessé de répéter des noms pour l’imiter ; les gargouilles-vigies ne surveillent plus l’horizon, elles regardent le vide sous elles. Mirande vous donne un cristal fendu par cette note : « gardez-le, il a entendu avant nous ».', recompense: { materiau: 'cristal-hurleur' } },
      { titre: 'Chapitre 4 — Le registre des noms', texte: 'Mirande tient aussi le registre des noms que le vent hurle. Vous les recoupez avec la liste des disparus de la côte : ils correspondent tous, à un an près. Le vent n’invente rien, il répète ; la falaise récite l’inventaire de ce qui a été emporté. Vous passez la nuit dans son abri, du bon côté de la roche, et vous dormez mieux que la nouvelle ne le mérite.', recompense: { soinPct: 0.5 } },
      { titre: 'Chapitre 5 — La mue', texte: 'Les plumes de rokh tombent par dizaines : c’est la mue, et la mue précède le nid. Les gargouilles ont quitté leurs corniches pour la première fois en trois cents ans. Mirande plante son diapason dans le basalte et refuse de descendre. « La note est presque un nom. Deux syllabes. Comme le vôtre. »', recompense: { po: 175, xp: 190 } },
      { titre: 'Chapitre 6 — Le Rokh Tempétueux', texte: 'Le Rokh Tempétueux a creusé ces falaises lui-même, corniche après corniche, et il revient y couver quand l’orage tourne. Il apprend à la roche le nom de ses prises, pour que ses petits chassent au son. Ce matin, la note grave s’est résolue : c’est votre nom, et il est parfaitement accordé. Mirande l’a inscrit au registre, par acquit de conscience.', recompense: { xp: 340 } },
    ],
  },
  'abysses-emeraude': {
    titre: 'La cité qui repousse',
    chapitres: [
      { titre: 'Chapitre 1 — Des rues trop propres', texte: 'Dans la cité engloutie, les rues sont nettes. Pas de vase, pas d’épaves, pas un limon : balayées. Le corail sanglant pousse le long des murs en ligne droite, au cordeau, comme si un maçon le guidait.', recompense: { po: 140 } },
      { titre: 'Chapitre 2 — Le releveur de lanternes', texte: 'Vasco Thièle compte les lanternes de la cité depuis trente ans, sans que personne le lui demande ni le lui paie. Il déplie ses vieux plans : trois places ont disparu, les portes ouvertes se sont refermées, les ruelles se resserrent d’une coudée par saison. « On ne nettoie pas la ville, dit-il. On la referme. »', recompense: { xp: 160 } },
      { titre: 'Chapitre 3 — Tout converge au port', texte: 'Vous suivez les lignes de corail : toutes descendent vers le grand bassin du port. Les murènes ont quitté les murs, les crabes cuirassés émigrent au large avec leurs œufs, et les sirènes chantent partout sauf au-dessus du bassin. Vasco casse pour vous une branche rouge : « la preuve, si on ne me croit pas ».', recompense: { materiau: 'corail-sanglant' } },
      { titre: 'Chapitre 4 — La ville n’a jamais été bâtie', texte: 'Le plan de Vasco, posé sur le tracé du corail, ne donne pas une ville : il donne une croissance. Les murs n’ont pas été montés, ils ont poussé ; les lanternes ne sont pas des lampes mais des polypes, et elles brûlent depuis mille ans parce qu’elles sont vivantes. Personne n’a fondé les Abysses d’Émeraude : on s’y est installé, comme on s’installe chez un absent. Vasco vous pousse dans une bulle d’air ancien, le temps de reprendre votre souffle et vos idées.', recompense: { soinPct: 0.55 } },
      { titre: 'Chapitre 5 — L’eau tiède', texte: 'L’eau du bassin est tiède, à cette profondeur, et personne ne tient à expliquer pourquoi. Chaque soir, toutes les lanternes faiblissent ensemble puis reprennent : le rythme d’un poumon. Sur les seuils, on ramasse les larmes de sirène à la poignée — elles pleurent avant que ça bouge. Vasco amarre sa barque au-dessus du port, décroche son enseigne et cloue son plan au mât, « pour ceux qui remonteront ».', recompense: { po: 210, xp: 220 } },
      { titre: 'Chapitre 6 — Le Léviathan Corallien', texte: 'Le Léviathan Corallien revient tous les mille ans reprendre la couronne de corail qu’il a laissée pousser, puis en faire une neuve. La cité était son ancienne écaille, et ses habitants des locataires qui n’ont jamais lu le bail. Il vous a senti marcher sur lui : au fond, un cœur qui bat sur son dos, cela ne passe pas inaperçu. Devant vous, une lanterne se rallume — on éclaire la pièce quand on attend quelqu’un.', recompense: { xp: 400 } },
    ],
  },
  'steppe-cendres': {
    titre: 'La cendre de quelqu’un',
    chapitres: [
      { titre: 'Chapitre 1 — Il neige de la cendre', texte: 'Il neige de la cendre depuis trois nuits. Le ciel est clair, les cônes sont froids, rien ne brûle nulle part. La cendre tombe tiède et sent le fer. Dans la steppe, personne ne pose la question à voix haute.', recompense: { po: 140 } },
      { titre: 'Chapitre 2 — Le trieur', texte: 'Otar Vesle trie la cendre au grain et la vend aux fermiers, qui la paient cher et ne discutent pas. Il fait rouler celle-ci entre ses doigts et cesse de plaisanter : trop fine, trop grasse, ce n’est pas de la cendre de pierre. « Ça, c’est de la cendre de quelqu’un. »', recompense: { xp: 160 } },
      { titre: 'Chapitre 3 — Trente et un ans', texte: 'Otar ressort ses vieux sacs étiquetés : le même grain est tombé il y a trente et un ans, et trente et un ans avant. Depuis, les chacals éventrent les anciennes fosses et les salamandres ne répondent plus au feu qu’on leur tend. Le geyser ponctuel, lui, jaillit avec deux minutes de retard, puis quatre. Otar vous met de côté un sachet du bon millésime.', recompense: { materiau: 'cendre-fertile' } },
      { titre: 'Chapitre 4 — Personne n’a vu l’éruption', texte: 'Vous cherchez avec Otar le récit de la Grande Éruption dans les registres des villages. Il n’y en a aucun : pas de coulée, pas de cratère, pas de témoin — seulement de la cendre, un beau matin. La steppe n’a pas survécu à un volcan : elle est grise parce qu’une bête y mue depuis des siècles, et les fleurs de l’après poussent sur de la peau. Vous dormez dans la cendre tiède, qui reste, malgré tout, d’un confort remarquable.', recompense: { soinPct: 0.55 } },
      { titre: 'Chapitre 5 — Le feu de camp s’éteint', texte: 'Le feu de camp éternel s’est éteint cette nuit, pour la première fois depuis qu’on en parle. L’obsidienne du sol se fend en lignes parallèles, exactement comme une peau trop tendue. Les ogres magmatiques ont abandonné leur inventaire et marchent vers l’est, en file. Otar vide son étal, vous laisse son meilleur grain et garde sa balance : il veut peser la dernière.', recompense: { po: 210, xp: 220 } },
      { titre: 'Chapitre 6 — Le Béhémoth de Cendre', texte: 'Tous les trente et un ans, le Béhémoth de Cendre remonte des feux profonds pour laisser sa croûte sur la plaine : la steppe est son aire de mue, et la cendre fertile, sa peau. Cette fois il a du retard, et la croûte pèse. Il vous a senti, forcément : vous transportez des sacs de lui depuis des semaines. Le geyser vient de jaillir avec vingt minutes d’avance — le réveil a sonné.', recompense: { xp: 400 } },
    ],
  },
  'foret-petrifiee': {
    titre: 'Le compte n’y est pas',
    chapitres: [
      { titre: 'Chapitre 1 — L’arbre trop jeune', texte: 'Un tronc de pierre parmi mille autres, sauf que sa cassure est encore blanche et qu’aucun lichen ne l’a trouvé. On y compte quarante cernes. La forêt, elle, a été changée en pierre il y a dix siècles. Quelqu’un est en retard, ou quelque chose continue.', recompense: { po: 170 } },
      { titre: 'Chapitre 2 — La compteuse', texte: 'Mahaut la Compteuse marque les troncs à la craie depuis trente ans. Son registre dit 1 397, puis 1 398, puis 1 400 : toujours dans le même sens. Elle vous paie pour recompter, et espère très fort que vous vous tromperez.', recompense: { xp: 180 } },
      { titre: 'Chapitre 3 — Sous l’écorce', texte: 'Vous recomptez : 1 401. Sous l’écorce du dernier venu, la pierre a gardé la forme d’une besace et d’une botte ; dans la besace, une sphère runique intacte, que son propriétaire n’a pas eu le temps de vendre. Mahaut ouvre alors son second carnet, celui des bûcherons qui ne sont pas rentrés. Les deux listes ont exactement la même longueur.', recompense: { materiau: 'sphere-runique' } },
      { titre: 'Chapitre 4 — Ce que la nuit n’a pas fait', texte: 'Le regard du basilic étourdit ; il ne fabrique pas de bois. Mahaut relève les inclinaisons avec vous : tous les troncs, les anciens comme les neufs, penchent vers le même point au centre de la forêt. La nuit fatale n’a donc rien maudit du tout : elle a seulement été le premier repas. Depuis, on mange lentement, et poliment. Elle vous laisse souffler dans sa cabane de lisière, et vous ressort une couverture.', recompense: { soinPct: 0.6 } },
      { titre: 'Chapitre 5 — Trois de plus', texte: 'Trois troncs neufs en une seule saison : le compte s’emballe. Les moissonneurs runiques convoient des éclats de quartz vers le centre, en file, comme on nourrit quelqu’un. Mahaut plante ses jalons à la lisière de la clairière et vous laisse son registre : « Quelqu’un doit continuer à compter. »', recompense: { po: 255, xp: 250 } },
      { titre: 'Chapitre 6 — L’Avatar de Quartz', texte: 'Au centre siège l’Avatar de Quartz : pas un gardien, un appétit avec des angles. Chaque facette est quelqu’un, et la forêt entière est son inventaire, à raison d’un promeneur par an. Il en tourne une vers vous ; votre reflet y est déjà, avec un peu d’avance. Sur le registre, Mahaut a écrit « 1 402 ? » et laissé la ligne libre.', recompense: { xp: 450 } },
    ],
  },
  'vallee-geants': {
    titre: 'Un géant de bonne facture',
    chapitres: [
      { titre: 'Chapitre 1 — La côte recousue', texte: 'Sur une cage thoracique grande comme une grange, une côte porte encore les traces de scie des récolteurs. Elle est pourtant à sa place. L’entaille s’est refermée proprement, comme une cicatrice sur quelqu’un de patient.', recompense: { po: 170 } },
      { titre: 'Chapitre 2 — Sidoine la rebouteuse', texte: 'Sidoine remet les épaules des vivants et remonte les squelettes des morts, ce qui fait d’elle la meilleure comptable d’os de la vallée. Ses relevés sont formels : les réparations suivent un ordre, les pieds d’abord, puis les jambes. Quelqu’un travaille de bas en haut. Elle vous envoie vérifier le squelette voisin.', recompense: { xp: 180 } },
      { titre: 'Chapitre 3 — La récolte du soir', texte: 'L’os repoussé est tiède et trop léger. Au crépuscule, les chamans des os plantent des esquilles dans les tombes ; à l’aube, ils remportent ce qui a poussé. Ce n’est pas de la nécromancie, c’est de l’agriculture. Un panier renversé vous laisse une relique antique que personne ne réclame — et tout le reste part vers le nord, toujours vers le nord.', recompense: { materiau: 'relique-antique' } },
      { titre: 'Chapitre 4 — Les meilleures pièces', texte: 'Sidoine étale ses relevés côte à côte, et rien ne va plus. Aucun squelette n’est réparé en entier : chacun ne rend que sa plus belle pièce, le fémur ici, la mâchoire là-bas, la cage la plus large au fond. Ce n’est pas une restauration, c’est une sélection. Et le ronflement qu’on entend la nuit n’est pas celui des morts : c’est un corps neuf qui apprend à respirer. Elle vous remet debout sans cesser de parler ; ses mains, elles, savent ce qu’elles font.', recompense: { soinPct: 0.6 } },
      { titre: 'Chapitre 5 — Le gué du nord', texte: 'Une tombe se vide désormais en une nuit. Les mammouths spectraux cessent de paître et se tournent tous vers le nord, comme des girouettes bien élevées. Sidoine ferme son atelier, garde un maillet et s’installe au gué des phalanges : « J’ai monté trop de squelettes pour laisser passer celui-là. »', recompense: { po: 255, xp: 250 } },
      { titre: 'Chapitre 6 — Le Roi des Ossements', texte: 'Au nord, l’assemblage est terminé. Le Roi des Ossements n’est pas ressuscité : il a été bâti, avec le meilleur de cent géants, et les chamans n’étaient que ses mains. Il est ici parce que la vallée est la seule carrière à sa taille, et il n’a pas fini. Il essaie une mâchoire qui n’est pas la sienne, puis vous regarde comme on regarde une pièce qui manque.', recompense: { xp: 450 } },
    ],
  },
  'citadelle-foudre': {
    titre: 'Ce qui frappe depuis mille ans',
    chapitres: [
      { titre: 'Chapitre 1 — Trois brûlures régulières', texte: 'La foudre ne tombe pas sur la citadelle : elle y entre, par trois ouvertures, toujours les mêmes. Les brûlures sont fraîches et se superposent, une par semaine, avec la régularité d’une livraison. Personne ici n’a rien commandé.', recompense: { po: 210 } },
      { titre: 'Chapitre 2 — L’accordeur', texte: 'Ancelin parcourt les couloirs avec un diapason d’acier céleste : il accorde la forteresse comme on accorde un instrument. « Il y a vingt ans, elle donnait un ré grave. Aujourd’hui, on approche du la. » Il vous confie ses carnets et la liste des étages où il ne monte plus.', recompense: { xp: 210 } },
      { titre: 'Chapitre 3 — La cale et les câbles', texte: 'En bas, la citadelle n’est pas une ruine : c’est une pile. Des lieues de câble d’acier céleste convergent vers la quille, et les forgerons foudroyés ne se battent pas pour le métal — ils soudent. Ils sont de service depuis mille ans et personne n’est venu les relever. Ancelin sectionne une longueur de câble détendu et vous la tend : « celui-ci ne tient plus rien ».', recompense: { materiau: 'acier-celeste' } },
      { titre: 'Chapitre 4 — Le sabordage', texte: 'La salle des cartes tranche la question : la citadelle ne s’est pas écrasée, on l’a sabordée. L’équipage a coupé ses propres amarres et l’a couchée entre deux nuages, exprès. Les câbles ne sont pas un moteur, c’est une serrure. Et la note qu’Ancelin surveille depuis vingt ans n’est pas un accord : c’est la tension du verrou. Il vous installe pour la nuit entre deux tables à cartes ; on dort étonnamment bien dans la cale.', recompense: { soinPct: 0.65 } },
      { titre: 'Chapitre 5 — Sept coups dans la nuit', texte: 'Sept impacts en une nuit. Les sentinelles d’acier quittent leurs postes et s’alignent face au ciel, toutes dans le même sens ; pour la première fois, les horloges folles tombent d’accord sur l’heure. Ancelin brise son diapason « pour ne plus être tenté de répondre », puis monte se poster sur le toit.', recompense: { po: 315, xp: 290 } },
      { titre: 'Chapitre 6 — L’Archonte de la Tempête', texte: 'Celui qui frappe est celui qu’on fuyait : l’Archonte de la Tempête. La citadelle est à lui, l’équipage la lui a volée puis cachée dans le mauvais temps, et il cogne poliment depuis mille ans. Le dernier éclair n’a pas visé la serrure : il a suivi votre ombre, au trait près. La note de la forteresse a baissé d’un ton — une courtoisie, pour que vous soyez réveillé quand il se posera.', recompense: { xp: 520 } },
    ],
  },
  'neant-scintillant': {
    titre: 'Ce que la marée rend',
    chapitres: [
      { titre: 'Chapitre 1 — Le poteau indicateur', texte: 'Sur la plage du néant s’échouent les épaves des mondes morts. Ce matin, entre deux carcasses sans nom, un poteau indicateur de Valciel, peinture fraîche, qui désigne un village encore debout. Il n’a pas été perdu. Il est pourtant rendu.', recompense: { po: 210 } },
      { titre: 'Chapitre 2 — La greffière des échouages', texte: 'Eudoxie tient le registre des échouages depuis quarante ans, en deux colonnes : « perdu », « rendu ». Depuis peu, la seconde se remplit d’objets de chez nous que personne n’a encore égarés. Elle vous paie pour aller vérifier le poteau. Il est toujours planté à son carrefour, et il est aussi ici.', recompense: { xp: 210 } },
      { titre: 'Chapitre 3 — Le fil en trop', texte: 'Les tisseuses d’étoiles ne tissent pas des toiles, elles tissent des doublures : l’étoffe du néant se prend brin par brin aux constellations. Chaque objet échoué en porte un fil de trop, et Eudoxie vous laisse dévider celui du poteau. Les échos du néant, eux, répètent avec un peu d’avance des phrases que personne n’a encore dites.', recompense: { materiau: 'etoffe-du-neant' } },
      { titre: 'Chapitre 4 — L’assiette rendue', texte: 'Rien, sur cette plage, n’est brisé par la chute : tout est poli de la même façon, comme des noyaux recrachés. La marée n’apporte pas, elle refuse. La colonne « rendu » d’Eudoxie n’annonce donc aucune perte : c’est la liste de ce qu’on a goûté et laissé. Ce qui inquiète, c’est ce qui n’y figure pas. Elle vous fait asseoir sous son auvent, verse deux tasses, et le silence d’ici répare le reste.', recompense: { soinPct: 0.7 } },
      { titre: 'Chapitre 5 — Les étoiles s’éteignent en ligne', texte: 'La marée passe à deux fois par jour, puis trois. Les horreurs du vide reculent devant l’eau, ce qu’elles n’avaient jamais fait. Les étoiles qui ne sont pas les nôtres s’éteignent une à une, en ligne droite, de l’horizon vers le rivage : quelqu’un marche. Eudoxie clôt son registre, écrit « fin des échouages », et reste sur le sable avec sa lanterne.', recompense: { po: 315, xp: 290 } },
      { titre: 'Chapitre 6 — Le Dévoreur de Mondes', texte: 'Ce qui raye les étoiles porte un nom : le Dévoreur de Mondes. Il est là parce qu’un monde ne se mange que par le bord, et que la déchirure est le bord de Valciel : la plage n’est que sa desserte, des siècles de dégustation. Hier, la marée a rendu votre gant, poli comme un noyau — un essai. Ce matin, elle n’a rien rendu du tout.', recompense: { xp: 520 } },
    ],
  },
};

// =====================================================================
// v17 : MINI-BOSS — chaque zone a ses champions, versions redoutables
// des monstres locaux. Ils surgissent au hasard de l'exploration et
// laissent un petit coffre.
// =====================================================================
const TITRES_MINI_BOSS = ['le Balafré', 'l’Ancien', 'le Colossal', 'la Terreur locale', 'le Marque-Noir', 'l’Insatiable'];

function miniBossDe(z) {
  const cle = z.monstres[alea(0, z.monstres.length - 1)];
  const base = MONSTRES[cle];
  const titre = TITRES_MINI_BOSS[alea(0, TITRES_MINI_BOSS.length - 1)];
  return {
    ...base,
    cle,
    nom: `${base.nom} ${titre}`,
    niveau: (base.niveau || 1) + 1,
    miniBoss: true,
    hp: Math.round(base.hp * 2.6),
    atk: Math.round(base.atk * 1.3),
    agi: base.agi + 2,
    xp: Math.round(base.xp * 2.5),
    po: [base.po[0] * 2, base.po[1] * 3],
    drops: (base.drops || []).map((d) => ({ id: d.id, chance: Math.min(1, d.chance * 2) })),
  };
}
