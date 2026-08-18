'use strict';

// =====================================================================
// v22 — LES PASSIFS DE SOUS-CLASSE, ENFIN BRANCHÉS
//
// CE QUI N'ALLAIT PAS. Les vingt-sept sous-classes annoncent chacune un
// passif sur leur fiche — c'est même l'argument qui décide du choix au
// niveau 10. Aucun n'existait : `passif` n'était qu'une chaîne de
// caractères affichée dans le panneau du héros. Un Faucheur lisait « ses
// sorts lui rendent 25 % en PV ; il exécute les cibles sous 15 % de vie »
// et ne récupérait pas un seul point de vie de toute sa carrière.
//
// LA RÈGLE DE LA v22. Le texte du passif N'EST PLUS ÉCRIT À LA MAIN : il
// est produit à partir des chiffres qui le font tourner, juste en dessous.
// Un passif ne peut donc plus mentir sur ce qu'il fait, et changer un
// réglage change la fiche du héros dans le même geste. Les tests
// vérifient que les vingt-sept sous-classes ont bien leur entrée ici, et
// que chacune est effectivement lue par le moteur de combat.
//
// Trois passifs ont dû être RÉÉCRITS pour dire la vérité : ils
// s'appuyaient sur des mécaniques que le jeu n'a pas (familles de
// monstres, éléments portés par les sorts, runes jouées dans le tour).
// Ils gardent leur intention, formulée avec ce qui existe vraiment.
// =====================================================================

// Un passif se lit toujours par le même chemin : le combattant, sa
// sous-classe, la clé du réglage. Un héros distant reconstruit par le
// réseau n'a parfois pas de sous-classe : on renvoie alors null.
function passifSousClasse(c) {
  if (!c || c.type !== 'joueur') return null;
  return PASSIFS_SOUS_CLASSE[c.sousClasse] || null;
}

// =====================================================================
// v23 — LA FUSION SPÉCIALITÉ + VOIE.
//
// Une Voie n'est pas un second système : c'est le même, poussé plus loin.
// Ses réglages RECOUVRENT ceux de la spécialité, clé par clé. Trois
// conséquences, toutes voulues :
//
//   • une Voie qui reprend une clé déjà connue du moteur n'a rien à
//     brancher — le Faucheur de la Voie du Drain écrit `drainSorts: 0.40`
//     et le drain passe de 25 à 40 % sans une ligne de moteur en plus ;
//   • une Voie qui n'en parle pas laisse le passif de spécialité intact,
//     donc choisir une Voie n'a jamais enlevé quoi que ce soit ;
//   • les réglages d'une Voie répètent volontiers ceux de leur spécialité
//     (voir js/data/voies-passifs.js) : c'est ce qui rend la fiche de Voie
//     complète et lisible d'un coup d'œil.
//
// Le résultat est mémorisé par couple (spécialité, Voie) : cette fonction
// est appelée plusieurs fois par coup porté.
// =====================================================================
const MEMO_REGLAGES = {};

function reglagesDuCombattant(c) {
  if (!c || c.type !== 'joueur') return null;
  const idEveil = (c.eveil && c.eveil.id) || '-';
  const cleMemo = `${c.sousClasse || '-'}|${c.voie || '-'}|${idEveil}`;
  if (MEMO_REGLAGES[cleMemo]) return MEMO_REGLAGES[cleMemo];
  const specialite = PASSIFS_SOUS_CLASSE[c.sousClasse] || null;
  const voie = (typeof PASSIFS_VOIE !== 'undefined' && PASSIFS_VOIE[c.voie]) || null;
  // v24 : l'Éveil se pose par-dessus les deux, contrainte comprise.
  const eveil = (typeof PASSIFS_EVEIL !== 'undefined' && PASSIFS_EVEIL[idEveil]) || null;
  if (!specialite && !voie && !eveil) return null;
  MEMO_REGLAGES[cleMemo] = { ...(specialite || {}), ...(voie || {}), ...(eveil || {}) };
  return MEMO_REGLAGES[cleMemo];
}

// Le réglage `cle` du passif de `c` — spécialité, puis Voie par-dessus —
// ou `defaut` s'il n'en porte pas. Les hooks du moteur ne font que ça.
function reglagePassif(c, cle, defaut = 0) {
  const p = reglagesDuCombattant(c);
  return p && p[cle] !== undefined ? p[cle] : defaut;
}

function estSousClasse(c, id) {
  return !!c && c.type === 'joueur' && c.sousClasse === id;
}

// =====================================================================
// Les vingt-sept passifs, avec leurs chiffres.
//
//   nom     le mot qui le désigne, affiché en tête de la fiche
//   texte   produit à partir des chiffres — jamais saisi à la main
// =====================================================================
const PASSIFS_SOUS_CLASSE = {
  // ----- 🛡️ Gardien -----
  templier: {
    nom: 'Bouclier partagé',
    reductionLigneAvant: 0.15,
    texte: (p) => `tant qu’il tient debout, les alliés de la ligne avant subissent ${pct(p.reductionLigneAvant)} de moins.`,
  },
  paladin: {
    nom: 'Main secourable',
    seuilSecours: 0.30,
    partBouclierSecours: 0.25,
    texte: (p) => `le premier allié à tomber sous ${pct(p.seuilSecours)} de ses PV reçoit un bouclier gratuit de ${pct(p.partBouclierSecours)} de ses PV max — une fois par combat.`,
  },
  'chevalier-noir': {
    nom: 'Soif',
    volDeVie: 0.12,
    sangParMana: 2,
    texte: (p) => `ses coups lui rendent ${pct(p.volDeVie)} des dégâts infligés, et quand le mana manque il paie ses sorts ${p.sangParMana} PV par point de mana.`,
  },
  colosse: {
    nom: 'Masse',
    degatsParCentPv: 0.01,
    plafondMasse: 0.30,
    texte: (p) => `+${pct(p.degatsParCentPv)} de dégâts par tranche de 100 PV maximum, jusqu’à +${pct(p.plafondMasse)}.`,
  },

  // ----- ⚔️ Guerrier -----
  berserker: {
    nom: 'Rage',
    rageMax: 0.40,
    soinParMise: 0.08,
    texte: (p) => `jusqu’à +${pct(p.rageMax)} de dégâts à mesure que ses PV descendent, et chaque ennemi abattu lui rend ${pct(p.soinParMise)} de ses PV max.`,
  },
  moine: {
    nom: 'Cadence',
    chargesPourCritique: 5,
    texte: (p) => `chaque coup porté accumule une charge ; à ${p.chargesPourCritique} charges, le coup suivant est critique garanti.`,
  },
  assassin: {
    nom: 'Ouverture',
    texte: () => 'son premier coup de chaque combat est un critique garanti.',
  },
  danselame: {
    nom: 'Chorégraphie',
    pasGratuit: true,
    bonusApresPas: 0.20,
    texte: (p) => `changer de ligne ne consomme pas son tour, et le coup qui suit ce pas gagne +${pct(p.bonusApresPas)}.`,
  },
  duelliste: {
    nom: 'Duel',
    critParManche: 0.08,
    critMaxDuel: 0.40,
    texte: (p) => `+${pct(p.critParManche)} de critique par manche passée sur la MÊME cible, jusqu’à +${pct(p.critMaxDuel)} ; changer de cible remet le compteur à zéro.`,
  },

  // ----- 🏹 Franc-tireur -----
  // Réécrit : le bestiaire n'a pas de familles (« créatures »). Ce qui
  // existe, et se voit, c'est le rang du monstre : élite et boss.
  rodeur: {
    nom: 'Terrain de chasse',
    bonusElite: 0.30,
    piegeParDex: 0.6,
    texte: (p) => `+${pct(p.bonusElite)} de dégâts contre les élites et les boss, et un piège tendu au premier tour de chaque combat.`,
  },
  voleur: {
    nom: 'Poches percées',
    bonusOr: 0.25,
    bonusRarete: 10,
    volParCoup: 0.5,
    texte: (p) => `+${pct(p.bonusOr)} d’or et +${p.bonusRarete} de Chance sur les tirages de butin ; ses coups font les poches de l’ennemi.`,
  },
  traqueur: {
    nom: 'Marque',
    dureeMarque: 3,
    bonusMarque: 0.12,
    texte: (p) => `ce qu’il frappe porte sa marque ${p.dureeMarque} tours : la cible marquée subit +${pct(p.bonusMarque)} de la part de TOUTE l’équipe.`,
  },
  voltigeur: {
    nom: 'Voltige',
    ignoreLigne: true,
    texte: () => 'aucun malus depuis la ligne arrière, et sa Célérité lui offre parfois une action de plus dans la manche.',
  },

  // ----- 🔮 Arcaniste -----
  pyromancien: {
    nom: 'Embrasement',
    brulureMax: 5,
    partExplosion: 2,
    texte: (p) => `ses brûlures se cumulent jusqu’à ${p.brulureMax} fois, et une cible qui meurt en brûlant explose sur tout ce qui l’entoure.`,
  },
  // Réécrit : il n'y a pas d'état « gelé » distinct dans le moteur — le
  // gel, c'est l'étourdissement. Le passif dit désormais ce qu'il fait.
  givremage: {
    nom: 'Bris de glace',
    bonusBrisGlace: 0.75,
    texte: (p) => `ses coups sur une cible étourdie — gelée — valent +${pct(p.bonusBrisGlace)} et consument le gel.`,
  },
  // Réécrit : aucun sort ne porte d'élément dans ce jeu. L'intention —
  // récompenser l'alternance plutôt que la répétition — est gardée.
  elementaliste: {
    nom: 'Synergie',
    bonusSynergie: 0.25,
    texte: (p) => `alterner : un sort différent du précédent frappe +${pct(p.bonusSynergie)}. Répéter le même ne donne rien.`,
  },
  necromancien: {
    nom: 'Charnier',
    parMort: 0.03,
    plafondCharnier: 0.45,
    texte: (p) => `+${pct(p.parMort)} de dégâts par corps tombé sur le terrain, allié ou ennemi, jusqu’à +${pct(p.plafondCharnier)}.`,
  },
  invocateur: {
    nom: 'Meute',
    limiteInvocations: 2,
    multInvocation: 1.4,
    texte: (p) => `${p.limiteInvocations} invocations à la fois, et leurs statistiques montent de ${pct(p.multInvocation - 1)}.`,
  },

  // ----- ✨ Devin -----
  barde: {
    nom: 'Tempo',
    dureeBuffBonus: 2,
    reductionBerce: 0.15,
    dureeBerce: 3,
    texte: (p) => `ses bénédictions, boucliers et régénérations durent ${p.dureeBuffBonus} tours de plus, et ce qu’il touche inflige ${pct(p.reductionBerce)} de moins pendant ${p.dureeBerce} tours.`,
  },
  chaman: {
    nom: 'Ancêtres',
    limiteInvocations: 2,
    dureeEsprit: 3,
    texte: (p) => `${p.limiteInvocations} totems simultanés ; quand un allié tombe, son esprit combat ${p.dureeEsprit} tours à sa place.`,
  },
  druide: {
    nom: 'Sève',
    partSoinEquipe: 0.05,
    texte: (p) => `chaque régénération qu’il pose soigne aussi ${pct(p.partSoinEquipe)} des PV max de TOUTE l’équipe, sur-le-champ.`,
  },
  oracle: {
    nom: 'Prescience',
    partSurplus: 1,
    plafondSurplus: 0.20,
    texte: (p) => `l’intégralité du surplus de soin se fige en bouclier — au lieu de la moitié —, jusqu’à ${pct(p.plafondSurplus)} des PV max de la cible.`,
  },

  // ----- 🌑 Runelame -----
  faucheur: {
    nom: 'Moisson',
    drainSorts: 0.25,
    seuilExecution: 0.15,
    texte: (p) => `TOUS ses sorts lui rendent ${pct(p.drainSorts)} des dégâts infligés en PV, et il exécute sur place toute cible laissée sous ${pct(p.seuilExecution)} de ses PV.`,
  },
  corrupteur: {
    nom: 'Contagion',
    dureeBonusStatut: 1,
    texte: (p) => `les états qu’il inflige durent ${p.dureeBonusStatut} tour de plus, et se propagent à un autre ennemi en expirant.`,
  },
  metamorphe: {
    nom: 'Trois bêtes',
    pvOurs: 0.30,
    initiativeCorbeau: 0.25,
    texte: (p) => `il bascule librement, hors combat, entre l’ours (+${pct(p.pvOurs)} de PV max) et le corbeau (+${pct(p.initiativeCorbeau)} d’initiative).`,
  },
  // Réécrit : un héros ne lance qu'un sort par tour — « chaque rune du
  // tour » ne pouvait rien vouloir dire. La discipline se compte sur le
  // combat entier : varier son répertoire paie, marteler la même touche non.
  runemaitre: {
    nom: 'Discipline',
    parRune: 0.08,
    plafondRunes: 0.40,
    texte: (p) => `+${pct(p.parRune)} de dégâts par compétence DIFFÉRENTE déjà lancée dans le combat, jusqu’à +${pct(p.plafondRunes)}.`,
  },
  vibrelame: {
    nom: 'Chant d’acier',
    chanceCoupSupp: 0.5,
    texte: (p) => `ses attaques à coups multiples portent un coup de plus une fois sur ${Math.round(1 / p.chanceCoupSupp)}.`,
  },
};

// Un pourcentage lisible : 0,15 → « 15 % ». Les passifs s'écrivent avec.
function pct(x) {
  return `${Math.round(x * 1000) / 10} %`.replace('.', ',');
}

// =====================================================================
// La fiche du héros lit `sousClasse.passif`. Ce texte est désormais
// PRODUIT à partir du tableau ci-dessus : impossible qu'il annonce autre
// chose que ce que le moteur applique.
// =====================================================================
Object.entries(PASSIFS_SOUS_CLASSE).forEach(([id, passif]) => {
  passif.id = id;
  passif.description = passif.texte(passif);
  if (SOUS_CLASSES[id]) SOUS_CLASSES[id].passif = `${passif.nom} — ${passif.description}`;
});

// La Chance qui sert aux tirages de butin : celle du héros, plus ce que
// son passif y ajoute. Tous les coffres du jeu passent par là — sans quoi
// « +10 de Chance sur les tirages » resterait une phrase sur une fiche.
function chanceButin(p) {
  if (!p) return 0;
  const cha = statsEffectives(p).cha || 0;
  // Contrainte cachée du mage : plus aucun bonus de rareté, jamais.
  if (reglagePassif(p, 'aucunBonusRarete', false)) return cha;
  return cha + reglagePassif(p, 'bonusRarete', 0);
}
