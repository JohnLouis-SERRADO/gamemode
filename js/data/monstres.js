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
//
// v21 — ATK_CIBLE_MONSTRE et ATK_CIBLE_BOSS ont été RECALCULÉES, parce que
// le héros sur lequel elles étaient dérivées n'existe plus : la Ténacité,
// qui lui retranchait jusqu'à 40 % des dégâts subis, a été retirée du jeu.
//
// Ce que l'ancienne échelle donnait réellement, mesuré zone par zone : la
// tension allait de 3,2× dans les Plaines à 1,1× au Dernier Point, et les
// dégâts encaissés du simple au double d'une carte à l'autre — non pas
// parce que le bestiaire l'avait voulu, mais parce que le héros portait ses
// 40 % de Ténacité dans certaines zones et 4 % dans d'autres. Les creux les
// plus profonds tombaient exactement sur les cartes les mieux stuffées.
//
// L'échelle vise une tension nette : 2,0× au niveau 1 qui se resserre
// régulièrement à 1,6× au niveau 100 — la fin de partie doit mordre, sans
// jamais devenir le mur qu'elle était.
//
// =====================================================================
// v21.1 — LES DEUX COURBES SE DÉRIVENT SÉPARÉMENT, ET IL A FALLU JOUER
// POUR S'EN APERCEVOIR.
//
// Le banc d'équilibrage se trompait d'un facteur deux (voir l'en-tête de
// js/data/equilibrage.js : il ne faisait jamais mourir les monstres et
// ignorait les lignes de combat). Les deux courbes en héritaient. Simulation
// de vrais combats, trente parties par classe et par palier : cinq classes
// sur six gagnaient 100 % du temps sans une seule mort, en finissant avec
// 74 à 100 % de leurs points de vie. Les monstres ordinaires tapent donc
// désormais environ deux fois plus fort.
//
// Mais la correction du groupe NE VAUT PAS pour un boss, et l'avoir appliquée
// aux deux a coûté une seconde passe : le Gardien perdait contre TOUS les
// boss, à tous les niveaux, vingt fois sur vingt. La raison tient en une
// phrase — la correction venait de l'ATTRITION, du fait que dans un groupe
// les bêtes tombent une par une et cessent de frapper, et un boss se bat
// SEUL. Il n'y avait rien à corriger pour lui.
//
// Chaque courbe se dérive donc de SON objectif propre :
//   • monstre ordinaire  groupe de 3, marge 2,0 → 1,6 selon le niveau ;
//   • boss               combat seul, marge 1,5 — les deux tiers de la vie.
// =====================================================================
const PV_CIBLE_MONSTRE = [
88,     92,    102,    129,    129,    137,    141,    168,    169,    237,  // 1–10
     237,    241,    272,    276,    309,    362,    362,    371,    397,    397,  // 11–20
     397,    397,    420,    420,    420,    420,    420,    431,    451,    510,  // 21–30
     528,    528,    528,    534,    582,    582,    582,    582,    582,    582,  // 31–40
     582,    582,    585,    585,    585,    635,    679,    679,    679,    679,  // 41–50
     751,    751,    751,    753,    803,    837,    837,    837,    837,    837,  // 51–60
     837,    913,    921,    921,    935,   1010,   1025,   1025,   1028,   1096,  // 61–70
    1110,   1110,   1110,   1352,   1368,   1368,   1368,   1368,   1368,   1368,  // 71–80
    1383,   1383,   1389,   1393,   1409,   1615,   1642,   1642,   1642,   1664,  // 81–90
    1681,   1699,   1716,   1808,   1826,   1826,   1826,   2093,   2122,   2122,  // 91–100
];

const ATK_CIBLE_MONSTRE = [
4.5,     6.6,     7.6,     8.3,     9.1,    10.6,    11.1,    11.7,    12.2,    15.8,  // 1–10
        16.3,    18.3,    18.8,    20.3,    20.5,    21.0,    21.0,    21.0,    22.5,    22.5,  // 11–20
        22.5,    24.0,    24.0,    24.0,    24.0,    24.8,    25.3,    25.6,    26.1,    26.6,  // 21–30
        28.6,    29.4,    29.7,    29.9,    30.8,    33.5,    34.0,    34.4,    34.9,    35.4,  // 31–40
        35.7,    36.3,    36.8,    37.5,    38.1,    38.6,    39.2,    39.4,    40.0,    40.6,  // 41–50
        41.1,    41.7,    42.5,    43.1,    43.7,    45.6,    46.2,    47.0,    47.7,    48.5,  // 51–60
        49.3,    50.1,    50.9,    54.5,    54.5,    54.5,    54.5,    56.2,    56.8,    59.1,  // 61–70
        59.8,    59.8,    60.7,    61.4,    62.0,    63.3,    63.9,    64.2,    64.9,    65.5,  // 71–80
        66.5,    67.9,    68.8,    69.5,    70.5,    71.5,    72.5,    73.5,    74.1,    76.0,  // 81–90
        77.0,    78.0,    79.0,    79.7,    80.6,    81.5,    82.2,    85.0,    85.7,    96.1,  // 91–100
];

// Un boss combat SEUL : il lui faut la masse de trois monstres et le temps
// d'exposer ses mécaniques, sans jamais tuer d'un seul coup.
const PV_CIBLE_BOSS = [
468,    490,    547,    686,    686,    731,    751,    898,    899,   1265,  // 1–10
    1265,   1285,   1452,   1473,   1649,   1932,   1932,   1979,   2120,   2120,  // 11–20
    2120,   2120,   2237,   2237,   2237,   2237,   2237,   2299,   2403,   2722,  // 21–30
    2816,   2816,   2816,   2848,   3106,   3106,   3106,   3106,   3106,   3106,  // 31–40
    3106,   3106,   3122,   3122,   3122,   3386,   3620,   3620,   3620,   3620,  // 41–50
    4006,   4006,   4006,   4016,   4285,   4463,   4463,   4463,   4463,   4463,  // 51–60
    4463,   4871,   4910,   4910,   4984,   5385,   5466,   5466,   5481,   5844,  // 61–70
    5919,   5919,   5919,   7208,   7298,   7298,   7298,   7298,   7298,   7298,  // 71–80
    7376,   7376,   7410,   7429,   7514,   8614,   8759,   8759,   8759,   8874,  // 81–90
    8966,   9063,   9154,   9644,   9739,   9739,   9739,  11164,  11317,  11317,  // 91–100
];

const ATK_CIBLE_BOSS = [
6.2,     8.1,    10.7,    11.4,    12.8,    14.5,    15.1,    16.0,    16.6,    20.0,  // 1–10
        20.7,    22.2,    22.5,    26.4,    26.4,    26.4,    27.2,    27.9,    28.5,    29.1,  // 11–20
        31.1,    31.1,    31.5,    32.0,    32.6,    33.3,    34.1,    34.6,    34.7,    35.4,  // 21–30
        38.2,    38.2,    38.3,    39.8,    39.8,    40.7,    41.3,    41.6,    42.2,    42.8,  // 31–40
        43.3,    44.0,    46.7,    46.7,    47.0,    47.0,    47.0,    47.3,    47.8,    49.9,  // 41–50
        49.9,    49.9,    52.3,    52.3,    55.4,    55.4,    55.4,    57.2,    57.2,    57.2,  // 51–60
        57.2,    61.4,    62.3,    62.3,    62.3,    62.3,    62.3,    63.8,    64.3,    72.2,  // 61–70
        72.2,    72.2,    72.2,    72.2,    72.2,    72.8,    72.8,    72.8,    72.8,    72.8,  // 71–80
        73.1,    77.8,    77.8,    77.8,    77.8,    78.1,    78.6,    83.1,    83.1,    83.1,  // 81–90
        83.1,    83.7,    84.2,    84.2,    84.2,    84.2,    84.2,    84.5,    85.2,    95.9,  // 91–100
];

// =====================================================================
// v20.2 — LA COURBE D'EXPÉRIENCE, rendue lisible.
//
// Un niveau doit coûter plus cher que le précédent — c'est le principe, et
// il est bon. Encore faut-il que la pente se sente sans faire mur. Mesuré
// avant correction, en nombre de combats nécessaires pour gagner un niveau :
//
//     niveau  1 →   1,6 combat        niveau 57 →  33 combats
//     niveau 25 →   9,2 combats       niveau 89 → 105 combats
//     niveau 41 →  16,2 combats       niveau 99 → 185 combats
//
// Un rapport de 114 entre le palier le plus rapide et le plus lent. Ce
// n'est pas une pente, c'est une falaise : la courbe d'XP requise grimpe en
// carré pendant que l'XP des monstres suit à peine leurs points de vie.
//
// L'XP d'un monstre est désormais DÉRIVÉE du rythme voulu : cinq combats
// par niveau au départ, une petite trentaine à la fin. La pente reste
// franche — six fois plus long à la fin qu'au début — mais régulière.
//
// La table est générée pour le facteur d'XP en vigueur (voir xpReelle dans
// js/game.js) ; un test vérifie que le rythme obtenu colle toujours à la
// cible, de sorte qu'on ne puisse pas changer l'un sans voir l'autre bouger.
// =====================================================================
const XP_CIBLE_MONSTRE = [
25,      39,      51,      63,      74,      84,      94,     103,     111,     119,  // 1–10
      126,     133,     139,     145,     151,     157,     162,     167,     171,     176,  // 11–20
      180,     184,     188,     192,     195,     198,     202,     205,     208,     211,  // 21–30
      213,     216,     219,     221,     224,     226,     228,     230,     232,     234,  // 31–40
      236,     238,     240,     242,     243,     245,     247,     248,     250,     293,  // 41–50
      338,     387,     437,     491,     546,     604,     664,     726,     790,     856,  // 51–60
      924,     994,    1065,    1138,    1213,    1289,    1367,    1447,    1527,    1609,  // 61–70
     1692,    1777,    1863,    1950,    2038,    2128,    2218,    2309,    2402,    2983,  // 71–80
     3621,    4314,    5060,    5858,    6706,    7604,    8548,    9539,   10575,   11655,  // 81–90
    12778,   13942,   15146,   16390,   17673,   18992,   20348,   21740,   23167,   23167,  // 91–100
];

// Un boss vaut une poignée de monstres ordinaires : il tient plus longtemps
// et ne se rencontre qu'une fois.
const MULT_XP_BOSS = 8;

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
  const origine = new Map(bêtes.map((m) => [m, { hp: m.hp, atk: m.atk, xp: m.xp }]));

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

    // L'OR suit l'effort : un monstre qui demande deux fois plus de tours
    // rapporte deux fois plus de pièces.
    const effort = avant > 0 ? m.hp / avant : 1;
    if (Array.isArray(m.po)) m.po = m.po.map((v) => Math.max(1, Math.round(v * effort)));

    // L'EXPÉRIENCE, elle, ne suit pas l'effort mais le RYTHME voulu : c'est
    // elle qui décide combien de combats séparent deux niveaux, et c'est là
    // que se jouait la falaise de fin de partie.
    if (typeof m.xp === 'number') {
      const cibleXp = cibleMonstre(XP_CIBLE_MONSTRE, m.niveau) * (estBoss ? MULT_XP_BOSS : 1);
      m.xp = recentre(origine.get(m).xp, moyenneAutour(m.niveau, estBoss, 'xp'), cibleXp);
    }
  });
}

// Le bestiaire des donjons vit dans son propre registre (js/donjons/epopees.js) ;
// l'appel se fait donc en bout de chaîne de chargement, quand les deux existent.
function calibrerBestiaire() {
  calibrerRegistreMonstres(MONSTRES);
  if (typeof MONSTRES_DONJONS !== 'undefined') calibrerRegistreMonstres(MONSTRES_DONJONS);
}
