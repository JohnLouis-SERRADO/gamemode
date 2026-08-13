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
      { nom: 'Totem de soin', emoji: '🪅', poids: 2, type: 'soin', valeur: 30 },
    ],
  },
  golemMineur: {
    nom: 'Golem mineur', emoji: '🪨', niveau: 8, hp: 130, atk: 17, agi: 3, xp: 88, po: [20, 34],
    drops: [{ id: 'minerai-cuivre', chance: 0.5 }, { id: 'minerai-fer', chance: 0.35 }],
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
      { nom: 'Prière noire', emoji: '🩸', poids: 2, type: 'soin', valeur: 55 },
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
    nom: 'Roi déchu', emoji: '🫅', niveau: 14, boss: true, hp: 520, atk: 30, agi: 8, xp: 560, po: [160, 240],
    drops: [{ id: 'os-ancien', chance: 1 }, { id: 'poussiere-spectre', chance: 1 }, { id: 'poussiere-spectre', chance: 0.6 }],
    attaques: [
      { nom: 'Lame maudite', emoji: '⚔️', mult: 1.2, poids: 2, type: 'mono' },
      { nom: 'Vague nécrotique', emoji: '🌊', mult: 0.7, poids: 2, type: 'aoe' },
      { nom: 'Malédiction royale', emoji: '👑', mult: 0.9, poids: 1, type: 'mono', effet: { type: 'poison', degats: 8, duree: 3 } },
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
    nom: 'Élémentaire ancien', emoji: '🌨️', niveau: 18, boss: true, hp: 800, atk: 40, agi: 10, xp: 800, po: [260, 380],
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
    nom: 'Gardien éternel', emoji: '⚱️', niveau: 20, boss: true, hp: 1200, atk: 50, agi: 9, xp: 1500, po: [500, 700],
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
    id: 'cryptes', nom: 'Cryptes Oubliées', emoji: '🕯️', niveauMin: 10, plage: 'niv. 10-14',
    desc: 'Les tombeaux d’un royaume disparu. Ses habitants n’apprécient pas les visites.',
    monstres: ['squelette', 'archerSquelette', 'pretreDechu', 'spectre'], boss: 'roiDechu',
    recolte: [{ id: 'os-ancien', chance: 0.8 }, { id: 'poussiere-spectre', chance: 0.4 }],
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

function zonePar(idZone) {
  return ZONES.find((z) => z.id === idZone);
}
