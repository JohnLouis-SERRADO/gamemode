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
    (parSlot[objet.slot] = parSlot[objet.slot] || []).push({ id, objet });
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
      let pvCourant = -1;
      let i = 0;
      for (let n = 1; n <= NIVEAU_MAX; n++) {
        while (i < liste.length && (liste[i].objet.niveau || 1) <= n) {
          const candidat = liste[i];
          i++;
          if (!peutPorter(factice, candidat.objet)) continue;
          const valeur = valeurDePiecePour(classe, candidat.objet);
          // Monter en niveau ne doit JAMAIS faire perdre de la vie : on ne
          // troque pas contre une pièce qui rend plus fragile, même mieux
          // notée. Sans cette règle, les points de vie de l'étalon
          // reculaient sur une dizaine de niveaux et toute la courbe de
          // difficulté héritait de la dent de scie.
          const pv = pvDePiece(candidat.objet);
          if (valeur > valeurCourante && pv >= pvCourant) {
            valeurCourante = valeur; pvCourant = pv; courant = candidat.id;
          }
        }
        meilleur[n] = courant;
      }
      parClasse[slot] = meilleur;
    });
  });
  return indexEquipement;
}

// =====================================================================
// v21.2 — CE QUE VAUT UNE PIÈCE, ET POUR QUI.
//
// La valeur d'une pièce était son SCORE de puissance : la somme de ses
// caractéristiques à poids égal. Un optimiseur qui suit ce score troque
// volontiers 25 de Vitalité contre 30 de Force — il y gagne 30 points de
// score et il y perd 175 points de vie.
//
// C'est exactement ce qui se passait. Mesuré sur les six classes : les
// points de vie de l'étalon RECULAIENT sur neuf à douze niveaux sur cent,
// jusqu'à −25 % d'un niveau au suivant. Gagner un niveau faisait perdre de
// la vie. Et comme toute la difficulté est dérivée de ce héros-là, la
// courbe des monstres héritait de la dent de scie : le coup d'un monstre
// coûtait de 3,3 % à 6,6 % des points de vie selon le niveau — du simple au
// double — avec des ruptures de 36 % entre deux niveaux voisins.
//
// Une pièce se juge donc désormais POUR LA CLASSE qui la porte. Sa
// caractéristique maîtresse et sa Vitalité comptent plein tarif ; les
// caractéristiques qui ne lui servent à rien comptent au tiers. C'est le
// même principe que la répartition 60/40 de personaReference, appliqué au
// butin : l'étalon vise le meilleur JOUEUR possible, pas le meilleur
// chiffre possible.
// =====================================================================
const POIDS_HORS_ROLE = 0.33;

// Les sous-caractéristiques pèsent plus lourd ici que dans puissanceDe (8) :
// ce sont elles qui font la personnalité d'un build, et un optimiseur qui les
// sous-estime habille l'étalon en caractéristiques brutes. Réglé par mesure —
// en dessous, la saturation des sous-caracs au niveau 100 tombe sous les 70 %
// exigés par les tests, et l'équipement se met à peser plus de la moitié du
// héros.
const POIDS_SOUS_CARAC = 16;

// Les points de vie qu'une pièce apporte, dans la monnaie de maxHpDe.
function pvDePiece(objet) {
  const bonus = (objet && objet.bonus) || {};
  return (bonus.vit || 0) * 7 + (bonus.pvMax || 0);
}

// Ce que vaut une pièce POUR CETTE CLASSE.
function valeurDePiecePour(classe, objet) {
  const mult = (typeof MULT_RARETE_CRAFT !== 'undefined' && MULT_RARETE_CRAFT[rareteDe(objet)]) || 1;
  const base = CLASSES_BASE[classe];
  const maitresse = (base && base.stat) || 'for';
  let valeur = 0;
  Object.entries(objet.bonus || {}).forEach(([cle, v]) => {
    if (cle === 'pvMax') { valeur += v * 0.8; return; }
    if (cle === 'pmMax') { valeur += v * 0.6; return; }
    if (SOUS_CARACS[cle]) {
      // Et la sous-caractéristique défensive de SON armure compte double :
      // un soigneur en tissu monte sa Piété, un cuir sa Célérité. Sans ça,
      // l'étalon soigneur finissait avec 2 % de Piété — et mourait à court
      // de mana faute d'avoir jamais ramassé sa propre statistique.
      const profil = (typeof PROFIL_ARMURE !== 'undefined')
        && PROFIL_ARMURE[(EQUIPEMENT_PAR_CLASSE[classe] || {}).armure];
      const sienne = profil && profil.defensif === cle;
      valeur += v * POIDS_SOUS_CARAC * (sienne ? 2 : 1);
      return;
    }
    if (!CARACS[cle]) return;
    // La caractéristique de la classe et la Vitalité valent plein tarif :
    // l'une fait ses dégâts, l'autre le garde debout. Le reste est du décor.
    const plein = (cle === maitresse || cle === 'vit');
    valeur += v * 6 * (plein ? 1 : POIDS_HORS_ROLE);
  });
  return valeur + (objet.niveau || 1) * mult * 4;
}

// Ce que vaut une pièce dans l'absolu — la monnaie de puissanceDe. Sert
// encore là où aucune classe n'est en jeu.
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
//   • la MARGE     vie totale ÷ dégâts encaissés pour nettoyer le groupe.
//                  2,0 veut dire « un groupe coûte la moitié de sa vie ».
//                  Doit rester dans une fourchette étroite du niveau 1
//                  au niveau 100.
//   • le PIRE COUP la plus grosse claque encaissable en un coup, en % des
//                  PV. Aucun monstre ne doit jamais « one shot ».
//   • la RIPOSTE   ce que le héros enlève en un coup, en % des PV du
//                  monstre. Un monstre qui tombe en un coup n'est pas un
//                  combat, c'est un décor.
//
// =====================================================================
// v21.1 — CE BANC MENTAIT, ET IL A FALLU JOUER POUR S'EN APERCEVOIR.
//
// Simulation de vrais combats, moteur du jeu à la main, trente parties par
// classe et par palier : cinq classes sur six gagnaient 100 % du temps, sans
// une seule mort du niveau 5 au niveau 94, en terminant avec 74 à 100 % de
// leurs points de vie. Le Runelame finissait TOUS ses combats intact. Le
// banc, lui, annonçait tranquillement une marge de 2 — « un groupe coûte la
// moitié de la vie ». Il se trompait d'un facteur trois, et il se trompait
// pour deux raisons, toutes les deux structurelles :
//
//  1. IL NE FAISAIT JAMAIS MOURIR LES MONSTRES. Le modèle multipliait les
//     dégâts d'un monstre par la taille du groupe et par la durée TOTALE du
//     combat — comme si les trois bêtes frappaient encore au dernier tour.
//     Dans un vrai combat, le héros concentre ses coups : la première tombe
//     au tiers du combat et cesse de mordre. Le groupe encaissé vaut donc
//     bien moins que trois monstres pendant tout le combat.
//
//  2. IL IGNORAIT LES LIGNES DE COMBAT. Aucune attaque de monstre ne passe
//     l'option `magique` : elles sont toutes PHYSIQUES, et infligerDegats
//     retranche 40 % à ce que subit un héros de ligne arrière. Trois classes
//     sur six — Franc-tireur, Arcaniste, Devin — combattent en ligne arrière
//     et prenaient donc 0,6× ce que le banc leur comptait. Mesuré en jeu au
//     niveau 20 : 5 de dégâts en ligne arrière contre 9 en ligne avant.
//
// La tension se calcule désormais en DÉROULANT le combat tour par tour, avec
// les monstres qui tombent et la ligne du héros. C'est un peu plus de calcul,
// c'est déterministe, et surtout ça ne peut plus s'écarter du jeu sans que
// les tests le voient.
// =====================================================================

// Les attaques de monstre n'étant jamais magiques, un héros de ligne arrière
// en retranche 40 % — exactement comme dans infligerDegats.
function facteurLigneDe(p) {
  const ligne = typeof ligneParDefaut === 'function' ? ligneParDefaut(p) : 'avant';
  return ligne === 'arriere' ? 0.6 : 1;
}

// Et la résistance de métier du Gardien (v21.3) : le banc doit la connaître,
// sinon il surestime ce que le tank encaisse — exactement le genre d'écart
// qui avait rendu ses chiffres faux.
function facteurResistanceDe(p) {
  if (typeof resistanceDeClasse !== 'function') return 1;
  // aPassif exige un combattant de type « joueur » : l'étalon n'en est pas
  // un, on le lui présente comme tel le temps de la lecture.
  return resistanceDeClasse({ classe: p.classe, type: 'joueur', statuts: [] });
}

// Dégâts moyens d'un héros par tour. Modèle simple et assumé : il frappe
// avec la meilleure compétence qu'il peut se payer, et retombe sur
// l'attaque de base quand elle recharge. Les hasards (critique, coup
// direct) entrent par leur espérance, pas par un tirage.
// Le malus de ligne SORTANT, par compétence : un coup non magique parti de
// la ligne arrière perd 40 % (infligerDegats) — le banc l'oubliait, et
// surestimait donc d'un bon tiers tout héros d'arrière-ligne non couvert.
function facteurLigneSortante(p, comp) {
  const ligne = typeof ligneParDefaut === 'function' ? ligneParDefaut(p) : 'avant';
  if (ligne !== 'arriere') return 1;
  if (comp && typeof estSortMagique === 'function' && estSortMagique(comp)) return 1;
  const fantoche = { classe: p.classe, type: 'joueur', statuts: [], sousClasse: p.sousClasse, voie: p.voie, eveil: p.eveil };
  if (typeof ignoreMalusDeLigne === 'function' && ignoreMalusDeLigne(fantoche)) return 1;
  return 0.6;
}

function degatsParTourHeros(p) {
  const s = statsEffectives(p);
  const base = degatsAttaqueDeBase(p, s) * facteurLigneSortante(p, null);

  let meilleure = base;
  (p.competences || []).forEach((id) => {
    const comp = COMPETENCES[id];
    if (!comp || comp.type !== 'degats') return;
    const brut = (comp.puissance + statDeCompetence(comp, s) * comp.ratio) * (comp.coups || 1)
      * facteurLigneSortante(p, comp);
    // Une compétence qui recharge n'est disponible qu'un tour sur (1+n) —
    // et la Célérité raccourcit les recharges (v28), le banc le sait.
    const cd = typeof rechargeAjustee === 'function' ? rechargeAjustee(p, comp) : (comp.cooldown || 0);
    const parts = 1 / (1 + cd);
    const moyenne = brut * parts + base * (1 - parts);
    if (moyenne > meilleure) meilleure = moyenne;
  });

  let d = meilleure;
  d *= 1 + sousCarac(s, 'deter');
  const crit = 0.05 + sousCarac(s, 'crit');
  const direct = sousCarac(s, 'direct');
  return d * (crit * 1.5 + (1 - crit) * (direct * 1.25 + (1 - direct)));
}

// Le coup le plus fort qu'un héros place en une fois — c'est lui qui dit
// si un monstre tombe d'une pichenette.
function plusGrosCoupHeros(p) {
  const s = statsEffectives(p);
  let brut = degatsAttaqueDeBase(p, s) * facteurLigneSortante(p, null);
  (p.competences || []).forEach((id) => {
    const comp = COMPETENCES[id];
    if (!comp || comp.type !== 'degats') return;
    const v = (comp.puissance + statDeCompetence(comp, s) * comp.ratio) * (comp.coups || 1)
      * facteurLigneSortante(p, comp);
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
  // v28 : la Détermination majore tous les soins — le banc compte comme
  // le moteur, sinon il sous-estime ce qu'un héros se rend.
  const deter = 1 + sousCarac(s, 'deter');
  (p.competences || []).forEach((id) => {
    const comp = COMPETENCES[id];
    if (!comp || comp.type !== 'soin') return;
    const soin = (comp.puissance + statDeCompetence(comp, s) * comp.ratio) * deter;
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
  // On ne peut pas relancer un soin plus souvent que sa recharge —
  // raccourcie par la Célérité, comme dans le moteur (v28).
  const cdSoin = typeof rechargeAjustee === 'function' ? rechargeAjustee(p, meilleur.comp) : (meilleur.comp.cooldown || 0);
  const parRecharge = toursAttaque / (1 + cdSoin);
  const parTemps = toursAttaque * PART_TOURS_DE_SOIN;
  const cout = Math.max(1, coutMpDe(meilleur.comp, s, p.maxMp));
  const parMana = p.maxMp / cout;
  const lancers = Math.max(0, Math.min(parRecharge, parTemps, parMana));
  return { soinTotal: lancers * meilleur.soin, toursDeSoin: lancers };
}

// Dégâts moyens d'un monstre sur ce héros, en un tour.
function degatsParTourMonstre(m, p) {
  const poids = (m.attaques || []).reduce((a, at) => a + (at.poids || 1), 0) || 1;
  const mult = (m.attaques || []).reduce((a, at) => a + (at.mult || 1) * (at.poids || 1), 0) / poids;
  // v21 : plus aucune réduction plate ne s'intercale. Ce que le bestiaire
  // écrit est ce que le joueur prend — la mesure est enfin directe.
  return m.atk * mult;
}

// Sa plus grosse attaque, elle : celle qui décide s'il peut tuer d'un coup.
function plusGrosCoupMonstre(m) {
  const pire = (m.attaques || []).reduce((a, at) => Math.max(a, at.mult || 1), 1);
  return m.atk * pire;
}

// Équipe le persona des compétences de sa classe : sans elles il tape
// comme un civil, et la mesure ne veut plus rien dire.
function personaArme(classe, niveau) {
  const p = personaReference(classe, niveau);
  const base = CLASSES_BASE[classe];
  // v26 : le persona possédait sa spécialité, sa Voie et son Éveil (voir
  // personaReference) mais ne lançait QUE les compétences de classe de
  // base — calibrées ×1,25 quand celles de son palier montent à ×2,4. On
  // mesurait un héros de niveau 80 avec ses sorts de niveau 15.
  const kit = new Set(base && base.competences ? base.competences : []);
  if (p.sousClasse && SOUS_CLASSES[p.sousClasse]) {
    (SOUS_CLASSES[p.sousClasse].competences || []).forEach((id) => kit.add(id));
  }
  if (p.voie && VOIES[p.voie]) kit.add(VOIES[p.voie].competence);
  if (p.eveil && EVEILS[p.eveil.id]) (EVEILS[p.eveil.id].competences || []).forEach((id) => kit.add(id));
  const s = statsEffectives(p);
  const valeurAuBanc = (id) => {
    const comp = COMPETENCES[id];
    if (!comp || (comp.niveauRequis || 1) > niveau) return -1;
    if (comp.type !== 'degats' && comp.type !== 'soin') return 0;
    const brut = (comp.puissance + statDeCompetence(comp, s) * (comp.ratio || 0)) * (comp.coups || 1);
    return brut / (1 + (comp.cooldown || 0)) * (comp.type === 'soin' ? 0.8 : 1);
  };
  p.competences = [...kit]
    .filter((id) => valeurAuBanc(id) >= 0)
    .sort((a, b) => valeurAuBanc(b) - valeurAuBanc(a))
    .slice(0, MAX_COMPETENCES_ACTIVES);
  return p;
}

// La tension d'une zone pour un héros donné, face à un groupe de `taille`.
//
// Le combat est DÉROULÉ, pas estimé : à chaque tour le héros frappe une bête
// — une seule, celle qu'il achève avant de passer à la suivante, comme le
// fait un joueur — puis les survivantes ripostent. Une bête morte ne frappe
// plus, et c'est précisément ce que l'ancien modèle oubliait.
function tensionCombat(monstres, p, taille = 3) {
  if (!monstres.length) return null;
  const moy = (f) => monstres.reduce((a, m) => a + f(m), 0) / monstres.length;
  const degatsHeros = Math.max(1, degatsParTourHeros(p));
  const pvMonstre = moy((m) => m.hp);
  const ligne = facteurLigneDe(p);
  const parMonstre = moy((m) => degatsParTourMonstre(m, p)) * ligne * facteurResistanceDe(p);

  let restants = taille;
  let pvCible = pvMonstre;
  let tours = 0;
  let recu = 0;
  // Le surplus d'un coup qui dépasse est perdu : on n'achève pas deux bêtes
  // du même geste. Le garde-fou à 2000 tours n'existe que pour qu'une
  // configuration absurde ne fige jamais la suite de tests.
  while (restants > 0 && tours < 2000) {
    tours++;
    pvCible -= degatsHeros;
    if (pvCible <= 0) { restants--; pvCible = pvMonstre; }
    recu += restants * parMonstre;
  }

  // Les soins qu'il se rend allongent sa vie ET son combat : c'est le même
  // tour qu'il n'a pas passé à frapper — et pendant lequel il encaisse.
  const auto = autoSoinPendantCombat(p, tours);
  const survivantsMoyens = recu / Math.max(1e-9, tours * parMonstre);
  const recuTotal = recu + auto.toursDeSoin * survivantsMoyens * parMonstre;
  const vie = p.maxHp + auto.soinTotal;
  const toursNettoyage = tours + auto.toursDeSoin;
  const marge = vie / Math.max(1, recuTotal);
  return {
    toursNettoyage,
    // Conservé pour la lecture : le nombre de tours que le héros tiendrait
    // à ce rythme d'encaissement.
    toursSurvie: toursNettoyage * marge,
    // 2,0 = nettoyer le groupe coûte la moitié de sa vie.
    marge,
    // Un « one shot » se lit ici : la pire claque en pourcentage des PV.
    pireCoupPct: moy((m) => plusGrosCoupMonstre(m)) * ligne * facteurResistanceDe(p) / p.maxHp,
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
        parSlot.push({ id, niveau: o.niveau || 1, valeur: valeurDePiecePour(c, o), pv: pvDePiece(o) });
      });
      Object.values(indexLegendaire[c]).forEach((l) => l.sort((a, b) => a.niveau - b.niveau));
    });
  }
  const liste = (indexLegendaire[classe] || {})[slot] || [];
  let meilleur = null;
  let valeur = -1;
  let pv = -1;
  for (let i = 0; i < liste.length && liste[i].niveau <= niveau; i++) {
    if (liste[i].valeur > valeur && liste[i].pv >= pv) {
      valeur = liste[i].valeur; pv = liste[i].pv; meilleur = liste[i].id;
    }
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
