'use strict';

// =====================================================================
// v21 — LES PASSIFS, ENFIN BRANCHÉS.
//
// Jusqu'ici, tout ce qu'un héros lisait sur sa classe, sa spécialité, sa
// Voie ou son Éveil était du TEXTE : « Deux invocations à la fois »,
// « +60 % de PV maximum », « Quatre invocations simultanées »… et rien
// derrière. Pire : la compétence d'une Voie recopiait la phrase du passif
// dans sa propre description. Un joueur ouvrait sa barre d'action et y
// lisait un SORT nommé « Légion » qui annonçait « Quatre invocations
// simultanées » — alors que ce sort est une salve de dégâts, et que le
// nombre d'invocations n'a jamais été autre chose qu'un passif.
//
// Ce fichier répare les deux bouts à la fois :
//
//   1. il donne à chaque classe, spécialité, Voie et Éveil des EFFETS
//      MÉCANIQUES réels, lus par le moteur de combat ;
//   2. il RÉÉCRIT le texte affiché à partir de ces effets, de sorte que
//      ce qui est écrit soit exactement ce qui est calculé. Plus jamais
//      une promesse sans code derrière.
//
// Les Voies et les Éveils tirent leurs effets d'un catalogue de PROFILS
// communs. C'est volontaire : 81 Voies et 162 Éveils écrits à la main,
// ce sont 243 occasions de créer un déséquilibre invisible. À profil
// égal, deux passifs valent la même chose — la règle d'équilibrage des
// Éveils (§5.1 : la rareté ajoute de la contrainte, jamais de la
// puissance) reste vérifiable, et un test la vérifie.
// =====================================================================

// ---------------------------------------------------------------------
// Le vocabulaire. Un passif ne peut promettre que ce qui figure ici —
// c'est la garantie que rien ne se dit sans être calculé.
//
//   degatsMult        multiplie les dégâts infligés
//   degatsManquants   + % de dégâts proportionnel aux PV manquants
//   degatsCreatures   + % de dégâts contre les monstres
//   degatsEtourdis    + % de dégâts contre une cible étourdie / gelée
//   degatsParMort     + % de dégâts par créature tombée sur le terrain
//   degatsParCentPv   + % de dégâts par tranche de 100 PV maximum
//   critBonus         + chances de coup critique
//   critPremierCoup   le premier coup de chaque combat est critique
//   chargesCritique   toutes les N frappes, la suivante est critique
//   execution         achève une cible non-boss sous ce seuil de PV
//   drainPart         part des dégâts rendue en PV
//   soinParKill       PV rendus (en % du maximum) à chaque mise à mort
//   reductionDegats   réduit les dégâts subis
//   reductionEquipe   réduit les dégâts subis par TOUTE l'équipe
//   pvMaxMult         multiplie les PV maximum
//   regenParTour      % des PV maximum régénérés chaque tour
//   manaParTour       PM récupérés chaque tour, en plus des 2 de base
//   manaEnPv          peut lancer un sort en payant le mana manquant en PV
//   soinMult          multiplie les soins prodigués
//   bouclierMult      multiplie les boucliers posés
//   surplusBouclier   le surplus de soin devient un bouclier (plafond en % PV)
//   dureeBuff         + tours sur bénédiction, régénération, bouclier
//   dureeStatut       + tours sur poison, affaiblissement
//   celeriteBonus     + points de Célérité (initiative)
//   ignoreLigneArriere pas de malus physique depuis la ligne arrière
//   ligneGratuite     changer de ligne ne consomme pas le tour
//   invocations       nombre d'invocations simultanées
//   invocationStats   puissance des invocations (× leurs fractions)
//   orMult / xpMult   multiplient l'or et l'expérience gagnés
// ---------------------------------------------------------------------

const CUMUL_PASSIFS = {
  // Les multiplicateurs se multiplient entre eux.
  produit: ['degatsMult', 'pvMaxMult', 'soinMult', 'bouclierMult', 'orMult', 'xpMult'],
  // Les bonus s'additionnent.
  somme: ['degatsManquants', 'degatsCreatures', 'degatsEtourdis', 'degatsParMort',
    'degatsParCentPv', 'critBonus', 'drainPart', 'soinParKill', 'reductionDegats',
    'reductionEquipe', 'regenParTour', 'manaParTour', 'dureeBuff', 'dureeStatut',
    'celeriteBonus'],
  // On garde le meilleur.
  maximum: ['execution', 'surplusBouclier'],
  // Vrai dès qu'une source le donne.
  drapeau: ['critPremierCoup', 'ignoreLigneArriere', 'ligneGratuite', 'manaEnPv'],
};

// Bornes de sécurité : aucun empilement (classe + spécialité + Voie +
// Éveil) ne doit rendre un héros intouchable ou insoigner un boss.
const PLAFONDS_PASSIFS = {
  degatsMult: 2.2, pvMaxMult: 2.4, soinMult: 2, bouclierMult: 2.2,
  orMult: 2.5, xpMult: 2, reductionDegats: 0.4, reductionEquipe: 0.2,
  degatsManquants: 0.8, degatsCreatures: 0.7, degatsEtourdis: 0.8,
  degatsParCentPv: 0.08, critBonus: 0.45, drainPart: 0.5, soinParKill: 0.2,
  regenParTour: 0.1, manaParTour: 8, dureeBuff: 4, dureeStatut: 4,
  celeriteBonus: 30, execution: 0.25, surplusBouclier: 0.35, invocations: 6,
};

// ---------------------------------------------------------------------
// Les profils de passif, en deux crans : celui d'une Voie (niveau 50) et
// celui d'un Éveil (niveau 80). Le cran d'Éveil est plus fort, mais tous
// les Éveils partagent le même cran — la rareté ne change que la
// contrainte attachée, jamais la puissance.
// ---------------------------------------------------------------------
const PROFILS_PASSIFS = {
  brutalite:  { voie: { degatsMult: 1.12 },                     eveil: { degatsMult: 1.2 } },
  precision:  { voie: { critBonus: 0.12 },                      eveil: { critBonus: 0.2 } },
  rage:       { voie: { degatsManquants: 0.35 },                eveil: { degatsManquants: 0.55 } },
  vampirisme: { voie: { drainPart: 0.2 },                       eveil: { drainPart: 0.3 } },
  curee:      { voie: { soinParKill: 0.08 },                    eveil: { soinParKill: 0.14 } },
  carapace:   { voie: { reductionDegats: 0.12 },                eveil: { reductionDegats: 0.18 } },
  rempart:    { voie: { reductionEquipe: 0.08 },                eveil: { reductionEquipe: 0.12 } },
  titan:      { voie: { pvMaxMult: 1.3 },                       eveil: { pvMaxMult: 1.5 } },
  masse:      { voie: { degatsParCentPv: 0.03 },                eveil: { degatsParCentPv: 0.05 } },
  seve:       { voie: { regenParTour: 0.04 },                   eveil: { regenParTour: 0.07 } },
  flux:       { voie: { manaParTour: 3 },                       eveil: { manaParTour: 5 } },
  guerison:   { voie: { soinMult: 1.25 },                       eveil: { soinMult: 1.4 } },
  egide:      { voie: { bouclierMult: 1.35 },                   eveil: { bouclierMult: 1.55 } },
  surplus:    { voie: { surplusBouclier: 0.2 },                 eveil: { surplusBouclier: 0.3 } },
  cadence:    { voie: { celeriteBonus: 12 },                    eveil: { celeriteBonus: 20 } },
  chant:      { voie: { dureeBuff: 2 },                         eveil: { dureeBuff: 3 } },
  peste:      { voie: { dureeStatut: 2 },                       eveil: { dureeStatut: 3 } },
  chasse:     { voie: { degatsCreatures: 0.25 },                eveil: { degatsCreatures: 0.4 } },
  givre:      { voie: { degatsEtourdis: 0.3 },                  eveil: { degatsEtourdis: 0.5 } },
  sentence:   { voie: { execution: 0.12 },                      eveil: { execution: 0.2 } },
  moisson:    { voie: { degatsParMort: 0.04 },                  eveil: { degatsParMort: 0.07 } },
  embuscade:  { voie: { critPremierCoup: true, critBonus: 0.05 }, eveil: { critPremierCoup: true, critBonus: 0.1 } },
  elan:       { voie: { chargesCritique: 5 },                   eveil: { chargesCritique: 4 } },
  tir:        { voie: { ignoreLigneArriere: true, degatsMult: 1.08 }, eveil: { ignoreLigneArriere: true, degatsMult: 1.15 } },
  fortune:    { voie: { orMult: 1.35 },                         eveil: { orMult: 1.6 } },
  savoir:     { voie: { xpMult: 1.25 },                         eveil: { xpMult: 1.45 } },
  horde3:     { voie: { invocations: 3, invocationStats: 0.8 }, eveil: { invocations: 3, invocationStats: 1 } },
  horde4:     { voie: { invocations: 4, invocationStats: 0.6 }, eveil: { invocations: 4, invocationStats: 0.85 } },
  horde6:     { voie: { invocations: 6, invocationStats: 0.5 }, eveil: { invocations: 6, invocationStats: 0.65 } },
};

// ---------------------------------------------------------------------
// Mise en mots. Chaque effet sait se dire ; la phrase d'un passif est la
// somme de ce qu'il fait, dans cet ordre. C'est cette fonction qui
// garantit que l'affiché et le calculé ne peuvent plus diverger.
// ---------------------------------------------------------------------
const MOTS_NOMBRE = ['zéro', 'une', 'deux', 'trois', 'quatre', 'cinq', 'six'];

const PHRASES_PASSIF = {
  invocations: (v, e) => `${MOTS_NOMBRE[v] || v} invocations à la fois, à ${Math.round((e.invocationStats == null ? 1 : e.invocationStats) * 100)} % de leur puissance habituelle`,
  degatsMult: (v) => `+${Math.round((v - 1) * 100)} % de dégâts`,
  degatsManquants: (v) => `ses dégâts montent avec ses blessures, jusqu’à +${Math.round(v * 100)} % à un souffle de la mort`,
  degatsCreatures: (v) => `+${Math.round(v * 100)} % de dégâts contre les créatures`,
  degatsEtourdis: (v) => `+${Math.round(v * 100)} % contre une cible étourdie ou gelée`,
  degatsParMort: (v) => `+${Math.round(v * 100)} % de dégâts par créature tombée dans le combat`,
  degatsParCentPv: (v) => `+${Math.round(v * 100)} % de dégâts par tranche de 100 PV maximum`,
  critBonus: (v) => `+${Math.round(v * 100)} % de chances de coup critique`,
  critPremierCoup: () => 'son premier coup de chaque combat est critique',
  chargesCritique: (v) => `une frappe sur ${v} est critique d’office`,
  execution: (v) => `achève toute créature non-boss sous ${Math.round(v * 100)} % de ses PV`,
  drainPart: (v) => `ses coups lui rendent ${Math.round(v * 100)} % des dégâts en PV`,
  soinParKill: (v) => `chaque mise à mort lui rend ${Math.round(v * 100)} % de ses PV`,
  reductionDegats: (v) => `les dégâts qu’il subit baissent de ${Math.round(v * 100)} %`,
  reductionEquipe: (v) => `toute l’équipe subit ${Math.round(v * 100)} % de dégâts en moins`,
  pvMaxMult: (v) => `+${Math.round((v - 1) * 100)} % de PV maximum`,
  regenParTour: (v) => `il régénère ${Math.round(v * 100)} % de ses PV par tour`,
  manaParTour: (v) => `+${v} PM récupérés à chaque tour`,
  manaEnPv: () => 'il peut lancer un sort à court de mana en le payant en PV',
  soinMult: (v) => `ses soins rendent ${Math.round((v - 1) * 100)} % de plus`,
  bouclierMult: (v) => `ses boucliers absorbent ${Math.round((v - 1) * 100)} % de plus`,
  surplusBouclier: (v) => `le surplus de ses soins devient un bouclier (jusqu’à ${Math.round(v * 100)} % des PV de la cible)`,
  dureeBuff: (v) => `ses bénédictions, régénérations et boucliers durent ${v} tour${v > 1 ? 's' : ''} de plus`,
  dureeStatut: (v) => `ses poisons et affaiblissements durent ${v} tour${v > 1 ? 's' : ''} de plus`,
  celeriteBonus: (v) => `+${v} de Célérité : il agit plus souvent`,
  ignoreLigneArriere: () => 'il frappe à pleine puissance depuis la ligne arrière',
  ligneGratuite: () => 'changer de ligne ne lui coûte pas son tour',
  orMult: (v) => `+${Math.round((v - 1) * 100)} % d’or`,
  xpMult: (v) => `+${Math.round((v - 1) * 100)} % d’expérience`,
};

// L'ordre de lecture : ce qui définit le héros d'abord, le confort après.
const ORDRE_PHRASES = ['invocations', 'invocationStats', 'pvMaxMult', 'degatsMult',
  'degatsManquants', 'degatsCreatures', 'degatsEtourdis', 'degatsParMort', 'degatsParCentPv',
  'critBonus', 'critPremierCoup', 'chargesCritique', 'execution', 'drainPart', 'soinParKill',
  'reductionDegats', 'reductionEquipe', 'regenParTour', 'manaParTour', 'manaEnPv',
  'soinMult', 'bouclierMult', 'surplusBouclier', 'dureeBuff', 'dureeStatut',
  'celeriteBonus', 'ignoreLigneArriere', 'ligneGratuite', 'orMult', 'xpMult'];

function texteEffetsPassif(effets) {
  const parts = [];
  ORDRE_PHRASES.forEach((cle) => {
    if (cle === 'invocationStats') return; // dit par la phrase des invocations
    const valeur = effets[cle];
    if (valeur == null || valeur === false || valeur === 0) return;
    // Un multiplicateur à 1 ne fait rien : il ne doit pas s'annoncer
    // (« +0 % de dégâts » sur la fiche d'un héros, c'est du bruit).
    if (CUMUL_PASSIFS.produit.includes(cle) && valeur === 1) return;
    // Une invocation unique est la règle commune : on ne l'annonce pas non plus.
    if (cle === 'invocations' && valeur <= 1) return;
    const phrase = PHRASES_PASSIF[cle];
    if (phrase) parts.push(phrase(valeur, effets));
  });
  if (!parts.length) return '';
  const texte = parts.join(' · ');
  return texte.charAt(0).toUpperCase() + texte.slice(1) + '.';
}

// ---------------------------------------------------------------------
// Les six classes de base. Leur passif était déjà écrit — il devient vrai.
// ---------------------------------------------------------------------
const PASSIFS_CLASSES = {
  // Rempart : la Ténacité réduit déjà les coups reçus ; la classe y ajoute
  // sa part, et couvre un peu ses alliés.
  gardien: { reductionDegats: 0.06, reductionEquipe: 0.04 },
  // Élan : chaque coup nourrit le suivant.
  guerrier: { chargesCritique: 6, degatsMult: 1.06 },
  // Ligne de tir : aucun malus depuis l'arrière, et l'initiative lui revient.
  'franc-tireur': { ignoreLigneArriere: true, celeriteBonus: 6 },
  // Flux : la magie ignore déjà les lignes ; le mana revient plus vite.
  arcaniste: { manaParTour: 2 },
  // Clairvoyance : les soins montent avec l'Esprit, et le surplus ne se perd pas.
  devin: { soinMult: 1.08, surplusBouclier: 0.1 },
  // Gravure : ses sorts lui rendent une part de ce qu'ils prennent.
  runelame: { drainPart: 0.1 },
};

// ---------------------------------------------------------------------
// Les vingt-sept spécialités. Chaque entrée porte ses effets ET la phrase
// qui les dit — écrite à la main ici, parce que ces vingt-sept-là sont
// l'identité du héros et méritent mieux qu'une phrase générée.
// ---------------------------------------------------------------------
const PASSIFS_SOUS_CLASSES = {
  // ----- 🛡️ Gardien -----
  templier: {
    effets: { reductionEquipe: 0.08, bouclierMult: 1.2 },
    texte: 'Il partage sa garde : toute l’équipe subit 8 % de dégâts en moins, et ses boucliers absorbent 20 % de plus.',
  },
  paladin: {
    effets: { bouclierGratuit: 0.3, soinMult: 1.15 },
    texte: 'Un allié qui tombe sous 30 % de PV reçoit un bouclier gratuit, une fois par combat et par allié ; ses soins rendent 15 % de plus.',
  },
  'chevalier-noir': {
    effets: { drainPart: 0.2, manaEnPv: true },
    texte: 'Ses coups lui rendent 20 % des dégâts en PV, et il paie en PV le mana qui lui manque.',
  },
  colosse: {
    effets: { degatsParCentPv: 0.03 },
    texte: 'Ses dégâts montent avec sa masse : +3 % par tranche de 100 PV maximum.',
  },

  // ----- ⚔️ Guerrier -----
  berserker: {
    effets: { degatsManquants: 0.45, soinParKill: 0.08 },
    texte: 'Plus il lui manque de PV, plus il frappe fort (jusqu’à +45 %) ; chaque mise à mort lui rend 8 % de ses PV.',
  },
  moine: {
    effets: { chargesCritique: 5 },
    texte: 'Chaque coup accumule une charge : la cinquième frappe est critique d’office.',
  },
  assassin: {
    effets: { critPremierCoup: true, critBonus: 0.05 },
    texte: 'Le premier coup de chaque combat est critique garanti, et il conserve +5 % de critique ensuite.',
  },
  danselame: {
    effets: { ligneGratuite: true, celeriteBonus: 10 },
    texte: 'Changer de ligne ne lui coûte pas son tour, et il garde +10 de Célérité.',
  },
  duelliste: {
    effets: { critBonus: 0.15 },
    texte: 'Il lit son adversaire : +15 % de chances de coup critique, en toutes circonstances.',
  },

  // ----- 🏹 Franc-tireur -----
  rodeur: {
    effets: { degatsCreatures: 0.3 },
    texte: 'Le bois est son terrain : +30 % de dégâts contre les créatures.',
  },
  voleur: {
    effets: { orMult: 1.25, xpMult: 1.1 },
    texte: 'Il repart toujours plus riche : +25 % d’or et +10 % d’expérience sur tout ce qu’il ramasse.',
  },
  traqueur: {
    effets: { degatsMult: 1.12, critBonus: 0.05 },
    texte: 'Il désigne le point faible : +12 % de dégâts et +5 % de critique.',
  },
  voltigeur: {
    effets: { ignoreLigneArriere: true, celeriteBonus: 10 },
    texte: 'Aucun malus depuis la ligne arrière, et +10 de Célérité : jamais deux fois au même endroit.',
  },

  // ----- 🔮 Arcaniste -----
  pyromancien: {
    effets: { dureeStatut: 2, degatsMult: 1.06 },
    texte: 'Ses brûlures durent 2 tours de plus, et tout ce qu’il lance frappe 6 % plus fort.',
  },
  givremage: {
    effets: { degatsEtourdis: 0.3 },
    texte: 'Il ralentit le monde, puis le casse : +30 % de dégâts contre une cible étourdie ou gelée.',
  },
  elementaliste: {
    effets: { degatsMult: 1.1, manaParTour: 2 },
    texte: 'Ses éléments s’appellent l’un l’autre : +10 % de dégâts et +2 PM par tour.',
  },
  necromancien: {
    effets: { degatsParMort: 0.04 },
    texte: 'Le champ de bataille travaille pour lui : +4 % de dégâts par créature tombée dans le combat.',
  },
  invocateur: {
    effets: { invocations: 2, invocationStats: 1.4 },
    texte: 'Deux invocations à la fois, et leurs statistiques montent de 40 %.',
  },

  // ----- ✨ Devin -----
  barde: {
    effets: { dureeBuff: 2, soinMult: 1.1 },
    texte: 'Ses bénédictions, régénérations et boucliers durent 2 tours de plus, et ses soins rendent 10 % de plus.',
  },
  chaman: {
    effets: { bouclierMult: 1.25, soinMult: 1.15 },
    texte: 'Les esprits montent la garde : +25 % sur ses boucliers, +15 % sur ses soins.',
  },
  druide: {
    effets: { regenParTour: 0.03, soinMult: 1.15 },
    texte: 'La forêt le porte : il régénère 3 % de ses PV par tour et ses soins rendent 15 % de plus.',
  },
  oracle: {
    effets: { surplusBouclier: 0.2 },
    texte: 'Elle soigne avant la blessure : le surplus de ses soins devient un bouclier, jusqu’à 20 % des PV de la cible.',
  },

  // ----- 🌑 Runelame -----
  faucheur: {
    effets: { drainPart: 0.25, execution: 0.15 },
    texte: 'Ses sorts lui rendent 25 % en PV, et il achève toute créature non-boss sous 15 % de vie.',
  },
  corrupteur: {
    effets: { dureeStatut: 2 },
    texte: 'Il ne tue pas, il laisse faire : ses poisons et affaiblissements durent 2 tours de plus.',
  },
  metamorphe: {
    effets: { pvMaxMult: 1.15, celeriteBonus: 8 },
    texte: 'Il garde un pied dans chaque forme : +15 % de PV maximum et +8 de Célérité.',
  },
  runemaitre: {
    effets: { degatsMult: 1.12, manaParTour: 2 },
    texte: 'La discipline avant la puissance : +12 % de dégâts et +2 PM par tour.',
  },
  vibrelame: {
    effets: { critBonus: 0.1, celeriteBonus: 8 },
    texte: 'La vitesse jusqu’à ce que l’acier chante : +10 % de critique et +8 de Célérité.',
  },
};

// ---------------------------------------------------------------------
// Les 81 Voies : un profil chacune, dans l'ordre où elles sont déclarées
// (TABLE_VOIES). Le profil est choisi pour coller au nom de la Voie —
// la Voie du Sang draine, la Voie de la Horde invoque.
// ---------------------------------------------------------------------
const PROFILS_VOIES = {
  templier: ['rempart', 'chant', 'brutalite'],
  paladin: ['egide', 'brutalite', 'guerison'],
  'chevalier-noir': ['vampirisme', 'peste', 'sentence'],
  colosse: ['titan', 'carapace', 'masse'],

  berserker: ['rage', 'vampirisme', 'curee'],
  moine: ['elan', 'cadence', 'seve'],
  assassin: ['embuscade', 'peste', 'sentence'],
  danselame: ['cadence', 'precision', 'brutalite'],
  duelliste: ['cadence', 'precision', 'brutalite'],

  rodeur: ['chasse', 'horde3', 'peste'],
  voleur: ['fortune', 'savoir', 'precision'],
  traqueur: ['brutalite', 'sentence', 'chasse'],
  voltigeur: ['precision', 'cadence', 'tir'],

  pyromancien: ['peste', 'brutalite', 'moisson'],
  givremage: ['givre', 'precision', 'peste'],
  elementaliste: ['flux', 'brutalite', 'precision'],
  necromancien: ['peste', 'moisson', 'givre'],
  invocateur: ['horde3', 'guerison', 'horde4'],

  barde: ['chant', 'brutalite', 'guerison'],
  chaman: ['egide', 'guerison', 'brutalite'],
  druide: ['surplus', 'peste', 'seve'],
  oracle: ['egide', 'carapace', 'guerison'],

  faucheur: ['vampirisme', 'moisson', 'sentence'],
  corrupteur: ['peste', 'brutalite', 'givre'],
  metamorphe: ['titan', 'cadence', 'peste'],
  runemaitre: ['flux', 'peste', 'brutalite'],
  vibrelame: ['brutalite', 'givre', 'precision'],
};

// ---------------------------------------------------------------------
// Les 162 Éveils : six profils par spécialité, dans l'ordre des raretés
// (rare → caché). Tous au même cran de puissance : la rareté n'ajoute
// que la contrainte, jamais la force.
// ---------------------------------------------------------------------
const PROFILS_EVEILS = {
  templier: ['rempart', 'carapace', 'egide', 'seve', 'rempart', 'brutalite'],
  paladin: ['guerison', 'brutalite', 'egide', 'sentence', 'seve', 'vampirisme'],
  'chevalier-noir': ['vampirisme', 'peste', 'vampirisme', 'rempart', 'moisson', 'sentence'],
  colosse: ['titan', 'givre', 'masse', 'carapace', 'carapace', 'brutalite'],

  berserker: ['rage', 'curee', 'titan', 'vampirisme', 'precision', 'sentence'],
  moine: ['elan', 'brutalite', 'carapace', 'cadence', 'seve', 'sentence'],
  assassin: ['embuscade', 'curee', 'sentence', 'brutalite', 'precision', 'peste'],
  danselame: ['cadence', 'precision', 'brutalite', 'cadence', 'elan', 'givre'],
  duelliste: ['precision', 'cadence', 'brutalite', 'sentence', 'elan', 'chasse'],

  rodeur: ['chasse', 'horde3', 'chasse', 'peste', 'brutalite', 'embuscade'],
  voleur: ['fortune', 'fortune', 'precision', 'peste', 'savoir', 'precision'],
  traqueur: ['brutalite', 'moisson', 'sentence', 'cadence', 'sentence', 'embuscade'],
  voltigeur: ['precision', 'cadence', 'cadence', 'brutalite', 'carapace', 'sentence'],

  pyromancien: ['peste', 'moisson', 'seve', 'brutalite', 'peste', 'sentence'],
  givremage: ['givre', 'givre', 'carapace', 'givre', 'peste', 'brutalite'],
  elementaliste: ['brutalite', 'flux', 'brutalite', 'moisson', 'precision', 'flux'],
  necromancien: ['peste', 'peste', 'brutalite', 'moisson', 'peste', 'givre'],
  invocateur: ['horde3', 'brutalite', 'guerison', 'horde6', 'horde4', 'chasse'],

  barde: ['chant', 'chant', 'guerison', 'cadence', 'guerison', 'givre'],
  chaman: ['egide', 'guerison', 'seve', 'egide', 'surplus', 'chasse'],
  druide: ['guerison', 'surplus', 'seve', 'seve', 'peste', 'chant'],
  oracle: ['egide', 'carapace', 'guerison', 'chant', 'rempart', 'fortune'],

  faucheur: ['vampirisme', 'moisson', 'sentence', 'brutalite', 'peste', 'sentence'],
  corrupteur: ['peste', 'peste', 'brutalite', 'peste', 'moisson', 'sentence'],
  metamorphe: ['titan', 'cadence', 'carapace', 'brutalite', 'chasse', 'horde3'],
  runemaitre: ['peste', 'flux', 'brutalite', 'givre', 'sentence', 'precision'],
  vibrelame: ['elan', 'brutalite', 'precision', 'cadence', 'givre', 'sentence'],
};

// ---------------------------------------------------------------------
// Application : les effets rejoignent VOIES et EVEILS, et LE TEXTE EST
// RÉÉCRIT à partir d'eux. C'est ici que la promesse et le code se
// rejoignent définitivement.
// ---------------------------------------------------------------------
function effetsDeProfil(cle, cran) {
  const profil = PROFILS_PASSIFS[cle];
  if (!profil) return {};
  return { ...profil[cran] };
}

Object.entries(PROFILS_VOIES).forEach(([idSousClasse, profils]) => {
  const voies = Object.values(VOIES).filter((v) => v.sousClasse === idSousClasse)
    .sort((a, b) => a.rang - b.rang);
  voies.forEach((voie, i) => {
    voie.effets = effetsDeProfil(profils[i], 'voie');
    voie.passif = texteEffetsPassif(voie.effets) || voie.passif;
  });
});

Object.entries(PROFILS_EVEILS).forEach(([idSousClasse, profils]) => {
  const eveils = Object.keys(EVEILS)
    .filter((id) => EVEILS[id].sousClasse === idSousClasse)
    .map((id) => EVEILS[id]);
  // L'ordre de déclaration est celui des raretés : on le retrouve par là.
  eveils.sort((a, b) => ORDRE_EVEIL.indexOf(a.rarete) - ORDRE_EVEIL.indexOf(b.rarete));
  eveils.forEach((eveil, i) => {
    eveil.effets = effetsDeProfil(profils[i], 'eveil');
    eveil.effet = texteEffetsPassif(eveil.effets) || eveil.effet;
  });
});

// Les spécialités reçoivent leurs effets et leur phrase définitive.
Object.entries(PASSIFS_SOUS_CLASSES).forEach(([id, entree]) => {
  const sc = SOUS_CLASSES[id];
  if (!sc) return;
  sc.effets = entree.effets;
  sc.passif = entree.texte;
});

// ---------------------------------------------------------------------
// La lecture : ce que TOUT le moteur interroge. Classe + spécialité +
// Voie + Éveil, empilés selon les règles de cumul, puis bornés.
// ---------------------------------------------------------------------
function passifsDe(p) {
  if (!p) return {};
  // Un héros distant arrive avec ses passifs déjà calculés sur son écran.
  if (p.passifsEff) return p.passifsEff;
  const sources = [];
  if (p.classe && PASSIFS_CLASSES[p.classe]) sources.push(PASSIFS_CLASSES[p.classe]);
  const sc = typeof sousClasseDe === 'function' ? sousClasseDe(p) : null;
  if (sc && sc.effets) sources.push(sc.effets);
  const voie = typeof voieDe === 'function' ? voieDe(p) : null;
  if (voie && voie.effets) sources.push(voie.effets);
  const eveil = typeof eveilDe === 'function' ? eveilDe(p) : null;
  if (eveil && eveil.effets) sources.push(eveil.effets);
  return fusionnerPassifs(sources);
}

function fusionnerPassifs(sources) {
  const total = {};
  CUMUL_PASSIFS.produit.forEach((cle) => { total[cle] = 1; });
  CUMUL_PASSIFS.somme.forEach((cle) => { total[cle] = 0; });

  sources.forEach((src) => {
    CUMUL_PASSIFS.produit.forEach((cle) => { if (src[cle]) total[cle] *= src[cle]; });
    CUMUL_PASSIFS.somme.forEach((cle) => { if (src[cle]) total[cle] += src[cle]; });
    CUMUL_PASSIFS.maximum.forEach((cle) => {
      if (src[cle] != null) total[cle] = Math.max(total[cle] || 0, src[cle]);
    });
    CUMUL_PASSIFS.drapeau.forEach((cle) => { if (src[cle]) total[cle] = true; });
    // Les charges : c'est le plus PETIT palier qui gagne (une frappe sur 4
    // vaut mieux qu'une sur 6).
    if (src.chargesCritique) {
      total.chargesCritique = total.chargesCritique
        ? Math.min(total.chargesCritique, src.chargesCritique) : src.chargesCritique;
    }
    // Les invocations ne s'additionnent JAMAIS : c'est la source la plus
    // généreuse qui décide, et elle décide AUSSI de leur puissance. Sans
    // cette règle, un Invocateur cumulait spécialité + Voie + Éveil et se
    // retrouvait avec une armée — le défaut signalé en jeu.
    if (src.invocations && src.invocations > (total.invocations || 0)) {
      total.invocations = src.invocations;
      total.invocationStats = src.invocationStats == null ? 1 : src.invocationStats;
    }
    // Le bouclier gratuit du Paladin : un seuil, pas un cumul.
    if (src.bouclierGratuit) {
      total.bouclierGratuit = Math.max(total.bouclierGratuit || 0, src.bouclierGratuit);
    }
  });

  Object.entries(PLAFONDS_PASSIFS).forEach(([cle, plafond]) => {
    if (total[cle] != null) total[cle] = Math.min(total[cle], plafond);
  });
  return total;
}

// Le nombre d'invocations qu'un héros peut tenir. UNE par défaut ; le
// reste vient du passif, jamais d'un sort.
function limiteInvocations(p) {
  return Math.max(1, passifsDe(p).invocations || 1);
}

// Le résumé lisible des passifs d'un héros, pour sa fiche.
function textePassifsHeros(p) {
  return texteEffetsPassif(passifsDe(p));
}
