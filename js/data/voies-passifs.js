'use strict';

// =====================================================================
// v23 — LES QUATRE-VINGT-UN PASSIFS DE VOIE, BRANCHÉS À LEUR TOUR
//
// CE QUI N'ALLAIT PAS. La v22 avait branché les vingt-sept passifs de
// spécialité ; les quatre-vingt-une Voies, elles, restaient des phrases.
// Un Berserker de la Rage lisait « +3 % de dégâts par tour » depuis le
// niveau 50 et frappait exactement comme un Berserker sans Voie. Le
// palier le plus attendu du jeu ne changeait rien d'autre qu'un titre.
//
// LA RÈGLE, LA MÊME QUE POUR LES SPÉCIALITÉS. Une Voie ne déclare plus un
// texte : elle déclare des RÉGLAGES, et son texte est fabriqué à partir
// d'eux. Impossible d'annoncer une mécanique qui n'existe pas.
//
// LE RACCOURCI QUI REND ÇA TENABLE. Les réglages d'une Voie sont FUSIONNÉS
// avec ceux de la spécialité (voir reglagesDuCombattant, js/data/passifs.js).
// Une Voie qui reprend une clé déjà connue du moteur — le drain du
// Faucheur, la marque du Traqueur, la limite d'invocations — n'a rien à
// brancher : elle en change la valeur, et le moteur suit. Seules les
// mécaniques VRAIMENT neuves ont demandé un nouveau branchement.
//
// CE QUI A DÛ ÊTRE RÉÉCRIT. Une poignée de Voies promettaient des
// mécaniques que le jeu n'a pas et n'aura pas de sitôt : familles de
// monstres, invisibilité, copie de sorts ennemis, glyphes au sol,
// résistances élémentaires par cible. Elles gardent leur nom, leur
// compétence et leur intention — formulés avec ce qui existe vraiment.
// =====================================================================

// ---------------------------------------------------------------------
// 1. Le vocabulaire : un réglage, une phrase.
//
// C'est ce tableau qui garantit qu'une fiche de Voie ne peut pas mentir :
// le texte affiché n'est QUE la somme des phrases des réglages présents.
// ---------------------------------------------------------------------
const PHRASES_VOIE = {
  // --- Dégâts ---
  parAllieVivant: (v) => `+${pct(v)} de dégâts par allié encore debout`,
  partVitalite: (v, m) => `+${pct(v)} de dégâts par point de Vitalité au-delà de ${m.seuilVitalite}`,
  parMancheSansDegats: (v) => `+${pct(v)} de dégâts par manche traversée sans encaisser un coup, remis à zéro dès qu'il en encaisse un`,
  parMancheEnSang: (v) => `+${pct(v)} de dégâts par manche où il a encaissé au moins un coup, remis à zéro dès qu'une manche l'épargne`,
  parMort: (v, m) => `+${pct(v)} de dégâts par corps tombé sur le terrain, jusqu'à +${pct(m.plafondCharnier)}`,
  partProie: (v, m) => `+${pct(v)} de dégâts contre les cibles sous ${pct(m.seuilProie)} de leurs PV`,
  doubleSousSeuil: (v) => `dégâts DOUBLÉS contre les cibles sous ${pct(v)} de leurs PV`,
  bonusLigneArriere: (v) => `+${pct(v)} de dégâts depuis la ligne arrière`,
  interditAvant: () => 'il ne peut plus quitter la ligne arrière',
  contreEntravee: (v) => `+${pct(v)} de dégâts contre une cible entravée — empoisonnée, affaiblie, étourdie ou marquée`,
  parMilleOr: (v) => `+${pct(v)} de dégâts par millier de pièces amassé dans le combat`,
  parStatutCible: (v) => `+${pct(v)} de dégâts par état que la cible subit déjà`,
  bonusZone: (v) => `ses compétences de zone frappent +${pct(v)} — et coûtent +${pct(v)} de mana`,
  parCoupSerie: (v) => `dans une série de coups, chaque coup renforce le suivant de ${pct(v)}`,
  bonusApresAbattu: (v, m) => `après avoir abattu un ennemi, ses ${m.dureeApresAbattu} coups suivants valent +${pct(v)}`,
  bonusElite: (v) => `+${pct(v)} de dégâts contre les élites et les boss`,
  bonusSynergie: (v) => `alterner : un sort différent du précédent frappe +${pct(v)}`,
  parRune: (v, m) => `+${pct(v)} de dégâts par compétence différente déjà lancée dans le combat, jusqu'à +${pct(m.plafondRunes)}`,
  degatsParCharge: (v, m) => `${m.chargesPourCritique && m.chargesPourCritique !== 5 ? `${m.chargesPourCritique} charges au lieu de cinq, et ` : ''}+${pct(v)} de dégâts par charge accumulée`,
  degatsParCentPv: (v, m) => `+${pct(v)} de dégâts par tranche de 100 PV maximum, jusqu'à +${pct(m.plafondMasse)}`,
  rageMax: (v) => `jusqu'à +${pct(v)} de dégâts à mesure que ses PV descendent`,
  malusDegatsVoie: (v) => `ses dégâts baissent de ${pct(v)}`,

  // --- Exécution et pénétration ---
  seuilExecution: (v) => `il exécute sur place toute cible laissée sous ${pct(v)} de ses PV`,
  perceArmure: (v) => `ses coups traversent boucliers et garde — et lui coûtent ${pct(v)} de ses PV`,

  // --- Vol de vie, de mana, d'or ---
  volDeVie: (v) => `ses coups lui rendent ${pct(v)} des dégâts infligés en PV`,
  drainSorts: (v) => `TOUS ses sorts lui rendent ${pct(v)} des dégâts infligés en PV`,
  volDeMana: (v) => `et ${pct(v)} en mana`,
  malusSoinsRecus: (v) => `mais les soins qu'il reçoit des autres sont réduits de ${pct(v)}`,
  degatsEnSoinEquipe: (v) => `${pct(v)} des dégâts qu'il inflige sont rendus en PV à toute l'équipe`,
  soinParCoupEncaisse: (v) => `chaque coup qu'il encaisse soigne l'équipe de ${pct(v)} de ses PV max`,
  bonusOr: (v) => `+${pct(v)} d'or ramassé`,
  volObjet: (v) => `${pct(v)} de chances de faire les poches d'un ennemi à chaque coup`,
  volParCoup: () => 'et ses coups font les poches de l\'ennemi',
  bonusRarete: (v) => `+${v} de Chance sur les tirages de butin`,

  // --- Réserves, vitesse, tenue ---
  pvMaxVoie: (v) => `+${pct(v)} de PV maximum`,
  celeriteBonus: (v) => `+${v} de Célérité`,
  celeriteParManche: (v) => `+${v} de Célérité par manche traversée sans encaisser un coup`,
  initiativeMoitie: () => 'mais son initiative est réduite de moitié',
  immuniteEtourdi: () => 'rien ne l\'étourdit ni ne le déplace',
  regenParTour: (v) => `il récupère ${pct(v)} de ses PV et de son mana à chaque tour`,
  reductionLigneAvant: (v) => `les alliés de la ligne avant subissent ${pct(v)} de moins`,
  bouclierLigneAvantDepart: (v) => `au premier tour, il couvre la ligne avant d'un bouclier valant ${pct(v)} de ses PV max`,
  alliesDegats: (v) => `ses alliés frappent +${pct(v)}`,
  manaSurDegatsAllies: (v) => `et leurs coups lui rendent ${pct(v)} de sa réserve`,
  esquiveEquipe: (v) => `l'équipe esquive ${pct(v)} des coups reçus`,

  // --- Coups, actions, ripostes ---
  coupsSupp: (v, m) => `chaque attaque porte ${v} coup${v > 1 ? 's' : ''} de plus, à ${pct(m.partCoupsSupp)} des dégâts`,
  ciblesSupp: (v, m) => `chaque coup éclabousse ${v} cible${v > 1 ? 's' : ''} de plus, à ${pct(m.partCiblesSupp)} des dégâts`,
  chanceCoupSupp: (v) => (v >= 1
    ? 'ses attaques à coups multiples portent systématiquement un coup de plus'
    : `ses attaques à coups multiples portent un coup de plus une fois sur ${Math.round(1 / v)}`),
  relanceGratuite: (v) => `${pct(v)} de chances qu'une compétence se relance gratuitement`,
  actionSurCritique: (v) => `un critique lui rend la main, ${v} fois par combat`,
  riposte: (v) => `chaque coup encaissé déclenche une riposte à ${pct(v)} de sa frappe`,
  riposteCritique: () => 'et cette riposte est toujours critique',
  deuxActionsPremierTour: () => 'il agit deux fois au premier tour',
  cumulPas: (v, m) => `changer de ligne ne consomme pas son tour, et chaque pas ajoute ${pct(m.bonusApresPas)} au suivant, jusqu'à +${pct(v)}`,
  pasGratuit: () => 'changer de ligne ne consomme pas son tour',
  bonusApresPas: (v) => `et le coup qui suit ce pas gagne +${pct(v)}`,
  ignoreLigne: () => 'aucun malus depuis la ligne arrière',
  relanceCelerite: () => 'et sa Célérité lui offre parfois une action de plus dans la manche',

  // --- États ---
  dureeBonusStatut: (v) => `les états qu'il inflige durent ${v} tour${v > 1 ? 's' : ''} de plus`,
  propagationTotale: () => 'et se propagent à TOUS les ennemis en expirant',
  brulureMax: (v) => `ses poisons et brûlures se cumulent jusqu'à ${v} fois`,
  poisonParCoup: (v) => `chaque coup porté empoisonne la cible pour ${v} tours`,
  statutAleatoireCoup: (v) => `${pct(v)} de chances d'infliger un état au hasard à chaque coup`,
  statutAleatoireRiposte: (v) => `${pct(v)} de chances qu'un ennemi qui le frappe reparte avec un état au hasard`,
  bonusMarque: (v, m) => `ce qu'il frappe porte sa marque ${m.dureeMarque} tours : la cible marquée subit +${pct(v)} de la part de TOUTE l'équipe`,
  marquePropagation: () => 'et la marque saute sur un autre ennemi à la mort de la cible',
  dureeEtourdiBonus: (v) => `ses étourdissements durent ${v} tour${v > 1 ? 's' : ''} de plus`,
  etourdiSurPoison: (v) => `${pct(v)} de chances qu'un poison qu'il pose cloue aussi la cible sur place`,
  etourdiSurZone: (v) => `ses compétences de zone étourdissent ${pct(v)} de ce qu'elles touchent`,
  bonusBrisGlace: (v) => `ses coups sur une cible étourdie valent +${pct(v)} et consument le gel`,
  brisureEclabousse: (v) => `et la brisure éclabousse les autres ennemis à ${pct(v)}`,
  terreur: (v) => `${pct(v)} de chances qu'un ennemi entravé — rongé par au moins un état — perde la tête et frappe l'un des siens`,
  partExplosion: (v) => `une cible qui meurt en brûlant explose sur tout ce qui l'entoure`,
  explosionPvMax: (v) => `un ennemi qu'il abat explose pour ${pct(v)} de ses PV maximum`,
  reductionBerce: (v, m) => `ce qu'il touche inflige ${pct(v)} de moins pendant ${m.dureeBerce} tours`,
  ignoreMeteoSubis: () => 'et le ciel ne lui prend rien : la nuit et les intempéries ne majorent plus les dégâts qu'.concat('il subit'),

  // --- Soins, boucliers, retours ---
  partSurplus: (v, m) => `l'intégralité du surplus de soin se fige en bouclier, jusqu'à ${pct(m.plafondSurplus)} des PV max de la cible`,
  bouclierCumulatif: () => 'et ses boucliers se cumulent au lieu de se remplacer',
  bouclierDureeBonus: (v) => `ses boucliers durent ${v} tours de plus`,
  soinMonoVersEquipe: (v) => `ses soins sur une seule cible éclaboussent toute l'équipe à ${pct(v)}`,
  partSoinEquipe: (v) => `chaque régénération qu'il pose soigne aussi ${pct(v)} des PV max de TOUTE l'équipe`,
  resurrection: (v) => `le premier allié tombé de chaque combat se relève au tour suivant à ${pct(v)} de ses PV`,
  dureeBuffBonus: (v) => `ses bienfaits durent ${v} tours de plus`,
  seuilSecours: (v, m) => `le premier allié à tomber sous ${pct(v)} de ses PV reçoit un bouclier gratuit de ${pct(m.partBouclierSecours)} de ses PV max`,

  // --- Compagnons ---
  limiteInvocations: (v, m) => `${v} invocations à la fois${m.multInvocation ? `, à ${pct(m.multInvocation)} de leurs statistiques normales` : ''}`,
  invocationsCopient: () => 'et ses créatures se battent avec SES compétences',
  invocationsRessuscitent: (v) => `une créature tombée revient au tour suivant à ${pct(v)} de ses PV, une fois chacune`,
  meuteDepart: (v, m) => `${v} compagnons entrent avec lui dans chaque combat, à ${pct(m.partMeute)} de ses statistiques`,
  dureeEsprit: (v) => `quand un allié tombe, son esprit combat ${v} tours à sa place`,
  piegesDepart: (v) => `${v} pièges tendus au premier tour de chaque combat`,
  piegeParDex: () => 'un piège tendu au premier tour de chaque combat',
  soinParMise: (v) => `chaque ennemi abattu lui rend ${pct(v)} de ses PV max`,
  chargesPourCritique: (v) => `à ${v} charges accumulées, le coup suivant est critique garanti`,
  chargesPersistantes: () => 'et ses charges ne se perdent jamais — elles traversent même les combats',
  pvOurs: (v) => `l'ours lui donne +${pct(v)} de PV max`,
  initiativeCorbeau: (v) => `le corbeau +${pct(v)} d'initiative`,
  critParManche: (v, m) => `+${pct(v)} de critique par manche passée sur la MÊME cible, jusqu'à +${pct(m.critMaxDuel)}`,
  sangParMana: (v) => `quand le mana manque, il paie ses sorts ${v} PV par point`,
};

// L'ordre dans lequel les phrases se lisent : on ne veut pas d'un texte
// qui commence par « et il ne quitte plus jamais cette ligne ».
const ORDRE_PHRASES = Object.keys(PHRASES_VOIE);

// Les clés qui ne portent PAS de phrase à elles seules : elles complètent
// celle d'un autre réglage (un plafond, une part, un seuil).
const CLES_MUETTES = new Set([
  'seuilVitalite', 'seuilProie', 'plafondCharnier', 'plafondMasse', 'plafondRunes',
  'dureeApresAbattu', 'partCoupsSupp', 'partCiblesSupp', 'dureeMarque', 'dureeBerce',
  'plafondSurplus', 'partBouclierSecours', 'multInvocation', 'partMeute', 'critMaxDuel',
  'coutPercee', 'poisonDureeCoup', 'propagationExpiration',
]);

function texteMecaniquesVoie(mecaniques) {
  const morceaux = ORDRE_PHRASES
    .filter((cle) => mecaniques[cle] !== undefined && !CLES_MUETTES.has(cle))
    // cumulPas raconte déjà le pas gratuit et son bonus : répéter les deux
    // phrases sœurs ferait dire deux fois la même chose à la fiche.
    .filter((cle) => !(mecaniques.cumulPas !== undefined && (cle === 'pasGratuit' || cle === 'bonusApresPas')))
    .map((cle) => PHRASES_VOIE[cle](mecaniques[cle], mecaniques));
  if (!morceaux.length) return '';
  const phrase = morceaux.join(' ; ').replace(/ ; et /g, ', et ').replace(/ ; mais /g, ', mais ');
  return `${phrase.charAt(0).toUpperCase()}${phrase.slice(1)}.`;
}

// ---------------------------------------------------------------------
// 2. Les quatre-vingt-une Voies, dans l'ordre exact de TABLE_VOIES.
//
// Trois entrées par spécialité, indexées comme là-bas : c'est l'index qui
// fait le lien, pas un identifiant recopié à la main.
// ---------------------------------------------------------------------
const MECANIQUES_VOIE = {
  // ---------------- 🛡️ Gardien ----------------
  templier: [
    // Bastion — il se met devant, littéralement.
    { bouclierLigneAvantDepart: 0.35, soinParCoupEncaisse: 0.03, reductionLigneAvant: 0.20 },
    // Serment — il rend les autres meilleurs.
    { alliesDegats: 0.15, manaSurDegatsAllies: 0.05, reductionLigneAvant: 0.15 },
    // Zèle — tanker devient offensif.
    { parAllieVivant: 0.15, seuilVitalite: 40, partVitalite: 0.01 },
  ],
  paladin: [
    // Gardien — le filet de sécurité de l'équipe.
    { seuilSecours: 0.20, partBouclierSecours: 0.60 },
    { seuilVitalite: 40, partVitalite: 0.02, seuilSecours: 0.30, partBouclierSecours: 0.25 },
    { degatsEnSoinEquipe: 0.30, seuilSecours: 0.30, partBouclierSecours: 0.25 },
  ],
  'chevalier-noir': [
    { volDeVie: 0.25, malusSoinsRecus: 0.50, sangParMana: 2 },
    { statutAleatoireRiposte: 0.50, volDeVie: 0.12, sangParMana: 2 },
    { perceArmure: 0.05, volDeVie: 0.12, sangParMana: 2 },
  ],
  colosse: [
    { pvMaxVoie: 0.60, degatsParCentPv: 0.01, plafondMasse: 0.30 },
    { immuniteEtourdi: true, initiativeMoitie: true, degatsParCentPv: 0.015, plafondMasse: 0.40 },
    { bonusZone: 0.25, degatsParCentPv: 0.01, plafondMasse: 0.30 },
  ],

  // ---------------- ⚔️ Guerrier ----------------
  berserker: [
    { parMancheEnSang: 0.03, rageMax: 0.40, soinParMise: 0.08 },
    { volDeVie: 0.20, malusSoinsRecus: 0.50, rageMax: 0.40 },
    { parMort: 0.10, plafondCharnier: 1.20, rageMax: 0.40, soinParMise: 0.08 },
  ],
  moine: [
    { chargesPourCritique: 8, degatsParCharge: 0.03 },
    { celeriteParManche: 3, chargesPourCritique: 5 },
    { regenParTour: 0.10, malusDegatsVoie: 0.20, chargesPourCritique: 5 },
  ],
  assassin: [
    // Ombre — l'invisibilité n'existe pas ; la fenêtre après un kill, oui.
    { bonusApresAbattu: 2.0, dureeApresAbattu: 2 },
    { brulureMax: 5, poisonParCoup: 3, seuilProie: 0.50, partProie: 0.50 },
    { doubleSousSeuil: 0.25, seuilExecution: 0.10 },
  ],
  danselame: [
    { pasGratuit: true, bonusApresPas: 0.20, cumulPas: 1.0 },
    // Miroir — copier les sorts ennemis n'existe pas ; leur renvoyer, si.
    { riposte: 0.60, pasGratuit: true, bonusApresPas: 0.20 },
    { ciblesSupp: 1, partCiblesSupp: 0.45, pasGratuit: true, bonusApresPas: 0.20 },
  ],
  duelliste: [
    { celeriteBonus: 25, actionSurCritique: 2, critParManche: 0.08, critMaxDuel: 0.40 },
    { riposte: 0.50, riposteCritique: true, critParManche: 0.08, critMaxDuel: 0.40 },
    { bonusMarque: 0.40, dureeMarque: 3, critParManche: 0.08, critMaxDuel: 0.40 },
  ],

  // ---------------- 🏹 Franc-tireur ----------------
  rodeur: [
    { piegesDepart: 3, bonusElite: 0.30, ignoreLigne: true },
    { meuteDepart: 3, partMeute: 0.50, bonusElite: 0.30, ignoreLigne: true },
    { poisonParCoup: 3, brulureMax: 5, bonusElite: 0.30, ignoreLigne: true },
  ],
  voleur: [
    { volObjet: 0.35, bonusOr: 0.25, bonusRarete: 10, ignoreLigne: true },
    { bonusOr: 0.80, parMilleOr: 0.02, bonusRarete: 10, ignoreLigne: true },
    { statutAleatoireCoup: 0.35, bonusOr: 0.25, bonusRarete: 10, ignoreLigne: true },
  ],
  traqueur: [
    { bonusMarque: 0.25, dureeMarque: 3, marquePropagation: true, ignoreLigne: true },
    { seuilProie: 0.40, partProie: 0.50, seuilExecution: 0.12, bonusMarque: 0.12, dureeMarque: 3, ignoreLigne: true },
    // Piste — le bestiaire n'a pas de familles ; ce qui se traque, c'est
    // une bête déjà entamée.
    { contreEntravee: 0.30, bonusMarque: 0.12, dureeMarque: 3, ignoreLigne: true },
  ],
  voltigeur: [
    { coupsSupp: 2, partCoupsSupp: 0.60, ignoreLigne: true, relanceCelerite: true },
    { celeriteBonus: 25, actionSurCritique: 2, ignoreLigne: true, relanceCelerite: true },
    { bonusLigneArriere: 0.50, interditAvant: true, ignoreLigne: true, relanceCelerite: true },
  ],

  // ---------------- 🔮 Arcaniste ----------------
  pyromancien: [
    { brulureMax: 8, dureeBonusStatut: 2, partExplosion: 2 },
    { explosionPvMax: 0.25, brulureMax: 5, partExplosion: 2 },
    { ignoreMeteoSubis: true, bonusZone: 0.30, brulureMax: 5, partExplosion: 2 },
  ],
  givremage: [
    { dureeEtourdiBonus: 1, bonusBrisGlace: 0.75 },
    { bonusBrisGlace: 0.75, brisureEclabousse: 0.60, actionSurCritique: 2 },
    { contreEntravee: 0.25, dureeBonusStatut: 1, bonusBrisGlace: 0.75 },
  ],
  elementaliste: [
    { bonusSynergie: 0.85 },
    { bonusZone: 0.25, bonusSynergie: 0.25 },
    { parRune: 0.08, plafondRunes: 0.50, bonusSynergie: 0.25 },
  ],
  necromancien: [
    { dureeBonusStatut: 2, propagationTotale: true, propagationExpiration: true, parMort: 0.03, plafondCharnier: 0.45 },
    { parMort: 0.05, plafondCharnier: 1.00 },
    { terreur: 0.35, parMort: 0.03, plafondCharnier: 0.45 },
  ],
  invocateur: [
    { invocationsCopient: true, limiteInvocations: 2, multInvocation: 1.4 },
    { invocationsRessuscitent: 0.50, limiteInvocations: 2, multInvocation: 1.4 },
    { limiteInvocations: 4, multInvocation: 0.7 },
  ],

  // ---------------- ✨ Devin ----------------
  barde: [
    { dureeBuffBonus: 4, alliesDegats: 0.10, reductionBerce: 0.15, dureeBerce: 3 },
    { dureeEtourdiBonus: 1, contreEntravee: 0.25, reductionBerce: 0.15, dureeBerce: 3 },
    { relanceGratuite: 0.30, dureeBuffBonus: 2, reductionBerce: 0.15, dureeBerce: 3 },
  ],
  chaman: [
    { limiteInvocations: 3, multInvocation: 0.95, dureeEsprit: 3 },
    { resurrection: 0.30, dureeEsprit: 3, limiteInvocations: 2 },
    { ciblesSupp: 1, partCiblesSupp: 0.50, dureeEsprit: 3, limiteInvocations: 2 },
  ],
  druide: [
    { partSurplus: 1, plafondSurplus: 0.35, bouclierCumulatif: true, partSoinEquipe: 0.05 },
    { dureeBonusStatut: 2, etourdiSurPoison: 0.30, partSoinEquipe: 0.05 },
    { resurrection: 0.50, partSoinEquipe: 0.05 },
  ],
  oracle: [
    { bouclierCumulatif: true, bouclierDureeBonus: 3, partSurplus: 1, plafondSurplus: 0.20 },
    { esquiveEquipe: 0.20, partSurplus: 1, plafondSurplus: 0.20 },
    { soinMonoVersEquipe: 0.60, partSurplus: 1, plafondSurplus: 0.20 },
  ],

  // ---------------- 🌑 Runelame ----------------
  faucheur: [
    { drainSorts: 0.40, volDeMana: 0.40, seuilExecution: 0.15 },
    { parMort: 0.05, plafondCharnier: 1.00, drainSorts: 0.25, seuilExecution: 0.15 },
    { perceArmure: 0.05, drainSorts: 0.25, seuilExecution: 0.15 },
  ],
  corrupteur: [
    { dureeBonusStatut: 2, propagationTotale: true, propagationExpiration: true },
    { parStatutCible: 0.25, dureeBonusStatut: 1 },
    { terreur: 0.35, dureeBonusStatut: 1 },
  ],
  metamorphe: [
    { pvMaxVoie: 0.40, poisonParCoup: 3, pvOurs: 0.30, initiativeCorbeau: 0.25 },
    { celeriteBonus: 40, deuxActionsPremierTour: true, pvOurs: 0.30, initiativeCorbeau: 0.25 },
    { poisonParCoup: 3, brulureMax: 5, pvOurs: 0.30, initiativeCorbeau: 0.25 },
  ],
  runemaitre: [
    { bonusSynergie: 0.60, parRune: 0.08, plafondRunes: 0.40 },
    // Sceau — il n'y a pas de sol dans ce combat ; ce qui persiste, ce
    // sont les états gravés sur la cible.
    { dureeBonusStatut: 2, parStatutCible: 0.15, parRune: 0.08, plafondRunes: 0.40 },
    { parRune: 0.08, plafondRunes: 0.80 },
  ],
  vibrelame: [
    { parCoupSerie: 0.15, chanceCoupSupp: 0.5 },
    { etourdiSurZone: 0.35, chanceCoupSupp: 0.5 },
    { relanceGratuite: 0.30, chanceCoupSupp: 0.5 },
  ],
};

// ---------------------------------------------------------------------
// 3. On accroche les réglages aux Voies, et on réécrit leur fiche.
//
// L'index fait le lien avec TABLE_VOIES : aucune chaîne recopiée, donc
// aucune occasion de se tromper de Voie.
// ---------------------------------------------------------------------
const PASSIFS_VOIE = {};

Object.entries(MECANIQUES_VOIE).forEach(([idSousClasse, liste]) => {
  const voies = Object.values(VOIES)
    .filter((v) => v.sousClasse === idSousClasse)
    .sort((a, b) => a.rang - b.rang);
  liste.forEach((mecaniques, index) => {
    const voie = voies[index];
    if (!voie) return;
    PASSIFS_VOIE[voie.id] = mecaniques;
    voie.mecaniques = mecaniques;
    voie.passif = texteMecaniquesVoie(mecaniques);
  });
});
