'use strict';

// =====================================================================
// Compétences : le pool commun, et la mise en chiffres d'une compétence
// =====================================================================

// =====================================================================
// Qu'est-ce qu'une compétence COMMUNE ?
//
// Celle qui n'appartient à personne : ni à une classe, ni à une
// spécialité, ni à une Voie, ni à un Éveil. C'est le seul pool qui
// s'achète et se choisit librement — tout le reste se mérite à son
// palier d'identité.
//
// Deux écrans testaient seulement `comp.classe`, et laissaient donc
// passer les 216 compétences de spécialité, les 81 de Voie et les 324
// d'Éveil, qui portent `sousClasse` / `voie` / `eveil` mais jamais
// `classe` : la création en proposait 50 au niveau 1, et l'Arcanium
// vendait les 645. Une règle, un seul endroit.
// =====================================================================
function estCompetenceCommune(comp) {
  return !!comp && !comp.classe && !comp.sousClasse && !comp.voie && !comp.eveil;
}

// =====================================================================
// Détails chiffrés d'une compétence pour un jeu de stats donné
// =====================================================================
// =====================================================================
// v19 — Quelle caractéristique porte une compétence ?
//
// Les soins, boucliers et régénérations relèvent désormais de l'Esprit.
// Mais un Clerc qui a passé quarante niveaux à monter son Intelligence ne
// doit pas se réveiller diminué : tant qu'il n'a pas réagencé ses points,
// c'est la meilleure des deux qui compte. Personne ne perd ses soins.
// =====================================================================
function estCompetenceDeSoutien(comp) {
  if (comp.type === 'soin') return true;
  const effet = comp.effet && comp.effet.type;
  return effet === 'bouclier' || effet === 'regen';
}

// =====================================================================
// v20.1 — La Vitalité paie moins cher en dégâts qu'en points de vie.
//
// C'est la seule caractéristique qui achète DEUX choses à la fois : les
// points de vie de tout le monde, et les dégâts du Gardien. Un Gardien
// n'avait donc aucun arbitrage à faire — chaque point versé le rendait
// plus dur à tuer ET plus dangereux, pendant que les cinq autres classes
// devaient choisir. Mesuré au niveau 63 : il frappait aussi fort que la
// meilleure classe de dégâts (325 contre 326) avec 1,7 fois ses points de
// vie, et survivait cinq à six fois plus longtemps qu'il ne lui fallait
// pour nettoyer un groupe.
//
// La Vitalité reste sa caractéristique — il frappe bien avec, et il reste
// de très loin le plus résistant du jeu. Elle rend simplement 60 % de sa
// valeur en dégâts : le Gardien encaisse comme personne, et tue lentement.
// C'est la définition d'un tank.
// =====================================================================
const RENDEMENT_OFFENSIF_VITALITE = 0.6;

function valeurOffensiveDe(cle, s) {
  const valeur = (s && s[cle]) || 0;
  return cle === 'vit' ? valeur * RENDEMENT_OFFENSIF_VITALITE : valeur;
}

function statDeCompetence(comp, s) {
  const valeur = (s && s[comp.stat]) || 0;
  if (comp.stat === 'int' && estCompetenceDeSoutien(comp)) return Math.max(valeur, (s && s.esp) || 0);
  // Les soins portés par la Vitalité gardent leur pleine valeur : c'est
  // seulement l'attaque qui est bridée.
  if (comp.stat === 'vit' && comp.type === 'degats') return valeur * RENDEMENT_OFFENSIF_VITALITE;
  return valeur;
}

// =====================================================================
// v20 — L'ATTAQUE DE BASE, enfin la même pour tout le monde.
//
// Elle valait « 3 + le meilleur de la Force et de la Dextérité ». Les deux
// caractéristiques offensives des lanceurs — Intelligence et Esprit —
// n'y figuraient pas du tout. Mesuré au niveau 80 : un Guerrier frappait à
// 161 d'un simple coup d'épée, un Arcaniste à 9. Le même bouton, dix-huit
// fois moins fort, parce que sa caractéristique n'était pas dans la liste.
//
// Le Devin s'en sortait encore plus mal : ses sorts d'attaque rechargent,
// et entre deux il retombait sur une attaque à 12. D'où un DPS trois fois
// inférieur à celui des autres classes, à niveau et équipement égaux.
//
// Désormais l'attaque de base se lit sur la MEILLEURE caractéristique
// offensive du héros, quelle qu'elle soit. Un mage qui frappe du bâton
// frappe comme un mage ; il ne devient pas guerrier pour autant, ses sorts
// restent largement devant.
// =====================================================================
// Les quatre caractéristiques avec lesquelles on frappe. La Vitalité n'en
// fait pas partie — sauf pour le Gardien, dont c'est justement l'arme
// (« Vitalité : augmente les points de vie — et les dégâts du Gardien »).
// On l'ajoute donc au cas par cas, par la caractéristique de la classe :
// sans quoi la Vitalité deviendrait la meilleure statistique du jeu pour
// tout le monde, puisqu'elle donnerait à la fois les PV et les dégâts.
const CARACS_OFFENSIVES = ['for', 'dex', 'int', 'esp'];

function caracsFrappeDe(combattant) {
  const base = typeof CLASSES_BASE !== 'undefined' && CLASSES_BASE[combattant && combattant.classe];
  if (base && base.stat && CARACS_OFFENSIVES.indexOf(base.stat) === -1) {
    return CARACS_OFFENSIVES.concat([base.stat]);
  }
  return CARACS_OFFENSIVES;
}

// La caractéristique qui PORTE l'attaque de base — affichée au joueur pour
// qu'il sache quoi monter.
function caracAttaqueDeBase(combattant, s) {
  const candidates = caracsFrappeDe(combattant);
  return candidates.reduce((meilleure, cle) =>
    valeurOffensiveDe(cle, s) > valeurOffensiveDe(meilleure, s) ? cle : meilleure, candidates[0]);
}

function degatsAttaqueDeBase(combattant, s) {
  const stats = s || statsEffectives(combattant);
  const meilleure = caracsFrappeDe(combattant)
    .reduce((max, cle) => Math.max(max, valeurOffensiveDe(cle, stats)), 0);
  return 3 + meilleure;
}

// Valeur de soutien d'un effet : l'Esprit, ou l'Intelligence si elle est
// encore meilleure (héros d'avant la refonte des caractéristiques).
function statSoutien(s, cle) {
  const choisie = cle || 'int';
  const valeur = (s && s[choisie]) || 0;
  return choisie === 'int' ? Math.max(valeur, (s && s.esp) || 0) : valeur;
}

const TEXTE_CIBLE = {
  ennemi: 'un ennemi', ennemis: 'tous les ennemis',
  allie: 'un allié', allies: 'tout le groupe', soi: 'soi-même',
};

// =====================================================================
// v20 — Les retours de mana ÉVOLUENT eux aussi.
//
// Sept compétences rendaient un nombre fixe de points de mana : « +10 PM »,
// écrit en dur. Au niveau 5 c'était un tiers de la réserve, au niveau 90
// c'était trois pour cent — la compétence mourait doucement sans que
// personne ne s'en aperçoive. Elles rendent désormais une PART de la
// réserve, adossée à la valeur d'origine : le même geste garde le même
// sens du début à la fin.
// =====================================================================
function valeurRetourMana(effet, s, maxMp) {
  const base = effet.valeur || 0;
  const reserve = maxMp || (s ? 8 + ((s.int || 0) + (s.esp || 0)) * 3 : 0);
  return Math.max(base, Math.round(reserve * (effet.part || base / 60)));
}

function texteEffetCompetence(effet, s) {
  switch (effet.type) {
    case 'poison': {
      const valeur = effet.degats != null
        ? effet.degats
        : Math.round(3 + (s[effet.stat || 'dex'] || 0) * (effet.stat === 'int' ? 0.5 : 0.6));
      return `🧪 poison ≈${valeur}/tour (${effet.duree} t.)`;
    }
    case 'etourdi':
      return `💫 étourdit ${effet.duree || 1} t.${effet.chance != null && effet.chance < 1 ? ` (${Math.round(effet.chance * 100)} %)` : ''}`;
    case 'affaibli': return `⬇️ −30 % dégâts (${effet.duree} t.)`;
    case 'bouclier': return `🛡️ bouclier ≈${Math.round(8 + statSoutien(s, effet.stat) * 1.5)} (${effet.duree} t.)`;
    case 'benediction': return `🙏 +30 % dégâts (${effet.duree} t.)`;
    case 'provocation': return `😤 attire les coups + bouclier ≈${Math.round(4 + (s.for || 0))}`;
    case 'regen': return `💧 régén. ≈${Math.round(3 + statSoutien(s, effet.stat) * 0.8)}/tour (${effet.duree} t.)`;
    case 'mana': return `🧘 +${valeurRetourMana(effet, s)} PM`;
    case 'drain': return `🧛 rend ${Math.round(effet.part * 100)} % des dégâts en PV`;
    case 'pacte': return `🩸 −${Math.round(effet.partPv * 100)} % PV max → +${effet.mana} PM`;
    case 'vol-or': return `💰 vole ≈${Math.round(4 + (s.dex || 0) * 1.2)} po`;
    default: return '';
  }
}

// Renvoie des lignes chiffrées (dégâts, soins, effets, coût) calculées
// avec les stats effectives fournies.
// =====================================================================
// v20 — DIRE au joueur quelle caractéristique porte chaque compétence.
//
// Le détail chiffré affichait « ≈240 dégâts » sans jamais dire d'où
// venait le chiffre. Sur 701 compétences, deviner laquelle monter relevait
// du flair — et rien ne signalait qu'un sort d'Esprit ne profite pas d'un
// point d'Intelligence. La ligne ci-dessous le dit, avec le ratio : c'est
// la réponse à « je monte quoi pour ce sort ? ».
// =====================================================================
function caracPorteuse(comp, s) {
  if (comp.type !== 'degats' && comp.type !== 'soin') return null;
  // Les soins d'Intelligence acceptent l'Esprit s'il est meilleur (héros
  // d'avant la refonte) : on affiche celle qui compte VRAIMENT pour lui.
  let cle = comp.stat;
  if (comp.stat === 'int' && estCompetenceDeSoutien(comp) && s && (s.esp || 0) > (s.int || 0)) cle = 'esp';
  return CARACS[cle] ? { cle, nom: CARACS[cle].nom, emoji: CARACS[cle].emoji || '' } : null;
}

function ligneCaracPorteuse(comp, s) {
  const porteuse = caracPorteuse(comp, s);
  if (!porteuse) return '';
  const part = comp.ratio ? ` ×${String(comp.ratio).replace('.', ',')}` : '';
  return `📊 ${porteuse.emoji} ${porteuse.nom}${part}`;
}

function detailsCompetence(comp, s, rang = 0, maxMp = 0) {
  const parts = [];
  const multRang = 1 + 0.15 * rang;
  if (comp.type === 'degats') {
    const brut = Math.round((comp.puissance + statDeCompetence(comp, s) * comp.ratio) * multRang);
    parts.push(`⚔️ ≈${brut} dégâts${comp.coups ? ` ×${comp.coups} coups` : ''}`);
    parts.push(ligneCaracPorteuse(comp, s));
  } else if (comp.type === 'soin') {
    parts.push(`💚 ≈${Math.round((comp.puissance + statDeCompetence(comp, s) * comp.ratio) * multRang)} PV`);
    parts.push(ligneCaracPorteuse(comp, s));
  } else if (comp.type === 'invocation') {
    const modele = INVOCATIONS[comp.invocation];
    parts.push(`🐾 invoque ${modele.emoji} ${modele.nom} (jusqu'à sa mort ou la fin du combat)`);
    parts.push('🤖 agit seul · stats ≤ les vôtres · 50 % de votre mana');
    parts.push('☝️ 1 invocation à la fois — 2 pour l’Invocateur 🐉');
  }
  if (rang > 0) parts.push(`🏅 rang ${rang} (+${Math.round(rang * 15)} %)`);
  if (comp.critBonus) parts.push(`💥 +${Math.round(comp.critBonus * 100)} % crit.`);
  if (comp.effet) {
    const texte = texteEffetCompetence(comp.effet, s);
    if (texte) parts.push(texte);
  }
  parts.push(`🎯 ${TEXTE_CIBLE[comp.cible]}`);
  const cout = coutMpDe(comp, s, maxMp);
  parts.push(cout > 0 ? `💧 ${cout} PM${cout > (comp.coutMp || 0) ? ` (${comp.coutMp} +${cout - comp.coutMp} lié aux stats)` : ''}` : '💧 gratuit');
  if (comp.cooldown) parts.push(`⏳ ${comp.cooldown} t.`);
  return parts.filter(Boolean);
}

// =====================================================================
// v17 : coût en mana ÉVOLUTIF. Plus la stat qui porte la compétence est
// haute (donc plus elle frappe/soigne fort), plus elle coûte un peu de
// mana. Garde-fou : le coût ne dépasse jamais 30 % du mana maximum —
// aucune compétence ne vide la réserve d'un coup.
// =====================================================================
function coutMpDe(comp, s, maxMp) {
  let cout = comp.coutMp || 0;
  if (cout > 0 && comp.stat && comp.ratio && (comp.type === 'degats' || comp.type === 'soin')) {
    cout += Math.floor(((s && s[comp.stat]) || 0) * comp.ratio * 0.08);
  }
  if (maxMp > 0 && cout > (comp.coutMp || 0)) {
    cout = Math.min(cout, Math.max(comp.coutMp || 0, Math.round(maxMp * 0.3)));
  }
  return cout;
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
    stat: 'dex', puissance: 4, ratio: 1.0, coutMp: 5, cooldown: 3,
    effet: { type: 'poison', duree: 3 },
    desc: 'Blesse un ennemi et l’empoisonne pendant 3 tours.',
  },
  'tir-precis': {
    nom: 'Tir précis', emoji: '🏹', categorie: 'physique', type: 'degats', cible: 'ennemi',
    stat: 'dex', puissance: 7, ratio: 1.4, coutMp: 3, cooldown: 2, critBonus: 0.2,
    desc: 'Un tir précis avec +20 % de chances de critique. Basé sur l’Dextérité.',
  },
  'pluie-de-fleches': {
    nom: 'Pluie de flèches', emoji: '🎯', categorie: 'physique', type: 'degats', cible: 'ennemis',
    stat: 'dex', puissance: 3, ratio: 0.8, coutMp: 8, cooldown: 3,
    desc: 'Crible tous les ennemis de flèches. Basé sur l’Dextérité.',
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
    stat: 'dex', puissance: 2, ratio: 0.55, coups: 3, coutMp: 6, cooldown: 3,
    desc: 'Trois coups éclair sur la même cible, chacun pouvant être critique.',
  },
  'paume-zephyr': {
    nom: 'Paume du zéphyr', emoji: '🌬️', categorie: 'physique', type: 'degats', cible: 'ennemi',
    stat: 'dex', puissance: 6, ratio: 1.0, coutMp: 6, cooldown: 4,
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
    stat: 'dex', puissance: 14, ratio: 1.8, coutMp: 9, cooldown: 5,
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
    stat: 'dex', puissance: 4, ratio: 0.8, coups: 2, coutMp: 5, cooldown: 2,
    desc: 'Votre compagnon loup mord deux fois la cible.',
  },
  'ronces-etrangleuses': {
    nom: 'Ronces étrangleuses', emoji: '🌿', categorie: 'physique', type: 'degats', cible: 'ennemis',
    stat: 'dex', puissance: 3, ratio: 0.6, coutMp: 9, cooldown: 4,
    effet: { type: 'poison', duree: 2 },
    desc: 'Des ronces lacèrent et empoisonnent tous les ennemis.',
  },
  'instinct-sauvage': {
    nom: 'Instinct sauvage', emoji: '👁️', categorie: 'soutien', type: 'utilitaire', cible: 'soi',
    stat: 'dex', coutMp: 6, cooldown: 5,
    effet: { type: 'benediction', duree: 3 },
    desc: 'Vos sens s’aiguisent : +30 % de dégâts pendant 3 tours.',
  },

  // ----- Voie de l'Assassin -----
  'lame-dans-l-ombre': {
    nom: 'Lame dans l’ombre', emoji: '🌑', categorie: 'physique', type: 'degats', cible: 'ennemi',
    stat: 'dex', puissance: 8, ratio: 1.3, coutMp: 5, cooldown: 2, critBonus: 0.35,
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
    stat: 'dex', puissance: 12, ratio: 2.1, coutMp: 10, cooldown: 5, critBonus: 0.15,
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
    stat: 'dex', puissance: 4, ratio: 0.9, coutMp: 4, cooldown: 2,
    effet: { type: 'vol-or' },
    desc: 'Frappe la cible et lui fait les poches : de l’or en plus au butin !',
  },
  'coup-bas': {
    nom: 'Coup bas', emoji: '🦵', categorie: 'physique', type: 'degats', cible: 'ennemi',
    stat: 'dex', puissance: 5, ratio: 1.0, coutMp: 6, cooldown: 4,
    effet: { type: 'etourdi', duree: 1, chance: 0.4 },
    desc: 'Un coup peu glorieux mais efficace : 40 % de chances d’étourdir.',
  },
  'poussiere-aveuglante': {
    nom: 'Poussière aveuglante', emoji: '🌫️', categorie: 'physique', type: 'degats', cible: 'ennemis',
    stat: 'dex', puissance: 1, ratio: 0.4, coutMp: 7, cooldown: 4,
    effet: { type: 'affaibli', duree: 2 },
    desc: 'Une poignée de sable dans les yeux : tous les ennemis frappent moins fort.',
  },

  // ----- Voie du Danselame -----
  'valse-des-lames': {
    nom: 'Valse des lames', emoji: '🌸', categorie: 'physique', type: 'degats', cible: 'ennemis',
    stat: 'dex', puissance: 3, ratio: 0.75, coutMp: 8, cooldown: 3,
    desc: 'Une danse mortelle qui effleure tous les ennemis.',
  },
  'estocade-gracieuse': {
    nom: 'Estocade gracieuse', emoji: '🤺', categorie: 'physique', type: 'degats', cible: 'ennemi',
    stat: 'dex', puissance: 7, ratio: 1.35, coutMp: 5, cooldown: 2, critBonus: 0.25,
    desc: 'Un assaut élégant et précis, souvent critique.',
  },
  'danse-du-vent': {
    nom: 'Danse du vent', emoji: '🍃', categorie: 'soutien', type: 'soin', cible: 'soi',
    stat: 'dex', puissance: 4, ratio: 0.7, coutMp: 0, cooldown: 4,
    effet: { type: 'mana', valeur: 5 },
    desc: 'Un pas de côté pour souffler : récupère des PV et 5 PM.',
  },
};
