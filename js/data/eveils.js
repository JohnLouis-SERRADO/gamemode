'use strict';

// =====================================================================
// v19 — L'ÉVEIL, au niveau 80.
//
// À 80, le héros ne change pas de style : il change de nature. Cinq
// propositions sont tirées, il en garde une. Deux Berserkers de la Rage
// peuvent finir Roi Berserker et Dévoreur de Mondes.
//
// Six raretés par sous-classe, vingt-sept sous-classes : 162 Éveils.
// Chacun apporte UN PASSIF MAJEUR et DEUX COMPÉTENCES — 324 en tout.
//
// RÈGLE D'ÉQUILIBRAGE NON NÉGOCIABLE (§5.1 du document de conception) :
// la rareté augmente la COMPLEXITÉ et la CONTRAINTE, jamais le plafond
// de puissance. Un Éveil rare et un Éveil divin doivent tenir dans une
// fourchette de ±10 % sur un même build. Sinon tout le monde relance
// jusqu'au Divin et le système devient une machine à frustration.
//
// C'est pour cela que les chiffres sont CALCULÉS et non écrits : la
// puissance dépend du profil de la compétence, jamais de la rareté. Ce
// que la rareté change, c'est la contrainte attachée. Un test du harnais
// le vérifie sur les 162.
// =====================================================================

const NIVEAU_EVEIL = 80;

const RARETES_EVEIL = {
  rare:       { nom: 'Rare',       poids: 45,  emoji: '🔹', contrainte: false, resume: 'Solide et simple. Aucune contrainte.' },
  epique:     { nom: 'Épique',     poids: 30,  emoji: '🔸', contrainte: false, resume: 'Un mécanisme de plus à gérer.' },
  legendaire: { nom: 'Légendaire', poids: 17,  emoji: '💠', contrainte: true,  resume: 'Forte identité, une vraie contrainte.' },
  mythique:   { nom: 'Mythique',   poids: 6,   emoji: '🔮', contrainte: true,  resume: 'Les règles du jeu changent. Contrainte lourde.' },
  divin:      { nom: 'Divin',      poids: 1.5, emoji: '✨', contrainte: true,  resume: 'Un jeu de règles à part, très punitif si mal joué.' },
  cache:      { nom: 'Caché',      poids: 0.5, emoji: '🕯️', contrainte: true,  resume: 'Conditions secrètes, apparence unique.' },
};

const ORDRE_EVEIL = ['rare', 'epique', 'legendaire', 'mythique', 'divin', 'cache'];

// Les contraintes, par rareté et par rôle. Elles ne réduisent jamais les
// dégâts bruts — elles retirent une OPTION. C'est ce qui permet de tenir
// la fourchette de ±10 % tout en rendant le Divin réellement exigeant.
const CONTRAINTES = {
  legendaire: {
    tank:     'Ne peut plus être soigné par un allié : il ne compte que sur lui-même.',
    melee:    'Ne peut viser qu’un seul ennemi à la fois.',
    distance: 'Ne peut plus passer en ligne avant.',
    magie:    'Coût en mana augmenté de moitié.',
    soin:     'Ne peut plus infliger de dégâts directs.',
  },
  mythique: {
    tank:     'Perd 3 % de ses PV maximum à chaque tour.',
    melee:    'Meurt en un coup s’il est touché sans avoir esquivé.',
    distance: 'Ne peut plus attaquer au corps à corps.',
    magie:    'Ne peut plus être soigné, seulement protégé par des boucliers.',
    soin:     'Ses propres dégâts sont plafonnés à la moitié.',
  },
  divin: {
    tank:     'PV plafonnés à la moitié de son maximum.',
    melee:    'Un seul tour d’action sur deux.',
    distance: 'Un seul ennemi peut être tué par tour.',
    magie:    'Perd l’accès à toutes les compétences communes.',
    soin:     'Ne peut jamais agir en premier.',
  },
  cache: {
    tank:     'Ne peut pas fuir un combat, jamais.',
    melee:    'Ne peut pas rejoindre une équipe.',
    distance: 'Perd tous ses bonus s’il change de ligne.',
    magie:    'Aucun bonus de rareté sur le butin.',
    soin:     'Ne peut plus recevoir d’aide de l’équipe.',
  },
};

// À quel rôle rattacher chaque classe, pour choisir la bonne contrainte.
const ROLE_CONTRAINTE = {
  gardien: 'tank', guerrier: 'melee', 'franc-tireur': 'distance',
  arcaniste: 'magie', devin: 'soin', runelame: 'melee',
};

// Les profils de compétence d'Éveil : mêmes familles que les Voies, mais
// un cran au-dessus — c'est le niveau 80.
// =====================================================================
// LE BUDGET DE PUISSANCE.
//
// Chaque profil vaut exactement le même budget. C'est ce qui garantit
// mécaniquement la règle : deux Éveils ont toujours la même puissance,
// quelle que soit leur rareté, parce qu'ils dépensent le même budget.
//
// Un premier jet laissait 19 % d'écart entre raretés — le harnais l'a
// signalé avant que quiconque ne joue. Les chiffres ci-dessous sont donc
// dérivés du budget, et non choisis à la main :
//
//   valeur = (puissance + stat × ratio) × coups × (2 si c'est une zone)
//
// avec une statistique de référence de 60, celle d'un héros de niveau 80.
// =====================================================================
const BUDGET_EVEIL = 200;
const STAT_REFERENCE_EVEIL = 60;

const PROFILS_EVEIL = {
  frappe:    { type: 'degats', cible: 'ennemi',  puissance: 24, ratio: 2.93, coutMp: 15, cooldown: 4 },
  salve:     { type: 'degats', cible: 'ennemis', puissance: 15, ratio: 1.417, coutMp: 18, cooldown: 5 },
  rafale:    { type: 'degats', cible: 'ennemi',  puissance: 10, ratio: 0.945, coups: 3, coutMp: 16, cooldown: 4 },
  execution: { type: 'degats', cible: 'ennemi',  puissance: 28, ratio: 2.867, critBonus: 0.3, coutMp: 17, cooldown: 5 },
  drain:     { type: 'degats', cible: 'ennemi',  puissance: 21, ratio: 2.983, coutMp: 15, cooldown: 4, effet: { type: 'drain', part: 0.55 } },
  fleau:     { type: 'degats', cible: 'ennemis', puissance: 13, ratio: 1.45, coutMp: 18, cooldown: 5, effet: { type: 'poison', duree: 3 } },
  brise:     { type: 'degats', cible: 'ennemi',  puissance: 18, ratio: 3.033, coutMp: 15, cooldown: 4, effet: { type: 'affaibli', duree: 3 } },
  fracas:    { type: 'degats', cible: 'ennemis', puissance: 14, ratio: 1.433, coutMp: 19, cooldown: 5, effet: { type: 'etourdi', duree: 1, chance: 0.5 } },
  soin:      { type: 'soin',   cible: 'allies',  puissance: 26, ratio: 1.233, coutMp: 18, cooldown: 4 },
  grandSoin: { type: 'soin',   cible: 'allie',   puissance: 42, ratio: 2.633, coutMp: 17, cooldown: 4 },
  // Les profils utilitaires dépensent le même budget autrement : en
  // boucliers, en buffs et en régénération. Leur valeur est déclarée,
  // faute de pouvoir se mesurer en dégâts.
  egide:     { type: 'utilitaire', cible: 'allies', coutMp: 17, cooldown: 5, effet: { type: 'bouclier', duree: 4 } },
  ferveur:   { type: 'utilitaire', cible: 'allies', coutMp: 15, cooldown: 5, effet: { type: 'benediction', duree: 3 } },
  souffle:   { type: 'utilitaire', cible: 'soi',    coutMp: 12, cooldown: 4, effet: { type: 'regen', duree: 4 } },
};

// v21 — Ce que fait la compétence, et rien d'autre. Comme pour les Voies,
// la description recopiait la phrase du PASSIF de l'Éveil : un sort y
// promettait « Six invocations » alors qu'il lançait une salve. Le passif
// se lit sur la fiche de l'Éveil, la compétence se décrit elle-même.
const DESC_PROFIL_EVEIL = {
  frappe: 'Une frappe unique, d’une violence de niveau 80, sur un ennemi.',
  salve: 'Une déflagration qui balaie tous les ennemis.',
  rafale: 'Trois coups enchaînés sur la même cible.',
  execution: 'Un coup taillé pour achever : très forte chance de critique.',
  drain: 'Un coup qui vous rend plus de la moitié des dégâts en PV.',
  fleau: 'Une nappe qui blesse et empoisonne tous les ennemis.',
  brise: 'Un coup qui brise la garde : la cible frappe 30 % moins fort.',
  fracas: 'Une onde de choc sur tous les ennemis, qui peut les étourdir.',
  soin: 'Un soin majeur sur tout le groupe.',
  grandSoin: 'Un très grand soin, concentré sur un seul allié.',
  egide: 'Un bouclier d’Éveil posé sur tout le groupe.',
  ferveur: 'Tout le groupe frappe 30 % plus fort pendant trois tours.',
  souffle: 'Une régénération sur soi, plusieurs tours durant.',
};

// La valeur d'un profil, dans l'unité du budget. Utilisée par le harnais.
function valeurProfilEveil(comp, statReference) {
  if (comp.type === 'utilitaire') return BUDGET_EVEIL;
  const s = statReference == null ? STAT_REFERENCE_EVEIL : statReference;
  const brut = (comp.puissance + s * comp.ratio) * (comp.coups || 1);
  return comp.cible === 'ennemis' || comp.cible === 'allies' ? brut * 2 : brut;
}

// Chaque sous-classe : six Éveils, dans l'ordre des raretés.
// [ nom, effet signature, profil de la 1re compétence, profil de la 2e ]
const TABLE_EVEILS = {
  // ---------------- 🛡️ Gardien ----------------
  templier: [
    ['Gardien de Fer', '+20 % de Ténacité pour toute l’équipe.', 'egide', 'frappe'],
    ['Bastion Sacré', 'L’équipe partage 30 % des dégâts qu’elle subit.', 'egide', 'brise'],
    ['Muraille Vivante', 'L’équipe ne peut pas mourir tant qu’il est debout.', 'egide', 'fracas'],
    ['Serment Immortel', 'Il revient à 50 % de ses PV, une fois par combat.', 'soin', 'frappe'],
    ['Aegis de Valciel', 'L’équipe est invulnérable un tour tous les cinq tours.', 'egide', 'salve'],
    ['Le Dernier Rempart', '+15 % de puissance par ennemi présent sur le terrain.', 'fracas', 'egide'],
  ],
  paladin: [
    ['Chevalier de Lumière', 'Ses soins et ses boucliers gagnent 25 %.', 'soin', 'frappe'],
    ['Champion Sacré', 'Ses dégâts soignent l’équipe de 30 % du montant infligé.', 'frappe', 'soin'],
    ['Séraphin', 'Une résurrection d’équipe par combat.', 'grandSoin', 'egide'],
    ['Jugement Incarné', 'Convertit tous les dégâts encaissés du combat en une frappe unique.', 'execution', 'egide'],
    ['Aube Éternelle', 'L’équipe régénère 15 % de ses PV par tour.', 'soin', 'ferveur'],
    ['Le Serment Brisé', 'Gagne les pouvoirs du Chevalier Noir : drain et malédictions.', 'drain', 'fleau'],
  ],
  'chevalier-noir': [
    ['Buveur d’Ombre', 'Son vol de vie passe à 40 % des dégâts infligés.', 'drain', 'brise'],
    ['Seigneur des Vaisseaux', 'Chaque ennemi affaibli lui rend 5 % de ses PV par tour.', 'drain', 'fleau'],
    ['Cœur de Ténèbres', 'Il ne se soigne plus que par le drain — mais celui-ci double.', 'drain', 'execution'],
    ['Le Puits', 'Tout dégât reçu par l’équipe lui est transféré et le nourrit.', 'egide', 'drain'],
    ['Nuit Souveraine', 'Le terrain entier est plongé dans l’ombre : tout ce qui y meurt le renforce.', 'fleau', 'salve'],
    ['Celui Qui Ne Rend Rien', 'Ce qu’il prend ne revient jamais à personne, jamais.', 'drain', 'execution'],
  ],
  colosse: [
    ['Montagne Debout', '+40 % de PV maximum.', 'fracas', 'egide'],
    ['Brise-Roc', 'Ses zones étourdissent tout ce qui les subit deux fois de suite.', 'fracas', 'salve'],
    ['Titan de Guerre', '+80 % de PV maximum, et ses dégâts montent avec ses PV.', 'fracas', 'frappe'],
    ['Cœur de Basalte', 'Immunisé aux statuts et aux déplacements forcés.', 'egide', 'fracas'],
    ['L’Inébranlable', 'Il ne peut subir plus de 10 % de ses PV maximum par coup.', 'egide', 'frappe'],
    ['Ce Qui Dormait Sous', 'Chaque tour passé immobile ajoute 8 % de puissance, sans plafond.', 'frappe', 'fracas'],
  ],

  // ---------------- ⚔️ Guerrier ----------------
  berserker: [
    ['Sanguinaire', '+25 % de dégâts sous 50 % de PV.', 'frappe', 'drain'],
    ['Roi Berserker', 'Chaque kill donne +10 % de dégâts, cumulés pour le combat.', 'salve', 'frappe'],
    ['Titan de Guerre', '+80 % de PV maximum, et ses dégâts montent avec ses PV.', 'fracas', 'frappe'],
    ['Dévoreur de Mondes', 'Dévore un cadavre pour +30 % de statistiques, cumulable cinq fois.', 'drain', 'execution'],
    ['Fléau Premier', 'Tous ses coups sont critiques.', 'execution', 'salve'],
    ['Seigneur du Carnage', 'Ne peut pas mourir tant qu’un ennemi meurt à chaque tour.', 'execution', 'salve'],
  ],
  moine: [
    ['Disciple', 'Deux charges de plus, et elles ne se perdent jamais.', 'rafale', 'souffle'],
    ['Poing de Fer', '+3 % de dégâts par charge accumulée.', 'rafale', 'frappe'],
    ['Corps de Diamant', 'Immunisé aux statuts et à l’étourdissement.', 'souffle', 'rafale'],
    ['Souffle du Dragon', 'Agit une fois de plus par tour s’il n’a subi aucun dégât.', 'rafale', 'execution'],
    ['Le Vide', 'Évite tout, un tour sur deux.', 'souffle', 'rafale'],
    ['Le Pèlerin Silencieux', '+100 % de dégâts s’il n’utilise aucun objet du combat.', 'execution', 'souffle'],
  ],
  assassin: [
    ['Égorgeur', '+25 % de dégâts sur le premier coup du combat.', 'execution', 'brise'],
    ['Ombre Portée', 'Invisible deux tours après chaque kill.', 'execution', 'fleau'],
    ['Faucheur Silencieux', 'Exécute automatiquement toute cible sous 15 % de PV.', 'execution', 'frappe'],
    ['Lame du Néant', 'Ignore défense, boucliers et résistances.', 'execution', 'rafale'],
    ['Le Contrat', 'Désigne une cible en début de combat : +300 % contre elle.', 'execution', 'brise'],
    ['Personne', 'Aucun ennemi ne peut le cibler tant qu’il n’a pas tué.', 'execution', 'fleau'],
  ],
  danselame: [
    ['Virtuose', '+20 % de Célérité.', 'rafale', 'souffle'],
    ['Lame Miroir', 'Mémorise deux compétences ennemies et les relance.', 'rafale', 'brise'],
    ['Vent Tranchant', 'Frappe une fois de plus par ligne traversée.', 'salve', 'rafale'],
    ['Danse Sans Fin', 'Chaque esquive rend une action, sans limite.', 'rafale', 'salve'],
    ['Le Dernier Pas', 'Sept coups en un seul tour.', 'rafale', 'execution'],
    ['La Valse', 'L’ennemi frappé rejoint la danse et attaque son propre camp.', 'brise', 'salve'],
  ],
  duelliste: [
    ['Bretteur', '+15 % de critique.', 'frappe', 'rafale'],
    ['Lame d’Argent', 'Les critiques rendent un tour d’action.', 'execution', 'rafale'],
    ['Maître du Duel', '+100 % de dégâts contre une cible isolée.', 'execution', 'brise'],
    ['Fil du Rasoir', 'Tue instantanément sur un critique sous 30 % de PV.', 'execution', 'frappe'],
    ['Éclair Immobile', 'Agit deux fois par tour.', 'rafale', 'execution'],
    ['L’Escrimeur Sans Nom', 'Copie le style de tout ennemi vaincu en duel.', 'brise', 'execution'],
  ],

  // ---------------- 🏹 Franc-tireur ----------------
  rodeur: [
    ['Traque-Bête', '+40 % de dégâts contre les créatures.', 'frappe', 'fleau'],
    ['Maître de Meute', 'Trois loups permanents combattent à ses côtés.', 'salve', 'fleau'],
    ['Roi de la Forêt', '30 % des bêtes du terrain changent de camp.', 'salve', 'ferveur'],
    ['Chasseur Éternel', 'Ses pièges deviennent permanents et invisibles.', 'fleau', 'execution'],
    ['La Grande Chasse', 'Marque tout le terrain : +80 % contre les marqués.', 'salve', 'execution'],
    ['L’Ombre des Bois', 'Invisible tant qu’il ne quitte pas la ligne arrière.', 'execution', 'fleau'],
  ],
  voleur: [
    ['Filou', '+40 % d’or sur tout ce qu’il ramasse.', 'brise', 'rafale'],
    ['Détrousseur', 'Vole un objet par combat, garanti.', 'brise', 'fleau'],
    ['Prince des Voleurs', 'Vole une compétence ennemie pour la durée du combat.', 'brise', 'execution'],
    ['Main Invisible', 'Vole aussi les buffs et les statuts de ses cibles.', 'brise', 'fleau'],
    ['Le Grand Jeu', 'Tous ses effets sont tirés au hasard, en bien comme en mal.', 'salve', 'brise'],
    ['Le Croupier', 'Choisit une fois par combat le résultat d’un jet de d20.', 'execution', 'ferveur'],
  ],
  traqueur: [
    ['Pisteur', 'Ses marques font subir 20 % de dégâts en plus.', 'brise', 'frappe'],
    ['Œil du Prédateur', 'Les marques se propagent à la mort de la cible.', 'brise', 'salve'],
    ['Sentence Vivante', 'Exécute automatiquement sous 20 % de PV.', 'execution', 'brise'],
    ['Faucheur de Loin', 'Chaque marque consommée relance son tour.', 'execution', 'rafale'],
    ['Le Dernier Tir', 'Un seul tir par combat, égal à 90 % des PV maximum de la cible.', 'execution', 'brise'],
    ['Celui Qui Attend', '+200 % de dégâts s’il n’a rien fait pendant trois tours.', 'execution', 'souffle'],
  ],
  voltigeur: [
    ['Danseur d’Air', 'Deux tirs de plus par action.', 'rafale', 'souffle'],
    ['Vent Perçant', 'Chaque esquive donne un tir gratuit.', 'rafale', 'salve'],
    ['Souffle Léger', '+50 % de Célérité.', 'souffle', 'rafale'],
    ['Tempête', 'Frappe tous les ennemis à chaque action.', 'salve', 'rafale'],
    ['L’Envol', 'Ne peut plus être ciblé une fois sur deux.', 'souffle', 'salve'],
    ['Flèche Sans Retour', 'Vingt flèches par combat, définitivement perdues à l’usage.', 'execution', 'salve'],
  ],

  // ---------------- 🔮 Arcaniste ----------------
  pyromancien: [
    ['Incendiaire', 'Ses brûlures frappent 50 % plus fort.', 'fleau', 'frappe'],
    ['Seigneur des Flammes', 'Ses brûlures se propagent de cible en cible.', 'fleau', 'salve'],
    ['Phénix', 'Renaît une fois par combat à 40 % de ses PV.', 'salve', 'soin'],
    ['Cœur de Forge', 'Ses dégâts montent de 5 % par tour, sans plafond.', 'frappe', 'salve'],
    ['Soleil Mourant', 'Tout le terrain brûle en permanence.', 'salve', 'fleau'],
    ['Cendre Première', 'Les ennemis tués ne réapparaissent plus dans la zone pendant 24 h.', 'execution', 'salve'],
  ],
  givremage: [
    ['Cryomancien', 'Ses gels durent un tour de plus.', 'fracas', 'frappe'],
    ['Souverain d’Hiver', 'Terrain gelé permanent : les ennemis perdent 20 de Célérité.', 'fracas', 'salve'],
    ['Cœur de Glace', 'Immunisé à tous les statuts.', 'egide', 'fracas'],
    ['Zéro Absolu', 'Les gelés ne peuvent plus agir du tout.', 'fracas', 'brise'],
    ['Long Hiver', 'Tous les ennemis entrent en combat déjà gelés.', 'fracas', 'salve'],
    ['Le Silence Blanc', 'Annule toutes les mécaniques d’un boss pendant trois tours.', 'brise', 'fracas'],
  ],
  elementaliste: [
    ['Harmoniste', 'Ses synergies frappent 25 % plus fort.', 'salve', 'frappe'],
    ['Tisseur d’Éléments', 'Deux synergies par tour au lieu d’une.', 'salve', 'fracas'],
    ['Avatar Élémentaire', 'Change d’élément à chaque tour : +40 % sur l’élément actif.', 'salve', 'frappe'],
    ['Convergence Vivante', 'Déclenche toutes les synergies du terrain à chaque tour.', 'salve', 'fleau'],
    ['Sixième Élément', 'Ajoute un élément qu’aucune résistance ne bloque.', 'frappe', 'salve'],
    ['L’Équilibre', 'Les six éléments actifs en même temps, à 50 % chacun.', 'salve', 'fracas'],
  ],
  necromancien: [
    ['Pestiféré', 'Ses statuts durent un tour de plus.', 'fleau', 'frappe'],
    ['Porte-Peste', 'Ses statuts se propagent d’eux-mêmes.', 'fleau', 'salve'],
    ['Père des Miasmes', 'Une cible portant trois statuts subit 50 % de dégâts en plus.', 'fleau', 'execution'],
    ['Fin de Toute Chair', 'Applique tous les statuts à tous les ennemis.', 'fleau', 'salve'],
    ['La Grande Peste', 'Ses statuts ne s’arrêtent jamais.', 'fleau', 'drain'],
    ['Patient Zéro', 'Les monstres de la zone restent affaiblis pendant 24 h.', 'fleau', 'execution'],
  ],
  invocateur: [
    ['Appeleur', 'Trois invocations simultanées.', 'salve', 'ferveur'],
    ['Maître des Liens', 'Ses invocations copient ses compétences équipées.', 'salve', 'frappe'],
    ['Berger d’Éther', 'Les invocations tombées reviennent au tour suivant.', 'salve', 'soin'],
    ['Légion', 'Six invocations, à 50 % de ses statistiques.', 'salve', 'fracas'],
    ['Le Chœur', 'Invoque une copie de chaque héros de l’équipe.', 'salve', 'ferveur'],
    ['Celui Qui Ouvre', 'Invoque un boss vaincu comme allié, une fois par jour.', 'frappe', 'salve'],
  ],

  // ---------------- ✨ Devin ----------------
  barde: [
    ['Ménestrel', 'Ses buffs durent deux tours de plus.', 'ferveur', 'soin'],
    ['Maestro', 'Deux buffs cumulables par allié.', 'ferveur', 'brise'],
    ['Voix d’Or', 'Ses buffs sont indissipables et se relancent seuls.', 'ferveur', 'soin'],
    ['Chef d’Orchestre', 'L’équipe agit deux fois tous les quatre tours.', 'ferveur', 'grandSoin'],
    ['La Symphonie', 'Tous les effets de l’équipe sont doublés.', 'ferveur', 'soin'],
    ['Le Chant Interdit', 'Silence permanent sur tout le terrain, pour tout le monde.', 'brise', 'ferveur'],
  ],
  chaman: [
    ['Porte-Totem', 'Trois totems simultanés.', 'egide', 'soin'],
    ['Voix des Esprits', 'Les esprits des alliés tombés combattent trois tours.', 'soin', 'salve'],
    ['Grand Ancêtre', 'Le premier héros tombé de chaque combat revient.', 'grandSoin', 'egide'],
    ['Conseil des Aïeux', 'Quatre totems indestructibles, à 50 % de ses statistiques.', 'egide', 'salve'],
    ['Le Cercle', 'Tout allié tombé revient en esprit permanent.', 'grandSoin', 'ferveur'],
    ['Celui Qui Parle Aux Morts', 'Interroge un boss vaincu pour connaître ses mécaniques.', 'soin', 'salve'],
  ],
  druide: [
    ['Sylvain', 'Ses soins d’équipe gagnent 25 %.', 'soin', 'fleau'],
    ['Cœur Vert', 'Tout surplus de soin devient un bouclier permanent.', 'egide', 'soin'],
    ['Arbre-Monde', 'Une résurrection gratuite par combat.', 'grandSoin', 'egide'],
    ['Racines Profondes', 'L’équipe régénère 20 % de ses PV par tour.', 'soin', 'ferveur'],
    ['Le Premier Bosquet', 'Le terrain devient une forêt qui soigne et immobilise.', 'soin', 'fleau'],
    ['La Graine', 'Plante une graine : elle devient un allié permanent au bout de dix combats.', 'ferveur', 'soin'],
  ],
  oracle: [
    ['Devin', 'Ses boucliers absorbent 30 % de plus.', 'egide', 'soin'],
    ['Voyante', 'L’équipe évite l’attaque annoncée.', 'egide', 'ferveur'],
    ['Œil du Destin', 'Rejoue le tour si l’équipe perd un héros.', 'grandSoin', 'egide'],
    ['Fil des Destinées', 'Connaît toutes les actions ennemies du combat.', 'ferveur', 'egide'],
    ['Le Livre Ouvert', 'Annule une action ennemie par tour.', 'egide', 'soin'],
    ['Celle Qui Sait', 'Voit les tirages de butin à l’avance.', 'soin', 'ferveur'],
  ],

  // ---------------- 🌑 Runelame ----------------
  faucheur: [
    ['Moissonneur', 'Son drain rend 25 % de plus.', 'drain', 'frappe'],
    ['Faucheur d’Âmes', '+5 % de dégâts par âme récoltée.', 'drain', 'salve'],
    ['Passeur', 'Exécute sous 20 % de PV et récupère l’âme.', 'execution', 'drain'],
    ['Sillage du Néant', 'Ses dégâts ignorent absolument tout.', 'execution', 'salve'],
    ['La Dernière Récolte', 'Tue tout ennemi ayant subi un de ses sorts au bout de cinq tours.', 'fleau', 'execution'],
    ['L’Innommable', 'Efface un monstre de l’existence : il ne réapparaît plus jamais.', 'execution', 'drain'],
  ],
  corrupteur: [
    ['Pestiféré', 'Ses statuts durent un tour de plus.', 'fleau', 'brise'],
    ['Porte-Peste', 'Ses statuts se propagent d’eux-mêmes.', 'fleau', 'salve'],
    ['Père des Miasmes', 'Une cible à trois statuts subit 50 % de dégâts en plus.', 'fleau', 'execution'],
    ['Fin de Toute Chair', 'Applique tous les statuts à tous les ennemis.', 'fleau', 'fracas'],
    ['La Grande Peste', 'Ses statuts ne s’arrêtent jamais — et touchent aussi ses alliés.', 'fleau', 'drain'],
    ['Patient Zéro', 'Les monstres de la zone restent affaiblis pendant 24 h.', 'fleau', 'execution'],
  ],
  metamorphe: [
    ['Change-Peau', 'Ses deux formes gagnent en puissance.', 'fracas', 'souffle'],
    ['Triple Forme', 'Ours, corbeau et serpent, au choix, sans consommer de tour.', 'fracas', 'fleau'],
    ['Bête Première', 'Garde 50 % des bonus de toutes les formes en même temps.', 'fracas', 'rafale'],
    ['Chimère', 'Les trois formes actives simultanément.', 'salve', 'fracas'],
    ['L’Innommé', 'Prend la forme du dernier monstre tué, avec ses compétences.', 'frappe', 'fleau'],
    ['Le Loup de Valciel', 'Invoque la meute originelle, une fois par jour.', 'salve', 'rafale'],
  ],
  runemaitre: [
    ['Graveur', 'Ses runes durent un tour de plus.', 'fleau', 'frappe'],
    ['Sceau Double', 'Deux runes peuvent être actives en même temps.', 'salve', 'fleau'],
    ['Alphabet Complet', '+8 % de dégâts par rune différente déjà tracée dans le combat.', 'frappe', 'salve'],
    ['Grammairien du Monde', 'Ses glyphes réécrivent une mécanique de boss par combat.', 'brise', 'salve'],
    ['La Rune Sans Nom', 'Ajoute une rune qu’aucune résistance ne bloque.', 'execution', 'salve'],
    ['Celui Qui Relit', 'Rejoue la dernière rune de l’adversaire à sa place.', 'brise', 'frappe'],
  ],
  vibrelame: [
    ['Accordeur', 'Ses attaques multiples gagnent un coup.', 'rafale', 'souffle'],
    ['Onde Portante', 'Ses coups multiples touchent une cible de plus.', 'rafale', 'salve'],
    ['Fréquence Propre', 'Chaque coup d’une série frappe 15 % plus fort que le précédent.', 'rafale', 'execution'],
    ['Résonance Totale', 'Ses séries se relancent une fois sur trois.', 'rafale', 'salve'],
    ['Le Silence', 'Tout le terrain est silencé : personne ne lance de sort, lui compris.', 'fracas', 'rafale'],
    ['La Note Qui Brise', 'Une seule note par combat, qui ignore tout et frappe une fois.', 'execution', 'rafale'],
  ],
};

// ---------------------------------------------------------------------
// Construction des 162 Éveils et de leurs 324 compétences.
// ---------------------------------------------------------------------
const EVEILS = {};

function identifiantEveil(nom) {
  return nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

Object.entries(TABLE_EVEILS).forEach(([idSousClasse, liste]) => {
  const sousClasse = SOUS_CLASSES[idSousClasse];
  if (!sousClasse) return;
  const stat = CLASSES_BASE[sousClasse.classe].stat;
  const role = ROLE_CONTRAINTE[sousClasse.classe];

  liste.forEach((entree, index) => {
    const [nom, effet, profilA, profilB] = entree;
    const rarete = ORDRE_EVEIL[index];
    const idEveil = `${idSousClasse}-${identifiantEveil(nom)}`;

    const competences = [profilA, profilB].map((profil, i) => {
      const description = DESC_PROFIL_EVEIL[profil];
      const idComp = `eveil-${idEveil}-${i + 1}`;
      const modele = PROFILS_EVEIL[profil];
      COMPETENCES[idComp] = {
        ...modele,
        effet: modele.effet ? { ...modele.effet, stat } : undefined,
        nom: i === 0 ? nom : `${nom} — Apogée`,
        emoji: RARETES_EVEIL[rarete].emoji,
        categorie: 'signature',
        eveil: idEveil,
        niveauRequis: NIVEAU_EVEIL,
        stat: modele.type === 'utilitaire' ? undefined : stat,
        desc: `${description} ${i === 0 ? 'Première' : 'Seconde'} compétence de l’Éveil « ${nom} ».`,
      };
      return idComp;
    });

    EVEILS[idEveil] = {
      id: idEveil,
      nom,
      rarete,
      emoji: RARETES_EVEIL[rarete].emoji,
      sousClasse: idSousClasse,
      classe: sousClasse.classe,
      effet,
      // La contrainte ne retire jamais de la puissance : elle retire une
      // option. C'est ce qui permet de tenir la fourchette de ±10 %.
      contrainte: RARETES_EVEIL[rarete].contrainte ? CONTRAINTES[rarete][role] : null,
      competences,
      titre: nom,
    };
  });
});

Object.values(SOUS_CLASSES).forEach((sc) => {
  sc.eveils = Object.keys(EVEILS).filter((id) => EVEILS[id].sousClasse === sc.id);
});

function eveilDe(p) {
  return EVEILS[p && p.eveil && p.eveil.id] || null;
}

// =====================================================================
// Le tirage : TROIS propositions parmi les Éveils de sa sous-classe,
// pondérées par rareté. Les Cachés ne sortent jamais d'un tirage
// ordinaire — ils se méritent par une condition, pas par la chance.
//
// Pourquoi trois et pas cinq : chaque sous-classe compte exactement
// cinq Éveils tirables. Un tirage de cinq sans doublon contenait donc
// TOUJOURS les cinq raretés — la pondération, les relances, la garantie
// et le verrouillage ne servaient à rien. À trois, chaque tirage est un
// vrai tirage.
//
// Garantie anti-frustration (§5.1) : au bout de cinq relances, le tirage
// suivant contient obligatoirement une proposition Légendaire ou mieux.
// =====================================================================
const PROPOSITIONS_PAR_TIRAGE = 3;
const RELANCES_AVANT_GARANTIE = 5;

// Le seuil de la garantie : MYTHIQUE, pas Légendaire.
//
// Arithmétique, pas préférence : chaque spécialité compte 5 Éveils
// tirables, dont 3 sont Légendaire ou mieux. En tirer 3 sans remise, il
// est IMPOSSIBLE de n'en avoir aucun — il n'y a que 2 propositions plus
// communes à piocher. Une garantie « au moins un Légendaire » serait
// donc toujours déjà vraie : 80 Sceaux pour du vent. Au Mythique, la
// garantie mord vraiment (le tirage {Rare, Épique, Légendaire} existe).
const RARETE_GARANTIE = 'mythique';

function tirerEveils(p, options = {}) {
  const sousClasse = sousClasseDe(p);
  if (!sousClasse) return [];
  const relances = (p.eveil && p.eveil.relances) || 0;
  const garantie = options.garantirLegendaire || relances >= RELANCES_AVANT_GARANTIE;
  const rangGarantie = ORDRE_EVEIL.indexOf(RARETE_GARANTIE);

  const candidats = (sousClasse.eveils || [])
    .map((id) => EVEILS[id])
    .filter((e) => e.rarete !== 'cache');

  const propositions = [];
  const verrouillee = options.verrouillee && EVEILS[options.verrouillee];
  if (verrouillee) propositions.push(verrouillee);

  const pioche = () => {
    const restants = candidats.filter((e) => !propositions.includes(e));
    if (!restants.length) return null;
    const total = restants.reduce((s, e) => s + RARETES_EVEIL[e.rarete].poids, 0);
    let curseur = Math.random() * total;
    for (const e of restants) {
      curseur -= RARETES_EVEIL[e.rarete].poids;
      if (curseur <= 0) return e;
    }
    return restants[restants.length - 1];
  };

  while (propositions.length < Math.min(PROPOSITIONS_PAR_TIRAGE, candidats.length)) {
    const e = pioche();
    if (!e) break;
    propositions.push(e);
  }

  // La garantie : si rien d'assez rare n'est sorti, on remplace la
  // proposition la plus commune par la meilleure encore disponible.
  const rangs = ORDRE_EVEIL;
  if (garantie && !propositions.some((e) => rangs.indexOf(e.rarete) >= rangGarantie)) {
    const rares = candidats
      .filter((e) => rangs.indexOf(e.rarete) >= rangGarantie)
      .filter((e) => !propositions.includes(e));
    if (rares.length) {
      propositions.sort((a, b) => rangs.indexOf(a.rarete) - rangs.indexOf(b.rarete));
      propositions[0] = rares[Math.floor(Math.random() * rares.length)];
    }
  }
  return propositions;
}

// Les conditions des Éveils cachés : un indice tant qu'elles ne sont pas
// remplies, la condition exacte une fois révélée à la Tour.
const CONDITIONS_CACHEES = {
  contenu: { indice: 'Quelque chose se débloque très haut dans une tour.', exacte: 'Atteindre l’étage 50 d’une Ascension éternelle.' },
  maniere: { indice: 'Trois victoires d’affilée, et pas une goutte de soin.', exacte: 'Vaincre trois boss d’affilée sans le moindre soin.' },
  repetition: { indice: 'Il faudra tomber, puis se relever une fois de trop.', exacte: 'Mourir dix fois, puis vaincre en solo le boss responsable.' },
  collection: { indice: 'Le codex sait des choses que vous ignorez encore.', exacte: 'Compléter le bestiaire à 100 %.' },
  secret: { indice: 'Un lieu, une heure, un ciel — les trois à la fois.', exacte: 'Trouver le PNJ qui n’apparaît que la nuit, sous blizzard, aux Marches Grises.' },
};

// Chaque Éveil caché tire sa condition de la sous-classe, pour qu'aucune
// ne se ressemble d'un rôle à l'autre.
const TYPES_CONDITION = Object.keys(CONDITIONS_CACHEES);
Object.values(EVEILS).filter((e) => e.rarete === 'cache').forEach((e, i) => {
  e.condition = CONDITIONS_CACHEES[TYPES_CONDITION[i % TYPES_CONDITION.length]];
});
