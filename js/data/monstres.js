'use strict';

// =====================================================================
// Bestiaire des zones : Royaumes et Terres lointaines
// =====================================================================

// =====================================================================
// Monstres et zones du monde.
// Un monstre : hp, atk, dex, xp, po [min,max], drops [{id, chance}],
// attaques [{nom, emoji, mult, poids, type 'mono'|'aoe'|'soin', valeur?, effet?}]
// =====================================================================

const MONSTRES = {
  // ----- Plaines de l'Aube (niv. 1-3) -----
  gobelin: {
    nom: 'Gobelin', emoji: '👺', niveau: 1, hp: 24, atk: 5, dex: 4, xp: 20, po: [4, 8],
    drops: [{ id: 'fibre-sauvage', chance: 0.35 }, { id: 'herbe-lunaire', chance: 0.2 }],
    attaques: [
      { nom: 'Coup de gourdin', emoji: '🏏', mult: 1.0, poids: 3, type: 'mono' },
      { nom: 'Morsure sournoise', emoji: '🦷', mult: 1.3, poids: 1, type: 'mono' },
    ],
  },
  loup: {
    nom: 'Loup', emoji: '🐺', niveau: 2, hp: 30, atk: 7, dex: 7, xp: 26, po: [5, 9],
    drops: [{ id: 'peau-de-loup', chance: 0.5 }],
    attaques: [
      { nom: 'Coup de crocs', emoji: '🦷', mult: 1.0, poids: 3, type: 'mono' },
      { nom: 'Bond sauvage', emoji: '💨', mult: 1.25, poids: 1, type: 'mono' },
    ],
  },
  sanglier: {
    nom: 'Sanglier', emoji: '🐗', niveau: 2, hp: 36, atk: 8, dex: 4, xp: 30, po: [5, 10],
    drops: [{ id: 'defense-sanglier', chance: 0.45 }],
    attaques: [
      { nom: 'Coup de boutoir', emoji: '💢', mult: 1.0, poids: 3, type: 'mono' },
      { nom: 'Charge furieuse', emoji: '🌪️', mult: 1.35, poids: 1, type: 'mono' },
    ],
  },
  loupAlpha: {
    nom: 'Loup alpha', emoji: '🐺', niveau: 3, boss: true, hp: 95, atk: 11, dex: 8, xp: 110, po: [25, 40],
    drops: [{ id: 'peau-de-loup', chance: 1 }, { id: 'herbe-lunaire', chance: 0.5 }],
    attaques: [
      { nom: 'Morsure féroce', emoji: '🦷', mult: 1.2, poids: 2, type: 'mono' },
      { nom: 'Hurlement déchirant', emoji: '🌙', mult: 0.7, poids: 1, type: 'aoe' },
      { nom: 'Frénésie', emoji: '🌪️', mult: 1.5, poids: 1, type: 'mono' },
    ],
  },

  // ----- Forêt des Murmures (niv. 3-6) -----
  araignee: {
    nom: 'Araignée géante', emoji: '🕷️', niveau: 4, hp: 48, atk: 10, dex: 8, xp: 45, po: [8, 14],
    drops: [{ id: 'soie-araignee', chance: 0.5 }],
    attaques: [
      { nom: 'Morsure venimeuse', emoji: '🕷️', mult: 0.9, poids: 2, type: 'mono', effet: { type: 'poison', degats: 3, duree: 2 } },
      { nom: 'Coup de pattes', emoji: '🦴', mult: 1.1, poids: 2, type: 'mono' },
    ],
  },
  bandit: {
    nom: 'Bandit', emoji: '🦹', niveau: 4, hp: 55, atk: 11, dex: 6, xp: 48, po: [14, 24],
    drops: [{ id: 'fibre-sauvage', chance: 0.3 }, { id: 'herbe-lunaire', chance: 0.25 }],
    attaques: [
      { nom: 'Coup de dague', emoji: '🗡️', mult: 1.0, poids: 3, type: 'mono' },
      { nom: 'Coup fourré', emoji: '🎭', mult: 1.35, poids: 1, type: 'mono' },
    ],
  },
  treant: {
    nom: 'Tréant', emoji: '🌳', niveau: 5, hp: 75, atk: 12, dex: 3, xp: 56, po: [10, 16],
    drops: [{ id: 'bois-chene', chance: 0.6 }, { id: 'seve-ambree', chance: 0.35 }],
    attaques: [
      { nom: 'Branche lourde', emoji: '🪵', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Étreinte de racines', emoji: '🌱', mult: 0.8, poids: 1, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.25 } },
    ],
  },
  araigneeMatriarche: {
    nom: 'Matriarche soyeuse', emoji: '🕸️', niveau: 6, boss: true, hp: 190, atk: 15, dex: 9, xp: 190, po: [50, 80],
    drops: [{ id: 'soie-araignee', chance: 1 }, { id: 'soie-araignee', chance: 0.6 }, { id: 'seve-ambree', chance: 0.5 }],
    attaques: [
      { nom: 'Crochets ruisselants', emoji: '🕷️', mult: 1.1, poids: 2, type: 'mono', effet: { type: 'poison', degats: 5, duree: 3 } },
      { nom: 'Toile étouffante', emoji: '🕸️', mult: 0.6, poids: 1, type: 'aoe' },
      { nom: 'Assaut des pattes', emoji: '💢', mult: 1.3, poids: 2, type: 'mono' },
    ],
  },

  // ----- Collines de Cuivre (niv. 6-10) -----
  orc: {
    nom: 'Orc', emoji: '👹', niveau: 7, hp: 95, atk: 16, dex: 5, xp: 75, po: [18, 30],
    drops: [{ id: 'minerai-cuivre', chance: 0.4 }],
    attaques: [
      { nom: 'Coup de hache', emoji: '🪓', mult: 1.0, poids: 3, type: 'mono' },
      { nom: 'Charge brutale', emoji: '💢', mult: 1.35, poids: 1, type: 'mono' },
    ],
  },
  chamanGobelin: {
    nom: 'Chaman gobelin', emoji: '🧙', niveau: 7, hp: 80, atk: 14, dex: 6, xp: 78, po: [18, 30],
    drops: [{ id: 'herbe-lunaire', chance: 0.5 }, { id: 'minerai-cuivre', chance: 0.3 }],
    attaques: [
      { nom: 'Malédiction', emoji: '🕷️', mult: 0.9, poids: 2, type: 'mono', effet: { type: 'poison', degats: 5, duree: 2 } },
      { nom: 'Totem de soin', emoji: '🪅', poids: 2, type: 'soin', valeur: 22 },
    ],
  },
  golemMineur: {
    nom: 'Golem mineur', emoji: '🪨', niveau: 8, hp: 130, atk: 17, dex: 3, xp: 88, po: [20, 34],
    drops: [{ id: 'minerai-cuivre', chance: 0.5 }, { id: 'minerai-fer', chance: 0.35 }, { id: 'noyau-golem', chance: 0.12 }],
    attaques: [
      { nom: 'Poing de pierre', emoji: '👊', mult: 1.0, poids: 3, type: 'mono' },
      { nom: 'Éboulement', emoji: '🪨', mult: 0.65, poids: 1, type: 'aoe' },
    ],
  },
  chefOrc: {
    nom: 'Chef de guerre orc', emoji: '👹', niveau: 10, boss: true, hp: 320, atk: 22, dex: 7, xp: 300, po: [90, 140],
    drops: [{ id: 'minerai-fer', chance: 1 }, { id: 'minerai-cuivre', chance: 0.8 }, { id: 'minerai-fer', chance: 0.5 }],
    attaques: [
      { nom: 'Hache tourbillonnante', emoji: '🪓', mult: 0.7, poids: 2, type: 'aoe' },
      { nom: 'Coup massif', emoji: '💥', mult: 1.3, poids: 2, type: 'mono' },
      { nom: 'Rugissement de guerre', emoji: '📢', mult: 1.0, poids: 1, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.35 } },
    ],
  },

  // ----- Marais de Brumeciel (niv. 8-11) -----
  grenouilleGeante: {
    nom: 'Grenouille colossale', emoji: '🐸', niveau: 9, hp: 150, atk: 19, dex: 7, xp: 92, po: [22, 36],
    drops: [{ id: 'herbe-lunaire', chance: 0.4 }, { id: 'lotus-noir', chance: 0.3 }],
    attaques: [
      { nom: 'Coup de langue', emoji: '👅', mult: 1.0, poids: 3, type: 'mono' },
      { nom: 'Bond écrasant', emoji: '💢', mult: 1.3, poids: 1, type: 'mono' },
    ],
  },
  sorciereMarais: {
    nom: 'Sorcière des marais', emoji: '🧙‍♀️', niveau: 9, hp: 135, atk: 18, dex: 6, xp: 96, po: [24, 38],
    drops: [{ id: 'lotus-noir', chance: 0.45 }, { id: 'herbe-lunaire', chance: 0.3 }],
    attaques: [
      { nom: 'Malédiction du bourbier', emoji: '🕸️', mult: 0.9, poids: 2, type: 'mono', effet: { type: 'poison', degats: 6, duree: 2 } },
      { nom: 'Brume revigorante', emoji: '🌫️', poids: 2, type: 'soin', valeur: 30 },
    ],
  },
  serpentVoile: {
    nom: 'Serpent des voiles', emoji: '🐍', niveau: 10, hp: 140, atk: 21, dex: 11, xp: 100, po: [24, 40],
    drops: [{ id: 'lotus-noir', chance: 0.25 }, { id: 'herbe-lunaire', chance: 0.3 }],
    attaques: [
      { nom: 'Crochets furtifs', emoji: '🦷', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Danse hypnotique', emoji: '💫', mult: 0.7, poids: 1, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.25 } },
    ],
  },
  hydreBrumes: {
    nom: 'Hydre des brumes', emoji: '🐉', niveau: 11, boss: true, hp: 420, atk: 26, dex: 8, xp: 380, po: [120, 180],
    drops: [{ id: 'lotus-noir', chance: 1 }, { id: 'lotus-noir', chance: 0.7 }, { id: 'seve-ambree', chance: 0.6 }],
    attaques: [
      { nom: 'Triple morsure', emoji: '🦷', mult: 1.2, poids: 2, type: 'mono' },
      { nom: 'Souffle de brume', emoji: '🌫️', mult: 0.7, poids: 2, type: 'aoe' },
      { nom: 'Régénérescence', emoji: '💧', poids: 1, type: 'soin', valeur: 60 },
    ],
  },

  // ----- Cryptes Oubliées (niv. 10-14) -----
  squelette: {
    nom: 'Squelette', emoji: '💀', niveau: 11, hp: 130, atk: 22, dex: 6, xp: 105, po: [26, 40],
    drops: [{ id: 'os-ancien', chance: 0.5 }],
    attaques: [
      { nom: 'Épée rouillée', emoji: '🗡️', mult: 1.0, poids: 3, type: 'mono' },
      { nom: 'Griffure d’os', emoji: '🦴', mult: 1.25, poids: 1, type: 'mono' },
    ],
  },
  archerSquelette: {
    nom: 'Archer squelette', emoji: '🏹', niveau: 11, hp: 115, atk: 24, dex: 9, xp: 110, po: [26, 40],
    drops: [{ id: 'os-ancien', chance: 0.4 }],
    attaques: [
      { nom: 'Tir d’os', emoji: '🏹', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Volée d’os', emoji: '🎯', mult: 0.6, poids: 1, type: 'aoe' },
    ],
  },
  pretreDechu: {
    nom: 'Prêtre déchu', emoji: '🧟', niveau: 12, hp: 140, atk: 21, dex: 6, xp: 118, po: [30, 46],
    drops: [{ id: 'poussiere-spectre', chance: 0.35 }, { id: 'os-ancien', chance: 0.3 }],
    attaques: [
      { nom: 'Châtiment', emoji: '☠️', mult: 1.1, poids: 2, type: 'mono' },
      { nom: 'Prière noire', emoji: '🩸', poids: 2, type: 'soin', valeur: 38 },
    ],
  },
  spectre: {
    nom: 'Spectre', emoji: '👻', niveau: 12, hp: 125, atk: 25, dex: 11, xp: 122, po: [30, 48],
    drops: [{ id: 'poussiere-spectre', chance: 0.55 }],
    attaques: [
      { nom: 'Toucher glacial', emoji: '🥶', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Hurlement d’outre-tombe', emoji: '😱', mult: 0.8, poids: 1, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.25 } },
    ],
  },
  roiDechu: {
    nom: 'Roi déchu', emoji: '🫅', niveau: 14, boss: true, hp: 520, atk: 30, dex: 8, xp: 480, po: [160, 240],
    drops: [{ id: 'os-ancien', chance: 1 }, { id: 'poussiere-spectre', chance: 1 }, { id: 'poussiere-spectre', chance: 0.6 }],
    attaques: [
      { nom: 'Lame maudite', emoji: '⚔️', mult: 1.2, poids: 2, type: 'mono' },
      { nom: 'Vague nécrotique', emoji: '🌊', mult: 0.7, poids: 2, type: 'aoe' },
      { nom: 'Malédiction royale', emoji: '👑', mult: 0.9, poids: 1, type: 'mono', effet: { type: 'poison', degats: 8, duree: 3 } },
    ],
  },

  // ----- Désert d'Ambrezine (niv. 12-16) -----
  scorpionGeant: {
    nom: 'Scorpion géant', emoji: '🦂', niveau: 13, hp: 185, atk: 27, dex: 9, xp: 135, po: [34, 52],
    drops: [{ id: 'os-ancien', chance: 0.3 }, { id: 'perle-des-sables', chance: 0.2 }],
    attaques: [
      { nom: 'Pince broyeuse', emoji: '🦞', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Dard venimeux', emoji: '🪡', mult: 0.9, poids: 2, type: 'mono', effet: { type: 'poison', degats: 7, duree: 2 } },
    ],
  },
  banditDunes: {
    nom: 'Bandit des dunes', emoji: '🏴‍☠️', niveau: 13, hp: 175, atk: 26, dex: 10, xp: 138, po: [45, 70],
    drops: [{ id: 'perle-des-sables', chance: 0.15 }, { id: 'fibre-sauvage', chance: 0.3 }],
    attaques: [
      { nom: 'Sabre courbe', emoji: '⚔️', mult: 1.0, poids: 3, type: 'mono' },
      { nom: 'Estocade traîtresse', emoji: '🎭', mult: 1.35, poids: 1, type: 'mono' },
    ],
  },
  elementaireSable: {
    nom: 'Élémentaire de sable', emoji: '🌪️', niveau: 14, hp: 200, atk: 29, dex: 7, xp: 148, po: [36, 56],
    drops: [{ id: 'perle-des-sables', chance: 0.4 }],
    attaques: [
      { nom: 'Tourbillon de sable', emoji: '🌪️', mult: 0.65, poids: 1, type: 'aoe' },
      { nom: 'Poigne des dunes', emoji: '🪤', mult: 0.9, poids: 1, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.3 } },
      { nom: 'Lame de silice', emoji: '🔪', mult: 1.1, poids: 2, type: 'mono' },
    ],
  },
  verDesSables: {
    nom: 'Ver des sables colossal', emoji: '🪱', niveau: 16, boss: true, hp: 650, atk: 36, dex: 6, xp: 560, po: [200, 300],
    drops: [{ id: 'perle-des-sables', chance: 1 }, { id: 'perle-des-sables', chance: 0.6 }, { id: 'minerai-fer', chance: 0.8 }],
    attaques: [
      { nom: 'Engloutissement', emoji: '🕳️', mult: 1.3, poids: 2, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.25 } },
      { nom: 'Séisme des dunes', emoji: '🌋', mult: 0.75, poids: 2, type: 'aoe' },
      { nom: 'Jet d’acide', emoji: '🧪', mult: 0.9, poids: 1, type: 'mono', effet: { type: 'poison', degats: 9, duree: 2 } },
    ],
  },

  // ----- Pics Gelés (niv. 14-18) -----
  loupGlaces: {
    nom: 'Loup des glaces', emoji: '🐺', niveau: 15, hp: 190, atk: 30, dex: 12, xp: 155, po: [40, 60],
    drops: [{ id: 'peau-de-loup', chance: 0.5 }, { id: 'cristal-givre', chance: 0.3 }],
    attaques: [
      { nom: 'Crocs gelés', emoji: '🦷', mult: 1.0, poids: 3, type: 'mono' },
      { nom: 'Bond glacial', emoji: '❄️', mult: 1.3, poids: 1, type: 'mono' },
    ],
  },
  elementaireGivre: {
    nom: 'Élémentaire de givre', emoji: '🧊', niveau: 15, hp: 175, atk: 32, dex: 8, xp: 162, po: [40, 62],
    drops: [{ id: 'cristal-givre', chance: 0.5 }],
    attaques: [
      { nom: 'Javelot de glace', emoji: '🧊', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Souffle glacial', emoji: '🌬️', mult: 0.65, poids: 1, type: 'aoe' },
    ],
  },
  yeti: {
    nom: 'Yéti', emoji: '🦍', niveau: 16, hp: 260, atk: 34, dex: 6, xp: 175, po: [45, 70],
    drops: [{ id: 'peau-de-loup', chance: 0.6 }, { id: 'cristal-givre', chance: 0.35 }],
    attaques: [
      { nom: 'Poing colossal', emoji: '👊', mult: 1.25, poids: 2, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.2 } },
      { nom: 'Roulade de neige', emoji: '☃️', mult: 0.7, poids: 1, type: 'aoe' },
      { nom: 'Coup balayé', emoji: '💢', mult: 1.0, poids: 2, type: 'mono' },
    ],
  },
  elementaireAncien: {
    nom: 'Élémentaire ancien', emoji: '🌨️', niveau: 18, boss: true, hp: 800, atk: 40, dex: 10, xp: 650, po: [260, 380],
    drops: [{ id: 'cristal-givre', chance: 1 }, { id: 'cristal-givre', chance: 1 }, { id: 'noyau-golem', chance: 0.6 }],
    attaques: [
      { nom: 'Tempête de givre', emoji: '🌨️', mult: 0.75, poids: 2, type: 'aoe' },
      { nom: 'Lance de glace', emoji: '🧊', mult: 1.3, poids: 2, type: 'mono' },
      { nom: 'Prison de glace', emoji: '🧊', mult: 0.6, poids: 1, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.6 } },
    ],
  },

  // ----- Cœur des Profondeurs (niv. 18-20) -----
  golemAncien: {
    nom: 'Golem ancien', emoji: '🗿', niveau: 19, hp: 380, atk: 42, dex: 4, xp: 240, po: [60, 90],
    drops: [{ id: 'noyau-golem', chance: 0.5 }, { id: 'minerai-fer', chance: 0.4 }],
    attaques: [
      { nom: 'Écrasement', emoji: '💥', mult: 1.25, poids: 2, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.3 } },
      { nom: 'Tremblement', emoji: '🌋', mult: 0.7, poids: 1, type: 'aoe' },
      { nom: 'Coup de poing', emoji: '👊', mult: 1.0, poids: 2, type: 'mono' },
    ],
  },
  ombre: {
    nom: 'Ombre', emoji: '🌑', niveau: 19, hp: 300, atk: 45, dex: 14, xp: 250, po: [60, 95],
    drops: [{ id: 'poussiere-spectre', chance: 0.7 }],
    attaques: [
      { nom: 'Lame d’ombre', emoji: '🌑', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Voile de ténèbres', emoji: '🌫️', mult: 0.65, poids: 1, type: 'aoe' },
    ],
  },
  dragonnet: {
    nom: 'Dragonnet', emoji: '🐉', niveau: 19, hp: 320, atk: 44, dex: 11, xp: 255, po: [65, 95],
    drops: [{ id: 'ecaille-draconique', chance: 0.45 }],
    attaques: [
      { nom: 'Souffle ardent', emoji: '🔥', mult: 0.7, poids: 1, type: 'aoe' },
      { nom: 'Coup de griffes', emoji: '🐾', mult: 1.1, poids: 3, type: 'mono' },
    ],
  },
  gardienEternel: {
    nom: 'Gardien éternel', emoji: '⚱️', niveau: 20, boss: true, hp: 1200, atk: 50, dex: 9, xp: 900, po: [350, 500],
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
// Terres lointaines (v10, niveaux 22-50) : quatre paliers, chacun avec
// DEUX zones jumelles aux récoltes radicalement différentes. À partir
// du palier 38, les monstres sont taillés pour une équipe.
// =====================================================================
Object.assign(MONSTRES, {
  // ----- Jungle de Vaï-Sombre (niv. 22-28) — plantes et venins -----
  panthereOmbre: {
    nom: 'Panthère d’ombre', emoji: '🐆', niveau: 24, hp: 381, atk: 39, dex: 14, xp: 198, po: [24, 48],
    drops: [{ id: 'liane-tressee', chance: 0.4 }, { id: 'venin-concentre', chance: 0.2 }],
    attaques: [
      { nom: 'Griffes jumelles', emoji: '🐾', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Bond des ténèbres', emoji: '🌑', mult: 1.4, poids: 1, type: 'mono' },
    ],
  },
  grenouilleDard: {
    nom: 'Grenouille-dard', emoji: '🐸', niveau: 23, hp: 352, atk: 37, dex: 11, xp: 183, po: [22, 44],
    drops: [{ id: 'venin-concentre', chance: 0.35 }, { id: 'orchidee-lunaire', chance: 0.2 }],
    attaques: [
      { nom: 'Langue-harpon', emoji: '👅', mult: 1.0, poids: 3, type: 'mono' },
      { nom: 'Crachat venimeux', emoji: '🧪', mult: 0.8, poids: 2, type: 'mono', effet: { type: 'poison', degats: 12, duree: 2 } },
    ],
  },
  hommeLiane: {
    nom: 'Homme-liane', emoji: '🌿', niveau: 26, hp: 443, atk: 42, dex: 8, xp: 230, po: [26, 52],
    drops: [{ id: 'liane-tressee', chance: 0.5 }, { id: 'orchidee-lunaire', chance: 0.25 }],
    attaques: [
      { nom: 'Fouet de liane', emoji: '🌿', mult: 1.0, poids: 3, type: 'mono' },
      { nom: 'Sève réparatrice', emoji: '💚', valeur: 52, poids: 1, type: 'soin', nomSoin: true },
    ],
  },
  matriarcheSarpense: {
    nom: 'Matriarche Sarpense', emoji: '🐍', niveau: 28, boss: true, hp: 2142, atk: 56, dex: 12, xp: 1325, po: [168, 280],
    drops: [{ id: 'orchidee-lunaire', chance: 1 }, { id: 'venin-concentre', chance: 0.8 }],
    attaques: [
      { nom: 'Morsure colossale', emoji: '🐍', mult: 1.2, poids: 3, type: 'mono' },
      { nom: 'Étreinte broyeuse', emoji: '💫', mult: 0.9, poids: 1, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.3 } },
      { nom: 'Nuée de serpenteaux', emoji: '🐍', mult: 0.75, poids: 1, type: 'aoe', effet: { type: 'poison', degats: 14, duree: 2 } },
    ],
  },

  // ----- Falaises Hurlantes (niv. 22-28) — minéral et plumes -----
  harpieHurlante: {
    nom: 'Harpie hurlante', emoji: '🦅', niveau: 23, hp: 352, atk: 37, dex: 13, xp: 183, po: [22, 44],
    drops: [{ id: 'plume-de-rokh', chance: 0.4 }, { id: 'cristal-hurleur', chance: 0.15 }],
    attaques: [
      { nom: 'Serres plongeantes', emoji: '🦅', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Cri perçant', emoji: '📢', mult: 0.7, poids: 1, type: 'aoe', effet: { type: 'affaibli', duree: 2 } },
    ],
  },
  gargouilleVigie: {
    nom: 'Gargouille-vigie', emoji: '🗿', niveau: 25, hp: 411, atk: 40, dex: 6, xp: 214, po: [25, 50],
    drops: [{ id: 'basalte-poli', chance: 0.5 }],
    attaques: [
      { nom: 'Poing de pierre', emoji: '🗿', mult: 1.15, poids: 3, type: 'mono' },
      { nom: 'Chute contrôlée', emoji: '💢', mult: 1.45, poids: 1, type: 'mono' },
    ],
  },
  elementaireBourrasque: {
    nom: 'Élémentaire de bourrasque', emoji: '🌬️', niveau: 27, hp: 476, atk: 43, dex: 14, xp: 247, po: [27, 54],
    drops: [{ id: 'cristal-hurleur', chance: 0.35 }, { id: 'plume-de-rokh', chance: 0.3 }],
    attaques: [
      { nom: 'Rafale tranchante', emoji: '🌬️', mult: 1.0, poids: 2, type: 'mono' },
      { nom: 'Tourbillon hurlant', emoji: '🌪️', mult: 0.8, poids: 1, type: 'aoe' },
    ],
  },
  rokhTempetueux: {
    nom: 'Rokh Tempétueux', emoji: '🦅', niveau: 28, boss: true, hp: 2142, atk: 56, dex: 15, xp: 1325, po: [168, 280],
    drops: [{ id: 'plume-de-rokh', chance: 1 }, { id: 'basalte-poli', chance: 0.8 }],
    attaques: [
      { nom: 'Piqué foudroyant', emoji: '⚡', mult: 1.25, poids: 3, type: 'mono' },
      { nom: 'Battement d’ouragan', emoji: '🌪️', mult: 0.8, poids: 2, type: 'aoe' },
    ],
  },

  // ----- Abysses d'Émeraude (niv. 30-36) — trésors de la mer -----
  mureneRodeuse: {
    nom: 'Murène rôdeuse', emoji: '🐍', niveau: 31, hp: 620, atk: 49, dex: 12, xp: 322, po: [31, 62],
    drops: [{ id: 'nacre-abyssale', chance: 0.4 }, { id: 'corail-sanglant', chance: 0.2 }],
    attaques: [
      { nom: 'Morsure éclair', emoji: '⚡', mult: 1.15, poids: 3, type: 'mono' },
      { nom: 'Reptation sournoise', emoji: '🌊', mult: 1.4, poids: 1, type: 'mono' },
    ],
  },
  crabeCuirasse: {
    nom: 'Crabe cuirassé', emoji: '🦀', niveau: 32, hp: 659, atk: 50, dex: 6, xp: 342, po: [32, 64],
    drops: [{ id: 'corail-sanglant', chance: 0.45 }, { id: 'nacre-abyssale', chance: 0.25 }],
    attaques: [
      { nom: 'Pince-étau', emoji: '🦀', mult: 1.1, poids: 3, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.2 } },
      { nom: 'Carapace projetée', emoji: '🛡️', mult: 0.85, poids: 1, type: 'aoe' },
    ],
  },
  sireneFuneste: {
    nom: 'Sirène funeste', emoji: '🧜‍♀️', niveau: 34, hp: 741, atk: 53, dex: 11, xp: 384, po: [34, 68],
    drops: [{ id: 'larme-de-sirene', chance: 0.3 }, { id: 'nacre-abyssale', chance: 0.3 }],
    attaques: [
      { nom: 'Complainte déchirante', emoji: '🎶', mult: 1.0, poids: 2, type: 'mono', effet: { type: 'affaibli', duree: 2 } },
      { nom: 'Chant des abysses', emoji: '💙', valeur: 68, poids: 1, type: 'soin' },
    ],
  },
  leviathanCorallien: {
    nom: 'Léviathan Corallien', emoji: '🐋', niveau: 36, boss: true, hp: 5210, atk: 70, dex: 10, xp: 3070, po: [216, 360],
    drops: [{ id: 'larme-de-sirene', chance: 1 }, { id: 'corail-sanglant', chance: 0.9 }],
    attaques: [
      { nom: 'Mâchoire océane', emoji: '🐋', mult: 1.2, poids: 3, type: 'mono' },
      { nom: 'Raz-de-marée', emoji: '🌊', mult: 0.85, poids: 2, type: 'aoe' },
      { nom: 'Harpon de corail', emoji: '🔱', mult: 1.45, poids: 1, type: 'mono' },
    ],
  },

  // ----- Steppe des Cendres (niv. 30-36) — feu et os -----
  chacalCendre: {
    nom: 'Chacal cendré', emoji: '🐺', niveau: 31, hp: 620, atk: 49, dex: 13, xp: 322, po: [31, 62],
    drops: [{ id: 'cendre-fertile', chance: 0.45 }],
    attaques: [
      { nom: 'Crocs fumants', emoji: '🔥', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Meute de cendre', emoji: '💨', mult: 0.8, poids: 1, type: 'aoe' },
    ],
  },
  salamandreBraise: {
    nom: 'Salamandre de braise', emoji: '🦎', niveau: 33, hp: 699, atk: 52, dex: 10, xp: 362, po: [33, 66],
    drops: [{ id: 'coeur-de-braise', chance: 0.25 }, { id: 'obsidienne-brute', chance: 0.35 }],
    attaques: [
      { nom: 'Langue de feu', emoji: '🔥', mult: 1.05, poids: 3, type: 'mono', effet: { type: 'poison', degats: 15, duree: 2 } },
      { nom: 'Queue incandescente', emoji: '☄️', mult: 1.35, poids: 1, type: 'mono' },
    ],
  },
  ogreMagmatique: {
    nom: 'Ogre magmatique', emoji: '👹', niveau: 35, hp: 783, atk: 55, dex: 7, xp: 406, po: [35, 70],
    drops: [{ id: 'obsidienne-brute', chance: 0.45 }, { id: 'coeur-de-braise', chance: 0.2 }],
    attaques: [
      { nom: 'Massue en fusion', emoji: '🌋', mult: 1.2, poids: 3, type: 'mono' },
      { nom: 'Piétinement sismique', emoji: '💢', mult: 0.85, poids: 1, type: 'aoe', effet: { type: 'etourdi', duree: 1, chance: 0.2 } },
    ],
  },
  behemothCendre: {
    nom: 'Béhémoth de Cendre', emoji: '🌋', niveau: 36, boss: true, hp: 5210, atk: 70, dex: 8, xp: 3070, po: [216, 360],
    drops: [{ id: 'coeur-de-braise', chance: 1 }, { id: 'obsidienne-brute', chance: 0.9 }],
    attaques: [
      { nom: 'Poing de basalte', emoji: '🌋', mult: 1.2, poids: 3, type: 'mono' },
      { nom: 'Nuée ardente', emoji: '🔥', mult: 0.85, poids: 2, type: 'aoe', effet: { type: 'poison', degats: 16, duree: 2 } },
    ],
  },

  // ----- Forêt Pétrifiée (niv. 38-44, équipe conseillée) -----
  treantPetrifie: {
    nom: 'Tréant pétrifié', emoji: '🗿', niveau: 39, hp: 1450, atk: 61, dex: 6, xp: 501, po: [39, 78],
    drops: [{ id: 'bois-petrifie', chance: 0.45 }, { id: 'ambre-noir', chance: 0.2 }],
    attaques: [
      { nom: 'Branche de granit', emoji: '🪨', mult: 1.15, poids: 3, type: 'mono' },
      { nom: 'Racines sismiques', emoji: '💢', mult: 0.85, poids: 1, type: 'aoe' },
    ],
  },
  basilicRunique: {
    nom: 'Basilic runique', emoji: '🦎', niveau: 41, hp: 1599, atk: 63, dex: 11, xp: 552, po: [41, 82],
    drops: [{ id: 'ambre-noir', chance: 0.4 }, { id: 'sphere-runique', chance: 0.12 }],
    attaques: [
      { nom: 'Regard pétrifiant', emoji: '👁️', mult: 0.95, poids: 2, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.3 } },
      { nom: 'Morsure gravée', emoji: '🦷', mult: 1.25, poids: 2, type: 'mono' },
    ],
  },
  moissonneurRunique: {
    nom: 'Moissonneur runique', emoji: '⚱️', niveau: 43, hp: 1747, atk: 66, dex: 9, xp: 606, po: [43, 86],
    drops: [{ id: 'sphere-runique', chance: 0.2 }, { id: 'bois-petrifie', chance: 0.4 }],
    attaques: [
      { nom: 'Faux de quartz', emoji: '⚱️', mult: 1.2, poids: 3, type: 'mono', effet: { type: 'drain', part: 0.35 } },
      { nom: 'Moisson d’éclats', emoji: '💎', mult: 0.85, poids: 1, type: 'aoe' },
    ],
  },
  avatarQuartz: {
    nom: 'Avatar de Quartz', emoji: '💎', niveau: 44, boss: true, hp: 7712, atk: 85, dex: 9, xp: 3170, po: [264, 440],
    drops: [{ id: 'sphere-runique', chance: 1 }, { id: 'ambre-noir', chance: 0.9 }],
    attaques: [
      { nom: 'Lame cristalline', emoji: '💎', mult: 1.2, poids: 3, type: 'mono' },
      { nom: 'Éclats en éventail', emoji: '✨', mult: 0.85, poids: 2, type: 'aoe' },
      { nom: 'Prisme écrasant', emoji: '🔷', mult: 1.5, poids: 1, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.25 } },
    ],
  },

  // ----- Vallée des Géants (niv. 38-44, équipe conseillée) -----
  geantDechu: {
    nom: 'Géant déchu', emoji: '🗿', niveau: 39, hp: 1450, atk: 61, dex: 6, xp: 501, po: [39, 78],
    drops: [{ id: 'os-de-geant', chance: 0.45 }, { id: 'peau-de-mammouth', chance: 0.2 }],
    attaques: [
      { nom: 'Revers de montagne', emoji: '🗿', mult: 1.2, poids: 3, type: 'mono' },
      { nom: 'Frappe au sol', emoji: '💢', mult: 0.85, poids: 1, type: 'aoe', effet: { type: 'etourdi', duree: 1, chance: 0.2 } },
    ],
  },
  mammouthSpectral: {
    nom: 'Mammouth spectral', emoji: '🦣', niveau: 41, hp: 1599, atk: 63, dex: 7, xp: 552, po: [41, 82],
    drops: [{ id: 'peau-de-mammouth', chance: 0.45 }, { id: 'os-de-geant', chance: 0.3 }],
    attaques: [
      { nom: 'Charge d’outre-monde', emoji: '👻', mult: 1.25, poids: 3, type: 'mono' },
      { nom: 'Barrissement glacé', emoji: '🌫️', mult: 0.8, poids: 1, type: 'aoe', effet: { type: 'affaibli', duree: 2 } },
    ],
  },
  chamanOsseux: {
    nom: 'Chaman des os', emoji: '💀', niveau: 43, hp: 1747, atk: 66, dex: 9, xp: 606, po: [43, 86],
    drops: [{ id: 'relique-antique', chance: 0.15 }, { id: 'os-de-geant', chance: 0.4 }],
    attaques: [
      { nom: 'Volée d’esquilles', emoji: '🦴', mult: 1.05, poids: 2, type: 'mono' },
      { nom: 'Chant des ancêtres géants', emoji: '💚', valeur: 92, poids: 1, type: 'soin' },
    ],
  },
  roiOssements: {
    nom: 'Roi des Ossements', emoji: '👑', niveau: 44, boss: true, hp: 7712, atk: 85, dex: 8, xp: 3170, po: [264, 440],
    drops: [{ id: 'relique-antique', chance: 1 }, { id: 'peau-de-mammouth', chance: 0.9 }],
    attaques: [
      { nom: 'Sceptre fémoral', emoji: '🦴', mult: 1.2, poids: 3, type: 'mono' },
      { nom: 'Avalanche d’os', emoji: '☠️', mult: 0.85, poids: 2, type: 'aoe' },
      { nom: 'Poigne sépulcrale', emoji: '🪦', mult: 1.3, poids: 1, type: 'mono', effet: { type: 'drain', part: 0.4 } },
    ],
  },

  // ----- Citadelle de Foudre (niv. 46-50, équipe requise) -----
  sentinelleAcier: {
    nom: 'Sentinelle d’acier', emoji: '🤖', niveau: 47, hp: 2091, atk: 72, dex: 9, xp: 721, po: [47, 94],
    drops: [{ id: 'acier-celeste', chance: 0.35 }, { id: 'fragment-de-foudre', chance: 0.4 }],
    attaques: [
      { nom: 'Lame à induction', emoji: '⚡', mult: 1.15, poids: 3, type: 'mono' },
      { nom: 'Surtension', emoji: '💥', mult: 0.85, poids: 1, type: 'aoe', effet: { type: 'etourdi', duree: 1, chance: 0.2 } },
    ],
  },
  vouivreOrage: {
    nom: 'Vouivre d’orage', emoji: '🐉', niveau: 48, hp: 2183, atk: 74, dex: 13, xp: 751, po: [48, 96],
    drops: [{ id: 'fragment-de-foudre', chance: 0.45 }, { id: 'plume-d-archon', chance: 0.1 }],
    attaques: [
      { nom: 'Souffle voltaïque', emoji: '⚡', mult: 1.1, poids: 2, type: 'mono' },
      { nom: 'Tempête d’ailes', emoji: '🌩️', mult: 0.85, poids: 2, type: 'aoe' },
    ],
  },
  forgeronFoudroye: {
    nom: 'Forgeron foudroyé', emoji: '⚒️', niveau: 49, hp: 2278, atk: 75, dex: 8, xp: 782, po: [49, 98],
    drops: [{ id: 'acier-celeste', chance: 0.4 }, { id: 'fragment-de-foudre', chance: 0.35 }],
    attaques: [
      { nom: 'Marteau conducteur', emoji: '⚒️', mult: 1.25, poids: 3, type: 'mono' },
      { nom: 'Gerbe d’étincelles', emoji: '✨', mult: 0.8, poids: 1, type: 'aoe', effet: { type: 'affaibli', duree: 2 } },
    ],
  },
  archonteTempete: {
    nom: 'Archonte de la Tempête', emoji: '⛈️', niveau: 50, boss: true, hp: 9916, atk: 96, dex: 12, xp: 4070, po: [300, 500],
    drops: [{ id: 'plume-d-archon', chance: 1 }, { id: 'acier-celeste', chance: 0.9 }],
    attaques: [
      { nom: 'Jugement fulgurant', emoji: '⚡', mult: 1.25, poids: 3, type: 'mono' },
      { nom: 'Orage total', emoji: '⛈️', mult: 0.9, poids: 2, type: 'aoe' },
      { nom: 'Lance du firmament', emoji: '🌩️', mult: 1.5, poids: 1, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.3 } },
    ],
  },

  // ----- Néant Scintillant (niv. 46-50, équipe requise) -----
  horreurDuVide: {
    nom: 'Horreur du vide', emoji: '👁️', niveau: 47, hp: 2091, atk: 72, dex: 11, xp: 721, po: [47, 94],
    drops: [{ id: 'etoffe-du-neant', chance: 0.45 }],
    attaques: [
      { nom: 'Tentacule d’ailleurs', emoji: '🌀', mult: 1.15, poids: 3, type: 'mono', effet: { type: 'drain', part: 0.35 } },
      { nom: 'Regard impossible', emoji: '👁️', mult: 0.8, poids: 1, type: 'aoe', effet: { type: 'affaibli', duree: 2 } },
    ],
  },
  tisseuseEtoiles: {
    nom: 'Tisseuse d’étoiles', emoji: '🕷️', niveau: 48, hp: 2183, atk: 74, dex: 12, xp: 751, po: [48, 96],
    drops: [{ id: 'eclat-d-etoile', chance: 0.4 }, { id: 'etoffe-du-neant', chance: 0.3 }],
    attaques: [
      { nom: 'Fil de constellation', emoji: '✨', mult: 1.1, poids: 2, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.25 } },
      { nom: 'Toile cosmique', emoji: '🕸️', mult: 0.85, poids: 2, type: 'aoe' },
    ],
  },
  echoNeant: {
    nom: 'Écho du néant', emoji: '🌌', niveau: 49, hp: 2278, atk: 75, dex: 13, xp: 782, po: [49, 98],
    drops: [{ id: 'essence-primordiale', chance: 0.12 }, { id: 'eclat-d-etoile', chance: 0.35 }],
    attaques: [
      { nom: 'Réplique d’annihilation', emoji: '🌌', mult: 1.2, poids: 3, type: 'mono' },
      { nom: 'Résonance du rien', emoji: '🔇', mult: 0.85, poids: 1, type: 'aoe' },
    ],
  },
  devoreurMondes: {
    nom: 'Dévoreur de Mondes', emoji: '🕳️', niveau: 50, boss: true, hp: 9916, atk: 96, dex: 11, xp: 4070, po: [300, 500],
    drops: [{ id: 'essence-primordiale', chance: 1 }, { id: 'eclat-d-etoile', chance: 0.9 }],
    attaques: [
      { nom: 'Gueule d’horizon', emoji: '🕳️', mult: 1.25, poids: 3, type: 'mono', effet: { type: 'drain', part: 0.4 } },
      { nom: 'Effondrement local', emoji: '🌌', mult: 0.9, poids: 2, type: 'aoe' },
    ],
  },
});

// =====================================================================
// v20 — LA CALIBRATION DU BESTIAIRE.
//
// CE QUI N'ALLAIT PAS. Les points de vie et l'attaque de chaque monstre
// étaient écrits à la main, un par un, sans que rien ne les compare jamais
// à ce qu'un héros de leur niveau peut réellement encaisser et infliger.
// Résultat mesuré : au niveau 22, un héros bien équipé nettoyait un groupe
// de son niveau en 3,4 tours en survivant 31,8 tours — neuf fois plus de
// marge qu'il n'en faut — pendant qu'au niveau 90 la même mesure tombait à
// 1,0. Le milieu de partie était une promenade, la fin de partie un mur, et
// aucun garde-fou ne le signalait.
//
// LA RÈGLE DE LA v20. Les chiffres écrits ci-dessus gardent tout leur sens :
// ils disent le CARACTÈRE de chaque bête — celle-ci encaisse, celle-là
// frappe fort, cette autre est fragile mais rapide. Ce sont des valeurs
// RELATIVES au sein de leur palier. L'échelle ABSOLUE, elle, est dérivée du
// héros : les tables ci-dessous disent, pour chaque niveau, combien de PV et
// d'attaque un monstre doit porter pour qu'un combat dure ce qu'il doit
// durer.
//
// Les cibles sont calculées (js/data/equilibrage.js) sur un héros de
// référence : classe médiane des six, équipement LÉGENDAIRE — un joueur
// bien équipé, pas l'étalon divin que personne n'atteint. Objectif :
//   • un groupe de 3 monstres de son niveau tombe en ~6 tours et coûte
//     à peu près la moitié des points de vie ;
//   • un boss tient ~12 tours et coûte les deux tiers ;
//   • personne ne meurt en un coup, dans aucun des deux sens.
//
// Les tests vérifient le résultat zone par zone. Ajouter un monstre demain
// ne peut plus casser la courbe : il entre dans la calibration comme les
// autres.
// =====================================================================
const PV_CIBLE_MONSTRE = [
76,     78,     87,    102,    102,    109,    113,    131,    135,    184,  // 1–10
     184,    188,    212,    216,    233,    271,    271,    271,    289,    289,  // 11–20
     289,    289,    314,    314,    314,    314,    314,    320,    335,    384,  // 21–30
     398,    398,    398,    403,    440,    440,    440,    440,    440,    440,  // 31–40
     440,    448,    454,    454,    454,    492,    526,    526,    526,    526,  // 41–50
     570,    570,    570,    572,    610,    635,    635,    635,    635,    635,  // 51–60
     635,    694,    699,    699,    710,    767,    779,    787,    798,    851,  // 61–70
     862,    862,    862,   1027,   1040,   1040,   1040,   1040,   1040,   1040,  // 71–80
    1051,   1067,   1079,   1079,   1079,   1230,   1251,   1251,   1251,   1266,  // 81–90
    1279,   1294,   1307,   1377,   1390,   1390,   1390,   1595,   1617,   1617,  // 91–100
];

const ATK_CIBLE_MONSTRE = [
1.9,    2.1,    3.0,    3.2,    4.0,    4.0,    4.2,    5.2,    5.2,    5.7,  // 1–10
     5.7,    6.6,    6.6,    8.5,    8.5,    8.5,    9.1,    9.1,    9.1,    9.8,  // 11–20
    10.0,   10.0,   10.0,   11.5,   12.6,   13.5,   13.5,   13.5,   13.5,   13.5,  // 21–30
    13.5,   13.5,   13.5,   13.5,   13.5,   16.1,   18.0,   19.1,   19.1,   19.6,  // 31–40
    21.2,   21.2,   21.2,   23.8,   23.8,   23.8,   23.8,   23.8,   23.8,   23.8,  // 41–50
    23.8,   23.8,   23.8,   23.8,   23.8,   23.8,   23.8,   23.8,   23.8,   23.8,  // 51–60
    23.8,   24.4,   24.9,   24.9,   24.9,   24.9,   24.9,   27.6,   27.9,   27.9,  // 61–70
    27.9,   27.9,   27.9,   31.5,   31.8,   31.8,   31.8,   31.8,   31.8,   33.7,  // 71–80
    34.2,   34.2,   34.2,   34.2,   34.2,   37.9,   38.2,   38.2,   38.2,   38.2,  // 81–90
    38.2,   41.4,   41.9,   41.9,   41.9,   41.9,   41.9,   48.4,   48.7,   48.7,  // 91–100
];

// Un boss combat SEUL : il lui faut la masse de trois monstres et le temps
// d'exposer ses mécaniques, sans jamais tuer d'un seul coup.
const PV_CIBLE_BOSS = [
405,    414,    462,    545,    545,    584,    600,    699,    722,    982,  // 1–10
     982,   1004,   1129,   1153,   1244,   1446,   1446,   1446,   1542,   1542,  // 11–20
    1542,   1542,   1674,   1674,   1674,   1674,   1674,   1707,   1785,   2049,  // 21–30
    2121,   2121,   2121,   2150,   2345,   2345,   2345,   2345,   2345,   2345,  // 31–40
    2345,   2388,   2420,   2420,   2420,   2624,   2806,   2806,   2806,   2806,  // 41–50
    3040,   3040,   3040,   3048,   3253,   3389,   3389,   3389,   3389,   3389,  // 51–60
    3389,   3701,   3731,   3731,   3787,   4091,   4153,   4197,   4255,   4536,  // 61–70
    4595,   4595,   4595,   5478,   5547,   5547,   5547,   5547,   5547,   5547,  // 71–80
    5608,   5690,   5753,   5753,   5753,   6559,   6670,   6670,   6670,   6752,  // 81–90
    6822,   6903,   6972,   7343,   7415,   7415,   7415,   8506,   8622,   8622,  // 91–100
];

const ATK_CIBLE_BOSS = [
4.2,    4.7,    6.8,    7.3,    9.0,    9.0,    9.4,   11.6,   11.6,   12.8,  // 1–10
    12.8,   14.9,   14.9,   19.1,   19.1,   19.1,   20.4,   20.4,   20.4,   22.0,  // 11–20
    22.6,   22.6,   22.6,   26.0,   28.4,   30.3,   30.3,   30.3,   30.3,   30.3,  // 21–30
    30.3,   30.3,   30.3,   30.3,   30.3,   36.2,   40.5,   43.0,   43.0,   44.0,  // 31–40
    47.8,   47.8,   47.8,   53.7,   53.7,   53.7,   53.7,   53.7,   53.7,   53.7,  // 41–50
    53.7,   53.7,   53.7,   53.7,   53.7,   53.7,   53.7,   53.7,   53.7,   53.7,  // 51–60
    53.7,   55.0,   56.0,   56.0,   56.0,   56.0,   56.0,   62.1,   62.7,   62.7,  // 61–70
    62.7,   62.7,   62.7,   70.8,   71.5,   71.5,   71.5,   71.5,   71.5,   75.9,  // 71–80
    77.0,   77.0,   77.0,   77.0,   77.0,   85.2,   86.0,   86.0,   86.0,   86.0,  // 81–90
    86.0,   93.2,   94.3,   94.3,   94.3,   94.3,   94.3,  108.8,  109.7,  109.7,  // 91–100
];

function cibleMonstre(table, niveau) {
  const n = Math.min(NIVEAU_MAX, Math.max(1, Math.round(niveau) || 1));
  return table[n - 1];
}

// =====================================================================
// Applique la calibration à un registre de monstres.
//
// Le facteur est calculé PAR PALIER, pas par bête : on compare la moyenne
// du palier à sa cible, et on applique le même facteur à tous ses membres.
// C'est ce qui préserve le caractère de chacun — un monstre deux fois plus
// robuste que ses voisins le reste après calibration.
//
// Les niveaux voisins sont agrégés (fenêtre de ±2) : le bestiaire est
// clairsemé, certains paliers n'ont qu'une seule bête et sa moyenne ne
// voudrait rien dire toute seule.
// =====================================================================
function calibrerRegistreMonstres(registre) {
  const bêtes = Object.values(registre).filter((m) => m && typeof m.hp === 'number' && m.niveau);
  if (!bêtes.length) return;

  // Photo des valeurs d'origine AVANT de toucher à quoi que ce soit : sans
  // elle, la moyenne d'un palier se calculait sur des bêtes déjà corrigées
  // et le résultat dépendait de l'ordre de déclaration dans le fichier.
  const origine = new Map(bêtes.map((m) => [m, { hp: m.hp, atk: m.atk }]));

  const moyenneAutour = (niveau, estBoss, champ) => {
    for (let rayon = 1; rayon <= 12; rayon += 1) {
      const proches = bêtes.filter((m) => !!m.boss === estBoss && Math.abs(m.niveau - niveau) <= rayon);
      if (proches.length >= 2) return proches.reduce((a, m) => a + origine.get(m)[champ], 0) / proches.length;
    }
    const tous = bêtes.filter((m) => !!m.boss === estBoss);
    return tous.length ? tous.reduce((a, m) => a + origine.get(m)[champ], 0) / tous.length : null;
  };

  // À quel point garde-t-on l'écart d'origine à la moyenne de son palier ?
  //
  // 1 = on garde tout : deux zones du même niveau restaient trois fois plus
  // dures l'une que l'autre, parce que leurs chiffres avaient été écrits à
  // des mois d'intervalle. 0 = tout le monde pareil, et le bestiaire perd
  // son relief. À 0,35, une bête réputée coriace le reste nettement, sans
  // qu'une zone devienne un mur et sa jumelle une promenade.
  const RELIEF = 0.35;
  const recentre = (valeur, moyenne, cible) => {
    if (!(moyenne > 0)) return valeur;
    const ecart = valeur / moyenne - 1;
    return Math.max(1, Math.round(cible * (1 + RELIEF * ecart)));
  };

  bêtes.forEach((m) => {
    const estBoss = !!m.boss;
    const avant = origine.get(m).hp;
    m.hp = recentre(avant, moyenneAutour(m.niveau, estBoss, 'hp'),
      cibleMonstre(estBoss ? PV_CIBLE_BOSS : PV_CIBLE_MONSTRE, m.niveau));
    m.atk = recentre(origine.get(m).atk, moyenneAutour(m.niveau, estBoss, 'atk'),
      cibleMonstre(estBoss ? ATK_CIBLE_BOSS : ATK_CIBLE_MONSTRE, m.niveau));

    // La récompense suit l'effort. Un monstre qui demande deux fois plus de
    // tours rapporte deux fois plus : sans ça, rééquilibrer la difficulté
    // reviendrait à tripler le temps de jeu pour un même niveau — la
    // définition exacte du grind. L'XP par tour, elle, ne bouge pas.
    const effort = avant > 0 ? m.hp / avant : 1;
    if (typeof m.xp === 'number') m.xp = Math.max(1, Math.round(m.xp * effort));
    if (Array.isArray(m.po)) m.po = m.po.map((v) => Math.max(1, Math.round(v * effort)));
  });
}

// Le bestiaire des donjons vit dans son propre registre (js/donjons/epopees.js) ;
// l'appel se fait donc en bout de chaîne de chargement, quand les deux existent.
function calibrerBestiaire() {
  calibrerRegistreMonstres(MONSTRES);
  if (typeof MONSTRES_DONJONS !== 'undefined') calibrerRegistreMonstres(MONSTRES_DONJONS);
}
