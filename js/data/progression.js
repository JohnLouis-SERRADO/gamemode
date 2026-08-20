'use strict';

// =====================================================================
// Progression : niveaux, XP, stats effectives, puissance
// =====================================================================

// =====================================================================
// v28 — LA COURBE D'XP DEVIENT GÉOMÉTRIQUE, ET ELLE LE DIT.
//
// L'ancienne courbe se lisait en trois tronçons (linéaire jusqu'au 50,
// puis deux quadratiques de plus en plus raides). Les raccords étaient
// continus, mais la FORME ne l'était pas : sur le graphique du codex, le
// coût d'un niveau rampait pendant soixante niveaux puis explosait — le
// joueur ne sentait aucune pente, puis un mur.
//
// La v28 remplace tout ça par UNE seule règle, lisible et sans couture :
// chaque niveau coûte 9 % de plus que le précédent. C'est une vraie
// exponentielle, douce au début, ferme à la fin, sans le moindre coude.
// Les deux extrémités de l'ancienne courbe sont préservées : le niveau 2
// coûte toujours 44 XP, le niveau 100 coûte ~205 000 XP et le cumul
// reste ~2,5 millions — les repères des joueurs ne bougent pas.
//
// Les points de caractéristiques suivent la même philosophie : DEUX par
// niveau, tous les niveaux, sans palier ni prime cachée (voir
// pointsPourNiveau).
// =====================================================================
const NIVEAU_MAX = 100;
const POINTS_PAR_NIVEAU = 2;   // pour TOUS les niveaux — voir pointsPourNiveau()

// La raison de la progression : chaque niveau coûte 9 % de plus que le
// précédent. Et le premier vrai palier — passer du niveau 1 au niveau 2 —
// coûte 44 XP, comme depuis la première version du jeu.
const RAISON_XP = 1.09;
const COUT_PREMIER_PALIER = 44;

// Les tranches de CONTENU, elles, ne bougent pas : les Marches Fêlées
// s'ouvrent après le niveau 50, la Couture après le 80. Ces bornes ne
// pilotent plus la courbe d'XP — elles disent où commence chaque acte.
const PALIER_XP_MOYEN = 50;
const PALIER_XP_HAUT = 80;

// La courbe se définit par ses INCRÉMENTS plutôt que par son cumul. Un
// niveau ne coûte jamais moins cher que le précédent : avec une raison
// fixe au-dessus de 1, c'est garanti par construction.
function incrementXp(n) {
  if (n <= 1) return 0;
  return Math.round(COUT_PREMIER_PALIER * Math.pow(RAISON_XP, n - 2));
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
//
// v28 : DEUX points, à chaque niveau, sans exception. L'ancienne grille
// (2 puis 3 puis 4, plus deux primes de +10 aux niveaux 90 et 100) rendait
// la dotation illisible : personne ne pouvait dire de tête ce que valait
// un niveau. Désormais un niveau vaut deux points, point. Les héros
// d'avant la réforme gardent leur avance : la migration ne reprend jamais
// rien (voir migrerCaracteristiques et le Puits de Mémoire).
function pointsPourNiveau(n) {
  return n <= 1 ? 0 : POINTS_PAR_NIVEAU;
}

// Total des points distribués entre le niveau 1 et le niveau n (hors
// création). Sert à recalculer une dotation après une migration.
function pointsCumules(n) {
  return Math.max(0, (n || 1) - 1) * POINTS_PAR_NIVEAU;
}

// =====================================================================
// Stats effectives : attributs de base + équipement + familier + panoplies
//
// Un bonus d'objet peut porter :
//   • un attribut principal    for, dex, int, esp, vit, cha
//   • une réserve              pvMax, pmMax
//   • une sous-caractéristique crit, direct, deter, celerite, piete
// =====================================================================
const CLES_SOUS_CARACS = Object.keys(SOUS_CARACS);

function statsVides() {
  const s = { for: 0, dex: 0, int: 0, esp: 0, vit: 0, cha: 0, pvMax: 0, pmMax: 0 };
  CLES_SOUS_CARACS.forEach((cle) => { s[cle] = 0; });
  return s;
}

function statsEffectives(p) {
  // Les héros distants (expéditions multi-écrans) arrivent avec leurs
  // stats effectives déjà calculées sur leur propre appareil — parfois par
  // une version antérieure du jeu, qui y glisse encore des sous-caracs
  // supprimées depuis. On les jette ici plutôt que de les laisser circuler.
  if (p.statsEff) {
    const recu = { ...statsVides(), ...p.statsEff };
    SOUS_CARACS_RETIREES.forEach((cle) => { delete recu[cle]; });
    return recu;
  }
  // Combattant reconstruit sans stats (état réseau incomplet) : zéros sûrs.
  if (!p.stats) return statsVides();
  const s = statsVides();
  Object.keys(CARACS).forEach((cle) => { s[cle] = p.stats[cle] || 0; });

  // Bonus de sous-classe : calculé, jamais stocké dans p.stats. Changer de
  // spécialité reste ainsi une opération propre, sans reliquat.
  const sousClasse = typeof sousClasseDe === 'function' ? sousClasseDe(p) : null;
  if (sousClasse) {
    Object.entries(sousClasse.bonusStats || {}).forEach(([cle, valeur]) => {
      s[cle] = (s[cle] || 0) + valeur;
    });
  }

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
  // v28 — Le titre PORTÉ compte : certains hauts faits offrent un bonus,
  // appliqué seulement quand leur titre est affiché. Les bonus en % (XP,
  // or, dégâts, soins) sont servis à leurs points d'application, comme
  // ceux du familier.
  const titrePorte = typeof titreActifDe === 'function' ? titreActifDe(p) : null;
  if (titrePorte && titrePorte.bonus) {
    Object.entries(titrePorte.bonus).forEach(([cle, valeur]) => {
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
  const base = 25 + s.vit * 7 + (p.niveau - 1) * 6 + s.pvMax;
  // Métamorphe : sous la forme d'ours, la carcasse s'épaissit. Ses Éveils
  // supérieurs lui laissent une part du bonus de l'AUTRE forme.
  const partOurs = reglagePassif(p, 'pvOurs', 0);
  const cumul = reglagePassif(p, 'formesCumulees', 0);
  const ours = p.forme === 'ours' ? partOurs : partOurs * cumul;
  // Colosse du Géant, Métamorphe de l'Ours : la Voie ajoute sa masse.
  const voie = reglagePassif(p, 'pvMaxVoie', 0);
  const total = Math.round(base * (1 + ours) * (1 + voie));
  // Contrainte divine du tank : ses PV sont plafonnés.
  const plafond = reglagePassif(p, 'plafondPvMax', 0);
  return plafond ? Math.max(1, Math.round(total * plafond)) : total;
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
// v20 — L'ÉCHELLE DE L'ÉQUIPEMENT : le seul endroit où se règle le poids
// du butin dans un héros.
//
// CE QUI N'ALLAIT PAS. Une pièce de niveau n apportait à elle seule ~0,7
// fois TOUS les points de caractéristique gagnés depuis le niveau 1.
// Multiplié par huit emplacements, l'équipement pesait 88 % du héros : le
// personnage ne comptait plus, seul son butin comptait. Un niveau 22 bien
// équipé écrasait le contenu de niveau 50, et les sous-caractéristiques
// (critique, détermination, et la ténacité d'alors — les multiplicateurs
// de dégâts)
// touchaient la moitié de leur plafond dès le niveau 22.
//
// LA RÈGLE DE LA v20. L'équipement complet vaut ~40 % des caractéristiques
// d'un héros : assez pour que le butin fasse rêver, pas assez pour
// remplacer la progression. Les trois générateurs — butin d'aventure,
// étal du marchand, forges d'artisan — passent tous par ces fonctions.
// Un seul endroit à régler, et les tests le surveillent.
//
// La rareté, elle, s'écarte PLUS qu'avant (voir MULT_RARETE_BUTIN) : les
// chiffres baissent, mais l'écart entre un commun et un divin se creuse.
// Trouver une pièce divine doit rester un événement.
// =====================================================================
const ECHELLE_EQUIPEMENT = {
  principaleBase: 0.294,
  principalePente: 0.0422,
  partSecondaire: 0.35,
  reservePvPente: 0.42,
  reservePmPente: 0.32,
  defensifBase: 0.4,
  defensifPente: 0.022,
  sousCaracBase: 0.45,
  sousCaracPente: 0.055,
};

// Stat principale d'une pièce : ce qui décide de tout le reste.
function statPrincipaleObjet(niveau, mult) {
  const e = ECHELLE_EQUIPEMENT;
  return Math.max(1, Math.round((e.principaleBase + niveau * e.principalePente) * mult));
}

// Stat secondaire : une fraction de la principale, jamais moins de 1.
function statSecondaireObjet(principal) {
  return Math.max(1, Math.round(principal * ECHELLE_EQUIPEMENT.partSecondaire));
}

// Réserves (PV/PM max). Elles pèsent moins qu'une caractéristique dans le
// score de puissance, elles peuvent donc rester un peu plus généreuses.
function reservePvObjet(niveau, mult) {
  return Math.max(1, Math.round(niveau * ECHELLE_EQUIPEMENT.reservePvPente * mult));
}

function reservePmObjet(niveau, mult) {
  return Math.max(1, Math.round(niveau * ECHELLE_EQUIPEMENT.reservePmPente * mult));
}

// Bonus défensif des gants et des bottes.
function statDefensiveObjet(niveau, mult) {
  const e = ECHELLE_EQUIPEMENT;
  return Math.max(1, Math.round((e.defensifBase + niveau * e.defensifPente) * mult));
}

// Une sous-caractéristique portée par une pièce. Elle doit approcher son
// plafond en toute fin de partie, pas au premier tiers.
function sousCaracObjet(niveau, mult) {
  const e = ECHELLE_EQUIPEMENT;
  return Math.max(1, Math.round((e.sousCaracBase + niveau * e.sousCaracPente) * mult));
}

// Ce que « vaut » un jeu de bonus, dans la monnaie de puissanceDe. Sert à
// comparer deux pièces qui ne portent pas les mêmes lignes — et à tenir le
// catalogue écrit à la main sur la même échelle que les générateurs.
function valeurBonusObjet(bonus) {
  return Object.entries(bonus || {}).reduce((total, [cle, valeur]) => {
    if (cle === 'pvMax') return total + valeur * 0.8;
    if (cle === 'pmMax') return total + valeur * 0.6;
    if (CARACS[cle]) return total + valeur * 6;
    if (SOUS_CARACS[cle]) return total + valeur * 8;
    return total;
  }, 0);
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

// =====================================================================
// v20 — La puissance conseillée, calibrée sur des héros RÉELS.
//
// L'ancienne formule reconstituait un héros de référence à la main… et
// modélisait son équipement par un forfait de niveau × 9,4. Un joueur
// correctement équipé affichait donc 6 à 7 fois le chiffre « conseillé » à
// tous les niveaux : au niveau 22 on dépassait déjà la recommandation du
// niveau 100. L'indicateur ne pouvait structurellement pas dire vrai.
//
// Désormais la référence est mesurée, pas devinée. PUISSANCE_ETALON donne,
// pour chaque niveau, la puissance du héros LE PLUS FORT que le jeu
// autorise — dans la classe la MOINS bien lotie, parce qu'un contenu
// taillé pour la meilleure classe serait infranchissable pour les autres.
// Le tableau est produit par js/data/equilibrage.js — régénérable d'une
// commande : `node outils/generer-tables.js --ecrire` — et vérifié à
// chaque exécution des tests : s'il dérive d'un point, la suite passe au
// rouge. (v28 : régénéré pour la dotation à deux points par niveau.)
// =====================================================================
const PUISSANCE_ETALON = [
     411,    504,    639,    729,    799,    979,   1051,   1127,   1165,   1516,  // 1–10
    1572,   1755,   1806,   2265,   2342,   2400,   2663,   2721,   2785,   2848,  // 11–20
    2888,   2952,   3010,   3311,   3373,   3663,   3748,   3805,   3870,   3932,  // 21–30
    3997,   4318,   4375,   4440,   4552,   4708,   4772,   4830,   4966,   5418,  // 31–40
    5480,   5544,   5602,   5667,   5777,   5913,   5977,   6035,   6099,   6163,  // 41–50
    6228,   6290,   7241,   7328,   7393,   7458,   7522,   7578,   7642,   7780,  // 51–60
    7815,   7909,   7940,   8101,   8136,   8231,   8266,   8985,   9020,   9115,  // 61–70
    9150,   9243,   9275,   9461,   9496,   9589,   9625,   9713,   9748,   9865,  // 71–80
    9901,  10115,  10147,  10237,  10274,  10365,  10401,  11714,  11751,  11914,  // 81–90
   11950,  12068,  12100,  12190,  12227,  12390,  12425,  13804,  13841,  13991,  // 91–100
];

// Ce que l'étalon a de plus qu'un joueur réel : huit pièces DIVINES, la
// rareté la plus rare du jeu. Un joueur bien équipé — pièces légendaires
// partout, ce qui est déjà une belle collection — pèse 0,72 fois l'étalon
// (mesuré, voir les tests). C'est cette barre-là qu'on conseille : la
// franchir veut dire « vous êtes prêt », rester dessous veut dire « il
// vous manque de l'équipement, pas des niveaux ».
const FACTEUR_RECOMMANDATION = 0.72;

function puissanceEtalon(niveau) {
  const n = Math.min(NIVEAU_MAX, Math.max(1, Math.round(niveau) || 1));
  return PUISSANCE_ETALON[n - 1];
}

function puissanceRecommandee(niveau) {
  return Math.round(puissanceEtalon(niveau) * FACTEUR_RECOMMANDATION);
}

// Étiquette HTML « puissance conseillée » colorée selon le héros.
function texteRecommandation(p, niveau) {
  const requis = puissanceRecommandee(niveau);
  const ok = puissanceDe(p) >= requis;
  return `<span class="reco-puissance ${ok ? 'reco-ok' : 'reco-risque'}" title="Votre puissance : ${puissanceDe(p)}">⚡ ${requis} conseillé${ok ? ' ✓' : ' ⚠️'}</span>`;
}
