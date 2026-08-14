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
  cha: { nom: 'Chance',       emoji: '🍀', desc: 'Augmente les trouvailles et la rareté du butin' },
};

const POINTS_CREATION = 10;   // points à répartir à la création
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

const CATEGORIES = {
  physique: '⚔️ Physique',
  magie: '🔮 Magie',
  soutien: '✨ Soutien',
};

// =====================================================================
// Détails chiffrés d'une compétence pour un jeu de stats donné
// =====================================================================
const TEXTE_CIBLE = {
  ennemi: 'un ennemi', ennemis: 'tous les ennemis',
  allie: 'un allié', allies: 'tout le groupe', soi: 'soi-même',
};

function texteEffetCompetence(effet, s) {
  switch (effet.type) {
    case 'poison': {
      const valeur = effet.degats != null
        ? effet.degats
        : Math.round(3 + (s[effet.stat || 'agi'] || 0) * (effet.stat === 'int' ? 0.5 : 0.6));
      return `🧪 poison ≈${valeur}/tour (${effet.duree} t.)`;
    }
    case 'etourdi':
      return `💫 étourdit${effet.chance != null && effet.chance < 1 ? ` (${Math.round(effet.chance * 100)} %)` : ''}`;
    case 'affaibli': return `⬇️ −30 % dégâts (${effet.duree} t.)`;
    case 'bouclier': return `🛡️ bouclier ≈${Math.round(8 + (s.int || 0) * 1.5)} (${effet.duree} t.)`;
    case 'benediction': return `🙏 +30 % dégâts (${effet.duree} t.)`;
    case 'provocation': return `😤 attire les coups + bouclier ≈${Math.round(4 + (s.for || 0))}`;
    case 'regen': return `💧 régén. ≈${Math.round(3 + (s.int || 0) * 0.8)}/tour (${effet.duree} t.)`;
    case 'mana': return `🧘 +${effet.valeur} PM`;
    case 'drain': return `🧛 rend ${Math.round(effet.part * 100)} % des dégâts en PV`;
    case 'pacte': return `🩸 −${Math.round(effet.partPv * 100)} % PV max → +${effet.mana} PM`;
    case 'vol-or': return `💰 vole ≈${Math.round(4 + (s.agi || 0) * 1.2)} po`;
    default: return '';
  }
}

// Renvoie des lignes chiffrées (dégâts, soins, effets, coût) calculées
// avec les stats effectives fournies.
function detailsCompetence(comp, s) {
  const parts = [];
  if (comp.type === 'degats') {
    const brut = Math.round(comp.puissance + (s[comp.stat] || 0) * comp.ratio);
    parts.push(`⚔️ ≈${brut} dégâts${comp.coups ? ` ×${comp.coups} coups` : ''}`);
  } else if (comp.type === 'soin') {
    parts.push(`💚 ≈${Math.round(comp.puissance + (s[comp.stat] || 0) * comp.ratio)} PV`);
  }
  if (comp.critBonus) parts.push(`💥 +${Math.round(comp.critBonus * 100)} % crit.`);
  if (comp.effet) {
    const texte = texteEffetCompetence(comp.effet, s);
    if (texte) parts.push(texte);
  }
  parts.push(`🎯 ${TEXTE_CIBLE[comp.cible]}`);
  parts.push(comp.coutMp > 0 ? `💧 ${comp.coutMp} PM` : '💧 gratuit');
  if (comp.cooldown) parts.push(`⏳ ${comp.cooldown} t.`);
  return parts;
}

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

  // ----- Voie du Paladin -----
  'chatiment-sacre': {
    nom: 'Châtiment sacré', emoji: '🌟', categorie: 'physique', type: 'degats', cible: 'ennemi',
    stat: 'for', puissance: 7, ratio: 1.3, coutMp: 5, cooldown: 2,
    effet: { type: 'drain', part: 0.3 },
    desc: 'Une frappe bénie qui vous rend 30 % des dégâts infligés en PV.',
  },
  'jugement': {
    nom: 'Jugement', emoji: '⚖️', categorie: 'physique', type: 'degats', cible: 'ennemi',
    stat: 'for', puissance: 6, ratio: 1.1, coutMp: 7, cooldown: 4,
    effet: { type: 'affaibli', duree: 2 },
    desc: 'Frappe un ennemi et l’affaiblit : −30 % de dégâts pendant 2 tours.',
  },
  'aura-protection': {
    nom: 'Aura de protection', emoji: '🕊️', categorie: 'soutien', type: 'utilitaire', cible: 'allies',
    stat: 'int', coutMp: 9, cooldown: 5,
    effet: { type: 'bouclier', duree: 3 },
    desc: 'Un bouclier sacré protège tout le groupe pendant 3 tours.',
  },
  'imposition-mains': {
    nom: 'Imposition des mains', emoji: '🙌', categorie: 'soutien', type: 'soin', cible: 'allie',
    stat: 'int', puissance: 18, ratio: 2.2, coutMp: 10, cooldown: 5,
    desc: 'Un soin majeur, capable de ramener un allié du bord du gouffre.',
  },

  // ----- Voie du Nécromancien -----
  'faux-spectrale': {
    nom: 'Faux spectrale', emoji: '⚰️', categorie: 'magie', type: 'degats', cible: 'ennemi',
    stat: 'int', puissance: 11, ratio: 1.6, coutMp: 7, cooldown: 3,
    desc: 'Une lame d’outre-tombe fauche un ennemi. Dégâts élevés.',
  },
  'peste': {
    nom: 'Peste', emoji: '🦠', categorie: 'magie', type: 'degats', cible: 'ennemis',
    stat: 'int', puissance: 3, ratio: 0.7, coutMp: 10, cooldown: 4,
    effet: { type: 'poison', duree: 2, stat: 'int' },
    desc: 'Un nuage pestilentiel blesse et empoisonne tous les ennemis.',
  },
  'terreur': {
    nom: 'Terreur', emoji: '😱', categorie: 'magie', type: 'degats', cible: 'ennemis',
    stat: 'int', puissance: 2, ratio: 0.5, coutMp: 11, cooldown: 5,
    effet: { type: 'etourdi', duree: 1, chance: 0.35 },
    desc: 'Une vague d’effroi : chaque ennemi a 35 % de chances d’être étourdi.',
  },
  'pacte-sombre': {
    nom: 'Pacte sombre', emoji: '🩸', categorie: 'magie', type: 'utilitaire', cible: 'soi',
    stat: 'int', coutMp: 0, cooldown: 3,
    effet: { type: 'pacte', partPv: 0.15, mana: 18 },
    desc: 'Sacrifie 15 % de vos PV max pour récupérer 18 PM. Le pouvoir a un prix.',
  },

  // ----- Voie du Moine -----
  'rafale-de-coups': {
    nom: 'Rafale de coups', emoji: '👊', categorie: 'physique', type: 'degats', cible: 'ennemi',
    stat: 'agi', puissance: 2, ratio: 0.55, coups: 3, coutMp: 6, cooldown: 3,
    desc: 'Trois coups éclair sur la même cible, chacun pouvant être critique.',
  },
  'paume-zephyr': {
    nom: 'Paume du zéphyr', emoji: '🌬️', categorie: 'physique', type: 'degats', cible: 'ennemi',
    stat: 'agi', puissance: 6, ratio: 1.0, coutMp: 6, cooldown: 4,
    effet: { type: 'etourdi', duree: 1, chance: 0.4 },
    desc: 'Une paume précise avec 40 % de chances d’étourdir.',
  },
  'meditation-profonde': {
    nom: 'Méditation profonde', emoji: '☯️', categorie: 'soutien', type: 'soin', cible: 'soi',
    stat: 'vit', puissance: 5, ratio: 0.8, coutMp: 0, cooldown: 4,
    effet: { type: 'mana', valeur: 8 },
    desc: 'Un instant de calme : récupère des PV (Vitalité) et 8 PM.',
  },
  'poing-dragon': {
    nom: 'Poing du dragon', emoji: '🐲', categorie: 'physique', type: 'degats', cible: 'ennemi',
    stat: 'agi', puissance: 14, ratio: 1.8, coutMp: 9, cooldown: 5,
    desc: 'Le coup ultime des arts martiaux. Dévastateur, mais épuisant.',
  },

  // ----- Voie du Barde -----
  'chant-heroique': {
    nom: 'Chant héroïque', emoji: '🎺', categorie: 'soutien', type: 'utilitaire', cible: 'allies',
    stat: 'int', coutMp: 9, cooldown: 5,
    effet: { type: 'benediction', duree: 2 },
    desc: 'Tout le groupe gagne +30 % de dégâts pendant 2 tours.',
  },
  'melodie-apaisante': {
    nom: 'Mélodie apaisante', emoji: '🎻', categorie: 'soutien', type: 'utilitaire', cible: 'allies',
    stat: 'int', coutMp: 8, cooldown: 5,
    effet: { type: 'regen', duree: 3 },
    desc: 'Tout le groupe régénère des PV pendant 3 tours.',
  },
  'fausse-note': {
    nom: 'Fausse note', emoji: '🎵', categorie: 'soutien', type: 'degats', cible: 'ennemis',
    stat: 'int', puissance: 2, ratio: 0.4, coutMp: 8, cooldown: 4,
    effet: { type: 'affaibli', duree: 2 },
    desc: 'Un accord dissonant blesse tous les ennemis et les affaiblit (−30 % dégâts).',
  },

  // ----- Voie du Rôdeur -----
  'morsure-du-loup': {
    nom: 'Morsure du loup', emoji: '🐺', categorie: 'physique', type: 'degats', cible: 'ennemi',
    stat: 'agi', puissance: 4, ratio: 0.8, coups: 2, coutMp: 5, cooldown: 2,
    desc: 'Votre compagnon loup mord deux fois la cible.',
  },
  'ronces-etrangleuses': {
    nom: 'Ronces étrangleuses', emoji: '🌿', categorie: 'physique', type: 'degats', cible: 'ennemis',
    stat: 'agi', puissance: 3, ratio: 0.6, coutMp: 9, cooldown: 4,
    effet: { type: 'poison', duree: 2 },
    desc: 'Des ronces lacèrent et empoisonnent tous les ennemis.',
  },
  'instinct-sauvage': {
    nom: 'Instinct sauvage', emoji: '👁️', categorie: 'soutien', type: 'utilitaire', cible: 'soi',
    stat: 'agi', coutMp: 6, cooldown: 5,
    effet: { type: 'benediction', duree: 3 },
    desc: 'Vos sens s’aiguisent : +30 % de dégâts pendant 3 tours.',
  },

  // ----- Voie de l'Assassin -----
  'lame-dans-l-ombre': {
    nom: 'Lame dans l’ombre', emoji: '🌑', categorie: 'physique', type: 'degats', cible: 'ennemi',
    stat: 'agi', puissance: 8, ratio: 1.3, coutMp: 5, cooldown: 2, critBonus: 0.35,
    desc: 'Une attaque surgie de nulle part, presque toujours critique.',
  },
  'voile-de-fumee': {
    nom: 'Voile de fumée', emoji: '💨', categorie: 'soutien', type: 'utilitaire', cible: 'soi',
    stat: 'int', coutMp: 6, cooldown: 4,
    effet: { type: 'bouclier', duree: 2 },
    desc: 'Un nuage de fumée brouille les coups ennemis (bouclier).',
  },
  'mise-a-mort': {
    nom: 'Mise à mort', emoji: '☠️', categorie: 'physique', type: 'degats', cible: 'ennemi',
    stat: 'agi', puissance: 12, ratio: 2.1, coutMp: 10, cooldown: 5, critBonus: 0.15,
    desc: 'Le coup de grâce de l’assassin. Dévastateur.',
  },

  // ----- Voie du Berserker -----
  'dechainement': {
    nom: 'Déchaînement', emoji: '🪓', categorie: 'physique', type: 'degats', cible: 'ennemi',
    stat: 'for', puissance: 9, ratio: 1.7, coutMp: 6, cooldown: 3,
    desc: 'Un coup de hache d’une violence inouïe.',
  },
  'cri-de-guerre': {
    nom: 'Cri de guerre', emoji: '📢', categorie: 'soutien', type: 'utilitaire', cible: 'soi',
    stat: 'for', coutMp: 5, cooldown: 5,
    effet: { type: 'benediction', duree: 2 },
    desc: 'Un rugissement qui décuple votre rage : +30 % de dégâts.',
  },
  'fureur-sanglante': {
    nom: 'Fureur sanglante', emoji: '🩸', categorie: 'physique', type: 'degats', cible: 'ennemi',
    stat: 'for', puissance: 6, ratio: 1.2, coutMp: 7, cooldown: 3,
    effet: { type: 'drain', part: 0.25 },
    desc: 'Frappe et récupère 25 % des dégâts en PV. Le sang appelle le sang.',
  },

  // ----- Voie du Templier -----
  'verdict-de-fer': {
    nom: 'Verdict de fer', emoji: '⚙️', categorie: 'physique', type: 'degats', cible: 'ennemi',
    stat: 'for', puissance: 5, ratio: 1.0, coutMp: 7, cooldown: 4,
    effet: { type: 'etourdi', duree: 1, chance: 0.5 },
    desc: 'Le marteau du jugement : 50 % de chances d’étourdir.',
  },

  // ----- Voie de l'Élémentaliste -----
  'orage-elementaire': {
    nom: 'Orage élémentaire', emoji: '🌩️', categorie: 'magie', type: 'degats', cible: 'ennemis',
    stat: 'int', puissance: 5, ratio: 0.95, coutMp: 10, cooldown: 3,
    desc: 'Feu, glace et foudre s’abattent sur tous les ennemis.',
  },
  'lance-de-glace': {
    nom: 'Lance de glace', emoji: '🧊', categorie: 'magie', type: 'degats', cible: 'ennemi',
    stat: 'int', puissance: 7, ratio: 1.25, coutMp: 6, cooldown: 3,
    effet: { type: 'etourdi', duree: 1, chance: 0.3 },
    desc: 'Un pieu de glace qui peut figer la cible (30 %).',
  },
  'bouclier-de-lave': {
    nom: 'Bouclier de lave', emoji: '🌋', categorie: 'magie', type: 'utilitaire', cible: 'soi',
    stat: 'int', coutMp: 7, cooldown: 4,
    effet: { type: 'bouclier', duree: 3 },
    desc: 'Une carapace de magma en fusion vous protège.',
  },

  // ----- Voie du Druide -----
  'griffes-d-ours': {
    nom: 'Griffes d’ours', emoji: '🐻', categorie: 'magie', type: 'degats', cible: 'ennemi',
    stat: 'int', puissance: 8, ratio: 1.35, coutMp: 5, cooldown: 2,
    desc: 'L’esprit de l’ours frappe à travers vous.',
  },
  'essaim-piqueur': {
    nom: 'Essaim piqueur', emoji: '🐝', categorie: 'magie', type: 'degats', cible: 'ennemis',
    stat: 'int', puissance: 2, ratio: 0.55, coutMp: 9, cooldown: 4,
    effet: { type: 'poison', duree: 2, stat: 'int' },
    desc: 'Un nuage d’insectes pique et empoisonne tous les ennemis.',
  },
  'seve-regeneratrice': {
    nom: 'Sève régénératrice', emoji: '🌱', categorie: 'soutien', type: 'utilitaire', cible: 'allies',
    stat: 'int', coutMp: 9, cooldown: 5,
    effet: { type: 'regen', duree: 3 },
    desc: 'La sève de la forêt régénère tout le groupe pendant 3 tours.',
  },

  // ----- Voie de l'Invocateur -----
  'familier-flamboyant': {
    nom: 'Familier flamboyant', emoji: '🐦‍🔥', categorie: 'magie', type: 'degats', cible: 'ennemi',
    stat: 'int', puissance: 3, ratio: 0.75, coups: 2, coutMp: 6, cooldown: 2,
    desc: 'Votre phénix fond deux fois sur la cible.',
  },
  'horde-spectrale': {
    nom: 'Horde spectrale', emoji: '👻', categorie: 'magie', type: 'degats', cible: 'ennemis',
    stat: 'int', puissance: 4, ratio: 0.85, coutMp: 10, cooldown: 3,
    desc: 'Une meute d’esprits déferle sur tous les ennemis.',
  },
  'pacte-du-golem': {
    nom: 'Pacte du golem', emoji: '🗿', categorie: 'magie', type: 'utilitaire', cible: 'soi',
    stat: 'int', coutMp: 8, cooldown: 5,
    effet: { type: 'bouclier', duree: 3 },
    desc: 'Un golem de pierre s’interpose entre vous et le danger.',
  },

  // ----- Voie du Pyromancien -----
  'deflagration': {
    nom: 'Déflagration', emoji: '💥', categorie: 'magie', type: 'degats', cible: 'ennemi',
    stat: 'int', puissance: 12, ratio: 1.8, coutMp: 9, cooldown: 4,
    desc: 'Une explosion concentrée d’une chaleur insoutenable.',
  },
  'mur-de-flammes': {
    nom: 'Mur de flammes', emoji: '🔥', categorie: 'magie', type: 'degats', cible: 'ennemis',
    stat: 'int', puissance: 3, ratio: 0.65, coutMp: 10, cooldown: 4,
    effet: { type: 'poison', duree: 2, stat: 'int' },
    desc: 'Les flammes lèchent tous les ennemis et les brûlent sur la durée.',
  },
  'combustion': {
    nom: 'Combustion', emoji: '🎇', categorie: 'magie', type: 'degats', cible: 'ennemi',
    stat: 'int', puissance: 6, ratio: 1.1, coutMp: 7, cooldown: 3,
    effet: { type: 'affaibli', duree: 2 },
    desc: 'Enflamme la cible : ses coups perdent 30 % de puissance.',
  },

  // ----- Voie du Givremage -----
  'fleche-de-givre': {
    nom: 'Flèche de givre', emoji: '❄️', categorie: 'magie', type: 'degats', cible: 'ennemi',
    stat: 'int', puissance: 6, ratio: 1.15, coutMp: 5, cooldown: 2,
    effet: { type: 'etourdi', duree: 1, chance: 0.35 },
    desc: 'Un trait glacial qui peut figer la cible (35 %).',
  },
  'blizzard': {
    nom: 'Blizzard', emoji: '🌨️', categorie: 'magie', type: 'degats', cible: 'ennemis',
    stat: 'int', puissance: 3, ratio: 0.7, coutMp: 11, cooldown: 4,
    effet: { type: 'affaibli', duree: 2 },
    desc: 'Une tempête de neige qui blesse et engourdit tous les ennemis.',
  },
  'armure-de-glace': {
    nom: 'Armure de glace', emoji: '🛡️', categorie: 'magie', type: 'utilitaire', cible: 'soi',
    stat: 'int', coutMp: 6, cooldown: 4,
    effet: { type: 'bouclier', duree: 3 },
    desc: 'Une carapace de glace absorbe les prochains coups.',
  },

  // ----- Voie du Chaman -----
  'totem-tonnerre': {
    nom: 'Totem tonnerre', emoji: '🗿', categorie: 'magie', type: 'degats', cible: 'ennemis',
    stat: 'int', puissance: 4, ratio: 0.8, coutMp: 9, cooldown: 3,
    desc: 'Un totem foudroie tous les ennemis.',
  },
  'chaine-d-eclairs': {
    nom: 'Chaîne d’éclairs', emoji: '⚡', categorie: 'magie', type: 'degats', cible: 'ennemi',
    stat: 'int', puissance: 3, ratio: 0.7, coups: 2, coutMp: 6, cooldown: 2,
    desc: 'La foudre frappe, rebondit, et frappe encore.',
  },
  'totem-gardien': {
    nom: 'Totem gardien', emoji: '🪵', categorie: 'soutien', type: 'utilitaire', cible: 'allies',
    stat: 'int', coutMp: 9, cooldown: 5,
    effet: { type: 'bouclier', duree: 2 },
    desc: 'Un totem protecteur couvre tout le groupe d’un bouclier.',
  },
  'esprits-ancetres': {
    nom: 'Esprits des ancêtres', emoji: '🌀', categorie: 'soutien', type: 'utilitaire', cible: 'allies',
    stat: 'int', coutMp: 8, cooldown: 5,
    effet: { type: 'regen', duree: 3 },
    desc: 'Les ancêtres veillent : tout le groupe régénère des PV.',
  },

  // ----- Voie du Voleur -----
  'vol-a-la-tire': {
    nom: 'Vol à la tire', emoji: '💰', categorie: 'physique', type: 'degats', cible: 'ennemi',
    stat: 'agi', puissance: 4, ratio: 0.9, coutMp: 4, cooldown: 2,
    effet: { type: 'vol-or' },
    desc: 'Frappe la cible et lui fait les poches : de l’or en plus au butin !',
  },
  'coup-bas': {
    nom: 'Coup bas', emoji: '🦵', categorie: 'physique', type: 'degats', cible: 'ennemi',
    stat: 'agi', puissance: 5, ratio: 1.0, coutMp: 6, cooldown: 4,
    effet: { type: 'etourdi', duree: 1, chance: 0.4 },
    desc: 'Un coup peu glorieux mais efficace : 40 % de chances d’étourdir.',
  },
  'poussiere-aveuglante': {
    nom: 'Poussière aveuglante', emoji: '🌫️', categorie: 'physique', type: 'degats', cible: 'ennemis',
    stat: 'agi', puissance: 1, ratio: 0.4, coutMp: 7, cooldown: 4,
    effet: { type: 'affaibli', duree: 2 },
    desc: 'Une poignée de sable dans les yeux : tous les ennemis frappent moins fort.',
  },

  // ----- Voie du Danselame -----
  'valse-des-lames': {
    nom: 'Valse des lames', emoji: '🌸', categorie: 'physique', type: 'degats', cible: 'ennemis',
    stat: 'agi', puissance: 3, ratio: 0.75, coutMp: 8, cooldown: 3,
    desc: 'Une danse mortelle qui effleure tous les ennemis.',
  },
  'estocade-gracieuse': {
    nom: 'Estocade gracieuse', emoji: '🤺', categorie: 'physique', type: 'degats', cible: 'ennemi',
    stat: 'agi', puissance: 7, ratio: 1.35, coutMp: 5, cooldown: 2, critBonus: 0.25,
    desc: 'Un assaut élégant et précis, souvent critique.',
  },
  'danse-du-vent': {
    nom: 'Danse du vent', emoji: '🍃', categorie: 'soutien', type: 'soin', cible: 'soi',
    stat: 'agi', puissance: 4, ratio: 0.7, coutMp: 0, cooldown: 4,
    effet: { type: 'mana', valeur: 5 },
    desc: 'Un pas de côté pour souffler : récupère des PV et 5 PM.',
  },
};

// Modèles rapides : pré-remplissent stats + compétences (modifiables ensuite).
const MODELES = [
  {
    nom: 'Guerrier', emoji: '⚔️',
    stats: { for: 7, int: 2, agi: 3, vit: 6, cha: 2 },
    competences: ['frappe-heroique', 'coup-etourdissant', 'provocation', 'second-souffle'],
  },
  {
    nom: 'Mage', emoji: '🔮',
    stats: { for: 2, int: 8, agi: 4, vit: 4, cha: 2 },
    competences: ['boule-de-feu', 'eclair', 'nova-de-givre', 'bouclier-magique'],
  },
  {
    nom: 'Archer', emoji: '🏹',
    stats: { for: 4, int: 2, agi: 8, vit: 4, cha: 2 },
    competences: ['tir-precis', 'pluie-de-fleches', 'lame-empoisonnee', 'concentration'],
  },
  {
    nom: 'Clerc', emoji: '🌿',
    stats: { for: 3, int: 6, agi: 3, vit: 6, cha: 2 },
    competences: ['soin', 'cercle-de-soin', 'benediction', 'regeneration'],
  },
  {
    nom: 'Paladin', emoji: '⚖️',
    stats: { for: 5, int: 4, agi: 2, vit: 7, cha: 2 },
    competences: ['chatiment-sacre', 'jugement', 'aura-protection', 'imposition-mains'],
  },
  {
    nom: 'Nécromancien', emoji: '💀',
    stats: { for: 2, int: 8, agi: 3, vit: 5, cha: 2 },
    competences: ['faux-spectrale', 'peste', 'pacte-sombre', 'drain-de-vie'],
  },
  {
    nom: 'Moine', emoji: '🥋',
    stats: { for: 4, int: 2, agi: 7, vit: 5, cha: 2 },
    competences: ['rafale-de-coups', 'paume-zephyr', 'meditation-profonde', 'second-souffle'],
  },
  {
    nom: 'Barde', emoji: '🎵',
    stats: { for: 3, int: 6, agi: 5, vit: 4, cha: 2 },
    competences: ['chant-heroique', 'melodie-apaisante', 'fausse-note', 'soin'],
  },
  {
    nom: 'Rôdeur', emoji: '🐺',
    stats: { for: 4, int: 2, agi: 7, vit: 4, cha: 3 },
    competences: ['morsure-du-loup', 'tir-precis', 'ronces-etrangleuses', 'instinct-sauvage'],
  },
  {
    nom: 'Assassin', emoji: '🗡️',
    stats: { for: 3, int: 2, agi: 8, vit: 3, cha: 4 },
    competences: ['lame-dans-l-ombre', 'lame-empoisonnee', 'voile-de-fumee', 'mise-a-mort'],
  },
  {
    nom: 'Berserker', emoji: '🪓',
    stats: { for: 8, int: 1, agi: 4, vit: 5, cha: 2 },
    competences: ['dechainement', 'cri-de-guerre', 'tourbillon', 'fureur-sanglante'],
  },
  {
    nom: 'Templier', emoji: '🛡️',
    stats: { for: 6, int: 3, agi: 1, vit: 8, cha: 2 },
    competences: ['frappe-heroique', 'provocation', 'bouclier-magique', 'verdict-de-fer'],
  },
  {
    nom: 'Élémentaliste', emoji: '🌪️',
    stats: { for: 1, int: 8, agi: 3, vit: 4, cha: 4 },
    competences: ['orage-elementaire', 'boule-de-feu', 'lance-de-glace', 'bouclier-de-lave'],
  },
  {
    nom: 'Druide', emoji: '🐻',
    stats: { for: 3, int: 6, agi: 2, vit: 6, cha: 3 },
    competences: ['griffes-d-ours', 'essaim-piqueur', 'seve-regeneratrice', 'soin'],
  },
  {
    nom: 'Invocateur', emoji: '🐉',
    stats: { for: 2, int: 7, agi: 3, vit: 4, cha: 4 },
    competences: ['familier-flamboyant', 'horde-spectrale', 'pacte-du-golem', 'drain-de-vie'],
  },
  {
    nom: 'Pyromancien', emoji: '🔥',
    stats: { for: 2, int: 8, agi: 2, vit: 4, cha: 4 },
    competences: ['deflagration', 'mur-de-flammes', 'boule-de-feu', 'combustion'],
  },
  {
    nom: 'Givremage', emoji: '❄️',
    stats: { for: 1, int: 8, agi: 3, vit: 5, cha: 3 },
    competences: ['fleche-de-givre', 'nova-de-givre', 'blizzard', 'armure-de-glace'],
  },
  {
    nom: 'Chaman', emoji: '🌩️',
    stats: { for: 3, int: 6, agi: 2, vit: 5, cha: 4 },
    competences: ['totem-tonnerre', 'chaine-d-eclairs', 'totem-gardien', 'esprits-ancetres'],
  },
  {
    nom: 'Voleur', emoji: '💰',
    stats: { for: 3, int: 2, agi: 7, vit: 3, cha: 5 },
    competences: ['vol-a-la-tire', 'coup-bas', 'poussiere-aveuglante', 'lame-empoisonnee'],
  },
  {
    nom: 'Danselame', emoji: '🌸',
    stats: { for: 4, int: 2, agi: 7, vit: 4, cha: 3 },
    competences: ['valse-des-lames', 'estocade-gracieuse', 'danse-du-vent', 'rafale-de-coups'],
  },
];

// =====================================================================
// Familiers : compagnons à bonus passif, gagnés sur les boss et la Tour
// =====================================================================
const FAMILIERS = {
  'louveteau':        { nom: 'Louveteau', emoji: '🐺', bonus: { for: 2 }, desc: '+2 Force', source: 'loupAlpha' },
  'mygale-soyeuse':   { nom: 'Mygale soyeuse', emoji: '🕷️', bonus: { agi: 2 }, desc: '+2 Agilité', source: 'araigneeMatriarche' },
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
};

// Familier obtenu par palier de la Tour Sans Fin (première ascension).
const FAMILIERS_TOUR = { 5: 'feu-follet', 10: 'golem-de-poche', 15: 'chaton-celeste', 20: 'phenix-miniature' };

function familierActif(p) {
  return p.familier ? FAMILIERS[p.familier] : null;
}

// =====================================================================
// Hauts faits : chacun débloque un titre affichable
// =====================================================================
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
  { id: 'legendaire-1', nom: 'Toucheur de légende', emoji: '🌟', titre: 'le Fortuné', desc: 'Obtenir un objet légendaire', cond: (p) => p.compteurs.legendaires >= 1 },
  { id: 'divin-1',     nom: 'Élu des dieux', emoji: '⚡', titre: 'l’Élu', desc: 'Obtenir un objet divin', cond: (p) => p.compteurs.divins >= 1 },
  { id: 'tour-5',      nom: 'Grimpeur', emoji: '🗼', titre: 'du Cinquième Étage', desc: 'Atteindre l’étage 5 de la Tour', cond: (p) => p.tourMax >= 5 },
  { id: 'tour-10',     nom: 'Conquérant des hauteurs', emoji: '🪜', titre: 'des Hauteurs', desc: 'Atteindre l’étage 10 de la Tour', cond: (p) => p.tourMax >= 10 },
  { id: 'tour-20',     nom: 'Sommet du monde', emoji: '🏔️', titre: 'du Sommet', desc: 'Atteindre l’étage 20 de la Tour', cond: (p) => p.tourMax >= 20 },
  { id: 'familiers-3', nom: 'Meneur de meute', emoji: '🐾', titre: 'le Dresseur', desc: 'Adopter 3 familiers', cond: (p) => p.familiers.length >= 3 },
  { id: 'donjon-crypte',      nom: 'Paix au Roi Oublié', emoji: '🏛️', titre: 'le Libérateur', desc: 'Terminer « La Crypte du Roi Oublié »', cond: (p) => donjonFini(p, 'crypte') },
  { id: 'donjon-laboratoire', nom: 'Fin de l’expérience', emoji: '🧪', titre: 'l’Alchimiste', desc: 'Terminer « Le Laboratoire de Frivole »', cond: (p) => donjonFini(p, 'laboratoire') },
  { id: 'donjon-brise-brume', nom: 'Brumes dissipées', emoji: '⛵', titre: 'des Brumes', desc: 'Terminer « Le Brise-Brume »', cond: (p) => donjonFini(p, 'brise-brume') },
  { id: 'donjon-volcan',      nom: 'Cœur du Volcan', emoji: '🌋', titre: 'Forgé au Feu', desc: 'Terminer « Le Cœur du Volcan »', cond: (p) => donjonFini(p, 'volcan') },
  { id: 'donjons-tous',       nom: 'Toutes les histoires', emoji: '📖', titre: 'le Chroniqueur', desc: 'Terminer les 4 donjons d’histoire', cond: (p) => ['crypte', 'laboratoire', 'brise-brume', 'volcan'].every((id) => donjonFini(p, id)) },
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
];

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
  const indices = [];
  while (indices.length < 3) {
    const i = Math.floor(alea2() * disponibles.length);
    if (!indices.includes(i)) indices.push(i);
  }
  return {
    date,
    liste: indices.map((i, position) => {
      const modele = disponibles[i];
      const requis = modele.min + Math.floor(alea2() * (modele.max - modele.min + 1));
      return {
        type: modele.type, emoji: modele.emoji,
        texte: modele.texte(requis), requis, fait: 0, reclamee: false,
        recompense: {
          po: (25 + p.niveau * 8) * (position + 1),
          xp: (15 + p.niveau * 9) * (position + 1),
          coffre: position === 2, // le 3e contrat offre un objet en plus
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
  // Les héros distants (expéditions multi-écrans) arrivent avec leurs
  // stats effectives déjà calculées sur leur propre appareil.
  if (p.statsEff) return { ...p.statsEff };
  // Combattant reconstruit sans stats (état réseau incomplet) : zéros sûrs.
  if (!p.stats) return { for: 0, int: 0, agi: 0, vit: 0, cha: 0, pvMax: 0, pmMax: 0, crit: 0 };
  const s = {
    for: p.stats.for, int: p.stats.int, agi: p.stats.agi, vit: p.stats.vit,
    cha: p.stats.cha || 0, pvMax: 0, pmMax: 0, crit: 0,
  };
  Object.values(p.equipement || {}).forEach((idObjet) => {
    if (!idObjet) return;
    const objet = OBJETS[idObjet];
    if (!objet || !objet.bonus) return;
    Object.entries(objet.bonus).forEach(([cle, valeur]) => {
      s[cle] = (s[cle] || 0) + valeur;
    });
  });
  // Bonus passif du familier équipé (les bonus % XP/or sont gérés à part).
  const familier = familierActif(p);
  if (familier) {
    Object.entries(familier.bonus).forEach(([cle, valeur]) => {
      if (cle in s) s[cle] += valeur;
    });
  }
  // Bonus des panoplies : équiper 2 ou 4 pièces d'une même collection.
  Object.entries(bonusSetActifs(p).stats).forEach(([cle, valeur]) => {
    s[cle] = (s[cle] || 0) + valeur;
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
