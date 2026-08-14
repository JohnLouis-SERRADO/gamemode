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

// Spécialité (sous-classe de récolte) : le premier choix est gratuit,
// en changer coûte de l'or — on ne renie pas son métier à la légère.
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
      return `💫 étourdit ${effet.duree || 1} t.${effet.chance != null && effet.chance < 1 ? ` (${Math.round(effet.chance * 100)} %)` : ''}`;
    case 'affaibli': return `⬇️ −30 % dégâts (${effet.duree} t.)`;
    case 'bouclier': return `🛡️ bouclier ≈${Math.round(8 + (s[effet.stat || 'int'] || 0) * 1.5)} (${effet.duree} t.)`;
    case 'benediction': return `🙏 +30 % dégâts (${effet.duree} t.)`;
    case 'provocation': return `😤 attire les coups + bouclier ≈${Math.round(4 + (s.for || 0))}`;
    case 'regen': return `💧 régén. ≈${Math.round(3 + (s[effet.stat || 'int'] || 0) * 0.8)}/tour (${effet.duree} t.)`;
    case 'mana': return `🧘 +${effet.valeur} PM`;
    case 'drain': return `🧛 rend ${Math.round(effet.part * 100)} % des dégâts en PV`;
    case 'pacte': return `🩸 −${Math.round(effet.partPv * 100)} % PV max → +${effet.mana} PM`;
    case 'vol-or': return `💰 vole ≈${Math.round(4 + (s.agi || 0) * 1.2)} po`;
    default: return '';
  }
}

// Renvoie des lignes chiffrées (dégâts, soins, effets, coût) calculées
// avec les stats effectives fournies.
function detailsCompetence(comp, s, rang = 0) {
  const parts = [];
  const multRang = 1 + 0.15 * rang;
  if (comp.type === 'degats') {
    const brut = Math.round((comp.puissance + (s[comp.stat] || 0) * comp.ratio) * multRang);
    parts.push(`⚔️ ≈${brut} dégâts${comp.coups ? ` ×${comp.coups} coups` : ''}`);
  } else if (comp.type === 'soin') {
    parts.push(`💚 ≈${Math.round((comp.puissance + (s[comp.stat] || 0) * comp.ratio) * multRang)} PV`);
  }
  if (rang > 0) parts.push(`🏅 rang ${rang} (+${Math.round(rang * 15)} %)`);
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
// Classes : chaque modèle de création est une classe à part entière.
// Les 68 compétences classiques sont communes à tous ; chaque classe a
// en plus une SIGNATURE exclusive, améliorable avec des points de
// maîtrise (gagnés aux niveaux 3, 6, 9, 12, 15 et 18 — rang 5 maximum).
// =====================================================================
MODELES.forEach((m) => {
  m.id = m.nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-');
});

const COMPETENCES_SIGNATURE = {
  'signature-panache':            { nom: 'Panache', emoji: '🎩', classe: 'aventurier', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'for', puissance: 10, ratio: 1.5, critBonus: 0.1, coutMp: 8, cooldown: 4, desc: 'Le coup d’éclat de ceux qui n’ont pas choisi de voie — et les ont toutes un peu prises.' },
  'signature-lame-du-champion':   { nom: 'Lame du champion', emoji: '🏆', classe: 'guerrier', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'for', puissance: 12, ratio: 1.8, critBonus: 0.1, coutMp: 8, cooldown: 4, desc: 'La botte secrète des maîtres d’armes de Valciel.' },
  'signature-comete-arcanique':   { nom: 'Comète arcanique', emoji: '☄️', classe: 'mage', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 14, ratio: 1.7, coutMp: 10, cooldown: 4, desc: 'Faire tomber le ciel sur une seule tête.' },
  'signature-fleche-du-destin':   { nom: 'Flèche du destin', emoji: '🎯', classe: 'archer', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'agi', puissance: 10, ratio: 1.6, critBonus: 0.25, coutMp: 8, cooldown: 4, desc: 'Une seule flèche. Elle sait où aller.' },
  'signature-lumiere-salvatrice': { nom: 'Lumière salvatrice', emoji: '🌅', classe: 'clerc', signature: true, categorie: 'signature', type: 'soin', cible: 'allies', stat: 'int', puissance: 10, ratio: 1.2, coutMp: 12, cooldown: 5, desc: 'Une aube en plein combat : soigne généreusement toute l’équipe.' },
  'signature-verdict-celeste':    { nom: 'Verdict céleste', emoji: '⚡', classe: 'paladin', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'for', puissance: 10, ratio: 1.4, effet: { type: 'etourdi', duree: 1, chance: 0.5 }, coutMp: 10, cooldown: 5, desc: 'Le jugement tombe du ciel — et il assomme, une fois sur deux.' },
  'signature-moisson-d-ames':     { nom: 'Moisson d’âmes', emoji: '🌑', classe: 'necromancien', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 6, ratio: 1.0, effet: { type: 'drain', part: 0.5 }, coutMp: 12, cooldown: 5, desc: 'Faucher tous les ennemis et récolter la moitié en vie.' },
  'signature-cent-poings':        { nom: 'Cent poings', emoji: '👊', classe: 'moine', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'agi', puissance: 3, ratio: 0.7, coups: 4, coutMp: 9, cooldown: 4, desc: 'Quatre frappes, un seul battement de cœur.' },
  'signature-crescendo':          { nom: 'Crescendo', emoji: '🎼', classe: 'barde', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 8, ratio: 1.2, coutMp: 10, cooldown: 5, desc: 'Le dernier mouvement, fortissimo : la salle entière l’encaisse.' },
  'signature-meute-fantome':      { nom: 'Meute fantôme', emoji: '🐺', classe: 'rodeur', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'agi', puissance: 7, ratio: 1.1, coutMp: 10, cooldown: 5, desc: 'Des loups d’esprit surgissent des fourrés sur tout ce qui bouge.' },
  'signature-danse-macabre':      { nom: 'Danse macabre', emoji: '🩸', classe: 'assassin', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'agi', puissance: 8, ratio: 1.3, coups: 2, critBonus: 0.15, coutMp: 10, cooldown: 5, desc: 'Deux pas, deux lames, plus de partenaire.' },
  'signature-colere-du-sang':     { nom: 'Colère du sang', emoji: '🌋', classe: 'berserker', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'for', puissance: 16, ratio: 2.0, coutMp: 10, cooldown: 5, desc: 'Le coup que même le Berserker ne contrôle plus vraiment.' },
  'signature-rempart-sacre':      { nom: 'Rempart sacré', emoji: '🏰', classe: 'templier', signature: true, categorie: 'signature', type: 'utilitaire', cible: 'allies', effet: { type: 'bouclier', duree: 3 }, coutMp: 12, cooldown: 6, desc: 'Un mur de foi se dresse devant toute l’équipe.' },
  'signature-cataclysme':         { nom: 'Cataclysme', emoji: '🌪️', classe: 'elementaliste', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 9, ratio: 1.15, coutMp: 13, cooldown: 6, desc: 'Les quatre éléments, tous en colère, tous en même temps.' },
  'signature-courroux-sylvestre': { nom: 'Courroux sylvestre', emoji: '🌿', classe: 'druide', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 10, ratio: 1.5, effet: { type: 'poison', duree: 3 }, coutMp: 10, cooldown: 5, desc: 'La forêt entière se souvient — et elle mord.' },
  'signature-avatar-primordial':  { nom: 'Avatar primordial', emoji: '🐲', classe: 'invocateur', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 13, ratio: 1.6, coutMp: 11, cooldown: 5, desc: 'L’espace d’un instant, l’invocation dépasse l’invocateur.' },
  'signature-supernova':          { nom: 'Supernova', emoji: '💥', classe: 'pyromancien', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 10, ratio: 1.2, coutMp: 14, cooldown: 6, desc: 'Tout brûle. Vraiment tout.' },
  'signature-zero-absolu':        { nom: 'Zéro absolu', emoji: '🧊', classe: 'givremage', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 11, ratio: 1.5, effet: { type: 'etourdi', duree: 1, chance: 0.6 }, coutMp: 12, cooldown: 6, desc: 'Là où le froid s’arrête, l’ennemi aussi.' },
  'signature-tempete-ancestrale': { nom: 'Tempête ancestrale', emoji: '🌩️', classe: 'chaman', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 8, ratio: 1.1, effet: { type: 'affaibli', duree: 2 }, coutMp: 13, cooldown: 6, desc: 'Tous les ancêtres grondent à la fois — les ennemis en ressortent diminués.' },
  'signature-casse-du-siecle':    { nom: 'Casse du siècle', emoji: '💎', classe: 'voleur', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'agi', puissance: 9, ratio: 1.4, effet: { type: 'vol-or' }, coutMp: 9, cooldown: 5, desc: 'Frapper fort ET repartir avec la caisse.' },
  'signature-ballet-mortel':      { nom: 'Ballet mortel', emoji: '🌸', classe: 'danselame', signature: true, categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'agi', puissance: 6, ratio: 0.9, coups: 2, coutMp: 12, cooldown: 6, desc: 'Deux passages de danse, et les pétales retombent sur un champ de bataille.' },
};
Object.assign(COMPETENCES, COMPETENCES_SIGNATURE);

// ---------------------------------------------------------------------
// Arbre de classe : 3 compétences supplémentaires par classe, débloquées
// automatiquement aux niveaux 5, 10 et 15 (4 par classe avec la
// signature de création). Les points de maîtrise s'y investissent aussi.
// ---------------------------------------------------------------------
const COMPETENCES_CLASSE = {
  // Guerrier
  'guerrier-garde-de-fer':    { classe: 'guerrier', niveauRequis: 5, nom: 'Garde de fer', emoji: '🛡️', categorie: 'signature', type: 'utilitaire', cible: 'soi', effet: { type: 'bouclier', duree: 3, stat: 'for' }, coutMp: 6, cooldown: 4, desc: 'Un bouclier forgé dans la pure discipline martiale.' },
  'guerrier-brise-garde':     { classe: 'guerrier', niveauRequis: 10, nom: 'Brise-garde', emoji: '💢', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'for', puissance: 9, ratio: 1.3, effet: { type: 'affaibli', duree: 2 }, coutMp: 8, cooldown: 4, desc: 'Fracasse la défense : l’ennemi frappe −30 % pendant 2 tours.' },
  'guerrier-assaut-final':    { classe: 'guerrier', niveauRequis: 15, nom: 'Assaut final', emoji: '⚡', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'for', puissance: 14, ratio: 1.9, critBonus: 0.15, coutMp: 12, cooldown: 5, desc: 'Le coup qu’on n’apprend qu’aux maîtres d’armes.' },
  // Mage
  'mage-flux-arcanique':      { classe: 'mage', niveauRequis: 5, nom: 'Flux arcanique', emoji: '🌀', categorie: 'signature', type: 'utilitaire', cible: 'soi', effet: { type: 'mana', valeur: 12 }, coutMp: 0, cooldown: 4, desc: 'Aspire le mana ambiant : +12 PM.' },
  'mage-orbe-fracassant':     { classe: 'mage', niveauRequis: 10, nom: 'Orbe fracassant', emoji: '🔮', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 11, ratio: 1.5, coutMp: 9, cooldown: 4, desc: 'Un orbe dense comme une étoile naine.' },
  'mage-tempete-de-mana':     { classe: 'mage', niveauRequis: 15, nom: 'Tempête de mana', emoji: '🌌', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 9, ratio: 1.15, coutMp: 13, cooldown: 5, desc: 'Le mana brut balaie tout le champ de bataille.' },
  // Archer
  'archer-fleche-entravante': { classe: 'archer', niveauRequis: 5, nom: 'Flèche entravante', emoji: '🪢', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'agi', puissance: 6, ratio: 1.0, effet: { type: 'etourdi', duree: 1, chance: 0.35 }, coutMp: 6, cooldown: 4, desc: 'Une flèche câblée qui entrave la cible.' },
  'archer-double-tir':        { classe: 'archer', niveauRequis: 10, nom: 'Double tir', emoji: '🏹', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'agi', puissance: 5, ratio: 0.9, coups: 2, coutMp: 8, cooldown: 4, desc: 'Deux flèches encochées d’un seul geste.' },
  'archer-deluge':            { classe: 'archer', niveauRequis: 15, nom: 'Déluge de traits', emoji: '🌧️', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'agi', puissance: 8, ratio: 1.1, coutMp: 12, cooldown: 5, desc: 'Le ciel disparaît sous les flèches.' },
  // Clerc
  'clerc-priere-fervente':    { classe: 'clerc', niveauRequis: 5, nom: 'Prière fervente', emoji: '🙏', categorie: 'signature', type: 'soin', cible: 'allie', stat: 'int', puissance: 8, ratio: 1.1, coutMp: 7, cooldown: 3, desc: 'Un soin rapide porté par la foi.' },
  'clerc-chatiment-lumineux': { classe: 'clerc', niveauRequis: 10, nom: 'Châtiment lumineux', emoji: '🌟', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 10, ratio: 1.3, coutMp: 8, cooldown: 4, desc: 'La lumière aussi sait frapper.' },
  'clerc-sanctuaire':         { classe: 'clerc', niveauRequis: 15, nom: 'Sanctuaire', emoji: '⛪', categorie: 'signature', type: 'utilitaire', cible: 'allies', effet: { type: 'regen', duree: 3 }, coutMp: 13, cooldown: 6, desc: 'Un havre béni : toute l’équipe régénère 3 tours.' },
  // Paladin
  'paladin-serment':          { classe: 'paladin', niveauRequis: 5, nom: 'Serment de bataille', emoji: '📜', categorie: 'signature', type: 'utilitaire', cible: 'soi', effet: { type: 'benediction', duree: 2 }, coutMp: 7, cooldown: 5, desc: 'Un serment qui affûte la lame : +30 % de dégâts.' },
  'paladin-lame-consacree':   { classe: 'paladin', niveauRequis: 10, nom: 'Lame consacrée', emoji: '🗡️', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'for', puissance: 10, ratio: 1.4, effet: { type: 'drain', part: 0.3 }, coutMp: 9, cooldown: 4, desc: 'Frappe sacrée qui rend un tiers des dégâts en vie.' },
  'paladin-egide':            { classe: 'paladin', niveauRequis: 15, nom: 'Égide du juste', emoji: '🛡️', categorie: 'signature', type: 'utilitaire', cible: 'allies', effet: { type: 'bouclier', duree: 3, stat: 'for' }, coutMp: 13, cooldown: 6, desc: 'Un rempart de foi couvre toute l’équipe.' },
  // Nécromancien
  'necromancien-toucher-glacial': { classe: 'necromancien', niveauRequis: 5, nom: 'Toucher glacial', emoji: '🥶', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 8, ratio: 1.2, effet: { type: 'affaibli', duree: 2 }, coutMp: 7, cooldown: 3, desc: 'Le froid de la tombe engourdit les bras.' },
  'necromancien-siphon':      { classe: 'necromancien', niveauRequis: 10, nom: 'Siphon d’âme', emoji: '🌪️', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 9, ratio: 1.3, effet: { type: 'drain', part: 0.6 }, coutMp: 9, cooldown: 4, desc: 'Aspire la vie — 60 % des dégâts vous reviennent.' },
  'necromancien-hiver-des-ames': { classe: 'necromancien', niveauRequis: 15, nom: 'Hiver des âmes', emoji: '☠️', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 8, ratio: 1.1, effet: { type: 'poison', stat: 'int', duree: 2 }, coutMp: 13, cooldown: 5, desc: 'Un froid qui ronge tous les ennemis, tour après tour.' },
  // Moine
  'moine-souffle-interieur':  { classe: 'moine', niveauRequis: 5, nom: 'Souffle intérieur', emoji: '🧘', categorie: 'signature', type: 'utilitaire', cible: 'soi', effet: { type: 'regen', duree: 3, stat: 'agi' }, coutMp: 6, cooldown: 4, desc: 'Le souffle circule : régénération pendant 3 tours.' },
  'moine-paume-sismique':     { classe: 'moine', niveauRequis: 10, nom: 'Paume sismique', emoji: '💥', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'agi', puissance: 8, ratio: 1.2, effet: { type: 'etourdi', duree: 1, chance: 0.45 }, coutMp: 8, cooldown: 4, desc: 'Une paume qui fait trembler la terre — et la cible.' },
  'moine-mille-mains':        { classe: 'moine', niveauRequis: 15, nom: 'Mille mains', emoji: '👐', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'agi', puissance: 4, ratio: 0.8, coups: 3, coutMp: 11, cooldown: 5, desc: 'Trois frappes — l’œil n’en voit qu’une.' },
  // Barde
  'barde-berceuse-brutale':   { classe: 'barde', niveauRequis: 5, nom: 'Berceuse brutale', emoji: '🎶', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 4, ratio: 0.7, effet: { type: 'etourdi', duree: 1, chance: 0.55 }, coutMp: 7, cooldown: 4, desc: 'Une berceuse si efficace qu’elle assomme.' },
  'barde-refrain-vivifiant':  { classe: 'barde', niveauRequis: 10, nom: 'Refrain vivifiant', emoji: '💞', categorie: 'signature', type: 'soin', cible: 'allies', stat: 'int', puissance: 6, ratio: 0.9, coutMp: 10, cooldown: 5, desc: 'Un refrain qui recoud les plaies de toute l’équipe.' },
  'barde-solo-epique':        { classe: 'barde', niveauRequis: 15, nom: 'Solo épique', emoji: '🎸', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 12, ratio: 1.5, critBonus: 0.2, coutMp: 11, cooldown: 5, desc: 'Le riff que les chroniques retiendront.' },
  // Rôdeur
  'rodeur-piege-a-machoires': { classe: 'rodeur', niveauRequis: 5, nom: 'Piège à mâchoires', emoji: '🪤', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'agi', puissance: 6, ratio: 1.0, effet: { type: 'etourdi', duree: 1, chance: 0.4 }, coutMp: 6, cooldown: 4, desc: 'Clac. La proie n’ira nulle part.' },
  'rodeur-fleches-barbelees': { classe: 'rodeur', niveauRequis: 10, nom: 'Flèches barbelées', emoji: '🏹', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'agi', puissance: 7, ratio: 1.1, effet: { type: 'poison', stat: 'agi', duree: 2 }, coutMp: 8, cooldown: 4, desc: 'Des pointes qui restent — et qui travaillent.' },
  'rodeur-appel-de-la-meute': { classe: 'rodeur', niveauRequis: 15, nom: 'Appel de la meute', emoji: '🐺', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'agi', puissance: 8, ratio: 1.15, coutMp: 12, cooldown: 5, desc: 'La forêt répond : crocs pour tout le monde.' },
  // Assassin
  'assassin-preparation':     { classe: 'assassin', niveauRequis: 5, nom: 'Préparation mortelle', emoji: '🧪', categorie: 'signature', type: 'utilitaire', cible: 'soi', effet: { type: 'benediction', duree: 2 }, coutMp: 6, cooldown: 5, desc: 'Lames huilées, souffle calé : +30 % de dégâts.' },
  'assassin-jugulaire':       { classe: 'assassin', niveauRequis: 10, nom: 'Jugulaire', emoji: '🩸', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'agi', puissance: 9, ratio: 1.35, critBonus: 0.25, coutMp: 9, cooldown: 4, desc: 'Viser là où tout s’arrête.' },
  'assassin-execution':       { classe: 'assassin', niveauRequis: 15, nom: 'Exécution silencieuse', emoji: '🌑', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'agi', puissance: 13, ratio: 1.7, coutMp: 12, cooldown: 6, desc: 'Personne n’a rien vu. Surtout pas la cible.' },
  // Berserker
  'berserker-hurlement':      { classe: 'berserker', niveauRequis: 5, nom: 'Hurlement barbare', emoji: '🗣️', categorie: 'signature', type: 'utilitaire', cible: 'soi', effet: { type: 'benediction', duree: 2 }, coutMp: 5, cooldown: 4, desc: 'Un cri qui fait bouillir le sang : +30 % de dégâts.' },
  'berserker-fracas':         { classe: 'berserker', niveauRequis: 10, nom: 'Fracas tellurique', emoji: '🪓', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'for', puissance: 11, ratio: 1.5, coutMp: 9, cooldown: 4, desc: 'La hache d’abord, les questions jamais.' },
  'berserker-seisme':         { classe: 'berserker', niveauRequis: 15, nom: 'Séisme de rage', emoji: '🌋', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'for', puissance: 9, ratio: 1.2, coutMp: 13, cooldown: 6, desc: 'Quand la rage frappe le sol, le sol se venge sur les autres.' },
  // Templier
  'templier-foi':             { classe: 'templier', niveauRequis: 5, nom: 'Foi inébranlable', emoji: '✝️', categorie: 'signature', type: 'utilitaire', cible: 'soi', effet: { type: 'bouclier', duree: 3, stat: 'for' }, coutMp: 6, cooldown: 4, desc: 'La foi, plus dure que l’acier.' },
  'templier-marteau-saint':   { classe: 'templier', niveauRequis: 10, nom: 'Marteau saint', emoji: '🔨', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'for', puissance: 9, ratio: 1.3, effet: { type: 'etourdi', duree: 1, chance: 0.4 }, coutMp: 9, cooldown: 4, desc: 'Le jugement pèse trois quintaux.' },
  'templier-croisade':        { classe: 'templier', niveauRequis: 15, nom: 'Croisade', emoji: '⚔️', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'for', puissance: 8, ratio: 1.1, coutMp: 13, cooldown: 6, desc: 'Un seul templier, tous les fronts.' },
  // Élémentaliste
  'elementaliste-brume':      { classe: 'elementaliste', niveauRequis: 5, nom: 'Bouclier de brume', emoji: '🌫️', categorie: 'signature', type: 'utilitaire', cible: 'allies', effet: { type: 'bouclier', duree: 2 }, coutMp: 9, cooldown: 5, desc: 'La brume amortit les coups de toute l’équipe.' },
  'elementaliste-lames-de-vent': { classe: 'elementaliste', niveauRequis: 10, nom: 'Lames de vent', emoji: '🌬️', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 6, ratio: 0.95, coups: 2, coutMp: 9, cooldown: 4, desc: 'L’air tranche deux fois, sans prévenir.' },
  'elementaliste-fureur':     { classe: 'elementaliste', niveauRequis: 15, nom: 'Fureur des éléments', emoji: '🌪️', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 10, ratio: 1.25, coutMp: 14, cooldown: 6, desc: 'Feu, glace, foudre et pierre — d’un seul geste.' },
  // Druide
  'druide-peau-d-ecorce':     { classe: 'druide', niveauRequis: 5, nom: 'Peau d’écorce', emoji: '🌳', categorie: 'signature', type: 'utilitaire', cible: 'soi', effet: { type: 'bouclier', duree: 3 }, coutMp: 6, cooldown: 4, desc: 'L’écorce pousse plus vite que les plaies.' },
  'druide-lianes':            { classe: 'druide', niveauRequis: 10, nom: 'Lianes constrictrices', emoji: '🌿', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 8, ratio: 1.2, effet: { type: 'etourdi', duree: 1, chance: 0.4 }, coutMp: 8, cooldown: 4, desc: 'La forêt attrape, serre, et ne s’excuse pas.' },
  'druide-tempete-de-ronces': { classe: 'druide', niveauRequis: 15, nom: 'Tempête de ronces', emoji: '🥀', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 8, ratio: 1.1, effet: { type: 'poison', stat: 'int', duree: 2 }, coutMp: 13, cooldown: 6, desc: 'Des ronces partout. Vraiment partout.' },
  // Invocateur
  'invocateur-serviteur':     { classe: 'invocateur', niveauRequis: 5, nom: 'Serviteur d’éther', emoji: '👻', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 7, ratio: 1.05, coutMp: 6, cooldown: 2, desc: 'Un petit serviteur zélé, à recharge courte.' },
  'invocateur-nuee':          { classe: 'invocateur', niveauRequis: 10, nom: 'Nuée d’esprits', emoji: '🦇', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 7, ratio: 1.0, coutMp: 10, cooldown: 4, desc: 'Le ciel se remplit de choses qui mordent.' },
  'invocateur-leviathan':     { classe: 'invocateur', niveauRequis: 15, nom: 'Léviathan éphémère', emoji: '🐋', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 14, ratio: 1.7, coutMp: 13, cooldown: 6, desc: 'Trois secondes d’existence. Une seule suffit.' },
  // Pyromancien
  'pyromancien-etincelle':    { classe: 'pyromancien', niveauRequis: 5, nom: 'Étincelle vive', emoji: '✨', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 6, ratio: 1.0, coutMp: 4, cooldown: 2, desc: 'Petite flamme, grande habitude.' },
  'pyromancien-lance-ardente': { classe: 'pyromancien', niveauRequis: 10, nom: 'Lance ardente', emoji: '🔥', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 10, ratio: 1.4, coutMp: 9, cooldown: 4, desc: 'Une lance de feu blanc, droit au cœur.' },
  'pyromancien-meteores':     { classe: 'pyromancien', niveauRequis: 15, nom: 'Pluie de météores', emoji: '☄️', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 11, ratio: 1.25, coutMp: 15, cooldown: 6, desc: 'Le ciel tombe. En morceaux. Enflammés.' },
  // Givremage
  'givremage-morsure':        { classe: 'givremage', niveauRequis: 5, nom: 'Morsure du froid', emoji: '❄️', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 7, ratio: 1.05, effet: { type: 'affaibli', duree: 2 }, coutMp: 6, cooldown: 3, desc: 'Le froid engourdit les muscles ennemis.' },
  'givremage-prison':         { classe: 'givremage', niveauRequis: 10, nom: 'Prison de glace', emoji: '🧊', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 6, ratio: 0.9, effet: { type: 'etourdi', duree: 1, chance: 0.6 }, coutMp: 9, cooldown: 5, desc: 'Un cercueil translucide, livré à domicile.' },
  'givremage-ere-glaciaire':  { classe: 'givremage', niveauRequis: 15, nom: 'Ère glaciaire', emoji: '🏔️', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 9, ratio: 1.15, effet: { type: 'affaibli', duree: 2 }, coutMp: 14, cooldown: 6, desc: 'Dix mille ans d’hiver, condensés en un instant.' },
  // Chaman
  'chaman-benediction':       { classe: 'chaman', niveauRequis: 5, nom: 'Bénédiction des esprits', emoji: '🪶', categorie: 'signature', type: 'utilitaire', cible: 'allies', effet: { type: 'regen', duree: 2 }, coutMp: 9, cooldown: 5, desc: 'Les ancêtres veillent : régénération pour l’équipe.' },
  'chaman-foudre-ancestrale': { classe: 'chaman', niveauRequis: 10, nom: 'Foudre ancestrale', emoji: '⚡', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 10, ratio: 1.35, coutMp: 9, cooldown: 4, desc: 'Un éclair vieux de mille ans, toujours vaillant.' },
  'chaman-grand-esprit':      { classe: 'chaman', niveauRequis: 15, nom: 'Grand Esprit', emoji: '🦬', categorie: 'signature', type: 'soin', cible: 'allies', stat: 'int', puissance: 9, ratio: 1.1, coutMp: 14, cooldown: 6, desc: 'Le Grand Esprit se penche sur l’équipe entière.' },
  // Voleur
  'voleur-poche-percee':      { classe: 'voleur', niveauRequis: 5, nom: 'Poche percée', emoji: '🪙', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'agi', puissance: 6, ratio: 1.0, effet: { type: 'vol-or' }, coutMp: 5, cooldown: 3, desc: 'Frapper ET encaisser — littéralement.' },
  'voleur-sournoise':         { classe: 'voleur', niveauRequis: 10, nom: 'Attaque sournoise', emoji: '🗡️', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'agi', puissance: 8, ratio: 1.25, critBonus: 0.2, coutMp: 8, cooldown: 4, desc: 'Par derrière, c’est plus poli — personne ne voit venir.' },
  'voleur-mille-bourses':     { classe: 'voleur', niveauRequis: 15, nom: 'Mille bourses', emoji: '💰', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'agi', puissance: 7, ratio: 1.0, effet: { type: 'vol-or' }, coutMp: 12, cooldown: 5, desc: 'Tout le monde paie. C’est la tournée du voleur.' },
  // Danselame
  'danselame-pas-de-cote':    { classe: 'danselame', niveauRequis: 5, nom: 'Pas de côté', emoji: '🩰', categorie: 'signature', type: 'utilitaire', cible: 'soi', effet: { type: 'bouclier', duree: 2, stat: 'agi' }, coutMp: 5, cooldown: 4, desc: 'Esquiver, c’est danser plus vite que la lame.' },
  'danselame-petales':        { classe: 'danselame', niveauRequis: 10, nom: 'Tourbillon de pétales', emoji: '🌸', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'agi', puissance: 6, ratio: 0.9, coutMp: 9, cooldown: 4, desc: 'Joli de loin. De près, tranchant.' },
  'danselame-derniere-valse': { classe: 'danselame', niveauRequis: 15, nom: 'Dernière valse', emoji: '💃', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'agi', puissance: 7, ratio: 1.0, coups: 3, coutMp: 12, cooldown: 6, desc: 'Trois temps, trois lames, un salut final.' },
  // Aventurier
  'aventurier-systeme-d':     { classe: 'aventurier', niveauRequis: 5, nom: 'Système D', emoji: '🧰', categorie: 'signature', type: 'utilitaire', cible: 'soi', effet: { type: 'mana', valeur: 10 }, coutMp: 0, cooldown: 4, desc: 'On fait avec ce qu’on a — et ça marche.' },
  'aventurier-opportuniste':  { classe: 'aventurier', niveauRequis: 10, nom: 'Coup opportuniste', emoji: '🎯', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'for', puissance: 8, ratio: 1.2, critBonus: 0.15, coutMp: 7, cooldown: 3, desc: 'Frapper exactement quand il ne faut pas — pour l’autre.' },
  'aventurier-grand-numero':  { classe: 'aventurier', niveauRequis: 15, nom: 'Le Grand Numéro', emoji: '🎪', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'for', puissance: 8, ratio: 1.1, coutMp: 12, cooldown: 5, desc: 'Un peu de tout, beaucoup de panache, dégâts pour tous.' },
};
Object.assign(COMPETENCES, COMPETENCES_CLASSE);

const CLASSES = {
  aventurier: { nom: 'Aventurier', emoji: '🎒', signature: 'signature-panache' },
};
MODELES.forEach((m) => {
  CLASSES[m.id] = {
    nom: m.nom,
    emoji: m.emoji,
    signature: Object.keys(COMPETENCES_SIGNATURE).find((id) => COMPETENCES_SIGNATURE[id].classe === m.id),
  };
});

function classeDe(p) {
  return CLASSES[p.classe] || CLASSES.aventurier;
}

// Points de maîtrise : un par palier de niveau atteint, à investir dans
// la compétence signature (chaque rang : +15 % de puissance, rang 5 max).
const SEUILS_MAITRISE = [3, 6, 9, 12, 15, 18, 22, 26, 30, 34, 38, 42, 46, 50];
const RANG_SIGNATURE_MAX = 5;

function pointsMaitrisePourNiveau(niveau) {
  return SEUILS_MAITRISE.filter((seuil) => niveau >= seuil).length;
}

function rangDe(p, compId) {
  return (p.rangs && p.rangs[compId]) || 0;
}

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
  { id: 'donjons-tous',       nom: 'Toutes les histoires', emoji: '📖', titre: 'le Chroniqueur', desc: 'Terminer les 4 donjons fondateurs', cond: (p) => ['crypte', 'laboratoire', 'brise-brume', 'volcan'].every((id) => donjonFini(p, id)) },
  { id: 'donjon-sanctuaire',  nom: 'Marées apaisées', emoji: '🌊', titre: 'des Marées', desc: 'Terminer « Le Sanctuaire des Marées »', cond: (p) => donjonFini(p, 'sanctuaire') },
  { id: 'donjon-couronne',    nom: 'Porteur de la Couronne', emoji: '👑', titre: 'Céleste', desc: 'Terminer « La Couronne Céleste »', cond: (p) => donjonFini(p, 'couronne-celeste') },
  { id: 'donjon-nihelm',      nom: 'Fossoyeur d’ombres', emoji: '🕳️', titre: 'de Nihelm', desc: 'Terminer le défi 50 « Le Gouffre de Nihelm »', cond: (p) => donjonFini(p, 'nihelm') },
  { id: 'donjon-temps-brise', nom: 'Maître des heures', emoji: '⏰', titre: 'Hors du Temps', desc: 'Terminer le défi 60 « La Forteresse du Temps Brisé »', cond: (p) => donjonFini(p, 'temps-brise') },
  { id: 'donjon-neant',       nom: 'Face au Néant', emoji: '👁️', titre: 'Fin des Histoires', desc: 'Terminer le défi 70 « L’Œil du Néant »', cond: (p) => donjonFini(p, 'neant') },
  { id: 'tour-boss-8',        nom: 'Fléau des seigneurs', emoji: '🏯', titre: 'Tueur de Rois', desc: 'Atteindre l’étage 8 de la Tour des Boss', cond: (p) => p.tourBoss && Math.max(p.tourBoss.normal, p.tourBoss.heroique, p.tourBoss.cauchemar) >= 8 },
  { id: 'niveau-35',          nom: 'Au-delà des Royaumes', emoji: '🌅', titre: 'des Terres lointaines', desc: 'Atteindre le niveau 35', cond: (p) => p.niveau >= 35 },
  { id: 'niveau-50',          nom: 'Sommet du possible', emoji: '🌟', titre: 'l’Éternel', desc: 'Atteindre le niveau 50', cond: (p) => p.niveau >= 50 },
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
  const nbContrats = Math.min(6, disponibles.length);
  const indices = [];
  while (indices.length < nbContrats) {
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
          po: Math.round((25 + p.niveau * 8) * (1 + position * 0.5)),
          xp: Math.round((15 + p.niveau * 9) * (1 + position * 0.5)),
          coffre: position >= 4, // les deux derniers contrats offrent un objet
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
const NIVEAU_MAX = 50;
const POINTS_PAR_NIVEAU = 2;
const NIVEAUX_NOUVELLE_COMPETENCE = [4, 8, 12, 16, 20, 25, 30, 35, 40, 45, 50];

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
  if (!p.stats) return { for: 0, int: 0, agi: 0, vit: 0, cha: 0, pvMax: 0, pmMax: 0, crit: 0, blocage: 0, esquive: 0 };
  const s = {
    for: p.stats.for, int: p.stats.int, agi: p.stats.agi, vit: p.stats.vit,
    cha: p.stats.cha || 0, pvMax: 0, pmMax: 0, crit: 0, blocage: 0, esquive: 0,
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
