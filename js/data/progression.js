'use strict';

// =====================================================================
// Progression : niveaux, XP, stats effectives, puissance
// =====================================================================

// =====================================================================
// Progression (niveau 1 à 20)
// =====================================================================
const NIVEAU_MAX = 50;
const POINTS_PAR_NIVEAU = 2;
// v18 : plus de compétence offerte aux paliers de niveau. Hors compétences
// de classe (automatiques aux niveaux 5, 10 et 15), tout nouveau sort
// s'achète en grimoire à l'Arcanium.

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

// =====================================================================
// v17 : la PUISSANCE — un score unique qui résume un héros : ses
// caractéristiques effectives, ses PV/PM, ses stats secondaires et la
// qualité de son équipement (niveau × rareté). Affichée partout, et
// comparée aux recommandations des cartes.
// =====================================================================
function puissanceDe(p) {
  if (!p) return 0;
  const s = statsEffectives(p);
  let score = (s.for + s.int + s.agi + s.vit + (s.cha || 0)) * 6;
  score += Math.round((p.maxHp || maxHpDe(p)) * 0.8);
  score += Math.round((p.maxMp || maxMpDe(p)) * 0.6);
  score += ((s.crit || 0) + (s.blocage || 0) + (s.esquive || 0)) * 8;
  Object.values(p.equipement || {}).forEach((idObjet) => {
    const objet = idObjet && OBJETS[idObjet];
    if (!objet) return;
    const mult = (typeof MULT_RARETE_CRAFT !== 'undefined' && MULT_RARETE_CRAFT[rareteDe(objet)]) || 1;
    score += Math.round((objet.niveau || 1) * mult * 4);
  });
  score += (p.niveau || 1) * 10;
  return Math.round(score);
}

// Puissance conseillée pour aborder un contenu de niveau n (calibrée sur
// un héros correctement équipé de son niveau).
function puissanceRecommandee(niveau) {
  const n = Math.max(1, niveau || 1);
  return Math.round(150 + n * 55 + n * n * 1.1);
}

// Étiquette HTML « puissance conseillée » colorée selon le héros.
function texteRecommandation(p, niveau) {
  const requis = puissanceRecommandee(niveau);
  const ok = puissanceDe(p) >= requis;
  return `<span class="reco-puissance ${ok ? 'reco-ok' : 'reco-risque'}" title="Votre puissance : ${puissanceDe(p)}">⚡ ${requis} conseillé${ok ? ' ✓' : ' ⚠️'}</span>`;
}
