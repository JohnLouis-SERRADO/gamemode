'use strict';

// =====================================================================
// Moteur de combat tour par tour : initiative, tours des joueurs et des
// monstres, dégâts, soins, effets de statut, objets, fuite.
// Genres de combat : exploration, embuscade, boss (de zone), bossMonde.
// =====================================================================

const EMOJI_STATUT = {
  poison: '🧪', etourdi: '💫', bouclier: '🛡️',
  benediction: '🙏', provocation: '😤', regen: '💧', affaibli: '⬇️',
  fortune: '🍀', marque: '🔖', berce: '🎵',
};

const NOM_STATUT = {
  poison: 'Empoisonné', etourdi: 'Étourdi', bouclier: 'Bouclier',
  benediction: 'Bénédiction (+30 % dégâts)', provocation: 'Provocation',
  regen: 'Régénération', affaibli: 'Affaibli (−30 % dégâts)',
  fortune: 'Fortune (+30 % de butin)',
  marque: 'Marqué', berce: 'Bercé',
};

// La marque du Traqueur vaut 12 % à la spécialité, 80 % au sommet des
// Éveils : l'étiquette lit la valeur RÉELLE du statut, jamais un chiffre
// figé — c'est le même contrat que les fiches de passifs.
function libelleStatut(s) {
  if (s.type === 'marque') return `Marqué (+${Math.round((s.valeur || 0.12) * 100)} % de dégâts subis)`;
  if (s.type === 'berce') return `Bercé (−${Math.round((s.valeur || 0.15) * 100)} % de dégâts infligés)`;
  if (s.type === 'bouclier') return `Bouclier (${s.valeur} points)`;
  return NOM_STATUT[s.type] || s.type;
}

// La magie ignore les lignes de combat. Elle se lisait sur la seule
// Intelligence : les 26 sorts offensifs portés par l'Esprit — tout
// l'arsenal du Devin — étaient traités comme des coups PHYSIQUES et
// perdaient 40 % depuis la ligne arrière, sa position par défaut.
function estSortMagique(comp) {
  return !!comp && (comp.stat === 'int' || comp.stat === 'esp');
}

function estMort(c) {
  return c.type === 'joueur' ? c.ko : c.mort;
}

// =====================================================================
// v20.1 — LES PASSIFS DE CLASSE, enfin branchés.
//
// Chaque classe annonce un passif sur sa fiche. Trois d'entre eux ne
// faisaient strictement rien, et un quatrième n'était vrai qu'à moitié :
//
//   • Franc-tireur, « Ligne de tir — aucun malus depuis la ligne arrière ».
//     C'était l'inverse : classe à distance, il commençait à l'arrière et
//     y perdait 40 % de ses dégâts physiques, comme tout le monde. Son
//     passif emblématique le pénalisait.
//   • Guerrier, « Élan — chaque coup porté nourrit le suivant ». Rien.
//   • Arcaniste, « le mana revient plus vite ». Rien.
//   • Devin, « le surplus [de soin] ne se perd pas ». Le surplus était
//     purement et simplement jeté.
//
// Ils sont ici, tous au même endroit, lisibles d'un coup d'œil.
// =====================================================================
// (Attention : `classeDe` existe déjà dans js/data/classes.js et renvoie
// autre chose. On ne réutilise pas son nom — combat.js est chargé après,
// et l'écraser casserait la fiche du héros.)
function classeBaseDuCombattant(c) {
  return (c && c.type === 'joueur' && typeof CLASSES_BASE !== 'undefined'
    && CLASSES_BASE[c.classe]) || null;
}

function aPassif(c, cle) {
  const base = classeBaseDuCombattant(c);
  return !!base && base.passif && base.passif.indexOf(cle) === 0;
}

// Franc-tireur : la ligne arrière est sa position de travail, pas une
// punition. Ses tirs partent à pleine puissance.
function ignoreMalusDeLigne(c) {
  // Le passif de la classe de base, ET le réglage que les spécialités et
  // les Voies de la famille reprennent — il annonçait « aucun malus
  // depuis la ligne arrière » sans que rien ne le lise.
  return aPassif(c, 'Ligne de tir') || reglagePassif(c, 'ignoreLigne', false);
}

// Guerrier : chaque coup porté dans la manche nourrit le suivant. Trois
// paliers, remis à zéro à chaque combat — c'est une montée en pression,
// pas une rente.
const ELAN_PAR_COUP = 0.08;
const ELAN_MAX = 3;

function bonusElan(c) {
  if (!aPassif(c, 'Élan')) return 1;
  return 1 + Math.min(ELAN_MAX, c.elan || 0) * ELAN_PAR_COUP;
}

function nourrirElan(c) {
  if (!aPassif(c, 'Élan')) return;
  const avant = c.elan || 0;
  c.elan = Math.min(ELAN_MAX, avant + 1);
  // Le palier monte : on le dit. Sans ça, le joueur voit ses dégâts
  // grimper de 8 % par coup et l'attribue au hasard des jets.
  if (c.elan > avant) {
    journal(`⚡ Élan : ${c.nom} enchaîne — ses coups gagnent +${Math.round(c.elan * ELAN_PAR_COUP * 100)} %.`);
  }
}

// Gardien : « attirer les coups est une arme ». Son passif annonçait
// autrefois une seconde promesse — « les dégâts subis baissent » — qui ne
// lui appartenait pas : c'était la mécanique générale de Ténacité, dont le
// Guerrier, qui porte la même plaque, profitait exactement autant. Mesuré
// au banc : un Gardien encaissait 103 quand un Arcaniste encaissait 103.
// La Ténacité a disparu du jeu (v21) ; il ne reste donc que la moitié qui
// était vraiment la sienne, celle que personne d'autre ne fait : tant qu'il
// tient les ennemis par la provocation, il frappe plus fort. Tanker devient
// offensif.
//
const BONUS_REMPART = 0.25;

function bonusRempart(c) {
  if (!aPassif(c, 'Rempart')) return 1;
  return c.statuts.some((s) => s.type === 'provocation') ? 1 + BONUS_REMPART : 1;
}

// =====================================================================
// v21.3 — LA RÉSISTANCE REVIENT, MAIS COMME UN MÉTIER.
//
// La Ténacité retranchait des dégâts à TOUT LE MONDE, au prorata de ce
// qu'on avait ramassé : un Guerrier en plaque encaissait exactement autant
// qu'un Gardien, et deux zones voisines opposaient au joueur des dégâts du
// simple au double selon son stuff. C'est pour ça qu'elle a disparu.
//
// Un tank doit quand même encaisser mieux que les autres — sinon le rôle
// ne veut rien dire. La différence tient en un mot : ce n'est plus une
// statistique qu'on ramasse, c'est le métier du Gardien et de lui seul.
// Elle ne dépend d'aucun objet, elle ne dérive donc jamais, et elle ne
// rend pas la difficulté illisible.
//
// Le compte du Gardien, avec cette v21.3 : « un peu moins de dégâts »
// (77 % du meilleur DPS, contre 44 % avant), « beaucoup de points de vie »
// (1,5 fois ceux d'un Guerrier) et « un peu plus de résistance » — ces
// 12 %-là.
// =====================================================================
const RESISTANCE_GARDIEN = 0.12;

function resistanceDeClasse(c) {
  return aPassif(c, 'Rempart') ? 1 - RESISTANCE_GARDIEN : 1;
}

// =====================================================================
// v21.4 — LA PIÉTÉ TIENT ENFIN SA PROMESSE.
//
// Sa fiche annonce « augmente le mana maximum ET SA RÉGÉNÉRATION ». Seule
// la première moitié existait : le regain était un forfait de deux points
// par tour pour tout le monde, cinq pour l'Arcaniste. La statistique du
// soigneur ne lui rendait donc rien de ce qu'il dépense.
//
// Ça se voyait en jeu. Un Devin seul contre un boss tenait cinquante à
// quatre-vingts manches — il survivait, il soignait, il ne mourait pas de
// ses blessures : il mourait à court de mana, réserve à 0 %, incapable de
// se soigner encore une fois. Sa ressource, celle sur laquelle repose tout
// son métier, ne se rechargeait pas.
//
// Le regain suit désormais la Piété, en part de la réserve : c'est ce que
// « régénération » veut dire pour un pool de mana. Le forfait reste le
// plancher, pour ceux qui n'en portent pas.
// =====================================================================
const PART_REGAIN_PIETE = 0.15;

function regainDeMana(c) {
  const base = aPassif(c, 'Flux') ? 5 : 2;   // Arcaniste : le flux, son passif
  if (!c || c.type !== 'joueur') return base;
  const s = statsEffectives(c);
  return base + Math.round((c.maxMp || 0) * sousCarac(s, 'piete') * PART_REGAIN_PIETE);
}

// Runelame : « Gravure — ses sorts lui rendent une part de ce qu'ils
// prennent ». Deux de ses huit compétences portaient un drain explicite ;
// les six autres ne rendaient rien, alors que le passif parle de « ses
// sorts » au pluriel. La classe draine désormais une part de tout ce
// qu'elle inflige.
const PART_GRAVURE = 0.1;

function draineDeGravure(source, degats) {
  if (degats <= 0 || !aPassif(source, 'Gravure')) return;
  drainPassif(source, degats, PART_GRAVURE, '🌑', 'Gravure');
}

// Devin : ce qui déborde d'un soin ne se perd pas — il se fige en bouclier
// sur la cible. Soigner quelqu'un à pleine vie cesse d'être un tour gâché.
//
// v22 : la classe de base en fige la MOITIÉ. L'Oracle, dont c'est le
// passif de spécialité, en fige la totalité (plafonnée) — sans quoi sa
// « Prescience » n'aurait rien apporté de plus que le tronc commun.
const PART_SURPLUS_CLAIRVOYANCE = 0.5;
// Le tronc commun est plafonné comme l'Oracle : sans borne, le Devin de
// base figeait la MOITIÉ d'un surplus illimité pendant que la spécialité
// dont c'est le métier restait bloquée à 20 % des PV de la cible — le
// passif de l'Oracle devenait PIRE que le tronc commun sur un gros soin.
const PLAFOND_SURPLUS_CLAIRVOYANCE = 0.2;

function surplusDeSoin(source, cible, surplus) {
  if (surplus <= 0 || !aPassif(source, 'Clairvoyance')) return;
  let part = PART_SURPLUS_CLAIRVOYANCE;
  let plafondPart = PLAFOND_SURPLUS_CLAIRVOYANCE;
  const partOracle = reglagePassif(source, 'partSurplus', 0);
  if (partOracle > 0) {
    part = partOracle;
    plafondPart = reglagePassif(source, 'plafondSurplus', 1);
  }
  const valeur = Math.min(Math.round(surplus * part), Math.round(cible.maxHp * plafondPart));
  if (valeur <= 0) return;
  const existant = cible.statuts.find((s) => s.type === 'bouclier');
  if (existant) existant.valeur += valeur;
  else cible.statuts.push({ type: 'bouclier', duree: 3, valeur });
  journal(`✨ Le surplus de soin se fige en bouclier sur ${cible.nom} (+${valeur}).`);
}

// =====================================================================
// v22 — LES PASSIFS DE SOUS-CLASSE, CÔTÉ MOTEUR.
//
// Les chiffres vivent dans js/data/passifs.js, avec le texte qu'ils
// produisent. Ici, et seulement ici, se trouve ce qui les applique. Le
// découpage est volontaire : régler un passif ne demande jamais de
// toucher au moteur, et brancher un passif ne demande jamais de
// réécrire sa fiche.
// =====================================================================

// Compteurs remis à zéro à chaque combat : rien de tout ceci n'est une
// rente qu'on traîne d'un combat à l'autre.
function reinitialiserPassifsCombat(j) {
  // Moine — l'Éveil « Disciple » promet des charges qui « ne se perdent
  // jamais » : elles traversent les combats au lieu de repartir de zéro.
  j.chargesCadence = reglagePassif(j, 'chargesPersistantes', false) ? (j.chargesCadence || 0) : 0;
  j.premierCoupFait = false; // Assassin
  j.pasDeDanse = false;      // Danselame
  j.cibleDuel = null;        // Duelliste
  j.manchesDuel = 0;
  j.dernierSort = null;      // Élémentaliste
  j.sortsDuCombat = [];      // Runemaître
  j.secoursUtilise = false;  // Paladin
  j.piegeTendu = false;      // Rôdeur
  j.actionRejouee = false;   // Voltigeur
  j.manchesPropres = 0;      // Voie du Souffle et Éveils « manche propre »
  j.manchesEnSang = 0;       // Voie de la Rage : les manches où il a saigné
  j.cumulDanse = 0;          // Voie du Vent Tranchant
  j.coupsDeLOmbre = 0;       // Voie de l'Ombre
  j.relancesCritique = 0;    // Voies de la Lame Vive et de la Célérité
  j.relanceEnAttente = false;
  j.brisureAFaire = false;   // Voie du Fracas
  j.degatsEncaisses = 0;     // Éveil « Jugement Incarné »
  j.cadavresDevores = 0;     // Éveil « Dévoreur de Mondes »
  j.proieDesignee = null;    // Éveil « Le Contrat »
  j.objetBu = false;         // Éveil « Le Pèlerin Silencieux »
  j.renaissanceUtilisee = false;
  j.ligneChangee = false;
  j.killsDuTour = 0;         // contrainte divine du tir à distance
}

// Le Templier partage son blocage : un allié de la ligne avant encaisse
// moins tant qu'un Templier est debout à ses côtés.
function reductionTemplier(cible) {
  const cb = etat.combat;
  if (!cb || !cible || cible.type !== 'joueur' || cible.ligne === 'arriere') return 1;
  const templier = cb.equipe.find((x) => x !== cible && !estMort(x)
    && reglagePassif(x, 'reductionLigneAvant', 0) > 0);
  return templier ? 1 - reglagePassif(templier, 'reductionLigneAvant', 0) : 1;
}

// L'aura d'un Templier du Serment : ses alliés frappent plus fort, et
// leurs coups lui rendent du mana. Elle vient d'un AUTRE combattant que
// la source — c'est le seul multiplicateur dans ce cas.
function auraDesAllies(source) {
  const cb = etat.combat;
  if (!cb || !source || (source.type !== 'joueur' && source.type !== 'invocation')) return 1;
  const mentor = cb.equipe.find((x) => x !== source && !estMort(x)
    && reglagePassif(x, 'alliesDegats', 0) > 0);
  if (!mentor) return 1;
  const rendu = Math.round(mentor.maxMp * reglagePassif(mentor, 'manaSurDegatsAllies', 0));
  if (rendu > 0) mentor.mp = Math.min(mentor.maxMp, mentor.mp + rendu);
  return 1 + reglagePassif(mentor, 'alliesDegats', 0);
}

// Une cible « entravée » : tout ce qui la ralentit, l'abîme ou la désigne.
function estEntravee(cible) {
  return !!cible && (cible.statuts || [])
    .some((s) => ['poison', 'affaibli', 'etourdi', 'marque', 'berce'].includes(s.type));
}

// Tout ce qui multiplie les dégâts D'UN passif de sous-classe ou de Voie,
// au même endroit. `options.compId` est renseigné quand le coup vient
// d'une compétence, `options.zone` quand elle frappe tout le monde,
// `options.coupIndex` quand elle enchaîne les coups.
function multiplicateurPassifs(source, cible, options) {
  const p = reglagesDuCombattant(source);
  const cb = etat.combat;
  let mult = auraDesAllies(source);

  // v25.1 — LES PASSIFS DE CLASSE DE BASE ENTRENT ICI, EUX AUSSI.
  //
  // Ils étaient appliqués quatre lignes plus haut dans infligerDegats,
  // donc HORS du chiffre remonté à texteDegats : le badge « 🏅 » ne les
  // comptait pas. Un Guerrier voyait ses dégâts monter de 8 % par coup
  // sans un mot — exactement le symptôme du Faucheur, sur le passif que
  // TOUS les Guerriers portent. Trois classes étaient dans ce cas.
  mult *= bonusElan(source);      // Guerrier : chaque coup nourrit le suivant
  mult *= bonusRempart(source);   // Gardien : provoquer, c'est frapper
  // Franc-tireur : « Ligne de tir » annule le −40 % de la ligne arrière.
  // On le compte comme un bonus plutôt que comme une exception silencieuse
  // dans le calcul des lignes : le résultat est le même, mais il se voit.
  if (!options.magique && source.ligne === 'arriere' && ignoreMalusDeLigne(source)) mult /= 0.6;

  if (!p) return mult;

  // Colosse : la masse comme argument.
  if (p.degatsParCentPv) {
    mult *= 1 + Math.min(p.plafondMasse,
      Math.floor((source.maxHp || 0) / 100) * p.degatsParCentPv);
  }
  // Berserker : plus il lui manque de PV, plus il frappe fort.
  if (p.rageMax) {
    mult *= 1 + p.rageMax * (1 - Math.max(0, source.hp) / Math.max(1, source.maxHp));
  }
  // Nécromancien : le champ de bataille travaille pour lui.
  if (p.parMort && cb) {
    const corps = cb.monstres.filter((m) => m.mort).length
      + cb.equipe.filter((x) => x.type !== 'invocation' && x.ko).length;
    mult *= 1 + Math.min(p.plafondCharnier, corps * p.parMort);
  }
  // Rôdeur : les élites et les boss sont son gibier.
  if (p.bonusElite && cible && cible.type === 'monstre' && (cible.boss || cible.miniBoss)) {
    mult *= 1 + p.bonusElite;
  }
  // Givremage : il brise la glace.
  if (p.bonusBrisGlace && cible && cible.statuts.some((s) => s.type === 'etourdi')) {
    mult *= 1 + p.bonusBrisGlace;
    cible.statuts = cible.statuts.filter((s) => s.type !== 'etourdi');
    source.brisureAFaire = true;
    journal(`❄️ ${source.nom} brise le gel de ${cible.nom} — le coup porte double.`);
  }
  // Danselame : le pas de côté nourrit le coup suivant. La Voie du Vent
  // Tranchant, elle, empile les pas jusqu'à son plafond.
  if (p.bonusApresPas && source.pasDeDanse) {
    mult *= 1 + (source.cumulDanse || p.bonusApresPas);
    source.pasDeDanse = false;
    if (!p.cumulPas) source.cumulDanse = 0;
  }
  // Élémentaliste : alterner, jamais marteler.
  if (p.bonusSynergie && options.compId && source.avantDernierSort
    && source.avantDernierSort !== options.compId) {
    mult *= 1 + p.bonusSynergie;
  }
  // Runemaître : la discipline avant la puissance.
  if (p.parRune && options.compId) {
    const variees = (source.sortsDuCombat || []).filter((id) => id !== options.compId).length;
    mult *= 1 + Math.min(p.plafondRunes, variees * p.parRune);
  }

  // ------------------------------------------------------------------
  // v23 — Les multiplicateurs apportés par les Voies.
  // ------------------------------------------------------------------
  // Templier du Zèle : il frappe pour chacun de ceux qu'il couvre.
  if (p.parAllieVivant && cb) {
    const debout = cb.equipe.filter((x) => x.type !== 'invocation' && !estMort(x)).length;
    mult *= 1 + p.parAllieVivant * Math.max(0, debout - 1);
  }
  // Paladin du Croisé : la Vitalité au-delà du seuil devient offensive.
  if (p.partVitalite) {
    const vit = statDe(source, 'vit');
    mult *= 1 + Math.max(0, vit - (p.seuilVitalite || 0)) * p.partVitalite;
  }
  // Moine du Souffle, Traqueur « Celui Qui Attend » : la manche propre paie.
  if (p.parMancheSansDegats) mult *= 1 + (source.manchesPropres || 0) * p.parMancheSansDegats;
  // Berserker de la Rage : chaque manche où il a SAIGNÉ nourrit sa rage —
  // l'inverse exact, remis à zéro dès qu'une manche l'épargne.
  if (p.parMancheEnSang) mult *= 1 + (source.manchesEnSang || 0) * p.parMancheEnSang;
  // Assassin, Traqueur : la proie déjà entamée.
  if (p.partProie && cible && cible.hp <= cible.maxHp * (p.seuilProie || 0)) mult *= 1 + p.partProie;
  if (p.doubleSousSeuil && cible && cible.hp <= cible.maxHp * p.doubleSousSeuil) mult *= 2;
  // Traqueur de la Piste : ce qui est marqué, ralenti ou empoisonné.
  if (p.contreEntravee && estEntravee(cible)) mult *= 1 + p.contreEntravee;
  // Voltigeur de la Distance : la portée est son métier.
  if (p.bonusLigneArriere && source.ligne === 'arriere') mult *= 1 + p.bonusLigneArriere;
  // Voleur de la Fortune : l'or amassé arme sa main.
  if (p.parMilleOr && cb) mult *= 1 + Math.floor((cb.orVole || 0) / 1000) * p.parMilleOr;
  // Corrupteur de la Décomposition : tout ce qui ronge déjà la cible.
  if (p.parStatutCible && cible) {
    const etats = (cible.statuts || []).filter((st) => ['poison', 'etourdi', 'affaibli', 'marque', 'berce'].includes(st.type)).length;
    mult *= 1 + etats * p.parStatutCible;
  }
  // Colosse du Séisme, Élémentaliste Sismique : les zones frappent fort.
  if (p.bonusZone && options.zone) mult *= 1 + p.bonusZone;
  // Vibrelame de la Résonance : la série se renforce elle-même.
  if (p.parCoupSerie && options.coupIndex) mult *= 1 + options.coupIndex * p.parCoupSerie;
  // Assassin de l'Ombre : la fenêtre qui suit une mise à mort.
  if (p.bonusApresAbattu && (source.coupsDeLOmbre || 0) > 0) {
    mult *= 1 + p.bonusApresAbattu;
    source.coupsDeLOmbre--;
  }
  // Moine du Poing de Fer : chaque charge accumulée pèse.
  if (p.degatsParCharge) mult *= 1 + (source.chargesCadence || 0) * p.degatsParCharge;
  // Moine du Calme : la sérénité se paie en puissance.
  if (p.malusDegatsVoie) mult *= 1 - p.malusDegatsVoie;

  // ------------------------------------------------------------------
  // v24 — Ce que les Éveils ajoutent, et ce que leurs contraintes ôtent.
  // ------------------------------------------------------------------
  // Templier « Le Dernier Rempart » : plus la salle est pleine, plus il cogne.
  if (p.parEnnemiPresent && cb) {
    mult *= 1 + cb.monstres.filter((m) => !m.mort).length * p.parEnnemiPresent;
  }
  // Assassin « Égorgeur » : l'ouverture vaut cher.
  if (p.bonusPremierCoup && !source.premierCoupFait) mult *= 1 + p.bonusPremierCoup;
  // Assassin « Le Contrat » : une proie désignée, et elle seule.
  if (p.cibleDesignee && cible && source.proieDesignee === cible.id) mult *= 1 + p.cibleDesignee;
  // Duelliste « Maître du Duel » : en tête à tête, il ne pardonne pas.
  if (p.bonusCibleIsolee && cb && cb.monstres.filter((m) => !m.mort).length === 1) {
    mult *= 1 + p.bonusCibleIsolee;
  }
  // Moine « Le Pèlerin Silencieux » : tant qu'il n'a rien bu.
  if (p.bonusSansObjet && !source.objetBu) mult *= 1 + p.bonusSansObjet;
  // Paladin « Jugement Incarné » : tout ce qu'il a encaissé revient —
  // par tranche PLEINE de 100 PV, comme le Colosse et comme la fiche le dit.
  if (p.frappeDesDegatsRecus) mult *= 1 + Math.floor((source.degatsEncaisses || 0) / 100) * p.frappeDesDegatsRecus;
  // Berserker « Dévoreur de Mondes », Métamorphe « L'Innommé ».
  if (p.parCadavreDevore) mult *= 1 + (source.cadavresDevores || 0) * p.parCadavreDevore;
  // Contrainte : la moitié de ses dégâts, pour un soigneur qui frappe.
  if (p.degatsReduits) mult *= 1 - p.degatsReduits;
  // Voie de la Distance / Éveil caché : les bonus tombent s'il bouge.
  if (p.bonusPerdusSiLigneChangee && source.ligneChangee) return 1;
  return mult;
}

// Le Traqueur marque : sa cible encaisse plus, de la part de tout le monde.
function multiplicateurMarque(cible) {
  const marque = cible && cible.statuts.find((s) => s.type === 'marque');
  return marque ? 1 + (marque.valeur || 0) : 1;
}

// Les deux passifs qui forcent un critique, plutôt que d'en améliorer la
// chance : l'ouverture de l'Assassin et la cadence du Moine.
function critiqueForce(source) {
  const p = reglagesDuCombattant(source);
  if (!p) return false;
  if (p.nom === 'Ouverture' && !source.premierCoupFait) return true;
  if (p.chargesPourCritique && (source.chargesCadence || 0) >= p.chargesPourCritique) return true;
  return false;
}

// Le Duelliste s'accroche à une cible : son critique grimpe manche après
// manche, et repart de zéro dès qu'il en change.
function bonusCritDuel(source, cible, options = {}) {
  const p = reglagesDuCombattant(source);
  if (!p || !p.critParManche || !cible) return 0;
  if (source.cibleDuel !== cible.id) {
    // Seule une attaque DÉLIBÉRÉE change de duel : une bombe, une riposte
    // ou une éclaboussure de zone n'est pas « changer de cible » au sens
    // de la fiche — elle ne remet plus la traque à zéro.
    if (options.zone || options.riposte || options.bombe) return 0;
    source.cibleDuel = cible.id;
    source.manchesDuel = 0;
  }
  return Math.min(p.critMaxDuel, (source.manchesDuel || 0) * p.critParManche);
}

// Tout ce qui se déclenche APRÈS que les dégâts sont posés.
function apresDegatsPassifs(source, cible, degats) {
  const p = reglagesDuCombattant(source);
  if (!p || degats <= 0) return;

  // Chevalier Noir : ses coups lui rendent de la vie.
  if (p.volDeVie) drainPassif(source, degats, p.volDeVie, '🖤', 'Soif');
  // Moine : chaque coup accumule une charge (et la dépense au cinquième).
  if (p.chargesPourCritique) {
    if ((source.chargesCadence || 0) >= p.chargesPourCritique) source.chargesCadence = 0;
    else source.chargesCadence = (source.chargesCadence || 0) + 1;
  }
  // Traqueur : ce qu'il frappe porte sa marque.
  if (p.bonusMarque && cible.type === 'monstre' && !estMort(cible)) {
    const deja = cible.statuts.find((s) => s.type === 'marque');
    if (!deja) journal(`🔖 ${cible.nom} porte la marque de ${source.nom} : +${Math.round(p.bonusMarque * 100)} % de dégâts subis.`);
    poserStatut(cible, { type: 'marque', duree: p.dureeMarque, valeur: p.bonusMarque });
  }
  // Voleur : ses coups font les poches.
  if (p.volParCoup && cible.type === 'monstre') {
    const cb = etat.combat;
    const butin = Math.max(1, Math.round(1 + statDe(source, 'dex') * p.volParCoup));
    if (cb) cb.orVole = (cb.orVole || 0) + butin;
  }
  // Barde : ce qu'il touche perd de sa force de frappe.
  if (p.reductionBerce && !estMort(cible)) {
    poserStatut(cible, { type: 'berce', duree: p.dureeBerce, valeur: p.reductionBerce });
  }
  source.premierCoupFait = true;
}

// Paladin : le premier allié à passer sous son seuil reçoit un bouclier,
// sans qu'il ait rien à faire — une fois par combat, et par Paladin.
function secourirAllieEnPeril(cible) {
  const cb = etat.combat;
  if (!cb || !cible || cible.type !== 'joueur' || estMort(cible)) return;
  cb.equipe.filter((x) => x.type === 'joueur' && !estMort(x) && !x.secoursUtilise
    && reglagePassif(x, 'seuilSecours', 0) > 0).forEach((paladin) => {
    const seuil = reglagePassif(paladin, 'seuilSecours', 0);
    if (cible.hp > cible.maxHp * seuil) return;
    paladin.secoursUtilise = true;
    const valeur = Math.max(1, Math.round(cible.maxHp * reglagePassif(paladin, 'partBouclierSecours', 0)));
    const existant = cible.statuts.find((s) => s.type === 'bouclier');
    if (existant) existant.valeur += valeur;
    else cible.statuts.push({ type: 'bouclier', duree: 3, valeur });
    journal(`⚖️ ${paladin.nom} couvre ${cible.nom} d'urgence : bouclier de ${valeur} points.`);
  });
}

// Voie des Ancêtres, Voie du Renouveau : le premier héros tombé de chaque
// combat se relève. Une seule fois — sinon le combat ne finit jamais.
function releveParVoie(tombe) {
  const cb = etat.combat;
  if (!cb || cb.releveUtilisee) return false;
  const sauveur = cb.equipe.find((x) => x !== tombe && x.type === 'joueur' && !estMort(x)
    && reglagePassif(x, 'resurrection', 0) > 0);
  if (!sauveur) return false;
  cb.releveUtilisee = true;
  const part = reglagePassif(sauveur, 'resurrection', 0);
  tombe.ko = false;
  tombe.hp = Math.max(1, Math.round(tombe.maxHp * part));
  tombe.statuts = [];
  cb.file.push(tombe);
  journal(`🌱 ${sauveur.nom} rappelle ${tombe.nom} : il se relève avec ${tombe.hp} PV.`);
  return true;
}

// Chaman : quand un allié tombe, son esprit reste au combat quelques
// tours. La créature emprunte les caractéristiques du disparu.
function invoquerEspritDuChaman(tombe) {
  const cb = etat.combat;
  if (!cb || tombe.type !== 'joueur') return;
  const chaman = cb.equipe.find((x) => x.type === 'joueur' && !estMort(x)
    && reglagePassif(x, 'dureeEsprit', 0) > 0);
  if (!chaman) return;
  const s = statsEffectives(tombe);
  const stats = {};
  Object.keys(CARACS).forEach((cle) => { stats[cle] = Math.max(1, Math.round((s[cle] || 0) * 0.6)); });
  const maxHp = Math.max(10, Math.round(tombe.maxHp * 0.5));
  const esprit = {
    type: 'invocation',
    invocation: true,
    modele: null,
    maitre: chaman.bid,
    nom: `Esprit de ${tombe.nom}`,
    emoji: '👻',
    avatar: '👻',
    niveau: tombe.niveau,
    stats,
    dex: stats.dex,
    hp: maxHp, maxHp,
    mp: 0, maxMp: 0,
    competences: [],
    cooldowns: {},
    statuts: [],
    toursRestants: reglagePassif(chaman, 'dureeEsprit', 3),
    defense: false,
    ko: false,
    mort: false,
    race: null,
    ligne: tombe.ligne || 'avant',
  };
  cb.equipe.push(esprit);
  cb.file.push(esprit);
  journal(`🌩️ ${chaman.nom} retient l'esprit de ${tombe.nom} : il combattra encore ${esprit.toursRestants} tours.`);
}

// Druide : chaque régénération posée arrose toute l'équipe sur-le-champ.
function seveDuDruide(source) {
  const part = reglagePassif(source, 'partSoinEquipe', 0);
  const cb = etat.combat;
  if (!part || !cb) return;
  // Une régénération de GROUPE posait la sève sur chaque allié : quatre
  // cibles, quatre arrosages — 20 % des PV max de l'équipe au lieu des
  // 5 % annoncés. Une seule sève par sort lancé.
  if (source.seveCeCast) return;
  source.seveCeCast = true;
  let total = 0;
  cb.equipe.filter((x) => !estMort(x) && soinAutorise(x, source)).forEach((x) => {
    const soin = Math.max(1, Math.round(x.maxHp * part));
    const avant = x.hp;
    x.hp = Math.min(x.maxHp, x.hp + soin);
    total += x.hp - avant;
  });
  journal(total > 0
    ? `🐻 La sève de ${source.nom} traverse l'équipe : ${total} PV rendus au total.`
    : `🐻 La sève de ${source.nom} traverse l'équipe — personne n'en avait besoin.`);
}

// =====================================================================
// v25 — UN PASSIF QUI SE TAIT EST UN PASSIF QUI N'EXISTE PAS.
//
// CE QUI N'ALLAIT PAS. Les mécaniques étaient branchées depuis la v22,
// et pourtant un joueur pouvait jouer un Faucheur entier sans jamais voir
// sa Moisson. Deux raisons, et aucune n'était un bug de calcul :
//
//   • Un drain SOIGNE. À pleine vie, il rend zéro — et le code ne
//     journalisait QUE s'il avait rendu quelque chose. Or on entre dans
//     un combat à pleine vie. Le passif se déclenchait, prenait sa part,
//     et ne laissait aucune trace. Huit passifs de soin étaient dans ce cas.
//   • Les multiplicateurs de dégâts (Colosse, Berserker, Nécromancien,
//     Duelliste, Rôdeur…) n'écrivaient RIEN, jamais. Le joueur n'avait
//     aucun moyen de savoir si son +30 % s'appliquait.
//
// LA RÈGLE DE LA v25. Un passif qui se déclenche laisse une trace, même
// quand son effet est plafonné ou nul. Et tout multiplicateur de passif
// s'affiche sur la ligne de dégâts qu'il a modifiée. « Ça ne marche pas »
// devient une question qu'on peut trancher en lisant le journal.
// =====================================================================

// Le drain d'un passif : il prend toujours sa part, et il le dit toujours
// — qu'il reste de la place dans la barre de vie ou non.
function drainPassif(source, degats, part, emoji, nom) {
  if (!part || degats <= 0 || !soinAutorise(source, source)) return;
  const pris = Math.max(1, Math.round(degats * part));
  const avant = source.hp;
  source.hp = Math.min(source.maxHp, source.hp + pris);
  const rendu = source.hp - avant;
  journal(rendu > 0
    ? `${emoji} ${nom} : ${source.nom} reprend ${rendu} PV.`
    : `${emoji} ${nom} : ${pris} PV drainés — ${source.nom} est déjà au maximum.`);
}

// Faucheur : « TOUS ses sorts lui rendent une part de ce qu'ils prennent ».
function moissonDuFaucheur(source, degats) {
  drainPassif(source, degats, reglagePassif(source, 'drainSorts', 0), '⚰️', 'Moisson');
}

// Chevalier Noir : quand la réserve de mana ne suffit plus, il paie en
// sang. Le pacte ne le tue jamais — il le laisse à 1 PV au pire.
function payerSortEnSang(j, cout) {
  const taux = reglagePassif(j, 'sangParMana', 0);
  if (!taux) return false;
  const sang = Math.max(1, Math.round((cout - j.mp) * taux));
  j.mp = 0;
  j.hp = Math.max(1, j.hp - sang);
  journal(`🖤 ${j.nom} n'a plus de mana : il paie ${sang} PV de son propre sang.`);
  return true;
}

// Le mana suffit-il, ou le sang peut-il prendre le relais ?
function peutPayerSort(j, cout) {
  return j.mp >= cout || reglagePassif(j, 'sangParMana', 0) > 0;
}

// Duelliste de la Lame Vive, Voltigeur de la Célérité : un critique rend
// la main, un nombre limité de fois par combat.
function rendreLaMainSurCritique(source) {
  const max = reglagePassif(source, 'actionSurCritique', 0);
  if (!max || (source.relancesCritique || 0) >= max) return;
  source.relancesCritique = (source.relancesCritique || 0) + 1;
  source.relanceEnAttente = true;
}

// Givremage du Fracas : la brisure du gel éclabousse les voisins.
function propagerLaBrisure(source, cible, degats) {
  const cb = etat.combat;
  const part = reglagePassif(source, 'brisureEclabousse', 0);
  if (!cb || !part || !source.brisureAFaire || degats <= 0) return;
  source.brisureAFaire = false;
  cb.monstres.filter((m) => m !== cible && !m.mort).forEach((m) => {
    const r = infligerDegats(source, m, degats * part, { magique: true, eclaboussure: true });
    journal(`❄️ La brisure atteint ${m.nom} : ${texteDegats(r)}`);
    gererMort(m);
  });
}

// Voltigeur : « la Célérité lui rend des actions ». Une relance par
// manche au maximum — sinon la statistique se transformerait en boucle.
function rejouerParVoltige(j) {
  const cb = etat.combat;
  if (!cb || cb.termine || estMort(j)) return false;
  // Le critique qui rend la main passe avant tout le reste.
  if (j.relanceEnAttente) {
    j.relanceEnAttente = false;
    journal(`⚡ Le critique de ${j.nom} lui rend la main !`);
    return true;
  }
  // Éveil « Éclair Immobile » : il agit deux fois par manche, point.
  const parTour = reglagePassif(j, 'actionsParTour', 1);
  if (parTour > 1 && (j.actionsJouees || 1) < parTour) {
    j.actionsJouees = (j.actionsJouees || 1) + 1;
    journal(`⚡ ${j.nom} enchaîne : son Éveil lui offre une action de plus.`);
    return true;
  }
  // Éveil « Souffle du Dragon » : intact, il rejoue.
  if (reglagePassif(j, 'actionSiPropre', false) && !j.actionRejouee && (j.manchesPropres || 0) > 0) {
    j.actionRejouee = true;
    journal(`🐲 ${j.nom} n'a rien encaissé : il repart pour un tour.`);
    return true;
  }
  if (!reglagePassif(j, 'relanceCelerite', false) || j.actionRejouee) return false;
  const chance = sousCarac(statsEffectives(j), 'celerite');
  if (chance <= 0 || Math.random() >= chance) return false;
  j.actionRejouee = true;
  journal(`🤸 ${j.nom} enchaîne : sa Célérité lui rend la main !`);
  return true;
}

// Corrupteur : « ses statuts se propagent en expirant ». Ce qui vient de
// s'éteindre sur une cible se rallume sur une autre, une seule fois.
function propagerStatutsDuCorrupteur(c, expires) {
  const cb = etat.combat;
  if (!cb || c.type !== 'monstre' || !expires.length) return;
  // La clé est DÉDIÉE : allonger la durée de ses états (dureeBonusStatut)
  // n'a jamais promis de les propager — seul le Corrupteur l'annonce.
  const corrupteur = cb.equipe.find((x) => x.type === 'joueur' && !estMort(x)
    && reglagePassif(x, 'propagationExpiration', false));
  if (!corrupteur) return;
  const voisins = cb.monstres.filter((m) => m !== c && !m.mort);
  if (!voisins.length) return;
  // Voie de la Peste : l'état ne saute pas sur UN voisin, il les prend tous.
  const totale = reglagePassif(corrupteur, 'propagationTotale', false);
  expires.filter((st) => ['poison', 'affaibli', 'marque', 'berce'].includes(st.type) && !st.propage)
    .forEach((st) => {
      const receveurs = totale ? voisins : [voisins[alea(0, voisins.length - 1)]];
      receveurs.forEach((voisin) => poserStatut(voisin, { ...st, duree: 2, propage: true }));
      journal(`🦠 Contagion : ${NOM_STATUT[st.type] || st.type} passe de ${c.nom} à ${
        totale ? 'TOUS les autres' : receveurs[0].nom}.`);
    });
}

// Métamorphe en corbeau, Voies rapides : la Célérité gagnée ne se voit
// que dans l'ordre de passage — c'est-à-dire nulle part. On l'annonce.
function annoncerInitiative(j) {
  const corbeau = j.forme === 'corbeau' ? reglagePassif(j, 'initiativeCorbeau', 0) : 0;
  const celerite = reglagePassif(j, 'celeriteBonus', 0);
  if (!corbeau && !celerite) return;
  const bouts = [];
  if (corbeau) bouts.push(`+${Math.round(corbeau * 100)} % d'initiative (corbeau)`);
  if (celerite) bouts.push(`+${celerite} de Célérité`);
  journal(`💨 ${j.nom} prend les devants : ${bouts.join(' et ')}.`);
}

// v23 — Ce qu'une Voie met en place au tout premier tour : les pièges,
// la meute, le bouclier du Bastion, et la double action du Corbeau.
function ouvertureDesVoies(j) {
  const cb = etat.combat;
  if (!cb) return;
  const p = reglagesDuCombattant(j);

  // Rôdeur : un piège de base, trois pour la Voie des Pièges.
  const pieges = p && p.piegesDepart ? p.piegesDepart : (p && p.piegeParDex ? 1 : 0);
  for (let i = 0; i < pieges; i++) {
    j.piegeTendu = false;
    tendrePiegeDuRodeur(j);
  }
  if (!p) return;

  // Templier du Bastion : il couvre la ligne avant avant le premier coup.
  if (p.bouclierLigneAvantDepart) {
    const valeur = Math.max(1, Math.round(j.maxHp * p.bouclierLigneAvantDepart));
    cb.equipe.filter((x) => x !== j && !estMort(x) && x.ligne !== 'arriere').forEach((x) => {
      poserStatut(x, { type: 'bouclier', duree: 99, valeur });
    });
    journal(`🏛️ ${j.nom} dresse le Bastion : la ligne avant part couverte de ${valeur} points.`);
  }

  // Rôdeur de la Meute : trois compagnons entrent avec lui.
  if (p.meuteDepart) {
    for (let i = 0; i < p.meuteDepart; i++) invoquerCompagnonDeVoie(j, p.partMeute || 0.5, i + 1);
  }

  // Métamorphe du Corbeau : il joue deux fois dans la première manche.
  if (p.deuxActionsPremierTour) {
    cb.file.push(j);
    journal(`🐦‍⬛ ${j.nom} fond deux fois sur la mêlée : il rejouera dans la manche.`);
  }
}

// Un compagnon de Voie : une créature simple, sans mana ni compétence,
// qui frappe à une fraction des statistiques de son maître.
function invoquerCompagnonDeVoie(j, part, index) {
  const cb = etat.combat;
  const sm = statsEffectives(j);
  const stats = {};
  Object.keys(CARACS).forEach((cle) => { stats[cle] = Math.max(1, Math.round((sm[cle] || 0) * part)); });
  const maxHp = Math.max(10, Math.round(j.maxHp * part));
  const compagnon = {
    type: 'invocation', invocation: true, modele: null, maitre: j.bid,
    nom: `Compagnon ${index} de ${j.nom}`, emoji: '🐺', avatar: '🐺',
    niveau: j.niveau, stats, dex: stats.dex,
    hp: maxHp, maxHp, mp: 0, maxMp: 0,
    competences: [], cooldowns: {}, statuts: [],
    defense: false, ko: false, mort: false, race: null, ligne: 'avant',
  };
  cb.equipe.push(compagnon);
  cb.file.push(compagnon);
  journal(`🐺 ${compagnon.nom} entre dans le combat aux côtés de son maître.`);
}

// Rôdeur : le piège tendu au premier tour de chaque combat.
function tendrePiegeDuRodeur(j) {
  const p = reglagesDuCombattant(j);
  const cb = etat.combat;
  if (!p || !p.piegeParDex || j.piegeTendu || !cb) return;
  const proies = cb.monstres.filter((m) => !m.mort);
  if (!proies.length) return;
  j.piegeTendu = true;
  const proie = proies[alea(0, proies.length - 1)];
  const valeur = Math.max(1, Math.round(3 + statDe(j, 'dex') * p.piegeParDex));
  poserStatut(proie, { type: 'poison', duree: 3, valeur });
  journal(`🪤 Le piège de ${j.nom} se referme sur ${proie.nom} (${valeur} dégâts par tour).`);
}

// =====================================================================
// v23 — CE QUE LES VOIES AJOUTENT AU MOMENT DU COUP.
//
// Deux moments, deux fonctions : ce que la Voie de CELUI QUI FRAPPE
// déclenche, et ce que la Voie de CELUI QUI ENCAISSE déclenche.
// =====================================================================

// Oracle de la Vision : l'équipe évite une part des coups reçus.
function esquiveDeLEquipe(source, cible) {
  const cb = etat.combat;
  if (!cb || source.type !== 'monstre' || cible.type === 'monstre') return false;
  const oracle = cb.equipe.find((x) => !estMort(x) && reglagePassif(x, 'esquiveEquipe', 0) > 0);
  return !!oracle && Math.random() < reglagePassif(oracle, 'esquiveEquipe', 0);
}

// Les états qu'une Voie sème au hasard. On tire dans ce qui existe
// vraiment, jamais dans une liste inventée pour la fiche.
const STATUTS_AU_HASARD = ['poison', 'affaibli', 'etourdi'];

function semerUnStatut(source, cible, duree) {
  if (!cible || estMort(cible)) return;
  const type = STATUTS_AU_HASARD[alea(0, STATUTS_AU_HASARD.length - 1)];
  const effet = { type, duree: duree || 2 };
  if (type === 'poison') effet.stat = (classeBaseDuCombattant(source) || {}).stat || 'dex';
  if (type === 'etourdi') effet.chance = 1;
  appliquerEffet(source, cible, effet, null, null);
}

// Côté FRAPPEUR : tout ce qu'une Voie déclenche sur un coup porté.
function apresDegatsVoies(source, cible, degats, options) {
  const p = reglagesDuCombattant(source);
  if (!p || degats <= 0) return;
  const cb = etat.combat;

  // Faucheur du Drain : il prend aussi le mana.
  if (p.volDeMana) {
    const rendu = Math.max(1, Math.round(degats * p.volDeMana));
    source.mp = Math.min(source.maxMp, source.mp + rendu);
  }
  // Paladin de la Lumière : ce qu'il détruit, l'équipe le récupère.
  if (p.degatsEnSoinEquipe && cb) {
    const soin = Math.max(1, Math.round(degats * p.degatsEnSoinEquipe));
    let total = 0;
    cb.equipe.filter((x) => !estMort(x) && soinAutorise(x, source)).forEach((x) => {
      const avant = x.hp;
      x.hp = Math.min(x.maxHp, x.hp + soin);
      total += x.hp - avant;
    });
    journal(total > 0
      ? `🌅 La lumière de ${source.nom} rend ${total} PV à l'équipe.`
      : `🌅 La lumière de ${source.nom} passe sur une équipe déjà au maximum.`);
  }
  // Métamorphe du Serpent, Rôdeur du Poison : le coup empoisonne.
  if (p.poisonParCoup && !estMort(cible)) {
    appliquerEffet(source, cible, { type: 'poison', duree: p.poisonParCoup, stat: (classeBaseDuCombattant(source) || {}).stat || 'dex' }, null, null);
  }
  // Voleur de la Ruse : un état au hasard, de temps en temps.
  if (p.statutAleatoireCoup && Math.random() < p.statutAleatoireCoup) semerUnStatut(source, cible, 2);
  propagerLaBrisure(source, cible, degats);
  // Voleur du Détrousseur : la fouille en plein combat.
  if (p.volObjet && cible.type === 'monstre' && cb && Math.random() < p.volObjet) {
    const butin = Math.max(5, Math.round((cible.niveau || 1) * 8));
    cb.orVole = (cb.orVole || 0) + butin;
    journal(`💎 ${source.nom} détrousse ${cible.nom} : +${formatNombre(butin)} po au butin !`);
  }
}

// Côté ENCAISSEUR : ce que la Voie de la cible renvoie à l'expéditeur.
function encaisserSelonLesVoies(source, cible, degats, options) {
  const cb = etat.combat;
  if (!cb || degats <= 0 || options.riposte) return;
  // Toute manche « propre » s'arrête ici : la cible vient d'encaisser —
  // et le drapeau retient le coup jusqu'au début de la manche SUIVANTE,
  // sinon un coup reçu après son tour était effacé par l'incrément.
  if (cible.type === 'joueur') {
    cible.manchesPropres = 0;
    cible.toucheCetteManche = true;
  }

  const p = reglagesDuCombattant(cible);
  if (!p || estMort(cible)) return;

  // Templier du Bastion : chaque coup qu'il prend soigne les siens.
  if (p.soinParCoupEncaisse) {
    const soin = Math.max(1, Math.round(cible.maxHp * p.soinParCoupEncaisse));
    let total = 0;
    cb.equipe.filter((x) => x !== cible && !estMort(x) && soinAutorise(x, cible)).forEach((x) => {
      const avant = x.hp;
      x.hp = Math.min(x.maxHp, x.hp + soin);
      total += x.hp - avant;
    });
    journal(total > 0
      ? `🏛️ Le Bastion tient : ${total} PV rendus à l'équipe.`
      : `🏛️ Le Bastion tient : l'équipe est déjà au maximum.`);
  }
  // Chevalier Noir du Linceul : on ne le touche pas impunément.
  if (p.statutAleatoireRiposte && source.type === 'monstre'
    && Math.random() < p.statutAleatoireRiposte) {
    semerUnStatut(cible, source, 2);
  }
  // Danselame du Miroir, Duelliste du Contre : la riposte.
  if (p.riposte && source.type === 'monstre' && !estMort(source)) {
    const s = statsEffectives(cible);
    const brut = degatsAttaqueDeBase(cible, s) * p.riposte;
    const r = infligerDegats(cible, source, brut, { riposte: true, critBonus: p.riposteCritique ? 1 : 0 });
    journal(`🤺 ${cible.nom} riposte sur ${source.nom} : ${texteDegats(r)}`);
    gererMort(source);
  }
}

// =====================================================================
// v24 — LES MÉCANIQUES D'ÉVEIL, CÔTÉ MOTEUR.
// =====================================================================

// Éveils « Porte-Peste », « La Grande Peste » : un état saute tout seul
// sur un voisin, sans attendre d'expirer.
function propagerSpontanement(c) {
  const cb = etat.combat;
  if (!cb || c.type !== 'joueur') return;
  const chance = reglagePassif(c, 'propagationAuto', 0);
  if (!chance || Math.random() >= chance) return;
  const porteurs = cb.monstres.filter((m) => !m.mort
    && (m.statuts || []).some((st) => ETATS_NUISIBLES.includes(st.type)));
  const voisins = cb.monstres.filter((m) => !m.mort && !porteurs.includes(m));
  if (!porteurs.length || !voisins.length) return;
  const source = porteurs[alea(0, porteurs.length - 1)];
  const cible = voisins[alea(0, voisins.length - 1)];
  const st = source.statuts.find((x) => ETATS_NUISIBLES.includes(x.type));
  poserStatut(cible, { ...st, duree: Math.max(2, st.duree) });
  journal(`☣️ La peste de ${c.nom} passe de ${source.nom} à ${cible.nom}.`);
}

// Templier « Muraille Vivante » : tant qu'il est debout, l'équipe l'est.
function sanctuaireActif(cible) {
  const cb = etat.combat;
  if (!cb) return false;
  return cb.equipe.some((x) => x !== cible && !estMort(x) && reglagePassif(x, 'sanctuaire', false));
}

// Un coup peut être partagé (Bastion Sacré) ou détourné vers un seul
// porteur (Le Puits). Renvoie ce qui reste pour la cible d'origine.
function repartirLeCoup(source, cible, degats) {
  const cb = etat.combat;
  if (!cb || cible.type !== 'joueur' || degats <= 1) return degats;

  // Chevalier Noir « Le Puits » : il prend le coup à leur place, et s'en nourrit.
  const puits = cb.equipe.find((x) => x !== cible && !estMort(x)
    && reglagePassif(x, 'transfertDegatsEquipe', 0) > 0);
  if (puits) {
    const part = reglagePassif(puits, 'transfertDegatsEquipe', 0);
    const detourne = Math.round(degats * part);
    if (detourne > 0) {
      puits.hp = Math.max(1, puits.hp - Math.round(detourne * 0.5));
      if (soinAutorise(puits, puits)) {
        const rendu = Math.max(1, Math.round(detourne * reglagePassif(puits, 'volDeVie', 0.2)));
        puits.hp = Math.min(puits.maxHp, puits.hp + rendu);
      }
      journal(`🕳️ Le Puits absorbe ${detourne} des dégâts destinés à ${cible.nom}.`);
      return degats - detourne;
    }
  }

  // Templier « Bastion Sacré » : la douleur se répartit sur toute l'équipe.
  const bastion = cb.equipe.find((x) => !estMort(x) && reglagePassif(x, 'partageDegatsEquipe', 0) > 0);
  if (!bastion) return degats;
  const part = reglagePassif(bastion, 'partageDegatsEquipe', 0);
  const autres = cb.equipe.filter((x) => x !== cible && !estMort(x));
  if (!autres.length) return degats;
  const partage = Math.round(degats * part);
  const parTete = Math.max(1, Math.round(partage / autres.length));
  autres.forEach((x) => { x.hp = Math.max(1, x.hp - parTete); });
  return degats - partage;
}

// Ce que les Éveils mettent en place au premier tour d'un combat.
function ouvertureDesEveils(j) {
  const cb = etat.combat;
  const p = reglagesDuCombattant(j);
  if (!cb || !p) return;

  // Templier « Gardien de Fer » : l'équipe entre couverte.
  if (p.bouclierEquipeDepart) {
    cb.equipe.filter((x) => !estMort(x)).forEach((x) => {
      poserStatut(x, { type: 'bouclier', duree: 99, valeur: Math.max(1, Math.round(x.maxHp * p.bouclierEquipeDepart)) });
    });
    journal(`🛡️ ${j.nom} couvre toute l'équipe avant le premier coup.`);
  }
  // Assassin « Le Contrat » : la proie est désignée.
  if (p.cibleDesignee) {
    const proie = cb.monstres.find((m) => !m.mort);
    if (proie) {
      j.proieDesignee = proie.id;
      journal(`🎯 ${j.nom} désigne ${proie.nom} : le contrat est signé.`);
    }
  }
  // Rôdeur « La Grande Chasse » : tout le terrain porte sa marque.
  if (p.marqueTerrain) {
    cb.monstres.filter((m) => !m.mort).forEach((m) => {
      poserStatut(m, { type: 'marque', duree: p.dureeMarque || 9, valeur: p.bonusMarque || 0.2 });
    });
    journal(`🔖 ${j.nom} marque le terrain entier.`);
  }
  // Givremage « Long Hiver » : ils commencent déjà pris dans la glace.
  if (p.ennemisEntravesDepart) {
    cb.monstres.filter((m) => !m.mort).forEach((m) => {
      poserStatut(m, { type: 'etourdi', duree: 1, source: j.nom });
    });
    journal(`❄️ L'hiver de ${j.nom} tombe sur le terrain : tout est pris.`);
  }
  // Givremage « Souverain d'Hiver » : ils traînent la patte tout le combat.
  if (p.celeriteEnnemis) {
    // La Célérité vaut « +1 % d'initiative par point » chez les héros : la
    // retirer aux monstres suit la même unité, au lieu d'un troc de Dextérité.
    cb.monstres.forEach((m) => { m.malusCelerite = (m.malusCelerite || 0) + p.celeriteEnnemis; });
    journal(`🌨️ Le froid de ${j.nom} ralentit tout ce qui bouge en face.`);
  }
}

// Barde « Chef d'Orchestre », Templier « Aegis de Valciel » : une manche
// sur N, l'équipe traverse tout sans une égratignure.
function mancheInvulnerable(cible) {
  const cb = etat.combat;
  if (!cb || cible.type !== 'joueur') return false;
  const porteur = cb.equipe.find((x) => !estMort(x) && reglagePassif(x, 'invulnerabilitePeriodique', 0) > 0);
  if (!porteur) return false;
  const periode = reglagePassif(porteur, 'invulnerabilitePeriodique', 0);
  return cb.manche > 0 && cb.manche % periode === 0;
}

// Berserker « Dévoreur de Mondes » : chaque cadavre le nourrit.
function devorerLeCadavre(source) {
  const max = reglagePassif(source, 'maxCadavres', 0);
  if (!reglagePassif(source, 'parCadavreDevore', 0)) return;
  if ((source.cadavresDevores || 0) >= max) return;
  source.cadavresDevores = (source.cadavresDevores || 0) + 1;
  journal(`🍖 ${source.nom} dévore la dépouille : ${source.cadavresDevores}/${max}.`);
}

// Danselame des Pétales, Chaman de la Foudre : le coup ne s'arrête pas à
// la cible visée — il éclabousse ses voisines.
function eclabousserSelonLaVoie(source, cible, degats, comp) {
  const cb = etat.combat;
  const nb = reglagePassif(source, 'ciblesSupp', 0);
  if (!cb || !nb || degats <= 0 || comp.cible === 'ennemis') return;
  const part = reglagePassif(source, 'partCiblesSupp', 0.45);
  cb.monstres.filter((m) => m !== cible && !m.mort).slice(0, nb).forEach((m) => {
    const r = infligerDegats(source, m, degats * part, { magique: estSortMagique(comp), eclaboussure: true });
    journal(`🌸 L'onde atteint ${m.nom} : ${texteDegats(r)}`);
    gererMort(m);
  });
}

// v25.2 — L'EXÉCUTION NE REGARDAIT QUE LES SORTS.
//
// La fiche dit « il exécute sur place TOUTE CIBLE LAISSÉE sous 15 % de
// ses PV ». Elle ne dit pas « toute cible qu'il touche d'un sort ». Or
// executerSiMoribonde() n'était appelé que depuis lancerCompetence() :
// une attaque simple qui laissait un monstre à 14 % le laissait vivre, et
// une éclaboussure ou une riposte non plus. Le joueur voyait donc son
// exécution marcher une fois sur deux, sans comprendre la règle.
//
// Le balayage de fin de tour ferme la question pour de bon : quoi qu'il
// ait fait de son tour — sort, attaque, riposte, onde de choc — ce qui
// reste debout sous le seuil tombe. Un seul endroit à tenir, et aucun
// chemin de dégâts ne peut plus être oublié.
function acheverLesMoribonds(j) {
  const cb = etat.combat;
  if (!cb || cb.termine || estMort(j)) return;
  if (!reglagePassif(j, 'seuilExecution', 0)) return;
  cb.monstres.filter((m) => !m.mort).forEach((m) => executerSiMoribonde(j, m));
}

// Faucheur : l'exécution. Une cible laissée sous son seuil ne se relève
// pas — c'est le second membre de son passif, celui qui ne marchait pas.
function executerSiMoribonde(source, cible) {
  const seuil = reglagePassif(source, 'seuilExecution', 0);
  if (!seuil || !cible || estMort(cible) || cible.type !== 'monstre') return;
  if (cible.hp <= 0 || cible.hp > cible.maxHp * seuil) return;
  // Contrainte divine du tir : l'exécution passive compte comme une mise
  // à mort — elle ne contourne pas « un seul ennemi abattu par manche ».
  if (reglagePassif(source, 'unKillParTour', false) && (source.killsDuTour || 0) >= 1) return;
  journal(`⚰️ ${source.nom} exécute ${cible.nom} : sous ${Math.round(seuil * 100)} % de vie, on ne se relève pas.`);
  cible.hp = 0;
  gererMort(cible);
}

// Ce qui se déclenche quand un ennemi tombe.
function passifsSurMortEnnemi(source, cible) {
  const p = reglagesDuCombattant(source);
  if (!p) return;
  // Berserker : tuer le soigne.
  if (p.soinParMise && soinAutorise(source, source)) {
    const pris = Math.max(1, Math.round(source.maxHp * p.soinParMise));
    const avant = source.hp;
    source.hp = Math.min(source.maxHp, source.hp + pris);
    journal(source.hp > avant
      ? `🪓 Rage : la mise à mort rend ${source.hp - avant} PV à ${source.nom}.`
      : `🪓 Rage : la mise à mort vaut ${pris} PV — ${source.nom} est déjà au maximum.`);
  }
  // Assassin de l'Ombre : la fenêtre ouverte par une mise à mort.
  if (p.bonusApresAbattu) source.coupsDeLOmbre = p.dureeApresAbattu || 2;
  devorerLeCadavre(source);
  source.killsDuTour = (source.killsDuTour || 0) + 1;
  // Voie des Cendres : ce qu'il abat explose, brûlé ou non.
  if (p.explosionPvMax) {
    const cb2 = etat.combat;
    const degats = Math.max(1, Math.round(cible.maxHp * p.explosionPvMax));
    const autres = cb2 ? cb2.monstres.filter((m) => !m.mort) : [];
    if (autres.length) {
      journal(`💥 ${cible.nom} explose en tombant (${degats} dégâts) !`);
      autres.forEach((m) => {
        m.hp -= degats;
        journal(`→ ${m.nom} est soufflé : ${degats} dégâts.`);
        gererMort(m);
      });
    }
  }
  // Traqueur de la Marque : la marque saute sur un survivant.
  if (p.marquePropagation && (cible.statuts || []).some((st) => st.type === 'marque')) {
    const cb2 = etat.combat;
    const survivants = cb2 ? cb2.monstres.filter((m) => !m.mort) : [];
    if (survivants.length) {
      const suivant = survivants[alea(0, survivants.length - 1)];
      poserStatut(suivant, { type: 'marque', duree: p.dureeMarque || 3, valeur: p.bonusMarque || 0.12 });
      journal(`🔖 La marque quitte ${cible.nom} et se pose sur ${suivant.nom}.`);
    }
  }
  // Pyromancien : mourir en brûlant, c'est exploser.
  if (p.partExplosion) {
    const brulure = cible.statuts.find((s) => s.type === 'poison');
    if (!brulure) return;
    const cb = etat.combat;
    const degats = Math.max(1, Math.round(brulure.valeur * p.partExplosion));
    const autres = cb ? cb.monstres.filter((m) => m !== cible && !m.mort) : [];
    if (!autres.length) return;
    journal(`🔥 ${cible.nom} meurt en brûlant : la dépouille explose (${degats} dégâts) !`);
    autres.forEach((m) => {
      m.hp -= degats;
      journal(`→ ${m.nom} est soufflé : ${degats} dégâts.`);
      gererMort(m);
    });
  }
}

// v16.3 : chacun combat à PLEINE puissance, en solo comme en groupe —
// le nivelage de la v16 est retiré, sur demande générale.
function statDe(source, cle) {
  if (source.type === 'joueur') return statsEffectives(source)[cle] || 0;
  if (source.type === 'invocation') return source.stats[cle] || 0;
  return 0;
}

// =====================================================================
// v20.1 — La ligne de combat vient du RÔLE, pas de la caractéristique.
//
// L'ancienne règle disait « Intelligence dominante → ligne arrière ». Elle
// se trompait sur deux cas, et pas des moindres :
//
//   • le Runelame est un DPS de MÊLÉE dont les sorts portent sur
//     l'Intelligence. Il partait donc se battre de loin — là où les coups
//     physiques perdent 40 %, donnés comme reçus. Un bretteur qui commence
//     le combat au fond de la salle.
//   • une invocation hérite d'une part des caractéristiques de son maître.
//     Le Golem de basalte — 0,9 de PV, Vitalité pleine, Provocation dans
//     ses sorts, autrement dit un mur — invoqué par un Arcaniste héritait
//     d'assez d'Intelligence pour basculer à l'arrière. Le tank de pierre
//     allait se cacher pendant que son maître prenait les coups.
//
// Chaque classe et chaque invocation déclare désormais sa ligne. La
// déduction par les caractéristiques ne sert plus que de filet pour les
// vieux héros sans classe.
// =====================================================================
function ligneParDefaut(c) {
  if (c.type === 'invocation') {
    const modele = INVOCATIONS[c.modele];
    if (modele && modele.ligne) return modele.ligne;
    return (c.stats && (c.stats.int || 0) > (c.stats.for || 0)) ? 'arriere' : 'avant';
  }
  const base = typeof CLASSES_BASE !== 'undefined' && CLASSES_BASE[c.classe];
  if (base && base.ligne) return base.ligne;
  const s = statsEffectives(c);
  return (s.int || 0) > (s.for || 0) && (s.int || 0) > (s.dex || 0) ? 'arriere' : 'avant';
}

// v19 : l'initiative se lit sur la Dextérité, à laquelle la Célérité
// ajoute son bonus — c'est elle qui décide qui frappe en premier.
function initiativeDe(c) {
  if (c.type === 'monstre') {
    return Math.round(((c.dex || 0) * 2 + alea(1, 10))
      * (1 - Math.min(80, c.malusCelerite || 0) / 100));
  }
  const base = statDe(c, 'dex') * 2 + alea(1, 10);
  if (c.type !== 'joueur') return base;
  // Métamorphe : sous la forme de corbeau, il part toujours devant.
  const partCorbeau = reglagePassif(c, 'initiativeCorbeau', 0);
  const cumulFormes = reglagePassif(c, 'formesCumulees', 0);
  const corbeau = c.forme === 'corbeau' ? partCorbeau : partCorbeau * cumulFormes;
  // Voies rapides : la Célérité qu'elles offrent s'ajoute à celle du stuff.
  // Le Moine du Souffle, lui, la gagne manche après manche sans encaisser.
  const celeriteVoie = (reglagePassif(c, 'celeriteBonus', 0)
    + reglagePassif(c, 'celeriteParManche', 0) * (c.manchesPropres || 0)) / 100;
  let init = base * (1 + sousCarac(statsEffectives(c), 'celerite') + celeriteVoie) * (1 + corbeau);
  // Franc-tireur : « l'initiative lui revient souvent » — la seconde
  // moitié de son passif de classe, restée sur la fiche sans une ligne
  // de code depuis la v19.
  if (aPassif(c, 'Ligne de tir')) init *= 1.15;
  // Colosse de la Montagne : immobile, donc toujours en dernier.
  if (reglagePassif(c, 'initiativeMoitie', false)) init *= 0.5;
  // Contrainte divine du soigneur : il n'ouvre jamais la manche.
  if (reglagePassif(c, 'jamaisEnPremier', false)) return -1;
  return Math.round(init);
}

function tirageAuPoids(liste) {
  const total = liste.reduce((s, x) => s + x.poids, 0);
  let r = Math.random() * total;
  for (const x of liste) {
    r -= x.poids;
    if (r <= 0) return x;
  }
  return liste[liste.length - 1];
}

function creerMonstreCombat(def, id, nom) {
  return {
    type: 'monstre',
    id,
    cle: def.cle || null,
    nom: nom || def.nom,
    emoji: def.emoji,
    niveau: def.niveau,
    atk: def.atk,
    dex: def.dex,
    xp: def.xp,
    po: def.po,
    drops: def.drops,
    attaques: def.attaques,
    boss: !!def.boss,
    miniBoss: !!def.miniBoss,
    mecaniques: def.mecaniques || null,
    phaseIndex: 0,
    enrageActif: false,
    invoque: !!def.invoque,
    maxHp: def.hp,
    hp: def.hp,
    statuts: [],
    defense: false,
    mort: false,
  };
}

// =====================================================================
// Mécaniques de boss : phases, invocations d'alliés, enrage
// =====================================================================
function invoquerMonstresCombat(cb, cles) {
  const noms = {};
  cb.monstres.forEach((m) => { noms[m.nom] = true; });
  cles.forEach((cle) => {
    const source = (typeof MONSTRES_DONJONS !== 'undefined' && MONSTRES_DONJONS[cle]) || MONSTRES[cle];
    if (!source) return;
    let nom = source.nom;
    for (let n = 2; noms[nom]; n++) nom = `${source.nom} ${n}`;
    noms[nom] = true;
    const monstre = creerMonstreCombat({ ...source, cle, invoque: true }, `m${cb.monstres.length}`, nom);
    cb.monstres.push(monstre);
    journal(`⚔️ ${monstre.emoji} ${monstre.nom} rejoint le combat !`);
  });
}

// Transitions de phase : dès qu'un boss passe sous un seuil de PV.
// Appelée après chaque action (via verifierFin), le point de passage
// obligé de toutes les mutations de PV.
function traiterPhasesBoss(cb) {
  cb.monstres.filter((m) => !m.mort && m.mecaniques && m.mecaniques.phases).forEach((m) => {
    let phase = m.mecaniques.phases[m.phaseIndex];
    while (phase && m.hp <= m.maxHp * phase.seuil) {
      m.phaseIndex++;
      journal(phase.annonce);
      if (phase.atkMult) m.atk = Math.round(m.atk * phase.atkMult);
      if (phase.attaques) m.attaques = phase.attaques;
      if (phase.bouclier) {
        poserStatut(m, { type: 'bouclier', duree: 4, valeur: phase.bouclier });
        journal(`🛡️ ${m.nom} se couvre d'une carapace (${phase.bouclier} points) !`);
      }
      if (phase.invoque) invoquerMonstresCombat(cb, phase.invoque);
      phase = m.mecaniques.phases[m.phaseIndex];
    }
  });
}

// Effets de début de manche : enrage et invocations périodiques.
function traiterMecaniquesManche(cb) {
  cb.monstres.filter((m) => !m.mort && m.mecaniques).forEach((m) => {
    const mec = m.mecaniques;
    if (mec.enrage && !m.enrageActif && cb.manche >= mec.enrage.manche) {
      m.enrageActif = true;
      m.atk = Math.round(m.atk * mec.enrage.atkMult);
      journal(mec.enrage.annonce);
    }
    if (mec.invocations && cb.manche > 1 && (cb.manche - 1) % mec.invocations.toutesLes === 0) {
      const vivants = cb.monstres.filter((x) => x.invoque && !x.mort).length;
      const places = Math.max(0, (mec.invocations.max || 99) - vivants);
      const cles = mec.invocations.monstres.slice(0, places);
      if (cles.length > 0) {
        journal(mec.invocations.annonce);
        invoquerMonstresCombat(cb, cles);
      }
    }
  });
}

// =====================================================================
// Lancement d'un combat
// =====================================================================
function demarrerCombat(options) {
  const equipe = options.equipe && options.equipe.length ? options.equipe : membresEquipe();
  equipe.forEach((j) => {
    bornerVie(j);
    j.statuts = [];
    j.cooldowns = {};
    j.defense = false;
    j.ko = false;
    j.ligne = ligneParDefaut(j); // v16 : chacun rejoint sa ligne naturelle
    if (j.hp <= 0) j.hp = 1;
  });

  const compteurs = {};
  options.monstresDef.forEach((def) => { compteurs[def.nom] = (compteurs[def.nom] || 0) + 1; });
  const vus = {};
  const monstres = options.monstresDef.map((def, i) => {
    vus[def.nom] = (vus[def.nom] || 0) + 1;
    return creerMonstreCombat(def, `m${i}`,
      compteurs[def.nom] > 1 ? `${def.nom} ${vus[def.nom]}` : def.nom);
  });

  // Identifiant de combat stable pour chaque héros (id cloud en groupe en ligne)
  equipe.forEach((j) => {
    j.bid = j.bid || (j.cloud && j.cloud.id) || j.id;
    j.neufViesUtilisees = false; // le passif félin se recharge à chaque combat
    j.elan = 0;                  // « Élan » : la pression se rebâtit à chaque combat
    reinitialiserPassifsCombat(j); // et tous les compteurs de sous-classe avec
  });

  etat.combat = {
    genre: options.genre,
    zone: options.zone || null,
    difficulte: options.difficulte || 'normal',
    tourEtage: options.tourEtage || null,
    equipe,
    monstres,
    lootRecolte: options.lootRecolte || null,
    filiereRecolte: options.filiereRecolte || null,
    manchesMax: options.manchesMax || null,
    manche: 0,
    file: [],
    actif: null,
    termine: false,
    cibleEnAttente: null,
    finTour: null,
    modeActions: null,
    journalLignes: [],
    degatsBossMonde: 0,
    groupe: options.groupe || null,
    groupeExtra: options.groupeExtra || null,
    donjon: options.donjon || null,
    ascension: options.ascension || false,
    enAttenteDe: null,
    consosDistantes: options.groupe ? {} : null,
  };

  const titres = {
    exploration: () => `${options.zone.emoji} ${options.zone.nom}`,
    embuscade: () => `⚠️ Embuscade — ${options.zone.nom}`,
    chasse: () => `🔪 Battue — ${options.zone.nom}`,
    boss: () => `👑 ${monstres[0].nom} — ${options.zone.nom}`,
    bossMonde: () => `🌍 ${monstres[0].nom} — assaut du monde`,
    tour: () => `🗼 Tour Sans Fin — Étage ${options.tourEtage}`,
  };
  const difficulte = DIFFICULTES[etat.combat.difficulte];
  const suffixe = difficulte && etat.combat.difficulte !== 'normal' ? ` · ${difficulte.emoji} ${difficulte.nom}` : '';
  el('combat-titre').textContent = (options.titre
    || (titres[options.genre] ? titres[options.genre]() : 'Combat')) + suffixe;
  el('combat-manche').textContent = '';
  el('zone-actions').innerHTML = '';

  const intros = {
    exploration: 'Des créatures hostiles surgissent !',
    embuscade: 'On vous tombe dessus en pleine récolte !',
    chasse: 'Vous levez le gibier de la carte : la battue est engagée !',
    boss: 'Le maître des lieux se dresse devant vous…',
    bossMonde: `Vous avez ${options.manchesMax || 6} manches pour infliger un maximum de dégâts !`,
  };
  journal(`⚔️ ${options.intro || intros[options.genre] || 'Le combat commence !'}`);
  montrerEcran('ecran-combat');
  rendreCombat();
  if (etat.combat.groupe && etat.combat.groupe.hote) publierEtatGroupe(etat.combat);
  boucleTour();
}

// =====================================================================
// Boucle de tours
// =====================================================================
async function boucleTour() {
  const cb = etat.combat;
  while (!cb.termine) {
    if (cb.file.length === 0) {
      cb.manche++;
      if (cb.manchesMax && cb.manche > cb.manchesMax) {
        cb.termine = true;
        cb.actif = null;
        journal(`⏳ ${cb.monstres[0].nom} se lasse du combat et s'éloigne dans un fracas !`);
        dissiperInvocations(cb);
        rendreCombat();
        setTimeout(() => apresBossMonde(cb), 1300);
        break;
      }
      cb.file = [...cb.equipe.filter((j) => !j.ko), ...cb.monstres.filter((m) => !m.mort)]
        .map((c) => ({ c, init: initiativeDe(c) }))
        .sort((a, b) => b.init - a.init)
        .map((x) => x.c);
      el('combat-manche').textContent = cb.manchesMax
        ? `Manche ${cb.manche}/${cb.manchesMax}` : `Manche ${cb.manche}`;
      journal(`— Manche ${cb.manche} —`);
      cb.equipe.filter((j) => j.type === 'joueur').forEach((j) => {
        j.actionRejouee = false;               // « Voltige » : une relance par manche
        j.actionsJouees = 1;                   // « Éclair Immobile » : deux actions
        j.killsDuTour = 0;                     // contrainte divine du tir
        j.manchesDuel = (j.manchesDuel || 0) + 1; // « Duel » : la traque s'installe
        // Voies de la Rage et du Souffle : une manche sans encaisser paie.
        // Le drapeau posé à l'encaissement fait foi : sans lui, un héros
        // touché après son tour redémarrait la manche suivante à 1.
        if (cb.manche > 1) {
          j.manchesPropres = j.toucheCetteManche ? 0 : (j.manchesPropres || 0) + 1;
          j.manchesEnSang = j.toucheCetteManche ? (j.manchesEnSang || 0) + 1 : 0;
        }
        j.toucheCetteManche = false;
        if (cb.manche === 1) { ouvertureDesVoies(j); ouvertureDesEveils(j); annoncerInitiative(j); }
      });
      traiterMecaniquesManche(cb);
    }

    const c = cb.file.shift();
    if (estMort(c)) continue;
    cb.actif = c;

    const debut = debutTour(c);
    rendreCombat();
    if (verifierFin()) break;
    if (estMort(c)) continue; // mort au poison pendant son propre tour

    // Contrainte divine du corps à corps : une manche sur deux, il regarde.
    // Le contrôle vient APRÈS debutTour : la manche sautée doit quand même
    // lever la garde, décompter les recharges et faire vivre les statuts —
    // sinon une Défense posée en manche impaire durait deux manches.
    if (reglagePassif(c, 'unTourSurDeux', false) && cb.manche % 2 === 0) {
      journal(`⏳ ${c.nom} laisse passer la manche : son Éveil l'exige.`);
      rendreCombat();
      await attendre(400);
      continue;
    }

    if (debut.skip) {
      const etourdi = c.statuts.find((s) => s.type === 'etourdi');
      journal(`💫 ${c.nom} est étourdi${etourdi && etourdi.source ? ` par ${etourdi.source}` : ''} et passe son tour ! (le poison, lui, ne fait jamais perdre de tour)`);
      rendreCombat();
      if (cb.groupe && cb.groupe.hote) await publierEtatGroupe(cb);
      await attendre(900);
      continue;
    }

    if (c.type === 'invocation') {
      // L'invocation agit seule : pas de main à passer, pas de choix.
      el('zone-actions').innerHTML = '';
      await attendre(900);
      tourInvocation(c);
      finDeTourStatuts(c);
      rendreCombat();
    } else if (c.type === 'joueur') {
      if (c.distant && cb.groupe && cb.groupe.hote) {
        // Héros sur un autre écran : on publie l'état et on attend son action.
        await tourJoueurDistant(c);
      } else {
        cb.modeActions = null;
        rendreActions(c);
        await new Promise((res) => { cb.finTour = res; });
        cb.finTour = null;
        el('zone-actions').innerHTML = '';
      }
      if (rejouerParVoltige(c)) cb.file.unshift(c);
      finDeTourStatuts(c);
      rendreCombat();
    } else {
      el('zone-actions').innerHTML = '';
      await attendre(900);
      tourMonstre(c);
      finDeTourStatuts(c);
      rendreCombat();
    }

    if (cb.groupe && cb.groupe.hote && !cb.termine) await publierEtatGroupe(cb);
    if (verifierFin()) break;
    await attendre(400);
  }
}

// Effets appliqués au début du tour d'un combattant.
function debutTour(c) {
  const cb = etat.combat;
  c.defense = false;

  if (c.type === 'joueur' || c.type === 'invocation') {
    Object.keys(c.cooldowns).forEach((k) => { if (c.cooldowns[k] > 0) c.cooldowns[k]--; });
    c.mp = Math.min(c.maxMp, c.mp + regainDeMana(c));
  }
  // Une invocation à durée limitée (l'esprit du Chaman) tient le compte.
  if (c.type === 'invocation' && c.toursRestants != null) {
    // L'effacement se teste AVANT le décompte : « il combattra encore
    // 3 tours » doit donner trois vrais tours, pas deux.
    if (c.toursRestants <= 0) {
      c.mort = true;
      c.ko = true;
      journal(`👻 ${c.nom} s'efface : son temps parmi les vivants est écoulé.`);
      return { skip: true };
    }
    c.toursRestants--;
  }

  const poison = c.statuts.find((s) => s.type === 'poison');
  if (poison) {
    // La contribution au boss du monde est bornée aux PV restants (pas d'overkill).
    if (c.type === 'monstre' && cb.genre === 'bossMonde') {
      cb.degatsBossMonde += Math.min(poison.valeur, Math.max(0, c.hp));
    }
    c.hp -= poison.valeur;
    journal(`🧪 ${c.nom} souffre du poison : ${poison.valeur} dégâts.`);
    if (c.hp <= 0) {
      // Le coup fatal revient au POSEUR du poison : c'est SON explosion
      // (partExplosion) qui doit partir, pas celle du dernier coup direct.
      if (c.type === 'monstre' && poison.poseur && cb) {
        const poseur = cb.equipe.find((x) => x.bid === poison.poseur && !estMort(x));
        if (poseur) c.dernierAgresseur = poseur;
      }
      // La Muraille Vivante ne lit pas que les coups : un allié ne tombe
      // pas davantage d'une tique de poison tant que le Templier tient.
      if (c.type === 'joueur' && c.hp <= 0 && sanctuaireActif(c)) {
        c.hp = 1;
        journal(`🧱 La Muraille Vivante tient : ${c.nom} reste debout à 1 PV.`);
      }
      gererMort(c);
      // Relevé sur-le-champ (Phénix, Voie des Ancêtres…) : sa relance est
      // déjà poussée dans la file — jouer maintenant EN PLUS ferait deux
      // actions dans la même manche.
      if (!estMort(c)) return { skip: true };
    }
  }
  if (estMort(c)) return { skip: true };

  const regen = c.statuts.find((s) => s.type === 'regen');
  if (regen && c.hp < c.maxHp && soinAutorise(c, c)) {
    const soin = Math.min(regen.valeur, c.maxHp - c.hp);
    c.hp += soin;
    journal(`💧 ${c.nom} régénère ${soin} PV.`);
  }

  // Voie du Calme : il récupère PV et mana à chaque tour, au prix de ses
  // dégâts (voir malusDegatsVoie).
  const calme = reglagePassif(c, 'regenParTour', 0);
  if (calme) {
    const pv = Math.max(1, Math.round(c.maxHp * calme));
    const pm = Math.max(1, Math.round(c.maxMp * calme));
    const avantPv = c.hp;
    c.hp = Math.min(c.maxHp, c.hp + pv);
    c.mp = Math.min(c.maxMp, c.mp + pm);
    if (c.hp > avantPv) journal(`☯️ ${c.nom} respire : +${c.hp - avantPv} PV et +${pm} PM.`);
  }

  // Contrainte mythique du tank : il se vide, tour après tour.
  const saignee = reglagePassif(c, 'saignementParTour', 0);
  if (saignee && c.hp > 1) {
    const perte = Math.max(1, Math.round(c.maxHp * saignee));
    c.hp = Math.max(1, c.hp - perte);
    journal(`🩸 ${c.nom} paie son Éveil : ${perte} PV.`);
  }
  // Éveils « Aube Éternelle », « Racines Profondes » : l'équipe respire.
  const partRegenEquipe = reglagePassif(c, 'regenEquipe', 0);
  if (partRegenEquipe && cb) {
    let total = 0;
    cb.equipe.filter((x) => !estMort(x) && soinAutorise(x, c)).forEach((x) => {
      const avant = x.hp;
      x.hp = Math.min(x.maxHp, x.hp + Math.max(1, Math.round(x.maxHp * partRegenEquipe)));
      total += x.hp - avant;
    });
    journal(total > 0
      ? `🌿 ${c.nom} fait refleurir l'équipe : ${total} PV.`
      : `🌿 ${c.nom} veille sur une équipe déjà au maximum.`);
  }
  // Éveils « Porte-Peste », « La Grande Peste » : les états sautent seuls.
  propagerSpontanement(c);

  // Sève vitale (sylvain) : régénère 2 % des PV max à chaque tour.
  if (c.race === 'sylvain' && c.hp < c.maxHp) {
    const seve = Math.max(1, Math.round(c.maxHp * 0.02));
    c.hp = Math.min(c.maxHp, c.hp + seve);
    journal(`🌳 La sève vitale rend ${seve} PV à ${c.nom}.`);
  }

  const skip = c.statuts.some((s) => s.type === 'etourdi');

  // La bénédiction (+30 % de dégâts) se consomme en AGISSANT : elle est
  // décomptée en fin de tour (finDeTourStatuts), pas ici, pour offrir
  // ses 3 tours d'attaque annoncés.
  c.statuts.forEach((s) => { if (s.type !== 'benediction') s.duree--; });
  const expires = c.statuts.filter((s) => s.duree <= 0);
  c.statuts = c.statuts.filter((s) => s.duree > 0 && !(s.type === 'bouclier' && s.valeur <= 0));
  propagerStatutsDuCorrupteur(c, expires);

  return { skip };
}

// Statuts consommés par l'action du combattant (décomptés après qu'il a agi).
function finDeTourStatuts(c) {
  const benediction = c.statuts.find((s) => s.type === 'benediction');
  if (benediction) {
    benediction.duree--;
    if (benediction.duree <= 0) c.statuts = c.statuts.filter((s) => s !== benediction);
  }
}

// v15 : les invocations ne survivent jamais au combat — elles se
// dissipent à la victoire, à la défaite comme à la fuite.
function dissiperInvocations(cb) {
  cb.equipe
    .filter((j) => j.type === 'invocation' && !estMort(j))
    .forEach((inv) => journal(`🌫️ ${inv.nom} se dissipe : le combat s'achève.`));
  cb.equipe = cb.equipe.filter((j) => j.type !== 'invocation');
}

function verifierFin() {
  const cb = etat.combat;
  if (cb.termine) return true;
  traiterPhasesBoss(cb);

  if (cb.monstres.every((m) => m.mort)) {
    cb.termine = true;
    cb.actif = null;
    journal('🏆 Victoire ! Tous les ennemis sont vaincus.');
    dissiperInvocations(cb);
    rendreCombat();
    setTimeout(() => apresVictoire(cb), 1300);
    return true;
  }

  // Les invocations ne comptent pas : si tous les VRAIS héros sont à
  // terre, leurs créatures perdent leur ancrage et le combat est perdu.
  if (cb.equipe.filter((j) => j.type !== 'invocation').every((j) => j.ko)) {
    cb.termine = true;
    cb.actif = null;
    journal('💫 Tout le groupe est à terre…');
    dissiperInvocations(cb);
    rendreCombat();
    setTimeout(() => apresDefaite(cb), 1300);
    return true;
  }

  return false;
}

// =====================================================================
// Dégâts, soins et effets
// =====================================================================
function infligerDegats(source, cible, brut, options = {}) {
  const cb = etat.combat;
  // Moine « Le Vide », Voltigeur « L'Envol » : il n'est tout simplement
  // pas là où le coup arrive.
  if (source.type === 'monstre' && reglagePassif(cible, 'esquiveSoi', 0) > 0
    && Math.random() < reglagePassif(cible, 'esquiveSoi', 0)) {
    journal(`💨 ${cible.nom} n'était déjà plus là.`);
    return { degats: 0, crit: false, direct: false, absorbe: 0, esquive: true };
  }
  // Aegis de Valciel : la manche entière ne compte pas.
  if (source.type === 'monstre' && mancheInvulnerable(cible)) {
    journal(`✨ L'Aegis tient : ${cible.nom} ne subit rien cette manche.`);
    return { degats: 0, crit: false, direct: false, absorbe: 0, esquive: true };
  }
  // Oracle de la Vision : l'équipe voit venir. Le coup ne part pas.
  if (esquiveDeLEquipe(source, cible)) {
    journal(`🔮 ${cible.nom} voyait le coup venir : il ne touche pas.`);
    return { degats: 0, crit: false, direct: false, absorbe: 0, esquive: true };
  }
  let d = varie(brut);
  // v19 : le ciel entre dans l'équation. Sous la pluie le feu prend mal,
  // sous l'orage la foudre porte. Le physique reste neutre — le temps
  // qu'il fait ne change rien à un coup d'épée.
  if (options.element) d *= multElementMonde(options.element);
  // v25 : on retient ce que les passifs de l'ATTAQUANT ont pesé dans ce
  // coup précis — Élan, Rempart et Ligne de tir compris depuis la v25.1.
  const multPassifs = multiplicateurPassifs(source, cible, options);
  d *= multPassifs;
  d *= multiplicateurMarque(cible);  // « Marque » du Traqueur : pour toute l'équipe
  if (source.statuts.some((s) => s.type === 'benediction')) d *= 1.3;
  if (source.statuts.some((s) => s.type === 'affaibli')) d *= 0.7;
  const berce = source.statuts.find((s) => s.type === 'berce');
  if (berce) d *= 1 - (berce.valeur || 0);
  // Sang de guerre (orc) : +15 % de dégâts sous 40 % de PV.
  if (source.race === 'orc' && source.hp < source.maxHp * 0.4) d *= 1.15;

  // v19 — Les trois sous-caractéristiques offensives du modèle FF XIV.
  //
  //  • Détermination : un bonus SÛR, appliqué à chaque coup. Elle ne fait
  //    jamais rêver, mais elle ne déçoit jamais non plus.
  //  • Critique      : ×1,5, au hasard. Le pic de dégâts.
  //  • Coup direct   : +25 %, au hasard aussi — mais il ne se cumule PAS
  //    avec le critique. Un coup est critique, ou direct, ou ordinaire.
  //
  // Les deux hasards s'excluent volontairement : c'est ce qui empêche les
  // pointes de dégâts absurdes et garde les combats lisibles.
  let executionRasoir = false;
  let chanceCrit = 0.05 + (options.critBonus || 0);
  let chanceDirect = 0;
  if (source.type === 'joueur') {
    const s = statsEffectives(source);
    chanceCrit += sousCarac(s, 'crit');
    chanceDirect = sousCarac(s, 'direct');
    d *= 1 + sousCarac(s, 'deter');
    if (source.race === 'elfe') chanceCrit += 0.05; // Précision millénaire
    chanceCrit += bonusCritDuel(source, cible, options); // « Duel » : un adversaire à la fois
  }
  const crit = critiqueForce(source) || reglagePassif(source, 'critTotal', false)
    || Math.random() < chanceCrit;
  if (crit) {
    rendreLaMainSurCritique(source);
    // Duelliste « Fil du Rasoir » : un critique sur un moribond le tue
    // net — la sentence est posée ici, exécutée après TOUTES les
    // réductions (lignes, garde, bouclier), sinon un plancher rogné de
    // 40 % laissait la cible debout malgré l'annonce.
    const seuilRasoir = reglagePassif(source, 'executionSurCritique', 0);
    if (seuilRasoir && cible.type === 'monstre' && cible.hp <= cible.maxHp * seuilRasoir) {
      executionRasoir = true;
      journal(`🗡️ Le fil du rasoir trouve la faille : ${cible.nom} tombe net.`);
    }
  }
  let direct = false;
  if (crit) {
    d *= 1.5;
  } else if (Math.random() < chanceDirect) {
    direct = true;
    d *= 1.25;
  }

  // v21 — Plus de réduction plate venue de l'équipement : encaisser se joue
  // avec ce qui se voit en combat. Seul le Gardien en garde une, parce que
  // c'est son métier et qu'elle ne dépend d'aucun objet.
  // v25.1 — CE QUE LA CIBLE DOIT À SES PROPRES PASSIFS.
  //
  // Ces multiplicateurs-là ne viennent pas de l'attaquant : ils viennent
  // de celui qui encaisse. Ils n'entraient donc dans aucun chiffre
  // affiché — et la contrainte la plus punitive du jeu (« fragilité »,
  // qui DOUBLE les dégâts reçus) était aussi la plus silencieuse. On les
  // rassemble, et on les affiche à part.
  let multDefense = resistanceDeClasse(cible);
  multDefense *= reductionTemplier(cible);  // « Bouclier partagé » : la ligne avant tient
  multDefense *= 1 + reglagePassif(cible, 'fragilite', 0);
  d *= multDefense;
  // La nuit, ce qui rôde frappe plus fort — c'est le prix du butin majoré.
  // Voie du Soleil : sur lui, le ciel n'a pas de prise.
  if (source.type === 'monstre' && cible.type === 'joueur') {
    const ciel = mondeMaintenant().effets.degatsSubis || 1;
    if (reglagePassif(cible, 'ignoreMeteoSubis', false)) {
      if (ciel > 1 && !cible.cielAnnonce) {
        cible.cielAnnonce = true;
        journal(`☀️ Le ciel n'a pas de prise sur ${cible.nom} : les ${Math.round((ciel - 1) * 100)} % de la nuit ne le touchent pas.`);
      }
    } else {
      d *= ciel;
    }
  }
  // Voie du Vide / du Néant : rien n'arrête ce coup — ni la garde, ni un
  // bouclier — et il se paie sur les propres PV du lanceur.
  const perce = reglagePassif(source, 'perceArmure', 0);
  if (!perce && cible.defense) d *= 0.5;
  if (cible.race === 'nain') d *= 0.9; // Peau de pierre
  // v16 : les lignes de combat — un coup PHYSIQUE perd 40 % quand il part
  // de la ligne arrière ou qu'il la vise. La magie ignore les lignes.
  if (!options.magique) {
    // « Ligne de tir » : le Franc-tireur travaille de loin, sans pénalité.
    // Le malus s'applique à tout le monde ; « Ligne de tir » le rend au
    // Franc-tireur via multiplicateurPassifs, où il se voit.
    if (source.ligne === 'arriere') d *= 0.6;
    if (cible.ligne === 'arriere') d *= 0.6;
  }
  d = Math.max(1, Math.round(d));
  // Colosse « L'Inébranlable » : aucun coup ne dépasse son plafond.
  const plafondCoup = reglagePassif(cible, 'plafondDegatsParCoup', 0);
  if (plafondCoup) {
    const borne = Math.max(1, Math.round(cible.maxHp * plafondCoup));
    if (d > borne) {
      multDefense *= borne / d;   // le plafond EST une réduction : il se compte comme telle
      d = borne;
    }
  }

  let absorbe = 0;
  const bouclier = !perce && cible.statuts.find((s) => s.type === 'bouclier' && s.valeur > 0);
  if (bouclier) {
    absorbe = Math.min(bouclier.valeur, d);
    bouclier.valeur -= absorbe;
    d -= absorbe;
  }

  // La mort est gérée par l'appelant (gererMort) après la ligne de journal.
  // La contribution au boss du monde est bornée aux PV restants (pas d'overkill).
  if (cible.type === 'monstre' && cb && cb.genre === 'bossMonde') {
    cb.degatsBossMonde += Math.min(d, Math.max(0, cible.hp));
  }
  // Templier « Bastion Sacré », Chevalier Noir « Le Puits » : une part du
  // coup ne va pas là où elle était adressée.
  d = repartirLeCoup(source, cible, d);
  // Contrainte divine du tir : un seul ennemi peut tomber par manche.
  if (cible.type === 'monstre' && reglagePassif(source, 'unKillParTour', false)
    && (source.killsDuTour || 0) >= 1 && d >= cible.hp) {
    d = Math.max(1, cible.hp - 1);
  }
  if (executionRasoir) d = Math.max(d, cible.hp + 1);
  cible.hp -= d;
  if (cible.type === 'joueur') cible.degatsEncaisses = (cible.degatsEncaisses || 0) + d;
  cible.dernierAgresseur = source;   // qui porte le coup fatal : les passifs le demandent
  if (perce) {
    const prix = Math.max(1, Math.round(source.maxHp * perce));
    source.hp = Math.max(1, source.hp - prix);   // la percée ne tue jamais son porteur
  }
  nourrirElan(source);
  draineDeGravure(source, d);
  apresDegatsPassifs(source, cible, d);
  apresDegatsVoies(source, cible, d, options);
  encaisserSelonLesVoies(source, cible, d, options);
  // Templier « Muraille Vivante » : tant qu'il tient, personne ne tombe.
  if (cible.type === 'joueur' && cible.hp <= 0 && sanctuaireActif(cible)) {
    cible.hp = 1;
    journal(`🧱 La Muraille Vivante tient : ${cible.nom} reste debout à 1 PV.`);
  }
  // Neuf vies (félin) : survit une fois par combat à un coup fatal.
  if (cible.type === 'joueur' && cible.race === 'felin' && cible.hp <= 0 && !cible.neufViesUtilisees) {
    cible.neufViesUtilisees = true;
    cible.hp = 1;
    journal(`🐱 ${cible.nom} retombe sur ses pattes : Neuf vies le laisse à 1 PV !`);
  }
  // Main secourable APRÈS les planchers de survie : un allié qui tombe
  // pour de bon ne consomme pas la charge unique du Paladin (gererMort
  // effacerait le bouclier aussitôt posé) ; un survivant à 1 PV, si.
  if (cible.hp > 0) secourirAllieEnPeril(cible);
  return { degats: d, crit, direct, absorbe, multPassifs, multDefense };
}

function texteDegats(r) {
  let t = `${r.degats} dégâts`;
  if (r.crit) t += ' 💥 CRITIQUE !';
  else if (r.direct) t += ' 🎲 coup direct !';
  if (r.absorbe > 0) t += ` (${r.absorbe} absorbés par le bouclier)`;
  // v25 : le poids des passifs sur CE coup. Sans ça, un Colosse n'a
  // aucun moyen de savoir que sa Masse s'applique — et « ça ne marche
  // pas » devient impossible à trancher.
  if (r.multPassifs != null && Math.abs(r.multPassifs - 1) >= 0.005) {
    const signe = r.multPassifs > 1 ? '+' : '−';
    t += ` · 🏅 ${signe}${Math.round(Math.abs(r.multPassifs - 1) * 100)} % (passifs)`;
  }
  // Et ce que la CIBLE doit aux siens : le Rempart du Gardien, le
  // Bouclier partagé du Templier, la fragilité d'un Éveil mythique.
  if (r.multDefense != null && Math.abs(r.multDefense - 1) >= 0.005) {
    t += r.multDefense < 1
      ? ` · 🛡️ −${Math.round((1 - r.multDefense) * 100)} % (défense)`
      : ` · 💔 +${Math.round((r.multDefense - 1) * 100)} % (fragilité)`;
  }
  return t;
}

// Les contraintes de soin valent pour TOUTES les guérisons — les sorts,
// mais aussi les retours directs des passifs (sève, lumière, bastion…),
// qui les contournaient tous.
function soinAutorise(cible, source) {
  if (reglagePassif(cible, 'soinsInterdits', false)) return false;
  if (source && source !== cible && reglagePassif(cible, 'soinsAlliesInterdits', false)) return false;
  return true;
}

function soigner(cible, brut, source) {
  // Éveils de soigneur : ses soins et ses boucliers pèsent plus lourd.
  let soin = Math.max(1, Math.round(varie(brut) * (1 + reglagePassif(source, 'soinsBonus', 0))));
  // Contraintes : plus aucun soin, ou plus aucun soin VENANT D'UN ALLIÉ.
  if (!soinAutorise(cible, source)) return 0;
  // Voie du Sang : ce qu'il prend aux autres le nourrit, ce que les
  // autres lui donnent le nourrit moins — et « réduits de 100 % » veut
  // dire zéro, pas un point de courtoisie.
  const malus = reglagePassif(cible, 'malusSoinsRecus', 0);
  if (malus && source && source !== cible) soin = Math.round(soin * (1 - Math.min(1, malus)));
  if (soin <= 0) return 0;
  const avant = cible.hp;
  cible.hp = Math.min(cible.maxHp, cible.hp + soin);
  // « Clairvoyance » : ce qui dépasse les points de vie maximum ne tombe
  // pas dans le vide, il se fige en bouclier.
  if (source) surplusDeSoin(source, cible, soin - (cible.hp - avant));
  // La vérité, rien qu'elle : les PV réellement rendus. Une cible à pleine
  // vie renvoie 0 — au journal de le dire, plutôt que d'annoncer un soin
  // qui n'a pas eu lieu.
  return cible.hp - avant;
}

function gererMort(c) {
  if (c.hp > 0 || estMort(c)) return;
  c.hp = 0;
  // Le drapeau de mort est posé AVANT tout le reste : l'explosion du
  // Pyromancien peut abattre un voisin, qui peut en abattre un autre —
  // sans ce garde-fou, la chaîne se mordrait la queue.
  const etats = c.statuts;
  if (c.type === 'invocation') {
    c.mort = true;
    c.ko = true;
  } else if (c.type === 'joueur') {
    c.ko = true;
  } else {
    c.mort = true;
  }
  c.statuts = [];
  if (c.type === 'invocation') journal(`🌫️ ${c.nom} se dissipe — l'invocation est brisée.`);
  else if (c.type === 'joueur') journal(`😵 ${c.nom} s'effondre ! (KO)`);
  else journal(`☠️ ${c.nom} est vaincu !`);

  // Les passifs déclenchés par une mort lisent encore les états du mort
  // (la brûlure du Pyromancien, notamment) : on les leur repasse.
  if (c.type === 'monstre') {
    const tueur = c.dernierAgresseur;
    if (tueur && tueur.type === 'joueur' && !estMort(tueur)) {
      passifsSurMortEnnemi(tueur, { ...c, statuts: etats });
    }
  } else if (c.type === 'joueur') {
    // Éveils « Serment Immortel », « Phénix » : il se relève lui-même.
    const part = reglagePassif(c, 'renaissance', 0);
    if (part && !c.renaissanceUtilisee) {
      c.renaissanceUtilisee = true;
      c.ko = false;
      c.hp = Math.max(1, Math.round(c.maxHp * part));
      c.statuts = [];
      if (etat.combat) etat.combat.file.push(c);
      journal(`🔥 ${c.nom} se relève de ses propres cendres avec ${c.hp} PV !`);
      return;
    }
    if (!releveParVoie(c)) invoquerEspritDuChaman(c);
  } else if (c.type === 'invocation') {
    relancerLInvocation(c);
  }
}

// Voie de l'Éther : une créature tombée revient une fois, à la moitié.
function relancerLInvocation(inv) {
  const cb = etat.combat;
  if (!cb || inv.dejaRelancee) return;
  const maitre = cb.equipe.find((x) => x.type === 'joueur' && x.bid === inv.maitre && !estMort(x));
  const part = maitre ? reglagePassif(maitre, 'invocationsRessuscitent', 0) : 0;
  if (!part) return;
  inv.dejaRelancee = true;
  inv.mort = false;
  inv.ko = false;
  inv.hp = Math.max(1, Math.round(inv.maxHp * part));
  inv.statuts = [];
  cb.file.push(inv);
  journal(`🫧 L'éther recompose ${inv.nom} : elle revient avec ${inv.hp} PV.`);
}

function poserStatut(cible, statut) {
  cible.statuts = cible.statuts.filter((s) => s.type !== statut.type);
  cible.statuts.push(statut);
}

// v22 — Deux passifs allongent ce qu'on pose : le Corrupteur ses états
// sur l'ennemi, le Barde ses bienfaits sur l'équipe. La durée d'un effet
// se calcule donc ici, une fois, plutôt qu'à chaque `case`.
const STATUTS_BIENFAISANTS = ['benediction', 'bouclier', 'regen', 'provocation', 'fortune'];

// La fiche du Barde parle de « bénédictions, boucliers et régénérations » :
// la provocation et la Fortune n'en font pas partie.
const BIENFAITS_PROLONGEABLES = ['benediction', 'bouclier', 'regen'];

function dureeAjustee(source, effet) {
  let duree = effet.duree;
  if (duree == null) return duree;
  if (STATUTS_BIENFAISANTS.includes(effet.type)) {
    if (BIENFAITS_PROLONGEABLES.includes(effet.type)) duree += reglagePassif(source, 'dureeBuffBonus', 0);
  } else {
    duree += reglagePassif(source, 'dureeBonusStatut', 0);
  }
  return duree;
}

// Éveils « Cœur de Basalte », « Corps de Diamant », « Cœur de Glace » :
// rien ne prend sur eux.
const ETATS_NUISIBLES = ['poison', 'etourdi', 'affaibli', 'marque', 'berce'];

function appliquerEffet(source, cible, effet, resultatDegats, comp) {
  if (ETATS_NUISIBLES.includes(effet.type) && reglagePassif(cible, 'immuniteStatuts', false)) {
    journal(`🗿 Rien ne prend sur ${cible.nom} : l'état glisse.`);
    return;
  }
  // Éveils « Fin de Toute Chair » : ce qu'il pose, il le pose sur tous.
  const cb0 = etat.combat;
  if (reglagePassif(source, 'tousStatutsATous', false) && cible.type === 'monstre'
    && ETATS_NUISIBLES.includes(effet.type) && cb0 && !effet.dejaPropage) {
    cb0.monstres.filter((m) => m !== cible && !m.mort).forEach((m) => {
      appliquerEffet(source, m, { ...effet, dejaPropage: true }, resultatDegats, comp);
    });
  }
  const duree = dureeAjustee(source, effet);
  switch (effet.type) {
    case 'poison': {
      // v26 : le poison suit enfin son palier, comme les boucliers et les
      // régénérations depuis la v20.1 — un venin de fin de parcours ronge
      // comme un venin de fin de parcours. Les valeurs FIXES (bestiaire)
      // ne bougent pas.
      const valeur = Math.round((effet.degats != null
        ? effet.degats
        : (3 + statDe(source, effet.stat || 'dex') * (['int', 'esp'].includes(effet.stat) ? 0.5 : 0.6))
          * ampleurEffet(comp, effet))
        * (1 + reglagePassif(source, 'brulureForce', 0)));
      // Pyromancien : ses brûlures se cumulent au lieu de se remplacer.
      const cumulMax = reglagePassif(source, 'brulureMax', 0);
      const dejaLa = cumulMax > 0 && cible.statuts.find((st) => st.type === 'poison');
      if (dejaLa) {
        dejaLa.cumuls = Math.min(cumulMax, (dejaLa.cumuls || 1) + 1);
        dejaLa.valeur = valeur * dejaLa.cumuls;
        dejaLa.duree = Math.max(dejaLa.duree, duree);
        journal(`🔥 ${cible.nom} brûle plus fort (${dejaLa.cumuls}/${cumulMax} — ${dejaLa.valeur} dégâts par tour).`);
        break;
      }
      // Le poseur est mémorisé : si la brûlure achève la cible plus tard,
      // c'est SON explosion (partExplosion) qui doit partir, pas celle du
      // dernier allié à avoir donné un coup direct.
      poserStatut(cible, { type: 'poison', duree, valeur, cumuls: 1, poseur: source.bid || null });
      journal(`🧪 ${cible.nom} est empoisonné (${valeur} dégâts par tour, ${duree} tours).`);
      // Druide des Ronces : la ronce ne se contente pas de piquer.
      const clou = reglagePassif(source, 'etourdiSurPoison', 0);
      if (clou && cible.type === 'monstre' && Math.random() < clou
        && !reglagePassif(cible, 'immuniteEtourdi', false)) {
        poserStatut(cible, { type: 'etourdi', duree: 1, source: source.nom });
        journal(`🥀 Les ronces clouent ${cible.nom} sur place.`);
      }
      break;
    }
    case 'affaibli': {
      poserStatut(cible, { type: 'affaibli', duree });
      journal(`⬇️ ${cible.nom} est affaibli : −30 % de dégâts pendant ${duree} tours.`);
      break;
    }
    case 'pacte': {
      const sacrifice = Math.max(1, Math.round(cible.maxHp * effet.partPv));
      cible.hp = Math.max(1, cible.hp - sacrifice); // le pacte ne tue jamais
      cible.mp = Math.min(cible.maxMp, cible.mp + effet.mana);
      journal(`🩸 ${cible.nom} sacrifie ${sacrifice} PV et récupère ${effet.mana} PM.`);
      break;
    }
    case 'etourdi': {
      // Colosse de la Montagne : on ne le bouge pas, on ne l'assomme pas.
      if (reglagePassif(cible, 'immuniteEtourdi', false)) {
        journal(`🏔️ ${cible.nom} ne bouge pas d'un pouce : rien ne l'étourdit.`);
        break;
      }
      if (Math.random() < (effet.chance != null ? effet.chance : 1)) {
        // La source est mémorisée pour que le « passe son tour » dise QUI a étourdi.
        poserStatut(cible, { type: 'etourdi', duree: duree + reglagePassif(source, 'dureeEtourdiBonus', 0), source: source.nom });
        journal(`💫 ${cible.nom} est étourdi par ${source.nom} !`);
      } else {
        journal(`${cible.nom} résiste à l'étourdissement.`);
      }
      break;
    }
    case 'bouclier': {
      const valeur = Math.round(valeurBouclier(statsEffectives(source), effet, comp)
        * (1 + reglagePassif(source, 'soinsBonus', 0)));
      const dureeBouclier = duree + reglagePassif(source, 'bouclierDureeBonus', 0);
      // Oracle du Bouclier, Druide de la Sève : ses boucliers s'ajoutent
      // au lieu de remplacer celui qui tenait déjà.
      const existant = reglagePassif(source, 'bouclierCumulatif', false)
        && cible.statuts.find((st) => st.type === 'bouclier');
      if (existant) {
        existant.valeur += valeur;
        existant.duree = Math.max(existant.duree, dureeBouclier);
        journal(`🛡️ Le bouclier de ${cible.nom} s'épaissit (+${valeur}, total ${existant.valeur}).`);
        break;
      }
      poserStatut(cible, { type: 'bouclier', duree: dureeBouclier, valeur });
      journal(`🛡️ ${cible.nom} est protégé par un bouclier (${valeur} points).`);
      break;
    }
    case 'benediction': {
      poserStatut(cible, { type: 'benediction', duree });
      journal(`🙏 ${cible.nom} est béni : +30 % de dégâts pendant ${duree} tours.`);
      break;
    }
    case 'provocation': {
      poserStatut(cible, { type: 'provocation', duree });
      // Le bouclier suit la stat écrite sur l'effet, sinon celle de la
      // classe — un Gardien provoque avec sa Vitalité, pas avec une Force
      // qu'il ne monte jamais — et grandit avec le palier de la compétence.
      const statProvoc = (effet && effet.stat) || (comp && comp.stat)
        || (classeBaseDuCombattant(source) || {}).stat || 'for';
      const valeur = Math.round((4 + statDe(source, statProvoc)) * ampleurEffet(comp, effet));
      poserStatut(cible, { type: 'bouclier', duree, valeur });
      journal(`😤 ${cible.nom} provoque les ennemis et se protège (${valeur} points de bouclier) !`);
      break;
    }
    case 'regen': {
      if (!soinAutorise(cible, source)) {
        journal(`🚫 Aucun soin ne prend sur ${cible.nom} : la régénération glisse.`);
        break;
      }
      const valeur = valeurRegen(statsEffectives(source), effet, comp);
      poserStatut(cible, { type: 'regen', duree, valeur });
      journal(`💚 ${cible.nom} régénérera ${valeur} PV par tour pendant ${duree} tours.`);
      // Druide : la sève ne s'arrête pas à celui qu'il vise.
      seveDuDruide(source);
      break;
    }
    case 'mana': {
      // v20 : une part de la réserve, plus un forfait figé qui devenait
      // dérisoire en fin de partie (+10 PM sur 300, c'était mourir debout).
      const rendu = valeurRetourMana(effet, statsEffectives(cible), cible.maxMp);
      cible.mp = Math.min(cible.maxMp, cible.mp + rendu);
      journal(`🧘 ${cible.nom} récupère ${rendu} PM.`);
      break;
    }
    case 'drain': {
      if (resultatDegats && resultatDegats.degats > 0) {
        const soin = soigner(source, resultatDegats.degats * effet.part);
        journal(`🧛 ${source.nom} draine ${soin} PV.`);
      }
      break;
    }
    case 'vol-or': {
      const cb2 = etat.combat;
      const butin = Math.max(1, Math.round(varie(4 + statDe(source, 'dex') * 1.2)));
      cb2.orVole = (cb2.orVole || 0) + butin;
      journal(`💰 ${source.nom} fait les poches de ${cible.nom} : +${formatNombre(butin)} po au butin !`);
      break;
    }
  }
}

// =====================================================================
// Actions des joueurs
// =====================================================================
function consommablesDe(j) {
  return j.inventaire.filter((entree) => {
    const objet = OBJETS[entree.id];
    return objet && objet.type === 'consommable' && entree.qte > 0;
  });
}

// v25 — Les passifs actifs, sous les yeux du joueur, à chaque tour.
//
// Savoir QUE l'on a un passif et savoir qu'il A JOUÉ sont deux choses
// différentes. Le journal dit la seconde (voir texteDegats) ; cette ligne
// dit la première. Sans elle, un joueur qui doute de son passif doit
// aller le relire dans un autre écran, en plein combat.
function texteInlinePassifs(j) {
  const morceaux = [];
  const base = classeBaseDuCombattant(j);
  if (base && base.passif) morceaux.push(base.passif.split('—')[0].trim());
  const sc = typeof sousClasseDe === 'function' ? sousClasseDe(j) : null;
  if (sc && sc.passif) morceaux.push(sc.passif.split('—')[0].trim());
  const voie = typeof voieDe === 'function' ? voieDe(j) : null;
  if (voie) morceaux.push(voie.nom.replace(/^Voie /, ''));
  const eveil = typeof eveilDe === 'function' ? eveilDe(j) : null;
  if (eveil) morceaux.push(eveil.nom);
  if (!morceaux.length) return '';
  return `<br><span class="actions-passifs" title="Vos passifs actifs — leur effet s'affiche sur chaque ligne de dégâts">🏅 ${
    morceaux.map((m) => echapper(m)).join(' · ')}</span>`;
}

function rendreActions(j) {
  const cb = etat.combat;
  const zone = el('zone-actions');
  zone.innerHTML = '';

  const entete = document.createElement('div');
  entete.className = 'actions-entete';
  entete.innerHTML = `<span class="avatar-grand">${echapper(j.avatar)}</span>
    <div>Au tour de <strong>${echapper(j.nom)}</strong>${cb.equipe.length > 1 ? ' — passe-lui l’écran !' : ''}<br>
    <span class="actions-vie">❤️ ${j.hp}/${j.maxHp} PV · 💧 ${j.mp}/${j.maxMp} PM</span>
    ${texteInlinePassifs(j)}</div>`;
  zone.appendChild(entete);

  if (cb.cibleEnAttente) {
    const bandeau = document.createElement('div');
    bandeau.className = 'bandeau-cible';
    bandeau.textContent = '🎯 Touche une cible en surbrillance…';
    zone.appendChild(bandeau);
    const annuler = document.createElement('button');
    annuler.className = 'btn-choix';
    annuler.textContent = '✖ Annuler';
    annuler.addEventListener('click', () => {
      cb.cibleEnAttente = null;
      rendreCombat();
      rendreActions(j);
    });
    zone.appendChild(annuler);
    return;
  }

  const barre = document.createElement('div');
  barre.className = 'barre-actions';

  if (cb.modeActions === 'objet') {
    const genreFuyable = ['exploration', 'embuscade', 'chasse'].includes(cb.genre);
    consommablesDe(j).forEach((entree) => {
      const objet = OBJETS[entree.id];
      const inutile = (objet.effet.type === 'pv' && j.hp >= j.maxHp)
        || (objet.effet.type === 'pm' && j.mp >= j.maxMp)
        || (objet.effet.type === 'antidote' && !j.statuts.some((st) => st.type === 'poison'))
        || (objet.effet.type === 'purge' && !j.statuts.some((st) => ['poison', 'affaibli', 'etourdi'].includes(st.type)))
        || (objet.effet.type === 'fortune' && j.statuts.some((st) => st.type === 'fortune'))
        || (objet.effet.type === 'soin-groupe' && cb.equipe.every((x) => x.ko || x.hp >= x.maxHp))
        || (objet.effet.type === 'fuite' && !genreFuyable);
      const btn = document.createElement('button');
      btn.className = 'btn-action';
      btn.disabled = inutile;
      btn.innerHTML = `${objet.emoji} <strong>${objet.nom}</strong><span class="action-detail">×${entree.qte} · ${inutile ? 'déjà au maximum' : objet.desc}</span>`;
      btn.addEventListener('click', () => surActionChoisie(j, { genre: 'objet', idObjet: entree.id }));
      barre.appendChild(btn);
    });
    const retour = document.createElement('button');
    retour.className = 'btn-action';
    retour.innerHTML = '↩️ <strong>Retour</strong><span class="action-detail">Choisir une autre action</span>';
    retour.addEventListener('click', () => { cb.modeActions = null; rendreActions(j); });
    barre.appendChild(retour);
    zone.appendChild(barre);
    return;
  }

  const btnAttaque = document.createElement('button');
  btnAttaque.className = 'btn-action';
  const attaqueInterdite = reglagePassif(j, 'degatsDirectsInterdits', false);
  btnAttaque.disabled = attaqueInterdite;
  btnAttaque.innerHTML = `⚔️ <strong>Attaque</strong><span class="action-detail">${attaqueInterdite ? '🚫 Éveil : plus aucun dégât direct' : 'Gratuite · dégâts légers'}</span>`;
  btnAttaque.addEventListener('click', () => surActionChoisie(j, { genre: 'attaque' }));
  barre.appendChild(btnAttaque);

  const btnDefense = document.createElement('button');
  btnDefense.className = 'btn-action';
  btnDefense.innerHTML = '🛡️ <strong>Défendre</strong><span class="action-detail">−50 % dégâts subis · +3 PM</span>';
  btnDefense.addEventListener('click', () => surActionChoisie(j, { genre: 'defense' }));
  barre.appendChild(btnDefense);

  // v16 : changer de ligne est une action à part entière — elle consomme le tour.
  const btnLigne = document.createElement('button');
  btnLigne.className = 'btn-action';
  const versArriere = j.ligne !== 'arriere';
  const pasGratuit = reglagePassif(j, 'pasGratuit', false);
  btnLigne.innerHTML = `🔁 <strong>${versArriere ? 'Passer à l’arrière' : 'Passer à l’avant'}</strong><span class="action-detail">${versArriere ? 'Physique −40 % (donné ET subi)' : 'Pleine puissance, pleine exposition'} · ${pasGratuit ? 'pas gratuit (Chorégraphie)' : 'consomme le tour'}</span>`;
  btnLigne.addEventListener('click', () => surActionChoisie(j, { genre: 'ligne' }));
  barre.appendChild(btnLigne);

  const statsJoueur = statsEffectives(j);
  // Contrainte divine du mage : il perd l'accès aux compétences communes.
  const sansCommunes = reglagePassif(j, 'communesInterdites', false);
  j.competences.forEach((compId) => {
    const comp = COMPETENCES[compId];
    if (!comp) return;
    // Les six sorts d'invocation sont « communs » faute de classe — mais un
    // Invocateur divin privé d'invocations n'aurait plus de passif du tout.
    if (sansCommunes && comp.type !== 'invocation' && typeof estCompetenceCommune === 'function' && estCompetenceCommune(comp)) return;
    const btn = document.createElement('button');
    btn.className = 'btn-action competence';
    const cd = j.cooldowns[compId] || 0;
    const surcoutAffiche = ((comp.cible === 'ennemis' || comp.cible === 'allies') ? reglagePassif(j, 'bonusZone', 0) : 0)
      + reglagePassif(j, 'surcoutMana', 0);
    const cout = Math.round(coutMpDe(comp, statsJoueur, j.maxMp) * (1 + surcoutAffiche));
    // Contraintes d'Éveil : le bouton se grise et DIT pourquoi, au lieu de
    // laisser cliquer une compétence que le moteur refusera.
    const interditZone = comp.cible === 'ennemis'
      && !(comp.eveil && j.eveil && comp.eveil === j.eveil.id)
      && reglagePassif(j, 'zonesInterdites', false);
    const interditDirect = comp.type === 'degats'
      && reglagePassif(j, 'degatsDirectsInterdits', false);
    // Détails chiffrés : dégâts/soins estimés, effets, coût, recharge.
    let detail = detailsCompetence(comp, statsJoueur, rangDe(j, compId), j.maxMp, { multCout: 1 + surcoutAffiche }).join(' · ');
    const enSang = j.mp < cout && reglagePassif(j, 'sangParMana', 0) > 0;
    if (interditZone) detail = '🚫 Éveil : une seule cible à la fois';
    else if (interditDirect) detail = '🚫 Éveil : plus aucun dégât direct';
    else if (cd > 0) detail = `⏳ Encore ${cd} tour${cd > 1 ? 's' : ''}`;
    else if (enSang) detail = `${cout} PM — payé en sang (${Math.max(1, Math.round((cout - j.mp) * reglagePassif(j, 'sangParMana', 0)))} PV)`;
    else if (j.mp < cout) detail = `${cout} PM — pas assez de mana`;
    btn.innerHTML = `${comp.emoji} <strong>${comp.nom}</strong><span class="action-detail">${detail}</span>`;
    btn.title = comp.desc;
    btn.disabled = cd > 0 || !peutPayerSort(j, cout) || interditZone || interditDirect;
    btn.addEventListener('click', () => surActionChoisie(j, { genre: 'competence', compId }));
    barre.appendChild(btn);
  });

  const consommables = consommablesDe(j);
  const btnObjet = document.createElement('button');
  btnObjet.className = 'btn-action';
  btnObjet.disabled = consommables.length === 0;
  btnObjet.innerHTML = `🎒 <strong>Objet</strong><span class="action-detail">${consommables.length ? 'Boire une potion' : 'Aucune potion dans le sac'}</span>`;
  btnObjet.addEventListener('click', () => { cb.modeActions = 'objet'; rendreActions(j); });
  barre.appendChild(btnObjet);

  if (['exploration', 'embuscade', 'chasse'].includes(cb.genre)) {
    const btnFuite = document.createElement('button');
    btnFuite.className = 'btn-action';
    btnFuite.innerHTML = '💨 <strong>Fuir</strong><span class="action-detail">65 % de réussite</span>';
    btnFuite.addEventListener('click', () => surActionChoisie(j, { genre: 'fuite' }));
    barre.appendChild(btnFuite);
  } else if (cb.genre === 'bossMonde') {
    const btnRetraite = document.createElement('button');
    btnRetraite.className = 'btn-action';
    btnRetraite.innerHTML = '🏳️ <strong>Battre en retraite</strong><span class="action-detail">Vos dégâts comptent quand même</span>';
    btnRetraite.addEventListener('click', () => surActionChoisie(j, { genre: 'fuite' }));
    barre.appendChild(btnRetraite);
  }

  zone.appendChild(barre);
  // Sur petit écran, amener le panneau d'actions en vue au début du tour.
  if (zone.scrollIntoView) zone.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function surActionChoisie(j, action) {
  const cb = etat.combat;
  if (cb.termine) return;
  if (cb.distant) {
    // Membre d'une expédition multi-écrans : l'action part vers le chef.
    const moi = persoActif();
    if (!moi || !moi.cloud || cb.enAttenteDe !== moi.cloud.id || cb.actionEnvoyee) return;
  } else if (cb.actif !== j || !cb.finTour) {
    return;
  }

  if (action.genre === 'objet') {
    // Garde-fou : ne pas gaspiller un objet et un tour sans effet.
    const objet = OBJETS[action.idObjet];
    if (objet.effet.type === 'pv' && j.hp >= j.maxHp) { afficherToast('PV déjà au maximum.'); return; }
    if (objet.effet.type === 'pm' && j.mp >= j.maxMp) { afficherToast('PM déjà au maximum.'); return; }
    if (objet.effet.type === 'antidote' && !j.statuts.some((st) => st.type === 'poison')) {
      afficherToast('Vous n’êtes pas empoisonné.');
      return;
    }
    if (objet.effet.type === 'fuite' && !['exploration', 'embuscade', 'chasse'].includes(cb.genre)) {
      afficherToast('Impossible de fuir ce combat, même en poudre.');
      return;
    }
  }

  const lancer = (cible) => {
    if (cb.distant) envoyerActionGroupe(action, cible);
    else executerAction(j, action, cible);
  };

  if (action.genre === 'defense' || action.genre === 'objet' || action.genre === 'fuite' || action.genre === 'ligne') {
    lancer(null);
    return;
  }

  const comp = action.compId ? COMPETENCES[action.compId] : null;
  const cibleType = action.genre === 'attaque' ? 'ennemi' : comp.cible;

  if (cibleType === 'soi') {
    lancer(j);
    return;
  }
  if (cibleType === 'ennemis' || cibleType === 'allies') {
    lancer(null);
    return;
  }

  const possibles = cibleType === 'ennemi'
    ? cb.monstres.filter((m) => !m.mort)
    : cb.equipe.filter((x) => !x.ko);
  if (possibles.length === 1) {
    lancer(possibles[0]);
  } else {
    cb.cibleEnAttente = { joueur: j, action };
    rendreCombat();
    rendreActions(j);
  }
}

// Exécute une action de joueur (locale ou distante).
// Renvoie 'fuite', 'retraite' (boss du monde) ou null.
function executerActionCoeur(j, action, cible) {
  const cb = etat.combat;
  if (action.genre === 'attaque' && reglagePassif(j, 'attaqueTousLesEnnemis', false)) {
    // Voltigeur « Tempête » : il n'y a plus de cible unique.
    const s = statsEffectives(j);
    journal(`🌪️ ${j.nom} balaie tout le terrain !`);
    cb.monstres.filter((m) => !m.mort).forEach((m) => {
      const r = infligerDegats(j, m, degatsAttaqueDeBase(j, s) * 0.75, { zone: true });
      journal(`→ ${m.nom} subit ${texteDegats(r)}`);
      gererMort(m);
    });
  } else if (action.genre === 'attaque') {
    // La contrainte « plus aucun dégât direct » vaut pour l'attaque de
    // base aussi — sinon elle se contournait d'un clic.
    if (reglagePassif(j, 'degatsDirectsInterdits', false)) {
      journal(`🚫 L'Éveil de ${j.nom} lui interdit d'infliger des dégâts directs.`);
      return 'rejouer';
    }
    const s = statsEffectives(j);
    // v20 : la meilleure caractéristique offensive, pas seulement FOR/DEX
    // — sans quoi un lanceur frappe à 9 quand un guerrier frappe à 161.
    const brut = degatsAttaqueDeBase(j, s);
    const r = infligerDegats(j, cible, brut);
    journal(`⚔️ ${j.nom} attaque ${cible.nom} : ${texteDegats(r)}`);
    gererMort(cible);
  } else if (action.genre === 'ligne') {
    // Voie de la Distance : il ne redescend jamais au contact.
    if (j.ligne === 'arriere' && reglagePassif(j, 'interditAvant', false)) {
      journal(`🏰 ${j.nom} tient sa position de tir : sa Voie lui interdit la ligne avant.`);
      return 'rejouer';
    }
    // v16 : se déplacer est un tour à part entière — sauf pour la
    // Danselame, dont c'est justement le passif (et le coup suivant paie).
    j.ligne = j.ligne === 'arriere' ? 'avant' : 'arriere';
    journal(`🔁 ${j.nom} se replace en ligne ${j.ligne === 'arriere' ? 'arrière (physique −40 %, donné et subi)' : 'avant'} !`);
    // Éveil caché du tir : quitter sa ligne coûte TOUS les bonus de passif
    // jusqu'à la fin du combat. C'était la perte la plus silencieuse du
    // jeu — et le badge « 🏅 » disparaissait en même temps que le bonus,
    // emportant la seule trace qui aurait pu prévenir.
    if (!j.ligneChangee && reglagePassif(j, 'bonusPerdusSiLigneChangee', false)) {
      journal(`🚫 ${j.nom} a quitté sa ligne : son Éveil lui retire tous ses bonus de passif jusqu'à la fin du combat.`);
    }
    j.ligneChangee = true;
    if (reglagePassif(j, 'pasGratuit', false)) {
      j.pasDeDanse = true;
      const cumul = reglagePassif(j, 'cumulPas', 0);
      const parPas = reglagePassif(j, 'bonusApresPas', 0);
      if (cumul) j.cumulDanse = Math.min(cumul, (j.cumulDanse || 0) + parPas);
      journal(`🌸 Le pas ne coûte rien à ${j.nom} : elle garde la main, et le coup suivant portera plus fort.`);
      return 'rejouer';
    }
  } else if (action.genre === 'defense') {
    j.defense = true;
    j.mp = Math.min(j.maxMp, j.mp + 3);
    journal(`🛡️ ${j.nom} se met en garde (+3 PM, dégâts subis réduits de moitié).`);
  } else if (action.genre === 'objet') {
    const objet = OBJETS[action.idObjet];
    if (objet && retirerObjet(j, action.idObjet, 1)) {
      j.objetBu = true; // Éveil « Le Pèlerin Silencieux » : le silence est rompu
      const issueObjet = utiliserObjetEnCombat(j, objet);
      if (j.distant && cb.consosDistantes) {
        const conso = cb.consosDistantes[j.bid] = cb.consosDistantes[j.bid] || {};
        conso[action.idObjet] = (conso[action.idObjet] || 0) + 1;
      }
      sauvegarderLocal();
      if (issueObjet === 'fuite') return 'fuite';
    }
  } else if (action.genre === 'fuite') {
    if (reglagePassif(j, 'fuiteInterdite', false)) {
      journal(`🚫 ${j.nom} ne fuit pas : son Éveil le lui interdit.`);
      return null;
    }
    if (cb.genre === 'bossMonde') {
      journal(`🏳️ ${j.nom} bat en retraite : le combat s'arrête ici.`);
      return 'retraite';
    }
    if (Math.random() < 0.65) {
      journal('💨 Le groupe parvient à s’échapper !');
      return 'fuite';
    }
    journal(`💨 ${j.nom} tente de fuir… sans succès !`);
  } else {
    // Un refus du moteur (contrainte d'Éveil, mana insuffisant) ne coûte
    // pas le tour : la main revient au joueur au lieu d'être consumée.
    if (lancerCompetence(j, action.compId, cible) === 'refus') return 'rejouer';
  }
  // Faucheur : quoi qu'il vienne de faire — sort, attaque, riposte, onde
  // de choc —, ce qui reste debout sous son seuil tombe. Ici, et pas dans
  // la boucle de tour : c'est le seul point par lequel passent TOUTES les
  // actions d'un héros, solo et expédition confondues.
  acheverLesMoribonds(j);
  return null;
}

function executerAction(j, action, cible) {
  const cb = etat.combat;
  // Empêche un double-clic de jouer deux actions dans le même tour.
  if (!cb.finTour || cb.termine) return;
  const finir = cb.finTour;
  cb.finTour = null;

  const issue = executerActionCoeur(j, action, cible);
  // « Chorégraphie » : le pas de côté ne consomme pas le tour — on rend
  // la main au lieu de la passer.
  if (issue === 'rejouer') {
    cb.finTour = finir;
    rendreCombat();
    rendreActions(j);
    return;
  }
  if (issue === 'retraite' || issue === 'fuite') {
    cb.termine = true;
    cb.actif = null;
    rendreCombat();
    finir();
    setTimeout(() => (issue === 'retraite' ? apresBossMonde(cb) : apresFuite(cb)), 800);
    return;
  }
  rendreCombat();
  finir();
}

function lancerCompetence(j, compId, cible, relance) {
  const cb = etat.combat;
  const comp = COMPETENCES[compId];
  j.seveCeCast = false;
  if (comp.type === 'invocation') return lancerInvocation(j, compId);
  const s = statsEffectives(j);
  const zone = comp.cible === 'ennemis' || comp.cible === 'allies';
  // Contraintes d'Éveil : certaines options disparaissent purement.
  const donDeSonEveil = !!comp.eveil && !!j.eveil && comp.eveil === j.eveil.id;
  // La contrainte divine du mage n'était appliquée que par l'interface :
  // une action distante (ou un client modifié) lançait quand même les
  // compétences communes. Le moteur est la seule vraie porte.
  if (reglagePassif(j, 'communesInterdites', false) && comp.type !== 'invocation'
    && typeof estCompetenceCommune === 'function' && estCompetenceCommune(comp)) {
    journal(`🚫 L'Éveil de ${j.nom} lui a fait oublier les compétences communes.`);
    return 'refus';
  }
  if (zone && comp.cible === 'ennemis' && !donDeSonEveil && reglagePassif(j, 'zonesInterdites', false)) {
    journal(`🚫 L'Éveil de ${j.nom} lui interdit de frapper plus d'un ennemi à la fois.`);
    return 'refus';
  }
  if (comp.type === 'degats' && reglagePassif(j, 'degatsDirectsInterdits', false)) {
    journal(`🚫 L'Éveil de ${j.nom} lui interdit d'infliger des dégâts directs.`);
    return 'refus';
  }
  // Voies sismiques : les zones frappent plus fort, et coûtent d'autant.
  const surcoutZone = zone ? reglagePassif(j, 'bonusZone', 0) : 0;
  const cout = Math.round(coutMpDe(comp, s, j.maxMp)
    * (1 + surcoutZone + reglagePassif(j, 'surcoutMana', 0)));
  // Une relance offerte par une Voie ne se paie ni en mana ni en recharge.
  if (!relance) {
    if (j.mp >= cout) j.mp -= cout;
    else if (!payerSortEnSang(j, cout)) {
      // L'interface interdit ce clic — mais une action distante (ou un
      // client modifié) pouvait lancer n'importe quoi pour 1 PM. Le
      // moteur est la seule vraie porte : elle refuse.
      journal(`💧 ${j.nom} n'a pas assez de mana pour ${comp.nom} !`);
      return 'refus';
    }
    if (comp.cooldown) j.cooldowns[compId] = comp.cooldown;
  }

  // v22 — Deux passifs récompensent le RÉPERTOIRE plutôt que la
  // répétition : l'Élémentaliste veut de l'alternance, le Runemaître de
  // la variété. Les deux se lisent sur ce que le héros a déjà lancé.
  j.avantDernierSort = j.dernierSort;
  j.dernierSort = compId;
  if (!j.sortsDuCombat) j.sortsDuCombat = [];
  if (!j.sortsDuCombat.includes(compId)) j.sortsDuCombat.push(compId);

  // Rang de maîtrise (compétences signatures) : +15 % par rang.
  const multRang = 1 + 0.15 * rangDe(j, compId);

  if (comp.type === 'degats') {
    const cibles = comp.cible === 'ennemis' ? cb.monstres.filter((m) => !m.mort) : [cible];
    journal(`${comp.emoji} ${j.nom} utilise ${comp.nom}${multRang > 1 ? ` (rang ${rangDe(j, compId)})` : ''} !`);
    // Vibrelame : ses enchaînements portent parfois un coup de plus.
    let coups = comp.coups || 1;
    const chanceSupp = reglagePassif(j, 'chanceCoupSupp', 0);
    if (coups > 1 && chanceSupp > 0 && Math.random() < chanceSupp) {
      coups++;
      journal(`〰️ L'acier de ${j.nom} chante : un coup de plus !`);
    }
    // Voltigeur du Vent : chaque attaque part en salve.
    const coupsSupp = reglagePassif(j, 'coupsSupp', 0);
    const partSupp = reglagePassif(j, 'partCoupsSupp', 1);
    cibles.forEach((c) => {
      // Certaines compétences frappent plusieurs fois (rafale de coups).
      for (let coup = 0; coup < coups + coupsSupp; coup++) {
        if (estMort(c)) break;
        const part = coup < coups ? 1 : partSupp;
        const brut = (comp.puissance + statDeCompetence(comp, s) * comp.ratio) * multRang * part;
        const r = infligerDegats(j, c, brut, {
          critBonus: comp.critBonus || 0, magique: estSortMagique(comp), compId, zone, coupIndex: coup,
        });
        journal(`→ ${c.nom} subit ${texteDegats(r)}`);
        moissonDuFaucheur(j, r.degats);   // Faucheur : tous ses sorts le nourrissent
        eclabousserSelonLaVoie(j, c, r.degats, comp);   // Danselame, Chaman
        gererMort(c);
        executerSiMoribonde(j, c);        // Faucheur : et il achève les moribonds
        // Le drain soigne le lanceur même si le coup achève la cible ;
        // les autres effets (poison, étourdissement…) ne s'appliquent
        // qu'aux vivants — et une seule fois par lancer, pas par coup.
        if (comp.effet && (comp.effet.type === 'drain' || (coup === 0 && !estMort(c)))) {
          appliquerEffet(j, c, comp.effet, r, comp);
        }
      }
      // Vibrelame du Silence : ses zones assomment ce qu'elles touchent.
      const silence = zone ? reglagePassif(j, 'etourdiSurZone', 0) : 0;
      if (silence && !estMort(c) && Math.random() < silence) {
        appliquerEffet(j, c, { type: 'etourdi', duree: 1, chance: 1 }, null, comp);
      }
    });
  } else if (comp.type === 'soin') {
    const cibles = comp.cible === 'allies' ? cb.equipe.filter((x) => !x.ko) : [cible];
    const brutSoin = (comp.puissance + statDeCompetence(comp, s) * comp.ratio) * multRang;
    cibles.forEach((c) => {
      const soin = soigner(c, brutSoin, j);
      journal(soin > 0
        ? `${comp.emoji} ${j.nom} rend ${soin} PV à ${c === j ? 'lui-même' : c.nom}.`
        : `${comp.emoji} ${j.nom} soigne ${c === j ? 'lui-même' : c.nom}… déjà au maximum.`);
      if (comp.effet) appliquerEffet(j, c, comp.effet, null, comp);
    });
    // Oracle du Verbe : un soin sur une seule tête arrose quand même
    // toute l'équipe.
    const echo = comp.cible === 'allies' ? 0 : reglagePassif(j, 'soinMonoVersEquipe', 0);
    if (echo) {
      cb.equipe.filter((x) => !estMort(x) && !cibles.includes(x)).forEach((x) => {
        soigner(x, brutSoin * echo, j);
      });
      journal(`🌇 Le Verbe porte : toute l'équipe reçoit ${Math.round(echo * 100)} % du soin.`);
    }
  } else {
    // Utilitaire : sur soi, un allié, ou tout le groupe (aura, chant…)
    const cibles = comp.cible === 'allies' ? cb.equipe.filter((x) => !x.ko) : [cible || j];
    if (comp.cible === 'allies') journal(`${comp.emoji} ${j.nom} utilise ${comp.nom} !`);
    cibles.forEach((c) => appliquerEffet(j, c, comp.effet, null, comp));
  }

  // Voie de l'Écho, Voie du Satiriste : la compétence se rejoue, gratuite.
  const relanceVoie = reglagePassif(j, 'relanceGratuite', 0);
  if (!relance && relanceVoie && !cb.termine && Math.random() < relanceVoie) {
    const encore = comp.cible === 'ennemi'
      ? ((cible && !estMort(cible)) ? cible : cb.monstres.find((m) => !m.mort))
      : cible;
    journal(`🔁 L'écho reprend ${comp.nom} — gratuitement.`);
    lancerCompetence(j, compId, encore || cible, true);
  }
}

// =====================================================================
// v15 — Invocations : une créature appelée qui combat toute seule.
// Une par héros, 4 compétences payées en mana (ou en PV quand le mana
// manque), stats bridées à celles du maître, 50 % de son mana à
// l'apparition — et elle reste jusqu'à sa mort ou la fin du combat.
// =====================================================================
function lancerInvocation(j, compId) {
  const cb = etat.combat;
  const comp = COMPETENCES[compId];
  // v16 : les invocations traversent désormais les expéditions en ligne —
  // le chef héberge la simulation, la créature vit sur son écran.
  // v15.2 : l'Invocateur, maître des liens, entretient DEUX créatures à
  // la fois — tout autre héros n'en contrôle qu'une. (v19 : l'Invocateur
  // est devenu une SOUS-classe d'Arcaniste — tester p.classe ne matchait
  // plus jamais, et son passif emblématique était silencieusement mort.)
  // v22 : la limite est un réglage de passif — l'Invocateur en tient deux,
  // le Chaman aussi (ses totems), tout le monde une seule.
  const limite = reglagePassif(j, 'limiteInvocations', 1);
  const vivantes = cb.equipe.filter((x) => x.type === 'invocation' && x.maitre === j.bid && !estMort(x));
  if (vivantes.length >= limite) {
    journal(limite > 1
      ? `🐾 ${j.nom} tient déjà ${vivantes.map((x) => x.nom).join(' et ')} — même lui s'arrête à ${limite} !`
      : `🐾 ${j.nom} a déjà ${vivantes[0].nom} au combat — une seule invocation par héros !`);
    return;
  }
  const coutInvocation = coutMpDe(comp, statsEffectives(j), j.maxMp);
  if (j.mp >= coutInvocation) j.mp -= coutInvocation;
  else if (!payerSortEnSang(j, coutInvocation)) {
    journal(`💧 ${j.nom} n'a pas assez de mana pour ${comp.nom} !`);
    return 'refus';
  }
  if (comp.cooldown) j.cooldowns[compId] = comp.cooldown;

  const modele = INVOCATIONS[comp.invocation];
  const sm = statsEffectives(j);
  // Les stats de la créature sont des fractions de celles du maître —
  // et ne peuvent JAMAIS les dépasser.
  // « Meute » : les créatures de l'Invocateur sont plus fortes que celles
  // de tout le monde — c'est tout son passif, et il déborde volontairement
  // le plafond « jamais plus fort que le maître » qui vaut pour les autres.
  const multMeute = reglagePassif(j, 'multInvocation', 1);
  const stats = {};
  Object.keys(CARACS).forEach((cle) => {
    const voulu = Math.round((sm[cle] || 0) * modele.stats[cle]);
    stats[cle] = Math.max(1, Math.round(Math.min(voulu, sm[cle] || 1) * multMeute));
  });
  const maxHp = Math.max(10, Math.round(j.maxHp * modele.pvPct * multMeute));
  const maxMp = Math.max(4, Math.round(j.maxMp * 0.5)); // 50 % du mana du maître, la règle

  const inv = {
    type: 'invocation',
    invocation: true,
    modele: comp.invocation,   // v20.1 : sa ligne de combat se lit dessus
    maitre: j.bid,
    nom: `${modele.nom} de ${j.nom}`,
    emoji: modele.emoji,
    avatar: modele.emoji,
    niveau: j.niveau,
    stats,
    dex: stats.dex,
    hp: maxHp, maxHp,
    mp: maxMp, maxMp,
    // Voie du Lien : la créature se bat avec les compétences de son maître
    // plutôt qu'avec les siennes.
    competences: reglagePassif(j, 'invocationsCopient', false)
      ? j.competences.filter((id) => COMPETENCES[id] && COMPETENCES[id].type !== 'invocation')
      : [...modele.competences],
    cooldowns: {},
    statuts: [],
    defense: false,
    ko: false,
    mort: false,
    race: null,
  };
  inv.ligne = ligneParDefaut(inv); // v16 : la créature rejoint sa ligne naturelle
  cb.equipe.push(inv);
  cb.file.push(inv); // elle agit dès cette manche, en fin de file
  const nuance = multMeute > 1 ? `renforcées ×${String(multMeute).replace('.', ',')} par son passif`
    : (multMeute < 1 ? `à ${Math.round(multMeute * 100)} % — la meute se partage la puissance` : 'bridées aux siennes');
  journal(`${comp.emoji} ${j.nom} invoque ${modele.emoji} ${modele.nom} ! (stats ${nuance}, 50 % de son mana — elle combattra seule jusqu'à sa mort ou la fin du combat)`);
}

// Le tour d'une invocation : elle choisit toute seule, au hasard, parmi
// ses compétences prêtes — et paie en PV quand son mana ne suffit plus.
function tourInvocation(c) {
  const cb = etat.combat;
  const monstresVivants = cb.monstres.filter((m) => !m.mort);
  if (monstresVivants.length === 0) return;
  const s = c.stats;

  const pretes = c.competences.filter((id) => (c.cooldowns[id] || 0) <= 0);
  const utilisables = pretes.filter((id) => {
    const comp = COMPETENCES[id];
    // Ne soigne que si quelqu'un en a besoin.
    if (comp.type === 'soin' && !cb.equipe.some((x) => !estMort(x) && x.hp < x.maxHp * 0.85)) return false;
    const cout = coutMpDe(comp, s, c.maxMp);
    return c.mp >= cout || c.hp > cout * 2;
  });
  const choix = utilisables.length ? utilisables[alea(0, utilisables.length - 1)] : null;

  if (!choix) {
    // À sec et sans rien de prêt : un coup de griffe basique.
    const cible = monstresVivants[alea(0, monstresVivants.length - 1)];
    const r = infligerDegats(c, cible, 4 + (s.for + s.dex) * 0.8);
    journal(`🐾 ${c.nom} attaque ${cible.nom} : ${texteDegats(r)}`);
    gererMort(cible);
    return;
  }

  const comp = COMPETENCES[choix];
  if (comp.cooldown) c.cooldowns[choix] = comp.cooldown;
  const coutInv = coutMpDe(comp, s, c.maxMp);
  if (c.mp >= coutInv) {
    c.mp -= coutInv;
  } else {
    const sang = Math.max(1, coutInv * 2);
    c.hp = Math.max(1, c.hp - sang);
    journal(`🩸 ${c.nom} n'a plus de mana : la créature paie ${sang} PV de sa propre essence.`);
  }

  if (comp.type === 'degats') {
    const cibles = comp.cible === 'ennemis'
      ? monstresVivants
      : [monstresVivants[alea(0, monstresVivants.length - 1)]];
    journal(`${comp.emoji} ${c.nom} utilise ${comp.nom} !`);
    cibles.forEach((m) => {
      for (let coup = 0; coup < (comp.coups || 1); coup++) {
        if (estMort(m)) break;
        const brut = comp.puissance + statDeCompetence(comp, s) * comp.ratio;
        const r = infligerDegats(c, m, brut, { critBonus: comp.critBonus || 0, magique: estSortMagique(comp) });
        journal(`→ ${m.nom} subit ${texteDegats(r)}`);
        gererMort(m);
        if (comp.effet && (comp.effet.type === 'drain' || (coup === 0 && !estMort(m)))) appliquerEffet(c, m, comp.effet, r, comp);
      }
    });
  } else if (comp.type === 'soin') {
    const vivants = cb.equipe.filter((x) => !estMort(x));
    const cibles = comp.cible === 'allies'
      ? vivants
      : (comp.cible === 'soi' ? [c] : [[...vivants].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]]);
    cibles.forEach((x) => {
      const soin = soigner(x, comp.puissance + statDeCompetence(comp, s) * comp.ratio);
      journal(`${comp.emoji} ${c.nom} rend ${soin} PV à ${x === c ? 'lui-même' : x.nom}.`);
      if (comp.effet) appliquerEffet(c, x, comp.effet, null, comp);
    });
  } else {
    const vivants = cb.equipe.filter((x) => !estMort(x));
    const cibles = comp.cible === 'allies'
      ? vivants
      : (comp.cible === 'allie' ? [vivants[alea(0, vivants.length - 1)]] : [c]);
    journal(`${comp.emoji} ${c.nom} utilise ${comp.nom} !`);
    cibles.forEach((x) => appliquerEffet(c, x, comp.effet, null, comp));
  }
}

// Applique l'effet d'un consommable pendant un combat.
function utiliserObjetEnCombat(j, objet) {
  const cb = etat.combat;
  const effet = objet.effet;
  // Contrainte divine de mêlée : il ne compte que sur lui-même — aucune
  // potion de soin ou de mana ne passe ses lèvres en combat.
  if (['pv', 'pm', 'soin-groupe', 'regen'].includes(effet.type)
    && reglagePassif(j, 'potionsInterdites', false)) {
    journal(`🚫 L'Éveil de ${j.nom} lui interdit les potions : la fiole reste pleine.`);
    return;
  }
  if (effet.type === 'pv') {
    const soin = Math.min(effet.valeur, j.maxHp - j.hp);
    j.hp += soin;
    journal(`${objet.emoji} ${j.nom} boit ${objet.nom} : +${soin} PV.`);
  } else if (effet.type === 'pm') {
    const gain = Math.min(effet.valeur, j.maxMp - j.mp);
    j.mp += gain;
    journal(`${objet.emoji} ${j.nom} boit ${objet.nom} : +${gain} PM.`);
  } else if (effet.type === 'antidote') {
    j.statuts = j.statuts.filter((st) => st.type !== 'poison');
    journal(`${objet.emoji} ${j.nom} boit un antidote : le poison se dissipe.`);
  } else if (effet.type === 'elixir-benediction') {
    poserStatut(j, { type: 'benediction', duree: effet.duree });
    journal(`${objet.emoji} ${j.nom} boit ${objet.nom} : +30 % de dégâts pendant ${effet.duree} tours !`);
  } else if (effet.type === 'soin-groupe') {
    journal(`${objet.emoji} ${j.nom} déploie ${objet.nom} !`);
    cb.equipe.filter((x) => !x.ko).forEach((allie) => {
      const soin = Math.min(effet.valeur, allie.maxHp - allie.hp);
      if (soin > 0) {
        allie.hp += soin;
        journal(`→ ${allie.nom} récupère ${soin} PV.`);
      }
    });
  } else if (effet.type === 'regen') {
    poserStatut(j, { type: 'regen', duree: effet.duree, valeur: effet.valeur });
    journal(`${objet.emoji} ${j.nom} boit ${objet.nom} : ${effet.valeur} PV régénérés par tour pendant ${effet.duree} tours.`);
  } else if (effet.type === 'bouclier') {
    poserStatut(j, { type: 'bouclier', duree: effet.duree, valeur: effet.valeur });
    journal(`${objet.emoji} ${j.nom} boit ${objet.nom} : un bouclier de ${effet.valeur} points l'enveloppe.`);
  } else if (effet.type === 'purge') {
    j.statuts = j.statuts.filter((st) => !['poison', 'affaibli', 'etourdi'].includes(st.type));
    journal(`${objet.emoji} ${j.nom} boit ${objet.nom} : les maux se dissipent.`);
  } else if (effet.type === 'fuite') {
    journal(`${objet.emoji} ${j.nom} jette la ${objet.nom} au sol : le groupe disparaît dans un nuage !`);
    return 'fuite';
  } else if (effet.type === 'fortune') {
    poserStatut(j, { type: 'fortune', duree: 99 });
    journal(`${objet.emoji} ${j.nom} frotte son ${objet.nom} : la chance sourit à l'équipe ! (+30 % de butin)`);
  } else if (effet.type === 'bombe') {
    journal(`${objet.emoji} ${j.nom} lance une ${objet.nom} sur les ennemis !`);
    cb.monstres.filter((m) => !m.mort).forEach((m) => {
      const r = infligerDegats(j, m, effet.valeur, { bombe: true });
      journal(`→ ${m.nom} subit ${texteDegats(r)}`);
      gererMort(m);
      if (!estMort(m) && Math.random() < (effet.chanceEtourdi || 0)) {
        poserStatut(m, { type: 'etourdi', duree: 1 });
        journal(`💫 ${m.nom} est étourdi !`);
      }
      if (!estMort(m) && Math.random() < (effet.chanceAffaibli || 0)) {
        poserStatut(m, { type: 'affaibli', duree: 2 });
        journal(`⬇️ ${m.nom} est affaibli par l'acide !`);
      }
    });
  }
}

// =====================================================================
// Tour des monstres
// =====================================================================
function choisirCibleJoueur(joueursVivants) {
  const provocateurs = joueursVivants.filter((x) => x.statuts.some((s) => s.type === 'provocation'));
  const candidats = provocateurs.length > 0 ? provocateurs : joueursVivants;
  const ponderes = candidats.map((x) => ({ x, poids: 1 + 2 * (1 - x.hp / x.maxHp) }));
  return tirageAuPoids(ponderes).x;
}

// Voie de la Terreur : un ennemi terrorisé frappe l'un des siens. On
// tire une seule fois par tour de monstre, et seulement s'il a un voisin.
function terroriser(m) {
  const cb = etat.combat;
  if (!cb) return false;
  // La fiche dit « un ennemi TERRORISÉ » : la terreur ne prend que sur une
  // cible déjà entravée — rongée par au moins un état — jamais sur un monstre sain.
  if (!estEntravee(m)) return false;
  const semeur = cb.equipe.find((x) => !estMort(x) && reglagePassif(x, 'terreur', 0) > 0);
  if (!semeur || Math.random() >= reglagePassif(semeur, 'terreur', 0)) return false;
  const voisins = cb.monstres.filter((x) => x !== m && !x.mort);
  if (!voisins.length) return false;
  const victime = voisins[alea(0, voisins.length - 1)];
  const r = infligerDegats(m, victime, m.atk);
  journal(`😱 ${m.nom} est terrorisé et frappe ${victime.nom} : ${texteDegats(r)}`);
  gererMort(victime);
  return true;
}

function tourMonstre(m) {
  const cb = etat.combat;
  const joueursVivants = cb.equipe.filter((x) => !x.ko);
  if (joueursVivants.length === 0) return;
  if (terroriser(m)) return;

  const monstresVivants = cb.monstres.filter((x) => !x.mort);
  const blesses = monstresVivants.filter((x) => x.hp < x.maxHp * 0.6);
  const possibles = m.attaques.filter((a) => a.type !== 'soin' || blesses.length > 0);
  const att = tirageAuPoids(possibles);

  if (att.type === 'soin') {
    const cible = [...blesses].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    const soin = soigner(cible, att.valeur);
    journal(`${att.emoji} ${m.nom} utilise ${att.nom} : ${cible.nom} récupère ${soin} PV.`);
  } else if (att.type === 'aoe') {
    journal(`${att.emoji} ${m.nom} utilise ${att.nom} sur tout le groupe !`);
    joueursVivants.forEach((jv) => {
      const r = infligerDegats(m, jv, m.atk * att.mult);
      journal(`→ ${jv.nom} subit ${texteDegats(r)}`);
      gererMort(jv);
      // L'effet annoncé (poison, étourdissement…) frappe chaque survivant :
      // 43 attaques de zone du bestiaire le portaient sans jamais l'appliquer.
      if (att.effet && !estMort(jv)) appliquerEffet(m, jv, att.effet, r);
    });
  } else {
    const cible = choisirCibleJoueur(joueursVivants);
    const r = infligerDegats(m, cible, m.atk * att.mult);
    journal(`${att.emoji} ${m.nom} utilise ${att.nom} sur ${cible.nom} : ${texteDegats(r)}`);
    gererMort(cible);
    if (att.effet && !estMort(cible)) appliquerEffet(m, cible, att.effet, r);
  }
}

// =====================================================================
// Affichage du combat
// =====================================================================
function journal(message) {
  const cb = etat.combat;
  if (!cb) return;
  cb.journalLignes.push(message);
  if (cb.journalLignes.length > 100) cb.journalLignes.shift();
  rendreJournal();
}

function rendreJournal() {
  const cb = etat.combat;
  const zone = el('combat-log');
  zone.innerHTML = '';
  cb.journalLignes.forEach((ligne) => {
    const div = document.createElement('div');
    div.className = 'ligne-journal' + (ligne.startsWith('—') ? ' ligne-manche' : '');
    div.textContent = ligne;
    zone.appendChild(div);
  });
  zone.scrollTop = zone.scrollHeight;
}

// La file d'initiative de la manche, toujours visible : chacun voit
// quand son tour arrive (et que personne ne le lui vole).
function rendreOrdreInitiative(cb) {
  const zone = el('combat-ordre');
  if (!zone) return;
  const aVenir = [cb.actif, ...(cb.file || [])].filter((c) => c && !estMort(c));
  if (cb.termine || aVenir.length === 0) { zone.innerHTML = ''; return; }
  zone.innerHTML = '⏱️ Ordre de la manche : ' + aVenir
    .map((c, i) => `<span class="ordre-combattant${i === 0 ? ' ordre-actif' : ''}${c.type === 'joueur' ? ' ordre-joueur' : ''}"
      title="${echapper(c.nom)}">${echapper(c.type === 'joueur' ? c.avatar : c.emoji)}</span>`)
    .join('<span class="ordre-fleche">→</span>');
}

function rendreCombat() {
  const cb = etat.combat;
  if (!cb) return;
  rendreOrdreInitiative(cb);
  // Le défilement horizontal des rangées (mobile) survit au re-rendu.
  const zoneE = el('zone-ennemis');
  const defilE = zoneE.scrollLeft;
  zoneE.innerHTML = '';
  cb.monstres.forEach((m) => zoneE.appendChild(carteCombattant(m)));
  zoneE.scrollLeft = defilE;
  const zoneJ = el('zone-joueurs');
  const defilJ = zoneJ.scrollLeft;
  zoneJ.innerHTML = '';
  // v16 : l'équipe se déploie sur deux lignes — avant et arrière.
  const arriere = cb.equipe.filter((x) => x.ligne === 'arriere');
  if (arriere.length === 0) {
    cb.equipe.forEach((j) => zoneJ.appendChild(carteCombattant(j)));
  } else {
    [['avant', '⚔️ Ligne avant', cb.equipe.filter((x) => x.ligne !== 'arriere')],
      ['arriere', '🏹 Ligne arrière · physique −40 % (donné et subi)', arriere]]
      .forEach(([, libelle, groupe]) => {
        const bloc = document.createElement('div');
        bloc.className = 'ligne-combat';
        bloc.innerHTML = `<div class="libelle-ligne">${libelle}</div>`;
        const rangee = document.createElement('div');
        rangee.className = 'rangee-cartes combat-rangee';
        groupe.forEach((j) => rangee.appendChild(carteCombattant(j)));
        bloc.appendChild(rangee);
        zoneJ.appendChild(bloc);
      });
  }
  zoneJ.scrollLeft = defilJ;
  rendreJournal();
  // En mode ciblage, amener la première cible en vue.
  if (cb.cibleEnAttente) {
    const premiere = document.querySelector('.carte-combattant.ciblable');
    if (premiere && premiere.scrollIntoView) {
      premiere.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }
}

function cibleValide(c) {
  const cb = etat.combat;
  if (!cb.cibleEnAttente) return false;
  const { action } = cb.cibleEnAttente;
  const comp = action.compId ? COMPETENCES[action.compId] : null;
  const cibleType = action.genre === 'attaque' ? 'ennemi' : comp.cible;
  if (cibleType === 'ennemi') return c.type === 'monstre' && !c.mort;
  if (cibleType === 'allie') return (c.type === 'joueur' || c.type === 'invocation') && !estMort(c);
  return false;
}

function carteCombattant(c) {
  const cb = etat.combat;
  const carte = document.createElement('div');
  const mort = estMort(c);
  carte.className = 'carte-combattant'
    + (c.type === 'monstre' ? ' ennemi' : ' allie')
    + (c.boss ? ' carte-boss' : '')
    + (cb.actif === c && !cb.termine ? ' tour-actif' : '')
    + (mort ? ' mort' : '');

  const pctHp = Math.max(0, Math.round((c.hp / c.maxHp) * 100));
  const statuts = c.statuts
    .map((s) => `<span title="${libelleStatut(s)}">${EMOJI_STATUT[s.type]}</span>`)
    .join('');
  const defense = c.defense ? '<span title="En garde">🛡️</span>' : '';

  let barres = `
    <div class="barre pv"><div class="remplissage" style="width:${pctHp}%"></div>
      <span>${c.hp}/${c.maxHp}</span></div>`;
  if (c.type === 'joueur' || c.type === 'invocation') {
    const pctMp = Math.max(0, Math.round((c.mp / c.maxMp) * 100));
    barres += `
    <div class="barre pm"><div class="remplissage" style="width:${pctMp}%"></div>
      <span>${c.mp}/${c.maxMp}</span></div>`;
  }

  carte.innerHTML = `
    <div class="combattant-avatar">${echapper(c.type === 'joueur' ? c.avatar : c.emoji)}</div>
    <div class="combattant-nom">${echapper(c.nom)} <span class="niveau">niv. ${c.niveau}</span></div>
    ${barres}
    <div class="combattant-statuts">${statuts}${defense}${mort ? (c.type === 'joueur' ? '😵 KO' : '☠️') : ''}</div>`;

  if (!mort && cibleValide(c)) {
    carte.classList.add('ciblable');
    rendreCliquable(carte, () => {
      if (!cb.cibleEnAttente) return;
      const { joueur, action } = cb.cibleEnAttente;
      cb.cibleEnAttente = null;
      if (cb.distant) envoyerActionGroupe(action, c);
      else executerAction(joueur, action, c);
    });
  }

  return carte;
}
