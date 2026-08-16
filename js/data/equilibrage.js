'use strict';

// =====================================================================
// v20 — Le banc d'essai de l'équilibrage.
//
// POURQUOI CE FICHIER EXISTE
//
// Pendant longtemps, « puissance conseillée » était calculée sur un héros
// NU : la formule modélisait l'équipement par un forfait (niveau × 9,4)
// alors qu'un vrai stuff en apportait des milliers. Un héros correctement
// équipé affichait donc 6 à 7 fois la puissance « conseillée » à tous les
// niveaux — un joueur de niveau 22 dépassait le chiffre conseillé pour le
// niveau 100. Et comme personne ne comparait jamais le héros RÉEL au
// contenu réel, la difficulté du milieu de partie s'était effondrée sans
// que rien ne le signale.
//
// Ce fichier est la réponse : l'étalon. Il construit, pour une classe et
// un niveau donnés, le héros LE PLUS FORT que le jeu autorise à ce
// niveau — meilleur équipement de sa tranche, tous les points placés,
// spécialité, Voie, Éveil, familier, panoplie, rangs de maîtrise.
//
// Il ne sert à rien pendant une partie. Il sert aux TESTS, qui s'en
// servent pour garantir que la courbe de puissance et la courbe de
// difficulté ne divergent plus jamais en silence.
// =====================================================================

// Les six classes de base et la caractéristique qu'un joueur optimise.
function classesEtalon() {
  return Object.keys(CLASSES_BASE);
}

// --- Le meilleur équipement d'une tranche ----------------------------
//
// Le catalogue compte plus de 18 000 pièces. Le parcourir pour chaque
// (classe, emplacement, niveau) demandait près de neuf secondes sur les
// cent niveaux : on construit donc UNE fois, par classe et par
// emplacement, un tableau « meilleure pièce de niveau ≤ n » — après quoi
// chaque lecture est immédiate.
let indexEquipement = null;

function construireIndexEquipement() {
  if (indexEquipement) return indexEquipement;
  // Regroupement par emplacement, trié par niveau : une seule passe.
  const parSlot = {};
  Object.entries(OBJETS).forEach(([id, objet]) => {
    if (objet.type !== 'equipement' || !objet.slot) return;
    (parSlot[objet.slot] = parSlot[objet.slot] || []).push({ id, objet, valeur: valeurDePiece(objet) });
  });
  Object.values(parSlot).forEach((liste) => {
    liste.sort((a, b) => (a.objet.niveau || 1) - (b.objet.niveau || 1));
  });

  indexEquipement = {};
  classesEtalon().forEach((classe) => {
    const factice = { classe };
    const parClasse = indexEquipement[classe] = {};
    Object.entries(parSlot).forEach(([slot, liste]) => {
      // meilleur[n] = identifiant de la meilleure pièce de niveau ≤ n.
      const meilleur = new Array(NIVEAU_MAX + 1).fill(null);
      let courant = null;
      let valeurCourante = -1;
      let i = 0;
      for (let n = 1; n <= NIVEAU_MAX; n++) {
        while (i < liste.length && (liste[i].objet.niveau || 1) <= n) {
          const candidat = liste[i];
          i++;
          if (!peutPorter(factice, candidat.objet)) continue;
          if (candidat.valeur > valeurCourante) { valeurCourante = candidat.valeur; courant = candidat.id; }
        }
        meilleur[n] = courant;
      }
      parClasse[slot] = meilleur;
    });
  });
  return indexEquipement;
}

// Ce que vaut une pièce pour le score de puissance : exactement les
// termes que puissanceDe additionnera. Un optimiseur ne choisit pas
// autrement.
function valeurDePiece(objet) {
  const mult = (typeof MULT_RARETE_CRAFT !== 'undefined' && MULT_RARETE_CRAFT[rareteDe(objet)]) || 1;
  return valeurBonusObjet(objet.bonus) + (objet.niveau || 1) * mult * 4;
}

// La meilleure pièce portable par cette classe, de niveau ≤ le sien.
function meilleurePiece(classe, slot, niveau) {
  const parClasse = construireIndexEquipement()[classe];
  const meilleur = parClasse && parClasse[slot];
  return meilleur ? meilleur[Math.min(NIVEAU_MAX, Math.max(1, niveau))] : null;
}

// =====================================================================
// Le persona : le héros le plus fort possible à ce niveau, dans cette
// classe. Construit à la main plutôt qu'avec nouveauPersonnage — c'est
// un étalon de données, il ne doit rien devoir à l'interface.
// =====================================================================
function personaReference(classe, niveau) {
  const n = Math.min(NIVEAU_MAX, Math.max(1, niveau || 1));
  const base = CLASSES_BASE[classe];
  const statMaitresse = (base && base.stat) || 'for';

  const stats = {};
  Object.keys(CARACS).forEach((cle) => { stats[cle] = STAT_BASE; });
  // Comment un joueur qui sait jouer place-t-il ses points ?
  //
  // Pas tout dans la caractéristique de sa classe : un héros qui frappe
  // fort et meurt en deux tours ne finit pas un donjon. Pas tout dans la
  // Vitalité non plus. La répartition de référence est 60 / 40 — c'est
  // celle qui rend la courbe de PV lisible et la courbe de dégâts saine,
  // et c'est sur elle que la difficulté est calibrée.
  //
  // (À noter : pour le SCORE de puissance seul, tout mettre en Vitalité
  // serait optimal — 6 points de score par point, plus 7 PV à 0,8. Ce
  // serait un très mauvais héros. L'étalon vise le meilleur JOUEUR
  // possible, pas le meilleur chiffre possible.)
  const aPlacer = POINTS_CREATION + pointsCumules(n);
  const versVitalite = Math.round(aPlacer * 0.4);
  stats[statMaitresse] += aPlacer - versVitalite;
  stats.vit += versVitalite;

  const p = {
    nom: 'Étalon', avatar: '⚗️', race: 'humain', classe,
    niveau: n, stats, equipement: {},
    familiers: [], familier: null, rangs: {},
    sousClasse: null, voie: null, eveil: null,
    inventaire: [], competences: [], grimoire: [],
  };

  // Les paliers d'identité, dès qu'ils sont ouverts.
  if (n >= NIVEAU_SOUS_CLASSE) {
    p.sousClasse = (base && base.sousClasses && base.sousClasses[0]) || null;
  }
  if (n >= NIVEAU_VOIE && p.sousClasse) {
    p.voie = Object.keys(VOIES).find((id) => VOIES[id].sousClasse === p.sousClasse) || null;
  }
  if (n >= NIVEAU_EVEIL && p.sousClasse) {
    const ideal = Object.keys(EVEILS)
      .filter((id) => EVEILS[id].sousClasse === p.sousClasse)
      .sort((a, b) => ORDRE_EVEIL.indexOf(EVEILS[b].rarete) - ORDRE_EVEIL.indexOf(EVEILS[a].rarete))[0];
    if (ideal) p.eveil = { id: ideal, rarete: EVEILS[ideal].rarete, relances: 0 };
  }

  // Le meilleur familier que le jeu propose.
  const meilleurFamilier = Object.keys(FAMILIERS).sort((a, b) =>
    Object.values(FAMILIERS[b].bonus || {}).reduce((x, v) => x + v, 0)
    - Object.values(FAMILIERS[a].bonus || {}).reduce((x, v) => x + v, 0))[0];
  if (meilleurFamilier) { p.familiers = [meilleurFamilier]; p.familier = meilleurFamilier; }

  Object.keys(SLOTS_EQUIPEMENT).forEach((slot) => {
    const cible = (slot === 'acc1' || slot === 'acc2') ? 'accessoire' : slot;
    const piece = meilleurePiece(classe, cible, n);
    if (piece) p.equipement[slot] = piece;
  });

  p.maxHp = maxHpDe(p);
  p.maxMp = maxMpDe(p);
  p.hp = p.maxHp;
  p.mp = p.maxMp;
  return p;
}

// =====================================================================
// La courbe étalon : puissance atteignable à chaque niveau.
//
// « max » = la meilleure classe, « min » = la moins bien lotie. La
// difficulté ne se calibre PAS sur le maximum : toutes les classes ne se
// valent pas, et un contenu taillé pour la meilleure serait infranchissable
// pour les autres. On se cale sur la plus faible, avec une marge.
// =====================================================================
const memoPuissances = {};

function puissancesEtalon(niveau) {
  const n = Math.min(NIVEAU_MAX, Math.max(1, niveau || 1));
  if (memoPuissances[n]) return memoPuissances[n];
  const parClasse = {};
  classesEtalon().forEach((classe) => {
    parClasse[classe] = puissanceDe(personaReference(classe, n));
  });
  const valeurs = Object.values(parClasse);
  const resultat = {
    niveau: n,
    parClasse,
    min: Math.min(...valeurs),
    max: Math.max(...valeurs),
    moyenne: Math.round(valeurs.reduce((a, v) => a + v, 0) / valeurs.length),
  };
  memoPuissances[n] = resultat;
  return resultat;
}

// =====================================================================
// LA TENSION D'UN COMBAT — la mesure qui manquait.
//
// Personne ne comparait jamais un héros RÉEL au contenu réel. Résultat :
// au niveau 22, un héros bien équipé nettoyait un groupe de son niveau en
// 3,4 tours tout en survivant 31,8 tours — neuf fois plus de marge qu'il
// n'en fallait — pendant qu'au niveau 90 la même mesure donnait 1,0. Le
// milieu de partie était devenu une promenade sans que rien ne l'indique.
//
// On mesure donc trois choses, et les tests les surveillent :
//   • la MARGE     survie ÷ temps de nettoyage. Doit rester dans une
//                  fourchette étroite du niveau 1 au niveau 100.
//   • le PIRE COUP la plus grosse claque encaissable en un coup, en % des
//                  PV. Aucun monstre ne doit jamais « one shot ».
//   • la RIPOSTE   ce que le héros enlève en un coup, en % des PV du
//                  monstre. Un monstre qui tombe en un coup n'est pas un
//                  combat, c'est un décor.
// =====================================================================

// Dégâts moyens d'un héros par tour. Modèle simple et assumé : il frappe
// avec la meilleure compétence qu'il peut se payer, et retombe sur
// l'attaque de base quand elle recharge. Les hasards (critique, coup
// direct) entrent par leur espérance, pas par un tirage.
function degatsParTourHeros(p) {
  const s = statsEffectives(p);
  const base = degatsAttaqueDeBase(p, s);

  let meilleure = base;
  (p.competences || []).forEach((id) => {
    const comp = COMPETENCES[id];
    if (!comp || comp.type !== 'degats') return;
    const brut = (comp.puissance + statDeCompetence(comp, s) * comp.ratio) * (comp.coups || 1);
    // Une compétence qui recharge n'est disponible qu'un tour sur (1+n).
    const parts = 1 / (1 + (comp.cooldown || 0));
    const moyenne = brut * parts + base * (1 - parts);
    if (moyenne > meilleure) meilleure = moyenne;
  });

  let d = meilleure;
  d *= 1 + sousCarac(s, 'deter');
  d *= 1 + sousCarac(s, 'tenacite') * 0.5;
  const crit = 0.05 + sousCarac(s, 'crit');
  const direct = sousCarac(s, 'direct');
  return d * (crit * 1.5 + (1 - crit) * (direct * 1.25 + (1 - direct)));
}

// Le coup le plus fort qu'un héros place en une fois — c'est lui qui dit
// si un monstre tombe d'une pichenette.
function plusGrosCoupHeros(p) {
  const s = statsEffectives(p);
  let brut = degatsAttaqueDeBase(p, s);
  (p.competences || []).forEach((id) => {
    const comp = COMPETENCES[id];
    if (!comp || comp.type !== 'degats') return;
    const v = (comp.puissance + statDeCompetence(comp, s) * comp.ratio) * (comp.coups || 1);
    if (v > brut) brut = v;
  });
  return brut * (1 + sousCarac(s, 'deter')) * 1.5; // critique
}

// Ce qu'un héros peut se soigner LUI-MÊME pendant un combat.
//
// Sans ce terme, un soigneur passait pour la classe la plus fragile du jeu :
// on comptait les coups qu'il prend et pas ceux qu'il efface.
//
// Mais soigner n'est pas gratuit : c'est un TOUR pris sur l'attaque, et du
// mana. Un héros qui consacre un tour sur quatre à se remettre d'aplomb
// allonge son combat d'autant. On borne donc à une part des tours, et par
// la réserve de mana — les deux contraintes que le joueur subit vraiment.
const PART_TOURS_DE_SOIN = 0.3;

function meilleurSoinDe(p, s) {
  let meilleur = null;
  (p.competences || []).forEach((id) => {
    const comp = COMPETENCES[id];
    if (!comp || comp.type !== 'soin') return;
    const soin = comp.puissance + statDeCompetence(comp, s) * comp.ratio;
    if (!meilleur || soin > meilleur.soin) meilleur = { comp, soin };
  });
  return meilleur;
}

// Renvoie { soinTotal, toursDeSoin } pour un combat de `toursAttaque` tours
// d'attaque. `toursDeSoin` s'ajoute à la durée du combat.
function autoSoinPendantCombat(p, toursAttaque) {
  const s = statsEffectives(p);
  const meilleur = meilleurSoinDe(p, s);
  if (!meilleur) return { soinTotal: 0, toursDeSoin: 0 };
  // On ne peut pas relancer un soin plus souvent que sa recharge.
  const parRecharge = toursAttaque / (1 + (meilleur.comp.cooldown || 0));
  const parTemps = toursAttaque * PART_TOURS_DE_SOIN;
  const cout = Math.max(1, coutMpDe(meilleur.comp, s, p.maxMp));
  const parMana = p.maxMp / cout;
  const lancers = Math.max(0, Math.min(parRecharge, parTemps, parMana));
  return { soinTotal: lancers * meilleur.soin, toursDeSoin: lancers };
}

// Dégâts moyens d'un monstre sur ce héros, en un tour.
function degatsParTourMonstre(m, p) {
  const s = statsEffectives(p);
  const poids = (m.attaques || []).reduce((a, at) => a + (at.poids || 1), 0) || 1;
  const mult = (m.attaques || []).reduce((a, at) => a + (at.mult || 1) * (at.poids || 1), 0) / poids;
  return m.atk * mult * (1 - sousCarac(s, 'tenacite'));
}

// Sa plus grosse attaque, elle : celle qui décide s'il peut tuer d'un coup.
function plusGrosCoupMonstre(m, p) {
  const s = statsEffectives(p);
  const pire = (m.attaques || []).reduce((a, at) => Math.max(a, at.mult || 1), 1);
  return m.atk * pire * (1 - sousCarac(s, 'tenacite'));
}

// Équipe le persona des compétences de sa classe : sans elles il tape
// comme un civil, et la mesure ne veut plus rien dire.
function personaArme(classe, niveau) {
  const p = personaReference(classe, niveau);
  const base = CLASSES_BASE[classe];
  p.competences = (base && base.competences ? base.competences : [])
    .filter((id) => COMPETENCES[id] && (COMPETENCES[id].niveauRequis || 1) <= niveau)
    .slice(0, MAX_COMPETENCES_ACTIVES);
  return p;
}

// La tension d'une zone pour un héros donné, face à un groupe de `taille`.
function tensionCombat(monstres, p, taille = 3) {
  if (!monstres.length) return null;
  const moy = (f) => monstres.reduce((a, m) => a + f(m), 0) / monstres.length;
  const degatsHeros = degatsParTourHeros(p);
  const pvMonstre = moy((m) => m.hp);
  const toursNettoyage = (pvMonstre * taille) / Math.max(1, degatsHeros);
  const recuParTour = moy((m) => degatsParTourMonstre(m, p)) * taille;
  // Les soins qu'il se rend allongent sa vie ET son combat : c'est le même
  // tour qu'il n'a pas passé à frapper.
  const auto = autoSoinPendantCombat(p, toursNettoyage);
  const toursSurvie = (p.maxHp + auto.soinTotal) / Math.max(1, recuParTour);
  return {
    toursNettoyage: toursNettoyage + auto.toursDeSoin,
    toursSurvie,
    marge: toursSurvie / (toursNettoyage + auto.toursDeSoin),
    // Un « one shot » se lit ici : la pire claque en pourcentage des PV.
    pireCoupPct: moy((m) => plusGrosCoupMonstre(m, p)) / p.maxHp,
    // Et sa réciproque : ce que le héros enlève d'un coup au monstre.
    ripostePct: plusGrosCoupHeros(p) / Math.max(1, pvMonstre),
  };
}

// --- Le héros de référence de la difficulté --------------------------
//
// Ni l'étalon divin (personne ne l'atteint), ni un débutant : un joueur
// bien équipé, pièces LÉGENDAIRES partout. C'est sur lui que le bestiaire
// est calibré, c'est donc sur lui qu'on vérifie.
let indexLegendaire = null;

function meilleurePieceLegendaire(classe, slot, niveau) {
  if (!indexLegendaire) {
    const ordre = Object.keys(RARETES);
    const plafond = ordre.indexOf('legendaire');
    indexLegendaire = {};
    classesEtalon().forEach((c) => {
      const factice = { classe: c };
      indexLegendaire[c] = {};
      Object.entries(OBJETS).forEach(([id, o]) => {
        if (o.type !== 'equipement' || !o.slot) return;
        if (ordre.indexOf(rareteDe(o)) > plafond) return;
        if (!peutPorter(factice, o)) return;
        const parSlot = indexLegendaire[c][o.slot] = indexLegendaire[c][o.slot] || [];
        parSlot.push({ id, niveau: o.niveau || 1, valeur: valeurDePiece(o) });
      });
      Object.values(indexLegendaire[c]).forEach((l) => l.sort((a, b) => a.niveau - b.niveau));
    });
  }
  const liste = (indexLegendaire[classe] || {})[slot] || [];
  let meilleur = null;
  let valeur = -1;
  for (let i = 0; i < liste.length && liste[i].niveau <= niveau; i++) {
    if (liste[i].valeur > valeur) { valeur = liste[i].valeur; meilleur = liste[i].id; }
  }
  return meilleur;
}

function personaEquipeNormalement(classe, niveau) {
  const p = personaArme(classe, niveau);
  Object.keys(SLOTS_EQUIPEMENT).forEach((slot) => {
    const cible = (slot === 'acc1' || slot === 'acc2') ? 'accessoire' : slot;
    const piece = meilleurePieceLegendaire(classe, cible, niveau);
    if (piece) p.equipement[slot] = piece;
  });
  p.maxHp = maxHpDe(p);
  p.maxMp = maxMpDe(p);
  return p;
}

// Le niveau RÉEL d'une zone : ses monstres sont écrits un à sept niveaux
// au-dessus de son niveau d'entrée. C'est ce niveau-là que le contenu
// oppose vraiment au joueur, et donc celui sur lequel on juge la tension.
function niveauReelZone(zone) {
  const monstres = (zone.monstres || []).map((cle) => MONSTRES[cle]).filter(Boolean);
  if (!monstres.length) return zone.niveauMin;
  return Math.round(monstres.reduce((a, m) => a + m.niveau, 0) / monstres.length);
}

// La tension d'une zone, vue par les six classes. `reference` est la
// médiane — celle sur laquelle le bestiaire est calibré ; `pire` et
// `meilleure` disent si l'écart entre classes reste vivable.
function tensionZone(zone, taille = 3) {
  const monstres = (zone.monstres || []).map((cle) => MONSTRES[cle]).filter(Boolean);
  if (!monstres.length) return null;
  const niveau = niveauReelZone(zone);
  const mesures = classesEtalon()
    .map((classe) => ({ classe, t: tensionCombat(monstres, personaEquipeNormalement(classe, niveau), taille) }))
    .sort((a, b) => a.t.marge - b.t.marge);
  const mediane = mesures[Math.floor(mesures.length / 2)];
  return {
    niveau,
    reference: mediane.t,
    pire: mesures[0].t,
    pireClasse: mesures[0].classe,
    meilleure: mesures[mesures.length - 1].t,
    meilleureClasse: mesures[mesures.length - 1].classe,
  };
}

// Réinitialise le cache — les tests qui bricolent le catalogue en ont besoin.
function oublierEtalon() {
  indexEquipement = null;
  indexLegendaire = null;
  Object.keys(memoPuissances).forEach((cle) => delete memoPuissances[cle]);
}
