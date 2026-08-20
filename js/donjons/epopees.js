'use strict';

// =====================================================================
// Les Épopées de Valciel : objets, monstres et récits des grands donjons
// =====================================================================

// =====================================================================
// Donjons d'histoire : aventures scénarisées avec dialogues, choix à
// conséquences, salles enchaînées et boss à mécaniques uniques.
//
// Une étape est de type :
//  'dialogue' { scenes: [{qui, emoji, texte}], suite }
//  'choix'    { texte, qui?, emoji?, options: [{ texte, detail?, condition?,
//               effet?, resultat?, resultats?, suite }] }
//  'tresor'   { titre, texte, effet, suite }
//  'combat'   { intro, monstres: [cles], suite }
//  'boss'     { intro, monstre: cle, modificateurs?: [{drapeau, hpMult?,
//               atkMult?, annonce}], suite }
//  'fin'      { variantes?: [{drapeau, texte}], texte }
//
// condition : { stat, min } | { drapeau } | { sansDrapeau }
// effet     : { pvPct, mpPct, po, xp, objets: {id: qte}, drapeau }
// La progression (checkpoint + drapeaux) est sauvegardée sur le héros
// actif à chaque étape : on peut quitter et reprendre plus tard.
// =====================================================================

// ---------------------------------------------------------------------
// Objets exclusifs des donjons (introuvables ailleurs)
// ---------------------------------------------------------------------
const OBJETS_DONJONS = {
  'couronne-du-roi-oublie': {
    nom: 'Couronne du Roi Oublié', emoji: '👑', type: 'equipement', slot: 'tete', niveau: 5,
    rarete: 'epique', prixVente: 150, bonus: { int: 3, vit: 2, pvMax: 12, cha: 1 },
    desc: 'La couronne d’Aldric, apaisée. Récompense de la Crypte du Roi Oublié.',
  },
  'fiole-des-merveilles': {
    nom: 'Fiole des merveilles', emoji: '🧪', type: 'equipement', slot: 'accessoire', niveau: 9,
    rarete: 'epique', prixVente: 220, bonus: { int: 4, cha: 2, pmMax: 10 },
    desc: 'Un reste d’expérience réussie. Récompense du Laboratoire de Frivole.',
  },
  'sabre-du-capitaine': {
    nom: 'Sabre du capitaine Morvane', emoji: '🗡️', type: 'equipement', slot: 'arme', familleArme: 'lame', niveau: 13,
    rarete: 'legendaire', prixVente: 420, bonus: { for: 8, dex: 6, crit: 4 },
    desc: 'Il sent encore le sel et l’orage. Récompense du Brise-Brume.',
  },
  'marteau-de-la-forge-eternelle': {
    nom: 'Marteau de la Forge éternelle', emoji: '🔨', type: 'equipement', slot: 'arme', familleArme: 'lame', niveau: 35,
    rarete: 'mythique', prixVente: 1226, bonus: { for: 26, vit: 7, pvMax: 44 },
    desc: 'Forgé par Barguzan dans une Forge ravivée. Il chante en frappant.',
  },
  'lame-de-la-derniere-cendre': {
    nom: 'Lame de la Dernière Cendre', emoji: '🌑', type: 'equipement', slot: 'arme', familleArme: 'arc', niveau: 35,
    rarete: 'mythique', prixVente: 1226, bonus: { dex: 21, for: 14, crit: 11 },
    desc: 'Trempée dans le dernier feu du volcan éteint. Froide, et pourtant…',
  },
};
declarerObjetsDonjons(OBJETS_DONJONS); // garde-fou anti-collision (déclaré plus bas, hoisté)

// ---------------------------------------------------------------------
// Monstres exclusifs des donjons (mêmes gabarits que MONSTRES)
// ---------------------------------------------------------------------
const MONSTRES_DONJONS = {
  // ----- La Crypte du Roi Oublié (niv. 4+) -----
  'garde-noye': {
    nom: 'Garde noyé', emoji: '🧟', niveau: 4, hp: 52, atk: 10, dex: 4, xp: 46, po: [8, 14],
    drops: [{ id: 'poussiere-spectre', chance: 0.3 }],
    attaques: [
      { nom: 'Hallebarde rouillée', emoji: '🪓', mult: 1.0, poids: 3, type: 'mono' },
      { nom: 'Étreinte glacée', emoji: '🥶', mult: 0.8, poids: 1, type: 'mono', effet: { type: 'affaibli', duree: 2 } },
    ],
  },
  'spectre-vorn': {
    nom: 'Spectre du chancelier Vorn', emoji: '🌫️', niveau: 6, boss: true, hp: 135, atk: 12, dex: 7, xp: 130, po: [30, 50],
    drops: [{ id: 'poussiere-spectre', chance: 1 }],
    attaques: [
      { nom: 'Griffe de regret', emoji: '🌫️', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Murmure vénéneux', emoji: '🐍', mult: 0.8, poids: 2, type: 'mono', effet: { type: 'poison', degats: 5, duree: 2 } },
      { nom: 'Souffle des remords', emoji: '💨', mult: 0.7, poids: 1, type: 'aoe' },
    ],
  },
  'garde-outre-tombe': {
    nom: 'Garde d’outre-tombe', emoji: '💀', niveau: 5, hp: 42, atk: 9, dex: 5, xp: 26, po: [4, 8],
    drops: [],
    attaques: [
      { nom: 'Lance spectrale', emoji: '🔱', mult: 1.0, poids: 1, type: 'mono' },
    ],
  },
  'roi-aldric': {
    nom: 'Aldric le Déchu', emoji: '👑', niveau: 6, boss: true, hp: 240, atk: 13, dex: 6, xp: 320, po: [60, 90],
    drops: [{ id: 'os-ancien', chance: 1 }, { id: 'poussiere-spectre', chance: 0.8 }],
    attaques: [
      { nom: 'Sceptre du jugement', emoji: '🪄', mult: 1.15, poids: 3, type: 'mono' },
      { nom: 'Lamentation royale', emoji: '😭', mult: 0.7, poids: 1, type: 'aoe' },
    ],
    mecaniques: {
      phases: [
        {
          seuil: 0.75,
          annonce: '👑 « Gardes ! À moi ! » — des tombes s’ouvrent le long des murs !',
          invoque: ['garde-outre-tombe', 'garde-outre-tombe'],
        },
        {
          seuil: 0.4,
          annonce: '🔥 La couronne d’Aldric s’embrase — le feu spectral lèche les dalles !',
          atkMult: 1.35,
          attaques: [
            { nom: 'Couronne ardente', emoji: '🔥', mult: 1.2, poids: 2, type: 'mono' },
            { nom: 'Brasier spectral', emoji: '🟣', mult: 0.85, poids: 2, type: 'aoe' },
          ],
        },
      ],
      enrage: { manche: 9, atkMult: 1.6, annonce: '⚠️ Aldric perd patience : sa fureur d’outre-tombe redouble !' },
    },
  },

  // ----- Le Laboratoire de Frivole (niv. 8+) -----
  'cobaye-enrage': {
    nom: 'Cobaye enragé', emoji: '🐹', niveau: 8, hp: 70, atk: 13, dex: 9, xp: 60, po: [10, 18],
    drops: [{ id: 'herbe-lunaire', chance: 0.4 }],
    attaques: [
      { nom: 'Morsure frénétique', emoji: '🦷', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Roulade folle', emoji: '🌀', mult: 1.3, poids: 1, type: 'mono' },
    ],
  },
  'gelee-instable': {
    nom: 'Gelée instable', emoji: '🟢', niveau: 8, hp: 85, atk: 14, dex: 5, xp: 66, po: [12, 20],
    drops: [{ id: 'seve-ambree', chance: 0.35 }],
    attaques: [
      { nom: 'Éclaboussure acide', emoji: '🧪', mult: 0.9, poids: 2, type: 'mono', effet: { type: 'poison', degats: 5, duree: 2 } },
      { nom: 'Vague gluante', emoji: '🌊', mult: 0.7, poids: 1, type: 'aoe' },
    ],
  },
  'flaque-vive': {
    nom: 'Flaque vive', emoji: '💧', niveau: 8, hp: 48, atk: 11, dex: 7, xp: 30, po: [5, 10],
    drops: [],
    attaques: [
      { nom: 'Gifle de mercure', emoji: '🫧', mult: 1.0, poids: 1, type: 'mono' },
    ],
  },
  'chimere-mercure': {
    nom: 'Chimère de Mercure', emoji: '🫠', niveau: 10, boss: true, hp: 380, atk: 17, dex: 9, xp: 500, po: [90, 140],
    drops: [{ id: 'noyau-golem', chance: 0.8 }, { id: 'cristal-givre', chance: 0.5 }],
    attaques: [
      { nom: 'Pseudopode fouettant', emoji: '🫠', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Projection corrosive', emoji: '🧪', mult: 0.9, poids: 2, type: 'mono', effet: { type: 'poison', degats: 7, duree: 2 } },
    ],
    mecaniques: {
      phases: [
        {
          seuil: 0.6,
          annonce: '🫧 La Chimère se scinde ! Des flaques vives s’en détachent et sa surface se durcit !',
          invoque: ['flaque-vive', 'flaque-vive'],
          bouclier: 70,
        },
        {
          seuil: 0.3,
          annonce: '☣️ La Chimère bouillonne : une pluie d’acide s’abat sur toute la salle !',
          atkMult: 1.35,
          attaques: [
            { nom: 'Pluie corrosive', emoji: '☣️', mult: 0.9, poids: 2, type: 'aoe' },
            { nom: 'Pseudopode fouettant', emoji: '🫠', mult: 1.2, poids: 2, type: 'mono' },
          ],
        },
      ],
      enrage: { manche: 10, atkMult: 1.6, annonce: '⚠️ La Chimère entre en fusion : ses coups deviennent terribles !' },
    },
  },

  // ----- Le Brise-Brume (niv. 12+) -----
  'matelot-spectral': {
    nom: 'Matelot spectral', emoji: '🧟‍♂️', niveau: 12, hp: 105, atk: 19, dex: 10, xp: 95, po: [18, 30],
    drops: [{ id: 'poussiere-spectre', chance: 0.5 }],
    attaques: [
      { nom: 'Crochet d’abordage', emoji: '🪝', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Nœud coulant', emoji: '🪢', mult: 0.8, poids: 1, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.25 } },
    ],
  },
  'mousse-spectral': {
    nom: 'Mousse spectral', emoji: '👻', niveau: 12, hp: 62, atk: 15, dex: 11, xp: 36, po: [6, 12],
    drops: [],
    attaques: [
      { nom: 'Coup de gaffe', emoji: '🪝', mult: 1.0, poids: 1, type: 'mono' },
    ],
  },
  'brume-affamee': {
    nom: 'Brume affamée', emoji: '🌫️', niveau: 13, hp: 120, atk: 21, dex: 12, xp: 105, po: [20, 34],
    drops: [{ id: 'lotus-noir', chance: 0.45 }],
    attaques: [
      { nom: 'Morsure de brouillard', emoji: '🌫️', mult: 1.0, poids: 2, type: 'mono', effet: { type: 'drain', part: 0.4 } },
      { nom: 'Voile étouffant', emoji: '😶‍🌫️', mult: 0.75, poids: 1, type: 'aoe' },
    ],
  },
  'capitaine-morvane': {
    nom: 'Capitaine Morvane', emoji: '🏴‍☠️', niveau: 14, boss: true, hp: 620, atk: 24, dex: 12, xp: 850, po: [150, 220],
    drops: [{ id: 'perle-des-sables', chance: 0.7 }, { id: 'lotus-noir', chance: 1 }],
    attaques: [
      { nom: 'Taillade de sabre', emoji: '🗡️', mult: 1.15, poids: 3, type: 'mono' },
      { nom: 'Bordée de pistolet', emoji: '💥', mult: 1.3, poids: 1, type: 'mono' },
    ],
    mecaniques: {
      invocations: {
        toutesLes: 3, max: 4, monstres: ['mousse-spectral', 'mousse-spectral'],
        annonce: '🏴‍☠️ « Tout le monde sur le pont ! » — l’équipage maudit se hisse par-dessus bord !',
      },
      phases: [
        {
          seuil: 0.45,
          annonce: '🌩️ Morvane siffle la tempête : la brume se déchaîne autour du navire !',
          atkMult: 1.3,
          attaques: [
            { nom: 'Œil du cyclone', emoji: '🌀', mult: 0.9, poids: 2, type: 'aoe' },
            { nom: 'Taillade de sabre', emoji: '🗡️', mult: 1.25, poids: 2, type: 'mono' },
          ],
        },
      ],
      enrage: { manche: 11, atkMult: 1.7, annonce: '⚠️ Le pacte de Morvane arrive à son terme : il frappe comme un damné !' },
    },
  },

  // ----- Le Cœur du Volcan (niv. 16+) -----
  'golem-basalte': {
    nom: 'Golem de basalte', emoji: '🗿', niveau: 34, hp: 280, atk: 40, dex: 6, xp: 221, po: [44, 74],
    drops: [{ id: 'noyau-golem', chance: 0.6 }],
    attaques: [
      { nom: 'Poing tellurique', emoji: '🗿', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Secousse', emoji: '💢', mult: 0.8, poids: 1, type: 'aoe' },
    ],
  },
  'elementaire-magma': {
    nom: 'Élémentaire de magma', emoji: '🔥', niveau: 34, hp: 170, atk: 34, dex: 9, xp: 221, po: [15, 27],
    drops: [],
    attaques: [
      { nom: 'Projection de lave', emoji: '🌋', mult: 1.0, poids: 1, type: 'mono' },
    ],
  },
  'ignarok': {
    nom: 'Ignarok, Cœur de Magma', emoji: '🌋', niveau: 36, boss: true, hp: 1491, atk: 48, dex: 10, xp: 1808, po: [392, 549],
    drops: [{ id: 'ecaille-draconique', chance: 1 }, { id: 'noyau-golem', chance: 1 }],
    attaques: [
      { nom: 'Poing de magma', emoji: '🌋', mult: 1.15, poids: 3, type: 'mono' },
      { nom: 'Geyser de feu', emoji: '🔥', mult: 1.3, poids: 1, type: 'mono' },
    ],
    mecaniques: {
      phases: [
        {
          seuil: 0.7,
          annonce: '🪨 Ignarok s’enveloppe d’une carapace d’obsidienne et appelle la lave à lui !',
          bouclier: 130,
          invoque: ['elementaire-magma', 'elementaire-magma'],
        },
        {
          seuil: 0.4,
          annonce: '🌋 FUSION TOTALE ! Le sol se fissure — l’éruption balaye toute la salle !',
          atkMult: 1.4,
          attaques: [
            { nom: 'Éruption', emoji: '🌋', mult: 0.95, poids: 2, type: 'aoe' },
            { nom: 'Poing de magma', emoji: '🔥', mult: 1.25, poids: 2, type: 'mono' },
          ],
        },
        {
          seuil: 0.15,
          annonce: '💢 Le cœur d’Ignarok bat à se rompre : chaque coup est un séisme !',
          atkMult: 1.25,
        },
      ],
      enrage: { manche: 12, atkMult: 1.8, annonce: '⚠️ Le volcan tout entier gronde : Ignarok ne retient plus rien !' },
    },
  },
};

// ---------------------------------------------------------------------
// Les 4 donjons d'histoire
// ---------------------------------------------------------------------
const DONJONS = [
  // ============================================================
  // 1. La Crypte du Roi Oublié — niv. 4+
  // ============================================================
  {
    id: 'crypte',
    nom: 'La Crypte du Roi Oublié',
    emoji: '🏛️',
    niveauMin: 4,
    // La toute première histoire : elle ne demande pas de profil, juste de
    // quoi veiller un mort et d'avoir tenu tête au Loup alpha des Plaines.
    acces: accesHistoire(4, null, {
      objets: { 'herbe-lunaire': 3 },
      bossZones: ['plaines'],
      puissance: 0.6,
      equipement: 3,
    }),
    resume: 'Sous les Plaines dort un roi que l’Histoire a rayé. Quelque chose l’empêche de dormir.',
    hautFait: 'donjon-crypte',
    depart: 'intro',
    recompenses: { xp: 260, po: 160, objet: 'couronne-du-roi-oublie' },
    etapes: {
      intro: {
        type: 'dialogue',
        scenes: [
          { qui: 'Narrateur', emoji: '📜', texte: 'Un orage a éventré le vieux tumulus des Plaines de l’Aube. Sous la terre : un escalier de marbre noir, et un courant d’air froid qui sent la cire et le regret.' },
          { qui: 'Écho d’Aldric', emoji: '👻', texte: '« Un vivant… enfin. Je suis — j’étais — Aldric, roi de Valciel avant que Valciel n’ait ce nom. Mon repos est brisé, et mon propre corps hante ma crypte. »' },
          { qui: 'Écho d’Aldric', emoji: '👻', texte: '« Mon chancelier, Vorn, m’a empoisonné pour prendre la couronne. Il est mort avant d’en profiter — et notre haine nous a tous deux cloués ici. Descends. Libère-nous, d’une façon ou d’une autre. »' },
        ],
        suite: 'herse',
      },
      herse: {
        type: 'choix',
        qui: 'Narrateur', emoji: '🏛️',
        texte: 'L’escalier débouche sur une herse de bronze rongée de vert-de-gris. À gauche, un passage inondé d’eau noire. Sur le mur, des fresques racontent le règne d’Aldric — si l’on sait les lire.',
        options: [
          {
            texte: '💪 Forcer la herse de bronze',
            detail: 'Force ≥ 9 — ouvre un raccourci vers la réserve funéraire',
            condition: { stat: 'for', min: 9 },
            resultat: 'Le métal cède dans un long gémissement. Derrière : la réserve funéraire, intacte depuis des siècles.',
            suite: 'reserve',
          },
          {
            texte: '📖 Déchiffrer les fresques',
            detail: 'Intelligence ≥ 9 — apprendre la faiblesse du roi',
            condition: { stat: 'int', min: 9 },
            effet: { drapeau: 'fresques-lues' },
            resultat: 'Les fresques montrent le sacre : la couronne d’Aldric fut forgée trop vite, fêlée dès le premier jour. Voilà une faiblesse à retenir. Vous longez ensuite le passage inondé.',
            suite: 'combat-noyes',
          },
          {
            texte: '🌊 Traverser le passage inondé',
            detail: 'L’eau est glaciale — elle prendra un peu de vos forces',
            effet: { pvPct: -0.1 },
            resultat: 'L’eau noire monte jusqu’à la taille. Quelque chose frôle vos jambes, deux fois. Vous ressortez transis de l’autre côté.',
            suite: 'combat-noyes',
          },
        ],
      },
      reserve: {
        type: 'tresor',
        titre: '⚱️ La réserve funéraire',
        texte: 'Des offrandes d’un autre âge : pièces frappées d’un profil oublié, fioles scellées à la cire.',
        effet: { po: 60, objets: { 'grande-potion-soin': 1, 'poussiere-spectre': 2 } },
        suite: 'combat-noyes',
      },
      'combat-noyes': {
        type: 'combat',
        intro: 'Deux silhouettes se dressent dans l’eau noire : les gardes du roi, noyés à leur poste, toujours en faction.',
        monstres: ['garde-noye', 'garde-noye'],
        suite: 'ossuaire',
      },
      ossuaire: {
        type: 'epreuve',
        qui: 'Narrateur', emoji: '💀',
        texte: 'La galerie suivante est un ossuaire : des centaines de crânes empilés du sol au plafond, et un silence qui vous regarde passer. Le couloir est étroit — un seul os qui roule, et tout l’étage se réveillera.',
        stat: 'dex', difficulte: 16,
        reussite: {
          texte: 'Pas à pas, souffle court, vous glissez entre les piles sans en effleurer une seule. Au passage, vos doigts trouvent une coupelle d’offrandes que les siècles avaient oubliée.',
          effet: { po: 40, objets: { 'poussiere-spectre': 1 } },
          suite: 'salle-vorn',
        },
        echec: {
          texte: 'Un talon accroche un fémur. Le cliquetis roule de pile en pile comme un rire — et l’ossuaire entier se lève pour vous saluer.',
          suite: 'combat-ossuaire',
        },
      },
      'combat-ossuaire': {
        type: 'combat',
        intro: 'Les gardes d’outre-tombe s’assemblent os par os, très contrariés d’être réveillés.',
        monstres: ['garde-outre-tombe', 'garde-outre-tombe'],
        suite: 'salle-vorn',
      },
      'salle-vorn': {
        type: 'choix',
        qui: 'Spectre de Vorn', emoji: '🌫️',
        texte: '« Encore un héros venu venger ce tyran ? Écoute d’abord : Aldric affamait les Plaines pour dorer sa crypte. Je l’ai tué pour ça — et je le referais. Alors, frappe… ou aide-moi à finir ce que j’ai commencé. »',
        options: [
          {
            texte: '⚔️ « Traître un jour, traître toujours. » — l’affronter',
            detail: 'Le spectre de Vorn ne se laissera pas faire',
            suite: 'combat-vorn',
          },
          {
            texte: '🕊️ « La haine vous cloue ici tous les deux. Renonce, et je le ferai renoncer. »',
            detail: 'Épargner Vorn — il retiendra le bras du roi au moment décisif',
            effet: { drapeau: 'vorn-epargne', pvPct: 0.1 },
            resultat: 'Le spectre vous fixe un long moment. « …Personne ne m’avait jamais rien proposé d’autre que l’acier. Va. Quand le roi lèvera son sceptre, je serai là. » Une chaleur étrange vous traverse.',
            suite: 'fontaine',
          },
        ],
      },
      'combat-vorn': {
        type: 'combat',
        intro: 'Le spectre de Vorn se déploie comme un drap qu’on secoue. « Alors tu as choisi le camp du tyran ! »',
        monstres: ['spectre-vorn'],
        suite: 'fontaine',
      },
      fontaine: {
        type: 'tresor',
        titre: '⛲ La fontaine des ablutions',
        texte: 'Une source souterraine chante encore dans la salle des ablutions royales. L’eau y est d’une pureté irréelle : le groupe s’y refait une santé.',
        effet: { pvPct: 0.35, mpPct: 0.5 },
        suite: 'pont-effondre',
      },
      'pont-effondre': {
        type: 'epreuve',
        qui: 'Narrateur', emoji: '🌉',
        texte: 'Entre vous et la salle du trône, le pont des funérailles s’est effondré : il n’en reste qu’une poutre de marbre suspendue au-dessus d’un gouffre où chante de l’eau noire.',
        stat: 'dex', difficulte: 16,
        reussite: {
          texte: 'Bras écartés, un pied devant l’autre, vous traversez la poutre comme un funambule de cour. Sur la corniche d’en face, une cache royale n’attendait que vous.',
          effet: { po: 50, objets: { 'grande-potion-soin': 1 } },
          suite: 'avant-boss',
        },
        echec: {
          texte: 'La poutre roule sous un pied. La chute est courte, l’eau est glaciale, et la remontée interminable — mais tout le monde est là.',
          effet: { pvPct: -0.12 },
          suite: 'avant-boss',
        },
      },
      'avant-boss': {
        type: 'dialogue',
        scenes: [
          { qui: 'Écho d’Aldric', emoji: '👻', texte: '« Il est là, derrière ces portes. Mon corps, ma couronne, ma colère. Je ne peux pas retenir ses coups — mais toi, tu peux les arrêter. Rends-moi le silence. »' },
        ],
        suite: 'boss',
      },
      boss: {
        type: 'boss',
        intro: 'Sur le trône de marbre, un cadavre couronné ouvre des yeux de braise. Aldric le Déchu se lève — et la crypte entière retient son souffle.',
        monstre: 'roi-aldric',
        modificateurs: [
          { drapeau: 'fresques-lues', hpMult: 0.9, annonce: '📖 Vous visez la fêlure de la couronne apprise sur les fresques : le roi paraît déjà entamé !' },
          { drapeau: 'vorn-epargne', atkMult: 0.85, annonce: '🌫️ Le spectre de Vorn s’enroule autour du bras du roi et retient ses coups !' },
        ],
        suite: 'fin',
      },
      fin: {
        type: 'fin',
        variantes: [
          { drapeau: 'vorn-epargne', cle: 'reconcilies', texte: 'La couronne roule sur les dalles. Deux silhouettes se relèvent des décombres — le roi et son chancelier, face à face une dernière fois. « Tu m’as tué, Vorn. » « Tu l’avais mérité, Aldric. » Un silence. Puis, ensemble, presque un sourire : « …C’est vrai. » Ils s’effacent côte à côte, et la crypte, pour la première fois depuis des siècles, est simplement une tombe.' },
        ],
        texte: 'La couronne roule sur les dalles et le feu de ses yeux s’éteint. L’écho d’Aldric se penche sur son propre corps, longuement. « Le silence… enfin. » Il s’efface en vous laissant sa couronne — apaisée, comme lui. Quelque part dans la crypte, un autre spectre, lui, ne dira plus jamais rien.',
      },
    },
  },

  // ============================================================
  // 2. Le Laboratoire de Frivole — niv. 8+
  // ============================================================
  {
    id: 'laboratoire',
    nom: 'Le Laboratoire de Frivole',
    emoji: '🧪',
    niveauMin: 8,
    // Un laboratoire de mage se lit avant de se visiter — et la Forêt des
    // Murmures fournit la sève dont ses cuves ont besoin.
    acces: accesHistoire(8, 'int', {
      objets: { 'seve-ambree': 3 },
      bossZones: ['foret'],
    }),
    resume: 'Le mage Frivole n’a plus donné signe de vie depuis trois lunes. Son laboratoire, si : il gronde.',
    hautFait: 'donjon-laboratoire',
    depart: 'intro',
    recompenses: { xp: 560, po: 340, objet: 'fiole-des-merveilles', objets: { 'potion-supreme-soin': 2 } },
    etapes: {
      intro: {
        type: 'dialogue',
        scenes: [
          { qui: 'Narrateur', emoji: '📜', texte: 'La tour du mage Frivole penche un peu plus chaque année — mais cette nuit, elle fume par les fenêtres, et des lueurs vertes pulsent derrière les carreaux.' },
          { qui: 'Boulon', emoji: '🤖', texte: 'Un petit golem de cuivre vous ouvre, une clé anglaise à la main. « Oh. Des gens. Enfin. Je suis Boulon, assistant de laboratoire. Le maître a bu une de ses propres expériences il y a trois lunes. Depuis, il est… liquide. Et de mauvaise humeur. »' },
          { qui: 'Boulon', emoji: '🤖', texte: '« Il s’est réfugié dans la grande cuve, en haut. Tout ce qui traînait comme potion s’est réveillé en même temps. Montez, mais s’il vous plaît : ne buvez RIEN. Enfin… presque rien. »' },
        ],
        suite: 'vestibule',
      },
      vestibule: {
        type: 'combat',
        intro: 'Dans le vestibule, les expériences renversées ont pris vie : une gelée fluorescente rampe vers vous, flanquée d’un cobaye aux yeux rouges.',
        monstres: ['gelee-instable', 'cobaye-enrage'],
        suite: 'etagere',
      },
      etagere: {
        type: 'choix',
        qui: 'Boulon', emoji: '🤖',
        texte: 'Sur une étagère épargnée, une fiole irisée porte l’étiquette « N° 47 — PROMETTEUR ». Boulon se cache les yeux : « Le maître disait que la 47 était soit géniale, soit épouvantable. Il n’a jamais osé vérifier. »',
        options: [
          {
            texte: '🧪 Boire la fiole n° 47',
            detail: 'Soit géniale, soit épouvantable — c’est le principe',
            resultats: [
              { poids: 3, texte: 'Un goût de miel et d’orage. Une chaleur formidable vous parcourt : la n° 47 était GÉNIALE. (Vitalité retrouvée, et une étrange chance au bout des doigts.)', effet: { pvPct: 0.4, mpPct: 0.4, po: 80 }, suite: 'distillerie' },
              { poids: 2, texte: 'Un goût de chaussette et d’éclair. Votre peau vire au vert pomme pendant une minute — et vos jambes flageolent. La n° 47 était ÉPOUVANTABLE.', effet: { pvPct: -0.2, drapeau: 'teint-vert' }, suite: 'distillerie' },
            ],
          },
          {
            texte: '🚫 Reposer la fiole avec précaution',
            detail: 'Boulon a dit : ne rien boire',
            resultat: 'Vous reposez la fiole. Boulon souffle de soulagement — un vrai petit sifflet de bouilloire.',
            suite: 'distillerie',
          },
        ],
      },
      distillerie: {
        type: 'epreuve',
        qui: 'Boulon', emoji: '⚗️',
        texte: 'La distillerie. Des alambics gros comme des tonneaux rotent des vapeurs multicolores. « Ne respirez pas les roses, ne touchez pas les vertes, ne regardez pas les bleues, » énumère Boulon. « Le chemin sûr change toutes les dix secondes. Suivez-moi. Vite. »',
        stat: 'dex', difficulte: 19,
        reussite: {
          texte: 'Vous dansez entre les vapeurs sur les talons de Boulon. Au dernier passage, vous cueillez au vol une fiole qui flottait, tranquille, au-dessus d’un alambic.',
          effet: { po: 60, objets: { 'grande-potion-soin': 1 } },
          suite: 'cobayes',
        },
        echec: {
          texte: 'Une vapeur rose vous prend à la gorge — vous éternuez dans une vapeur verte, qui n’apprécie pas. L’explosion réveille tout ce qui dormait dans les cuves.',
          effet: { pvPct: -0.12 },
          suite: 'combat-distillerie',
        },
      },
      'combat-distillerie': {
        type: 'combat',
        intro: 'Deux flaques vives jaillissent des cuves renversées, bouillonnantes d’indignation.',
        monstres: ['flaque-vive', 'flaque-vive'],
        suite: 'cobayes',
      },
      cobayes: {
        type: 'choix',
        qui: 'Narrateur', emoji: '🐹',
        texte: 'La salle des cages. Des dizaines de cobayes — hamsters, crapauds, un flamant rose perplexe — vous regardent à travers les barreaux. Certains ont des étincelles dans les yeux. Les libérer fera du bruit… mais ils connaissent le maître mieux que personne.',
        options: [
          {
            texte: '🔓 Ouvrir toutes les cages',
            detail: 'Bruyant — mais les cobayes vous le revaudront face au maître',
            effet: { drapeau: 'cobayes-liberes' },
            resultat: 'Un vacarme de cavalcade et de plumes. Le flamant rose vous salue d’une patte solennelle avant de filer vers l’étage. Quelque chose vous dit que vous le reverrez au bon moment.',
            suite: 'combat-gardien',
          },
          {
            texte: '🤫 Passer sans un bruit',
            detail: 'Plus prudent — les cobayes resteront spectateurs',
            resultat: 'Vous traversez sur la pointe des pieds. Des dizaines de petits yeux brillants vous suivent en silence. L’un des crapauds semble déçu.',
            suite: 'combat-gardien',
          },
        ],
      },
      'combat-gardien': {
        type: 'combat',
        intro: 'Au pied de l’escalier de la cuve, deux gelées fusionnées montent la garde en glougloutant des menaces.',
        monstres: ['gelee-instable', 'gelee-instable'],
        suite: 'monte-charge',
      },
      'monte-charge': {
        type: 'epreuve',
        qui: 'Boulon', emoji: '🛗',
        texte: 'Le monte-charge de la tour pend de travers, retenu par une chaîne qui a connu de meilleurs siècles. « Le treuil est grippé, » diagnostique Boulon. « Il faudrait des bras. De vrais bras. Pas les miens — j’ai des bras décoratifs. »',
        stat: 'for', difficulte: 19,
        reussite: {
          texte: 'Vous empoignez le treuil et hissez la cabine à la force des épaules, étage après étage. Coincée sous la banquette : la réserve personnelle du maître.',
          effet: { po: 70, objets: { 'potion-supreme-mana': 1 } },
          suite: 'runes',
        },
        echec: {
          texte: 'La chaîne saute au deuxième étage. La cabine redescend « à vitesse pédagogique », commente Boulon — et vous montez finalement par l’escalier de service, qui compte neuf cents marches.',
          effet: { pvPct: -0.1 },
          suite: 'runes',
        },
      },
      runes: {
        type: 'choix',
        qui: 'Boulon', emoji: '🤖',
        texte: 'La porte de la grande cuve est verrouillée par un cercle de runes qui crépitent. « Piège de sécurité du maître, » chuchote Boulon. « On peut le désamorcer si on est très calé… ou le traverser en courant très vite. Je recommande “calé”. »',
        options: [
          {
            texte: '🧠 Désamorcer les runes',
            detail: 'Intelligence ≥ 12 — passage sans dégâts, et le mécanisme vous récompense',
            condition: { stat: 'int', min: 12 },
            effet: { po: 70, objets: { 'potion-supreme-mana': 1 } },
            resultat: 'Vous dénouez le cercle rune par rune, comme on défait une tresse. Le piège se rend avec dignité — et recrache même la caution : quelques pièces et une fiole que le maître y avait oubliées.',
            suite: 'avant-boss',
          },
          {
            texte: '🏃 Traverser en courant très vite',
            detail: 'Les runes mordront — mais c’est direct',
            effet: { pvPct: -0.15 },
            resultat: 'Vous piquez un sprint. Les runes vous mordent les mollets comme une meute de petits chiens électriques. De l’autre côté, Boulon compte vos membres : « …Tous là. Impressionnant. »',
            suite: 'avant-boss',
          },
        ],
      },
      'avant-boss': {
        type: 'dialogue',
        scenes: [
          { qui: 'Boulon', emoji: '🤖', texte: '« La cuve est droit devant. Le maître est là-dedans — enfin, ce qu’il en reste. S’il vous plaît : il est liquide, pas méchant. Enfin si, très méchant. Mais c’est la potion ! Ramenez-le, d’une manière ou d’une autre. »' },
        ],
        suite: 'boss',
      },
      boss: {
        type: 'boss',
        intro: 'La grande cuve explose. Ce qui en jaillit a des yeux de mage et un corps de mercure : la Chimère hurle avec la voix de Frivole — « JE SUIS PROMETTEUR ! »',
        monstre: 'chimere-mercure',
        modificateurs: [
          { drapeau: 'cobayes-liberes', hpMult: 0.85, annonce: '🐹 Les cobayes libérés déboulent et mordent la Chimère de toutes parts — le flamant rose vise les yeux !' },
        ],
        suite: 'fin',
      },
      fin: {
        type: 'fin',
        variantes: [
          { drapeau: 'cobayes-liberes', cle: 'sauve-par-les-cobayes', texte: 'La Chimère s’effondre en une flaque fumante… d’où émerge, nu comme un ver et furieux, le mage Frivole. Les cobayes lui font une ovation. « Oui, bon, ÇA VA, » grogne-t-il en s’enroulant dans un rideau. « Expérience concluante : la n° 46 rend liquide. Notez, Boulon. » Il vous tend une fiole : « Votre paiement. Celle-ci fonctionne. Probablement. »' },
          { drapeau: 'teint-vert', cle: 'teint-vert', texte: 'La Chimère s’effondre en une flaque fumante… d’où émerge, trempé et penaud, le mage Frivole. Il vous dévisage, s’arrête sur votre teinte encore vaguement pomme, et s’illumine : « Vous avez bu la 47 ! ET VOUS TENEZ DEBOUT ! » Il note fébrilement, puis vous tend votre paiement avec un respect nouveau. « Celle-ci fonctionne. Probablement. Vous, en tout cas, vous fonctionnez. »' },
        ],
        texte: 'La Chimère s’effondre en une flaque fumante… d’où émerge, trempé et penaud, le mage Frivole. « Trois lunes en flaque. J’ai eu le temps de réfléchir, » soupire-t-il pendant que Boulon lui apporte un peignoir. « Conclusion : je devrais tester sur les autres d’abord. Tenez — votre paiement. Celle-ci fonctionne. Probablement. »',
      },
    },
  },

  // ============================================================
  // 3. Le Brise-Brume — niv. 12+
  // ============================================================
  {
    id: 'brise-brume',
    nom: 'Le Brise-Brume',
    emoji: '⛵',
    niveauMin: 12,
    // Un navire fantôme dans le marais : il faut du coffre, du lotus noir
    // contre les vapeurs, et l'Hydre des brumes déjà couchée.
    acces: accesHistoire(12, 'vit', {
      objets: { 'lotus-noir': 2 },
      bossZones: ['marais'],
    }),
    resume: 'Un navire fantôme s’est échoué dans le Marais Putride. Son équipage n’a pas remarqué qu’il était mort.',
    hautFait: 'donjon-brise-brume',
    depart: 'intro',
    recompenses: { xp: 1100, po: 700, objet: 'sabre-du-capitaine' },
    etapes: {
      intro: {
        type: 'dialogue',
        scenes: [
          { qui: 'Narrateur', emoji: '📜', texte: 'Les pêcheurs du Marais en parlaient comme d’une légende : le Brise-Brume, trois-mâts corsaire disparu il y a cent ans. Il est là, pourtant — échoué de travers dans la vase, ses voiles en lambeaux gonflées par un vent qui n’existe pas.' },
          { qui: 'Maëlle', emoji: '🧜‍♀️', texte: 'Dans le nid-de-pie, une silhouette translucide vous héle : « Ohé, du marais ! Je suis Maëlle, vigie de ce rafiot. Cent ans que je crie “Terre !” sans que personne n’écoute. Le capitaine Morvane a vendu nos âmes à la brume pour échapper à une tempête — et la brume nous garde. »' },
          { qui: 'Maëlle', emoji: '🧜‍♀️', texte: '« Son pacte est gravé sur son sabre. Brisez le sabre, brisez le pacte. Mais montez armés : l’équipage défend son capitaine, et le capitaine défend son trésor. »' },
        ],
        suite: 'coupee',
      },
      coupee: {
        type: 'choix',
        qui: 'Narrateur', emoji: '⛵',
        texte: 'La coupée pend le long de la coque. Deux chemins : la cale, dont les hublots laissent deviner des coffres — et des ombres. Ou le pont supérieur, où l’équipage spectral s’affaire à des manœuvres fantômes.',
        options: [
          {
            texte: '📦 Fouiller la cale au trésor',
            detail: 'Le butin du corsaire — mais les ombres veillent',
            effet: { drapeau: 'cale-fouillee' },
            suite: 'combat-cale',
          },
          {
            texte: '🪜 Monter droit au pont supérieur',
            detail: 'Le chemin direct vers le capitaine',
            resultat: 'Vous grimpez la coupée en évitant les planches pourries. Le pont grince sous des pas qui ne sont pas les vôtres.',
            suite: 'pont',
          },
        ],
      },
      'combat-cale': {
        type: 'combat',
        intro: 'Entre les coffres, la brume elle-même a pris faim et forme. Elle n’aime pas qu’on touche au trésor.',
        monstres: ['brume-affamee', 'matelot-spectral'],
        suite: 'tresor-cale',
      },
      'tresor-cale': {
        type: 'tresor',
        titre: '💰 Le trésor du corsaire',
        texte: 'Trois coffres cerclés de fer, gorgés de pièces vertes de vase — et une réserve de fioles qui ont miraculeusement traversé le siècle.',
        effet: { po: 220, objets: { 'elixir-vie': 1, 'lotus-noir': 2 } },
        suite: 'pont',
      },
      pont: {
        type: 'combat',
        intro: 'L’équipage vous a vus. Un matelot spectral abandonne son cordage imaginaire et dégaine un crochet très réel.',
        monstres: ['matelot-spectral', 'matelot-spectral'],
        suite: 'journal-de-bord',
      },
      'journal-de-bord': {
        type: 'epreuve',
        qui: 'Maëlle', emoji: '📔',
        texte: 'Dans la cabine de veille, le journal de bord du Brise-Brume attend, gonflé d’humidité. « Le pacte y est retranscrit, » souffle Maëlle. « Mais Morvane l’a rédigé en code corsaire — et le code corsaire a été inventé par des gens qui ne savaient pas écrire. »',
        stat: 'int', difficulte: 21,
        reussite: {
          texte: 'Ligne à ligne, le code cède. Le pacte exige que le sabre reste « chargé de la peur de l’équipage » : un capitaine flatté, rassuré, tiendra une lame affaiblie. Voilà qui servira.',
          effet: { drapeau: 'pacte-compris' },
          suite: 'mat',
        },
        echec: {
          texte: 'Les pages détrempées se déchirent sous vos doigts — et la brume, jalouse de ses secrets, se coule dans la cabine par la serrure.',
          suite: 'combat-cabine',
        },
      },
      'combat-cabine': {
        type: 'combat',
        intro: 'La brume affamée s’engouffre, flanquée d’un mousse spectral qui n’a pas grandi en cent ans.',
        monstres: ['brume-affamee', 'mousse-spectral'],
        suite: 'mat',
      },
      mat: {
        type: 'choix',
        qui: 'Maëlle', emoji: '🧜‍♀️',
        texte: '« Le capitaine ne montera sur le gaillard d’arrière que si le navire est “en état de naviguer”, » souffle Maëlle depuis son mât. « Hissez ses couleurs et il paradera au lieu de se méfier. Le pavillon est au sommet du grand mât. Le mât est pourri. Bonne chance. »',
        options: [
          {
            texte: '🧗 Grimper hisser le pavillon noir',
            detail: 'Dextérité ≥ 14 — Morvane paradera, sabre baissé',
            condition: { stat: 'dex', min: 14 },
            effet: { drapeau: 'pavillon-hisse' },
            resultat: 'Le mât proteste à chaque prise, mais vous dansez plus vite qu’il ne casse. Le pavillon noir claque au vent mort. En bas, une voix caverneuse s’exclame, presque émue : « Voilà qui est mieux ! »',
            suite: 'promesse',
          },
          {
            texte: '🚪 Ignorer le mât et enfoncer la porte du gaillard',
            detail: 'Direct — mais Morvane vous attendra de pied ferme',
            resultat: 'Vous laissez le pavillon à son sort. La porte du gaillard d’arrière cède sous votre épaule — et derrière, quelqu’un ricane dans la brume.',
            suite: 'promesse',
          },
        ],
      },
      promesse: {
        type: 'choix',
        qui: 'Maëlle', emoji: '🧜‍♀️',
        texte: 'Maëlle descend en vol plané et se pose devant vous, soudain grave. « Avant que vous n’entriez : quand le sabre sera brisé, la brume voudra une âme pour solde de tout compte. La mienne fera l’affaire — j’ai eu cent ans pour me préparer. À moins que… vous ne connaissiez un autre moyen. »',
        options: [
          {
            texte: '🤝 « Personne ne paiera. Je briserai le sabre ET le compte. »',
            detail: 'Promettre de sauver aussi Maëlle — il faudra frapper plus fort',
            effet: { drapeau: 'promesse-maelle' },
            resultat: 'Maëlle vous regarde comme si vous étiez le premier lever de soleil en cent ans. « …Capitaine, » dit-elle en vous saluant. Ce n’était pas une erreur de personne.',
            suite: 'tempete',
          },
          {
            texte: '💰 « Marché conclu. Ton âme contre la liberté des autres. »',
            detail: 'Accepter son sacrifice — le plus sûr',
            resultat: 'Maëlle hoche la tête, très droite. « Cent ans de “Terre !” dans le vide. Au moins, ce cri-là aura servi. » Elle vous ouvre la voie.',
            suite: 'tempete',
          },
        ],
      },
      tempete: {
        type: 'epreuve',
        qui: 'Narrateur', emoji: '🌩️',
        texte: 'Au moment où vous approchez du gaillard d’arrière, le navire revit sa dernière nuit : la tempête fantôme se lève, voiles hurlantes, pont debout. Il faut tenir la barre — ou être balayés par un souvenir.',
        stat: 'for', difficulte: 21,
        reussite: {
          texte: 'Vous vous arrimez à la barre et tenez le cap au cœur de la mémoire de la tempête. Quand elle s’apaise, l’équipage spectral vous regarde autrement : comme un des leurs.',
          effet: { pvPct: 0.1 },
          suite: 'boss',
        },
        echec: {
          texte: 'La barre vous échappe et la tempête fantôme vous roule d’un bastingage à l’autre. Elle finit par se lasser — les tempêtes mortes se lassent vite.',
          effet: { pvPct: -0.12 },
          suite: 'boss',
        },
      },
      boss: {
        type: 'boss',
        intro: 'Le capitaine Morvane se retourne, tricorne bas, sourire vert. « Des passagers clandestins ? Parfait. La brume avait justement un creux. »',
        monstre: 'capitaine-morvane',
        modificateurs: [
          { drapeau: 'pavillon-hisse', atkMult: 0.85, annonce: '🏴‍☠️ Morvane parade sous ses couleurs retrouvées — son sabre traîne, sa garde aussi !' },
          { drapeau: 'pacte-compris', hpMult: 0.9, annonce: '📔 Vous connaissez le pacte gravé sur le sabre : chaque coup vise le fil de l’écriture !' },
        ],
        suite: 'fin',
      },
      fin: {
        type: 'fin',
        variantes: [
          { drapeau: 'promesse-maelle', cle: 'tous-libres', texte: 'Le sabre se brise sur le pont. La brume s’engouffre en hurlant, cherche son dû — et vous vous dressez en travers, tenant les deux moitiés de la lame comme un ultime marché. La brume hésite… puis se retire, bredouille et vexée. L’équipage s’élève dans le petit matin, Morvane en tête, qui vous rend un salut de capitaine à capitaine. Maëlle est la dernière à partir. « Terre, » dit-elle doucement. Et cette fois, tout le monde a entendu.' },
          { drapeau: 'cale-fouillee', cle: 'cale-fouillee', texte: 'Le sabre se brise sur le pont. La brume s’engouffre en hurlant pour réclamer son dû, et Maëlle s’avance, très droite. « Terre, » dit-elle — et la brume l’emporte en libérant tout le reste. Morvane s’efface le dernier, non sans un coup d’œil vers la cale ouverte et vos poches pleines. « Au moins, » souffle-t-il, presque amusé, « mon trésor finira sur la terre ferme. C’est tout ce qu’il voulait. » Sur le nid-de-pie vide, le vent, par habitude, crie encore un peu.' },
        ],
        texte: 'Le sabre se brise sur le pont. La brume s’engouffre en hurlant pour réclamer son dû, et Maëlle s’avance, très droite, sans un regard en arrière. « Terre, » dit-elle — et la brume l’emporte avec elle en libérant tout le reste. L’équipage s’élève dans le petit matin, Morvane en tête, qui laisse son sabre brisé à vos pieds. Sur le nid-de-pie vide, le vent, par habitude, crie encore un peu.',
      },
    },
  },

  // ============================================================
  // 4. Le Cœur du Volcan — niv. 16+
  // ============================================================
  {
    id: 'volcan',
    nom: 'Le Cœur du Volcan',
    emoji: '🌋',
    niveauMin: 34,
    // La Forge première ne s'ouvre pas à qui n'a jamais tenu un marteau :
    // de la Force, du feu, la Steppe des Cendres domptée — et un vrai mineur.
    acces: accesHistoire(34, 'for', {
      objets: { 'coeur-de-braise': 2 },
      bossZones: ['steppe-cendres'],
      metier: { id: 'mineur', niveau: 3 },
    }),
    resume: 'Sous la Steppe des Cendres brûle la Forge première, gardée par le dernier des forgerons géants.',
    hautFait: 'donjon-volcan',
    depart: 'intro',
    familier: 'salamandre-de-forge',
    recompenses: {
      xp: 2200, po: 1400,
      objet: 'lame-de-la-derniere-cendre',
      objetParDrapeau: { 'forge-ravivee': 'marteau-de-la-forge-eternelle' },
    },
    etapes: {
      intro: {
        type: 'dialogue',
        scenes: [
          { qui: 'Narrateur', emoji: '📜', texte: 'La Steppe des Cendres couve depuis toujours, mais ce soir elle fait autre chose : elle bat. Un pouls sourd, minéral, qui monte des profondeurs. Les nains de Cuivre ont une expression pour ça : « la Forge rêve ». Ils ajoutent en général : « fuyez ».' },
          { qui: 'Barguzan', emoji: '🗿', texte: 'À l’entrée de la caldeira, un géant de pierre grise est assis, un marteau grand comme un chêne posé sur les genoux. « Je suis Barguzan, dernier apprenti de la Forge première. Mon maître, Ignarok, en était le Cœur. Mille ans sans personne à qui forger… ça l’a rendu fou. Il veut faire éruption et “forger le monde à neuf”. »' },
          { qui: 'Barguzan', emoji: '🗿', texte: '« Je suis trop vieux pour l’arrêter, trop fidèle pour l’aider. Descendez. Au fond, il faudra choisir ce que devient la Forge — et mon maître avec. Je respecterai votre choix. C’est plus que ce que je peux dire de lui. »' },
        ],
        suite: 'pont-basalte',
      },
      'pont-basalte': {
        type: 'choix',
        qui: 'Narrateur', emoji: '🌉',
        texte: 'La caldeira s’ouvre sous vos pieds. Un pont de basalte enjambe le lac de lave — fissuré, fumant, mais direct. Sur la gauche, une corniche serpente : plus longue, plus sûre… et gardée.',
        options: [
          {
            texte: '🌉 Traverser le pont de basalte au pas de course',
            detail: 'Vitalité ≥ 16 — la chaleur est un mur, mais c’est direct',
            condition: { stat: 'vit', min: 16 },
            resultat: 'Le pont claque et fume sous vos semelles. Vous traversez dans une fournaise blanche, poumons en feu — mais entiers, et avec une longueur d’avance.',
            suite: 'enigme',
          },
          {
            texte: '🪨 Prendre la corniche gardée',
            detail: 'Plus sûr pour le corps — mais les gardiens de pierre veillent',
            suite: 'combat-corniche',
          },
        ],
      },
      'combat-corniche': {
        type: 'combat',
        intro: 'Deux golems de basalte se détachent de la paroi — littéralement. La corniche est leur ronde depuis mille ans.',
        monstres: ['golem-basalte', 'golem-basalte'],
        suite: 'enigme',
      },
      enigme: {
        type: 'choix',
        qui: 'Le Gardien gravé', emoji: '🪨',
        texte: 'Une porte de pierre barre le tunnel, un visage gravé en son centre. Il ouvre des paupières de granit : « DEVINETTE DU MAÎTRE. Fils du feu, je dors dans la pierre ; l’air me fige, l’eau me brise. Qui suis-je ? »',
        options: [
          {
            texte: '🌋 « Le magma. »',
            detail: 'Répondre à l’énigme',
            effet: { drapeau: 'enigme-resolue', po: 200, objets: { 'ecaille-draconique': 1 } },
            resultat: '« EXACT, » tonne la porte, presque déçue. Elle pivote en dévoilant une niche d’offrandes : le péage des visiteurs moins perspicaces, qui vous revient de droit.',
            suite: 'geysers',
          },
          {
            texte: '🔥 « L’étincelle. »',
            detail: 'Répondre à l’énigme',
            resultat: '« FAUX, » tonne la porte. « L’ÉTINCELLE NAÎT DU CHOC, PAS DU FEU. RÉVISEZ. » Le sol s’ouvre poliment sous vos pieds : direction la salle des golems, par le toboggan.',
            suite: 'combat-golems',
          },
          {
            texte: '🌫️ « La cendre. »',
            detail: 'Répondre à l’énigme',
            resultat: '« FAUX, » tonne la porte. « LA CENDRE EST MON CADAVRE. C’EST VEXANT. » Le sol s’ouvre poliment sous vos pieds : direction la salle des golems, par le toboggan.',
            suite: 'combat-golems',
          },
        ],
      },
      'combat-golems': {
        type: 'combat',
        intro: 'Vous atterrissez dans une salle ronde où deux golems correcteurs vous attendent, bras croisés. La pédagogie du maître est directe.',
        monstres: ['golem-basalte', 'elementaire-magma'],
        suite: 'geysers',
      },
      geysers: {
        type: 'epreuve',
        qui: 'Narrateur', emoji: '💨',
        texte: 'Le champ de geysers. Le sol siffle, crache, se tait — puis recommence, jamais dans le même ordre. Barguzan le traverse en trois enjambées de géant et vous attend de l’autre côté, poliment.',
        stat: 'dex', difficulte: 24,
        reussite: {
          texte: 'Vous lisez le sol comme une partition : deux pas, pause, trois pas, saut. Le dernier geyser fuse dans votre dos, vexé. Dans une vasque refroidie, une écaille attendait depuis mille ans.',
          effet: { po: 150, objets: { 'ecaille-draconique': 1 } },
          suite: 'atelier',
        },
        echec: {
          texte: 'Le sol se tait un instant de trop — vous y croyez, et il n’attendait que ça. Le jet vous ébouillante les mollets et vous dépose, fumants, aux pieds de Barguzan.',
          effet: { pvPct: -0.15 },
          suite: 'atelier',
        },
      },
      atelier: {
        type: 'choix',
        qui: 'Barguzan', emoji: '🗿',
        texte: 'L’ancien atelier de Barguzan. Le géant vous y a devancés par un passage de géant. « Ma dernière œuvre attend sur l’enclume : une bénédiction de forgeron, à marteler dans vos armes. Je peux le faire — mais chaque coup de marteau dira à Ignarok exactement où nous sommes. »',
        options: [
          {
            texte: '🔨 Accepter la bénédiction du forgeron',
            detail: 'Vos armes mordront le magma — et Ignarok vous attendra',
            effet: { drapeau: 'benediction-forgeron' },
            resultat: 'Barguzan frappe trois coups qui font trembler la montagne. Vos armes ressortent de l’enclume avec un reflet de braise qui ne s’éteint pas. Au loin, le pouls du volcan change de rythme : il sait.',
            suite: 'memoire-du-maitre',
          },
          {
            texte: '🤫 Refuser — garder l’effet de surprise',
            detail: 'Ignarok ne vous verra pas venir : premier sang assuré',
            effet: { drapeau: 'surprise', pvPct: 0.2 },
            resultat: 'Barguzan repose son marteau avec un respect nouveau. « La discrétion. Mon maître n’en a jamais forgé. » Il vous offre à la place une gourde d’eau de source gardée froide dans la pierre — un luxe inouï, ici.',
            suite: 'memoire-du-maitre',
          },
        ],
      },
      'memoire-du-maitre': {
        type: 'epreuve',
        qui: 'Barguzan', emoji: '📚',
        texte: 'Avant l’arche, Barguzan tire d’une niche un livre de plaques de cuivre : les carnets de forge d’Ignarok. « Mille ans de coups de marteau, tous notés. Son rythme est là-dedans. Qui sait le lire saura quand il frappe — et quand il respire. »',
        stat: 'int', difficulte: 24,
        reussite: {
          texte: 'Les plaques chantent sous vos doigts : trois coups lourds, un temps, deux coups courts. Le rythme du maître est en vous — vous saurez exactement quand baisser la tête.',
          effet: { drapeau: 'rythme-connu' },
          suite: 'avant-boss',
        },
        echec: {
          texte: 'Les notations de forge géante vous restent closes — mille ans de métier ne se lisent pas en une veillée. Barguzan range les carnets sans un mot de reproche. C’est pire.',
          effet: { mpPct: -0.15 },
          suite: 'avant-boss',
        },
      },
      'avant-boss': {
        type: 'dialogue',
        scenes: [
          { qui: 'Barguzan', emoji: '🗿', texte: '« Derrière cette arche bat le Cœur. Souvenez-vous : quand il tombera, la Forge vous demandera un choix. La raviver — un nouveau Cœur, un nouveau départ. Ou l’éteindre — plus jamais de Forge, plus jamais de folie. Mon maître aurait voulu qu’on choisisse pour de bonnes raisons. Alors choisissez pour de bonnes raisons. »' },
        ],
        suite: 'boss',
      },
      boss: {
        type: 'boss',
        intro: 'La salle du Cœur est une cathédrale de lave. Au centre, une silhouette colossale de magma et d’obsidienne se retourne — deux yeux blancs comme l’acier en fusion. « DE LA MATIÈRE PREMIÈRE, » gronde Ignarok. « ENFIN. »',
        monstre: 'ignarok',
        modificateurs: [
          { drapeau: 'benediction-forgeron', hpMult: 0.85, annonce: '🔨 La bénédiction de Barguzan mord le magma : chaque entaille reste béante — Ignarok paraît déjà entamé !' },
          { drapeau: 'surprise', atkMult: 0.9, annonce: '🤫 Ignarok ne vous avait pas vus venir : il frappe encore à contretemps !' },
          { drapeau: 'rythme-connu', atkMult: 0.9, annonce: '📚 Trois coups lourds, un temps : vous connaissez le rythme du maître et esquivez avant même qu’il frappe !' },
        ],
        suite: 'choix-forge',
      },
      'choix-forge': {
        type: 'choix',
        qui: 'La Forge première', emoji: '🌋',
        texte: 'Ignarok s’effondre en fragments de verre noir. Le silence dure trois battements — puis la Forge elle-même vous parle, une voix de braises sous la cendre : « MON CŒUR EST MORT. CHOISIS, CHAMPION : UN CŒUR NOUVEAU… OU LE REPOS. »',
        options: [
          {
            texte: '🔥 Raviver la Forge — un cœur nouveau',
            detail: 'Barguzan deviendra le Cœur. La Forge chantera à nouveau. (Récompense : le Marteau de la Forge éternelle)',
            effet: { drapeau: 'forge-ravivee' },
            suite: 'fin',
          },
          {
            texte: '🌑 Éteindre la Forge — le repos, pour toujours',
            detail: 'Plus jamais de Forge, plus jamais de folie. (Récompense : la Lame de la Dernière Cendre)',
            effet: { drapeau: 'forge-eteinte' },
            suite: 'fin',
          },
        ],
      },
      fin: {
        type: 'fin',
        variantes: [
          { drapeau: 'forge-ravivee', cle: 'forge-ravivee', texte: 'Barguzan s’avance sans un mot et pose les deux mains sur l’enclume première. La lave l’enveloppe comme un manteau — et quand elle retombe, ses yeux sont deux braises calmes. « Je forgerai mieux que lui, » dit le nouveau Cœur du volcan. Sa première œuvre est pour vous : un marteau qui chante en frappant. Dans la Steppe, désormais, le pouls de la terre a le rythme tranquille d’un artisan au travail.' },
          { drapeau: 'forge-eteinte', cle: 'forge-eteinte', texte: 'Vous laissez la Forge s’éteindre. La lave se fige en un lac de verre noir, si calme qu’on y voit les étoiles par le cratère. Barguzan trempe une dernière lame dans le dernier feu — la vôtre. « Mille ans que je n’avais pas eu froid, » dit-il en souriant pour la première fois. « C’est une sensation d’avenir. » Il descendra à Valciel, dit-il. Ouvrir une échoppe. Forger des charrues.' },
        ],
        texte: 'Le Cœur du volcan s’est tu, et la montagne attend de savoir ce qu’elle deviendra.',
      },
    },
  },
];

// =====================================================================
// Donjons des Terres lointaines (v10) : pensés pour l'équipe.
// =====================================================================
// Un objet de donjon ne doit JAMAIS écraser un objet déjà au catalogue.
// C'est arrivé : la série d'artisanat « du Firmament » engendre une pièce
// d'id `lame-du-firmament`… l'id exact de la récompense de la Couronne
// Céleste, définie ci-dessous. L'artisanat se charge AVANT ce fichier,
// son garde-fou ne pouvait donc pas voir la collision — et l'arc du
// donjon remplaçait silencieusement la lame de la série (recette
// comprise : l'atelier forgeait l'objet exclusif de l'épopée).
//
// Le garde-fou vit désormais des deux côtés : ici, toute collision
// re-identifie la pièce EXISTANTE en `craft-<id>` (avec sa recette),
// puisque l'id historique des sauvegardes des joueurs — celui qui a
// toujours été rendu à l'écran — est l'objet de donjon.
function declarerObjetsDonjons(objets) {
  Object.keys(objets).forEach((id) => {
    if (!OBJETS[id]) return;
    const nouvelId = `craft-${id}`;
    OBJETS[nouvelId] = OBJETS[id];
    if (typeof RECETTES !== 'undefined') {
      RECETTES.forEach((r) => { if (r.resultat === id) r.resultat = nouvelId; });
    }
  });
  Object.assign(OBJETS, objets);
}

declarerObjetsDonjons({
  'trident-des-profondeurs': {
    nom: 'Trident des Profondeurs', emoji: '🔱', type: 'equipement', slot: 'arme', familleArme: 'lame', niveau: 28,
    rarete: 'legendaire', prixVente: 900, bonus: { for: 16, int: 8, crit: 4 },
    desc: 'L’arme de la Gardienne, rendue à la surface. Récompense du Sanctuaire des Marées.',
  },
  'sceptre-de-l-archonte': {
    nom: 'Sceptre de l’Archonte', emoji: '🌠', type: 'equipement', slot: 'arme', familleArme: 'baton', niveau: 46,
    rarete: 'divin', prixVente: 2600, bonus: { int: 26, pmMax: 40, cha: 6 },
    desc: 'Le pouvoir de poser une citadelle comme on pose une plume. Récompense de la Couronne Céleste.',
  },
  'lame-du-firmament': {
    nom: 'Lame du Firmament', emoji: '🌌', type: 'equipement', slot: 'arme', familleArme: 'arc', niveau: 46,
    rarete: 'divin', prixVente: 2600, bonus: { dex: 20, for: 12, crit: 10 },
    desc: 'Forgée dans la pluie d’étoiles d’un trône brisé. Récompense de la Couronne Céleste.',
  },
});

// Les autres lots d'objets de donjon passent par le même garde-fou.

Object.assign(MONSTRES_DONJONS, {
  // ----- Le Sanctuaire des Marées (niv. 25-30) -----
  'pelerin-noye': {
    nom: 'Pèlerin noyé', emoji: '🧎', niveau: 26, hp: 443, atk: 42, dex: 8, xp: 230, po: [26, 52],
    drops: [{ id: 'nacre-abyssale', chance: 0.3 }],
    attaques: [
      { nom: 'Étreinte suppliante', emoji: '🙏', mult: 1.0, poids: 3, type: 'mono' },
      { nom: 'Psaume inversé', emoji: '🌊', mult: 0.8, poids: 1, type: 'aoe', effet: { type: 'affaibli', duree: 2 } },
    ],
  },
  'garde-corail': {
    nom: 'Garde de corail', emoji: '🪸', niveau: 28, hp: 510, atk: 45, dex: 9, xp: 265, po: [28, 56],
    drops: [{ id: 'corail-sanglant', chance: 0.35 }],
    attaques: [
      { nom: 'Hallebarde incrustée', emoji: '🔱', mult: 1.15, poids: 3, type: 'mono' },
      { nom: 'Éclats de récif', emoji: '🪸', mult: 0.85, poids: 1, type: 'aoe' },
    ],
  },
  'oracle-corrompu': {
    nom: 'Oracle corrompu', emoji: '🐙', niveau: 29, hp: 546, atk: 46, dex: 10, xp: 283, po: [29, 58],
    drops: [{ id: 'larme-de-sirene', chance: 0.25 }],
    attaques: [
      { nom: 'Prophétie amère', emoji: '🔮', mult: 1.05, poids: 2, type: 'mono', effet: { type: 'poison', degats: 14, duree: 2 } },
      { nom: 'Marée intérieure', emoji: '💙', valeur: 58, poids: 1, type: 'soin' },
    ],
  },
  'gardienne-des-marees': {
    nom: 'Gardienne des Marées', emoji: '🌊', niveau: 30, boss: true, hp: 2444, atk: 59, dex: 11, xp: 1510, po: [180, 300],
    drops: [{ id: 'larme-de-sirene', chance: 1 }, { id: 'nacre-abyssale', chance: 0.9 }],
    attaques: [
      { nom: 'Trident du jugement', emoji: '🔱', mult: 1.2, poids: 3, type: 'mono' },
      { nom: 'Lame de fond', emoji: '🌊', mult: 0.85, poids: 1, type: 'aoe' },
    ],
    mecaniques: {
      phases: [
        {
          seuil: 0.65,
          annonce: '🐚 « Venez, mes fidèles ! » — la marée dépose des serviteurs sur le parvis !',
          invoque: ['pelerin-noye', 'pelerin-noye'],
        },
        {
          seuil: 0.35,
          annonce: '🌊 La Gardienne devient marée : l’eau frappe de partout !',
          atkMult: 1.35,
          attaques: [
            { nom: 'Déferlante sacrée', emoji: '🌊', mult: 0.95, poids: 2, type: 'aoe' },
            { nom: 'Trident du jugement', emoji: '🔱', mult: 1.25, poids: 2, type: 'mono' },
          ],
        },
      ],
      enrage: { manche: 10, atkMult: 1.6, annonce: '⚠️ Le Sanctuaire tout entier se met à gronder : la Gardienne n’attendra plus !' },
    },
  },

  // ----- La Couronne Céleste (niv. 42-50, équipe) -----
  'sentinelle-de-la-couronne': {
    nom: 'Sentinelle de la Couronne', emoji: '⚙️', niveau: 44, hp: 1836, atk: 68, dex: 9, xp: 634, po: [44, 88],
    drops: [{ id: 'acier-celeste', chance: 0.35 }],
    attaques: [
      { nom: 'Glaive de protocole', emoji: '⚙️', mult: 1.15, poids: 3, type: 'mono' },
      { nom: 'Balayage de sécurité', emoji: '📡', mult: 0.85, poids: 1, type: 'aoe' },
    ],
  },
  'choeur-d-echos': {
    nom: 'Chœur d’échos', emoji: '🎭', niveau: 46, hp: 1998, atk: 71, dex: 12, xp: 691, po: [46, 92],
    drops: [{ id: 'eclat-d-etoile', chance: 0.3 }],
    attaques: [
      { nom: 'Dissonance', emoji: '🎭', mult: 1.05, poids: 2, type: 'mono', effet: { type: 'affaibli', duree: 2 } },
      { nom: 'Hymne restaurateur', emoji: '💙', valeur: 96, poids: 1, type: 'soin' },
    ],
  },
  'executeur-astral': {
    nom: 'Exécuteur astral', emoji: '⚖️', niveau: 48, hp: 2183, atk: 74, dex: 11, xp: 751, po: [48, 96],
    drops: [{ id: 'plume-d-archon', chance: 0.15 }],
    attaques: [
      { nom: 'Verdict stellaire', emoji: '⚖️', mult: 1.25, poids: 3, type: 'mono' },
      { nom: 'Sentence collective', emoji: '✨', mult: 0.85, poids: 1, type: 'aoe', effet: { type: 'etourdi', duree: 1, chance: 0.2 } },
    ],
  },
  'eclat-d-archonte': {
    nom: 'Éclat d’Archonte', emoji: '💫', niveau: 44, hp: 980, atk: 60, dex: 12, xp: 240, po: [15, 30],
    drops: [],
    attaques: [
      { nom: 'Scintillement blessant', emoji: '💫', mult: 1.0, poids: 1, type: 'mono' },
    ],
  },
  'archonte-dechu': {
    nom: 'L’Archonte Déchu', emoji: '👑', niveau: 50, boss: true, hp: 9916, atk: 96, dex: 12, xp: 4070, po: [350, 550],
    drops: [{ id: 'plume-d-archon', chance: 1 }, { id: 'essence-primordiale', chance: 0.6 }],
    attaques: [
      { nom: 'Sceptre du zénith', emoji: '🌠', mult: 1.2, poids: 3, type: 'mono' },
      { nom: 'Chute d’étoiles', emoji: '☄️', mult: 0.9, poids: 1, type: 'aoe' },
    ],
    mecaniques: {
      invocations: {
        toutesLes: 3, max: 4, monstres: ['eclat-d-archonte', 'eclat-d-archonte'],
        annonce: '👑 L’Archonte arrache des éclats de sa propre couronne — ils prennent vie !',
      },
      phases: [
        {
          seuil: 0.7,
          annonce: '🛡️ L’Archonte s’enveloppe du firmament : un rempart d’étoiles l’entoure !',
          bouclier: 400,
        },
        {
          seuil: 0.4,
          annonce: '🌌 « ASSEZ. » — la salle du trône bascule dans le vide, les étoiles pleuvent !',
          atkMult: 1.35,
          attaques: [
            { nom: 'Pluie de firmament', emoji: '🌌', mult: 0.95, poids: 2, type: 'aoe' },
            { nom: 'Sceptre du zénith', emoji: '🌠', mult: 1.3, poids: 2, type: 'mono' },
          ],
        },
        {
          seuil: 0.15,
          annonce: '💥 La couronne de l’Archonte se fissure : sa fureur est totale !',
          atkMult: 1.2,
        },
      ],
      enrage: { manche: 12, atkMult: 1.7, annonce: '⚠️ La citadelle amorce sa chute : l’Archonte frappe comme une fin du monde !' },
    },
  },
});

// =====================================================================
// v22 — LE GABARIT DES VERROUS D'UNE HISTOIRE.
//
// Chroniques et Épopées passent désormais par la même porte. Un récit
// déclare la caractéristique qui lui va, les trophées et les matériaux
// qu'il exige ; le reste — le seuil de cette caractéristique, la
// puissance, le nombre de pièces portées — se déduit de son palier.
// Rééquilibrer le jeu réajuste donc tous les verrous d'un coup.
// =====================================================================
function accesHistoire(palier, stat, extras = {}) {
  return {
    stat: stat || null,          // la caractéristique du récit (voir verrousDonjon)
    objets: extras.objets || {},
    bossZones: extras.bossZones || [],
    donjons: extras.donjons || [],
    puissance: extras.puissance != null ? extras.puissance : 0.7,
    equipement: extras.equipement != null ? extras.equipement
      : (palier < 20 ? 4 : (palier < 50 ? 6 : 8)),
    metier: extras.metier || null,
  };
}

DONJONS.push(
  // ============================================================
  // 5. Le Sanctuaire des Marées — niv. 25+ (équipe conseillée)
  // ============================================================
  {
    id: 'sanctuaire',
    nom: 'Le Sanctuaire des Marées',
    emoji: '🌊',
    niveauMin: 25,
    // La Gardienne des Marées écoute avant de frapper : de l'Esprit, et
    // les deux premières terres lointaines déjà matées.
    acces: accesHistoire(25, 'esp', {
      objets: { 'plume-de-rokh': 2 },
      bossZones: ['jungle-vai', 'falaises-hurlantes'],
    }),
    resume: 'La cité engloutie d’Azuria se réveille — et sa Gardienne veut rendre la mer à la surface. Toute la mer. Équipe conseillée.',
    hautFait: 'donjon-sanctuaire',
    depart: 'intro',
    familier: 'ondin-de-poche',
    recompenses: { xp: 4200, po: 2600, objet: 'trident-des-profondeurs' },
    etapes: {
      intro: {
        type: 'dialogue',
        scenes: [
          { qui: 'Narrateur', emoji: '📜', texte: 'Depuis une lune, la marée monte chaque nuit un peu plus haut — et redescend chaque matin un peu moins. Les pêcheurs des Abysses parlent d’une lumière verte sous l’eau, et de cloches qui sonnent à l’envers.' },
          { qui: 'Nérée', emoji: '🐚', texte: 'Sur la grève vous attend une femme aux cheveux d’algues, un coquillage contre l’oreille. « Je suis Nérée, dernière oracle d’Azuria. Ma cité s’est engloutie il y a un siècle pour échapper à une peste — et ma sœur, la Gardienne, devait nous endormir tous. Elle a veillé seule. Cent ans. »' },
          { qui: 'Nérée', emoji: '🐚', texte: '« La solitude l’a rongée. Elle a décidé que si Azuria ne pouvait pas remonter… c’est la surface qui descendrait. Le Sanctuaire est réveillé, les marées lui obéissent. Descendez avec moi. Raisonnez-la — ou arrêtez-la. »' },
        ],
        suite: 'parvis',
      },
      parvis: {
        type: 'combat',
        intro: 'Le parvis du Sanctuaire luit d’une clarté verte. Ses gardes de corail n’ont pas dormi non plus.',
        monstres: ['garde-corail', 'garde-corail', 'pelerin-noye'],
        suite: 'courant',
      },
      courant: {
        type: 'epreuve',
        qui: 'Nérée', emoji: '🌀',
        texte: 'Le grand couloir des processions est devenu un fleuve : le Sanctuaire inspire, et tout ce qui flotte descend vers ses poumons. « Nagez contre le courant, » crie Nérée. « Et surtout, ne vous laissez pas avaler par la salle de garde ! »',
        stat: 'vit', difficulte: 28,
        reussite: {
          texte: 'Brasse après brasse, vous remontez le souffle du Sanctuaire. Dans un remous tourbillonne une bourse d’offrandes — vous la cueillez au passage.',
          effet: { po: 300 },
          suite: 'autel',
        },
        echec: {
          texte: 'Le courant gagne. Il vous roule, vous retourne et vous recrache — précisément dans la salle de garde, comme Nérée l’avait prédit.',
          suite: 'combat-ressac',
        },
      },
      'combat-ressac': {
        type: 'combat',
        intro: 'La salle de garde. Les sentinelles du ressac vous regardent tomber du plafond avec un intérêt professionnel.',
        monstres: ['garde-corail', 'pelerin-noye', 'pelerin-noye'],
        suite: 'autel',
      },
      autel: {
        type: 'choix',
        qui: 'Nérée', emoji: '🐚',
        texte: 'La grande salle des offrandes. Au centre, l’autel des marées pulse comme un cœur — c’est lui qui aspire l’océan. « On peut le purifier, si l’on connaît les rites, » souffle Nérée. « Ou le briser. C’est moins élégant. C’est aussi plus définitif. »',
        options: [
          {
            texte: '🧠 Purifier l’autel par les rites anciens',
            detail: 'Intelligence ≥ 20 — la marée s’apaise, la Gardienne s’affaiblit',
            condition: { stat: 'int', min: 20 },
            effet: { drapeau: 'autel-purifie' },
            resultat: 'Vous récitez les rites que Nérée vous souffle. L’autel s’éteint doucement, comme une bougie qu’on borde. Quelque part au-dessous, quelque chose perd la moitié de sa colère.',
            suite: 'nef',
          },
          {
            texte: '💪 Briser l’autel d’un grand coup',
            detail: 'Force ≥ 20 — efficace, mais le Sanctuaire va le sentir',
            condition: { stat: 'for', min: 20 },
            effet: { drapeau: 'autel-brise', pvPct: -0.1 },
            resultat: 'L’autel éclate en mille coquillages. Le Sanctuaire entier frémit — et la vague de retour vous roule contre les colonnes. Efficace, oui. Discret, non.',
            suite: 'nef',
          },
          {
            texte: '🚶 Contourner l’autel sans y toucher',
            detail: 'Prudent — mais la marée continuera de monter pendant le combat final',
            resultat: 'Vous laissez l’autel à son battement. Nérée serre son coquillage un peu plus fort.',
            suite: 'nef',
          },
        ],
      },
      nef: {
        type: 'choix',
        qui: 'Narrateur', emoji: '🌊',
        texte: 'Dans la nef engloutie, des dizaines de pèlerins flottent entre deux eaux — noyés, mais pas morts : le Sanctuaire les garde en sommeil. Certains ouvrent des yeux suppliants sur votre passage. Les réveiller prendra du temps et fera du bruit.',
        options: [
          {
            texte: '🤲 Réveiller les pèlerins un à un',
            detail: 'Un combat de plus — mais leur gratitude pèsera face à la Gardienne',
            effet: { drapeau: 'pelerins-sauves' },
            suite: 'combat-nef',
          },
          {
            texte: '🤫 Traverser la nef sans les toucher',
            detail: 'Ils dorment depuis un siècle, ils peuvent attendre une heure de plus',
            resultat: 'Vous nagez entre les dormeurs comme entre des statues. L’un d’eux vous suit longtemps du regard.',
            suite: 'fontaine-sacree',
          },
        ],
      },
      'combat-nef': {
        type: 'combat',
        intro: 'Les premiers pèlerins réveillés paniquent — et le Sanctuaire envoie son oracle corrompu rétablir le silence.',
        monstres: ['oracle-corrompu', 'pelerin-noye', 'pelerin-noye'],
        suite: 'fontaine-sacree',
      },
      'fontaine-sacree': {
        type: 'tresor',
        titre: '⛲ La fontaine d’Azuria',
        texte: 'Une source d’eau douce jaillit encore au cœur de la cité salée — le trésor le mieux gardé d’Azuria. Le groupe s’y refait entièrement.',
        effet: { pvPct: 0.5, mpPct: 0.6, po: 400, objets: { 'potion-supreme-soin': 2 } },
        suite: 'orgue-de-nacre',
      },
      'orgue-de-nacre': {
        type: 'epreuve',
        qui: 'Nérée', emoji: '🎼',
        texte: 'Devant les portes du trône : l’orgue de nacre d’Azuria, dont les tuyaux sont des coquillages centenaires. « Ma sœur aimait un chant, avant, » murmure Nérée. « Je me souviens des notes… mais plus de l’ordre. Tentez votre chance. Au pire, l’orgue improvisera. »',
        stat: 'cha', difficulte: 28,
        reussite: {
          texte: 'Vos mains trouvent, par un bonheur insolent, l’ordre exact que la mémoire de Nérée cherchait. Le chant de la Gardienne monte dans la cité engloutie — et derrière les portes, un trident se baisse à demi.',
          effet: { drapeau: 'chant-retrouve' },
          suite: 'avant-boss',
        },
        echec: {
          texte: 'L’orgue improvise. C’est… expérimental. Les coquillages hurlent un accord que la mer mettra cent ans à pardonner, et l’écho vous vrille les tempes.',
          effet: { mpPct: -0.15 },
          suite: 'avant-boss',
        },
      },
      'avant-boss': {
        type: 'dialogue',
        scenes: [
          { qui: 'Nérée', emoji: '🐚', texte: '« Elle est là, derrière les grandes portes. Ma sœur. Cent ans de garde, cent ans de silence — et nous qui dormions, bien au chaud dans nos rêves. Si une partie d’elle peut être sauvée, je la reconnaîtrai. Sinon… » Elle pose son coquillage. « Sinon, frappez juste. »' },
        ],
        suite: 'boss',
      },
      boss: {
        type: 'boss',
        intro: 'La salle du trône marin. La Gardienne des Marées se dresse, trident en main, l’océan entier retenu dans son dos comme une cape. « Vous dormiez. J’ai veillé. Maintenant, TOUT LE MONDE dormira sous la mer. »',
        monstre: 'gardienne-des-marees',
        modificateurs: [
          { drapeau: 'autel-purifie', hpMult: 0.85, annonce: '🕯️ L’autel purifié ne nourrit plus la Gardienne : la marée lui manque, elle paraît déjà entamée !' },
          { drapeau: 'autel-brise', atkMult: 0.85, annonce: '💥 Sans son autel, les vagues de la Gardienne frappent à contretemps !' },
          { drapeau: 'pelerins-sauves', atkMult: 0.9, annonce: '🤲 Les pèlerins réveillés chantent depuis la nef : la Gardienne hésite à chaque coup !' },
          { drapeau: 'chant-retrouve', atkMult: 0.9, annonce: '🎼 Le chant d’autrefois flotte encore dans la salle : le trident de la Gardienne tremble entre deux coups !' },
        ],
        suite: 'fin',
      },
      fin: {
        type: 'fin',
        variantes: [
          { drapeau: 'pelerins-sauves', cle: 'soeurs-reunies', texte: 'Le trident tombe. La Gardienne s’effondre — et le chant des pèlerins la rattrape avant le fond. Dans la lumière verte, Nérée prend sa sœur dans ses bras. « Tu as veillé. Nous, maintenant. » Azuria se rendort, mais cette fois quelqu’un borde la Gardienne, et les marées de la surface redeviennent de simples marées. Sur la grève, Nérée vous tend le trident : « Elle aurait voulu qu’il serve à protéger. Enfin. »' },
        ],
        texte: 'Le trident tombe, et la mer retenue dans le dos de la Gardienne se retire en un long soupir. Nérée reste un moment près du corps de sa sœur, puis remonte avec vous sans un mot. Sur la grève, elle vous met le trident dans les mains. « Cent ans de garde méritaient une meilleure fin. Faites-en une meilleure suite. » Les marées, cette nuit-là, redescendent enfin.',
      },
    },
  },

  // ============================================================
  // 6. La Couronne Céleste — niv. 42+ (équipe fortement conseillée)
  // ============================================================
  {
    id: 'couronne-celeste',
    nom: 'La Couronne Céleste',
    emoji: '👑',
    niveauMin: 42,
    // Une citadelle d'Archontes qui tombe du ciel : on n'y monte pas sans
    // comprendre ce qu'on lit, ni sans avoir vidé les deux terres
    // d'équipe — la Forêt Pétrifiée et la Vallée des Géants.
    acces: accesHistoire(42, 'int', {
      objets: { 'sphere-runique': 2, 'relique-antique': 2 },
      bossZones: ['foret-petrifiee', 'vallee-geants'],
    }),
    resume: 'La citadelle des Archontes tombe du ciel — droit sur Valciel. Il faudra une équipe entière pour atteindre la salle du trône.',
    hautFait: 'donjon-couronne',
    depart: 'intro',
    familier: 'griffonneau-celeste',
    recompenses: {
      xp: 11000, po: 7000,
      objet: 'sceptre-de-l-archonte',
      objetParDrapeau: { 'trone-brise': 'lame-du-firmament' },
    },
    etapes: {
      intro: {
        type: 'dialogue',
        scenes: [
          { qui: 'Narrateur', emoji: '📜', texte: 'Elle est apparue au-dessus des Royaumes il y a neuf jours : la Couronne Céleste, citadelle des Archontes disparus, sortie des légendes — et de son orbite. Chaque nuit, elle descend. Les astronomes ont cessé de publier leurs calculs. Les gens ont compris pourquoi.' },
          { qui: 'Céleste-Écho', emoji: '✨', texte: 'Quand vous posez le pied sur le premier escalier de nuage, une voix s’allume autour de vous, polie et fatiguée : « Bienvenue. Je suis l’Écho de la citadelle — sa mémoire, sa voix, son inventaire. Mon dernier maître refuse de mourir avec élégance. Il a débranché tout ce qui nous maintenait en vol. »' },
          { qui: 'Céleste-Écho', emoji: '✨', texte: '« Impact estimé : le Bourg de Valciel, dans trois jours. Vous voulez monter jusqu’au trône, je suppose ? Ils veulent tous ça. Les autres sont dans l’escalier ouest. Enfin, ce qu’il en reste. Suivez-moi — et soyez nombreux, la citadelle ne fait pas de quartier. »' },
        ],
        suite: 'esplanade',
      },
      esplanade: {
        type: 'combat',
        intro: 'L’esplanade d’embarquement. Les sentinelles de la Couronne appliquent la dernière consigne reçue : « plus aucun visiteur ».',
        monstres: ['sentinelle-de-la-couronne', 'sentinelle-de-la-couronne', 'choeur-d-echos'],
        suite: 'pont-de-nuages',
      },
      'pont-de-nuages': {
        type: 'epreuve',
        qui: 'Céleste-Écho', emoji: '☁️',
        texte: 'Le pont qui mène aux Archives se dématérialise par plaques — la citadelle recycle sa propre substance pour retarder la chute. « Il tiendra, » assure l’Écho. « Statistiquement. Par endroits. Courez selon un motif imprévisible, c’est ma meilleure recommandation. »',
        stat: 'dex', difficulte: 36,
        reussite: {
          texte: 'Vous courez sur des nuages qui cessent d’exister une demi-seconde après votre passage. Sur la dernière plaque, un fragment d’acier céleste s’était détaché du garde-corps — il est pour vous.',
          effet: { objets: { 'acier-celeste': 2 } },
          suite: 'archives',
        },
        echec: {
          texte: 'Une plaque ment. La chute traverse trois étages de brume — et vous dépose dans la soute, où la sécurité de la citadelle vous attendait déjà.',
          suite: 'combat-soute',
        },
      },
      'combat-soute': {
        type: 'combat',
        intro: 'La soute aux étoiles. Une sentinelle s’avance, escortée d’éclats qui grésillent comme des guêpes de lumière.',
        monstres: ['sentinelle-de-la-couronne', 'eclat-d-archonte', 'eclat-d-archonte'],
        suite: 'archives',
      },
      archives: {
        type: 'choix',
        qui: 'Céleste-Écho', emoji: '✨',
        texte: 'Les Archives du firmament : des kilomètres de constellations en bocaux. « Les protocoles de vol sont là-dedans, » indique l’Écho. « Si quelqu’un parmi vous sait lire le ciel, on peut ralentir la chute. Sinon on peut aussi… soulever le plancher. Les Archontes cachaient toujours des choses sous les planchers. »',
        options: [
          {
            texte: '🧠 Recalculer les protocoles de vol',
            detail: 'Intelligence ≥ 28 — la citadelle ralentit, l’Archonte s’affaiblit',
            condition: { stat: 'int', min: 28 },
            effet: { drapeau: 'protocoles-restaures' },
            resultat: 'Vous réalignez les constellations une à une. Sous vos pieds, la citadelle cesse de trembler — pas sauvée, mais moins pressée de mourir. « Trente heures de gagnées, » souffle l’Écho. « Il va le sentir passer. »',
            suite: 'grand-escalier',
          },
          {
            texte: '💪 Soulever le plancher des Archives',
            detail: 'Force ≥ 28 — le trésor caché des Archontes',
            condition: { stat: 'for', min: 28 },
            suite: 'cache-archontes',
          },
          {
            texte: '🏃 Filer droit vers le trône',
            detail: 'Le temps presse — trois jours, dont deux entamés',
            resultat: 'Vous laissez les bocaux d’étoiles à leur poussière. L’Écho note quelque chose dans un registre invisible : « Pragmatiques. Il détestait ça. Parfait. »',
            suite: 'grand-escalier',
          },
        ],
      },
      'cache-archontes': {
        type: 'tresor',
        titre: '🗝️ La cache sous les Archives',
        texte: 'Sous le plancher : la paie de mille ans de serviteurs célestes, jamais réclamée. L’Écho détourne pudiquement ses capteurs.',
        effet: { po: 1500, objets: { 'acier-celeste': 3, 'potion-supreme-soin': 2, 'elixir-titan': 1 } },
        suite: 'grand-escalier',
      },
      'grand-escalier': {
        type: 'combat',
        intro: 'Le Grand Escalier hélicoïdal. L’Exécuteur astral y rend une dernière justice : la sienne.',
        monstres: ['executeur-astral', 'choeur-d-echos', 'sentinelle-de-la-couronne'],
        suite: 'antichambre',
      },
      antichambre: {
        type: 'choix',
        qui: 'Céleste-Écho', emoji: '✨',
        texte: 'L’antichambre du trône. L’Écho baisse la voix, ce qui, pour une citadelle, est troublant. « Avant d’entrer : je peux couper mes propres défenses dans la salle du trône. Il le saura immédiatement — c’est comme lui arracher un gant. Ou je reste silencieuse, et vous gardez l’effet de surprise. Choisissez pour moi, je n’ai jamais su. »',
        options: [
          {
            texte: '⚙️ « Coupe ses défenses. Assume le bruit. »',
            detail: 'L’Archonte perd son rempart d’étoiles plus vite',
            effet: { drapeau: 'defenses-coupees' },
            resultat: 'Un frisson parcourt les murs — la citadelle retient son souffle. Quelque part au-dessus, une voix immense cesse de fredonner. « Il sait, » dit l’Écho. « Et pour la première fois en mille ans… il a peur. »',
            suite: 'noyau-gravite',
          },
          {
            texte: '🤫 « Reste silencieuse. On entre sans prévenir. »',
            detail: 'Premier sang assuré : l’Archonte frappera à contretemps',
            effet: { drapeau: 'entree-silencieuse' },
            resultat: 'L’Écho s’éteint jusqu’à n’être qu’une veilleuse. Vous poussez les portes du trône dans un silence de fin du monde.',
            suite: 'noyau-gravite',
          },
        ],
      },
      'noyau-gravite': {
        type: 'epreuve',
        qui: 'Céleste-Écho', emoji: '🌀',
        texte: 'Dernier obstacle : la salle du noyau de gravité, que l’Archonte a déréglé. Le haut et le bas y changent d’avis plusieurs fois par minute. « Traversez entre deux inversions, » conseille l’Écho. « Et quoi qu’il arrive : ne vomissez pas sur les consoles. »',
        stat: 'vit', difficulte: 36,
        reussite: {
          texte: 'Vous traversez la salle en marchant tour à tour sur le sol, le mur et le plafond, l’estomac tenu par la seule volonté. Au passage, vous redressez une console — qui vous remercie en pièces sonnantes.',
          effet: { po: 1200 },
          suite: 'avant-boss',
        },
        echec: {
          texte: 'La gravité change d’avis à mi-parcours — deux fois, dans des directions différentes. Vous finissez la traversée en roulant. La citadelle a la délicatesse de ne pas commenter.',
          effet: { pvPct: -0.12 },
          suite: 'avant-boss',
        },
      },
      'avant-boss': {
        type: 'dialogue',
        scenes: [
          { qui: 'Céleste-Écho', emoji: '✨', texte: '« Une dernière chose. Quand il tombera — et il tombera, vous êtes du genre têtu — le trône vous demandera un ordre. Le briser, et la citadelle se dispersera en pluie d’étoiles, inoffensive et magnifique. Ou s’y asseoir un instant, et la poser en douceur, quelque part où elle ne blessera personne. Les deux sont des fins honorables. J’aimerais juste… être prévenue. »' },
        ],
        suite: 'boss',
      },
      boss: {
        type: 'boss',
        intro: 'La salle du trône est un ciel intérieur. Sur le trône d’aurore, l’Archonte Déchu ouvre des yeux comme des éclipses. « Mille ans que je fais tenir le ciel. Il tombera AVEC moi. »',
        monstre: 'archonte-dechu',
        modificateurs: [
          { drapeau: 'protocoles-restaures', hpMult: 0.85, annonce: '📐 Les protocoles restaurés drainent le pouvoir de l’Archonte : il paraît déjà entamé !' },
          { drapeau: 'defenses-coupees', hpMult: 0.9, annonce: '⚙️ L’Écho a coupé les défenses : le rempart d’étoiles de l’Archonte est fissuré d’avance !' },
          { drapeau: 'entree-silencieuse', atkMult: 0.9, annonce: '🤫 L’Archonte ne vous avait pas entendus entrer : il frappe à contretemps !' },
        ],
        suite: 'choix-trone',
      },
      'choix-trone': {
        type: 'choix',
        qui: 'Le Trône d’aurore', emoji: '👑',
        texte: 'L’Archonte se dissout en poussière d’aube. Le trône, lui, s’illumine — et sa lumière vous cherche. Une voix sans âge, ni la citadelle ni son maître, demande simplement : « QUELLE FIN ? »',
        options: [
          {
            texte: '⚔️ Briser le trône — pluie d’étoiles',
            detail: 'La Couronne se disperse, inoffensive et sublime. (Récompense : la Lame du Firmament)',
            effet: { drapeau: 'trone-brise' },
            suite: 'fin',
          },
          {
            texte: '🪑 S’asseoir un instant — la poser en douceur',
            detail: 'La citadelle atterrit, vide et paisible. (Récompense : le Sceptre de l’Archonte)',
            effet: { drapeau: 'trone-pose' },
            suite: 'fin',
          },
        ],
      },
      fin: {
        type: 'fin',
        variantes: [
          { drapeau: 'trone-brise', cle: 'pluie-d-etoiles', texte: 'Vous frappez le trône en son cœur. La Couronne Céleste s’ouvre comme une main qui lâche prise — et pendant toute une nuit, il pleut des étoiles sur les Royaumes, lentes et froides, inoffensives. Les enfants de Valciel en garderont des poignées dans des bocaux. Dans la dernière lueur, l’Écho murmure : « C’était la bonne fin. Merci de m’avoir prévenue. » De la pluie d’étoiles, les forgerons tireront une lame — la vôtre.' },
          { drapeau: 'trone-pose', cle: 'atterrissage', texte: 'Vous vous asseyez. Un instant seulement — mais dans cet instant, vous ÊTES la citadelle : ses mille salles, ses courants d’air, sa fatigue immense. Vous la posez dans le désert d’Ambrezine comme on pose un vieux chien devant la cheminée. L’Écho reste avec elle, veilleuse d’une ruine paisible que les caravanes appelleront bientôt « l’Auberge du Ciel ». Le sceptre, lui, reste dans votre main. Il a choisi.' },
        ],
        texte: 'La Couronne Céleste ne menace plus personne, et le ciel des Royaumes a retrouvé son calme.',
      },
    },
  },
);

// =====================================================================
// Les Défis de la Fin (v12) : trois donjons « hard » de niveaux 50/60/70,
// enchaînés — chacun exige d'avoir terminé le précédent. Pensés pour des
// équipes complètes au niveau maximum.
// =====================================================================
declarerObjetsDonjons({
  'linceul-de-nihelm': {
    nom: 'Linceul de Nihelm', emoji: '🕳️', type: 'equipement', slot: 'torse', niveau: 53,
    rarete: 'divin', prixVente: 3369, bonus: { vit: 23, for: 11, pvMax: 126, deter: 6 },
    desc: 'Tissé dans l’ombre de tous les monstres vaincus. Il pèse exactement le poids d’une conscience tranquille.',
  },
  'couronne-des-heures': {
    nom: 'Couronne des Heures', emoji: '⏰', type: 'equipement', slot: 'tete', niveau: 60,
    rarete: 'divin', prixVente: 4232, bonus: { int: 24, dex: 14, pmMax: 59, celerite: 7 },
    desc: 'Chaque pointe est une aiguille arrêtée sur un instant parfait. Récompense de la Forteresse du Temps Brisé.',
  },
  'coeur-du-neant': {
    nom: 'Cœur du Néant', emoji: '🖤', type: 'equipement', slot: 'arme', familleArme: 'runique', niveau: 88,
    rarete: 'divin', prixVente: 7502, bonus: { for: 43, int: 43, crit: 17 },
    desc: 'Ce qui restait de Celui-qui-Attend, dévoré et forgé. Il bat encore, très lentement.',
  },
  'sceau-de-l-aube': {
    nom: 'Sceau de l’Aube', emoji: '🌅', type: 'equipement', slot: 'accessoire', niveau: 88,
    rarete: 'divin', prixVente: 7502, bonus: { cha: 20, vit: 23, pvMax: 150, celerite: 8 },
    desc: 'La marque de qui a refermé l’Œil sans le regarder mourir. Le matin lui obéit un peu.',
  },
});

Object.assign(MONSTRES_DONJONS, {
  // ----- Le Gouffre de Nihelm (défi 50) -----
  'ombre-de-heros': {
    nom: 'Ombre de héros', emoji: '👤', niveau: 52, hp: 2550, atk: 79, dex: 14, xp: 387, po: [52, 104],
    drops: [{ id: 'essence-primordiale', chance: 0.1 }],
    attaques: [
      { nom: 'Lame retournée', emoji: '🗡️', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Frappe miroir', emoji: '🪞', mult: 1.3, poids: 1, type: 'mono' },
    ],
  },
  'deuil-rampant': {
    nom: 'Deuil rampant', emoji: '🕷️', niveau: 53, hp: 2648, atk: 81, dex: 10, xp: 437, po: [53, 106],
    drops: [{ id: 'poussiere-spectre', chance: 0.5 }],
    attaques: [
      { nom: 'Morsure de chagrin', emoji: '🕷️', mult: 1.0, poids: 3, type: 'mono', effet: { type: 'poison', degats: 22, duree: 2 } },
      { nom: 'Toile de regrets', emoji: '🕸️', mult: 0.8, poids: 1, type: 'aoe', effet: { type: 'affaibli', duree: 2 } },
    ],
  },
  'porteur-de-cendres': {
    nom: 'Porteur de cendres', emoji: '⚱️', niveau: 54, hp: 2748, atk: 82, dex: 11, xp: 491, po: [54, 108],
    drops: [{ id: 'os-ancien', chance: 0.45 }],
    attaques: [
      { nom: 'Urne brisée', emoji: '⚱️', mult: 1.15, poids: 3, type: 'mono' },
      { nom: 'Nuée funèbre', emoji: '🌫️', mult: 0.85, poids: 1, type: 'aoe' },
    ],
  },
  'avatar-de-nihelm': {
    nom: 'L’Avatar de Nihelm', emoji: '🕳️', niveau: 55, boss: true, hp: 11950, atk: 105, dex: 13, xp: 4368, po: [400, 600],
    drops: [{ id: 'essence-primordiale', chance: 1 }, { id: 'poussiere-spectre', chance: 1 }],
    attaques: [
      { nom: 'Poigne du gouffre', emoji: '🕳️', mult: 1.2, poids: 3, type: 'mono' },
      { nom: 'Marée d’ombres', emoji: '🌑', mult: 0.9, poids: 1, type: 'aoe' },
    ],
    mecaniques: {
      invocations: {
        toutesLes: 4, max: 4, monstres: ['ombre-de-heros'],
        annonce: '🕳️ Le gouffre recrache une ombre de plus — elle a vos gestes, vos coups, votre garde !',
      },
      phases: [
        {
          seuil: 0.7,
          annonce: '🌑 L’Avatar se drape de toutes les nuits du gouffre : un linceul d’ombre l’enveloppe !',
          bouclier: 500,
        },
        {
          seuil: 0.4,
          annonce: '💢 L’Avatar prend le visage de chaque monstre que vous avez vaincu — tous frappent à travers lui !',
          atkMult: 1.4,
          attaques: [
            { nom: 'Mille rancunes', emoji: '💢', mult: 0.95, poids: 2, type: 'aoe' },
            { nom: 'Poigne du gouffre', emoji: '🕳️', mult: 1.3, poids: 2, type: 'mono' },
          ],
        },
      ],
      enrage: { manche: 12, atkMult: 1.7, annonce: '⚠️ Le gouffre entier se referme comme une mâchoire : Nihelm veut en finir !' },
    },
  },

  // ----- La Forteresse du Temps Brisé (défi 60) -----
  'sentinelle-des-heures': {
    nom: 'Sentinelle des heures', emoji: '⏳', niveau: 60, hp: 3384, atk: 91, dex: 12, xp: 1166, po: [60, 120],
    drops: [{ id: 'eclat-d-etoile', chance: 0.3 }],
    attaques: [
      { nom: 'Hallebarde-aiguille', emoji: '🕰️', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Seconde volée', emoji: '⏳', mult: 0.9, poids: 1, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.25 } },
    ],
  },
  'regret-devorant': {
    nom: 'Regret dévorant', emoji: '🫥', niveau: 61, hp: 3497, atk: 92, dex: 11, xp: 1205, po: [61, 122],
    drops: [{ id: 'larme-de-sirene', chance: 0.3 }],
    attaques: [
      { nom: 'Si-seulement', emoji: '🫥', mult: 1.05, poids: 2, type: 'mono', effet: { type: 'affaibli', duree: 2 } },
      { nom: 'Rembobinage', emoji: '⏪', valeur: 220, poids: 1, type: 'soin' },
    ],
  },
  'paradoxe-arme': {
    nom: 'Paradoxe armé', emoji: '🌀', niveau: 62, hp: 3611, atk: 94, dex: 15, xp: 1244, po: [62, 124],
    drops: [{ id: 'coeur-d-orage', chance: 0.3 }],
    attaques: [
      { nom: 'Coup déjà porté', emoji: '🌀', mult: 1.2, poids: 3, type: 'mono' },
      { nom: 'Onde causale', emoji: '💫', mult: 0.85, poids: 1, type: 'aoe' },
    ],
  },
  'grand-horloger': {
    nom: 'Le Grand Horloger', emoji: '⏰', niveau: 62, boss: true, hp: 15150, atk: 117, dex: 14, xp: 6220, po: [500, 750],
    drops: [{ id: 'essence-primordiale', chance: 1 }, { id: 'eclat-d-etoile', chance: 1 }],
    attaques: [
      { nom: 'Balancier de bronze', emoji: '⏰', mult: 1.2, poids: 3, type: 'mono' },
      { nom: 'Douzième coup', emoji: '🕛', mult: 0.9, poids: 1, type: 'aoe' },
    ],
    mecaniques: {
      invocations: {
        toutesLes: 4, max: 4, monstres: ['paradoxe-arme'],
        annonce: '⏰ L’Horloger rembobine un instant : un paradoxe armé se produit — au sens propre !',
      },
      phases: [
        {
          seuil: 0.75,
          annonce: '🕰️ « REPRENONS DEPUIS LE DÉBUT. » — l’Horloger rappelle ses gardes d’une heure passée !',
          invoque: ['sentinelle-des-heures', 'sentinelle-des-heures'],
        },
        {
          seuil: 0.45,
          annonce: '⚡ Le balancier s’emballe : l’Horloger vit trois secondes dans chacune des vôtres !',
          atkMult: 1.35,
          attaques: [
            { nom: 'Grêle de secondes', emoji: '⚡', mult: 0.95, poids: 2, type: 'aoe' },
            { nom: 'Balancier de bronze', emoji: '⏰', mult: 1.3, poids: 2, type: 'mono' },
          ],
        },
        {
          seuil: 0.2,
          annonce: '🛡️ L’Horloger fige sa dernière minute autour de lui comme une armure !',
          bouclier: 600,
        },
      ],
      enrage: { manche: 12, atkMult: 1.7, annonce: '⚠️ Minuit approche : l’Horloger frappe tous les coups à la fois !' },
    },
  },

  // ----- L'Œil du Néant (défi 70) -----
  'annonciateur-du-neant': {
    nom: 'Annonciateur du Néant', emoji: '🌑', niveau: 86, hp: 6768, atk: 128, dex: 14, xp: 7604, po: [103, 206],
    drops: [{ id: 'essence-primordiale', chance: 0.25 }],
    attaques: [
      { nom: 'Verbe d’effacement', emoji: '🌑', mult: 1.15, poids: 3, type: 'mono' },
      { nom: 'Prêche du vide', emoji: '📿', mult: 0.85, poids: 1, type: 'aoe', effet: { type: 'affaibli', duree: 2 } },
    ],
  },
  'mange-etoiles': {
    nom: 'Mange-étoiles', emoji: '🐋', niveau: 87, hp: 6988, atk: 130, dex: 12, xp: 8548, po: [105, 210],
    drops: [{ id: 'eclat-d-etoile', chance: 0.6 }],
    attaques: [
      { nom: 'Gober la lumière', emoji: '🐋', mult: 1.3, poids: 2, type: 'mono' },
      { nom: 'Remous de constellations', emoji: '✨', mult: 0.9, poids: 1, type: 'aoe' },
    ],
  },
  'echo-du-devoreur': {
    nom: 'Écho du Dévoreur', emoji: '💫', niveau: 86, hp: 3389, atk: 115, dex: 15, xp: 7604, po: [29, 59],
    drops: [],
    attaques: [
      { nom: 'Réplique du vide', emoji: '💫', mult: 1.0, poids: 1, type: 'mono' },
    ],
  },
  'celui-qui-attend': {
    nom: 'Celui-qui-Attend', emoji: '👁️', niveau: 88, boss: true, hp: 30188, atk: 155, dex: 15, xp: 76312, po: [1036, 1480],
    drops: [{ id: 'essence-primordiale', chance: 1 }, { id: 'plume-d-archon', chance: 0.8 }],
    attaques: [
      { nom: 'Regard qui défait', emoji: '👁️', mult: 1.2, poids: 3, type: 'mono' },
      { nom: 'Battement de cil', emoji: '🌌', mult: 0.9, poids: 1, type: 'aoe' },
    ],
    mecaniques: {
      invocations: {
        toutesLes: 3, max: 4, monstres: ['echo-du-devoreur', 'echo-du-devoreur'],
        annonce: '👁️ L’Œil cligne — et chaque larme devient un écho du Dévoreur !',
      },
      phases: [
        {
          seuil: 0.8,
          annonce: '🌌 Celui-qui-Attend replie le vide autour de lui : un rempart de non-existence !',
          bouclier: 800,
        },
        {
          seuil: 0.55,
          annonce: '🌑 L’Œil s’ouvre en grand : le Néant regarde chacun de vous, personnellement !',
          atkMult: 1.3,
          attaques: [
            { nom: 'Regard total', emoji: '👁️', mult: 1.3, poids: 2, type: 'mono' },
            { nom: 'Effacement latéral', emoji: '🌌', mult: 0.95, poids: 2, type: 'aoe' },
          ],
        },
        {
          seuil: 0.25,
          annonce: '💥 Pour la première fois depuis l’aube des mondes… Celui-qui-Attend est pressé !',
          atkMult: 1.25,
        },
      ],
      enrage: { manche: 14, atkMult: 1.8, annonce: '⚠️ Le Néant cesse d’attendre. C’est précisément ce qu’il ne fallait pas.' },
    },
  },
});

DONJONS.push(
  // ============================================================
  // 7. Le Gouffre de Nihelm — défi 50 (après la Couronne Céleste)
  // ============================================================
  {
    id: 'nihelm',
    nom: 'Le Gouffre de Nihelm',
    emoji: '🕳️',
    niveauMin: 52,
    defi: 52,
    requiert: 'couronne-celeste',
    // Le gouffre où coulent les vaincus : il faut de quoi tenir debout,
    // une plume d'Archonte pour éclairer la descente, et la Citadelle de
    // Foudre déjà tombée.
    acces: accesHistoire(52, 'vit', {
      objets: { 'echo-fossilise': 3, 'graine-renversee': 2 },
      bossZones: ['jardins-renverses'],
    }),
    resume: 'Tout ce que les héros ont vaincu coule quelque part. Ce quelque part vient de déborder. Défi de niveau 52 — équipe complète recommandée.',
    hautFait: 'donjon-nihelm',
    depart: 'intro',
    familier: 'ombre-apprivoisee',
    recompenses: { xp: 14000, po: 9000, objet: 'linceul-de-nihelm' },
    etapes: {
      intro: {
        type: 'dialogue',
        scenes: [
          { qui: 'Narrateur', emoji: '📜', texte: 'Là où la pluie d’étoiles de la Couronne a touché terre, le sol s’est ouvert. Pas un cratère : une bouche. Les anciens l’appellent Nihelm — le gouffre où coulent les ombres de tout ce qui meurt vaincu. Et depuis quelques nuits, les ombres remontent.' },
          { qui: 'Le Fossoyeur', emoji: '⚰️', texte: 'Au bord du gouffre, un vieil homme appuyé sur une bêche vous regarde arriver sans surprise. « Je suis le Fossoyeur. J’enterre les histoires finies — les vôtres m’ont donné du travail, ces derniers temps. Aldric, Morvane, Ignarok, l’Archonte… Tous couchés là-dessous. Le problème, c’est qu’ils ne dorment plus. »' },
          { qui: 'Le Fossoyeur', emoji: '⚰️', texte: '« Quelque chose, tout au fond, recoud leurs ombres en une seule. Un Avatar de tout ce que vous avez vaincu. Descendez le voir. C’est votre ouvrage, après tout — chaque coup que vous avez porté est cousu dedans. Moi, je vous garde une tombe fraîche. Par politesse. On ne sait jamais. »' },
        ],
        suite: 'descente',
      },
      descente: {
        type: 'epreuve',
        qui: 'Narrateur', emoji: '🪢',
        texte: 'La paroi du gouffre descend à pic, luisante d’une rosée noire. Les prises existent — mais elles bougent, très légèrement, comme si la pierre respirait. Le Fossoyeur, lui, descend par son propre escalier, qu’il refuse de partager : « professionnel uniquement ».',
        stat: 'dex', difficulte: 40,
        reussite: {
          texte: 'Vous descendez la paroi vivante comme si vous l’aviez gravie cent fois. À mi-hauteur, une anfractuosité abrite le sac d’un précédent visiteur — qui n’en aura plus besoin.',
          effet: { po: 600, objets: { 'potion-supreme-soin': 2 } },
          suite: 'veillee',
        },
        echec: {
          texte: 'La pierre inspire au mauvais moment. Les derniers mètres se font en chute libre, amortie par un tapis d’ombres qui n’avait rien de moelleux.',
          effet: { pvPct: -0.12 },
          suite: 'veillee',
        },
      },
      veillee: {
        type: 'combat',
        intro: 'Au fond du gouffre, vos propres silhouettes vous attendent — découpées dans la nuit, armées de vos gestes. Entre elles rampe un deuil aux pattes trop nombreuses.',
        monstres: ['ombre-de-heros', 'ombre-de-heros', 'deuil-rampant'],
        suite: 'fosse-commune',
      },
      'fosse-commune': {
        type: 'choix',
        qui: 'Le Fossoyeur', emoji: '⚰️',
        texte: 'La fosse commune des vaincus : des tertres à perte de vue, un par monstre tombé sous vos coups. Le Fossoyeur ôte son chapeau. « Chacun a droit à une veillée. Personne ne la fait jamais. Vous avez le temps — enfin, non. Mais vous avez le choix. »',
        options: [
          {
            texte: '🕯️ Veiller les tombes, une par une',
            detail: 'Intelligence ≥ 32 — dire chaque nom apaise les ombres : l’Avatar en sera affaibli',
            condition: { stat: 'int', min: 32 },
            effet: { drapeau: 'tombes-veillees' },
            resultat: 'Vous passez de tertre en tertre en disant les noms — ceux que vous connaissez, et pour les autres, ce que vous vous rappelez du combat. Les tertres cessent un à un de frémir. Le Fossoyeur remet son chapeau : « Première fois en mille ans que quelqu’un fait la moitié de mon travail. »',
            suite: 'galerie-echos',
          },
          {
            texte: '⛏️ Fouiller la fosse — les vaincus n’ont plus besoin de leur or',
            detail: 'Un butin certain… et une rancune certaine',
            effet: { drapeau: 'fosse-profanee', po: 800, objets: { 'essence-primordiale': 1 } },
            resultat: 'Les tertres rendent leur tribut : l’or des vaincus, l’essence de leurs restes. Le Fossoyeur ne dit rien. Les tombes non plus — et c’est bien ça le problème : elles retiennent leur souffle.',
            suite: 'combat-reproches',
          },
          {
            texte: '🚶 Traverser sans toucher à rien',
            detail: 'Le respect minimal : passer son chemin',
            resultat: 'Vous traversez la fosse entre les tertres, sans un mot. Le Fossoyeur hoche la tête : « Neutre. Je note. Le gouffre aussi. »',
            suite: 'galerie-echos',
          },
        ],
      },
      'combat-reproches': {
        type: 'combat',
        intro: 'Les cendres profanées se lèvent en colonnes. Deux porteurs d’urnes marchent sur vous, et le deuil suit, ravi qu’on lui donne raison.',
        monstres: ['porteur-de-cendres', 'porteur-de-cendres', 'deuil-rampant'],
        suite: 'galerie-echos',
      },
      'galerie-echos': {
        type: 'dialogue',
        scenes: [
          { qui: 'Écho d’Aldric', emoji: '👑', texte: 'La galerie suivante murmure avec des voix connues. « Toi, » dit une ombre couronnée sans se retourner. « Tu m’as rendu le silence, dans ma crypte. Ici, quelque chose me le reprend. Chaque nuit, il me recoud dans sa colère. Finis-le — ou nous reviendrons tous, pour toujours, dans le mauvais sens. »' },
          { qui: 'Écho de Morvane', emoji: '🏴‍☠️', texte: 'Plus loin, un tricorne d’ombre vous salue. « Le mousse avait raison sur un point : on ne mouille jamais deux fois dans le même port. Sauf ici. Ici, on recommence à couler chaque nuit. Coulez-LE, capitaine. C’est un ordre — enfin, une prière. La différence s’est perdue en route. »' },
        ],
        suite: 'pari-du-fossoyeur',
      },
      'pari-du-fossoyeur': {
        type: 'epreuve',
        qui: 'Le Fossoyeur', emoji: '🎲',
        texte: 'Devant le puits final, le Fossoyeur sort deux dés taillés dans des os que vous préférez ne pas identifier. « Tradition de la maison : on joue avant la fin. Si vous gagnez, je vous rends une trouvaille de mes fouilles. Si je gagne… je prends quelques-unes de vos années. J’en fais collection. »',
        stat: 'cha', difficulte: 40,
        reussite: {
          texte: 'Les dés roulent, hésitent — et vous offrent la paire parfaite. Le Fossoyeur siffle entre ses dents et s’exécute : une essence primordiale, exhumée de la tombe d’un monde précédent. « Personne ne gagne jamais. Je commençais à trouver ça monotone. »',
          effet: { po: 500, objets: { 'essence-primordiale': 1 } },
          suite: 'puits',
        },
        echec: {
          texte: 'Les dés d’os vous trahissent avec un enthousiasme suspect. Le Fossoyeur cueille délicatement quelque chose d’invisible au-dessus de vos têtes et le range dans une boîte. Vous vous sentez… un peu moins nombreux à l’intérieur.',
          effet: { pvPct: -0.1 },
          suite: 'puits',
        },
      },
      puits: {
        type: 'combat',
        intro: 'Le puits central. Les dernières ombres libres se jettent entre vous et le fond — non pour protéger l’Avatar, mais pour ne pas être recousues dedans.',
        monstres: ['porteur-de-cendres', 'ombre-de-heros', 'deuil-rampant'],
        suite: 'confession',
      },
      confession: {
        type: 'choix',
        qui: 'Narrateur', emoji: '🪞',
        texte: 'Au bord du fond, le gouffre vous renvoie votre reflet — en noir. Il a chacun de vos coups, chacune de vos victoires, et il attend de savoir ce que vous en dites. Le Fossoyeur souffle : « Répondez-lui avec soin. C’est de VOUS qu’il est cousu. »',
        options: [
          {
            texte: '🕯️ Reconnaître chaque ombre : « Oui, c’était nous. Chaque coup. »',
            detail: 'Chance ≥ 32 — assumer désarme la rancune : l’Avatar frappera moins fort',
            condition: { stat: 'cha', min: 32 },
            effet: { drapeau: 'ombres-reconnues' },
            resultat: 'Vous ne détournez pas les yeux. Le reflet noir vous dévisage longuement… puis incline la tête, comme un duelliste qui salue. La rancune reste — mais elle a perdu son meilleur argument.',
            suite: 'avant-boss',
          },
          {
            texte: '🛡️ Renier le reflet : « Nous avons fait ce qu’il fallait. Rien de plus. »',
            detail: 'Le déni est une armure — épaisse, mais bruyante',
            effet: { pvPct: 0.15 },
            resultat: 'Le reflet noir sourit — c’est votre sourire, et c’est bien le pire. Votre certitude vous enveloppe comme une cuirasse. Elle tiendra. Probablement.',
            suite: 'avant-boss',
          },
        ],
      },
      'avant-boss': {
        type: 'dialogue',
        scenes: [
          { qui: 'Le Fossoyeur', emoji: '⚰️', texte: '« Le voilà. Tout ce que vous avez vaincu, cousu en un seul deuil. Je ne peux pas creuser assez vite pour lui — alors faites votre métier, que je puisse faire le mien. Et si ça tourne mal… votre tombe est la troisième à gauche. J’ai mis de la mousse. C’est confortable, la mousse. »' },
        ],
        suite: 'boss',
      },
      boss: {
        type: 'boss',
        intro: 'Le fond du gouffre se lève. Ce n’est pas une créature : c’est une foule cousue en une seule — couronnes, tricornes, marteaux et trônes fondus dans une silhouette immense qui vous reconnaît. « VOUS, » dit l’Avatar de Nihelm avec toutes ses voix à la fois.',
        monstre: 'avatar-de-nihelm',
        modificateurs: [
          { drapeau: 'tombes-veillees', hpMult: 0.9, annonce: '🕯️ Les tombes veillées refusent de nourrir l’Avatar : des pans entiers de son ombre se détachent !' },
          { drapeau: 'ombres-reconnues', atkMult: 0.85, annonce: '🪞 Vous avez assumé chaque coup : la rancune de l’Avatar frappe sans conviction !' },
          { drapeau: 'fosse-profanee', atkMult: 1.1, annonce: '⚱️ Les cendres profanées hurlent dans l’ombre de l’Avatar : sa colère a un argument de plus !' },
        ],
        suite: 'fin',
      },
      fin: {
        type: 'fin',
        variantes: [
          { drapeau: 'ombres-reconnues', cle: 'deuil-fait', texte: 'L’Avatar se défait couture par couture — et chaque ombre libérée s’arrête un instant devant vous. Certaines saluent. Une (un tricorne) fait mine de vous embaucher. Puis elles coulent, une à une, dans un sommeil qui ressemble enfin à du repos. Le Fossoyeur contemple le gouffre apaisé et plante sa bêche : « Fermé pour deuil. Le premier vrai depuis mille ans. » Il vous tend le Linceul — plié au carré, évidemment.' },
          { drapeau: 'fosse-profanee', cle: 'deuil-amer', texte: 'L’Avatar se défait en hurlant, et les ombres libérées vous évitent soigneusement en s’écoulant vers le fond. Le Fossoyeur récupère le Linceul dans les décombres et vous le tend sans un mot. Au moment de partir, il ajoute, sans se retourner : « La prochaine fois, laissez l’or des morts aux morts. Ils comptent. Ils comptent TRÈS bien. »' },
        ],
        texte: 'L’Avatar se défait couture par couture, et les ombres coulent une à une vers un sommeil qui ressemble enfin à du repos. Le Fossoyeur plante sa bêche dans le silence retrouvé : « Joli travail. Propre. Je n’aurai presque rien à recoudre. » Il vous tend le Linceul de Nihelm — et referme le gouffre derrière vous comme on borde un lit.',
      },
    },
  },

  // ============================================================
  // 8. La Forteresse du Temps Brisé — défi 60
  // ============================================================
  {
    id: 'temps-brise',
    nom: 'La Forteresse du Temps Brisé',
    emoji: '⏰',
    niveauMin: 56,
    defi: 60,
    requiert: 'nihelm',
    // On ne court pas après le temps sans vitesse — ni sans une essence
    // primordiale, la seule matière que les heures ne rongent pas.
    acces: accesHistoire(58, 'dex', {
      objets: { 'encre-noyee': 2, 'echo-fossilise': 2 },
      bossZones: ['balance-des-heures'],
    }),
    resume: 'Une forteresse fige sa dernière heure en boucle depuis mille ans. Son Horloger refuse que minuit sonne. Défi de niveau 60 — équipe complète recommandée.',
    hautFait: 'donjon-temps-brise',
    depart: 'intro',
    familier: 'sablier-eveille',
    recompenses: { xp: 20000, po: 13000, objet: 'couronne-des-heures' },
    etapes: {
      intro: {
        type: 'dialogue',
        scenes: [
          { qui: 'Narrateur', emoji: '📜', texte: 'Au nord des Terres lointaines se dresse une forteresse que les cartes refusent d’admettre : elle n’y est que de 23 h à minuit. Mille ans plus tôt, à minuit moins une, elle est tombée — et son Horloger a refusé le douzième coup. Depuis, la même heure recommence. Toutes les nuits. Pour toujours.' },
          { qui: 'Perpétue', emoji: '🕯️', texte: 'Une apprentie en tablier d’horlogerie vous attend à la herse, une bougie à la main — la flamme brûle à l’envers. « Je suis Perpétue. Apprentie de l’Horloger depuis… » Elle consulte la bougie. « …trois cent soixante-cinq mille nuits, environ. Je suis la seule à me souvenir des boucles. C’est une forme de promotion, j’imagine. »' },
          { qui: 'Perpétue', emoji: '🕯️', texte: '« Le maître a figé notre chute pour nous sauver — et il a oublié de nous demander si mille ans de la même heure valaient mieux qu’une fin. Montez jusqu’au beffroi. Laissez minuit sonner. Je vous guiderai — j’ai eu le temps d’apprendre le chemin par cœur. Tous les chemins. Par cœur. »' },
        ],
        suite: 'cour-gelee',
      },
      'cour-gelee': {
        type: 'combat',
        intro: 'La cour de la forteresse, saisie en pleine bataille d’il y a mille ans. Les sentinelles vous détectent : vous n’étiez pas dans l’heure d’origine. Erreur à corriger.',
        monstres: ['sentinelle-des-heures', 'sentinelle-des-heures', 'regret-devorant'],
        suite: 'carillon',
      },
      carillon: {
        type: 'epreuve',
        qui: 'Perpétue', emoji: '🔔',
        texte: 'Le petit carillon de la chapelle — le seul instrument que l’Horloger n’a jamais su faire taire. « Il est accordé sur la boucle, » explique Perpétue. « Réaccordez-le sur le temps VRAI, et le maître perdra sa meilleure oreille. Mais une fausse note, et toute la ronde de garde saura que vous existez. »',
        stat: 'int', difficulte: 44,
        reussite: {
          texte: 'Cloche après cloche, vous rendez au carillon l’heure juste. Son premier accord de temps réel traverse la forteresse comme un frisson — et quelque part très haut, un balancier rate un battement.',
          effet: { drapeau: 'carillon-accorde' },
          suite: 'salle-des-pendules',
        },
        echec: {
          texte: 'L’avant-dernière cloche sonne un quart de ton trop bas. Dans le silence qui suit, vous entendez très distinctement toute une ronde de garde faire demi-tour.',
          suite: 'combat-ronde',
        },
      },
      'combat-ronde': {
        type: 'combat',
        intro: 'La ronde déboule dans la chapelle, hallebardes-aiguilles en avant. Un paradoxe armé les suit — il est déjà là avant d’arriver, ce qui est vexant.',
        monstres: ['sentinelle-des-heures', 'paradoxe-arme'],
        suite: 'salle-des-pendules',
      },
      'salle-des-pendules': {
        type: 'choix',
        qui: 'Perpétue', emoji: '🕰️',
        texte: 'La salle des pendules : des centaines de balanciers, un par habitant de la forteresse, chacun figé sur sa dernière seconde. « Le maître garde leurs heures ici, » murmure Perpétue. « On peut en rendre — ou en prendre. Je ne vous jugerai pas. Enfin si. Mais en silence. »',
        options: [
          {
            texte: '🗝️ Rendre leur heure aux gardes de la forteresse',
            detail: 'Intelligence ≥ 36 — libérés de la boucle, ils cesseront de défendre l’Horloger',
            condition: { stat: 'int', min: 36 },
            effet: { drapeau: 'gardes-liberes' },
            resultat: 'Vous relancez les balanciers un à un. Dans toute la forteresse, des soldats figés terminent enfin leur geste — et le laissent inachevé, désertant leur poste millénaire pour aller voir minuit en face. L’Horloger n’a plus d’armée : il a des témoins.',
            suite: 'bibliotheque',
          },
          {
            texte: '⌛ Voler une heure pour l’équipe',
            detail: 'Une heure entière de repos absolu — mais l’Horloger saura compter',
            effet: { drapeau: 'heure-volee', pvPct: 0.2, mpPct: 0.2 },
            resultat: 'Vous décrochez une heure vacante et la partagez : une heure de sommeil parfait, hors du temps, sans rêves ni sentinelle. Vous vous relevez neufs. Au plafond, une pendule de bronze vient de se mettre à compter — à rebours, et pour vous.',
            suite: 'bibliotheque',
          },
          {
            texte: '🚶 Ne toucher à aucun balancier',
            detail: 'Le temps des autres ne se manipule pas',
            resultat: 'Vous traversez la salle les mains derrière le dos, ostensiblement. Perpétue approuve : « C’est ce que je dis au maître depuis mille ans. Mot pour mot. »',
            suite: 'bibliotheque',
          },
        ],
      },
      bibliotheque: {
        type: 'tresor',
        titre: '📚 La bibliothèque des futurs annulés',
        texte: 'Des rayonnages entiers de « demain » que la boucle a rendus impossibles : moissons jamais faites, lettres jamais lues — et les trésors que la forteresse aurait un jour frappés.',
        effet: { po: 1800, objets: { 'eclat-d-etoile': 2, 'potion-supreme-soin': 2, 'potion-supreme-mana': 1 } },
        suite: 'escalier-inverse',
      },
      'escalier-inverse': {
        type: 'epreuve',
        qui: 'Perpétue', emoji: '🌀',
        texte: 'L’escalier du beffroi monte à travers les âges de la forteresse — au sens propre : chaque volée de marches vous fait vieillir, la palier suivant vous rajeunit, et l’équilibre des deux dépend de votre vitesse. « Courez régulier, » conseille Perpétue. « Le maître l’a conçu pour décourager les visites. Et les huissiers. »',
        stat: 'vit', difficulte: 44,
        reussite: {
          texte: 'Vous trouvez la cadence exacte où vieillir et rajeunir s’annulent. Au sommet, vous avez l’âge précis du départ — et dans une niche du palier, la bourse d’un huissier moins régulier que vous.',
          effet: { po: 900 },
          suite: 'atelier-perpetue',
        },
        echec: {
          texte: 'À mi-course, vous avez brièvement soixante-dix ans, puis sept. Le corps encaisse les deux notes de frais. Perpétue vous attend au sommet avec l’air de quelqu’un qui a vu ça trois cent mille fois — parce que c’est le cas.',
          effet: { pvPct: -0.15 },
          suite: 'atelier-perpetue',
        },
      },
      'atelier-perpetue': {
        type: 'choix',
        qui: 'Perpétue', emoji: '🕯️',
        texte: 'Son ancien atelier, sous le beffroi. Perpétue pose sa bougie inversée et vous regarde en face. « Je peux fausser le grand ressort du maître d’ici. Son mécanisme perdra un temps précieux — c’est le cas de le dire. Mais la boucle me protège : si je la sabote, mes trois cent soixante-cinq mille nuits me rattraperont d’un coup. Je suis prête. La question, c’est : vous, êtes-vous prêts à me le demander ? »',
        options: [
          {
            texte: '🔧 Accepter son sacrifice : « Fausse le ressort. »',
            detail: 'L’Horloger sera affaibli — mais Perpétue paiera ses mille ans d’un coup',
            effet: { drapeau: 'ressort-fausse' },
            resultat: 'Perpétue sourit — un vrai sourire, le premier depuis des siècles, dirait-on — et plonge ses mains dans la mécanique. Quelque part au-dessus, le grand ressort gémit et se voile. Quand elle se retourne, ses cheveux ont blanchi aux tempes. « Ce n’est qu’un acompte, » dit-elle. « Allez. Je finis de compter. »',
            suite: 'garde-final',
          },
          {
            texte: '🕯️ Refuser : « Personne ne paie mille ans pour nous. »',
            detail: 'L’Horloger restera entier — mais Perpétue verra minuit',
            effet: { drapeau: 'perpetue-epargnee', pvPct: 0.1 },
            resultat: 'Vous refermez doucement le panneau de la mécanique. Perpétue proteste pour la forme, puis vous glisse une fiole de sa réserve — « pour la route » — et reprend sa bougie. Sa flamme inversée, pour la première fois, vacille dans le bon sens.',
            suite: 'garde-final',
          },
        ],
      },
      'garde-final': {
        type: 'combat',
        intro: 'La porte du beffroi. Les derniers fidèles de l’Horloger s’y produisent — des paradoxes en armes, qui vous ont déjà perdu ce combat et comptent bien prendre leur revanche à l’avance.',
        monstres: ['paradoxe-arme', 'paradoxe-arme', 'regret-devorant'],
        suite: 'avant-boss',
      },
      'avant-boss': {
        type: 'dialogue',
        scenes: [
          { qui: 'Perpétue', emoji: '🕯️', texte: '« Le beffroi. Il est là-haut, au milieu de ses cadrans, à retenir le douzième coup à bout de bras depuis mille ans. Ne le détestez pas trop : il nous aimait. C’est bien ça, le problème — il nous aimait au point de nous garder. Sonnez minuit. Toutes les cloches. Je veux entendre la fin. »' },
        ],
        suite: 'boss',
      },
      boss: {
        type: 'boss',
        intro: 'Le beffroi est un ciel de cadrans. Suspendu au grand balancier, un vieillard aux yeux d’émail vous toise — onze coups de bronze flottent autour de lui comme une couronne, et il retient le douzième dans son poing. « MILLE ANS QUE JE LE TIENS, » dit le Grand Horloger. « VOUS NE SONNEREZ RIEN. »',
        monstre: 'grand-horloger',
        modificateurs: [
          { drapeau: 'carillon-accorde', hpMult: 0.9, annonce: '🔔 Le carillon accordé chante le temps vrai : la mécanique de l’Horloger se voile à chaque note !' },
          { drapeau: 'gardes-liberes', atkMult: 0.9, annonce: '🗝️ Ses gardes libérés regardent sans intervenir : l’Horloger frappe seul, pour la première fois !' },
          { drapeau: 'ressort-fausse', hpMult: 0.9, annonce: '🔧 Le grand ressort faussé par Perpétue grince : chaque geste de l’Horloger coûte double !' },
          { drapeau: 'heure-volee', atkMult: 1.1, annonce: '⌛ L’Horloger a compté l’heure volée — et il la fait payer avec intérêts !' },
        ],
        suite: 'fin',
      },
      fin: {
        type: 'fin',
        variantes: [
          { drapeau: 'ressort-fausse', cle: 'minuit-paye', texte: 'Le douzième coup échappe au poing de l’Horloger et sonne — énorme, rond, définitif. La forteresse achève sa chute de mille ans… en trois mètres : le temps figé l’avait presque posée. Dans la cour, les habitants terminent leurs gestes et éclatent en questions. Vous trouvez Perpétue assise contre le beffroi, très vieille et très satisfaite, sa bougie éteinte à la main. « J’ai entendu la fin, » souffle-t-elle. « Elle était à l’heure. » Elle vous lègue la Couronne des Heures — et son dernier tour de cadran.' },
          { drapeau: 'perpetue-epargnee', cle: 'minuit-partage', texte: 'Le douzième coup sonne — énorme, rond, définitif — et la forteresse achève sa chute de mille ans en trois mètres à peine. Perpétue écoute l’écho mourir, compte jusqu’à douze, puis souffle enfin sa bougie inversée. « Trois cent soixante-cinq mille nuits, » dit-elle, « et c’est la première fois que je vois minuit UNE. » Elle vous coiffe elle-même de la Couronne des Heures, de ses mains d’apprentie — enfin libre de devenir maîtresse horlogère. Elle a le temps, désormais.' },
        ],
        texte: 'Minuit sonne enfin sur la Forteresse, douze coups ronds et définitifs, et le temps reprend son cours interrompu. Dans le beffroi silencieux, il ne reste du Grand Horloger qu’un balancier immobile — et la Couronne des Heures, qui vous revient.',
      },
    },
  },

  // ============================================================
  // 9. L'Œil du Néant — défi 70, la fin des histoires
  // ============================================================
  {
    id: 'neant',
    nom: 'L’Œil du Néant',
    emoji: '👁️',
    niveauMin: 86,
    defi: 88,
    requiert: 'temps-brise',
    // Celui-qui-Attend regarde en retour : il faut un Esprit solide, trois
    // éclats d'étoile pour ne pas se perdre, et les deux dernières terres
    // des Royaumes lointains derrière soi.
    acces: accesHistoire(86, 'esp', {
      objets: { 'eclat-d-etoile': 3 },
      bossZones: ['neant-scintillant'],
    }),
    resume: 'Sous le gouffre, derrière le temps, quelque chose attendait depuis avant les Royaumes. Il a fini d’attendre. Défi de niveau 88 — le dernier.',
    hautFait: 'donjon-neant',
    depart: 'intro',
    familier: 'lueur-de-fin',
    recompenses: {
      xp: 30000, po: 20000,
      objet: 'coeur-du-neant',
      objetParDrapeau: { 'neant-scelle': 'sceau-de-l-aube' },
    },
    etapes: {
      intro: {
        type: 'dialogue',
        scenes: [
          { qui: 'Narrateur', emoji: '📜', texte: 'Les ombres de Nihelm coulaient quelque part. L’Horloger retenait minuit pour quelqu’un. Les savants de Valciel ont fini par superposer les cartes : sous le gouffre et derrière le temps, il y a un même endroit. Une porte qui n’apparaît sur aucun plan — parce qu’elle est dessinée sur l’envers du monde.' },
          { qui: 'Le Fossoyeur', emoji: '⚰️', texte: 'Il vous attend devant, bêche sur l’épaule, plus vieux que la dernière fois — ce qui ne devrait pas être possible en si peu de jours. « Je vous dois la vérité : je ne creuse pas les tombes. Je les creuse POUR quelqu’un. Celui-qui-Attend. Il mange les histoires finies — c’est son droit, c’est l’ordre des choses. Mais il a cessé d’attendre qu’elles finissent. »' },
          { qui: 'Le Fossoyeur', emoji: '⚰️', texte: '« L’Avatar, c’était lui qui goûtait. La boucle de l’Horloger, c’était lui qui patientait mal. Derrière cette porte, il y a un œil ouvert sur tout ce qui existe — et il cligne de moins en moins. Entrez. Finissez la seule histoire qu’il ne peut pas manger : la sienne. Moi… je creuse. Une grande, cette fois. Je ne sais pas encore pour qui. Je creuse toujours juste. »' },
        ],
        suite: 'seuil',
      },
      seuil: {
        type: 'combat',
        intro: 'Le seuil de l’envers du monde. Deux annonciateurs psalmodient l’arrivée de leur maître — et une baleine d’ombre nage entre les étoiles mortes, gobant les dernières lumières.',
        monstres: ['annonciateur-du-neant', 'annonciateur-du-neant', 'mange-etoiles'],
        suite: 'porte-scellee',
      },
      'porte-scellee': {
        type: 'epreuve',
        qui: 'Narrateur', emoji: '🚪',
        texte: 'La porte intérieure n’a ni gonds ni serrure : elle est simplement plus lourde que tout ce qui existe de ce côté-ci. Elle ne s’ouvre pas — elle se TIENT ouverte, à la force des bras, le temps que tout le monde passe.',
        stat: 'for', difficulte: 48,
        reussite: {
          texte: 'Les épaules calées sous le battant, vous tenez ouvert l’envers du monde le temps que l’équipe passe — et une seconde de plus, par principe. La porte, en se refermant, laisse tomber un fragment d’elle-même : plus lourd qu’il n’en a l’air, et précieux de même.',
          effet: { po: 1500, objets: { 'essence-primordiale': 1 } },
          suite: 'memoire-du-monde',
        },
        echec: {
          texte: 'La porte pèse une idée de plus que vos forces. Elle se referme sur le dernier passant comme un livre qu’on claque — tout le monde passe, mais personne n’en sort indemne.',
          effet: { pvPct: -0.12 },
          suite: 'memoire-du-monde',
        },
      },
      'memoire-du-monde': {
        type: 'choix',
        qui: 'Celui-qui-Attend', emoji: '🌌',
        texte: 'La salle suivante n’existe pas : elle est faite de votre mémoire, dépliée. Chaque héros y voit ce qu’il a de plus cher — et une voix immense, patiente, propose : « RESTE. JE PEUX REFAIRE TOUT CECI. EN MIEUX. IL SUFFIT DE CESSER D’AVANCER. »',
        options: [
          {
            texte: '🧠 Retourner le vœu : « Alors montre-nous TA plus chère mémoire. »',
            detail: 'Intelligence ≥ 40 — piéger le Néant dans sa propre offre',
            condition: { stat: 'int', min: 40 },
            effet: { drapeau: 'voeu-retourne' },
            resultat: 'Un silence — le premier vrai silence du Néant. Car sa plus chère mémoire, c’est le monde d’avant les mondes, celui qu’il a mangé en premier. Et se la montrer, c’est se souvenir qu’il a déjà tout eu — et tout fini. Quelque chose d’immense, derrière les murs, se replie sur une vieille douleur.',
            suite: 'pont-etoiles',
          },
          {
            texte: '⚔️ Refuser en bloc : « Nos souvenirs ne sont pas à vendre. »',
            detail: 'Chance ≥ 40 — un refus unanime le blesse plus qu’une lame',
            condition: { stat: 'cha', min: 40 },
            effet: { drapeau: 'voeu-refuse' },
            resultat: 'Le refus part d’une seule voix — la salle entière vacille, vexée. Les souvenirs dépliés se replient un à un, intacts, inachetés. La voix immense note, quelque part : « INTÉRESSANT. » Elle ment. Elle est furieuse.',
            suite: 'pont-etoiles',
          },
          {
            texte: '👂 Écouter l’offre… juste un instant',
            detail: 'Dangereux — mais le Néant paie parfois ses auditeurs',
            resultats: [
              { poids: 3, texte: 'Vous écoutez — un instant seulement — et dans le flot de la tentation, vous attrapez au vol un fragment du monde promis : il est solide, lui. Le reste, vous le laissez couler.', effet: { pvPct: 0.15, po: 1000 }, suite: 'pont-etoiles' },
              { poids: 2, texte: 'Vous écoutez un instant de trop. Le monde promis a le goût exact de ce qui vous manque — et le retirer de votre bouche coûte une part de vous.', effet: { pvPct: -0.18 }, suite: 'pont-etoiles' },
            ],
          },
        ],
      },
      'pont-etoiles': {
        type: 'tresor',
        titre: '🌉 Le pont des étoiles mortes',
        texte: 'Un pont bâti de toutes les étoiles que le Mange-étoiles a gobées — éteintes, mais pas vides. Entre deux pas, vous ramassez ce que la lumière a laissé.',
        effet: { po: 2000, objets: { 'essence-primordiale': 2, 'potion-supreme-soin': 3, 'eclat-d-etoile': 2 } },
        suite: 'regard',
      },
      regard: {
        type: 'epreuve',
        qui: 'Le Fossoyeur', emoji: '👁️',
        texte: 'Au bout du pont, l’Œil vous a vus. Pas encore en colère — curieux. Le Fossoyeur, resté au seuil, vous avait prévenus : « Il regardera l’un de vous en premier. Soutenez ce regard sans ciller, et il doutera. Personne n’a jamais soutenu son regard. Remarquez, personne n’a jamais eu votre chance. »',
        stat: 'cha', difficulte: 48,
        reussite: {
          texte: 'Le regard de l’Œil pèse tous les mondes finis — et s’arrête sur des yeux qui ne baissent pas. Une éternité passe. Puis l’Œil cligne. LE PREMIER. Quelque part au seuil, on entend un fossoyeur rire pour la première fois de sa très longue vie.',
          effet: { drapeau: 'regard-soutenu' },
          suite: 'derniers-pas',
        },
        echec: {
          texte: 'Le regard pèse, pèse — et vous cillez. Rien qu’une fois. L’Œil s’en contente : il a lu, dans ce battement, tout ce qu’il voulait savoir de vos peurs. Vous vous sentez feuilletés.',
          effet: { mpPct: -0.2 },
          suite: 'derniers-pas',
        },
      },
      'derniers-pas': {
        type: 'combat',
        intro: 'Les derniers fidèles du Néant se dressent sur le pont — non pour le protéger, mais pour retarder l’heure où il devra, enfin, faire quelque chose lui-même.',
        monstres: ['annonciateur-du-neant', 'mange-etoiles', 'mange-etoiles'],
        suite: 'avant-boss',
      },
      'avant-boss': {
        type: 'dialogue',
        scenes: [
          { qui: 'Le Fossoyeur', emoji: '⚰️', texte: 'Sa voix vous parvient depuis le seuil, portée par rien. « La grande tombe est prête. Je ne sais toujours pas pour qui — c’est VOTRE page à écrire, pas la mienne. Mais un conseil de professionnel : quand il tombera, il vous offrira sa place. Manger les fins, décider des fins… c’est un métier, ça aussi. Réfléchissez à deux fois avant de reprendre la boutique. »' },
        ],
        suite: 'boss',
      },
      boss: {
        type: 'boss',
        intro: 'Il n’y a plus de salle. Il n’y a que l’Œil — vaste comme un ciel retourné, ancien comme l’envie de dormir. Celui-qui-Attend vous regarde arriver et, pour la première fois depuis l’aube des mondes, se lève. « J’AI MANGÉ MILLE FINS, » dit-il. « LA VÔTRE SERA LA MEILLEURE. »',
        monstre: 'celui-qui-attend',
        modificateurs: [
          { drapeau: 'voeu-retourne', hpMult: 0.85, annonce: '🧠 Le Néant rumine sa plus chère mémoire : une part de lui combat ailleurs, dans un monde déjà mangé !' },
          { drapeau: 'voeu-refuse', atkMult: 0.85, annonce: '⚔️ Votre refus unanime le blesse encore : chaque coup du Néant hésite une demi-éternité !' },
          { drapeau: 'regard-soutenu', atkMult: 0.9, annonce: '👁️ Il a cligné le premier — et il le sait. Le doute est une chose neuve, et elle le ronge !' },
        ],
        suite: 'choix-final',
      },
      'choix-final': {
        type: 'choix',
        qui: 'Le Néant mourant', emoji: '🌌',
        texte: 'Celui-qui-Attend se replie sur lui-même, de plus en plus petit, jusqu’à tenir dans une main : un cœur noir, très lent, très vieux. Il bat encore. La voix n’est plus qu’un souffle : « QUELQU’UN… DOIT… MANGER LES FINS. SINON ELLES S’EMPILENT. CHOISIS. »',
        options: [
          {
            texte: '🖤 Dévorer le cœur du Néant — reprendre la charge',
            detail: 'Son pouvoir passe en vous, forgé en arme. (Récompense : le Cœur du Néant)',
            effet: { drapeau: 'neant-devore' },
            suite: 'fin',
          },
          {
            texte: '🌅 Sceller l’Œil — confier les fins à l’aube',
            detail: 'Les fins attendront le matin, comme tout le monde. (Récompense : le Sceau de l’Aube)',
            effet: { drapeau: 'neant-scelle' },
            suite: 'fin',
          },
        ],
      },
      fin: {
        type: 'fin',
        variantes: [
          { drapeau: 'neant-devore', cle: 'la-charge-reprise', texte: 'Vous mangez la fin des fins. C’est froid, puis immense, puis étrangement calme : quelque part en vous, désormais, les histoires terminées viennent se ranger d’elles-mêmes, sages comme des livres. Le Fossoyeur comble la grande tombe — vide — et s’en repart en sifflotant : « Patron, » vous salue-t-il au passage. Dans votre main, le Cœur du Néant bat au rythme exact de votre pouls. Les Royaumes de Valciel continuent — et leurs fins, dorénavant, vous demanderont la permission.' },
          { drapeau: 'neant-scelle', cle: 'l-aube-en-heritage', texte: 'Vous refermez l’Œil comme on borde un très vieux dormeur, et vous le scellez du seul sceau qu’il respecte : la promesse d’un matin. Les fins attendront l’aube, désormais — elles s’empileront la nuit et fondront au soleil, comme le givre. Le Fossoyeur contemple sa grande tombe vide, hausse les épaules, et y plante un arbre. « Faute de client. » Sur le chemin du retour, le premier lever de soleil des Royaumes libres semble durer un peu plus longtemps que d’habitude. Il vous salue.' },
        ],
        texte: 'Celui-qui-Attend n’attend plus rien, et l’envers du monde est silencieux. Les Royaumes de Valciel, eux, continuent — toutes leurs histoires désormais libres de finir quand ELLES le décident.',
      },
    },
  },
);
