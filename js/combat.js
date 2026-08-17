'use strict';

// =====================================================================
// Moteur de combat tour par tour : initiative, tours des joueurs et des
// monstres, dégâts, soins, effets de statut, objets, fuite.
// Genres de combat : exploration, embuscade, boss (de zone), bossMonde.
// =====================================================================

const EMOJI_STATUT = {
  poison: '🧪', etourdi: '💫', bouclier: '🛡️',
  benediction: '🙏', provocation: '😤', regen: '💧', affaibli: '⬇️',
  fortune: '🍀',
};

const NOM_STATUT = {
  poison: 'Empoisonné', etourdi: 'Étourdi', bouclier: 'Bouclier',
  benediction: 'Bénédiction (+30 % dégâts)', provocation: 'Provocation',
  regen: 'Régénération', affaibli: 'Affaibli (−30 % dégâts)',
  fortune: 'Fortune (+30 % de butin)',
};

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
  return aPassif(c, 'Ligne de tir');
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
  c.elan = Math.min(ELAN_MAX, (c.elan || 0) + 1);
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
  const rendu = Math.max(1, Math.round(degats * PART_GRAVURE));
  const avant = source.hp;
  source.hp = Math.min(source.maxHp, source.hp + rendu);
  if (source.hp > avant) journal(`🌑 Gravure : ${source.nom} reprend ${source.hp - avant} PV à sa cible.`);
}

// Devin : ce qui déborde d'un soin ne se perd pas — il se fige en bouclier
// sur la cible. Soigner quelqu'un à pleine vie cesse d'être un tour gâché.
function surplusDeSoin(source, cible, surplus) {
  if (surplus <= 0 || !aPassif(source, 'Clairvoyance')) return;
  const existant = cible.statuts.find((s) => s.type === 'bouclier');
  const valeur = Math.round(surplus);
  if (existant) existant.valeur += valeur;
  else cible.statuts.push({ type: 'bouclier', duree: 3, valeur });
  journal(`✨ Le surplus de soin se fige en bouclier sur ${cible.nom} (+${valeur}).`);
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
  if (c.type === 'monstre') return (c.dex || 0) * 2 + alea(1, 10);
  const base = statDe(c, 'dex') * 2 + alea(1, 10);
  if (c.type !== 'joueur') return base;
  return Math.round(base * (1 + sousCarac(statsEffectives(c), 'celerite')));
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
      traiterMecaniquesManche(cb);
    }

    const c = cb.file.shift();
    if (estMort(c)) continue;
    cb.actif = c;

    const debut = debutTour(c);
    rendreCombat();
    if (verifierFin()) break;
    if (estMort(c)) continue; // mort au poison pendant son propre tour

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

  const poison = c.statuts.find((s) => s.type === 'poison');
  if (poison) {
    // La contribution au boss du monde est bornée aux PV restants (pas d'overkill).
    if (c.type === 'monstre' && cb.genre === 'bossMonde') {
      cb.degatsBossMonde += Math.min(poison.valeur, Math.max(0, c.hp));
    }
    c.hp -= poison.valeur;
    journal(`🧪 ${c.nom} souffre du poison : ${poison.valeur} dégâts.`);
    gererMort(c);
  }
  if (estMort(c)) return { skip: true };

  const regen = c.statuts.find((s) => s.type === 'regen');
  if (regen && c.hp < c.maxHp) {
    const soin = Math.min(regen.valeur, c.maxHp - c.hp);
    c.hp += soin;
    journal(`💧 ${c.nom} régénère ${soin} PV.`);
  }

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
  c.statuts = c.statuts.filter((s) => s.duree > 0 && !(s.type === 'bouclier' && s.valeur <= 0));

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
  let d = varie(brut);
  // v19 : le ciel entre dans l'équation. Sous la pluie le feu prend mal,
  // sous l'orage la foudre porte. Le physique reste neutre — le temps
  // qu'il fait ne change rien à un coup d'épée.
  if (options.element) d *= multElementMonde(options.element);
  d *= bonusElan(source);            // « Élan » : chaque coup nourrit le suivant
  d *= bonusRempart(source);         // « Rempart » : provoquer, c'est frapper
  if (source.statuts.some((s) => s.type === 'benediction')) d *= 1.3;
  if (source.statuts.some((s) => s.type === 'affaibli')) d *= 0.7;
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
  let chanceCrit = 0.05 + (options.critBonus || 0);
  let chanceDirect = 0;
  if (source.type === 'joueur') {
    const s = statsEffectives(source);
    chanceCrit += sousCarac(s, 'crit');
    chanceDirect = sousCarac(s, 'direct');
    d *= 1 + sousCarac(s, 'deter');
    if (source.race === 'elfe') chanceCrit += 0.05; // Précision millénaire
  }
  const crit = Math.random() < chanceCrit;
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
  d *= resistanceDeClasse(cible);
  // La nuit, ce qui rôde frappe plus fort — c'est le prix du butin majoré.
  if (source.type === 'monstre' && cible.type === 'joueur') {
    d *= (mondeMaintenant().effets.degatsSubis || 1);
  }
  if (cible.defense) d *= 0.5;
  if (cible.race === 'nain') d *= 0.9; // Peau de pierre
  // v16 : les lignes de combat — un coup PHYSIQUE perd 40 % quand il part
  // de la ligne arrière ou qu'il la vise. La magie ignore les lignes.
  if (!options.magique) {
    // « Ligne de tir » : le Franc-tireur travaille de loin, sans pénalité.
    if (source.ligne === 'arriere' && !ignoreMalusDeLigne(source)) d *= 0.6;
    if (cible.ligne === 'arriere') d *= 0.6;
  }
  d = Math.max(1, Math.round(d));

  let absorbe = 0;
  const bouclier = cible.statuts.find((s) => s.type === 'bouclier' && s.valeur > 0);
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
  cible.hp -= d;
  nourrirElan(source);
  draineDeGravure(source, d);
  // Neuf vies (félin) : survit une fois par combat à un coup fatal.
  if (cible.type === 'joueur' && cible.race === 'felin' && cible.hp <= 0 && !cible.neufViesUtilisees) {
    cible.neufViesUtilisees = true;
    cible.hp = 1;
    journal(`🐱 ${cible.nom} retombe sur ses pattes : Neuf vies le laisse à 1 PV !`);
  }
  return { degats: d, crit, direct, absorbe };
}

function texteDegats(r) {
  let t = `${r.degats} dégâts`;
  if (r.crit) t += ' 💥 CRITIQUE !';
  else if (r.direct) t += ' 🎲 coup direct !';
  if (r.absorbe > 0) t += ` (${r.absorbe} absorbés par le bouclier)`;
  return t;
}

function soigner(cible, brut, source) {
  const soin = Math.max(1, Math.round(varie(brut)));
  const avant = cible.hp;
  cible.hp = Math.min(cible.maxHp, cible.hp + soin);
  // « Clairvoyance » : ce qui dépasse les points de vie maximum ne tombe
  // pas dans le vide, il se fige en bouclier.
  if (source) surplusDeSoin(source, cible, soin - (cible.hp - avant));
  return cible.hp - avant || soin;
}

function gererMort(c) {
  if (c.hp > 0 || estMort(c)) return;
  c.hp = 0;
  c.statuts = [];
  if (c.type === 'invocation') {
    c.mort = true;
    c.ko = true;
    journal(`🌫️ ${c.nom} se dissipe — l'invocation est brisée.`);
  } else if (c.type === 'joueur') {
    c.ko = true;
    journal(`😵 ${c.nom} s'effondre ! (KO)`);
  } else {
    c.mort = true;
    journal(`☠️ ${c.nom} est vaincu !`);
  }
}

function poserStatut(cible, statut) {
  cible.statuts = cible.statuts.filter((s) => s.type !== statut.type);
  cible.statuts.push(statut);
}

function appliquerEffet(source, cible, effet, resultatDegats, comp) {
  switch (effet.type) {
    case 'poison': {
      const valeur = effet.degats != null
        ? effet.degats
        : Math.round(3 + statDe(source, effet.stat || 'dex') * (effet.stat === 'int' ? 0.5 : 0.6));
      poserStatut(cible, { type: 'poison', duree: effet.duree, valeur });
      journal(`🧪 ${cible.nom} est empoisonné (${valeur} dégâts par tour, ${effet.duree} tours).`);
      break;
    }
    case 'affaibli': {
      poserStatut(cible, { type: 'affaibli', duree: effet.duree });
      journal(`⬇️ ${cible.nom} est affaibli : −30 % de dégâts pendant ${effet.duree} tours.`);
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
      if (Math.random() < (effet.chance != null ? effet.chance : 1)) {
        // La source est mémorisée pour que le « passe son tour » dise QUI a étourdi.
        poserStatut(cible, { type: 'etourdi', duree: effet.duree, source: source.nom });
        journal(`💫 ${cible.nom} est étourdi par ${source.nom} !`);
      } else {
        journal(`${cible.nom} résiste à l'étourdissement.`);
      }
      break;
    }
    case 'bouclier': {
      const valeur = valeurBouclier(statsEffectives(source), effet, comp);
      poserStatut(cible, { type: 'bouclier', duree: effet.duree, valeur });
      journal(`🛡️ ${cible.nom} est protégé par un bouclier (${valeur} points).`);
      break;
    }
    case 'benediction': {
      poserStatut(cible, { type: 'benediction', duree: effet.duree });
      journal(`🙏 ${cible.nom} est béni : +30 % de dégâts pendant ${effet.duree} tours.`);
      break;
    }
    case 'provocation': {
      poserStatut(cible, { type: 'provocation', duree: effet.duree });
      const valeur = Math.round(4 + statDe(source, 'for'));
      poserStatut(cible, { type: 'bouclier', duree: effet.duree, valeur });
      journal(`😤 ${cible.nom} provoque les ennemis et se protège (${valeur} points de bouclier) !`);
      break;
    }
    case 'regen': {
      const valeur = valeurRegen(statsEffectives(source), effet, comp);
      poserStatut(cible, { type: 'regen', duree: effet.duree, valeur });
      journal(`💚 ${cible.nom} régénérera ${valeur} PV par tour pendant ${effet.duree} tours.`);
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

function rendreActions(j) {
  const cb = etat.combat;
  const zone = el('zone-actions');
  zone.innerHTML = '';

  const entete = document.createElement('div');
  entete.className = 'actions-entete';
  entete.innerHTML = `<span class="avatar-grand">${j.avatar}</span>
    <div>Au tour de <strong>${echapper(j.nom)}</strong>${cb.equipe.length > 1 ? ' — passe-lui l’écran !' : ''}<br>
    <span class="actions-vie">❤️ ${j.hp}/${j.maxHp} PV · 💧 ${j.mp}/${j.maxMp} PM</span></div>`;
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
  btnAttaque.innerHTML = '⚔️ <strong>Attaque</strong><span class="action-detail">Gratuite · dégâts légers</span>';
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
  btnLigne.innerHTML = `🔁 <strong>${versArriere ? 'Passer à l’arrière' : 'Passer à l’avant'}</strong><span class="action-detail">${versArriere ? 'Physique −40 % (donné ET subi)' : 'Pleine puissance, pleine exposition'} · consomme le tour</span>`;
  btnLigne.addEventListener('click', () => surActionChoisie(j, { genre: 'ligne' }));
  barre.appendChild(btnLigne);

  const statsJoueur = statsEffectives(j);
  j.competences.forEach((compId) => {
    const comp = COMPETENCES[compId];
    if (!comp) return;
    const btn = document.createElement('button');
    btn.className = 'btn-action competence';
    const cd = j.cooldowns[compId] || 0;
    const cout = coutMpDe(comp, statsJoueur, j.maxMp);
    // Détails chiffrés : dégâts/soins estimés, effets, coût, recharge.
    let detail = detailsCompetence(comp, statsJoueur, rangDe(j, compId), j.maxMp).join(' · ');
    if (cd > 0) detail = `⏳ Encore ${cd} tour${cd > 1 ? 's' : ''}`;
    else if (j.mp < cout) detail = `${cout} PM — pas assez de mana`;
    btn.innerHTML = `${comp.emoji} <strong>${comp.nom}</strong><span class="action-detail">${detail}</span>`;
    btn.title = comp.desc;
    btn.disabled = cd > 0 || j.mp < cout;
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
    if (objet.effet.type === 'fuite' && cb.genre !== 'exploration' && cb.genre !== 'embuscade') {
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
  if (action.genre === 'attaque') {
    const s = statsEffectives(j);
    // v20 : la meilleure caractéristique offensive, pas seulement FOR/DEX
    // — sans quoi un lanceur frappe à 9 quand un guerrier frappe à 161.
    const brut = degatsAttaqueDeBase(j, s);
    const r = infligerDegats(j, cible, brut);
    journal(`⚔️ ${j.nom} attaque ${cible.nom} : ${texteDegats(r)}`);
    gererMort(cible);
  } else if (action.genre === 'ligne') {
    // v16 : se déplacer est un tour à part entière.
    j.ligne = j.ligne === 'arriere' ? 'avant' : 'arriere';
    journal(`🔁 ${j.nom} se replace en ligne ${j.ligne === 'arriere' ? 'arrière (physique −40 %, donné et subi)' : 'avant'} !`);
  } else if (action.genre === 'defense') {
    j.defense = true;
    j.mp = Math.min(j.maxMp, j.mp + 3);
    journal(`🛡️ ${j.nom} se met en garde (+3 PM, dégâts subis réduits de moitié).`);
  } else if (action.genre === 'objet') {
    const objet = OBJETS[action.idObjet];
    if (objet && retirerObjet(j, action.idObjet, 1)) {
      const issueObjet = utiliserObjetEnCombat(j, objet);
      if (j.distant && cb.consosDistantes) {
        const conso = cb.consosDistantes[j.bid] = cb.consosDistantes[j.bid] || {};
        conso[action.idObjet] = (conso[action.idObjet] || 0) + 1;
      }
      sauvegarderLocal();
      if (issueObjet === 'fuite') return 'fuite';
    }
  } else if (action.genre === 'fuite') {
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
    lancerCompetence(j, action.compId, cible);
  }
  return null;
}

function executerAction(j, action, cible) {
  const cb = etat.combat;
  // Empêche un double-clic de jouer deux actions dans le même tour.
  if (!cb.finTour || cb.termine) return;
  const finir = cb.finTour;
  cb.finTour = null;

  const issue = executerActionCoeur(j, action, cible);
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

function lancerCompetence(j, compId, cible) {
  const cb = etat.combat;
  const comp = COMPETENCES[compId];
  if (comp.type === 'invocation') { lancerInvocation(j, compId); return; }
  const s = statsEffectives(j);
  j.mp = Math.max(0, j.mp - coutMpDe(comp, s, j.maxMp));
  if (comp.cooldown) j.cooldowns[compId] = comp.cooldown;

  // Rang de maîtrise (compétences signatures) : +15 % par rang.
  const multRang = 1 + 0.15 * rangDe(j, compId);

  if (comp.type === 'degats') {
    const cibles = comp.cible === 'ennemis' ? cb.monstres.filter((m) => !m.mort) : [cible];
    journal(`${comp.emoji} ${j.nom} utilise ${comp.nom}${multRang > 1 ? ` (rang ${rangDe(j, compId)})` : ''} !`);
    cibles.forEach((c) => {
      // Certaines compétences frappent plusieurs fois (rafale de coups).
      for (let coup = 0; coup < (comp.coups || 1); coup++) {
        if (estMort(c)) break;
        const brut = (comp.puissance + statDeCompetence(comp, s) * comp.ratio) * multRang;
        const r = infligerDegats(j, c, brut, { critBonus: comp.critBonus || 0, magique: comp.stat === 'int' });
        journal(`→ ${c.nom} subit ${texteDegats(r)}`);
        gererMort(c);
        // Le drain soigne le lanceur même si le coup achève la cible ;
        // les autres effets (poison, étourdissement…) ne s'appliquent qu'aux vivants.
        if (comp.effet && (comp.effet.type === 'drain' || !estMort(c))) {
          appliquerEffet(j, c, comp.effet, r, comp);
        }
      }
    });
  } else if (comp.type === 'soin') {
    const cibles = comp.cible === 'allies' ? cb.equipe.filter((x) => !x.ko) : [cible];
    cibles.forEach((c) => {
      const soin = soigner(c, (comp.puissance + statDeCompetence(comp, s) * comp.ratio) * multRang, j);
      journal(`${comp.emoji} ${j.nom} rend ${soin} PV à ${c === j ? 'lui-même' : c.nom}.`);
      if (comp.effet) appliquerEffet(j, c, comp.effet, null, comp);
    });
  } else {
    // Utilitaire : sur soi, un allié, ou tout le groupe (aura, chant…)
    const cibles = comp.cible === 'allies' ? cb.equipe.filter((x) => !x.ko) : [cible || j];
    if (comp.cible === 'allies') journal(`${comp.emoji} ${j.nom} utilise ${comp.nom} !`);
    cibles.forEach((c) => appliquerEffet(j, c, comp.effet, null, comp));
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
  const limite = j.sousClasse === 'invocateur' ? 2 : 1;
  const vivantes = cb.equipe.filter((x) => x.type === 'invocation' && x.maitre === j.bid && !estMort(x));
  if (vivantes.length >= limite) {
    journal(limite > 1
      ? `🐾 ${j.nom} tient déjà ${vivantes.map((x) => x.nom).join(' et ')} — même un Invocateur s'arrête à deux !`
      : `🐾 ${j.nom} a déjà ${vivantes[0].nom} au combat — une seule invocation par héros !`);
    return;
  }
  j.mp = Math.max(0, j.mp - coutMpDe(comp, statsEffectives(j), j.maxMp));
  if (comp.cooldown) j.cooldowns[compId] = comp.cooldown;

  const modele = INVOCATIONS[comp.invocation];
  const sm = statsEffectives(j);
  // Les stats de la créature sont des fractions de celles du maître —
  // et ne peuvent JAMAIS les dépasser.
  const stats = {};
  Object.keys(CARACS).forEach((cle) => {
    const voulu = Math.round((sm[cle] || 0) * modele.stats[cle]);
    stats[cle] = Math.max(1, Math.min(voulu, sm[cle] || 1));
  });
  const maxHp = Math.max(10, Math.round(j.maxHp * modele.pvPct));
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
    competences: [...modele.competences],
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
  journal(`${comp.emoji} ${j.nom} invoque ${modele.emoji} ${modele.nom} ! (stats bridées aux siennes, 50 % de son mana — elle combattra seule jusqu'à sa mort ou la fin du combat)`);
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
        const r = infligerDegats(c, m, brut, { critBonus: comp.critBonus || 0, magique: comp.stat === 'int' });
        journal(`→ ${m.nom} subit ${texteDegats(r)}`);
        gererMort(m);
        if (comp.effet && (comp.effet.type === 'drain' || !estMort(m))) appliquerEffet(c, m, comp.effet, r, comp);
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
      const r = infligerDegats(j, m, effet.valeur);
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

function tourMonstre(m) {
  const cb = etat.combat;
  const joueursVivants = cb.equipe.filter((x) => !x.ko);
  if (joueursVivants.length === 0) return;

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
      title="${echapper(c.nom)}">${c.type === 'joueur' ? c.avatar : c.emoji}</span>`)
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
    .map((s) => `<span title="${NOM_STATUT[s.type]}">${EMOJI_STATUT[s.type]}</span>`)
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
    <div class="combattant-avatar">${c.type === 'joueur' ? c.avatar : c.emoji}</div>
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
