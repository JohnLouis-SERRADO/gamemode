'use strict';

// =====================================================================
// Progression : niveaux, XP, stats effectives, puissance
// =====================================================================

// =====================================================================
// v19 — La route va désormais jusqu'au niveau 100.
//
// La courbe d'XP se lit en trois tronçons, et le raccord est continu :
//   1 → 50   la courbe historique, inchangée (les héros existants ne
//            voient aucune différence sur le chemin déjà parcouru) ;
//   51 → 80  les Marches Fêlées : la pente se redresse nettement ;
//   81 → 100 la Couture : le dernier palier se mérite.
//
// Les points de caractéristiques suivent le même découpage, avec deux
// paliers de respiration à 90 et 100.
// =====================================================================
const NIVEAU_MAX = 100;
const POINTS_PAR_NIVEAU = 2;   // tranche 1-50 ; voir pointsPourNiveau()

// Bornes des trois tronçons de la courbe.
const PALIER_XP_MOYEN = 50;
const PALIER_XP_HAUT = 80;

// La courbe se définit par ses INCRÉMENTS plutôt que par son cumul : c'est
// le seul moyen de garantir qu'elle ne fait ni marche ni creux aux raccords.
// Un niveau ne doit jamais coûter moins cher que le précédent — sinon le
// joueur sent la couture, et la progression paraît cassée.
//
// Sous le niveau 50, l'incrément vaut exactement 28n − 12, ce qui redonne
// la courbe historique au palier près : les héros existants ne voient
// aucune différence sur le chemin déjà parcouru.
function incrementXp(n) {
  if (n <= 1) return 0;
  if (n <= PALIER_XP_MOYEN) return 28 * n - 12;
  const raccordMoyen = 28 * PALIER_XP_MOYEN - 12;
  if (n <= PALIER_XP_HAUT) {
    return Math.round(raccordMoyen * Math.pow(1 + (n - PALIER_XP_MOYEN) * 0.09, 2));
  }
  const raccordHaut = Math.round(raccordMoyen * Math.pow(1 + (PALIER_XP_HAUT - PALIER_XP_MOYEN) * 0.09, 2));
  return Math.round(raccordHaut * Math.pow(1 + (n - PALIER_XP_HAUT) * 0.12, 2));
}

// XP cumulée requise pour atteindre le niveau n. Mémorisée : la courbe est
// lue à chaque affichage de barre d'expérience.
const SEUILS_XP = [0, 0];

function seuilXp(n) {
  if (n <= 1) return 0;
  for (let i = SEUILS_XP.length; i <= n; i++) SEUILS_XP[i] = SEUILS_XP[i - 1] + incrementXp(i);
  return SEUILS_XP[n];
}

function niveauPour(xp) {
  let n = 1;
  while (n < NIVEAU_MAX && xp >= seuilXp(n + 1)) n++;
  return n;
}

// Points de caractéristiques gagnés EN ATTEIGNANT le niveau n.
// Les niveaux 90 et 100 offrent une dotation exceptionnelle : franchir un
// palier rond doit se sentir.
function pointsPourNiveau(n) {
  if (n <= 1) return 0;
  let points = n <= PALIER_XP_MOYEN ? 2 : (n <= PALIER_XP_HAUT ? 3 : 4);
  if (n === 90 || n === 100) points += 10;
  return points;
}

// Total des points distribués entre le niveau 1 et le niveau n (hors
// création). Sert à recalculer une dotation après une migration.
function pointsCumules(n) {
  let total = 0;
  for (let i = 2; i <= n; i++) total += pointsPourNiveau(i);
  return total;
}

// =====================================================================
// Stats effectives : attributs de base + équipement + familier + panoplies
//
// Un bonus d'objet peut porter :
//   • un attribut principal    for, dex, int, esp, vit, cha
//   • une réserve              pvMax, pmMax
//   • une sous-caractéristique crit, direct, deter, tenacite, celerite, piete
// =====================================================================
const CLES_SOUS_CARACS = Object.keys(SOUS_CARACS);

function statsVides() {
  const s = { for: 0, dex: 0, int: 0, esp: 0, vit: 0, cha: 0, pvMax: 0, pmMax: 0 };
  CLES_SOUS_CARACS.forEach((cle) => { s[cle] = 0; });
  return s;
}

function statsEffectives(p) {
  // Les héros distants (expéditions multi-écrans) arrivent avec leurs
  // stats effectives déjà calculées sur leur propre appareil.
  if (p.statsEff) return { ...statsVides(), ...p.statsEff };
  // Combattant reconstruit sans stats (état réseau incomplet) : zéros sûrs.
  if (!p.stats) return statsVides();
  const s = statsVides();
  Object.keys(CARACS).forEach((cle) => { s[cle] = p.stats[cle] || 0; });

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
  // Les sous-caractéristiques plafonnent : pas de build à 100 % de rien.
  CLES_SOUS_CARACS.forEach((cle) => {
    s[cle] = Math.min(s[cle], PLAFONDS_SOUS_CARACS[cle]);
  });
  return s;
}

// Valeur d'une sous-caractéristique, déjà plafonnée, en fraction (0 → 1).
function sousCarac(s, cle) {
  return Math.min(s[cle] || 0, PLAFONDS_SOUS_CARACS[cle]) / 100;
}

function maxHpDe(p) {
  const s = statsEffectives(p);
  return 25 + s.vit * 7 + (p.niveau - 1) * 6 + s.pvMax;
}

// La Piété gonfle la réserve de mana : c'est la sous-caractéristique des
// soigneurs et des lanceurs qui veulent tenir la distance.
function maxMpDe(p) {
  const s = statsEffectives(p);
  const base = 8 + s.int * 3 + s.esp * 3 + (p.niveau - 1) * 2 + s.pmMax;
  return Math.round(base * (1 + sousCarac(s, 'piete')));
}

// Borne les PV/PM courants après un changement d'équipement ou de niveau.
function bornerVie(p) {
  p.hp = Math.max(0, Math.min(maxHpDe(p), p.hp));
  p.mp = Math.max(0, Math.min(maxMpDe(p), p.mp));
}

// =====================================================================
// v17 : la PUISSANCE — un score unique qui résume un héros : ses
// caractéristiques effectives, ses PV/PM, ses sous-caractéristiques et la
// qualité de son équipement (niveau × rareté). Affichée partout, et
// comparée aux recommandations des cartes.
// =====================================================================
function puissanceDe(p) {
  if (!p) return 0;
  const s = statsEffectives(p);
  let score = Object.keys(CARACS).reduce((somme, cle) => somme + (s[cle] || 0), 0) * 6;
  score += Math.round((p.maxHp || maxHpDe(p)) * 0.8);
  score += Math.round((p.maxMp || maxMpDe(p)) * 0.6);
  score += CLES_SOUS_CARACS.reduce((somme, cle) => somme + (s[cle] || 0), 0) * 8;
  Object.values(p.equipement || {}).forEach((idObjet) => {
    const objet = idObjet && OBJETS[idObjet];
    if (!objet) return;
    const mult = (typeof MULT_RARETE_CRAFT !== 'undefined' && MULT_RARETE_CRAFT[rareteDe(objet)]) || 1;
    score += Math.round((objet.niveau || 1) * mult * 4);
  });
  score += (p.niveau || 1) * 10;
  return Math.round(score);
}

// Puissance conseillée pour aborder un contenu de niveau n. Calibrée sur
// un héros de référence : ses points de niveau répartis sur deux attributs,
// et un équipement de sa tranche. La courbe est volontairement continue —
// un palier de recommandation qui saute donne l'impression d'un mur.
function puissanceRecommandee(niveau) {
  const n = Math.min(NIVEAU_MAX, Math.max(1, niveau || 1));
  const points = POINTS_CREATION + 6 * STAT_BASE + pointsCumules(n);
  const pvReference = 25 + points * 0.35 * 7 + (n - 1) * 6 + n * 3;
  const pmReference = 8 + points * 0.3 * 3 + (n - 1) * 2 + n * 2;
  const equipement = n * 8 + n * 1.4;
  return Math.round(points * 6 + pvReference * 0.8 + pmReference * 0.6 + equipement + n * 10);
}

// Étiquette HTML « puissance conseillée » colorée selon le héros.
function texteRecommandation(p, niveau) {
  const requis = puissanceRecommandee(niveau);
  const ok = puissanceDe(p) >= requis;
  return `<span class="reco-puissance ${ok ? 'reco-ok' : 'reco-risque'}" title="Votre puissance : ${puissanceDe(p)}">⚡ ${requis} conseillé${ok ? ' ✓' : ' ⚠️'}</span>`;
}
