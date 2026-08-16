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

// v16.3 : chacun combat à PLEINE puissance, en solo comme en groupe —
// le nivelage de la v16 est retiré, sur demande générale.
function statDe(source, cle) {
  if (source.type === 'joueur') return statsEffectives(source)[cle] || 0;
  if (source.type === 'invocation') return source.stats[cle] || 0;
  return 0;
}

// v16 : deux lignes de combat. Les lanceurs de sorts (Intelligence
// dominante) partent naturellement à l'arrière, les autres à l'avant.
function ligneParDefaut(c) {
  const s = c.type === 'invocation' ? c.stats : statsEffectives(c);
  return (s.int || 0) > (s.for || 0) && (s.int || 0) > (s.dex || 0) ? 'arriere' : 'avant';
}

// v19 : l'initiative se lit sur la Dextérité, à laquelle la Célérité
// ajoute son bonus — c'est elle qui décide qui frappe en premier.
function initiativeDe(c) {
  if (c.type === 'monstre') return (c.dex || 0) * 2 + alea(1, 10);
  const base = statDe(c, 'dex') * 2 + alea(1, 10);
  if (c.type !== 'joueur') return base;
  // La Célérité de l'équipement, plus celle qu'apportent les passifs.
  const celerite = sousCarac(statsEffectives(c), 'celerite') + (passifsDe(c).celeriteBonus || 0) / 100;
  return Math.round(base * (1 + celerite));
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
    // Les compteurs des passifs se remettent à zéro : l'embuscade
    // (premier coup critique), l'élan (charges) et le serment du Paladin
    // valent une fois par combat, pas une fois dans une vie.
    j.premierCoupJoue = false;
    j.chargesElan = 0;
    j.serment = false;
    j.pasUtilise = false;
  });

  etat.combat = {
    genre: options.genre,
    zone: options.zone || null,
    difficulte: options.difficulte || 'normal',
    tourEtage: options.tourEtage || null,
    equipe,
    monstres,
    lootRecolte: options.lootRecolte || null,
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
  c.pasUtilise = false; // le pas gratuit de la Danselame, une fois par tour

  if (c.type === 'joueur' || c.type === 'invocation') {
    Object.keys(c.cooldowns).forEach((k) => { if (c.cooldowns[k] > 0) c.cooldowns[k]--; });
    // 2 PM de base, plus ce que le Flux de l'Arcaniste et ses Voies ajoutent.
    const pass = c.type === 'joueur' ? passifsDe(c) : {};
    c.mp = Math.min(c.maxMp, c.mp + 2 + (pass.manaParTour || 0));
    // La sève : régénération passive, en part des PV maximum.
    if (pass.regenParTour > 0 && c.hp > 0 && c.hp < c.maxHp) {
      const rendu = Math.min(c.maxHp - c.hp, Math.max(1, Math.round(c.maxHp * pass.regenParTour)));
      c.hp += rendu;
      journal(`🌿 ${c.nom} régénère ${rendu} PV (passif).`);
    }
    // Le serment du Paladin : le premier allié en danger reçoit un
    // bouclier gratuit, une fois par combat et par allié protégé.
    if (pass.bouclierGratuit > 0 && cb) {
      const s = statsEffectives(c);
      cb.equipe.forEach((allie) => {
        if (estMort(allie) || allie.serment || allie.hp > allie.maxHp * pass.bouclierGratuit) return;
        allie.serment = true;
        const valeur = Math.round((10 + Math.max(s.esp || 0, s.int || 0) * 1.5) * (pass.bouclierMult || 1));
        poserStatut(allie, { type: 'bouclier', duree: 3, valeur });
        journal(`🕊️ Le serment de ${c.nom} couvre ${allie.nom} (${valeur} points de bouclier).`);
      });
    }
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
  // v21 : les passifs (classe, spécialité, Voie, Éveil) entrent enfin dans
  // le calcul. Ils étaient jusqu'ici de simples phrases sur une fiche.
  const passifs = source.type === 'joueur' ? passifsDe(source) : {};
  const passifsCible = cible.type === 'joueur' ? passifsDe(cible) : {};
  // v19 : le ciel entre dans l'équation. Sous la pluie le feu prend mal,
  // sous l'orage la foudre porte. Le physique reste neutre — le temps
  // qu'il fait ne change rien à un coup d'épée.
  if (options.element) d *= multElementMonde(options.element);
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
  let critForce = false;
  if (source.type === 'joueur') {
    const s = statsEffectives(source);
    chanceCrit += sousCarac(s, 'crit');
    chanceDirect = sousCarac(s, 'direct');
    d *= 1 + sousCarac(s, 'deter');
    // Un porteur de plaque frappe un peu plus fort : la Ténacité récompense
    // celui qui tient la ligne au lieu de la fuir.
    d *= 1 + sousCarac(s, 'tenacite') * 0.5;
    if (source.race === 'elfe') chanceCrit += 0.05; // Précision millénaire

    // ----- Les passifs offensifs -----
    if (passifs.degatsMult) d *= passifs.degatsMult;
    // La rage : les dégâts montent avec les blessures (Berserker, Voie de la Rage).
    if (passifs.degatsManquants && source.maxHp > 0) {
      d *= 1 + passifs.degatsManquants * (1 - Math.max(0, source.hp) / source.maxHp);
    }
    // La chasse : le Rôdeur et les siens contre tout ce qui grouille.
    if (passifs.degatsCreatures && cible.type === 'monstre') d *= 1 + passifs.degatsCreatures;
    // Le givre : frapper ce qui ne bouge plus.
    if (passifs.degatsEtourdis && cible.statuts.some((st) => st.type === 'etourdi')) {
      d *= 1 + passifs.degatsEtourdis;
    }
    // La moisson : le champ de bataille nourrit le Nécromancien.
    if (passifs.degatsParMort && cb) {
      d *= 1 + passifs.degatsParMort * cb.monstres.filter((m) => m.mort).length;
    }
    // La masse : le Colosse frappe avec ce qu'il pèse.
    if (passifs.degatsParCentPv) {
      d *= 1 + Math.min(0.6, passifs.degatsParCentPv * (source.maxHp / 100));
    }
    chanceCrit += passifs.critBonus || 0;
    // L'embuscade : le premier coup du combat, une fois par combat.
    if (passifs.critPremierCoup && !source.premierCoupJoue) {
      source.premierCoupJoue = true;
      critForce = true;
    }
    // L'élan : une frappe sur N est critique d'office.
    if (passifs.chargesCritique) {
      source.chargesElan = (source.chargesElan || 0) + 1;
      if (source.chargesElan >= passifs.chargesCritique) {
        source.chargesElan = 0;
        critForce = true;
      }
    }
  }
  const crit = critForce || Math.random() < chanceCrit;
  let direct = false;
  if (crit) {
    d *= 1.5;
  } else if (Math.random() < chanceDirect) {
    direct = true;
    d *= 1.25;
  }

  // Ténacité en défense : une réduction franche et constante des dégâts
  // subis. Elle remplace l'ancien jet de blocage — un tank encaisse parce
  // qu'il est un tank, pas parce qu'il a eu de la chance.
  let reduit = false;
  if (cible.type === 'joueur') {
    const defensif = statsEffectives(cible);
    const tenacite = sousCarac(defensif, 'tenacite');
    if (tenacite > 0) {
      reduit = true;
      d *= 1 - tenacite;
    }
    // Les passifs défensifs de la cible elle-même…
    if (passifsCible.reductionDegats > 0) {
      reduit = true;
      d *= 1 - passifsCible.reductionDegats;
    }
    // …et le rempart d'un allié qui couvre tout le monde (Templier).
    const couverture = protectionEquipe(cible);
    if (couverture > 0) {
      reduit = true;
      d *= 1 - couverture;
    }
  }
  // La nuit, ce qui rôde frappe plus fort — c'est le prix du butin majoré.
  if (source.type === 'monstre' && cible.type === 'joueur') {
    d *= (mondeMaintenant().effets.degatsSubis || 1);
  }
  if (cible.defense) d *= 0.5;
  if (cible.race === 'nain') d *= 0.9; // Peau de pierre
  // v16 : les lignes de combat — un coup PHYSIQUE perd 40 % quand il part
  // de la ligne arrière ou qu'il la vise. La magie ignore les lignes.
  if (!options.magique) {
    // La ligne de tir : le Franc-tireur et ses Voies ne perdent rien à
    // frapper de loin — c'est tout leur métier.
    if (source.ligne === 'arriere' && !passifs.ignoreLigneArriere) d *= 0.6;
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
  // Neuf vies (félin) : survit une fois par combat à un coup fatal.
  if (cible.type === 'joueur' && cible.race === 'felin' && cible.hp <= 0 && !cible.neufViesUtilisees) {
    cible.neufViesUtilisees = true;
    cible.hp = 1;
    journal(`🐱 ${cible.nom} retombe sur ses pattes : Neuf vies le laisse à 1 PV !`);
  }

  // Le vol de vie passif (Runelame, Chevalier Noir, Voies du Sang) : il
  // s'ajoute au drain d'une compétence, il ne le remplace pas.
  if (passifs.drainPart > 0 && d > 0 && cible.type === 'monstre' && source.hp > 0) {
    const rendu = Math.max(1, Math.round(d * passifs.drainPart));
    const avant = source.hp;
    source.hp = Math.min(source.maxHp, source.hp + rendu);
    if (source.hp > avant) journal(`🩸 ${source.nom} reprend ${source.hp - avant} PV à ${cible.nom}.`);
  }

  // La sentence : ce qui n'est pas un boss et qui tient à un fil tombe.
  if (passifs.execution > 0 && cible.type === 'monstre' && !cible.boss
    && cible.hp > 0 && cible.hp <= cible.maxHp * passifs.execution) {
    if (cb && cb.genre === 'bossMonde') cb.degatsBossMonde += cible.hp;
    cible.hp = 0;
    journal(`⚖️ ${source.nom} achève ${cible.nom} : la sentence tombe.`);
  }

  return { degats: d, crit, direct, absorbe, reduit };
}

// La part de dégâts qu'un allié épargne à toute l'équipe (Templier,
// Voie du Bastion). Elle ne se cumule pas entre deux protecteurs : c'est
// la meilleure garde qui compte, sinon quatre Templiers rendaient un
// groupe intouchable.
function protectionEquipe(cible) {
  const cb = etat.combat;
  if (!cb || !cb.equipe) return 0;
  let meilleure = 0;
  cb.equipe.forEach((allie) => {
    if (allie === cible || allie.type !== 'joueur' || estMort(allie)) return;
    const part = passifsDe(allie).reductionEquipe || 0;
    if (part > meilleure) meilleure = part;
  });
  return Math.min(0.2, meilleure);
}

function texteDegats(r) {
  let t = `${r.degats} dégâts`;
  if (r.crit) t += ' 💥 CRITIQUE !';
  else if (r.direct) t += ' 🎲 coup direct !';
  if (r.reduit) t += ' 🛡️ (Ténacité)';
  if (r.absorbe > 0) t += ` (${r.absorbe} absorbés par le bouclier)`;
  return t;
}

// v21 : le soigneur compte. Ses passifs majorent ce qu'il rend, et le
// surplus n'est plus perdu s'il sait en faire un bouclier (Oracle, Devin,
// Voie de la Sève). `source` est facultatif : un soin de monstre ou un
// drain sans porteur passe simplement à côté de ces bonus.
function soigner(cible, brut, source) {
  const passifs = source && source.type === 'joueur' ? passifsDe(source) : {};
  let montant = brut * (passifs.soinMult || 1);
  const soin = Math.max(1, Math.round(varie(montant)));
  const avant = cible.hp;
  cible.hp = Math.min(cible.maxHp, cible.hp + soin);
  const rendu = cible.hp - avant;

  // Le surplus devient un bouclier, plafonné en part des PV de la cible.
  const surplus = soin - rendu;
  if (surplus > 0 && passifs.surplusBouclier > 0) {
    const plafond = Math.round(cible.maxHp * passifs.surplusBouclier);
    const existant = cible.statuts.find((st) => st.type === 'bouclier');
    const valeur = Math.min(plafond, (existant ? existant.valeur : 0) + surplus);
    poserStatut(cible, { type: 'bouclier', duree: Math.max(3, existant ? existant.duree : 0), valeur });
    journal(`🛡️ Le surplus de soin protège ${cible.nom} (${valeur} points de bouclier).`);
  }
  return soin;
}

// La curée : certains passifs rendent des PV à chaque mise à mort
// (Berserker, Voie du Carnage). Appelée juste après gererMort, là où l'on
// sait ENCORE qui a porté le coup.
function recompenserMiseAMort(source, cible) {
  if (!source || source.type !== 'joueur' || cible.type !== 'monstre' || !cible.mort) return;
  const part = passifsDe(source).soinParKill || 0;
  if (part <= 0 || source.hp <= 0 || source.hp >= source.maxHp) return;
  const rendu = Math.min(source.maxHp - source.hp, Math.max(1, Math.round(source.maxHp * part)));
  source.hp += rendu;
  journal(`🍖 ${source.nom} se repaît de sa victoire : +${rendu} PV.`);
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

function appliquerEffet(source, cible, effet, resultatDegats) {
  // v21 : les passifs allongent les effets et gonflent les boucliers du
  // lanceur. Un Barde qui « fait durer ses bénédictions 2 tours de plus »
  // les fait vraiment durer 2 tours de plus.
  const pass = source && source.type === 'joueur' ? passifsDe(source) : {};
  const dureeBuff = (base) => base + (pass.dureeBuff || 0);
  const dureeMalus = (base) => base + (pass.dureeStatut || 0);
  switch (effet.type) {
    case 'poison': {
      const valeur = effet.degats != null
        ? effet.degats
        : Math.round(3 + statDe(source, effet.stat || 'dex') * (effet.stat === 'int' ? 0.5 : 0.6));
      const duree = dureeMalus(effet.duree);
      poserStatut(cible, { type: 'poison', duree, valeur });
      journal(`🧪 ${cible.nom} est empoisonné (${valeur} dégâts par tour, ${duree} tours).`);
      break;
    }
    case 'affaibli': {
      const duree = dureeMalus(effet.duree);
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
      const valeur = Math.round((8 + statDe(source, effet.stat || 'int') * 1.5) * (pass.bouclierMult || 1));
      const duree = dureeBuff(effet.duree);
      poserStatut(cible, { type: 'bouclier', duree, valeur });
      journal(`🛡️ ${cible.nom} est protégé par un bouclier (${valeur} points).`);
      break;
    }
    case 'benediction': {
      const duree = dureeBuff(effet.duree);
      poserStatut(cible, { type: 'benediction', duree });
      journal(`🙏 ${cible.nom} est béni : +30 % de dégâts pendant ${duree} tours.`);
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
      const valeur = Math.round((3 + statDe(source, effet.stat || 'int') * 0.8) * (pass.soinMult || 1));
      const duree = dureeBuff(effet.duree);
      poserStatut(cible, { type: 'regen', duree, valeur });
      journal(`💧 ${cible.nom} régénérera ${valeur} PV par tour pendant ${duree} tours.`);
      break;
    }
    case 'mana': {
      cible.mp = Math.min(cible.maxMp, cible.mp + effet.valeur);
      journal(`🧘 ${cible.nom} récupère ${effet.valeur} PM.`);
      break;
    }
    case 'drain': {
      if (resultatDegats && resultatDegats.degats > 0) {
        // Le drain d'un sort rend des PV bruts : il ne passe pas par les
        // bonus de SOIN, sinon un soigneur-drainer cumulerait deux fois.
        const soin = Math.max(1, Math.round(varie(resultatDegats.degats * effet.part)));
        source.hp = Math.min(source.maxHp, source.hp + soin);
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
    const genreFuyable = cb.genre === 'exploration' || cb.genre === 'embuscade';
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

  // v21 : les actions de base (attaquer, défendre, se replacer, boire,
  // fuir) tiennent sur une seule rangée de pastilles. Elles occupaient
  // avant autant de place que les sorts, alors qu'on les connaît par
  // cœur : sur un téléphone, le tour d'un héros à huit sorts demandait
  // trois écrans de défilement avant d'atteindre le bouton voulu.
  const base = document.createElement('div');
  base.className = 'barre-actions-base';
  const pastille = (emoji, libelle, titre, action, options = {}) => {
    const btn = document.createElement('button');
    btn.className = 'btn-action-base' + (options.classe ? ` ${options.classe}` : '');
    btn.disabled = !!options.desactive;
    btn.title = titre;
    btn.innerHTML = `<span class="base-emoji">${emoji}</span><span class="base-libelle">${libelle}</span>`;
    btn.addEventListener('click', action);
    base.appendChild(btn);
    return btn;
  };

  pastille('⚔️', 'Attaque', 'Gratuite · dégâts légers',
    () => surActionChoisie(j, { genre: 'attaque' }));
  pastille('🛡️', 'Défendre', '−50 % de dégâts subis · +3 PM',
    () => surActionChoisie(j, { genre: 'defense' }));

  // v16 : changer de ligne est une action à part entière — elle consomme le tour.
  const versArriere = j.ligne !== 'arriere';
  pastille('🔁', versArriere ? 'Arrière' : 'Avant',
    versArriere
      ? 'Passer en ligne arrière : physique −40 % (donné ET subi) · consomme le tour'
      : 'Passer en ligne avant : pleine puissance, pleine exposition · consomme le tour',
    () => surActionChoisie(j, { genre: 'ligne' }));

  const consommablesBase = consommablesDe(j);
  pastille('🎒', 'Objet',
    consommablesBase.length ? 'Boire une potion' : 'Aucune potion dans le sac',
    () => { cb.modeActions = 'objet'; rendreActions(j); },
    { desactive: consommablesBase.length === 0 });

  if (cb.genre === 'exploration' || cb.genre === 'embuscade') {
    pastille('💨', 'Fuir', '65 % de réussite', () => surActionChoisie(j, { genre: 'fuite' }), { classe: 'danger' });
  } else if (cb.genre === 'bossMonde') {
    pastille('🏳️', 'Retraite', 'Battre en retraite — vos dégâts comptent quand même',
      () => surActionChoisie(j, { genre: 'fuite' }), { classe: 'danger' });
  }
  zone.appendChild(base);

  const statsJoueur = statsEffectives(j);
  j.competences.forEach((compId) => {
    const comp = COMPETENCES[compId];
    if (!comp) return;
    const btn = document.createElement('button');
    btn.className = 'btn-action competence';
    const cd = j.cooldowns[compId] || 0;
    const cout = coutMpDe(comp, statsJoueur, j.maxMp);
    // Le pacte de sang : à court de mana, certains paient en PV.
    const enSang = j.mp < cout && passifsDe(j).manaEnPv && j.hp > 1;
    // Détails chiffrés : dégâts/soins estimés, effets, coût, recharge.
    let detail = detailsCompetence(comp, statsJoueur, rangDe(j, compId), j.maxMp, j).join(' · ');
    if (cd > 0) detail = `⏳ Encore ${cd} tour${cd > 1 ? 's' : ''}`;
    else if (enSang) detail = `🩸 ${cout} PM — payés en PV, faute de mana`;
    else if (j.mp < cout) detail = `${cout} PM — pas assez de mana`;
    btn.innerHTML = `${comp.emoji} <strong>${comp.nom}</strong><span class="action-detail">${detail}</span>`;
    btn.title = comp.desc;
    btn.disabled = cd > 0 || (j.mp < cout && !enSang);
    btn.addEventListener('click', () => surActionChoisie(j, { genre: 'competence', compId }));
    barre.appendChild(btn);
  });

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
    const brut = 3 + Math.max(s.for, s.dex);
    const r = infligerDegats(j, cible, brut);
    journal(`⚔️ ${j.nom} attaque ${cible.nom} : ${texteDegats(r)}`);
    gererMort(cible);
    recompenserMiseAMort(j, cible);
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
  // Le pas de la Danselame : changer de ligne ne lui coûte pas son tour.
  // Une seule fois par tour, sinon on peut danser à l'infini.
  if (action.genre === 'ligne' && !cb.distant && !j.pasUtilise && passifsDe(j).ligneGratuite) {
    j.pasUtilise = true;
    cb.finTour = finir;
    journal(`🌸 ${j.nom} se replace sans perdre son tour.`);
    rendreCombat();
    rendreActions(j);
    return;
  }
  rendreCombat();
  finir();
}

// Payer un sort. Le Chevalier Noir et ses semblables peuvent puiser dans
// leur propre sang quand la réserve de mana ne suffit plus — le pacte ne
// les tue jamais, il les laisse à 1 PV au pire.
function payerCout(j, cout) {
  if (cout <= 0) return;
  const manque = cout - j.mp;
  j.mp = Math.max(0, j.mp - cout);
  if (manque > 0 && passifsDe(j).manaEnPv) {
    const prix = Math.min(Math.max(0, j.hp - 1), Math.round(manque * 2));
    if (prix > 0) {
      j.hp -= prix;
      journal(`🩸 ${j.nom} paie ${manque} PM manquants avec ${prix} PV.`);
    }
  }
}

function lancerCompetence(j, compId, cible) {
  const cb = etat.combat;
  const comp = COMPETENCES[compId];
  if (comp.type === 'invocation') { lancerInvocation(j, compId); return; }
  const s = statsEffectives(j);
  payerCout(j, coutMpDe(comp, s, j.maxMp));
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
        recompenserMiseAMort(j, c);
        // Le drain soigne le lanceur même si le coup achève la cible ;
        // les autres effets (poison, étourdissement…) ne s'appliquent qu'aux vivants.
        if (comp.effet && (comp.effet.type === 'drain' || !estMort(c))) {
          appliquerEffet(j, c, comp.effet, r);
        }
      }
    });
  } else if (comp.type === 'soin') {
    const cibles = comp.cible === 'allies' ? cb.equipe.filter((x) => !x.ko) : [cible];
    cibles.forEach((c) => {
      const soin = soigner(c, (comp.puissance + statDeCompetence(comp, s) * comp.ratio) * multRang, j);
      journal(`${comp.emoji} ${j.nom} rend ${soin} PV à ${c === j ? 'lui-même' : c.nom}.`);
      if (comp.effet) appliquerEffet(j, c, comp.effet, null);
    });
  } else {
    // Utilitaire : sur soi, un allié, ou tout le groupe (aura, chant…)
    const cibles = comp.cible === 'allies' ? cb.equipe.filter((x) => !x.ko) : [cible || j];
    if (comp.cible === 'allies') journal(`${comp.emoji} ${j.nom} utilise ${comp.nom} !`);
    cibles.forEach((c) => appliquerEffet(j, c, comp.effet, null));
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
  // v21 : le nombre d'invocations est un PASSIF, et un seul — celui de la
  // source la plus généreuse (spécialité, Voie ou Éveil). Elles ne se
  // cumulent jamais : c'est ce cumul qui donnait quatre créatures à un
  // Invocateur qui n'aurait dû en tenir que deux. Aucun sort, jamais, ne
  // change ce nombre.
  const limite = limiteInvocations(j);
  const vivantes = cb.equipe.filter((x) => x.type === 'invocation' && x.maitre === j.bid && !estMort(x));
  if (vivantes.length >= limite) {
    journal(limite > 1
      ? `🐾 ${j.nom} tient déjà ${vivantes.map((x) => x.nom).join(' et ')} — son lien n'en supporte pas plus de ${limite} !`
      : `🐾 ${j.nom} a déjà ${vivantes[0].nom} au combat — une seule invocation par héros !`);
    return;
  }
  j.mp = Math.max(0, j.mp - coutMpDe(comp, statsEffectives(j), j.maxMp));
  if (comp.cooldown) j.cooldowns[compId] = comp.cooldown;

  const modele = INVOCATIONS[comp.invocation];
  const sm = statsEffectives(j);
  // Les stats de la créature sont des fractions de celles du maître, que
  // le passif peut renforcer ou brider (une horde de six frappe moins fort
  // qu'une créature unique) — et ne peuvent JAMAIS dépasser le maître.
  const multStats = passifsDe(j).invocationStats || 1;
  const stats = {};
  Object.keys(CARACS).forEach((cle) => {
    const voulu = Math.round((sm[cle] || 0) * modele.stats[cle] * multStats);
    stats[cle] = Math.max(1, Math.min(voulu, sm[cle] || 1));
  });
  const maxHp = Math.max(10, Math.round(j.maxHp * modele.pvPct));
  const maxMp = Math.max(4, Math.round(j.maxMp * 0.5)); // 50 % du mana du maître, la règle

  const inv = {
    type: 'invocation',
    invocation: true,
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
        if (comp.effet && (comp.effet.type === 'drain' || !estMort(m))) appliquerEffet(c, m, comp.effet, r);
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
      if (comp.effet) appliquerEffet(c, x, comp.effet, null);
    });
  } else {
    const vivants = cb.equipe.filter((x) => !estMort(x));
    const cibles = comp.cible === 'allies'
      ? vivants
      : (comp.cible === 'allie' ? [vivants[alea(0, vivants.length - 1)]] : [c]);
    journal(`${comp.emoji} ${c.nom} utilise ${comp.nom} !`);
    cibles.forEach((x) => appliquerEffet(c, x, comp.effet, null));
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

// v21 : signale d'un dégradé les rangées de combattants qui dépassent de
// l'écran. Sans lui, un pack de trois créatures se coupait net au bord et
// rien ne disait qu'il fallait faire défiler.
function marquerRangeesQuiDebordent() {
  document.querySelectorAll('.combat-rangee').forEach((rangee) => {
    rangee.classList.toggle('deborde', rangee.scrollWidth > rangee.clientWidth + 4);
  });
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
    // v21 : le libellé de la ligne arrière tenait sur trois lignes sur un
    // téléphone. La règle passe en infobulle, le libellé reste court.
    [['avant', '⚔️ Ligne avant', 'Au contact : pleine puissance physique, pleine exposition.',
      cb.equipe.filter((x) => x.ligne !== 'arriere')],
    ['arriere', '🏹 Ligne arrière', 'Le physique y perd 40 %, donné comme subi. La magie ignore les lignes.',
      arriere]]
      .forEach(([, libelle, aide, groupe]) => {
        // Une ligne vide n'a rien à dire : elle prenait un titre et un
        // blanc au milieu de l'écran pour annoncer que personne n'y est.
        if (!groupe.length) return;
        const bloc = document.createElement('div');
        bloc.className = 'ligne-combat';
        bloc.innerHTML = `<div class="libelle-ligne" title="${aide}">${libelle}</div>`;
        const rangee = document.createElement('div');
        rangee.className = 'rangee-cartes combat-rangee';
        groupe.forEach((j) => rangee.appendChild(carteCombattant(j)));
        bloc.appendChild(rangee);
        zoneJ.appendChild(bloc);
      });
  }
  zoneJ.scrollLeft = defilJ;
  marquerRangeesQuiDebordent();
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
