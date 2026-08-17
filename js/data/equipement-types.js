'use strict';

// =====================================================================
// v19 — QUI PEUT PORTER QUOI.
//
// Jusqu'ici, le générateur produisait dix archétypes pour tous les
// niveaux et toutes les raretés, sans aucune notion de porteur : une
// cuirasse donnait +Vitalité à un mage comme à un guerrier, et rien ne
// l'empêchait de l'équiper. Une armure de fer sur un Arcaniste, une
// tunique de lin sur un Gardien — le catalogue ne faisait aucune
// différence.
//
// Deux typages y remédient : la CATÉGORIE D'ARMURE et la FAMILLE D'ARME.
// Chaque classe déclare ce qu'elle sait porter, et le reste s'affiche
// grisé avec son cadenas — la convention visuelle des recettes
// verrouillées, qui existait déjà.
// =====================================================================

const CATEGORIES_ARMURE = {
  tissu: {
    nom: 'Tissu', emoji: '🧵',
    desc: 'Robes, tuniques et étoffes — légères, elles laissent passer la magie.',
    // Ce que la catégorie favorise : sert de garde-fou au générateur.
    affinites: ['int', 'esp', 'piete'],
  },
  cuir: {
    nom: 'Cuir', emoji: '🟫',
    desc: 'Justaucorps et brigandines — souples, taillés pour bouger vite.',
    affinites: ['dex', 'celerite', 'crit'],
  },
  maille: {
    nom: 'Maille', emoji: '⛓️',
    desc: 'Hauberts et cottes gravées — le compromis de ceux qui lancent au contact.',
    affinites: ['int', 'vit', 'deter'],
  },
  plaque: {
    nom: 'Plaque', emoji: '🛡️',
    desc: 'Cuirasses et heaumes d’acier — lourds, et c’est bien l’idée.',
    affinites: ['for', 'vit', 'deter'],
  },
};

const FAMILLES_ARME = {
  lame: { nom: 'Lame lourde', emoji: '⚔️', desc: 'Épées, haches et masses de mêlée.' },
  arc: { nom: 'Arme de tir', emoji: '🏹', desc: 'Arcs, arbalètes et dagues de lancer.' },
  baton: { nom: 'Focus arcanique', emoji: '🪄', desc: 'Bâtons, sceptres et grimoires.' },
  calice: { nom: 'Insigne sacré', emoji: '🕊️', desc: 'Cannes, calices et crosses de soin.' },
  runique: { nom: 'Lame runique', emoji: '🌑', desc: 'Faux et lames gravées, magiques au contact.' },
  pavois: { nom: 'Bouclier-pavois', emoji: '🛡️', desc: 'Grands boucliers et masses de garde.' },
};

// Ce que chaque classe sait porter. Une classe peut manier plusieurs
// familles d'armes — mais une seule catégorie d'armure, qui fait sa
// silhouette.
const EQUIPEMENT_PAR_CLASSE = {
  gardien: { armure: 'plaque', armes: ['pavois', 'lame'] },
  guerrier: { armure: 'plaque', armes: ['lame'] },
  'franc-tireur': { armure: 'cuir', armes: ['arc'] },
  arcaniste: { armure: 'tissu', armes: ['baton'] },
  devin: { armure: 'tissu', armes: ['calice', 'baton'] },
  runelame: { armure: 'maille', armes: ['runique', 'lame'] },
};

// Les emplacements qui portent une catégorie d'armure. Les accessoires
// n'en ont pas : une bague va à tout le monde, et c'est très bien ainsi.
const SLOTS_ARMURE = ['tete', 'torse', 'mains', 'jambes', 'pieds'];

// =====================================================================
// Le héros peut-il porter cette pièce ?
//
// Règle d'or, encore : on ne retire jamais rien. Un objet déjà équipé qui
// deviendrait illégal reste équipé — la vérification ne s'applique qu'au
// moment d'en équiper un nouveau, et l'avertissement suffit pour le reste.
// =====================================================================
function reglesEquipement(p) {
  return EQUIPEMENT_PAR_CLASSE[p && p.classe] || null;
}

function peutPorter(p, objet) {
  if (!objet || objet.type !== 'equipement') return true;
  const regles = reglesEquipement(p);
  if (!regles) return true;             // classe héritée : aucune restriction
  if (objet.armure) return objet.armure === regles.armure;
  if (objet.familleArme) return regles.armes.includes(objet.familleArme);
  return true;                          // accessoires et pièces d'avant la v19
}

// Pourquoi le héros ne peut pas la porter, en une phrase lisible.
function raisonRefusEquipement(p, objet) {
  const regles = reglesEquipement(p);
  if (!regles || peutPorter(p, objet)) return '';
  const classe = (CLASSES_BASE[p.classe] || {}).nom || 'Cette classe';
  if (objet.armure) {
    const porte = CATEGORIES_ARMURE[regles.armure];
    const piece = CATEGORIES_ARMURE[objet.armure];
    return `${piece.emoji} Armure de ${piece.nom.toLowerCase()} — ${classe} porte du ${porte.nom.toLowerCase()}.`;
  }
  const famille = FAMILLES_ARME[objet.familleArme];
  const siennes = regles.armes.map((cle) => FAMILLES_ARME[cle].nom.toLowerCase()).join(' ou ');
  return `${famille.emoji} ${famille.nom} — ${classe} manie ${siennes}.`;
}

// L'étiquette de type portée par une carte d'objet.
function texteTypeEquipement(objet) {
  if (!objet) return '';
  if (objet.armure) {
    const c = CATEGORIES_ARMURE[objet.armure];
    return `<span class="type-equipement type-${objet.armure}">${c.emoji} ${c.nom}</span>`;
  }
  if (objet.familleArme) {
    const f = FAMILLES_ARME[objet.familleArme];
    return `<span class="type-equipement type-arme">${f.emoji} ${f.nom}</span>`;
  }
  return '';
}
