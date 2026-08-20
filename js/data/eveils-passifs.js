'use strict';

// =====================================================================
// v24 — LES CENT SOIXANTE-DEUX ÉVEILS, ET LEURS CONTRAINTES
//
// Dernier étage du même chantier. La v22 a branché les 27 passifs de
// spécialité, la v23 les 81 passifs de Voie ; restaient les 162 Éveils du
// niveau 80 — le palier le plus rare du jeu, celui qu'on relance cinq
// fois pour décrocher un Mythique — dont le passif ET la contrainte
// n'étaient que du texte. Un « Fléau Premier » annonçait « tous ses coups
// sont critiques » et frappait comme n'importe qui.
//
// Même règle que pour les deux étages précédents : un Éveil déclare des
// RÉGLAGES, son texte est fabriqué à partir d'eux, et ses réglages se
// fusionnent par-dessus ceux de la Voie et de la spécialité.
//
// LA CONTRAINTE COMPTE AUTANT QUE L'EFFET. C'est elle qui tient la règle
// d'équilibrage §5.1 : « la rareté augmente la complexité et la
// contrainte, jamais le plafond de puissance ». Un Divin sans contrainte
// branchée, c'était un Divin gratuitement meilleur — exactement ce que le
// document de conception interdit. Les vingt contraintes (quatre raretés
// contraignantes × cinq rôles) sont donc branchées elles aussi, et leur
// texte est produit de la même façon.
//
// CE QUI A DÛ ÊTRE RÉÉCRIT. Une quinzaine d'Éveils promettaient des
// mécaniques hors du moteur : persistance de 24 h dans une zone, lecture
// des tirages de butin, copie du style d'un ennemi, invocation d'un boss
// vaincu, éléments et résistances. Ils gardent leur nom, leurs deux
// compétences et leur intention, dits avec ce qui existe.
// =====================================================================

// ---------------------------------------------------------------------
// 1. Le vocabulaire propre aux Éveils, en plus de celui des Voies.
// ---------------------------------------------------------------------
const PHRASES_EVEIL = {
  bouclierEquipeDepart: (v) => `toute l'équipe entre en combat couverte d'un bouclier valant ${pct(v)} de ses PV max`,
  partageDegatsEquipe: (v) => `${pct(v)} des dégâts subis par un allié sont répartis sur toute l'équipe`,
  sanctuaire: () => 'tant qu\'il est debout, aucun allié ne peut tomber : le coup fatal les laisse à 1 PV',
  renaissance: (v) => `il se relève une fois par combat à ${pct(v)} de ses PV`,
  invulnerabilitePeriodique: (v) => `une manche sur ${v}, l'équipe ne subit rien du tout`,
  parEnnemiPresent: (v) => `+${pct(v)} de dégâts par ennemi encore debout en face`,
  soinsBonus: (v) => `ses soins et ses boucliers valent ${pct(v)} de plus`,
  regenEquipe: (v) => `l'équipe régénère ${pct(v)} de ses PV à chaque tour`,
  immuniteStatuts: () => 'aucun état ne prend sur lui',
  plafondDegatsParCoup: (v) => `aucun coup ne peut lui retirer plus de ${pct(v)} de ses PV maximum`,
  critTotal: () => 'TOUS ses coups sont critiques',
  bonusPremierCoup: (v) => `+${pct(v)} sur le premier coup de chaque combat`,
  cibleDesignee: (v) => `il désigne une proie au premier tour : +${pct(v)} contre elle, et contre elle seule`,
  actionSiPropre: () => 'il agit une fois de plus dans la manche s\'il n\'a rien encaissé',
  esquiveSoi: (v) => `il évite ${pct(v)} des coups qui le visent`,
  bonusSansObjet: (v) => `+${pct(v)} de dégâts tant qu'il n'a bu aucune potion du combat`,
  actionsParTour: (v) => `il agit ${v} fois par manche`,
  executionSurCritique: (v) => `un critique sur une cible sous ${pct(v)} de ses PV la tue net`,
  bonusCibleIsolee: (v) => `+${pct(v)} de dégâts quand il ne reste qu'un seul ennemi`,
  brulureForce: (v) => `ses poisons et brûlures rongent ${pct(v)} plus fort`,
  propagationAuto: (v) => `${pct(v)} de chances par tour qu'un de ses états saute tout seul sur un voisin`,
  celeriteEnnemis: (v) => `les ennemis perdent ${v} de Célérité`,
  ennemisEntravesDepart: () => 'tous les ennemis entrent en combat déjà entravés',
  tousStatutsATous: () => 'un état qu\'il pose se pose sur TOUS les ennemis à la fois',
  formesCumulees: (v) => `il garde ${pct(v)} des bonus de la forme qu'il ne porte pas`,
  frappeDesDegatsRecus: (v) => `+${pct(v)} de dégâts par tranche de 100 PV encaissés depuis le début du combat`,
  transfertDegatsEquipe: (v) => `${pct(v)} des dégâts destinés à un allié passent par lui — il n'en encaisse que la moitié, et ils le nourrissent`,
  marqueTerrain: () => 'il marque TOUS les ennemis dès le premier tour',
  attaqueTousLesEnnemis: () => 'ses attaques simples frappent tous les ennemis à la fois',
  parCadavreDevore: (v, m) => `+${pct(v)} de dégâts par cadavre dévoré, jusqu'à ${m.maxCadavres} fois`,

  // --- Les contraintes. Elles retirent une option, jamais de la puissance. ---
  soinsAlliesInterdits: () => 'en échange, aucun allié ne peut le soigner : il ne compte que sur lui-même',
  soinsInterdits: () => 'en échange, plus aucun soin ne le touche : il ne tient que par les boucliers',
  zonesInterdites: () => 'en échange, il ne peut plus viser qu\'un ennemi à la fois — les dons de son propre Éveil exceptés',
  surcoutMana: (v) => `en échange, ses sorts coûtent ${pct(v)} de mana en plus`,
  degatsDirectsInterdits: () => 'en échange, il n\'inflige plus aucun dégât direct',
  saignementParTour: (v) => `en échange, il perd ${pct(v)} de ses PV maximum à chaque tour`,
  fragilite: (v) => `en échange, il encaisse ${pct(v)} de dégâts en plus`,
  plafondPvMax: (v) => `en échange, ses PV sont plafonnés à ${pct(v)} de son maximum`,
  unTourSurDeux: () => 'en échange, il n\'agit qu\'une manche sur deux',
  unKillParTour: () => 'en échange, il ne peut abattre qu\'un seul ennemi par manche',
  communesInterdites: () => 'en échange, il perd l\'accès aux compétences communes (les invocations restent siennes)',
  jamaisEnPremier: () => 'en échange, il agit toujours en dernier',
  fuiteInterdite: () => 'en échange, il ne peut plus fuir un combat',
  groupeInterdit: () => 'en échange, il ne peut plus rejoindre une expédition de groupe',
  bonusPerdusSiLigneChangee: () => 'en échange, changer de ligne lui coûte tous ses bonus d\'Éveil jusqu\'à la fin du combat',
  aucunBonusRarete: () => 'en échange, il perd tout bonus de rareté sur le butin',
  degatsReduits: (v) => `en échange, ses dégâts baissent de ${pct(v)}`,
};

// Le vocabulaire complet : celui des Voies, plus celui des Éveils.
const PHRASES_PASSIF = { ...PHRASES_VOIE, ...PHRASES_EVEIL };
const ORDRE_PHRASES_PASSIF = Object.keys(PHRASES_PASSIF);
const CLES_MUETTES_EVEIL = new Set([...CLES_MUETTES, 'maxCadavres']);

function textePassifComplet(mecaniques) {
  const morceaux = ORDRE_PHRASES_PASSIF
    .filter((cle) => mecaniques[cle] !== undefined && !CLES_MUETTES_EVEIL.has(cle))
    .map((cle) => PHRASES_PASSIF[cle](mecaniques[cle], mecaniques));
  if (!morceaux.length) return '';
  const phrase = morceaux.join(' ; ').replace(/ ; et /g, ', et ').replace(/ ; mais /g, ', mais ');
  return `${phrase.charAt(0).toUpperCase()}${phrase.slice(1)}.`;
}

// ---------------------------------------------------------------------
// 2. Les cent soixante-deux Éveils, dans l'ordre exact de TABLE_EVEILS.
//
// Six par spécialité : rare, épique, légendaire, mythique, divin, caché.
// L'index fait le lien — aucun identifiant recopié à la main.
// ---------------------------------------------------------------------
const MECANIQUES_EVEIL = {
  // ---------------- 🛡️ Gardien ----------------
  templier: [
    { bouclierEquipeDepart: 0.20 },
    { partageDegatsEquipe: 0.30 },
    { sanctuaire: true },
    { renaissance: 0.50 },
    { invulnerabilitePeriodique: 5 },
    { parEnnemiPresent: 0.15 },
  ],
  paladin: [
    { soinsBonus: 0.25 },
    { degatsEnSoinEquipe: 0.30 },
    { resurrection: 0.50 },
    { frappeDesDegatsRecus: 0.05 },
    { regenEquipe: 0.15 },
    { volDeVie: 0.20, dureeBonusStatut: 1 },
  ],
  'chevalier-noir': [
    { volDeVie: 0.40 },
    { volDeVie: 0.20, contreEntravee: 0.25 },
    // Sa contrainte légendaire de tank lui coupe déjà les soins alliés :
    // son effet n'a plus qu'à doubler ce qui le fait tenir debout.
    { volDeVie: 0.45 },
    { transfertDegatsEquipe: 0.40, volDeVie: 0.20 },
    { parMort: 0.06, plafondCharnier: 1.20, volDeVie: 0.20 },
    { volDeVie: 0.35, malusSoinsRecus: 1 },
  ],
  colosse: [
    { pvMaxVoie: 0.40 },
    { etourdiSurZone: 0.50 },
    { pvMaxVoie: 0.80, degatsParCentPv: 0.012, plafondMasse: 0.40 },
    { immuniteStatuts: true, immuniteEtourdi: true },
    { plafondDegatsParCoup: 0.10 },
    { parMancheSansDegats: 0.08 },
  ],

  // ---------------- ⚔️ Guerrier ----------------
  berserker: [
    { seuilProie: 0.50, partProie: 0.25 },
    { parMort: 0.10, plafondCharnier: 1.20 },
    { pvMaxVoie: 0.80, degatsParCentPv: 0.012, plafondMasse: 0.40 },
    { parCadavreDevore: 0.30, maxCadavres: 5 },
    { critTotal: true },
    { renaissance: 0.35, parMort: 0.06, plafondCharnier: 1.00 },
  ],
  moine: [
    { chargesPourCritique: 7, chargesPersistantes: true },
    { degatsParCharge: 0.03, chargesPourCritique: 5 },
    { immuniteStatuts: true, immuniteEtourdi: true },
    { actionSiPropre: true },
    { esquiveSoi: 0.50 },
    { bonusSansObjet: 1.0 },
  ],
  assassin: [
    { bonusPremierCoup: 0.25 },
    { bonusApresAbattu: 1.5, dureeApresAbattu: 2 },
    { seuilExecution: 0.15 },
    { perceArmure: 0.03 },
    { cibleDesignee: 3.0 },
    { esquiveSoi: 0.35, bonusPremierCoup: 0.5 },
  ],
  danselame: [
    { celeriteBonus: 20 },
    { riposte: 0.60 },
    { pasGratuit: true, bonusApresPas: 0.25, cumulPas: 1.5 },
    { actionSurCritique: 4 },
    { coupsSupp: 4, partCoupsSupp: 0.55 },
    { terreur: 0.40 },
  ],
  duelliste: [
    { critParManche: 0.15, critMaxDuel: 0.60 },
    { actionSurCritique: 3 },
    { bonusCibleIsolee: 1.0 },
    { executionSurCritique: 0.30 },
    { actionsParTour: 2 },
    { critParManche: 0.20, critMaxDuel: 0.80, bonusCibleIsolee: 0.5 },
  ],

  // ---------------- 🏹 Franc-tireur ----------------
  rodeur: [
    { bonusElite: 0.40 },
    { meuteDepart: 3, partMeute: 0.55 },
    { terreur: 0.30, meuteDepart: 2, partMeute: 0.5 },
    { piegesDepart: 4 },
    { marqueTerrain: true, bonusMarque: 0.80, dureeMarque: 9 },
    { esquiveSoi: 0.40, bonusLigneArriere: 0.40 },
  ],
  voleur: [
    { bonusOr: 0.40 },
    { volObjet: 0.60 },
    { statutAleatoireCoup: 0.50 },
    { statutAleatoireCoup: 0.35, volObjet: 0.40, bonusOr: 0.40 },
    { statutAleatoireCoup: 1 },
    { volObjet: 1, bonusOr: 0.80, aucunBonusRarete: true },
  ],
  traqueur: [
    { bonusMarque: 0.20, dureeMarque: 3 },
    { marquePropagation: true, bonusMarque: 0.15, dureeMarque: 3 },
    { seuilExecution: 0.20 },
    { actionSurCritique: 3, bonusMarque: 0.15, dureeMarque: 3 },
    { seuilProie: 0.90, partProie: 0.90 },
    { parMancheSansDegats: 0.20 },
  ],
  voltigeur: [
    { coupsSupp: 2, partCoupsSupp: 0.60 },
    { esquiveSoi: 0.30, actionSurCritique: 3 },
    { celeriteBonus: 50 },
    { attaqueTousLesEnnemis: true },
    { esquiveSoi: 0.50 },
    { coupsSupp: 3, partCoupsSupp: 0.70, esquiveSoi: 0.25 },
  ],

  // ---------------- 🔮 Arcaniste ----------------
  pyromancien: [
    { brulureForce: 0.50 },
    { propagationAuto: 0.35, brulureMax: 6 },
    { renaissance: 0.40 },
    { parMancheSansDegats: 0.05 },
    { poisonParCoup: 3, brulureMax: 8, brulureForce: 0.30 },
    { explosionPvMax: 0.30, brulureForce: 0.30 },
  ],
  givremage: [
    { dureeEtourdiBonus: 1 },
    { celeriteEnnemis: 20 },
    { immuniteStatuts: true },
    { dureeEtourdiBonus: 2, bonusBrisGlace: 1.0 },
    { ennemisEntravesDepart: true },
    { celeriteEnnemis: 30, dureeEtourdiBonus: 1 },
  ],
  elementaliste: [
    { bonusSynergie: 0.60 },
    { bonusSynergie: 0.60, parRune: 0.06, plafondRunes: 0.30 },
    { parRune: 0.10, plafondRunes: 0.60 },
    { bonusSynergie: 0.60, bonusZone: 0.30 },
    { perceArmure: 0.03, bonusSynergie: 0.40 },
    { parRune: 0.08, plafondRunes: 0.80, bonusSynergie: 0.30 },
  ],
  necromancien: [
    { dureeBonusStatut: 1 },
    { propagationAuto: 0.40 },
    { parStatutCible: 0.50 },
    { tousStatutsATous: true },
    { propagationAuto: 0.75, dureeBonusStatut: 2 },
    { parMort: 0.06, plafondCharnier: 1.20, dureeBonusStatut: 1 },
  ],
  invocateur: [
    { limiteInvocations: 3, multInvocation: 0.95 },
    { invocationsCopient: true, limiteInvocations: 2, multInvocation: 1.4 },
    { invocationsRessuscitent: 0.50, limiteInvocations: 3, multInvocation: 0.95 },
    { limiteInvocations: 6, multInvocation: 0.5 },
    { limiteInvocations: 4, multInvocation: 0.7, invocationsCopient: true },
    { limiteInvocations: 4, multInvocation: 0.7, invocationsRessuscitent: 0.5 },
  ],

  // ---------------- ✨ Devin ----------------
  barde: [
    { dureeBuffBonus: 4 },
    { alliesDegats: 0.15, dureeBuffBonus: 2 },
    { dureeBuffBonus: 6, alliesDegats: 0.10 },
    { invulnerabilitePeriodique: 4 },
    { alliesDegats: 0.25, soinsBonus: 0.25, dureeBuffBonus: 2 },
    { etourdiSurZone: 0.60, alliesDegats: 0.15 },
  ],
  chaman: [
    { limiteInvocations: 3, multInvocation: 0.95 },
    { dureeEsprit: 3, limiteInvocations: 2 },
    { resurrection: 0.35, dureeEsprit: 3 },
    { limiteInvocations: 4, multInvocation: 0.7, invocationsRessuscitent: 0.5 },
    { dureeEsprit: 9, resurrection: 0.30 },
    { limiteInvocations: 3, multInvocation: 0.95, dureeEsprit: 5 },
  ],
  druide: [
    { soinsBonus: 0.25, partSoinEquipe: 0.05 },
    { partSurplus: 1, plafondSurplus: 0.40, bouclierCumulatif: true },
    { resurrection: 0.50 },
    { regenEquipe: 0.20 },
    { regenEquipe: 0.12, etourdiSurPoison: 0.40, partSoinEquipe: 0.08 },
    { regenEquipe: 0.10, soinsBonus: 0.20, partSoinEquipe: 0.08 },
  ],
  oracle: [
    { soinsBonus: 0.30, partSurplus: 1, plafondSurplus: 0.25 },
    { esquiveEquipe: 0.25 },
    { resurrection: 0.40, esquiveEquipe: 0.15 },
    { esquiveEquipe: 0.20, soinMonoVersEquipe: 0.60 },
    { esquiveEquipe: 0.35 },
    { esquiveEquipe: 0.20, bonusRarete: 15 },
  ],

  // ---------------- 🌑 Runelame ----------------
  faucheur: [
    { drainSorts: 0.35 },
    { parMort: 0.05, plafondCharnier: 1.00, drainSorts: 0.25 },
    { seuilExecution: 0.20, drainSorts: 0.25 },
    { perceArmure: 0.04, drainSorts: 0.25 },
    { poisonParCoup: 5, seuilExecution: 0.25, drainSorts: 0.25 },
    { seuilExecution: 0.30, drainSorts: 0.30 },
  ],
  corrupteur: [
    { dureeBonusStatut: 1 },
    { propagationAuto: 0.40 },
    { parStatutCible: 0.50 },
    { tousStatutsATous: true },
    { propagationAuto: 0.75, dureeBonusStatut: 3 },
    { dureeBonusStatut: 2, parStatutCible: 0.30 },
  ],
  metamorphe: [
    { pvOurs: 0.40, initiativeCorbeau: 0.35 },
    { poisonParCoup: 3, pvOurs: 0.35, initiativeCorbeau: 0.30 },
    { formesCumulees: 0.50, pvOurs: 0.30, initiativeCorbeau: 0.25 },
    { formesCumulees: 1, pvOurs: 0.30, initiativeCorbeau: 0.25 },
    { parCadavreDevore: 0.20, maxCadavres: 4, formesCumulees: 0.5 },
    { meuteDepart: 3, partMeute: 0.60, formesCumulees: 0.5 },
  ],
  runemaitre: [
    { dureeBonusStatut: 1 },
    { bonusSynergie: 0.60 },
    { parRune: 0.08, plafondRunes: 0.80 },
    { parStatutCible: 0.30, dureeBonusStatut: 2 },
    { perceArmure: 0.03, parRune: 0.08, plafondRunes: 0.50 },
    { relanceGratuite: 0.35, parRune: 0.08, plafondRunes: 0.50 },
  ],
  vibrelame: [
    { chanceCoupSupp: 1 },
    { ciblesSupp: 1, partCiblesSupp: 0.50 },
    { parCoupSerie: 0.15 },
    { relanceGratuite: 0.33 },
    { etourdiSurZone: 0.75 },
    { perceArmure: 0.04, parCoupSerie: 0.20 },
  ],
};

// ---------------------------------------------------------------------
// 3. Les vingt contraintes : quatre raretés contraignantes × cinq rôles.
//
// Elles ne retirent JAMAIS de la puissance brute — elles retirent une
// option. C'est ce qui permet de tenir la fourchette de ±10 % entre un
// Éveil rare et un Éveil divin tout en rendant le Divin exigeant.
// ---------------------------------------------------------------------
const MECANIQUES_CONTRAINTE = {
  legendaire: {
    tank: { soinsAlliesInterdits: true },
    melee: { zonesInterdites: true },
    distance: { interditAvant: true },
    magie: { surcoutMana: 0.50 },
    soin: { degatsDirectsInterdits: true },
  },
  mythique: {
    tank: { saignementParTour: 0.03 },
    // « Meurt en un coup s'il est touché sans avoir esquivé » : injouable
    // tel quel. La fragilité, elle, dit la même chose sans casser la partie.
    melee: { fragilite: 1.0 },
    distance: { interditAvant: true, zonesInterdites: true },
    magie: { soinsInterdits: true },
    soin: { degatsReduits: 0.50 },
  },
  divin: {
    tank: { plafondPvMax: 0.50 },
    // « Un tour sur deux » annulait EXACTEMENT le passif du Duelliste divin
    // (2 actions × ½ manche = le rythme de tout le monde) et rendait le
    // Berserker divin net négatif. La contrainte redevient une option
    // retirée : plus aucun soin ne le touche.
    melee: { soinsInterdits: true },
    distance: { unKillParTour: true },
    magie: { communesInterdites: true },
    soin: { jamaisEnPremier: true },
  },
  cache: {
    tank: { fuiteInterdite: true },
    melee: { groupeInterdit: true },
    distance: { bonusPerdusSiLigneChangee: true },
    magie: { aucunBonusRarete: true },
    soin: { soinsAlliesInterdits: true },
  },
};

// ---------------------------------------------------------------------
// 4. On accroche tout, et on réécrit les fiches.
// ---------------------------------------------------------------------
const PASSIFS_EVEIL = {};

Object.entries(MECANIQUES_EVEIL).forEach(([idSousClasse, liste]) => {
  const role = ROLE_CONTRAINTE[SOUS_CLASSES[idSousClasse].classe];
  liste.forEach((mecaniques, index) => {
    const rarete = ORDRE_EVEIL[index];
    const eveil = Object.values(EVEILS)
      .find((e) => e.sousClasse === idSousClasse && e.rarete === rarete);
    if (!eveil) return;
    const contrainte = (MECANIQUES_CONTRAINTE[rarete] || {})[role] || null;
    // Effet et contrainte vivent dans le MÊME jeu de réglages : le moteur
    // n'a qu'un seul endroit à lire, et la contrainte ne peut pas être
    // oubliée en chemin.
    PASSIFS_EVEIL[eveil.id] = { ...mecaniques, ...(contrainte || {}) };
    eveil.mecaniques = PASSIFS_EVEIL[eveil.id];
    eveil.effet = textePassifComplet(mecaniques);
    eveil.contrainte = contrainte ? textePassifComplet(contrainte) : null;
  });
});

// ---------------------------------------------------------------------
// 5. Les fiches des COMPÉTENCES de Voie et d'Éveil suivent le même
// contrat que les passifs : produites depuis les mécaniques réelles.
// Elles recopiaient les phrases d'ORIGINE de TABLE_VOIES/TABLE_EVEILS —
// invisibilité, copie de sorts, gel permanent — que les v23/v24 ont
// précisément réécrites.
// ---------------------------------------------------------------------
Object.values(VOIES).forEach((voie) => {
  const comp = COMPETENCES[voie.competence];
  if (comp && voie.passif) comp.desc = `${voie.passif} La compétence de la ${voie.nom}.`;
});

Object.values(EVEILS).forEach((eveil) => {
  (eveil.competences || []).forEach((idComp) => {
    const comp = COMPETENCES[idComp];
    if (!comp) return;
    comp.desc = `${eveil.effet || ''}${eveil.contrainte ? ` ${eveil.contrainte}` : ''} Compétence d'Éveil de ${eveil.nom}.`.trim();
  });
});
