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
const HISTOIRES_ZONES = {
  plaines: [
    { titre: 'Le puits aux offrandes', texte: 'Un vieux puits croule sous les piécettes. Une inscription : « Prends si tu oses, donne si tu peux. » Vous osez.', recompense: { po: 15 } },
    { titre: 'L’épouvantail vétéran', texte: 'Un épouvantail porte un heaume cabossé et une médaille. Les corbeaux le saluent. Vous aussi, au cas où.', recompense: { xp: 25 } },
    { titre: 'La bergère et le loup', texte: 'Une bergère partage son pain : « Le Loup alpha ? Il était l’agneau de mon troupeau, avant la nuit des étoiles rouges. »', recompense: { soinPct: 0.2 } },
    { titre: 'Le marché fantôme', texte: 'À l’aube, des étals translucides vendent des souvenirs. Vous repartez avec une poignée de pièces très réelles.', recompense: { po: 25 } },
    { titre: 'Le gobelin poète', texte: 'Un gobelin déclame des vers sur un tonneau. C’est mauvais, mais sincère. Il vous paie pour avoir applaudi.', recompense: { po: 10, xp: 15 } },
  ],
  foret: [
    { titre: 'L’arbre à serments', texte: 'Un chêne couvert de rubans murmure les promesses qu’on lui a confiées. Vous en nouez un. La forêt approuve.', recompense: { xp: 35 } },
    { titre: 'Le luthier disparu', texte: 'Une cabane abandonnée, un violon inachevé. Quand le vent passe, il joue tout seul — juste, en plus.', recompense: { po: 30 } },
    { titre: 'Les toiles-cartes', texte: 'Les araignées tissent des toiles qui ressemblent à des cartes. L’une d’elles indique une cache de sève.', recompense: { materiau: 'seve-ambree' } },
    { titre: 'Le cercle de champignons', texte: 'Vous dormez par erreur dans un cercle de champignons. Vous vous réveillez reposé, avec des souvenirs qui ne sont pas les vôtres.', recompense: { soinPct: 0.35 } },
    { titre: 'Le bandit repenti', texte: 'Un bandit à la retraite garde un pont qui ne mène nulle part. Il paie les passants pour « garder la main ».', recompense: { po: 20, xp: 20 } },
  ],
  collines: [
    { titre: 'La mine chantante', texte: 'Une galerie où le cuivre vibre comme une cloche. Les mineurs orcs y interdisent les jurons — « ça désaccorde ».', recompense: { materiau: 'minerai-cuivre' } },
    { titre: 'Le duel de sommets', texte: 'Deux clans orcs règlent leurs différends à qui hurle le plus fort d’une colline à l’autre. On vous prend pour arbitre.', recompense: { po: 35, xp: 25 } },
    { titre: 'Le golem jardinier', texte: 'Un golem mineur cultive des fleurs dans un casque rouillé. Il vous offre un caillou « qui lui ressemblait ».', recompense: { materiau: 'minerai-fer' } },
    { titre: 'La forge froide', texte: 'Une forge abandonnée où le feu refuse de prendre depuis cent ans. Sur l’enclume, quelqu’un a laissé sa paie.', recompense: { po: 45 } },
    { titre: 'L’écho fidèle', texte: 'Dans cette vallée, l’écho répond avec trois secondes de retard — et parfois de meilleures idées que vous.', recompense: { xp: 40 } },
  ],
  marais: [
    { titre: 'Les lanternes des noyés', texte: 'Des feux follets alignés balisent un chemin sûr à travers la vase. Au bout, une bourse encore sèche.', recompense: { po: 40 } },
    { titre: 'La sorcière de comptoir', texte: 'Une sorcière tient une échoppe de thés « légèrement prophétiques ». Le vôtre annonce : « grosse fatigue, belle victoire ».', recompense: { soinPct: 0.3 } },
    { titre: 'Le lotus qui compte', texte: 'Un lotus noir n’éclot que si on lui récite la table de sept. Une grenouille vous souffle les réponses.', recompense: { materiau: 'lotus-noir' } },
    { titre: 'Le radeau du cartographe', texte: 'Un radeau chargé de cartes détrempées. Toutes fausses, sauf une, qui mène à un coffre de brume.', recompense: { po: 30, xp: 30 } },
    { titre: 'Le chœur des crapauds', texte: 'À la pleine lune, les crapauds chantent en canon. L’hydre, dit-on, garde le silence pour écouter.', recompense: { xp: 45 } },
  ],
  cryptes: [
    { titre: 'Le bibliothécaire mort', texte: 'Un squelette range inlassablement des ossuaires par ordre alphabétique. Il vous paie pour un coup de main.', recompense: { po: 50 } },
    { titre: 'La couronne d’essai', texte: 'Une couronne de plomb sur un coussin : « Essayez-moi. » Vous entendez trois secondes des pensées du Roi déchu. Ça suffit.', recompense: { xp: 55 } },
    { titre: 'Les bougies loyales', texte: 'Des bougies s’allument sur votre passage et s’éteignent derrière vous. L’une d’elles vous suit. Elle fond en pièces d’or.', recompense: { po: 40, xp: 25 } },
    { titre: 'Le gisant modeste', texte: '« Ci-gît quelqu’un de très bien, demandez autour. » La dalle sonne creux : quelqu’un de très bien cachait son épargne.', recompense: { po: 60 } },
    { titre: 'La poussière qui se souvient', texte: 'La poussière de spectre dessine des scènes du royaume disparu. Vous en apprenez plus qu’aucun livre.', recompense: { materiau: 'poussiere-spectre' } },
  ],
  desert: [
    { titre: 'L’oasis à l’envers', texte: 'Une oasis dont l’eau coule vers le haut. Les caravaniers y remplissent leurs gourdes en les tenant à l’envers.', recompense: { soinPct: 0.35 } },
    { titre: 'Le sphinx bègue', texte: 'Un sphinx pose des énigmes, mais bégaie la réponse en même temps. Il paie pour votre discrétion.', recompense: { po: 55 } },
    { titre: 'La dune roulante', texte: 'Une dune se déplace contre le vent. Sur son sommet, un mât de navire — et sa caisse de bord.', recompense: { po: 35, xp: 35 } },
    { titre: 'Les perles de rosée', texte: 'À l’aube, le désert transpire des perles. Le Ver colossal les évite : « trop précieuses pour être digérées ».', recompense: { materiau: 'perle-des-sables' } },
    { titre: 'Le cadran d’ombre', texte: 'Un obélisque projette l’ombre d’un autre lieu. Pendant une minute, vous voyez la mer. Vous en revenez grandi.', recompense: { xp: 60 } },
  ],
  pics: [
    { titre: 'Le refuge du silence', texte: 'Un refuge où le blizzard n’entre pas, par politesse. Le livre d’or contient trois siècles de mercis — et des étrennes.', recompense: { po: 60 } },
    { titre: 'La harpe de glace', texte: 'Des stalactites accordées jouent quand le vent tourne. Le yéti écoute, assis, presque délicat.', recompense: { xp: 65 } },
    { titre: 'Le thé de l’ermite', texte: 'Un ermite vous sert un thé qui fume à l’envers. « Réchauffe pour trois jours. » Il dit vrai.', recompense: { soinPct: 0.4 } },
    { titre: 'Le cristal boudeur', texte: 'Un cristal de givre refuse d’être ramassé — sauf si on lui présente les choses gentiment.', recompense: { materiau: 'cristal-givre' } },
    { titre: 'La cordée fantôme', texte: 'Des alpinistes spectraux vous assurent dans un passage délicat. Au sommet, leur cairn contient leur dernière paie.', recompense: { po: 45, xp: 40 } },
  ],
  profondeurs: [
    { titre: 'Le lac de verre', texte: 'Un lac de lave figée, poli comme un miroir. Votre reflet a une seconde de retard et l’air désolé.', recompense: { xp: 80 } },
    { titre: 'La monnaie du Gardien', texte: 'Des pièces frappées d’un visage que personne ne connaît. Les collectionneurs de Valciel en raffolent.', recompense: { po: 80 } },
    { titre: 'Le jardin d’obsidienne', texte: 'Des fleurs de verre noir poussent dans la chaleur. En cueillir une sans la briser porte chance — et rapporte.', recompense: { po: 50, xp: 50 } },
    { titre: 'L’écaille votive', texte: 'Un autel dragon couvert d’écailles offertes. Le dragonnet de tête vous en tend une : « pour la route ».', recompense: { materiau: 'ecaille-draconique' } },
    { titre: 'Le souffle du monde', texte: 'Une faille exhale un air brûlant à intervalles réguliers. Les anciens disaient : « le monde respire ». Vous respirez avec lui.', recompense: { soinPct: 0.5 } },
  ],
  'jungle-vai': [
    { titre: 'Le pont de lianes tressées', texte: 'Un pont tissé par les hommes-lianes eux-mêmes. Le péage : une histoire drôle. La vôtre passe, de justesse.', recompense: { po: 70 } },
    { titre: 'L’orchidée horloge', texte: 'Une orchidée qui s’ouvre à heure fixe. Les chasseurs règlent leurs montres dessus — et paient pour la garder secrète.', recompense: { materiau: 'orchidee-lunaire' } },
    { titre: 'La pluie tiède', texte: 'Il pleut à travers trois étages de canopée : l’eau arrive triée — potable, tiède, presque sucrée.', recompense: { soinPct: 0.4 } },
    { titre: 'Le temple aux singes', texte: 'Des singes gardent un temple et exigent un tribut de fruits. Ils rendent la monnaie en vieilles pièces d’or.', recompense: { po: 60, xp: 55 } },
    { titre: 'Les lucioles cartographes', texte: 'La nuit, les lucioles dessinent la carte exacte de la jungle. La Matriarche les laisse faire : même elle s’y perd.', recompense: { xp: 90 } },
  ],
  'falaises-hurlantes': [
    { titre: 'Le vent nominatif', texte: 'Le vent hurle des noms. Quand il crie le vôtre, les harpies s’écartent avec respect toute la journée.', recompense: { xp: 90 } },
    { titre: 'Le nid de trop-plein', texte: 'Les rokhs jettent de leurs nids ce qui brille trop. En contrebas, ça fait un tas très intéressant.', recompense: { po: 75 } },
    { titre: 'La gargouille mélomane', texte: 'Une gargouille fredonne du basalte — c’est une berceuse minérale. Vous dormez dix minutes, récupérez dix heures.', recompense: { soinPct: 0.45 } },
    { titre: 'Le cristal accordeur', texte: 'Un cristal hurleur donne le « la » à toute la falaise. Il mue une fois l’an : la vieille peau se ramasse.', recompense: { materiau: 'cristal-hurleur' } },
    { titre: 'L’escalier des paris', texte: 'Des marches taillées par des géants parieurs : chaque palier cache la mise d’un pari perdu.', recompense: { po: 55, xp: 60 } },
  ],
  'abysses-emeraude': [
    { titre: 'Les lanternes patientes', texte: 'Les lanternes de la cité engloutie brûlent sous l’eau depuis mille ans. L’une s’éteint à votre passage — relève de la garde.', recompense: { xp: 110 } },
    { titre: 'Le banc d’écailles', texte: 'Des poissons-miroirs vous escortent en reflétant un trésor. C’est une pub : le trésor existe, moyennant péage.', recompense: { po: 90 } },
    { titre: 'La sirène enrouée', texte: 'Une sirène a perdu sa voix. Vous chantez à sa place — les abysses, bon public, applaudissent en perles.', recompense: { materiau: 'nacre-abyssale' } },
    { titre: 'La bulle d’air ancien', texte: 'Une bulle d’air de l’ancien monde, prisonnière d’une arche. La respirer, c’est respirer l’an mille d’avant.', recompense: { soinPct: 0.5 } },
    { titre: 'Le marché des méduses', texte: 'Des méduses-lanternes tiennent un marché nocturne. Votre monnaie ne vaut rien ici — la leur, beaucoup chez vous.', recompense: { po: 70, xp: 70 } },
  ],
  'steppe-cendres': [
    { titre: 'Les fleurs de l’après', texte: 'Sur la cendre poussent des fleurs qui n’existent nulle part ailleurs. Les chacals les gardent — sauf une, pour vous.', recompense: { materiau: 'cendre-fertile' } },
    { titre: 'Le feu de camp éternel', texte: 'Un feu de camp brûle sans bois ni fumée depuis la Grande Éruption. La marmite au-dessus est toujours pleine.', recompense: { soinPct: 0.5 } },
    { titre: 'La caravane de verre', texte: 'La chaleur a vitrifié une caravane entière. Dans les coffres translucides, tout se voit — et se récupère.', recompense: { po: 95 } },
    { titre: 'L’ogre comptable', texte: 'Un ogre magmatique compte les braises une à une : « l’inventaire du volcan ». Il paie les auditeurs externes.', recompense: { po: 65, xp: 75 } },
    { titre: 'Le geyser ponctuel', texte: 'Un geyser de cendre chaude jaillit chaque heure pile. Le Béhémoth s’en sert de réveil.', recompense: { xp: 120 } },
  ],
  'foret-petrifiee': [
    { titre: 'La sève de pierre', texte: 'Au cœur d’un tronc pétrifié, la sève coule encore — en pierre liquide. Une goutte tient dans une fiole, et vaut cher.', recompense: { po: 120 } },
    { titre: 'Les feuilles gravées', texte: 'Chaque feuille de pierre porte une ligne de l’histoire de la nuit fatale. Vous en lisez un chapitre entier.', recompense: { xp: 150 } },
    { titre: 'L’oiseau statue', texte: 'Un oiseau pétrifié en plein vol, suspendu à rien. Le toucher porte bonheur ; le dépoussiérer rapporte.', recompense: { po: 80, xp: 80 } },
    { titre: 'L’ambre témoin', texte: 'Un bloc d’ambre noir enferme la dernière seconde d’avant la pétrification. Les runes du basilic y sont lisibles.', recompense: { materiau: 'ambre-noir' } },
    { titre: 'La clairière épargnée', texte: 'Une clairière verte, intacte, au milieu de la pierre. Personne ne sait pourquoi. On y dort comme nulle part.', recompense: { soinPct: 0.6 } },
  ],
  'vallee-geants': [
    { titre: 'La dent creuse', texte: 'Une molaire de géant, grande comme une maison — et aménagée en cache par des contrebandiers pressés.', recompense: { po: 130 } },
    { titre: 'La berceuse tellurique', texte: 'La nuit, la vallée ronfle. Les anciens jurent que les géants ne sont pas morts — juste très fatigués.', recompense: { xp: 160 } },
    { titre: 'L’os qui pousse', texte: 'Un fémur planté en terre a bourgeonné. Le chaman des os refuse d’en parler. Il en tombe des éclats précieux.', recompense: { materiau: 'os-de-geant' } },
    { titre: 'Le gué des phalanges', texte: 'On traverse la rivière sur les phalanges d’une main de géant. La légende dit qu’elle se refermera un jour. Pas aujourd’hui.', recompense: { po: 85, xp: 90 } },
    { titre: 'Le souffle chaud', texte: 'D’une gorge rocheuse monte un souffle tiède et régulier. Vous faites la sieste dedans. Meilleure sieste de votre vie.', recompense: { soinPct: 0.6 } },
  ],
  'citadelle-foudre': [
    { titre: 'Les horloges folles', texte: 'Toutes les horloges de la citadelle donnent une heure différente — chacune l’heure d’un monde. La vôtre paie en avance.', recompense: { po: 150 } },
    { titre: 'La bibliothèque conductrice', texte: 'Les livres se lisent en les touchant : le savoir passe en une décharge. Vous repartez les cheveux dressés et l’esprit plein.', recompense: { xp: 190 } },
    { titre: 'Le paratonnerre fleuri', texte: 'Au sommet, un paratonnerre a fleuri en fragments de foudre. Le jardinier automate vous en offre une bouture.', recompense: { materiau: 'fragment-de-foudre' } },
    { titre: 'La salle des échos', texte: 'Une salle qui rejoue les conversations d’il y a mille ans. Les Archontes y débattaient de vous. En bien, semble-t-il.', recompense: { po: 100, xp: 100 } },
    { titre: 'Le bain d’orage', texte: 'Une cuve où l’orage se prend en bain. S’y tremper picote — puis répare tout ce qui doit l’être.', recompense: { soinPct: 0.7 } },
  ],
  'neant-scintillant': [
    { titre: 'L’étoile apprivoisée', texte: 'Une petite étoile vous suit comme un chat. Elle repart en vous laissant une poignée de sa poussière.', recompense: { materiau: 'eclat-d-etoile' } },
    { titre: 'La porte sans maison', texte: 'Une porte seule, debout dans le vide. Frapper est poli. On vous glisse un pourboire sous la porte.', recompense: { po: 170 } },
    { titre: 'Le rivage du rien', texte: 'Le néant a une plage. Les vagues y déposent ce que les mondes perdent — aujourd’hui : une leçon, et des pièces.', recompense: { po: 110, xp: 120 } },
    { titre: 'Votre constellation', texte: 'Les étoiles d’ici se réarrangent pour dessiner votre silhouette. Le Dévoreur trouve ça « de mauvais goût ».', recompense: { xp: 220 } },
    { titre: 'Le silence habité', texte: 'Un silence si complet qu’il soigne. Vous restez une minute. Ou un an. Difficile à dire.', recompense: { soinPct: 0.75 } },
  ],
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
