'use strict';

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
    nom: 'Sabre du capitaine Morvane', emoji: '🗡️', type: 'equipement', slot: 'arme', niveau: 13,
    rarete: 'legendaire', prixVente: 420, bonus: { for: 8, agi: 6, crit: 4 },
    desc: 'Il sent encore le sel et l’orage. Récompense du Brise-Brume.',
  },
  'marteau-de-la-forge-eternelle': {
    nom: 'Marteau de la Forge éternelle', emoji: '🔨', type: 'equipement', slot: 'arme', niveau: 17,
    rarete: 'mythique', prixVente: 700, bonus: { for: 15, vit: 4, pvMax: 25 },
    desc: 'Forgé par Barguzan dans une Forge ravivée. Il chante en frappant.',
  },
  'lame-de-la-derniere-cendre': {
    nom: 'Lame de la Dernière Cendre', emoji: '🌑', type: 'equipement', slot: 'arme', niveau: 17,
    rarete: 'mythique', prixVente: 700, bonus: { agi: 12, for: 8, crit: 6 },
    desc: 'Trempée dans le dernier feu du volcan éteint. Froide, et pourtant…',
  },
};
Object.assign(OBJETS, OBJETS_DONJONS);

// ---------------------------------------------------------------------
// Monstres exclusifs des donjons (mêmes gabarits que MONSTRES)
// ---------------------------------------------------------------------
const MONSTRES_DONJONS = {
  // ----- La Crypte du Roi Oublié (niv. 4+) -----
  'garde-noye': {
    nom: 'Garde noyé', emoji: '🧟', niveau: 4, hp: 52, atk: 10, agi: 4, xp: 46, po: [8, 14],
    drops: [{ id: 'poussiere-spectre', chance: 0.3 }],
    attaques: [
      { nom: 'Hallebarde rouillée', emoji: '🪓', mult: 1.0, poids: 3, type: 'mono' },
      { nom: 'Étreinte glacée', emoji: '🥶', mult: 0.8, poids: 1, type: 'mono', effet: { type: 'affaibli', duree: 2 } },
    ],
  },
  'spectre-vorn': {
    nom: 'Spectre du chancelier Vorn', emoji: '🌫️', niveau: 6, boss: true, hp: 135, atk: 12, agi: 7, xp: 130, po: [30, 50],
    drops: [{ id: 'poussiere-spectre', chance: 1 }],
    attaques: [
      { nom: 'Griffe de regret', emoji: '🌫️', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Murmure vénéneux', emoji: '🐍', mult: 0.8, poids: 2, type: 'mono', effet: { type: 'poison', degats: 5, duree: 2 } },
      { nom: 'Souffle des remords', emoji: '💨', mult: 0.7, poids: 1, type: 'aoe' },
    ],
  },
  'garde-outre-tombe': {
    nom: 'Garde d’outre-tombe', emoji: '💀', niveau: 5, hp: 42, atk: 9, agi: 5, xp: 26, po: [4, 8],
    drops: [],
    attaques: [
      { nom: 'Lance spectrale', emoji: '🔱', mult: 1.0, poids: 1, type: 'mono' },
    ],
  },
  'roi-aldric': {
    nom: 'Aldric le Déchu', emoji: '👑', niveau: 6, boss: true, hp: 240, atk: 13, agi: 6, xp: 320, po: [60, 90],
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
    nom: 'Cobaye enragé', emoji: '🐹', niveau: 8, hp: 70, atk: 13, agi: 9, xp: 60, po: [10, 18],
    drops: [{ id: 'herbe-lunaire', chance: 0.4 }],
    attaques: [
      { nom: 'Morsure frénétique', emoji: '🦷', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Roulade folle', emoji: '🌀', mult: 1.3, poids: 1, type: 'mono' },
    ],
  },
  'gelee-instable': {
    nom: 'Gelée instable', emoji: '🟢', niveau: 8, hp: 85, atk: 14, agi: 5, xp: 66, po: [12, 20],
    drops: [{ id: 'seve-ambree', chance: 0.35 }],
    attaques: [
      { nom: 'Éclaboussure acide', emoji: '🧪', mult: 0.9, poids: 2, type: 'mono', effet: { type: 'poison', degats: 5, duree: 2 } },
      { nom: 'Vague gluante', emoji: '🌊', mult: 0.7, poids: 1, type: 'aoe' },
    ],
  },
  'flaque-vive': {
    nom: 'Flaque vive', emoji: '💧', niveau: 8, hp: 48, atk: 11, agi: 7, xp: 30, po: [5, 10],
    drops: [],
    attaques: [
      { nom: 'Gifle de mercure', emoji: '🫧', mult: 1.0, poids: 1, type: 'mono' },
    ],
  },
  'chimere-mercure': {
    nom: 'Chimère de Mercure', emoji: '🫠', niveau: 10, boss: true, hp: 380, atk: 17, agi: 9, xp: 500, po: [90, 140],
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
    nom: 'Matelot spectral', emoji: '🧟‍♂️', niveau: 12, hp: 105, atk: 19, agi: 10, xp: 95, po: [18, 30],
    drops: [{ id: 'poussiere-spectre', chance: 0.5 }],
    attaques: [
      { nom: 'Crochet d’abordage', emoji: '🪝', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Nœud coulant', emoji: '🪢', mult: 0.8, poids: 1, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.25 } },
    ],
  },
  'mousse-spectral': {
    nom: 'Mousse spectral', emoji: '👻', niveau: 12, hp: 62, atk: 15, agi: 11, xp: 36, po: [6, 12],
    drops: [],
    attaques: [
      { nom: 'Coup de gaffe', emoji: '🪝', mult: 1.0, poids: 1, type: 'mono' },
    ],
  },
  'brume-affamee': {
    nom: 'Brume affamée', emoji: '🌫️', niveau: 13, hp: 120, atk: 21, agi: 12, xp: 105, po: [20, 34],
    drops: [{ id: 'lotus-noir', chance: 0.45 }],
    attaques: [
      { nom: 'Morsure de brouillard', emoji: '🌫️', mult: 1.0, poids: 2, type: 'mono', effet: { type: 'drain', part: 0.4 } },
      { nom: 'Voile étouffant', emoji: '😶‍🌫️', mult: 0.75, poids: 1, type: 'aoe' },
    ],
  },
  'capitaine-morvane': {
    nom: 'Capitaine Morvane', emoji: '🏴‍☠️', niveau: 14, boss: true, hp: 620, atk: 24, agi: 12, xp: 850, po: [150, 220],
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
    nom: 'Golem de basalte', emoji: '🗿', niveau: 16, hp: 190, atk: 28, agi: 6, xp: 150, po: [30, 50],
    drops: [{ id: 'noyau-golem', chance: 0.6 }],
    attaques: [
      { nom: 'Poing tellurique', emoji: '🗿', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Secousse', emoji: '💢', mult: 0.8, poids: 1, type: 'aoe' },
    ],
  },
  'elementaire-magma': {
    nom: 'Élémentaire de magma', emoji: '🔥', niveau: 16, hp: 115, atk: 24, agi: 9, xp: 62, po: [10, 18],
    drops: [],
    attaques: [
      { nom: 'Projection de lave', emoji: '🌋', mult: 1.0, poids: 1, type: 'mono' },
    ],
  },
  'ignarok': {
    nom: 'Ignarok, Cœur de Magma', emoji: '🌋', niveau: 18, boss: true, hp: 950, atk: 33, agi: 10, xp: 1600, po: [250, 350],
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
        stat: 'agi', difficulte: 16,
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
        stat: 'agi', difficulte: 16,
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
        stat: 'agi', difficulte: 19,
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
            detail: 'Agilité ≥ 14 — Morvane paradera, sabre baissé',
            condition: { stat: 'agi', min: 14 },
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
    niveauMin: 16,
    resume: 'Au fond des Pics Hurlants brûle la Forge première, gardée par le dernier des forgerons géants.',
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
          { qui: 'Narrateur', emoji: '📜', texte: 'Les Pics Hurlants portent bien leur nom, mais ce soir ils font autre chose : ils battent. Un pouls sourd, minéral, qui monte des profondeurs. Les nains de Cuivre ont une expression pour ça : « la Forge rêve ». Ils ajoutent en général : « fuyez ».' },
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
        stat: 'agi', difficulte: 24,
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
          { drapeau: 'forge-ravivee', cle: 'forge-ravivee', texte: 'Barguzan s’avance sans un mot et pose les deux mains sur l’enclume première. La lave l’enveloppe comme un manteau — et quand elle retombe, ses yeux sont deux braises calmes. « Je forgerai mieux que lui, » dit le nouveau Cœur du volcan. Sa première œuvre est pour vous : un marteau qui chante en frappant. Dans les Pics, désormais, le pouls de la montagne a le rythme tranquille d’un artisan au travail.' },
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
Object.assign(OBJETS, {
  'trident-des-profondeurs': {
    nom: 'Trident des Profondeurs', emoji: '🔱', type: 'equipement', slot: 'arme', niveau: 28,
    rarete: 'legendaire', prixVente: 900, bonus: { for: 16, int: 8, crit: 4 },
    desc: 'L’arme de la Gardienne, rendue à la surface. Récompense du Sanctuaire des Marées.',
  },
  'sceptre-de-l-archonte': {
    nom: 'Sceptre de l’Archonte', emoji: '🌠', type: 'equipement', slot: 'arme', niveau: 46,
    rarete: 'divin', prixVente: 2600, bonus: { int: 26, pmMax: 40, cha: 6 },
    desc: 'Le pouvoir de poser une citadelle comme on pose une plume. Récompense de la Couronne Céleste.',
  },
  'lame-du-firmament': {
    nom: 'Lame du Firmament', emoji: '🌌', type: 'equipement', slot: 'arme', niveau: 46,
    rarete: 'divin', prixVente: 2600, bonus: { agi: 20, for: 12, crit: 10 },
    desc: 'Forgée dans la pluie d’étoiles d’un trône brisé. Récompense de la Couronne Céleste.',
  },
});

Object.assign(MONSTRES_DONJONS, {
  // ----- Le Sanctuaire des Marées (niv. 25-30) -----
  'pelerin-noye': {
    nom: 'Pèlerin noyé', emoji: '🧎', niveau: 26, hp: 443, atk: 42, agi: 8, xp: 230, po: [26, 52],
    drops: [{ id: 'nacre-abyssale', chance: 0.3 }],
    attaques: [
      { nom: 'Étreinte suppliante', emoji: '🙏', mult: 1.0, poids: 3, type: 'mono' },
      { nom: 'Psaume inversé', emoji: '🌊', mult: 0.8, poids: 1, type: 'aoe', effet: { type: 'affaibli', duree: 2 } },
    ],
  },
  'garde-corail': {
    nom: 'Garde de corail', emoji: '🪸', niveau: 28, hp: 510, atk: 45, agi: 9, xp: 265, po: [28, 56],
    drops: [{ id: 'corail-sanglant', chance: 0.35 }],
    attaques: [
      { nom: 'Hallebarde incrustée', emoji: '🔱', mult: 1.15, poids: 3, type: 'mono' },
      { nom: 'Éclats de récif', emoji: '🪸', mult: 0.85, poids: 1, type: 'aoe' },
    ],
  },
  'oracle-corrompu': {
    nom: 'Oracle corrompu', emoji: '🐙', niveau: 29, hp: 546, atk: 46, agi: 10, xp: 283, po: [29, 58],
    drops: [{ id: 'larme-de-sirene', chance: 0.25 }],
    attaques: [
      { nom: 'Prophétie amère', emoji: '🔮', mult: 1.05, poids: 2, type: 'mono', effet: { type: 'poison', degats: 14, duree: 2 } },
      { nom: 'Marée intérieure', emoji: '💙', valeur: 58, poids: 1, type: 'soin' },
    ],
  },
  'gardienne-des-marees': {
    nom: 'Gardienne des Marées', emoji: '🌊', niveau: 30, boss: true, hp: 2444, atk: 59, agi: 11, xp: 1510, po: [180, 300],
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
    nom: 'Sentinelle de la Couronne', emoji: '⚙️', niveau: 44, hp: 1836, atk: 68, agi: 9, xp: 634, po: [44, 88],
    drops: [{ id: 'acier-celeste', chance: 0.35 }],
    attaques: [
      { nom: 'Glaive de protocole', emoji: '⚙️', mult: 1.15, poids: 3, type: 'mono' },
      { nom: 'Balayage de sécurité', emoji: '📡', mult: 0.85, poids: 1, type: 'aoe' },
    ],
  },
  'choeur-d-echos': {
    nom: 'Chœur d’échos', emoji: '🎭', niveau: 46, hp: 1998, atk: 71, agi: 12, xp: 691, po: [46, 92],
    drops: [{ id: 'eclat-d-etoile', chance: 0.3 }],
    attaques: [
      { nom: 'Dissonance', emoji: '🎭', mult: 1.05, poids: 2, type: 'mono', effet: { type: 'affaibli', duree: 2 } },
      { nom: 'Hymne restaurateur', emoji: '💙', valeur: 96, poids: 1, type: 'soin' },
    ],
  },
  'executeur-astral': {
    nom: 'Exécuteur astral', emoji: '⚖️', niveau: 48, hp: 2183, atk: 74, agi: 11, xp: 751, po: [48, 96],
    drops: [{ id: 'plume-d-archon', chance: 0.15 }],
    attaques: [
      { nom: 'Verdict stellaire', emoji: '⚖️', mult: 1.25, poids: 3, type: 'mono' },
      { nom: 'Sentence collective', emoji: '✨', mult: 0.85, poids: 1, type: 'aoe', effet: { type: 'etourdi', duree: 1, chance: 0.2 } },
    ],
  },
  'eclat-d-archonte': {
    nom: 'Éclat d’Archonte', emoji: '💫', niveau: 44, hp: 980, atk: 60, agi: 12, xp: 240, po: [15, 30],
    drops: [],
    attaques: [
      { nom: 'Scintillement blessant', emoji: '💫', mult: 1.0, poids: 1, type: 'mono' },
    ],
  },
  'archonte-dechu': {
    nom: 'L’Archonte Déchu', emoji: '👑', niveau: 50, boss: true, hp: 9916, atk: 96, agi: 12, xp: 4070, po: [350, 550],
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

DONJONS.push(
  // ============================================================
  // 5. Le Sanctuaire des Marées — niv. 25+ (équipe conseillée)
  // ============================================================
  {
    id: 'sanctuaire',
    nom: 'Le Sanctuaire des Marées',
    emoji: '🌊',
    niveauMin: 25,
    resume: 'La cité engloutie d’Azuria se réveille — et sa Gardienne veut rendre la mer à la surface. Toute la mer. Équipe conseillée.',
    hautFait: 'donjon-sanctuaire',
    depart: 'intro',
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
    resume: 'La citadelle des Archontes tombe du ciel — droit sur Valciel. Il faudra une équipe entière pour atteindre la salle du trône.',
    hautFait: 'donjon-couronne',
    depart: 'intro',
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
        stat: 'agi', difficulte: 36,
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
Object.assign(OBJETS, {
  'linceul-de-nihelm': {
    nom: 'Linceul de Nihelm', emoji: '🕳️', type: 'equipement', slot: 'torse', niveau: 50,
    rarete: 'divin', prixVente: 3200, bonus: { vit: 22, for: 10, pvMax: 120, blocage: 6 },
    desc: 'Tissé dans l’ombre de tous les monstres vaincus. Il pèse exactement le poids d’une conscience tranquille.',
  },
  'couronne-des-heures': {
    nom: 'Couronne des Heures', emoji: '⏰', type: 'equipement', slot: 'tete', niveau: 50,
    rarete: 'divin', prixVente: 3600, bonus: { int: 20, agi: 12, pmMax: 50, esquive: 6 },
    desc: 'Chaque pointe est une aiguille arrêtée sur un instant parfait. Récompense de la Forteresse du Temps Brisé.',
  },
  'coeur-du-neant': {
    nom: 'Cœur du Néant', emoji: '🖤', type: 'equipement', slot: 'arme', niveau: 50,
    rarete: 'divin', prixVente: 4500, bonus: { for: 26, int: 26, crit: 10 },
    desc: 'Ce qui restait de Celui-qui-Attend, dévoré et forgé. Il bat encore, très lentement.',
  },
  'sceau-de-l-aube': {
    nom: 'Sceau de l’Aube', emoji: '🌅', type: 'equipement', slot: 'accessoire', niveau: 50,
    rarete: 'divin', prixVente: 4500, bonus: { cha: 12, vit: 14, pvMax: 90, esquive: 5 },
    desc: 'La marque de qui a refermé l’Œil sans le regarder mourir. Le matin lui obéit un peu.',
  },
});

Object.assign(MONSTRES_DONJONS, {
  // ----- Le Gouffre de Nihelm (défi 50) -----
  'ombre-de-heros': {
    nom: 'Ombre de héros', emoji: '👤', niveau: 52, hp: 2550, atk: 79, agi: 14, xp: 879, po: [52, 104],
    drops: [{ id: 'essence-primordiale', chance: 0.1 }],
    attaques: [
      { nom: 'Lame retournée', emoji: '🗡️', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Frappe miroir', emoji: '🪞', mult: 1.3, poids: 1, type: 'mono' },
    ],
  },
  'deuil-rampant': {
    nom: 'Deuil rampant', emoji: '🕷️', niveau: 53, hp: 2648, atk: 81, agi: 10, xp: 913, po: [53, 106],
    drops: [{ id: 'poussiere-spectre', chance: 0.5 }],
    attaques: [
      { nom: 'Morsure de chagrin', emoji: '🕷️', mult: 1.0, poids: 3, type: 'mono', effet: { type: 'poison', degats: 22, duree: 2 } },
      { nom: 'Toile de regrets', emoji: '🕸️', mult: 0.8, poids: 1, type: 'aoe', effet: { type: 'affaibli', duree: 2 } },
    ],
  },
  'porteur-de-cendres': {
    nom: 'Porteur de cendres', emoji: '⚱️', niveau: 54, hp: 2748, atk: 82, agi: 11, xp: 947, po: [54, 108],
    drops: [{ id: 'os-ancien', chance: 0.45 }],
    attaques: [
      { nom: 'Urne brisée', emoji: '⚱️', mult: 1.15, poids: 3, type: 'mono' },
      { nom: 'Nuée funèbre', emoji: '🌫️', mult: 0.85, poids: 1, type: 'aoe' },
    ],
  },
  'avatar-de-nihelm': {
    nom: 'L’Avatar de Nihelm', emoji: '🕳️', niveau: 55, boss: true, hp: 11950, atk: 105, agi: 13, xp: 4910, po: [400, 600],
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
    nom: 'Sentinelle des heures', emoji: '⏳', niveau: 60, hp: 3384, atk: 91, agi: 12, xp: 1166, po: [60, 120],
    drops: [{ id: 'eclat-d-etoile', chance: 0.3 }],
    attaques: [
      { nom: 'Hallebarde-aiguille', emoji: '🕰️', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Seconde volée', emoji: '⏳', mult: 0.9, poids: 1, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.25 } },
    ],
  },
  'regret-devorant': {
    nom: 'Regret dévorant', emoji: '🫥', niveau: 61, hp: 3497, atk: 92, agi: 11, xp: 1205, po: [61, 122],
    drops: [{ id: 'larme-de-sirene', chance: 0.3 }],
    attaques: [
      { nom: 'Si-seulement', emoji: '🫥', mult: 1.05, poids: 2, type: 'mono', effet: { type: 'affaibli', duree: 2 } },
      { nom: 'Rembobinage', emoji: '⏪', valeur: 220, poids: 1, type: 'soin' },
    ],
  },
  'paradoxe-arme': {
    nom: 'Paradoxe armé', emoji: '🌀', niveau: 62, hp: 3611, atk: 94, agi: 15, xp: 1244, po: [62, 124],
    drops: [{ id: 'coeur-d-orage', chance: 0.3 }],
    attaques: [
      { nom: 'Coup déjà porté', emoji: '🌀', mult: 1.2, poids: 3, type: 'mono' },
      { nom: 'Onde causale', emoji: '💫', mult: 0.85, poids: 1, type: 'aoe' },
    ],
  },
  'grand-horloger': {
    nom: 'Le Grand Horloger', emoji: '⏰', niveau: 62, boss: true, hp: 15150, atk: 117, agi: 14, xp: 6220, po: [500, 750],
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
    nom: 'Annonciateur du Néant', emoji: '🌑', niveau: 70, hp: 4593, atk: 106, agi: 14, xp: 1582, po: [70, 140],
    drops: [{ id: 'essence-primordiale', chance: 0.25 }],
    attaques: [
      { nom: 'Verbe d’effacement', emoji: '🌑', mult: 1.15, poids: 3, type: 'mono' },
      { nom: 'Prêche du vide', emoji: '📿', mult: 0.85, poids: 1, type: 'aoe', effet: { type: 'affaibli', duree: 2 } },
    ],
  },
  'mange-etoiles': {
    nom: 'Mange-étoiles', emoji: '🐋', niveau: 71, hp: 4724, atk: 107, agi: 12, xp: 1627, po: [71, 142],
    drops: [{ id: 'eclat-d-etoile', chance: 0.6 }],
    attaques: [
      { nom: 'Gober la lumière', emoji: '🐋', mult: 1.3, poids: 2, type: 'mono' },
      { nom: 'Remous de constellations', emoji: '✨', mult: 0.9, poids: 1, type: 'aoe' },
    ],
  },
  'echo-du-devoreur': {
    nom: 'Écho du Dévoreur', emoji: '💫', niveau: 70, hp: 2300, atk: 95, agi: 15, xp: 380, po: [20, 40],
    drops: [],
    attaques: [
      { nom: 'Réplique du vide', emoji: '💫', mult: 1.0, poids: 1, type: 'mono' },
    ],
  },
  'celui-qui-attend': {
    nom: 'Celui-qui-Attend', emoji: '👁️', niveau: 72, boss: true, hp: 20400, atk: 135, agi: 15, xp: 8400, po: [700, 1000],
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
    niveauMin: 50,
    defi: 50,
    requiert: 'couronne-celeste',
    resume: 'Tout ce que les héros ont vaincu coule quelque part. Ce quelque part vient de déborder. Défi de niveau 50 — équipe complète recommandée.',
    hautFait: 'donjon-nihelm',
    depart: 'intro',
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
        stat: 'agi', difficulte: 40,
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
    niveauMin: 50,
    defi: 60,
    requiert: 'nihelm',
    resume: 'Une forteresse fige sa dernière heure en boucle depuis mille ans. Son Horloger refuse que minuit sonne. Défi de niveau 60 — équipe complète recommandée.',
    hautFait: 'donjon-temps-brise',
    depart: 'intro',
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
    niveauMin: 50,
    defi: 70,
    requiert: 'temps-brise',
    resume: 'Sous le gouffre, derrière le temps, quelque chose attendait depuis avant les Royaumes. Il a fini d’attendre. Défi de niveau 70 — le dernier.',
    hautFait: 'donjon-neant',
    depart: 'intro',
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

// =====================================================================
// v13 — Les CHRONIQUES DES TERRES : la petite histoire de chaque carte.
// Chaque zone cache un récit court et corsé, dans l'esprit des grandes
// Épopées. Déblocage exigeant : niveau minimum, caractéristique minimum,
// objet-clé de la zone en poche, et le boss de la carte déjà vaincu.
// =====================================================================
const CHRONIQUES = [
  {
    zone: 'plaines', nom: 'La Nuit du Grand Troupeau', emoji: '🐏', statAcces: 'vit',
    pnj: { nom: 'Mireille la bergère', emoji: '👵' },
    resume: 'À chaque lune pleine, le Loup alpha rassemble toutes les meutes. Cette nuit, il vise la grande bergerie.',
    scenes: [
      'La lune se lève, énorme et rousse, sur les Plaines de l’Aube. Dans les collines, un hurlement répond à un autre — puis dix, puis cent. Ce soir, les meutes ne chassent pas chacune pour soi.',
      '« Cinquante ans que je garde ces bêtes, et je n’ai jamais entendu ça. » Mireille serre son bâton. « Le Père-des-Meutes les rassemble toutes. S’il atteint la grande bergerie, les Plaines n’auront plus un mouton — ni un berger. »',
      '« Il y a un raccourci par le gué, mais la nuit, le gué appartient aux loups. Passez, faites du bruit, faites-vous voir : tant qu’ils vous chassent VOUS, ils ne chassent pas mes bêtes. »',
    ],
    ep1: { stat: 'vit', texte: 'Le gué, de nuit : l’eau glacée jusqu’aux cuisses, et des yeux jaunes qui s’allument par paires sur l’autre rive. Il faut traverser sans flancher.', ok: 'Vous traversez d’un pas égal, sans presser, sans trembler. Les yeux jaunes clignent, déroutés — et sur la berge, vous trouvez la besace d’un berger moins solide que vous.', ko: 'À mi-gué, une racine, un plongeon, un concert de hurlements moqueurs. Vous ressortez trempés et transis.' },
    combat1: 'Trois silhouettes se détachent de la nuit — l’avant-garde de la grande meute vous a trouvés.',
    dilemme: {
      texte: '« Les meutes suivent l’alpha par peur, pas par amour, » souffle Mireille. « Mon grand-père disait qu’on peut défier un chef de meute AVANT la bataille — le hurlement du défi. Il faut du coffre. Ou alors on se glisse jusqu’à lui sans rien dire. »',
      optA: { stat: 'for', texte: '🐺 Lancer le hurlement du défi', detail: 'l’alpha devra répondre seul, sans sa meute', resultat: 'Vous emplissez vos poumons et hurlez le vieux défi des bergers. La nuit entière se tait. Puis une seule voix répond — le Père-des-Meutes viendra seul, comme l’exige la loi des crocs.' },
      optB: { texte: '🤫 Se glisser sans un bruit vers la tanière', detail: 'discret, mais les ronces prennent leur péage', resultat: 'Vous rampez sous les ronces jusqu’au cœur du territoire. Les épines gardent un peu de vous au passage.' },
    },
    tresor: { titre: '🌾 La cache du berger disparu', texte: 'Sous une pierre plate, la réserve d’un berger que la meute a chassé l’hiver dernier : provisions, herbes, et sa paie jamais dépensée.' },
    combat2: 'La garde rapprochée de l’alpha surgit des herbes hautes, crocs découverts.',
    ep2: { stat: 'agi', texte: 'La colline de la tanière est un piège à chevilles : terriers, os rongés, cailloux roulants. Il faut monter vite ET en silence.', ok: 'Vous montez comme des chats, de pierre sûre en pierre sûre. Au sommet, le vent tourne en votre faveur : il ne vous a pas sentis venir.', ko: 'Un os craque sous une botte. Toute la colline hurle. Vous finissez la montée en courant, sous une pluie de cailloux.' },
    avantBoss: '« Il est là, » murmure Mireille depuis le rocher où elle a refusé de rester. « Grand comme un poney, vieux comme ma rancune. Rendez-lui sa nuit — et rendez-moi mes plaines. »',
    boss: {
      nom: 'Père-des-Meutes', intro: 'Sur la crête, un loup gris-argent se lève — les cicatrices de cent hivers sur le poitrail. Le Père-des-Meutes vous jauge longuement, puis découvre ses crocs : l’audience est ouverte.',
      annonce: '🐺 Le défi a été lancé dans les règles : la meute regarde, et n’interviendra pas — l’alpha se bat retenu par sa propre loi !',
      phase: '🌕 Le Père-des-Meutes hurle à la lune : sa fureur redouble, ses crocs cherchent la gorge !',
      enrage: '⚠️ L’aube approche : l’alpha veut en finir avant que sa nuit ne s’achève !',
    },
    fins: {
      variante: 'Le Père-des-Meutes s’effondre — et la meute entière incline la tête, non vers lui : vers vous. Le défi était propre, la loi des crocs est sauve. Les meutes se disperseront chacune chez soi. Mireille vous accroche sa clochette de doyenne au cou : « Elle sonne faux. Comme mes félicitations. Mais elle porte chance. »',
      defaut: 'Le Père-des-Meutes s’effondre dans les herbes qui blanchissent d’aube. Privées de son ombre, les meutes se défont comme un tricot tiré. Mireille compte ses moutons deux fois, n’en manque aucun, et vous tend sa clochette de doyenne : « Pour que mes bêtes vous reconnaissent. Vous êtes du troupeau, maintenant. »',
    },
    relique: { nom: 'Clochette du Grand Troupeau', emoji: '🔔', bonus: { vit: 3, cha: 2, pvMax: 14 }, desc: 'Elle sonne faux, mais elle sonne fidèle. Récompense de « La Nuit du Grand Troupeau ».' },
  },
  {
    zone: 'foret', nom: 'Le Berceau de Soie', emoji: '🕸️', statAcces: 'agi',
    pnj: { nom: 'Toinou le bûcheron', emoji: '🪓' },
    resume: 'La Matriarche tisse un cocon géant autour du chêne-cœur de la forêt. Ce qui en sortira n’a pas de nom.',
    scenes: [
      'La Forêt des Murmures murmure plus fort que d’habitude — et dans une seule direction. Au centre, là où poussait le chêne-cœur millénaire, les arbres sont blancs de soie jusqu’à la cime.',
      '« Je coupais du bois, je vous jure, du bois normal, » balbutie Toinou, l’apprenti bûcheron, la hache encore tremblante. « Et d’un coup : la soie. Partout. La Matriarche a enveloppé le chêne-cœur — elle en fait un berceau. Un berceau GÉANT. »',
      '« Le vieux forestier disait : ce que la Veuve-Reine couve dans un arbre-cœur naît avec les souvenirs de l’arbre. Mille ans de forêt dans une bête à huit pattes… Coupez la soie. Vite. Et pardon pour ce que j’ai réveillé. »',
    ],
    ep1: { stat: 'agi', texte: 'La toile commence bien avant le berceau : des fils-pièges tendus entre les troncs, fins comme des cheveux, sonores comme des cordes de luth. Un seul frôlé, et toute la forêt saura.', ok: 'Vous dansez entre les fils, ployés, tordus, retenant vos capes. Le dernier fil vibre — frôlé par une feuille morte, pas par vous. Dans un cocon abandonné : la bourse d’un voyageur moins souple.', ko: 'Une boucle de ceinture accroche un fil. La note court jusqu’au cœur de la forêt — et quelque chose d’énorme, là-bas, cesse de tisser pour écouter.' },
    combat1: 'Les sentinelles de la toile descendent des cimes en silence, suspendues à leurs fils.',
    dilemme: {
      texte: '« Il y a les œufs de la couvée d’avant, » chuchote Toinou en désignant une grappe de cocons. « On peut les porter hors de la toile — la Matriarche nous suivra à moitié folle mais elle mordra retenu, ses petits sont dans nos bras. Ou on passe au large, et tant pis pour l’avantage. »',
      optA: { stat: 'agi', texte: '🥚 Porter les cocons hors de la toile', detail: 'la Matriarche n’osera pas frapper fort', resultat: 'Vous cueillez les cocons comme des fruits trop mûrs et les déposez dans la fougère, hors de la toile. Un frisson parcourt toute la soie : elle SAIT. Et elle a peur pour eux.' },
      optB: { texte: '🚶 Passer au large des cocons', detail: 'plus prudent — la soie colle et griffe', resultat: 'Vous contournez la grappe en retenant votre souffle. La soie effleurée vous laisse des zébrures cuisantes en souvenir.' },
    },
    tresor: { titre: '🌲 Le garde-manger suspendu', texte: 'Un cocon plus gros que les autres, plein des « réserves » de la toile : sacoches de voyageurs, fioles intactes, et de la soie de première qualité.' },
    combat2: 'Un bandit à moitié enveloppé de soie se débat — puis cesse de se débattre et se tourne vers vous, les yeux blancs : la toile a des marionnettes.',
    ep2: { stat: 'for', texte: 'Le berceau lui-même : des câbles de soie épais comme des bras, tendus autour du chêne-cœur. Il faut les rompre un à un — et chacun résiste comme un étai de mine.', ok: 'Câble après câble, la soie cède avec des claquements de fouet. Le chêne-cœur respire — ses branches s’étirent comme au sortir d’un long sommeil.', ko: 'Le troisième câble vous échappe et claque en travers du groupe, cinglant comme une lanière. Le berceau tient encore à moitié quand ELLE arrive.' },
    avantBoss: '« Elle vient, » souffle Toinou, la hache brandie à l’envers sans s’en rendre compte. « Écoutez-moi, la soie : c’était pas contre vous. Mais un berceau, ça se fait pas dans le cœur des autres ! »',
    boss: {
      nom: 'Veuve-Reine', intro: 'Elle descend du chêne-cœur à reculons, immense, précautionneuse — une patte après l’autre, comme on quitte un enfant endormi. Puis la Veuve-Reine se retourne, et ses huit yeux ont la patience noire des mères contrariées.',
      annonce: '🥚 Ses cocons sont hors de la toile, entre vos mains prudentes : la Veuve-Reine frappe retenu, terrifiée de mal viser !',
      phase: '🕸️ La Veuve-Reine tisse en combattant : la soie vole, vous enserre, la forêt entière devient sa toile !',
      enrage: '⚠️ Le chêne-cœur gémit : la Veuve-Reine veut finir son berceau CE SOIR, avec ou sans vous !',
    },
    fins: {
      variante: 'La Veuve-Reine recule, vaincue — et vous poussez les cocons vers elle, intacts. Elle les palpe un à un de ses pédipalpes, longuement. Puis elle remonte dans les cimes SANS le chêne-cœur, sa couvée sur le dos, et la soie du berceau se défait toute seule, fil à fil, comme un pardon. Toinou jure d’apprendre les noms des arbres avant de les couper.',
      defaut: 'La Veuve-Reine se replie dans les cimes en emportant ce qui lui reste de toile. Le chêne-cœur, libéré, déploie ses branches dans un craquement de cathédrale — et une pluie de feuilles d’or salue votre passage. Toinou en garde une dans son chapeau : « Pour me souvenir de m’excuser avant de couper. »',
    },
    relique: { nom: 'Fil du Berceau', emoji: '🧵', bonus: { agi: 4, esquive: 2, pvMax: 16 }, desc: 'Un fil de la Veuve-Reine, incassable et léger. Récompense du « Berceau de Soie ».' },
  },
  {
    zone: 'collines', nom: 'Le Tambour de Guerre', emoji: '🥁', statAcces: 'for',
    pnj: { nom: 'Brakka l’exilée', emoji: '👺' },
    resume: 'Korgh a déterré le tambour du Roi-Sous-La-Colline. À chaque battement, une mine de plus répond à l’appel de guerre.',
    scenes: [
      'Boum. Boum. Boum. Depuis trois nuits, les Collines de Cuivre battent comme un cœur malade. Dans les villages, les vieux ferment les volets : ils connaissent ce son par les chansons — le tambour du Roi-Sous-La-Colline.',
      '« Korgh l’a déterré. » Brakka, orc exilée, crache dans la poussière rousse. « Mon ancien chef. Il a brisé le serment de paix que NOS pères ont juré sur ce tambour. Chaque battement rallie une mine, un clan, une bande. Encore dix nuits et c’est la guerre des collines. »',
      '« Le tambour ne peut être détruit que par quelqu’un qui n’a jamais rompu un serment. Vous, peut-être. Moi je ne peux plus — c’est pour ça que je vous guide au lieu de le crever moi-même. Allons faire taire mon ancien chef. »',
    ],
    ep1: { stat: 'for', texte: 'L’entrée des galeries est obstruée par un éboulis frais — Korgh a fait sauter le passage derrière lui. Il faut déblayer, pierre après pierre, avant la prochaine ronde.', ok: 'Vous roulez les blocs comme des tonneaux de foire. Sous le dernier, la sacoche d’un mineur enseveli de justesse — il vous la laisserait de bon cœur.', ko: 'Un bloc cède d’un coup et la moitié de l’éboulis vous roule sur les orteils. Le passage est ouvert ; vos pieds s’en souviendront.' },
    combat1: 'Une patrouille au pas cadencé — le tambour bat jusque dans leurs bottes.',
    dilemme: {
      texte: '« Le chamane de Korgh accorde le tambour chaque soir, » grogne Brakka. « Sans accordage, le rythme boite — et un appel de guerre qui boite, ça fait rire les clans au lieu de les rallier. On peut saboter les peaux. Faut juste être malin : le chamane piège tout. »',
      optA: { stat: 'int', texte: '🪘 Désaccorder le tambour en douce', detail: 'l’appel de Korgh perdra sa force', resultat: 'Vous détendez les peaux d’un quart de tour chacune — assez pour que le tambour sonne creux, pas assez pour que ça se voie. Ce soir, l’appel de guerre fera hausser des épaules à dix lieues.' },
      optB: { texte: '⚔️ Droit au but, tant pis pour la finesse', detail: 'les pièges du chamane mordront', resultat: 'Vous enjambez les fils du chamane — presque tous. Le dernier vous offre une gerbe d’étincelles et une odeur de sourcils roussis.' },
    },
    tresor: { titre: '⛏️ La paie du serment brisé', texte: 'Le coffre de solde des mines ralliées : Korgh paie d’avance ceux qui marchent. Vous confisquez la caisse de guerre — au nom de la paix.' },
    combat2: 'La garde d’élite de Korgh, en armure de cuivre battu, vous barre la galerie du trône.',
    ep2: { stat: 'vit', texte: 'La galerie du trône traverse une nappe de gaz de mine. Torches éteintes, un pas après l’autre, poumons serrés : le moindre souffle trop grand peut tout embraser.', ok: 'Vous traversez au pas lent des mineurs anciens, un linge sur la bouche. De l’autre côté, l’air pur a le goût d’une victoire discrète.', ko: 'Quelqu’un tousse. Une flammèche court au plafond et lèche le groupe au passage — plus de peur que de brûlures, mais des brûlures quand même.' },
    avantBoss: '« Il est là, sur le trône de MON père, » gronde Brakka. « Rappelez-vous : c’est le tambour qui fait le roi. Faites taire l’un, l’autre tombera. Et si Korgh vous parle de fierté orque… dites-lui que la fierté, c’est tenir ses serments. »',
    boss: {
      nom: 'Korgh, Brise-Serments', intro: 'Korgh se lève du trône de pierre, le grand tambour sanglé au dos, les baguettes en os de chef dans une seule main. « L’exilée vous envoie ? Parfait. Le tambour aime les rythmes nouveaux — le vôtre fera l’affaire. »',
      annonce: '🪘 Le tambour désaccordé sonne creux : les coups de Korgh cherchent un rythme qui ne vient plus !',
      phase: '🥁 Korgh frappe son propre tambour en combattant : les parois répondent, les échos frappent avec lui !',
      enrage: '⚠️ Le tambour s’emballe — Korgh ne joue plus l’appel de guerre, il joue la charge finale !',
    },
    fins: {
      variante: 'Korgh tombe à genoux, et le tambour désaccordé rend un son de casserole — le rire de Brakka fait le reste. Un serment se rescelle sur la peau retendue : elle y pose la première main, vous la seconde. Les mines rentrent chez elles en maugréant, ce qui, chez les orcs, est une ovation.',
      defaut: 'Le tambour se fend sous votre dernier coup — et le silence qui suit est si épais que les collines entières semblent soupirer. Korgh, désarmé de son rythme, redevient un chef sans clan. Brakka le renverra à la frontière elle-même. « À pied. Ça lui fera les serments. »',
    },
    relique: { nom: 'Baguette du Roi-Sous-La-Colline', emoji: '🥁', bonus: { for: 5, vit: 3, pvMax: 20 }, desc: 'Elle bat encore la mesure des serments tenus. Récompense du « Tambour de Guerre ».' },
  },
  {
    zone: 'marais', nom: 'La Tête de Trop', emoji: '🐉', statAcces: 'int',
    pnj: { nom: 'Ophrys la tourbière', emoji: '🧙‍♀️' },
    resume: 'L’Hydre des brumes a dévoré un serment scellé — et une huitième tête a poussé, qui parle. Le marais lui obéit.',
    scenes: [
      'Le Marais de Brumeciel a toujours eu ses règles : sept têtes à l’Hydre, pas une de plus, et la brume qui monte le soir. Depuis un mois, la brume monte à midi — et les pêcheurs jurent avoir compté HUIT têtes.',
      '« Ils comptent bien. » Ophrys, sorcière des tourbières, remue une décoction qui sent l’orage. « Un colporteur a jeté dans le marais un serment scellé qu’il n’osait plus porter. L’Hydre l’a gobé. Et un serment, ça veut vivre : ça s’est poussé une tête. Une tête qui PARLE. »',
      '« Elle promet au marais tout ce qu’il veut entendre — la brume obéit déjà. Tranchez la Tête de Trop et les sept autres redeviendront de simples mauvais caractères. J’ai préparé le chemin des pierres sûres. Enfin, sûres… disons : moins pires. »',
    ],
    ep1: { stat: 'int', texte: 'Le chemin des pierres sûres n’est marqué que par des rimes qu’Ophrys vous fait réciter : « mousse au nord, jamais tribord… » Il faut lire le marais comme un grimoire détrempé.', ok: 'Vous récitez, observez, posez le pied — la tourbe porte. À mi-chemin, une main morte tend une sacoche hors de la vase, comme un péage inversé.', ko: 'Une rime oubliée, un pas de travers : la vase vous goûte jusqu’à la ceinture avant de vous recracher, vexée.' },
    combat1: 'La brume de midi se referme — et en sort une escorte au service de la nouvelle voix du marais.',
    dilemme: {
      texte: '« La Tête de Trop tient par le serment, » explique Ophrys. « Or un serment scellé a toujours un mot de rupture. Le colporteur a campé sur l’îlot aux saules — ses papiers y pourrissent peut-être encore. Un détour risqué… ou on fonce et on tranche à l’ancienne. »',
      optA: { stat: 'int', texte: '📜 Fouiller l’îlot aux saules', detail: 'trouver le mot de rupture du serment', resultat: 'Sous une pierre du campement : le contre-seing du serment, à moitié mangé de moisissure — mais le mot de rupture est lisible. La Tête de Trop va détester l’entendre.' },
      optB: { texte: '🗡️ Foncer — l’acier rompt tous les serments', detail: 'direct, mais le marais défend sa voix', resultat: 'Vous coupez au plus court. Le marais le prend personnellement : chaque flaque vous happe les chevilles un peu plus fort.' },
    },
    tresor: { titre: '🪷 La réserve de la sorcière noyée', texte: 'Ophrys « emprunte » la cache d’une consœur disparue : fioles cirées, lotus séchés, et l’or que le marais rend toujours trop tard.' },
    combat2: 'Les gardiennes du serment — sorcières ralliées à la Tête qui promet — barrent le dernier bras d’eau.',
    ep2: { stat: 'cha', texte: 'Le nid de l’Hydre est cerné de brume épaisse à couper. Ophrys tend un rameau de saule : « La brume choisit qui elle égare. Tirez votre chance — et marchez SANS vous retourner. »', ok: 'La brume s’écarte devant vous en couloir, presque poliment. Ophrys hausse un sourcil : « Cinquante ans de marais et jamais vu ça. Vous êtes nés coiffés. »', ko: 'La brume vous fait tourner en rond — trois fois vous repassez devant le même saule, qui semble compter les tours. Vous arrivez essoufflés, moqués par l’écho.' },
    avantBoss: '« Souvenez-vous : sept têtes de mauvaise humeur, une tête de trop, » récapitule Ophrys. « Ignorez les promesses de la huitième. Elle promettra n’importe quoi — c’est son métier de serment. Tranchez, je recouds le reste. »',
    boss: {
      nom: 'L’Hydre à la Tête de Trop', intro: 'L’eau se soulève et l’Hydre déplie ses cous — sept têtes qui sifflent, et une huitième, plus pâle, qui SOURIT. « Enfin des oreilles neuves, » dit-elle d’une voix de colporteur. « Approchez. J’ai tant de choses à promettre. »',
      annonce: '📜 Le mot de rupture claque dans la brume : la Tête de Trop blêmit, et les sept autres tirent soudain dans l’autre sens !',
      phase: '🐉 La Tête de Trop hausse le ton : les sept autres frappent en cadence sur ses promesses !',
      enrage: '⚠️ Le serment sent sa fin : l’Hydre entière se jette dans la bataille comme on signe en bas d’une page !',
    },
    fins: {
      variante: 'Au mot de rupture, la Tête de Trop se détache d’elle-même — et se dissout en encre dans l’eau noire. Les sept têtes restantes se regardent, soulagées, puis replongent d’un même mouvement boudeur. La brume reprend ses horaires. Ophrys récupère l’encre dans un flacon : « Un serment d’occasion. Ça se revend très bien. »',
      defaut: 'La huitième tête tranchée coule en silence — et le marais entier expire, comme s’il rendait une parole trop grande pour lui. L’Hydre, redevenue à sept, vous toise avec quelque chose qui ressemble à de la gratitude mal digérée, puis plonge. Ophrys note la recette de la soirée « pour la postérité, et pour ma nièce ».',
    },
    relique: { nom: 'Sceau du Serment Rompu', emoji: '📜', bonus: { int: 5, cha: 3, pmMax: 18 }, desc: 'L’encre d’un serment qui a trop parlé. Récompense de « La Tête de Trop ».' },
  },
  {
    zone: 'cryptes', nom: 'Le Bal des Couronnes', emoji: '💃', statAcces: 'cha',
    pnj: { nom: 'Sixte le fossoyeur adjoint', emoji: '⚰️' },
    resume: 'Une fois par siècle, le Roi déchu donne un bal — et les invitations sont des ordres. Le bourg entier a reçu la sienne.',
    scenes: [
      'Ce matin, chaque porte du bourg voisin portait un carton noir liséré d’or : « Sa Majesté d’En-Dessous requiert l’honneur de votre présence. Tenue de deuil exigée. » Les cartons refusent de brûler.',
      '« C’est le Bal du siècle, » soupire Sixte, fossoyeur adjoint, qui a l’air d’en savoir long pour un adjoint. « Mon patron dit que le Roi déchu attend une fiancée depuis huit cents ans — celle qui l’a planté devant l’autel, d’après la légende. À chaque bal, il garde quelques danseurs. Pour toujours. »',
      '« Le protocole est la seule arme là-dedans : on n’entre pas sans invitation, on ne refuse pas une danse, on ne quitte pas le bal avant le Roi. MAIS — un invité qui éclipse le Roi en élégance peut réclamer une faveur. Vous voyez l’idée. Voici vos cartons. Ne me demandez pas où je les ai pris. »',
    ],
    ep1: { stat: 'cha', texte: 'Le majordome squelette examine vos invitations d’une orbite vide et TRÈS soupçonneuse. Il faut passer l’inspection : maintien, révérence, aplomb.', ok: 'Votre révérence est si impeccable que le majordome en grince d’émotion. Il vous glisse même le vestiaire des « invités qui ne sont jamais repartis » — servez-vous.', ko: 'Votre révérence part du mauvais pied. Le majordome vous laisse passer, mais vous inscrit sur la liste des « danseurs prioritaires ». Ce n’est pas un honneur.' },
    combat1: 'Trois chambellans squelettes vous invitent à danser. Leur pavane est un art martial.',
    dilemme: {
      texte: '« La fiancée d’il y a huit cents ans, » chuchote Sixte derrière un pilier, « elle n’a pas fui : elle est morte en route, et le Roi ne l’a jamais su. Sa tombe est dans l’aile ouest. On pourrait lui porter la vérité — une lettre, un gant, une preuve. Ou on mise tout sur l’élégance et on l’éclipse à la loyale. »',
      optA: { stat: 'cha', texte: '💌 Retrouver la preuve dans l’aile ouest', detail: 'la vérité désarmera le Roi mieux qu’une lame', resultat: 'Dans la tombe poussiéreuse : un gant brodé et une lettre jamais livrée — « Je viens, mon roi. Attends-moi. » Huit cents ans de retard. Vous la glissez dans votre manche pour le moment venu.' },
      optB: { texte: '🕺 L’éclipser en beauté sur la piste', detail: 'dansez mieux que la mort elle-même', resultat: 'Vous ouvrez le bal d’une figure que personne n’a osée ici depuis huit siècles. Les lustres en tremblent d’aise — et le Roi plisse ses orbites. Il n’aime pas partager l’affiche.' },
    },
    tresor: { titre: '🍷 Le buffet des siècles', texte: 'Huit cents ans de cadeaux de bal jamais ouverts : liqueurs d’un autre âge, bijoux de deuil, et la cagnotte des paris sur « qui restera ». Vous pariez sur vous — et raflez la mise.' },
    combat2: 'Le prêtre déchu qui célébrait les noces interrompt la musique : « Ces invités ne sont PAS sur la liste. »',
    ep2: { stat: 'agi', texte: 'La dernière danse avant minuit : une gigue des morts au tempo impossible, où chaque faux pas vous rapproche des caveaux « invités permanents ».', ok: 'Vous tenez le tempo, puis le doublez. Les danseurs morts s’écartent en applaudissant des phalanges — le parquet est à vous.', ko: 'Le tempo vous sème. Des mains osseuses vous remettent dans le rythme sans douceur : on danse JUSQU’AU BOUT, ici.' },
    avantBoss: '« Minuit, » souffle Sixte en remontant son col. « Le Roi va choisir qui reste. C’est maintenant : la faveur, la preuve, ou le fer. Personnellement je vote pour tout sauf le fer. J’ai déjà bien assez à creuser. »',
    boss: {
      nom: 'Le Roi déchu, l’Éternel Fiancé', intro: 'Les violons se taisent. Le Roi déchu descend de son trône, couronne de travers, bouquet de roses noires à la main. « Huit cents ans que je garde la première danse, » dit-il. « Elle sera pour l’un de vous. Pour toujours. »',
      annonce: '💌 La lettre de la fiancée tremble dans votre manche : le Roi la sent, et ses coups hésitent entre rage et espoir !',
      phase: '🕯️ Le Roi arrache sa couronne et la brandit comme un sceptre : le bal entier valse à son service !',
      enrage: '⚠️ Minuit sonne le dernier coup : le Roi veut SA danse, de gré ou de force !',
    },
    fins: {
      variante: 'Vous tendez la lettre au Roi vacillant. Il la lit trois fois — huit cents ans de rancune qui se défont ligne à ligne. « Elle venait… » La couronne roule au sol ; il ne la ramasse pas. Le bal entier s’incline tandis qu’il traverse la salle vers l’aile ouest, un gant brodé contre la poitrine. Sixte renifle bruyamment : « Poussière. Dans l’œil. Taisez-vous. »',
      defaut: 'Le Roi déchu ploie le genou — et, en bon perdant de sang royal, vous accorde la faveur due au plus élégant : la liberté de tous les danseurs, vivants et morts. Le bal se vide dans un froissement d’étoffes soulagées. Sur le carton d’invitation, l’encre s’efface d’elle-même. Sixte le garde en souvenir : « Le seul bal dont je sois sorti. »',
    },
    relique: { nom: 'Rose Noire du Bal', emoji: '🥀', bonus: { cha: 5, agi: 3, esquive: 2, pvMax: 18 }, desc: 'Elle ne fane pas — elle attend le prochain bal. Récompense du « Bal des Couronnes ».' },
  },
  {
    zone: 'desert', nom: 'La Perle du Dessous', emoji: '💠', statAcces: 'vit',
    pnj: { nom: 'Naïla la caravanière', emoji: '🐪' },
    resume: 'Le Ver colossal a avalé la perle-mère qui ancrait les dunes. Depuis, le désert entier marche — droit vers la ville.',
    scenes: [
      'Les dunes d’Ambrezine ont toujours chanté sous le vent. Maintenant elles MARCHENT : trois lieues par nuit, toutes dans le même sens — celui de la ville-oasis. Les caravanes croisent des puits qui n’étaient pas là hier.',
      '« C’est la perle-mère, » tranche Naïla, caravanière de sixième génération, en recrachant le sable de son thé. « La grande perle du Dessous, celle qui ancre le sable comme une quille ancre un navire. Le Ver colossal l’a gobée — par gourmandise ou par bêtise, avec lui c’est pareil. »',
      '« Sans ancre, le désert dérive. Dans neuf jours, la première dune enjambe les remparts. Il faut descendre au sillage du Ver, le faire remonter, et lui reprendre la perle — de gré, de force, ou de ruse. Je connais ses trous de chasse. Buvez. Après, on ne boira plus. »',
    ],
    ep1: { stat: 'vit', texte: 'La traversée du Grand Plat : quatre heures de fournaise sans une ombre, sur un sable qui bouge sous les semelles comme un dos qui respire.', ok: 'Vous marchez au rythme des caravaniers — lent, égal, économe. Au bout du Plat, Naïla hoche la tête, ce qui chez elle vaut un triomphe. Dans un puits neuf : le chargement d’une caravane engloutie.', ko: 'La fournaise gagne. Les dernières lieues se font tête basse, gourdes vides, et le sable vous vole votre sueur au passage.' },
    combat1: 'Des bandits des dunes surgissent d’un pli de sable — les sinistrés du désert qui marche, devenus charognards.',
    dilemme: {
      texte: '« Le Ver chasse à la vibration, » explique Naïla en plantant son bâton. « On peut lui monter un leurre : les tambours d’eau de ma grand-mère, enterrés au bon endroit — il remontera où NOUS voulons, déjà à moitié étourdi. Mais poser les tambours, c’est danser sur son garde-manger. Sinon : on tape du pied et on l’attend en priant. »',
      optA: { stat: 'agi', texte: '🥁 Poser les tambours d’eau en silence', detail: 'le Ver remontera sonné, au lieu choisi', resultat: 'Vous enterrez les tambours en quinconce, sur la pointe des pieds, pendant que le sol frémit sous vos semelles. La dernière outre vibre juste — le piège est une partition, et elle est prête.' },
      optB: { texte: '🦶 Taper du pied et l’attendre de face', detail: 'franc, brave, et très déconseillé', resultat: 'Vous frappez le sable en cadence. La réponse monte des profondeurs comme un train de marchandises — vous aurez voulu la manière forte.' },
    },
    tresor: { titre: '🏺 La cache de la sixième génération', texte: 'Naïla déterre l’une des caches familiales : eau scellée à la cire, dattes de dix ans, et la part d’or que chaque génération laisse « pour celle qui aura moins de chance ».' },
    combat2: 'Les élémentaires de sable du sillage se dressent — le Ver approche, et son escorte déblaie le terrain.',
    ep2: { stat: 'for', texte: 'Le sol s’ouvre sur le sillage frais du Ver : un toboggan de sable coulant. Il faut s’arrimer les uns aux autres et REMONTER la pente vivante avant qu’elle ne se referme.', ok: 'Bras sur bras, sangle sur sangle, vous remontez le sable qui coule comme on remonte un fleuve. Le désert vous recrache à l’air libre — vexé, mais beau joueur : une géode de perles roule à vos pieds.', ko: 'Le sable gagne du terrain sur vos coudes. Vous vous en arrachez de justesse, les poumons pleins d’Ambrezine — le désert garde vos gourdes en péage.' },
    avantBoss: '« Il arrive. Sentez ? » Naïla pose une main à plat sur le sol qui tremble. « Règle des caravanes : on ne fuit pas un Ver, on le fatigue. Visez la gorge quand il crache la perle pour frapper — c’est son seul instant nu. Et si je crie “gauche”… c’est qu’il fallait déjà y être. »',
    boss: {
      nom: 'Le Ver Ambrezine, l’Avaleur de Routes', intro: 'Le sable explose en geyser et le Ver colossal jaillit à la verticale, anneaux luisants de nacre — au fond de sa gorge, une lueur ronde et laiteuse : la perle-mère, qui éclaire son gosier comme une lune avalée.',
      annonce: '🥁 Les tambours d’eau battent sous le sable : le Ver, saoulé de vibrations, frappe à côté de son propre rythme !',
      phase: '💠 La perle-mère s’embrase dans sa gorge : le Ver crache des rafales de sable vitrifié !',
      enrage: '⚠️ Le Ver sent la ville toute proche : il veut finir son repas et reprendre sa route — à travers vous !',
    },
    fins: {
      variante: 'Étourdi par les tambours, le Ver crache la perle-mère presque poliment avant de plonger bouder dans les profondeurs. La perle roule, s’arrête, et le désert entier S’ARRÊTE avec elle — les dunes se rasseyent comme un troupeau au repos. Naïla la remet au Dessous par le puits rituel de sa grand-mère : « Chaque chose à sa place. Surtout les grosses. »',
      defaut: 'Le Ver s’effondre en travers de son propre sillage et rend la perle-mère dans un hoquet sismique. À l’instant où elle touche le sable, les dunes cessent de marcher — on entend le désert se taire, ce qui est un son en soi. La ville-oasis ne saura jamais à quoi elle a échappé. Naïla si : elle rebaptise sa piste « la Route des Têtus ».',
    },
    relique: { nom: 'Éclat de la Perle-Mère', emoji: '💠', bonus: { vit: 5, for: 3, blocage: 2, pvMax: 24 }, desc: 'Un fragment qui ancre celui qui le porte. Récompense de « La Perle du Dessous ».' },
  },
  {
    zone: 'pics', nom: 'Le Chant du Blizzard', emoji: '🎶', statAcces: 'int',
    pnj: { nom: 'Père Igal l’ermite', emoji: '🧊' },
    resume: 'L’Élémentaire ancien a appris à chanter. Chaque note gèle une vallée de plus — et il répète pour un concert.',
    scenes: [
      'Les Pics Gelés ont toujours hurlé de vent. Mais depuis peu, le vent tient une NOTE — longue, juste, terriblement belle. Et chaque nuit de chant, une vallée de plus se réveille sous dix pieds de glace bleue.',
      '« Il a appris ça d’un rossignol gelé, » raconte Père Igal, l’ermite du refuge, en servant une soupe qui fume comme une forge. « L’Ancien. L’élémentaire des sommets. Mille ans de silence, et un beau matin : la musique. Le problème, c’est que sa voix EST le blizzard. Quand il chante, le monde s’arrête de bouger. Littéralement. »',
      '« Il prépare un “grand concert” au sommet — s’il le donne, le gel descendra jusqu’aux plaines. Je lui ai parlé, une fois : il ne veut pas nuire, il veut être ÉCOUTÉ. Alors soit vous lui apprenez la différence, soit vous le faites taire. Prenez la soupe. Là-haut, même les larmes gèlent. »',
    ],
    ep1: { stat: 'int', texte: 'La montée du Grand Orgue : un champ de cheminées de glace qui résonnent au moindre pas. Une seule harmonique fausse, et l’avalanche répond. Il faut lire les résonances et poser chaque pas sur la bonne note.', ok: 'Vous gravissez le champ comme une partition, de silence en silence. À mi-pente, une cheminée creuse abrite le traîneau d’un colporteur gelé — sa marchandise a très bien vieilli.', ko: 'Un talon sonne un demi-ton trop haut. Le Grand Orgue vous répond par un pan de neige entier — vous finissez la montée en nageant dans la poudreuse.' },
    combat1: 'Des loups des glaces débouchent d’une combe — le chant de l’Ancien les rend fous, et vous êtes plus tièdes que la neige.',
    dilemme: {
      texte: '« L’Ancien répète avec un chœur, » explique Igal en désignant trois silhouettes de givre sur l’arête. « Ses “élèves” — des élémentaires qu’il a accordés de force. Sans chœur, son concert perd sa puissance. On peut les désaccorder un à un, si on comprend leur gamme. Ou passer au large et affronter la voix pleine. »',
      optA: { stat: 'int', texte: '🎼 Désaccorder le chœur de givre', detail: 'le concert de l’Ancien perdra sa force', resultat: 'Vous touchez chaque élève d’une pichenette calculée — un quart de ton, pas plus. Le chœur répète toujours, mais désormais il grince aux entournures. L’Ancien fronce le blizzard sans comprendre.' },
      optB: { texte: '🏔️ Passer l’arête au large du chœur', detail: 'plus court, mais le froid mord double', resultat: 'Vous longez l’arête à distance du chœur. Le vent y est une lame sans fourreau — vous arrivez entiers, mais le gel a pris sa dîme.' },
    },
    tresor: { titre: '❄️ Le vestiaire des auditeurs', texte: 'Une grotte tapissée de givre où l’Ancien « garde » ceux qui se sont arrêtés pour écouter : leurs affaires, du moins. Fourrures, fioles préservées par le froid, et bourses que plus personne ne réclamera.' },
    combat2: 'Deux élémentaires de givre et un yéti de scène — la sécurité du concert vous prie de présenter vos billets.',
    ep2: { stat: 'vit', texte: 'La dernière longueur se fait dans le souffle même de l’Ancien qui s’échauffe : un couloir de blizzard pur où chaque pas coûte un battement de cœur. Tenir. Avancer. Ne pas s’endormir.', ok: 'Vous avancez soudés, chacun dans le dos de l’autre, en comptant les pas à voix haute pour rester éveillés. Le couloir cède d’un coup — le silence du sommet est presque assourdissant.', ko: 'Le froid vous vole des minutes entières — vous “réveillez” un camarade qui marchait endormi. Le sommet arrive comme une délivrance, mais le blizzard a mordu profond.' },
    avantBoss: '« Le voilà. Mon vieux voisin. » Igal plante son bâton dans la neige du sommet. « Rappelez-vous : il ne hait personne. Il veut un public. Alors écoutez-le VRAIMENT une mesure — puis montrez-lui ce que sa musique fait au monde. S’il refuse de l’entendre… la soupe attendra les survivants. »',
    boss: {
      nom: 'L’Ancien, Voix du Blizzard', intro: 'Au sommet du monde, une silhouette de glace vive se tourne vers vous — et s’INCLINE, comme un maestro devant sa salle. « Public, » chante l’Ancien, et le mot gèle en tombant. « Enfin. Le concert peut commencer. »',
      annonce: '🎼 Son chœur désaccordé grince derrière lui : l’Ancien, distrait par les fausses notes, frappe à contretemps !',
      phase: '🎶 L’Ancien attaque son grand air : le blizzard devient mélodie, et la mélodie devient lame !',
      enrage: '⚠️ Le final approche : l’Ancien chante à pleine voix, et la montagne gèle en mesure !',
    },
    fins: {
      variante: 'À la dernière note du chœur grinçant, l’Ancien s’interrompt — et ÉCOUTE, pour la première fois, ce que sa musique fait : les craquements de la glace, le silence des vallées mortes. Il baisse sa voix jusqu’au murmure… et le blizzard devient une berceuse qui fait fondre, doucement, ce qu’il avait figé. Igal l’applaudit seul, debout dans la neige : « Bravo. C’était ta plus belle. »',
      defaut: 'L’Ancien vacille, sa voix se brise — et dans le silence qui suit, il entend enfin le monde : le vent nu, l’eau qui recommence à couler. Il reste immobile un long moment. Puis il redescend d’une octave, pour toujours. Les vallées dégèleront au printemps. Igal vous ressert de la soupe : « Les critiques les plus durs font les meilleurs élèves. »',
    },
    relique: { nom: 'Diapason de Givre', emoji: '🎶', bonus: { int: 6, vit: 3, pmMax: 22 }, desc: 'Il sonne juste par −40°. Récompense du « Chant du Blizzard ».' },
  },
  {
    zone: 'profondeurs', nom: 'La Veille du Gardien', emoji: '⚱️', statAcces: 'for',
    pnj: { nom: 'Talpa la cartographe', emoji: '⛏️' },
    resume: 'Le Gardien éternel ne dort plus — et un gardien insomniaque creuse. Vers la surface. En comptant à voix haute.',
    scenes: [
      'Au Cœur des Profondeurs, les secousses ont changé de rythme. Les mineurs des étages hauts entendent, dans la roche, quelque chose d’impossible : une voix minérale qui COMPTE. « Neuf cent douze. Neuf cent treize. » Et qui monte.',
      '« Le Gardien éternel a une consigne vieille comme le monde : veiller sur le Cœur en dormant d’un œil, » explique Talpa, naine cartographe, en déroulant des plans couverts de ratures fraîches. « Sauf qu’il ne dort PLUS. Quelque chose a volé son sommeil — et un Gardien insomniaque, ça tourne en rond. Puis ça creuse. Il compte les couches de roche jusqu’à la surface. »',
      '« Mes cartes deviennent fausses à mesure qu’il creuse — regardez, ce tunnel n’existait pas ce matin. S’il émerge, le Cœur reste sans gardien ET une montagne se lève au milieu des Royaumes. Trouvons ce qui lui a volé le sommeil. Et rendons-le. »',
    ],
    ep1: { stat: 'for', texte: 'Le nouveau tunnel du Gardien est un boyau de roche encore chaude, à moitié effondré derrière lui. Il faut forcer les mâchoires de pierre l’une après l’autre pour suivre sa trace.', ok: 'Vous écartez les mâchoires de roche comme des portes récalcitrantes. Dans une poche de quartz : le fourbi d’un mineur d’il y a mille ans, conservé au chaud — sa lampe brûle encore.', ko: 'Une mâchoire se referme d’un cran au mauvais moment. Tout le monde passe — mais la montagne vous a pincés au passage, histoire de rappeler qui est chez qui.' },
    combat1: 'Des ombres profondes remontent le tunnel à contre-sens — délogées de leur nid par le passage du Gardien, et d’une humeur assortie.',
    dilemme: {
      texte: '« J’ai trouvé, » souffle Talpa devant une paroi gravée. « Le sommeil du Gardien était gardé dans une amphore de basalte — l’Amphore des Mille Nuits. Des pillards l’ont ouverte il y a un mois : le sommeil s’est répandu dans le filon d’or. On peut le récolter goutte à goutte — travail d’orfèvre. Ou récupérer l’amphore vide et espérer que le symbole suffira. »',
      optA: { stat: 'int', texte: '💤 Récolter le sommeil dans le filon', detail: 'rendre au Gardien ses Mille Nuits', resultat: 'Goutte de nuit après goutte de nuit, vous récoltez le sommeil épandu — il pèse froid dans l’amphore, comme du mercure de velours. Le filon d’or, lui, se réveille : tant pis, il dormait depuis assez longtemps.' },
      optB: { texte: '🏺 Reprendre l’amphore vide aux pillards', detail: 'plus simple — mais un symbole vide reste vide', resultat: 'Vous reprenez l’amphore aux pillards endormis — ils ronflent du sommeil volé, c’est d’une ironie que Talpa note pour ses mémoires. L’amphore est vide, mais elle est LÀ.' },
    },
    tresor: { titre: '⛏️ Le camp des pillards ronfleurs', texte: 'Les pillards dorment du sommeil d’un autre — autour d’eux, tout ce qu’ils ont pillé en un mois d’insomnie du Gardien : minerais rares, reliques du Cœur, et l’or d’un filon qui ne dort plus.' },
    combat2: 'Les golems anciens du protocole barrent l’escalier du Cœur : sans Gardien endormi à protéger, ils appliquent la consigne par défaut — personne ne passe.',
    ep2: { stat: 'vit', texte: 'La chambre du Cœur bat à découvert — chaque pulsation est une vague de chaleur qui plaque au sol. Il faut traverser entre deux battements, et le Cœur bat VITE quand il est inquiet.', ok: 'Vous traversez en trois sprints calés sur le pouls du monde. Au centre, le socle vide du Gardien vous attend — et la chaleur elle-même semble s’écarter, reconnaissante qu’on vienne enfin recoucher son veilleur.', ko: 'Un battement vous prend à mi-course : la vague de chaleur vous roule au sol comme des feuilles. Vous atteignez le socle en rampant, les sourcils en moins.' },
    avantBoss: '« Le voilà. Neuf mille et quelque couches de roche, et il compte toujours. » Talpa replie ses cartes inutiles. « Plan simple : on l’épuise, et au moment où il titube — l’amphore. On ne tue pas un Gardien. On le BORDE. C’est plus dur. »',
    boss: {
      nom: 'Le Gardien éternel, l’Insomniaque', intro: 'Il émerge de son propre tunnel, colossal, les yeux de braise cernés d’obsidienne — un monument qui n’a pas dormi depuis un mois. « Neuf mille quatre cent trois, » gronde-t-il en vous voyant. « Encore des cailloux qui bougent. Je compterai APRÈS vous. »',
      annonce: '💤 L’amphore des Mille Nuits embaume la chambre : le Gardien titube, ses paupières de pierre pèsent des tonnes !',
      phase: '⚱️ Le Gardien délire d’épuisement : il frappe les souvenirs de mille ans de veille — et vous êtes dedans !',
      enrage: '⚠️ Le Gardien refuse de tomber : un veilleur ne dort pas en service, dût-il s’effondrer debout !',
    },
    fins: {
      variante: 'Au dernier coup, vous descellez l’amphore pleine — et les Mille Nuits se déversent sur le Gardien comme une marée bleue. Il s’assoit. Il bâille (les stalactites tombent). Il se recouche sur son socle en murmurant « …un. » Le Cœur reprend son rythme de croisière. Talpa redessine ses cartes une dernière fois et écrit, en marge : « Ici dort quelqu’un de bien. »',
      defaut: 'Le Gardien s’effondre à genoux, vaincu par vous et par un mois de veille — et s’endort AVANT de toucher le sol, d’un sommeil brut, sans amphore, gagné à la loyale. Vous le roulez sur son socle à huit bras (Talpa dirige la manœuvre). Le Cœur bat plus doux aussitôt. En repartant, personne ne parle fort. On ne réveille pas ce qu’on a eu tant de mal à coucher.',
    },
    relique: { nom: 'Goutte des Mille Nuits', emoji: '💤', bonus: { for: 5, vit: 5, pvMax: 30 }, desc: 'Un fragment de sommeil minéral : qui la porte se repose même en marchant. Récompense de « La Veille du Gardien ».' },
  },
  {
    zone: 'jungle-vai', nom: 'La Mue Royale', emoji: '🐍', statAcces: 'agi',
    pnj: { nom: 'Kaï le chasseur de lianes', emoji: '🏹' },
    resume: 'La Matriarche Sarpense mue — et sa vieille peau, imprégnée de mille ans de venin, se relève derrière elle. Il y aura bientôt DEUX reines.',
    scenes: [
      'La Jungle de Vaï-Sombre s’est tue — et quand la jungle se tait, les anciens disent qu’elle retient sa respiration. Au cœur des lianes, la Matriarche Sarpense a entamé sa Mue Royale, la première depuis un siècle.',
      '« Le problème n’est pas la mue, » murmure Kaï, accroupi sur une branche comme chez lui. « Le problème, c’est la PEAU. Mille ans de venin, de mémoire et de rancune imprégnés dedans. On raconte qu’une mue royale abandonnée se relève au bout de neuf jours. On est au huitième. »',
      '« Deux reines, une jungle : ça finit en guerre de territoire, et nous au milieu. Il faut brûler la vieille peau avant qu’elle ne marche — ou convaincre la Matriarche de la dévorer elle-même, comme l’exige l’ancienne coutume qu’elle a “oubliée”. Suivez mes marques. Et ne touchez à RIEN de brillant. »',
    ],
    ep1: { stat: 'agi', texte: 'La piste de Kaï traverse la canopée : trente mètres au-dessus du sol, de liane en liane, sur des branches que la sève de mue rend glissantes comme du verre huilé.', ok: 'Vous volez de prise en prise sur les traces de Kaï, qui finit par cesser de se retourner pour vérifier — son plus grand compliment. Dans un nid de feuilles : le carquois perdu de son maître, intact.', ko: 'Une branche vernie de sève se dérobe. La canopée vous fait la courte échelle à l’envers — étage par étage, jusqu’au tapis de fougères qui amortit mal.' },
    combat1: 'Des panthères d’ombre débouchent des fourrés — la mue a chassé tous les prédateurs du cœur de la jungle vers vos mollets.',
    dilemme: {
      texte: '« La coutume dit : la reine dévore sa mue pour rester UNE, » explique Kaï. « La Matriarche l’a “oubliée” par orgueil — sa mue est son plus beau trophée. On peut lui rappeler la coutume à la manière du peuple-liane : en déposant l’offrande de cendre au seuil de son nid. Ou on brûle la peau nous-mêmes et on assume l’insulte. »',
      optA: { stat: 'cha', texte: '🕯️ Déposer l’offrande de cendre', detail: 'rappeler la coutume sans insulter la reine', resultat: 'Vous déposez la cendre en spirale, comme Kaï vous le souffle geste à geste. Du nid monte un long sifflement — pas de la colère : de la honte. La coutume est rappelée. La reine réfléchit.' },
      optB: { texte: '🔥 Brûler la vieille peau sans cérémonie', detail: 'radical — et la reine le prendra TRÈS mal', resultat: 'La vieille peau brûle en crachant des vapeurs de venin centenaire qui vous piquent les yeux et les poumons. De la jungle entière monte un sifflement de fureur : l’insulte est enregistrée.' },
    },
    tresor: { titre: '🌺 Le reposoir des offrandes', texte: 'Le peuple-liane dépose ici depuis des siècles ses présents à la reine : orchidées cristallisées, venins rares en fioles de bambou, et l’or des marchands trop curieux.' },
    combat2: 'Les hommes-lianes gardiens du nid se déplient des troncs — la Mue Royale ne se dérange pas, quel que soit le motif.',
    ep2: { stat: 'vit', texte: 'Le dernier rideau de jungle est saturé du venin de mue en suspension : une brume verte qui brûle la gorge et fait danser des taches devant les yeux. Traverser, sans respirer trop, sans tomber du tout.', ok: 'Vous traversez la brume verte au rythme des chasseurs : trois pas, une pause sous une feuille-cloche, trois pas encore. De l’autre côté, l’air pur donne le vertige — mais vous êtes entiers.', ko: 'La brume vous prend à la gorge à mi-chemin. Vous émergez titubants, les veines pleines de fourmis, sous le regard navré de Kaï qui respire, lui, par une paille de bambou.' },
    avantBoss: '« La voilà. Neuve. » Kaï encoche une flèche sans la lever. « Rappelez-vous : on ne bat pas une Sarpense à la vitesse. On la bat à la PATIENCE. Elle frappe, on n’y est plus ; elle enroule, on est déjà ailleurs. Et si elle vous parle — c’est qu’elle gagne du temps pour sa peau. »',
    boss: {
      nom: 'Sarpense, Peau-Neuve', intro: 'Elle coule du nid comme une rivière d’écailles fraîches, éclatante, trop neuve — et derrière elle, dans l’ombre, quelque chose de pâle et de creux commence à se soulever. « Ma mue est MON héritage, » siffle Sarpense. « Personne n’y touchera. Pas même moi. »',
      annonce: '🕯️ L’offrande de cendre fume au seuil du nid : la coutume pèse sur chaque coup de la reine — frapper des invités rituels lui coûte !',
      phase: '🐍 La vieille peau se soulève dans l’ombre et SIFFLE avec elle : Sarpense frappe pour deux, terrifiée de sa propre mue !',
      enrage: '⚠️ Le neuvième jour s’achève : si le combat dure, la mue marchera — Sarpense veut en finir MAINTENANT !',
    },
    fins: {
      variante: 'Vaincue, Sarpense rampe vers sa vieille peau qui déjà se soulève — et, dans un dernier sursaut d’orgueil inversé, la DÉVORE, anneau par anneau, comme l’exige la coutume rappelée. La jungle entière expire. Il n’y aura qu’une reine, et elle vous doit sa couronne. Kaï taille une encoche neuve dans son arc : « Première fois que je marque une victoire sans flèche. »',
      defaut: 'Sarpense s’effondre entre vous et sa mue — et la vieille peau, privée du venin frais qu’elle pompait à sa reine, retombe en poussière d’écailles avec un soupir de siècle. La Matriarche, humiliée mais vivante, se love au fond de son nid pour cent ans de bouderie. La jungle rouvre ses bruits un à un, prudemment, comme on rallume des lampes.',
    },
    relique: { nom: 'Écaille de la Mue Royale', emoji: '🐍', bonus: { agi: 7, vit: 4, esquive: 3, pvMax: 26 }, desc: 'Une écaille de la première heure, souple et impénétrable. Récompense de « La Mue Royale ».' },
  },
  {
    zone: 'falaises-hurlantes', nom: 'L’Œuf de Foudre', emoji: '🥚', statAcces: 'vit',
    pnj: { nom: 'Perrin la vigie', emoji: '🔭' },
    resume: 'Le Rokh Tempétueux couve un œuf de tempête pure. À l’éclosion : un ouragan avec un bec. Il reste trois jours.',
    scenes: [
      'Les Falaises Hurlantes hurlent des noms — c’est leur habitude. Mais depuis trois nuits, elles hurlent tous le MÊME mot, dans toutes les langues du vent : « éclosion ».',
      '« Là-haut. Le grand nid. » Perrin, vigie des falaises, tend sa lunette rafistolée : au sommet du plus haut pic, entre des branches grosses comme des mâts, une lueur pulse au rythme d’un orage enfermé. « Le Rokh couve. Pas un œuf d’oiseau — un œuf de TEMPÊTE. Il a niché sur un nuage d’orage et l’a pondu en dur, si vous voulez mon avis technique. »',
      '« À l’éclosion, ce qui sortira n’aura ni faim ni pitié : juste du vent et de la foudre avec un bec. Trois jours, d’après la pulsation. Il faut monter, passer le père, et décider quoi faire de l’œuf — le percer, le refroidir, ou le faire éclore AILLEURS. Moi je monte pas : quelqu’un doit noter ce qui vous arrive. C’est le métier. »',
    ],
    ep1: { stat: 'vit', texte: 'L’ascension des Falaises se fait DANS le vent qui hurle : chaque corniche est un gué de rafales, chaque prise un pari contre une bourrasque nommée. Il faut encaisser et monter quand même.', ok: 'Vous montez entre les rafales comme entre les gouttes, plaqués, patients, imperturbables. À mi-paroi, coincé dans une faille, le sac d’un monte-en-l’air que le vent a gardé en consigne.', ko: 'Une bourrasque vous décolle du rocher et vous rend trois mètres plus bas, dans un buisson d’épines providentiel et rancunier.' },
    combat1: 'Des harpies hurlantes fondent sur vous — le père Rokh sous-traite la sécurité du nid, et elles sont payées au cri.',
    dilemme: {
      texte: '« Le Rokh quitte le nid une fois par jour pour chasser l’orage frais, » observe Perrin depuis sa lunette, d’en bas, par signaux de miroir. « On peut monter PENDANT sa chasse — mais il faut d’abord occuper les gargouilles-vigies qui préviennent au moindre caillou. Quelqu’un de costaud peut décrocher leur perchoir. Sinon : montée directe, et le père rentrera en cours de route. »',
      optA: { stat: 'for', texte: '🪨 Décrocher le perchoir des vigies', detail: 'monter pendant la chasse du Rokh, sans alerte', resultat: 'Vous descellez le perchoir de guet d’une poussée d’épaule calculée — les gargouilles, trop occupées à retenir leur balcon, oublient de prévenir qui que ce soit. La voie du nid est libre… et le père est loin.' },
      optB: { texte: '🧗 Monter en direct, tant pis pour l’alerte', detail: 'rapide — mais le père rentrera furieux', resultat: 'Vous montez à découvert. Les gargouilles s’époumonent, les falaises relaient — et quelque part au-dessus des nuages, un cri de père répond. Il sait. Il arrive.' },
    },
    tresor: { titre: '🪶 Le garde-manger du Rokh', texte: 'Une vire aménagée en cellier : le Rokh y entrepose ce qu’il chipe aux orages — cristaux hurleurs, plumes de rechange, et les bagages entiers d’une expédition qui volait trop bas.' },
    combat2: 'Deux élémentaires de bourrasque descendent en vrille — l’avant-garde du père qui rentre, l’orage frais encore aux serres.',
    ep2: { stat: 'int', texte: 'Le nid, enfin : l’œuf de foudre pulse entre les branches-mâts, cerné d’arcs électriques qui sautent au hasard. Il faut lire le rythme des éclairs pour l’approcher — une erreur de mesure, et la foudre écrit votre nom.', ok: 'Vous comptez les pulsations comme Perrin vous l’a appris par miroir : « un-deux-PAUSE-toucher ». L’œuf se laisse approcher, tiède et grondant, presque confiant.', ko: 'Un arc saute un demi-temps trop tôt et vous mord tous — cheveux debout, cœurs affolés. L’œuf, lui, a très bien senti que vous étiez là.' },
    avantBoss: '« Il arrive, » clignote frénétiquement le miroir de Perrin depuis le bas. « GRAND. COLÈRE. NUAGE PAS CONTENT NON PLUS. Décidez pour l’œuf APRÈS — d’abord, survivez au père. Et si tout va mal : sautez, le vent des Falaises n’a jamais laissé tomber personne d’intéressant. »',
    boss: {
      nom: 'Le Rokh Tempétueux, Père-Couveur', intro: 'Il crève le plafond de nuages en piqué, l’orage frais encore vivant dans les serres, et se pose en travers du nid dans un tonnerre de plumes : le Rokh Tempétueux couvre son œuf d’une aile et vous désigne de l’autre. Le procès sera bref.',
      annonce: '🪨 Aucune vigie ne l’a prévenu : le Rokh rentre à froid, sans son orage d’élan, et frappe encore en retard sur sa propre colère !',
      phase: '⛈️ Le Rokh déchire son orage de chasse et s’en fait une armure : la foudre frappe avec chaque coup d’aile !',
      enrage: '⚠️ L’œuf pulse de plus en plus vite : l’éclosion approche, et le père combat comme un ciel qui tombe !',
    },
    fins: {
      variante: 'Le Rokh ploie, épuisé — et vous laisse approcher de l’œuf sans un cri : il a compris ce que vous avez compris. Ensemble (lui portant, vous guidant par les pulsations), vous déménagez l’œuf de foudre jusqu’au grand nuage-enclume du large, où une tempête peut naître sans raser personne. L’éclosion, cette nuit-là, ressemble à un feu d’artifice poli. Perrin note tout, en tremblant d’aise : « Meilleure garde de ma carrière. »',
      defaut: 'Le père tombe en vrille contrôlée jusqu’à une vire basse, vaincu mais vivant — et l’œuf, privé de sa chaleur d’orage, refroidit doucement en un cristal de foudre inerte et magnifique. Les falaises cessent de hurler « éclosion » et reprennent leur répertoire habituel d’insultes au vent. Perrin grave la date sur sa lunette : « Le jour où le ciel n’est pas tombé. »',
    },
    relique: { nom: 'Coquille de l’Œuf de Foudre', emoji: '⚡', bonus: { vit: 6, agi: 5, blocage: 3, pvMax: 28 }, desc: 'Un éclat de coquille qui gronde quand le danger approche. Récompense de « L’Œuf de Foudre ».' },
  },
  {
    zone: 'abysses-emeraude', nom: 'Les Lanternes Noyées', emoji: '🏮', statAcces: 'int',
    pnj: { nom: 'Ondine l’allumeuse', emoji: '🧜‍♀️' },
    resume: 'Le Léviathan gobe une à une les lanternes éternelles de la cité engloutie. Quand la dernière s’éteindra, ce qui vit dans le noir remontera.',
    scenes: [
      'Les Abysses d’Émeraude brillent depuis mille ans : les lanternes de la cité engloutie ne s’éteignent jamais — c’était le marché passé avec la lumière. Mais depuis une lune, il y a des trous dans la ville. Des quartiers entiers de nuit.',
      '« C’est le Léviathan. Il les GOBE. » Ondine, allumeuse de lanternes de mère en fille, serre sa perche à mèche comme une lance. « Pas par faim — par chagrin. Sa compagne dort dans la fosse centrale depuis le grand éboulement, et il éteint la ville pour qu’elle croie la nuit venue. Pour qu’elle dorme mieux. C’est idiot. C’est magnifique. Ça va tous nous tuer. »',
      '« Parce que dans le noir des Abysses vit autre chose — des choses d’avant les lanternes, qui remontent à mesure que la lumière recule. Il reste onze lanternes. Aidez-moi à les rallumer en chemin, et au bout… il faudra parler au Léviathan. Ou l’éteindre, lui. »',
    ],
    ep1: { stat: 'int', texte: 'Rallumer une lanterne éternelle n’est pas craquer une allumette : chaque mèche noyée exige la formule de son quartier — Ondine connaît les mots, mais les gestes se lisent dans les gravures effacées. À vous de les déchiffrer.', ok: 'Vous reconstituez les gestes gravés — la spirale, le doigt sur le verre, le souffle inversé. Trois lanternes rallument leur quartier d’un coup, et dans la lumière revenue, un coffre de tribut attendait depuis l’éboulement.', ko: 'Un geste inversé : la lanterne rallume, mais en flamme NOIRE, et il faut la souffler en urgence pendant qu’Ondine jure dans une langue de corail. Le quartier reste gris ; vos nerfs aussi.' },
    combat1: 'Des murènes rôdeuses jaillissent d’un quartier éteint — elles ont déjà pris leurs habitudes dans le noir neuf.',
    dilemme: {
      texte: '« La compagne du Léviathan, » hésite Ondine devant la fosse centrale. « Elle ne dort pas d’un éboulement, en vrai. Elle dort d’une lanterne avalée — la Première Lanterne, celle du marché originel. Elle brûle DANS elle. On peut plonger la chercher au fond de la fosse — c’est le territoire du chagrin du Léviathan. Ou continuer vers lui et régler ça à la surface des choses. »',
      optA: { stat: 'int', texte: '🏮 Plonger chercher la Première Lanterne', detail: 'réveiller la compagne — et désarmer le chagrin', resultat: 'Au fond de la fosse, dans le grand corps endormi, la Première Lanterne brûle comme un cœur prêté. Vous la guidez vers la gueule ouverte — et la compagne EXPIRE la lumière, la rendant à la ville… en ouvrant un œil immense et embué.' },
      optB: { texte: '🌊 Remonter affronter le Léviathan', detail: 'plus direct — le chagrin restera entier', resultat: 'Vous laissez la fosse à son secret et remontez le long des quartiers éteints. Le noir vous suit du regard — il a déjà des yeux, à ce stade.' },
    },
    tresor: { titre: '🐚 La réserve des allumeuses', texte: 'La cache de la corporation d’Ondine : mèches de sirène, huile de lune en amphores scellées, et mille ans de pourboires que la mer a arrondis en perles.' },
    combat2: 'Les sirènes funestes du culte du Noir Nouveau vous barrent l’avenue centrale — elles préfèrent la ville éteinte, on y chante mieux.',
    ep2: { stat: 'cha', texte: 'L’avenue des Onze Lanternes, dernière ligne de lumière : pour la traverser sous les yeux du Léviathan qui rôde, il faut porter la flamme d’Ondine SANS trembler — la flamme éternelle sent la peur et s’éteint pour de bon.', ok: 'Vous portez la flamme d’une main de marbre, en soutenant le regard du grand œil qui passe et repasse derrière les vitraux noyés. La flamme ne vacille pas d’un cil. Le Léviathan non plus — mais lui, c’est du respect.', ko: 'À mi-avenue, le grand œil passe TOUT PRÈS et la flamme sursaute avec vous — Ondine la rattrape d’un geste de perche, au prix d’une mèche entière et de dix ans de votre vie.' },
    avantBoss: '« Le voilà. Mon plus vieux client. » Ondine lève sa perche comme un étendard minuscule. « Rappelez-vous : il n’est pas méchant, il est en deuil de quelqu’un qui n’est pas mort. C’est la pire sorte. Rallumez-le de force s’il le faut — mais si elle se réveille, LAISSEZ-LES. »',
    boss: {
      nom: 'Le Léviathan, l’Éteigneur', intro: 'Il émerge de la grande nuit entre deux quartiers morts — si vaste que la ville semble bâtie sur son ombre. Dans ses fanons, des dizaines de lanternes avalées brillent encore, comme un ciel gardé prisonnier. Le Léviathan vous regarde… et éteint la rue derrière vous, par principe.',
      annonce: '🏮 Un chant monte de la fosse centrale — ELLE est réveillée : le Léviathan frappe en se retournant sans cesse, le cœur ailleurs !',
      phase: '🌑 Le Léviathan avale la lumière du champ de bataille : vous combattez dans son crépuscule !',
      enrage: '⚠️ Plus que quelques lanternes : le Léviathan veut finir sa nuit — la vôtre y passera aussi !',
    },
    fins: {
      variante: 'Le chant de la fosse s’enfle — et le Léviathan s’immobilise en plein assaut, comme foudroyé de douceur. Sa compagne remonte dans un lever de lumière rendue, les onze quartiers rallumés dans son sillage. Ils se rejoignent au-dessus de la cité, deux montagnes qui dansent lentement, et les lanternes avalées ressortent une à une, replacées d’un coup de fanon presque délicat. Ondine pleure dans l’eau, ce qui ne se voit pas, et c’est très bien ainsi.',
      defaut: 'Le Léviathan ploie — et dans un hoquet de géologie, rend les lanternes avalées, qui remontent se raccrocher à leurs quartiers comme des abeilles au soir. La ville se rallume avenue par avenue. Le grand corps redescend vers la fosse, veiller son chagrin à l’ancienne : dans le noir de SES seuls yeux fermés. Ondine rallume la dernière mèche et souffle : « Le marché tient. La lumière reste. »',
    },
    relique: { nom: 'Première Mèche', emoji: '🏮', bonus: { int: 8, cha: 4, pmMax: 30 }, desc: 'Une mèche trempée dans la lumière du marché originel. Récompense des « Lanternes Noyées ».' },
  },
  {
    zone: 'steppe-cendres', nom: 'La Moisson Grise', emoji: '🌾', statAcces: 'for',
    pnj: { nom: 'Sacha le semeur de cendres', emoji: '🌫️' },
    resume: 'Le Béhémoth piétine les champs de cendre fertile selon un tracé précis : il dessine un sceau. À la dernière boucle, la steppe redeviendra volcan.',
    scenes: [
      'La Steppe des Cendres nourrit la moitié des Royaumes : sa cendre fertile fait pousser en un mois ce que la bonne terre rend en un an. Mais cette saison, les semis meurent en ligne. En LIGNES COURBES, précisément.',
      '« Regardez d’en haut, » dit Sacha, semeur de cendres, en dépliant un relevé cousu de ficelle. Les lignes mortes forment une spirale de trois lieues. « Le Béhémoth ne piétine pas au hasard : il DESSINE. C’est un sceau de réveil — le tracé qu’on gravait jadis pour rendormir le volcan, mais à l’envers. Il veut rendre la steppe à la lave. Sa version du grand ménage. »',
      '« Il lui reste la dernière boucle et le point central — le vieux cratère où mon clan sème depuis dix générations. On peut encore briser le tracé : retourner la cendre aux bons endroits, effacer avant qu’il ne referme. Prenez des pelles. Et de quoi frapper : il n’aime pas les gommes. »',
    ],
    ep1: { stat: 'for', texte: 'Effacer le sceau, c’est retourner la cendre compactée par un monstre de cent tonnes — au louchet, en ligne, VITE, avant le prochain passage de patrouille magmatique.', ok: 'Vous retournez la ligne morte comme un seul laboureur à huit bras. La cendre libérée reverdit presque à vue d’œil — et rend au passage ce qu’elle avait enseveli : le coffre de graines d’un clan parti trop vite.', ko: 'La cendre compactée résiste comme du béton jeune. Vous en venez à bout, mais les paumes en feu et le dos en points de suspension.' },
    combat1: 'Une patrouille magmatique — chacals de cendre en éclaireurs, ogre en contremaître — vient vérifier l’état du tracé.',
    dilemme: {
      texte: '« Le point central, » Sacha pose un doigt noir sur son relevé. « Mon cratère. On peut y semer la Contre-Moisson — le blé de cendre sacré de mon clan, qui scelle le sol pour cent ans. Mais semer sous les pas du Béhémoth, il faut du cœur au ventre. L’autre option : miner le tracé de bombes de terre et le briser au moment où il passera. Moins poétique. Plus bruyant. »',
      optA: { stat: 'vit', texte: '🌾 Semer la Contre-Moisson au point central', detail: 'sceller le sol pour cent ans — sous ses pas', resultat: 'Vous semez en croisant les allées, aux gestes que Sacha vous crie depuis la bordure — et le blé de cendre LÈVE en heures, racines comme des ancres. Le point central est verrouillé de vert. Le sceau ne se refermera pas ici.' },
      optB: { texte: '💣 Miner le tracé et attendre son passage', detail: 'briser la boucle sous ses propres pattes', resultat: 'Vous enterrez les charges de terre le long de la dernière boucle. Le sol de la steppe, complice, avale les mèches sans un pli. Il ne reste qu’à attendre le pas qui pèse.' },
    },
    tresor: { titre: '🌫️ Le grenier du clan des cendres', texte: 'Le silo enterré des dix générations : semences d’avant le volcan, outils au manche poli par les arrière-grands-mains, et la caisse commune que chaque génération jure de ne jamais toucher — Sacha vous en ouvre sa part.' },
    combat2: 'Deux salamandres de braise et un ogre magmatique déboulent en pompiers du sceau : quelque chose a effacé leur belle spirale, et ils veulent des noms.',
    ep2: { stat: 'cha', texte: 'Le Béhémoth approche du point central — le sol tangue à chaque pas. Sacha tend une poignée de cendre : « Coutume du clan : on jette la cendre au vent AVANT la bataille. Où elle retombe dit qui la terre soutient. Tentez votre chance. »', ok: 'La cendre jetée monte, tourne… et retombe en cercle parfait autour de VOS pieds. Sacha en lâche sa pelle : « Dix générations que je fais ça. Jamais vu la terre choisir aussi net. » Le sol lui-même semble plus ferme sous vos semelles.', ko: 'La cendre retombe n’importe comment, moitié sur vos têtes. Sacha grimace poliment : « La terre est… neutre. Disons neutre. » Vous éternuez gris pendant une heure.' },
    avantBoss: '« Le voilà. La montagne qui marche. » Sacha plante sa pelle comme une bannière. « Ne visez pas la carapace, c’est du basalte. Visez les jointures, là où la braise respire. Et rappelez-vous : chaque minute debout, c’est une ligne qu’il ne dessine pas. La steppe compte sur vos minutes. »',
    boss: {
      nom: 'Le Béhémoth, Pas-de-Famine', intro: 'Il franchit la crête du cratère comme une éclipse en marche — chaque pas imprime au sol un segment de sceau, précis, patient, irréversible. Le Béhémoth de Cendre baisse vers vous une tête de basalte fendue de braise : vous êtes SUR son dessin.',
      annonce: '🌾 La Contre-Moisson a levé au point central : le sceau est déjà brisé, et le Béhémoth frappe comme on rature — de rage, sans plan !',
      phase: '🌋 Le Béhémoth s’ouvre : la braise interne jaillit des jointures, et chaque pas met le feu à la cendre !',
      enrage: '⚠️ La lave gronde sous la steppe, appelée par le tracé presque clos : le Béhémoth veut finir son dessin sur vos cendres !',
    },
    fins: {
      variante: 'Le Béhémoth s’effondre au bord du champ de Contre-Moisson — et le blé de cendre, imperturbable, pousse DÉJÀ entre ses pattes, scellant le sol et son dessin inachevé pour cent ans. La braise de ses jointures pâlit jusqu’au rose des soirs calmes : rendormi, pas éteint. Le clan de Sacha sèmera l’an prochain jusque sur son dos — il paraît que la carapace fait d’excellentes terrasses.',
      defaut: 'Le Béhémoth ploie, recule — et contemple longuement son tracé béant, irréparable pour cette génération de lave. Alors il fait une chose que la steppe n’avait jamais vue : il efface LUI-MÊME le reste du sceau, à grands coups de flanc, avant de redescendre dans le vieux cratère dont il tire le rideau de basalte. Sacha jure d’y semer une bordure d’honneur. « Même les volcans ont droit à une seconde saison. »',
    },
    relique: { nom: 'Épi de la Moisson Grise', emoji: '🌾', bonus: { for: 7, vit: 5, pvMax: 34, poBonus: 0.04 }, desc: 'Un épi de blé de cendre : il pousse même dans une poche. Récompense de « La Moisson Grise ».' },
  },
  {
    zone: 'foret-petrifiee', nom: 'La Seconde Nuit', emoji: '🗿', statAcces: 'int',
    pnj: { nom: 'Lichen le demi-pétrifié', emoji: '🌿' },
    resume: 'Il y a mille ans, une nuit a changé la forêt en pierre. L’Avatar de Quartz prépare la Seconde — et cette fois, c’est le monde entier qu’il veut sculpter.',
    scenes: [
      'La Forêt Pétrifiée est un instantané : mille ans plus tôt, entre deux battements de cœur, tout y est devenu pierre — oiseaux en plein vol compris. Les savants appellent ça la Première Nuit. Ils pensaient le phénomène fini. Les statues d’oiseaux ont recommencé à CHANTER.',
      '« C’est le signe d’avant. Je le sais : j’y étais. » Lichen sort de sous un tronc de quartz — un druide dont la moitié gauche est de pierre depuis mille ans, la droite obstinément vivante. « L’Avatar recharge la Seconde Nuit au cœur de la forêt. La Première n’était qu’une esquisse, son “étude de silence”. La Seconde couvrira les Royaumes. Un monde entier, enfin PARFAIT : immobile. »',
      '« Il me manque une moitié pour l’arrêter seul — la vôtre fera l’affaire. Le chemin passe par les allées runiques : elles lisent les intentions, alors pensez à des choses ennuyeuses. Et si vous entendez battre un cœur de pierre… c’est le mien. Ne vous inquiétez que s’il S’ARRÊTE. »',
    ],
    ep1: { stat: 'int', texte: 'Les allées runiques scannent chaque esprit qui passe : il faut réciter mentalement des inventaires, des tables, des recettes — la moindre pensée d’héroïsme déclenche les glyphes de pétrification.', ok: 'Vous traversez en récitant des listes de courses d’une platitude héroïque. Les glyphes s’éteignent d’ennui un à un — et au bout de l’allée, un moissonneur runique désactivé tient encore sa récolte de la Première Nuit.', ko: 'Quelqu’un pense à la victoire une demi-seconde. Un glyphe s’embrase : votre botte gauche restera grise et raide une semaine — le reste a suivi de justesse.' },
    combat1: 'Des tréants pétrifiés s’arrachent à leur pose millénaire — l’Avatar réveille ses statues préférées pour l’accueil.',
    dilemme: {
      texte: '« Mon ancien cercle de druides est là, » dit Lichen devant une clairière de statues en ronde. « Pétrifiés en plein rituel de protection — leur sort est resté SUSPENDU à mi-mot depuis mille ans. Si quelqu’un d’assez savant achève leur incantation, leur bouclier se lèvera contre la Seconde Nuit. Mais un mot de travers et je perds mes amis en gravats. L’autre chemin contourne la clairière. Il est plus sûr. Il est plus seul. »',
      optA: { stat: 'int', texte: '📖 Achever l’incantation suspendue', detail: 'lever le bouclier des druides contre la Nuit', resultat: 'Vous reprenez l’incantation à la syllabe exacte où mille ans l’ont laissée. La ronde de statues s’illumine de vert tendre — leur bouclier se lève enfin, avec un millénaire de retard et toute sa force. Quelque part, l’Avatar sent son chef-d’œuvre contesté.' },
      optB: { texte: '🚶 Contourner la clairière en silence', detail: 'ne pas risquer les amis de Lichen', resultat: 'Vous passez au large de la ronde figée. Lichen touche chaque statue du bout de sa main vivante, en s’excusant à voix basse — le détour par les ronces de quartz vous taille au passage.' },
    },
    tresor: { titre: '💎 L’atelier de l’esquisse', texte: 'La « réserve de matériaux » de l’Avatar : ambre noir en blocs, sphères runiques ébauchées, et les affaires cristallisées de mille ans de visiteurs devenus « études préparatoires ».' },
    combat2: 'Un basilic runique et deux moissonneurs déboulent — l’atelier a son service de sécurité, et vous touchez aux œuvres.',
    ep2: { stat: 'vit', texte: 'Le cœur de la forêt baigne dans le pré-silence de la Seconde Nuit : un champ où TOUT ralentit — le sang, les pensées, les pas. Il faut traverser en maintenant son propre rythme, cœur contre pierre.', ok: 'Vous marchez en scandant vos pouls à voix haute, chacun le sien, un chœur de cœurs têtus. Le pré-silence recule devant tant de vacarme vital — Lichen rit de sa moitié vivante, et sa moitié de pierre sourit presque.', ko: 'Le ralenti vous gagne : trois pas prennent une heure, ou une seconde, impossible à dire. Vous vous arrachez du champ comme d’un rêve de mélasse, plus vieux d’on ne sait combien.' },
    avantBoss: '« Le voilà. Le Sculpteur. » La moitié de pierre de Lichen vibre comme un diapason. « Rappelez-vous : il ne hait pas la vie — il la trouve BROUILLONNE. Chaque coup que vous porterez de travers, chaque cri, chaque erreur : c’est ça, votre arme. Soyez vivants. Salement, bruyamment, magnifiquement vivants. »',
    boss: {
      nom: 'L’Avatar de Quartz, Sculpteur de Silence', intro: 'Il se déplie du cœur de la forêt — une géométrie parfaite de facettes où le monde entier se reflète immobile. L’Avatar de Quartz vous contemple, et dans chacune de ses faces, votre reflet est DÉJÀ une statue. « Tenez la pose, » dit-il sans bouche.',
      annonce: '📖 Le bouclier des druides pulse sur toute la forêt : chaque coup de l’Avatar doit d’abord traverser mille ans de protection réveillée !',
      phase: '💎 L’Avatar entame la Seconde Nuit en plein combat : le silence tombe par plaques, et où il tombe, la pierre suit !',
      enrage: '⚠️ L’Avatar renonce à la perfection : il sculptera VITE, tant pis pour les finitions !',
    },
    fins: {
      variante: 'L’Avatar se fissure — et le bouclier des druides s’engouffre dans chaque fente, semant du vert dans le quartz. Il ne meurt pas : il GERME. En une saison, disent déjà les druides libérés un à un de leur pose, l’Avatar deviendra la première statue-arbre — silence dehors, sève dedans. Lichen retrouve son cercle au complet. Sa moitié de pierre reste : « Souvenir de famille, » tranche-t-il.',
      defaut: 'L’Avatar s’effondre en gravier fin — et la Seconde Nuit, privée de son sculpteur, se dissout en une rosée grise qui fait briller la forêt sans la figer. Ici et là, une statue d’oiseau se secoue, ébouriffée, milléniale, et reprend son vol interrompu comme si de rien n’était. Lichen les regarde partir, sa moitié vivante trempée de larmes, sa moitié de pierre enfin tiède.',
    },
    relique: { nom: 'Facette du Sculpteur', emoji: '💎', bonus: { int: 9, vit: 5, blocage: 3, pmMax: 34 }, desc: 'Un fragment d’Avatar où votre reflet bouge — lui. Récompense de « La Seconde Nuit ».' },
  },
  {
    zone: 'vallee-geants', nom: 'Le Réveil des Aïeux', emoji: '🦴', statAcces: 'vit',
    pnj: { nom: 'Grimm le petit-fils', emoji: '🗿' },
    resume: 'Le Roi des Ossements sonne le rappel de TOUS les squelettes de géants. Grimm, dernier sang vivant des géants, refuse que ses aïeux servent de soldats.',
    scenes: [
      'La Vallée des Géants est un cimetière à ciel ouvert : les côtes des aïeux y font des arches, leurs crânes des collines. On y marche avec respect — c’est facile, tout y impose le respect. Depuis peu, la nuit, les arches BOUGENT.',
      '« Le Roi des Ossements sonne l’Olifant d’Os. » Grimm, trois mètres de charpente — un « petit » chez les géants, le dernier de leur sang — serre des poings comme des enclumes. « Chaque note réveille un aïeul. Il monte une armée avec MA famille. Mon arrière-grand-père a été vu marchant vers le nord. Il détestait le nord. »',
      '« La coutume géante interdit de lever la main sur un aïeul — mais rien n’interdit de les RECOUCHER. Il faut reprendre l’Olifant et sonner la berceuse des tombes, la seule que le Roi ne connaît pas : elle ne se transmet qu’aux vivants. Je suis le dernier à la savoir. Escortez ma berceuse jusqu’à lui. »',
    ],
    ep1: { stat: 'vit', texte: 'La vallée réveillée marche : il faut traverser ENTRE les pas des aïeux somnambules — chaque enjambée de géant est un séisme local, chaque orteil un éboulis possible.', ok: 'Vous courez dans les intervalles comme on traverse une horlogerie de cathédrale — au rythme, jamais contre lui. Un aïeul vous enjambe sans vous voir, et de sa sacoche d’os tombe un tribut d’avant les Royaumes.', ko: 'Un talon d’aïeul se pose trop près : l’onde de choc vous couche tous dans la poussière d’os. Vous vous relevez sonnés, sous le regard vide et navré du somnambule.' },
    combat1: 'Des chamanes osseux — les sonneurs relais du Roi — vous repèrent et battent le rappel local.',
    dilemme: {
      texte: '« Mon arrière-grand-père, » souffle Grimm devant un colosse à l’arrêt, réveillé mais hésitant, comme perdu. « Il résiste à l’appel — le sang reconnaît le sang. Si je grimpe lui chanter le début de la berceuse à l’oreille, il se rendormira ICI, et sa carrure bloquera le défilé aux autres. Mais pendant que je grimpe, c’est vous qui tenez la vallée. L’autre option : on file en silence, et tant pis pour le barrage. »',
      optA: { stat: 'for', texte: '🗿 Faire la courte échelle à Grimm', detail: 'l’aïeul rendormi bloquera le défilé', resultat: 'Vous hissez Grimm de prise en prise jusqu’à l’oreille de son aïeul — et la berceuse fait son œuvre : le colosse se rassoit en travers du défilé, définitivement, un sourire d’os aux lèvres. Le Roi vient de perdre sa grande porte.' },
      optB: { texte: '🤫 Filer sans réveiller l’attention', detail: 'plus vite au Roi — mais le défilé reste ouvert', resultat: 'Vous passez sous l’aïeul hésitant sans un bruit. Grimm lui touche le tibia au passage — une promesse de revenir. Le défilé reste béant derrière vous, et l’appel de l’Olifant y coule librement.' },
    },
    tresor: { titre: '⚱️ Le tribut des générations', texte: 'La grotte-ossuaire où les géants déposaient leurs morts AVEC leurs richesses : reliques antiques, ambre de deuil, et l’héritage que Grimm partage — « Les aïeux paient toujours leurs dettes. Celle-ci est pour vous. »' },
    combat2: 'Un géant déchu — un aïeul entièrement soumis à l’Olifant — se dresse dans le défilé, et Grimm détourne les yeux : « Recouchez-le. S’il vous plaît. Proprement. »',
    ep2: { stat: 'cha', texte: 'Le camp du Roi est gardé par le Cercle des Crânes : douze crânes d’ancêtres qui JUGENT quiconque passe. Il faut soutenir leur regard vide et se présenter, lignée par lignée — les imposteurs finissent dans le mur d’enceinte.', ok: 'Vous vous présentez sans broder — hauts faits, noms, dettes comprises. Les douze crânes pivotent lentement… et s’inclinent d’un même mouvement d’os. Le Cercle vous adopte : il paraît que ça n’était plus arrivé depuis Grimm.', ko: 'Votre présentation s’emmêle dans les titres. Les crânes vous laissent passer — mais l’un d’eux vous suit du regard vide TOUT le reste du chemin, et c’est exactement aussi désagréable que ça en a l’air.' },
    avantBoss: '« Le voilà. L’usurpateur à l’Olifant. » Grimm fait craquer ses jointures comme des ponts-levis. « Plan : vous l’occupez, je chante. La berceuse prend douze mesures — offrez-les-moi. Et ne craignez pas les aïeux qu’il appellera : ils frappent l’appel, pas le cœur. Le cœur, il n’y a que moi qui l’aie encore. »',
    boss: {
      nom: 'Le Roi des Ossements, l’Aïeul Usurpé', intro: 'Il trône sur un tumulus de couronnes d’os, l’Olifant en travers des genoux — un roi assemblé des os de cent aïeux, qui n’est aucun d’eux et les commande tous. « Le dernier sang vient rendre visite, » grince le Roi des Ossements. « Parfait. Il manquait une voix VIVANTE à mon armée. »',
      annonce: '🗿 L’aïeul rendormi bloque le grand défilé : les renforts du Roi arrivent au compte-gouttes, et sa patience s’effrite comme un vieux fémur !',
      phase: '🦴 Le Roi sonne l’Olifant en plein combat : les os de la vallée entière répondent et pleuvent en armes !',
      enrage: '⚠️ Douze mesures — le Roi entend la berceuse monter et frappe comme un tombeau qui se referme !',
    },
    fins: {
      variante: 'À la douzième mesure de Grimm, le Roi des Ossements se DÉFAIT — chaque aïeul reprend ses os un à un, poliment, comme on récupère son manteau au vestiaire. La vallée entière se recouche dans un long soupir de séisme apaisé, arches remises, crânes-collines réalignés. Il ne reste du Roi que l’Olifant, que Grimm fend sur son genou : « On ne sonne plus les miens. On les CHANTE. »',
      defaut: 'Le Roi s’effondre en cliquetis de dominos géants — et sans son Olifant, l’appel meurt dans la vallée comme un écho fatigué. Les aïeux réveillés s’arrêtent où ils sont, hésitent… puis se recouchent sur place, faisant de nouveaux reliefs que les cartographes maudiront. Grimm passera l’année à les remettre chacun dans SA tombe. Il dit ça en souriant : c’est du temps en famille.',
    },
    relique: { nom: 'Dent de l’Olifant d’Os', emoji: '🦴', bonus: { vit: 9, for: 6, pvMax: 44 }, desc: 'Un éclat de l’Olifant : il fredonne la berceuse des tombes. Récompense du « Réveil des Aïeux ».' },
  },
  {
    zone: 'citadelle-foudre', nom: 'Le Paratonnerre', emoji: '⚡', statAcces: 'int',
    pnj: { nom: 'Volta la foudroyée', emoji: '👻' },
    resume: 'L’Archonte charge la citadelle comme un condensateur géant. Au dixième orage : un seul éclair, assez grand pour écrire son nom sur les Royaumes.',
    scenes: [
      'La Citadelle de Foudre a toujours grondé — c’est une forteresse échouée sur un nuage d’orage, on ne lui demande pas de ronronner. Mais depuis neuf orages, elle ne DÉCHARGE plus : elle accumule. Les cheveux se dressent à dix lieues à la ronde.',
      '« Il la charge. Comme un condensateur. » Volta, forgeronne morte foudroyée il y a un siècle — et restée, par conscience professionnelle, en fantôme statique — grésille d’indignation. « L’Archonte de la Tempête a perdu sa guerre céleste, alors il prépare sa signature : UN éclair. Un seul. Assez grand pour graver son nom en travers des Royaumes. Les artistes ratés sont les pires tyrans. »',
      '« Au dixième orage, la citadelle sera pleine. Il faut la DÉCHARGER avant : rouvrir les paratonnerres que j’ai forgés de mon vivant — il les a tous coudés vers l’intérieur. Trois vannes, puis lui. Ne touchez rien de métallique sans mon signal. Et si vos cheveux se dressent : COUREZ. Peu importe la direction, c’est toujours la bonne. »',
    ],
    ep1: { stat: 'int', texte: 'La première vanne : un labyrinthe de barres omnibus sous tension, où le courant saute de barre en barre selon un cycle que Volta connaît « à l’oreille ». Il faut mémoriser la séquence et passer dans les creux.', ok: 'Vous passez le labyrinthe comme une partition apprise — Volta grésille de fierté : « Même MOI je me suis trompée, la fois où… enfin bref. » La vanne rouverte crache son trop-plein vers le ciel, et dans le local : la caisse à outils personnelle de Volta, intacte depuis un siècle.', ko: 'Une barre saute son tour de cycle — « IL A MODIFIÉ MES RÉGLAGES ! » hurle Volta pendant que l’arc vous roussit au passage. La vanne s’ouvre quand même. Vos silhouettes fumantes aussi.' },
    combat1: 'Des sentinelles d’acier convergent — dans une citadelle-condensateur, tout ce qui est métallique appartient au camp d’en face.',
    dilemme: {
      texte: '« La grande bobine, » grésille Volta devant un enroulement haut comme un beffroi. « Mon chef-d’œuvre. Il en a fait le cœur de sa charge. On peut l’inverser — la citadelle se VIDERAIT par le plancher, en douceur, mais il faut être deux : un aux manivelles, un aux fusibles, et mes mains ne tiennent plus rien depuis cent ans. Ou on la court-circuite au marteau. Rapide. Brutal. Elle ne me le pardonnera pas. »',
      optA: { stat: 'int', texte: '🔧 Inverser la grande bobine avec Volta', detail: 'vider la charge en douceur — l’Archonte s’affaiblira', resultat: 'Manivelle par manivelle, fusible par fusible, sous les instructions grésillantes de Volta, la grande bobine s’inverse — et la citadelle entière se met à FUIR par le plancher, en longues racines de foudre inoffensive. Là-haut, l’Archonte sent sa signature se vider comme un encrier percé.' },
      optB: { texte: '🔨 Court-circuiter au marteau', detail: 'rapide — mais la décharge sera sauvage', resultat: 'Le marteau s’abat, la bobine hurle, et une décharge sauvage balaie le hall — vous y laissez des étincelles plein les os. La charge chute, mais la citadelle gronde de douleur, et Volta ne regarde pas.' },
    },
    tresor: { titre: '⚙️ La forge de Volta', texte: 'Son atelier scellé depuis l’accident : aciers célestes trempés à l’éclair, fragments de foudre en bocaux, et sa paie de maîtresse-forgeronne jamais réclamée. « Prenez tout. Les fantômes n’ont pas de poches — c’est le seul défaut du métier. »' },
    combat2: 'Le forgeron foudroyé — le successeur de Volta, moins regretté — mène une vouivre d’orage à votre rencontre : la maintenance a des comptes à régler.',
    ep2: { stat: 'agi', texte: 'La dernière vanne est sur le toit : une course de crête entre les arcs, sur des chemins de ronde où la foudre tombe TOUTES les quatre secondes — trois pour courir, une pour se plaquer. Volta compte à voix haute.', ok: 'Trois-secondes-PLAT. Trois-secondes-PLAT. Vous remontez la crête comme une couture d’éclairs, réglés sur la voix de Volta — la vanne s’ouvre, le ciel aspire son dû, et la citadelle soupire de tous ses créneaux.', ko: 'Un « plat » trop tardif : la foudre vous frôle assez près pour vous friser jusqu’à l’âme. La vanne s’ouvre — vous, vous vibrerez encore une semaine.' },
    avantBoss: '« Il est au sommet, sur MON paratonnerre maître, » grésille Volta, et son grésillement a changé — c’est de la colère de forgeronne, la pire. « Rappelez-vous : il n’est fort que de sa charge. Chaque arc qu’il vous jette, c’est de la signature en moins. Faites-le DÉPENSER. Et quand il sera vide… rendez-lui la monnaie de mon éclair. »',
    boss: {
      nom: 'L’Archonte de la Tempête, Cœur-Condensé', intro: 'Il se tient au sommet du paratonnerre maître, bras ouverts, et la charge de neuf orages court sous sa peau en veines blanches — l’Archonte est devenu sa propre foudre. « Encore un orage, » dit-il sans se retourner. « Un SEUL. Et le ciel apprendra à épeler mon nom. »',
      annonce: '🔧 La grande bobine inversée le saigne en continu : chaque coup de l’Archonte fuit par le plancher — sa signature se meurt en gribouillis !',
      phase: '⚡ L’Archonte puise dans sa réserve de signature : les éclairs tombent en rafales dictées, lettre par lettre !',
      enrage: '⚠️ Le dixième orage arrive — l’Archonte jette TOUTE sa charge dans la bataille, tant pis pour le nom, il écrira une croix !',
    },
    fins: {
      variante: 'Vidé par la bobine, l’Archonte tombe à genoux au sommet — et son dernier arc, minuscule, grésille entre ses doigts comme une signature ratée sur un chèque en bois. La citadelle, déchargée, redevient une forteresse qui gronde pour la forme. Volta reprend possession de sa forge en fantôme-chef : « La maintenance recommence lundi. » Son éclair à elle, dit-elle, attendra un motif plus élégant.',
      defaut: 'L’Archonte s’effondre dans une gerbe d’arcs mourants — et la charge des neuf orages s’échappe par les trois vannes rouvertes en une aurore boréale qui se voit, dit-on, depuis les Plaines de l’Aube. Les Royaumes n’auront jamais su qu’ils ont failli servir de parchemin. Volta contemple le ciel qui se vide et grésille doucement : « Voilà. C’est ÇA, une belle signature : celle qu’on n’impose à personne. »',
    },
    relique: { nom: 'Fusible de Volta', emoji: '⚡', bonus: { int: 10, agi: 6, esquive: 3, pmMax: 40 }, desc: 'Il saute AVANT le coup dur — c’est tout son art. Récompense du « Paratonnerre ».' },
  },
  {
    zone: 'neant-scintillant', nom: 'Les Fausses Étoiles', emoji: '⭐', statAcces: 'cha',
    pnj: { nom: 'Nyx l’astronome aveugle', emoji: '🔭' },
    resume: 'Les étoiles du Néant Scintillant n’en sont pas : ce sont des œufs. Et le Dévoreur de Mondes les couve — une constellation entière prête à éclore.',
    scenes: [
      'Le Néant Scintillant est plein d’étoiles qui ne sont pas des étoiles — tout le monde le sait, personne n’a creusé. Sauf Nyx, astronome aveugle, qui « écoute » le ciel depuis quarante ans et a fini par entendre ce que les voyants refusaient de voir.',
      '« Elles ont un POULS. » Nyx tapote son grand cornet de cuivre pointé vers la déchirure du monde. « Toutes. Synchronisé. Les fausses étoiles sont des œufs, et le Dévoreur de Mondes les couve — il ne dévore pas par faim, comprenez : il fait son nid. Une constellation entière de petits dévoreurs, à terme. Le terme approche : le pouls s’accélère depuis trois nuits. »',
      '« Je n’ai jamais “vu” le Néant — c’est pour ça que lui ne me voit pas : il n’attrape que les regards. Vous, il vous verra. Alors écoutez plutôt : je vous apprendrai à naviguer au pouls, comme moi. Trouvez la couveuse. Et décidez ce qu’on fait d’un ciel qui va éclore. »',
    ],
    ep1: { stat: 'cha', texte: 'Le seuil du Néant se traverse À L’AVEUGLE : yeux fermés, guidés au seul pouls des fausses étoiles que Nyx vous apprend à compter — regarder, c’est être vu, être vu, c’est être pris. Marcher dans le vide sur la foi d’un battement.', ok: 'Vous marchez les yeux clos sur le pont du hasard, un battement après l’autre — et le Néant, qui ne sait attraper que les regards, vous laisse passer comme des courants d’air chanceux. Sous vos pieds aveugles : le sac d’un voyant qui n’a pas eu votre foi.', ko: 'Quelqu’un triche — un cil, un éclat, un demi-regard. Le Néant VOIT, et le pont de vide se dérobe d’un cran : vous rattrapez le bord de justesse, à moitié avalés, entièrement refroidis.' },
    combat1: 'Des horreurs du vide convergent en silence — la couveuse a des veilleuses, et vous marchez entre les œufs.',
    dilemme: {
      texte: '« J’entends UN œuf différent, » murmure Nyx, cornet collé au vide. « Un pouls… discordant. Celui-là ne deviendra pas un dévoreur : il devient autre chose — le Néant lui-même ne sait pas quoi. On peut le voler et le confier au ciel VRAI, voir ce que l’univers en fait. Poétique. Risqué. Ou on ne touche à rien et on garde nos mains pour le Père. »',
      optA: { stat: 'cha', texte: '🥚 Voler l’œuf discordant', detail: 'confier l’inconnu au vrai ciel — le Père le sentira', resultat: 'Vous cueillez l’œuf discordant au creux de son berceau de vide — il est TIÈDE, seul de toute la couvée, et son pouls s’accorde au vôtre à l’instant du contact. Quelque part dans le nid, quelque chose d’immense compte ses œufs. Et arrive à un chiffre qui lui déplaît.' },
      optB: { texte: '🙏 Ne toucher à aucun œuf', detail: 'prudence — le nid entier reste en paix… pour l’instant', resultat: 'Vous passez entre les œufs sans en frôler un seul, en apnée de tout : de gestes, de regards, de pensées. Le nid vous ignore. Nyx compte les pouls qui s’accélèrent : « Terme dans quelques heures. On n’a rien empiré. On n’a rien gagné. »' },
    },
    tresor: { titre: '🌌 Le nid des choses tombées', texte: 'Tout ce que le Néant a « attrapé du regard » depuis des siècles s’entasse ici en couronne autour de la couveuse : reliques d’expéditions, étoffes du néant en rouleaux, éclats d’étoiles VRAIES — le trousseau du nid.' },
    combat2: 'Les tisseuses d’étoiles — les sages-femmes du nid — descendent en spirale : le terme approche, et vous êtes DANS la nurserie.',
    ep2: { stat: 'int', texte: 'La couveuse centrale est protégée par le Grand Motif : les fausses étoiles y dessinent des constellations-mots de passe qui changent à chaque pouls. Nyx entend le rythme ; à vous de déduire le dessin et de tracer le Motif juste dans le vide.', ok: 'Vous tracez le Motif au doigt dans le vide, en aveugles instruits par une aveugle — et les constellations s’écartent en rideau. Nyx souffle : « Quarante ans que je le dessine dans ma tête. Merci de me dire qu’il est BEAU. »', ko: 'Un angle faux dans le Motif : les constellations se REFERMENT en filet et vous compressent un long instant de trop avant de vous relâcher, froissés comme des cartes du ciel ratées.' },
    avantBoss: '« Il nous a entendus. Normal : vous respirez comme des soufflets de forge. » Nyx replie son cornet, très calme. « Rappelez-vous : il n’attrape que les regards — alors battez-vous comme je navigue : au pouls, à l’oreille, au cœur. Et quoi qu’il arrive à la couvée… qu’on ne dise jamais que les Royaumes ont tué un ciel sans lui avoir laissé une chance. »',
    boss: {
      nom: 'Le Dévoreur de Mondes, Père-des-Étoiles', intro: 'Il se déploie autour de sa couveuse comme une nuit qui aurait des ailes — et toutes les fausses étoiles pulsent soudain PLUS FORT, rassurées : papa est là. Le Dévoreur de Mondes ouvre cent yeux qui sont des trous. « Mes petits, » gronde le vide. « Vous marchez. Sur. Mes. Petits. »',
      annonce: '🥚 L’œuf discordant pulse contre votre cœur : le Père frappe RETENU, terrifié de briser le seul de ses petits qu’il ne comprend pas !',
      phase: '🌌 Le Dévoreur éteint les fausses étoiles une à une pour vous plonger dans SON noir — le combat continue au pouls !',
      enrage: '⚠️ Le terme est LÀ : les œufs pulsent tous ensemble, et le Père combat comme une éclosion — partout à la fois !',
    },
    fins: {
      variante: 'Le Père ploie — et vous levez l’œuf discordant entre vous et lui, à bout de bras. Long silence de vide. Puis le Dévoreur fait la seule chose que personne n’attendait : il ÉCOUTE l’œuf, comme Nyx écoute le ciel. Ce qu’il entend le change. La couvée entière s’éteint doucement — pas morte : REPORTÉE, remise à un ciel plus vaste où éclore ne rasera personne. Le Père s’en va la porter, constellation par constellation. L’œuf discordant, lui, reste : il vous a choisis, et Nyx jure qu’il rit la nuit.',
      defaut: 'Le Dévoreur s’effondre en travers de sa couveuse — et les fausses étoiles, privées de sa chaleur, pâlissent une à une jusqu’au gris perle des choses qui n’écloront pas. Le Néant Scintillant scintille moins, désormais ; il en devient presque reposant. Nyx pointe son cornet vers le VRAI ciel et écoute longuement : « Rien ne pulse. Que des étoiles honnêtes. » Elle sourit. « C’est fou ce que c’est ennuyeux. J’adore. »',
    },
    relique: { nom: 'Œuf Discordant', emoji: '⭐', bonus: { cha: 10, int: 7, pvMax: 40, xpBonus: 0.05 }, desc: 'Il pulse au rythme de votre cœur — un peu plus fort les bons jours. Récompense des « Fausses Étoiles ».' },
  },
];

// Le générateur : chaque récit devient un donjon complet — boss de zone
// renforcé à mécaniques, relique unique, et déblocage exigeant (niveau,
// caractéristique, objet-clé de la zone, boss de carte vaincu).
CHRONIQUES.forEach((c) => {
  const z = ZONES.find((x) => x.id === c.zone);
  const niveau = Math.max(3, z.niveauMin + 2);
  const bossBase = MONSTRES[z.boss];

  const idBoss = `chronique-boss-${c.zone}`;
  MONSTRES_DONJONS[idBoss] = {
    ...bossBase,
    nom: c.boss.nom,
    boss: true,
    hp: Math.round(bossBase.hp * 1.7),
    atk: Math.round(bossBase.atk * 1.15),
    xp: Math.round(bossBase.xp * 2.2),
    po: bossBase.po ? [bossBase.po[0] * 2, bossBase.po[1] * 2] : [niveau * 2, niveau * 4],
    mecaniques: {
      phases: [{ seuil: 0.5, atkMult: 1.3, annonce: c.boss.phase }],
      enrage: { manche: 10, atkMult: 1.5, annonce: c.boss.enrage },
    },
  };

  const idRelique = `relique-${c.zone}`;
  OBJETS[idRelique] = {
    nom: c.relique.nom, emoji: c.relique.emoji, type: 'equipement', slot: 'accessoire',
    niveau,
    rarete: niveau < 10 ? 'rare' : niveau < 20 ? 'epique' : niveau < 32 ? 'legendaire' : niveau < 44 ? 'mythique' : 'divin',
    prixVente: 60 + niveau * 22,
    bonus: c.relique.bonus,
    desc: c.relique.desc,
  };

  // L'objet-clé : le matériau le plus rare de la zone — il faut connaître
  // ces terres (et y avoir récolté) pour mériter leur chronique.
  const cleZone = z.recolte.reduce((min, e) => (e.chance < min.chance ? e : min), z.recolte[0]).id;
  const difficulte = 13 + Math.round(z.niveauMin * 0.75);
  const seuilChoix = 6 + Math.round(z.niveauMin * 0.6);
  const [m1, m2, m3] = z.monstres;
  const xpFin = 80 + 4 * z.niveauMin * z.niveauMin;

  DONJONS.push({
    id: `chronique-${c.zone}`,
    chronique: true,
    zone: c.zone,
    nom: c.nom, emoji: c.emoji, niveauMin: niveau,
    acces: {
      stat: c.statAcces,
      min: 4 + Math.round(z.niveauMin * 0.5),
      objet: cleZone,
      bossZone: z.id,
    },
    resume: c.resume,
    hautFait: 'chroniques-5',
    depart: 'intro',
    recompenses: { xp: xpFin, po: Math.round(xpFin * 0.55), objet: idRelique },
    etapes: {
      intro: {
        type: 'dialogue',
        scenes: [
          { qui: 'Narrateur', emoji: '📜', texte: c.scenes[0] },
          { qui: c.pnj.nom, emoji: c.pnj.emoji, texte: c.scenes[1] },
          { qui: c.pnj.nom, emoji: c.pnj.emoji, texte: c.scenes[2] },
        ],
        suite: 'approche',
      },
      approche: {
        type: 'epreuve', qui: 'Narrateur', emoji: '🎲',
        texte: c.ep1.texte, stat: c.ep1.stat, difficulte,
        reussite: { texte: c.ep1.ok, effet: { po: Math.round(xpFin * 0.15), objets: { [cleZone]: 2 } }, suite: 'embuscade' },
        echec: { texte: c.ep1.ko, effet: { pvPct: -0.1 }, suite: 'embuscade' },
      },
      embuscade: { type: 'combat', intro: c.combat1, monstres: [m1, m2, m1], suite: 'dilemme' },
      dilemme: {
        type: 'choix', qui: c.pnj.nom, emoji: c.pnj.emoji, texte: c.dilemme.texte,
        options: [
          {
            texte: c.dilemme.optA.texte,
            detail: `${CARACS[c.dilemme.optA.stat].nom} ≥ ${seuilChoix} — ${c.dilemme.optA.detail}`,
            condition: { stat: c.dilemme.optA.stat, min: seuilChoix },
            effet: { drapeau: 'faveur' },
            resultat: c.dilemme.optA.resultat,
            suite: 'cache',
          },
          {
            texte: c.dilemme.optB.texte,
            detail: c.dilemme.optB.detail,
            effet: { pvPct: -0.08 },
            resultat: c.dilemme.optB.resultat,
            suite: 'cache',
          },
        ],
      },
      cache: {
        type: 'tresor', titre: c.tresor.titre, texte: c.tresor.texte,
        effet: { po: Math.round(xpFin * 0.25), objets: { [cleZone]: 2, [z.recolte[0].id]: 3 } },
        suite: 'gardiens',
      },
      gardiens: { type: 'combat', intro: c.combat2, monstres: [m2, m3, m3], suite: 'coeur' },
      coeur: {
        type: 'epreuve', qui: 'Narrateur', emoji: '🎲',
        texte: c.ep2.texte, stat: c.ep2.stat, difficulte: difficulte + 2,
        reussite: { texte: c.ep2.ok, effet: { pvPct: 0.15, mpPct: 0.2 }, suite: 'avant-boss' },
        echec: { texte: c.ep2.ko, effet: { pvPct: -0.12 }, suite: 'avant-boss' },
      },
      'avant-boss': {
        type: 'dialogue',
        scenes: [{ qui: c.pnj.nom, emoji: c.pnj.emoji, texte: c.avantBoss }],
        suite: 'boss',
      },
      boss: {
        type: 'boss', intro: c.boss.intro, monstre: idBoss,
        modificateurs: [{ drapeau: 'faveur', atkMult: 0.85, annonce: c.boss.annonce }],
        suite: 'fin',
      },
      fin: {
        type: 'fin',
        variantes: [{ drapeau: 'faveur', cle: 'faveur', texte: c.fins.variante }],
        texte: c.fins.defaut,
      },
    },
  });
});

const DONJONS_PAR_ID = {};
DONJONS.forEach((d) => { DONJONS_PAR_ID[d.id] = d; });

// =====================================================================
// Progression sauvegardée sur le héros
// =====================================================================
function progresDonjon(p, idDonjon) {
  if (!p.donjons) p.donjons = {};
  if (!p.donjons[idDonjon]) {
    p.donjons[idDonjon] = { checkpoint: null, drapeaux: {}, fini: 0, epilogue: null };
  }
  return p.donjons[idDonjon];
}

// =====================================================================
// Cartes des donjons sur la carte du monde
// =====================================================================
// Les verrous d'accès d'une Chronique : chaque condition manquante est
// listée en clair — niveau, caractéristique, objet-clé, boss de la carte.
function verrousChronique(p, donjon) {
  const verrous = [];
  const a = donjon.acces;
  if (p.niveau < donjon.niveauMin) verrous.push(`niveau ${donjon.niveauMin}`);
  const s = statsEffectives(p);
  if ((s[a.stat] || 0) < a.min) verrous.push(`${CARACS[a.stat].emoji} ${CARACS[a.stat].nom} ${s[a.stat] || 0}/${a.min}`);
  if (compterObjet(p, a.objet) < 1) verrous.push(`🗝️ ${OBJETS[a.objet].emoji} ${OBJETS[a.objet].nom} en poche`);
  if (!p.bossVaincus.includes(a.bossZone)) {
    const z = ZONES.find((x) => x.id === a.bossZone);
    verrous.push(`👑 vaincre ${MONSTRES[z.boss].nom}`);
  }
  return verrous;
}

// v16 : la liste des donjons qu'un héros a DÉBLOQUÉS — calculée sur son
// propre appareil (verrous complets : niveau, stat, objet-clé, boss de
// zone, prérequis d'épopée), puis embarquée dans l'instantané de groupe.
function donjonDebloquePour(p, donjon) {
  if (p.niveau < donjon.niveauMin) return false;
  if (donjon.requiert && !(progresDonjon(p, donjon.requiert).fini > 0)) return false;
  if (donjon.chronique && verrousChronique(p, donjon).length > 0) return false;
  return true;
}

function donjonsDebloquesPour(p) {
  return DONJONS.filter((d) => donjonDebloquePour(p, d)).map((d) => d.id);
}

// Le boss FINAL d'un donjon : la dernière étape de type « boss » du récit.
function bossDeDonjon(donjon) {
  let boss = null;
  Object.values(donjon.etapes).forEach((etape) => { if (etape.type === 'boss') boss = etape; });
  return boss;
}

function rendreCartesDonjons(conteneur, p) {
  const sections = [
    {
      titre: '📜 <strong>Chroniques des terres</strong> — la petite histoire de chaque carte. Accès exigeant : niveau, caractéristique, objet-clé… et le boss de la carte vaincu.',
      liste: DONJONS.filter((d) => d.chronique),
    },
    {
      titre: '📖 <strong>Épopées de Valciel</strong> — les grandes histoires. Une épopée terminée ouvre son <strong>Ascension éternelle</strong> : on y grimpe jusqu’à la mort ou l’abandon.',
      liste: DONJONS.filter((d) => !d.chronique),
    },
  ];

  sections.forEach((section) => {
    const titre = document.createElement('div');
    titre.className = 'separateur-donjons';
    titre.innerHTML = section.titre;
    conteneur.appendChild(titre);

    section.liste.forEach((donjon) => {
      const prog = progresDonjon(p, donjon.id);
      const prerequisManquant = donjon.requiert && !(progresDonjon(p, donjon.requiert).fini > 0);
      const verrousAcces = donjon.chronique ? verrousChronique(p, donjon) : [];
      const verrouille = p.niveau < donjon.niveauMin || prerequisManquant || verrousAcces.length > 0;
      const enCours = !!prog.checkpoint;
      const carte = document.createElement('div');
      carte.className = 'carte-zone donjon-histoire' + (verrouille ? ' verrouillee' : '');
      let statut = '';
      if (prog.fini > 0) statut = ' ✅';
      else if (enCours) statut = ' 📖';
      let action = 'Commencer l’histoire';
      if (donjon.chronique && verrousAcces.length) action = `🔒 Il manque : ${verrousAcces.join(' · ')}.`;
      else if (p.niveau < donjon.niveauMin) action = `🔒 Atteignez le niveau ${donjon.niveauMin}.`;
      else if (prerequisManquant) action = `🔒 Terminez d’abord « ${DONJONS_PAR_ID[donjon.requiert].nom} ».`;
      else if (enCours) action = '▶ Reprendre l’aventure en cours';
      else if (prog.fini > 0) {
        action = donjon.chronique
          ? 'Revivre l’histoire (récompenses réduites)'
          : '⛰️ Revivre l’histoire ou tenter l’Ascension éternelle';
      }
      let etiquette;
      if (donjon.chronique) etiquette = `📜 chronique · niv. ${donjon.niveauMin}+`;
      else if (donjon.defi) etiquette = `☠️ défi niv. ${donjon.defi} · héros niv. ${donjon.niveauMin}+`;
      else etiquette = `📖 épopée · niv. ${donjon.niveauMin}+`;
      const record = !donjon.chronique ? recordAscension(p, donjon.id) : 0;
      carte.innerHTML = `
        <div class="zone-emoji">${donjon.emoji}</div>
        <div class="zone-nom">${donjon.nom}${statut}</div>
        <div class="zone-plage">${etiquette}${record > 0 ? ` · ⛰️ record : étage ${record}` : ''}</div>
        <div class="zone-desc">${verrouille ? action : `${donjon.resume}<br><em>${action}</em>`}</div>`;
      if (!verrouille) rendreCliquable(carte, () => ouvrirDonjon(donjon));
      conteneur.appendChild(carte);
    });
  });
}

// =====================================================================
// Moteur : ouverture, étapes, rendu narratif
// =====================================================================
function ouvrirDonjon(donjon) {
  const p = persoActif();
  // Chroniques : les quatre verrous se vérifient aussi à l'entrée.
  if (donjon.chronique) {
    const verrous = verrousChronique(p, donjon);
    if (verrous.length) {
      afficherToast(`🔒 Il manque : ${verrous.join(' · ')}.`);
      return;
    }
  }
  const prog = progresDonjon(p, donjon.id);
  const reprise = prog.checkpoint && donjon.etapes[prog.checkpoint];
  // Épopée déjà terminée (et pas de chapitre en cours) : histoire ou Ascension ?
  if (!donjon.chronique && prog.fini > 0 && !reprise) {
    const record = recordAscension(p, donjon.id);
    afficherButin({
      titre: `${donjon.emoji} ${donjon.nom}`,
      texte: 'L’histoire est écrite — mais le donjon, lui, vit toujours. Revivez le récit, ou entamez l’Ascension éternelle : des étages sans fin, de plus en plus durs, sans soin entre les salles, jusqu’à la mort ou l’abandon.',
      lignes: [record > 0 ? `⛰️ Votre record d’Ascension ici : étage ${record}.` : '⛰️ Aucune Ascension tentée ici pour l’instant.'],
      retour: 'carte',
      boutons: [
        {
          texte: '⛰️ Entamer l’Ascension éternelle',
          classe: 'btn-principal',
          action: () => ouvrirAscension(donjon),
        },
        {
          texte: '📖 Revivre l’histoire (récompenses réduites)',
          action: () => demarrerHistoireDonjon(donjon),
        },
      ],
    });
    return;
  }
  demarrerHistoireDonjon(donjon);
}

function demarrerHistoireDonjon(donjon) {
  const p = persoActif();
  const prog = progresDonjon(p, donjon.id);
  const reprise = prog.checkpoint && donjon.etapes[prog.checkpoint];
  etat.donjon = { donjon, drapeaux: reprise ? { ...prog.drapeaux } : {} };
  if (!reprise) {
    prog.drapeaux = {};
    if (prog.fini > 0) afficherToast('📖 Vous rouvrez le livre : l’histoire recommence.');
  } else {
    afficherToast('📖 Vous reprenez l’aventure où vous l’aviez laissée.');
  }
  demarrerEtapeDonjon(reprise ? prog.checkpoint : donjon.depart);
}

// Sauvegarde immédiate de la progression (checkpoint + drapeaux) : appelée
// à chaque étape, mais aussi dès qu'un choix ou un trésor est consommé,
// pour qu'un aller-retour ne permette jamais de les rejouer.
function sauvegarderProgresDonjon(checkpoint) {
  const contexte = etat.donjon;
  const p = persoActif();
  const prog = progresDonjon(p, contexte.donjon.id);
  prog.checkpoint = checkpoint;
  prog.drapeaux = { ...contexte.drapeaux };
  sauvegarder(p);
}

function demarrerEtapeDonjon(idEtape) {
  const contexte = etat.donjon;
  if (!contexte) return;
  // Un double-clic sur « Poursuivre » ne doit pas rejouer l'étape (et ses gains).
  if (contexte.etapeId === idEtape) return;
  const { donjon } = contexte;
  const etape = donjon.etapes[idEtape];
  if (!etape) { etat.donjon = null; naviguer('carte'); return; }
  contexte.etapeId = idEtape;

  // Checkpoint : on peut quitter et reprendre ici.
  sauvegarderProgresDonjon(idEtape);

  if (etape.type === 'combat' || etape.type === 'boss') {
    lancerCombatDonjon(etape);
    return;
  }

  rendreEnteteDonjon();
  const scene = el('donjon-scene');
  scene.innerHTML = '';
  if (etape.type === 'dialogue') rendreDialogueDonjon(etape, 0);
  else if (etape.type === 'choix') rendreChoixDonjon(etape);
  else if (etape.type === 'epreuve') rendreEpreuveDonjon(etape);
  else if (etape.type === 'tresor') rendreTresorDonjon(etape);
  else if (etape.type === 'fin') terminerDonjon(etape);
  montrerEcran('ecran-donjon');
}

function rendreEnteteDonjon() {
  const { donjon } = etat.donjon;
  const entete = el('donjon-entete');
  entete.innerHTML = `
    <div class="entete-lieu">
      <h2>${donjon.emoji} ${donjon.nom}</h2>
      <button class="btn-choix btn-compact" id="donjon-quitter">🚪 Reprendre plus tard</button>
    </div>`;
  el('donjon-quitter').addEventListener('click', () => {
    afficherToast('📖 Progression sauvegardée : reprenez quand vous voulez depuis la carte.');
    etat.donjon = null;
    naviguer('carte');
  });
}

function carteScene(qui, emoji, texte) {
  const carte = document.createElement('div');
  carte.className = 'scene-donjon';
  carte.innerHTML = `
    <span class="scene-portrait">${emoji || '📜'}</span>
    <div class="scene-corps">
      <div class="scene-nom">${echapper(qui || 'Narrateur')}</div>
      <div class="scene-texte">${echapper(texte)}</div>
    </div>`;
  return carte;
}

function rendreDialogueDonjon(etape, index) {
  const scene = el('donjon-scene');
  // Les scènes déjà lues restent visibles au-dessus.
  scene.querySelectorAll('.scene-boutons').forEach((x) => x.remove());
  scene.appendChild(carteScene(etape.scenes[index].qui, etape.scenes[index].emoji, etape.scenes[index].texte));

  const boutons = document.createElement('div');
  boutons.className = 'rangee-boutons scene-boutons';
  const continuer = document.createElement('button');
  continuer.className = 'btn-principal';
  const derniere = index >= etape.scenes.length - 1;
  continuer.textContent = derniere ? 'Poursuivre ➜' : 'Continuer…';
  continuer.addEventListener('click', () => {
    if (derniere) demarrerEtapeDonjon(etape.suite);
    else rendreDialogueDonjon(etape, index + 1);
  });
  boutons.appendChild(continuer);
  scene.appendChild(boutons);
  continuer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function conditionRemplie(condition, p) {
  if (!condition) return { ok: true };
  if (condition.stat) {
    // En équipe, c'est le membre le plus doué qui « fait l'action »
    // (l'esprit Donjons & Dragons : chacun son moment de gloire).
    const membres = membresEquipe();
    let valeur = 0;
    let champion = p;
    membres.forEach((m) => {
      const v = statsEffectives(m)[condition.stat] || 0;
      if (v >= valeur) { valeur = v; champion = m; }
    });
    const nomStat = CARACS[condition.stat] ? CARACS[condition.stat].nom : condition.stat;
    return valeur >= condition.min
      ? { ok: true, champion: membres.length > 1 ? champion : null }
      : { ok: false, raison: `${nomStat} ${valeur}/${condition.min}` };
  }
  if (condition.drapeau) {
    return etat.donjon.drapeaux[condition.drapeau] ? { ok: true } : { ok: false, raison: 'chemin non découvert' };
  }
  if (condition.sansDrapeau) {
    return !etat.donjon.drapeaux[condition.sansDrapeau] ? { ok: true } : { ok: false, raison: 'trop tard' };
  }
  return { ok: true };
}

// Applique un effet déclaratif et renvoie des lignes descriptives.
function appliquerEffetDonjon(effet) {
  const lignes = [];
  if (!effet) return lignes;
  const membres = membresEquipe();
  if (effet.drapeau) etat.donjon.drapeaux[effet.drapeau] = true;
  if (effet.pvPct) {
    membres.forEach((m) => {
      const delta = Math.round(m.maxHp * effet.pvPct);
      m.hp = Math.max(1, Math.min(m.maxHp, m.hp + delta)); // une péripétie ne tue jamais
    });
    lignes.push(effet.pvPct > 0
      ? `❤️ +${Math.round(effet.pvPct * 100)} % de PV pour l'équipe`
      : `💔 ${Math.round(effet.pvPct * 100)} % de PV pour l'équipe`);
  }
  if (effet.mpPct) {
    membres.forEach((m) => {
      m.mp = Math.max(0, Math.min(m.maxMp, m.mp + Math.round(m.maxMp * effet.mpPct)));
    });
    lignes.push(effet.mpPct > 0
      ? `💧 +${Math.round(effet.mpPct * 100)} % de PM pour l'équipe`
      : `🌀 ${Math.round(effet.mpPct * 100)} % de PM pour l'équipe`);
  }
  if (effet.po) {
    membres.forEach((m) => { m.po += effet.po; m.compteurs.orTotal += effet.po; });
    lignes.push(`💰 +${effet.po} po pour chaque héros`);
  }
  if (effet.xp) {
    membres.forEach((m) => gagnerXp(m, effet.xp));
    lignes.push(`⭐ +${effet.xp} XP pour chaque héros`);
  }
  if (effet.objets) {
    Object.entries(effet.objets).forEach(([id, qte]) => {
      membres.forEach((m) => ajouterObjet(m, id, qte));
      const objet = OBJETS[id];
      if (objet) lignes.push(`${objet.emoji} ${objet.nom}${texteRarete(objet)} ×${qte}`);
    });
  }
  membres.forEach((m) => { verifierHautsFaits(m); sauvegarder(m); });
  rendreTopbar();
  return lignes;
}

// =====================================================================
// Épreuves façon Donjons & Dragons : un jet de d20 + la meilleure stat
// de l'équipe contre une difficulté. Réussite et échec ont chacun
// leurs conséquences — et l'histoire continue dans les deux cas.
// =====================================================================
function rendreEpreuveDonjon(etape) {
  const scene = el('donjon-scene');
  scene.appendChild(carteScene(etape.qui || 'Épreuve', etape.emoji || '🎲', etape.texte));

  const membres = membresEquipe();
  let champion = membres[0];
  membres.forEach((m) => {
    if ((statsEffectives(m)[etape.stat] || 0) > (statsEffectives(champion)[etape.stat] || 0)) champion = m;
  });
  const bonus = statsEffectives(champion)[etape.stat] || 0;
  const nomStat = CARACS[etape.stat].nom;
  const epreuveDe = /^[aeioué]/i.test(nomStat) ? `d’${nomStat}` : `de ${nomStat}`;

  const bloc = document.createElement('div');
  bloc.className = 'panneau bloc-epreuve';
  bloc.innerHTML = `<p>🎲 <strong>Épreuve ${epreuveDe}</strong> — difficulté ${etape.difficulte}.
    ${membres.length > 1 ? `C'est <strong>${echapper(champion.nom)}</strong> (le plus doué, ${nomStat} ${bonus}) qui s'y colle.` : `Votre ${nomStat} : ${bonus}.`}</p>`;
  const lancer = document.createElement('button');
  lancer.className = 'btn-principal';
  lancer.textContent = '🎲 Lancer le d20 !';
  lancer.addEventListener('click', () => {
    lancer.disabled = true;
    const de = alea(1, 20);
    const total = de + bonus;
    const critique = de === 20;
    const echecCritique = de === 1;
    const reussite = critique || (!echecCritique && total >= etape.difficulte);
    const resultat = document.createElement('p');
    resultat.className = 'resultat-de';
    resultat.innerHTML = `🎲 <strong>${de}</strong> + ${bonus} (${nomStat}) = <strong>${total}</strong> contre ${etape.difficulte}
      — ${critique ? '🌟 20 NATUREL !' : echecCritique ? '💀 1 naturel…' : reussite ? '✅ Réussite !' : '❌ Échec…'}`;
    bloc.appendChild(resultat);
    const issue = reussite ? etape.reussite : etape.echec;
    const lignes = appliquerEffetDonjon(issue.effet);
    // L'épreuve est consommée : pas de relance en boucle.
    sauvegarderProgresDonjon(issue.suite);
    setTimeout(() => rendreResultatDonjon(issue.texte, lignes, issue.suite), 900);
  });
  bloc.appendChild(lancer);
  scene.appendChild(bloc);
  bloc.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function rendreChoixDonjon(etape, sansCarte) {
  const scene = el('donjon-scene');
  if (!sansCarte) scene.appendChild(carteScene(etape.qui, etape.emoji, etape.texte));
  const p = persoActif();
  const membres = membresEquipe();

  // En équipe locale, les décisions se prennent AU VOTE : chaque héros
  // choisit à son tour (on se passe l'écran), la majorité l'emporte,
  // et le chef d'expédition tranche les égalités.
  const contexte = etat.donjon;
  const enVote = membres.length > 1;
  if (enVote && !contexte.vote) contexte.vote = { votes: [], tour: 0 };

  const boutons = document.createElement('div');
  boutons.className = 'choix-donjon';
  if (enVote) {
    const votant = membres[contexte.vote.tour];
    const bandeau = document.createElement('div');
    bandeau.className = 'bandeau-vote';
    bandeau.innerHTML = `🗳️ <strong>Vote d'équipe</strong> (${contexte.vote.tour + 1}/${membres.length}) —
      au tour de <strong>${echapper(votant.nom)}</strong> ${votant.avatar} de choisir. Passez-lui l'écran !`;
    boutons.appendChild(bandeau);
  }
  etape.options.forEach((option, indexOption) => {
    const verif = conditionRemplie(option.condition, p);
    const btn = document.createElement('button');
    btn.className = 'btn-action choix-option';
    btn.disabled = !verif.ok;
    const voix = enVote ? contexte.vote.votes.filter((v) => v === indexOption).length : 0;
    const detail = verif.ok
      ? `${option.detail || ''}${verif.champion ? ` — c'est ${verif.champion.nom} qui agira` : ''}`
      : `🔒 ${option.detail || ''} — ${verif.raison}`;
    btn.innerHTML = `<strong>${option.texte}</strong>${voix ? ` <span class="badge">${voix} voix</span>` : ''}${detail ? `<span class="action-detail">${detail}</span>` : ''}`;
    btn.addEventListener('click', () => {
      if (!enVote) { choisirOptionDonjon(etape, option); return; }
      // Enregistre la voix du votant courant, puis passe au suivant.
      contexte.vote.votes.push(indexOption);
      contexte.vote.tour++;
      if (contexte.vote.tour < membres.length) {
        scene.querySelectorAll('.choix-donjon').forEach((x) => x.remove());
        rendreChoixDonjon(etape, true); // la carte de scène reste, seul le vote se rafraîchit
        return;
      }
      // Dépouillement : majorité, le chef (1er membre) tranche les égalités.
      const compte = {};
      contexte.vote.votes.forEach((v) => { compte[v] = (compte[v] || 0) + 1; });
      const maxVoix = Math.max(...Object.values(compte));
      const exaequo = Object.keys(compte).filter((k) => compte[k] === maxVoix).map(Number);
      const gagnante = exaequo.length > 1
        ? contexte.vote.votes[0] // le vote du chef départage
        : exaequo[0];
      const elue = etape.options[gagnante];
      afficherToast(`🗳️ L'équipe a tranché : « ${elue.texte} » (${maxVoix} voix${exaequo.length > 1 ? ' — le chef départage' : ''}).`);
      contexte.vote = null;
      choisirOptionDonjon(etape, elue);
    });
    boutons.appendChild(btn);
  });
  scene.appendChild(boutons);
  boutons.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function choisirOptionDonjon(etape, option) {
  const contexte = etat.donjon;
  // Un seul choix par étape : bloque le double-clic sur deux options.
  if (contexte.choixFait === contexte.etapeId) return;
  contexte.choixFait = contexte.etapeId;

  // Issue aléatoire (fiole mystère…) : tirage pondéré parmi les résultats.
  if (option.resultats) {
    const tirage = tirageAuPoids(option.resultats);
    const lignes = appliquerEffetDonjon(tirage.effet);
    // Le choix est consommé : reprendre plus tard mènera directement à la suite.
    sauvegarderProgresDonjon(tirage.suite);
    rendreResultatDonjon(tirage.texte, lignes, tirage.suite);
    return;
  }
  const lignes = appliquerEffetDonjon(option.effet);
  sauvegarderProgresDonjon(option.suite);
  if (option.resultat) {
    rendreResultatDonjon(option.resultat, lignes, option.suite);
  } else {
    demarrerEtapeDonjon(option.suite);
  }
}

function rendreResultatDonjon(texte, lignes, suite) {
  const scene = el('donjon-scene');
  scene.querySelectorAll('.choix-donjon, .scene-boutons').forEach((x) => x.remove());
  const carte = carteScene('Narrateur', '📜', texte);
  scene.appendChild(carte);
  if (lignes && lignes.length) {
    const bloc = document.createElement('div');
    bloc.className = 'panneau gains-donjon';
    lignes.forEach((ligne) => {
      const div = document.createElement('div');
      div.className = 'ligne-butin';
      div.textContent = ligne;
      bloc.appendChild(div);
    });
    scene.appendChild(bloc);
  }
  const boutons = document.createElement('div');
  boutons.className = 'rangee-boutons scene-boutons';
  const continuer = document.createElement('button');
  continuer.className = 'btn-principal';
  continuer.textContent = 'Poursuivre ➜';
  continuer.addEventListener('click', () => demarrerEtapeDonjon(suite));
  boutons.appendChild(continuer);
  scene.appendChild(boutons);
  continuer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function rendreTresorDonjon(etape) {
  const scene = el('donjon-scene');
  scene.appendChild(carteScene(etape.titre, '🎁', etape.texte));
  const lignes = appliquerEffetDonjon(etape.effet);
  // Le trésor est encaissé : reprendre plus tard mènera directement à la suite.
  sauvegarderProgresDonjon(etape.suite);
  if (lignes.length) {
    const bloc = document.createElement('div');
    bloc.className = 'panneau gains-donjon';
    lignes.forEach((ligne) => {
      const div = document.createElement('div');
      div.className = 'ligne-butin';
      div.textContent = ligne;
      bloc.appendChild(div);
    });
    scene.appendChild(bloc);
  }
  const boutons = document.createElement('div');
  boutons.className = 'rangee-boutons scene-boutons';
  const continuer = document.createElement('button');
  continuer.className = 'btn-principal';
  continuer.textContent = 'Poursuivre ➜';
  continuer.addEventListener('click', () => demarrerEtapeDonjon(etape.suite));
  boutons.appendChild(continuer);
  scene.appendChild(boutons);
}

// =====================================================================
// Combats de donjon
// =====================================================================
function defMonstreDonjon(cle) {
  return MONSTRES_DONJONS[cle] || MONSTRES[cle];
}

function lancerCombatDonjon(etape) {
  const contexte = etat.donjon;
  const { donjon } = contexte;
  const membres = membresEquipe();
  // Les combats scénarisés sont taillés pour un héros : on renforce
  // les monstres si l'équipe locale est plus nombreuse.
  const multEquipe = 1 + 0.35 * (membres.length - 1);
  const multAtkEquipe = 1 + 0.1 * (membres.length - 1);

  const cles = etape.type === 'boss' ? [etape.monstre] : etape.monstres;
  const annonces = [];
  const defs = cles.map((cle) => {
    const base = defMonstreDonjon(cle);
    let hp = base.hp * multEquipe;
    let atk = base.atk * multAtkEquipe;
    if (etape.type === 'boss') {
      (etape.modificateurs || []).forEach((mod) => {
        if (!contexte.drapeaux[mod.drapeau]) return;
        if (mod.hpMult) hp *= mod.hpMult;
        if (mod.atkMult) atk *= mod.atkMult;
        annonces.push(mod.annonce);
      });
    }
    return { ...base, cle, hp: Math.round(hp), atk: Math.round(atk) };
  });

  demarrerCombat({
    genre: 'donjon',
    zone: null,
    titre: `${donjon.emoji} ${donjon.nom}`,
    intro: etape.intro,
    monstresDef: defs,
    equipe: membres,
    donjon: { id: donjon.id, suite: etape.suite },
  });
  annonces.forEach((a) => journal(a));
  rendreCombat();
}

function apresVictoireDonjon(cb) {
  if (cb.ascension) { apresVictoireAscension(cb); return; }
  const contexte = etat.donjon;
  const membres = cb.equipe;
  const partage = membres.length;
  const butin = tirerButinCombat(cb);
  const xpParHeros = Math.max(1, Math.round(butin.xp / partage));
  const poParHeros = Math.max(0, Math.round(butin.po / partage));
  const lignes = [`⭐ +${xpParHeros} XP et 💰 +${poParHeros} po par héros`];
  Object.entries(butin.objets).forEach(([id, qte]) => {
    lignes.push(`${OBJETS[id].emoji} ${OBJETS[id].nom}${texteRarete(OBJETS[id])} ×${qte}`);
  });

  membres.forEach((m) => {
    if (m.hp <= 0) m.hp = 1;
    const poGagne = Math.round(poParHeros * multiplicateurOr(m));
    m.po += poGagne;
    m.compteurs.orTotal += poGagne;
    m.compteurs.monstres += cb.monstres.length;
    progresserQuete(m, 'monstres', cb.monstres.length);
    Object.entries(butin.objets).forEach(([id, qte]) => ajouterObjet(m, id, qte));
    const niveaux = gagnerXp(m, xpParHeros);
    verifierHautsFaits(m);
    nettoyerApresCombat(m); // pas de soin gratuit : l'histoire ménage ses repos
    if (niveaux > 0) lignes.push(`🎉 ${m.avatar} ${m.nom} passe niveau ${m.niveau} ! PV et PM restaurés.`);
    sauvegarder(m);
  });

  if (!contexte) { afficherButin({ titre: '🏆 Victoire !', lignes, retour: 'carte' }); return; }
  afficherButin({
    titre: '🏆 Salle nettoyée !',
    texte: 'L’histoire continue…',
    lignes,
    retour: 'carte',
    boutons: [{
      texte: '📖 Poursuivre l’histoire ➜',
      classe: 'btn-principal',
      action: () => demarrerEtapeDonjon(cb.donjon.suite),
    }],
  });
}

function apresDefaiteDonjon(cb) {
  if (cb.ascension) { apresDefaiteAscension(cb); return; }
  cb.equipe.forEach((m) => nettoyerApresCombat(m));
  const nomDonjon = etat.donjon ? etat.donjon.donjon.nom : 'du donjon';
  etat.donjon = null;
  // v14 : tomber dans une histoire, c'est mourir dedans.
  traiterMortEquipe(cb, [
    `📖 « ${nomDonjon} » garde votre progression : l'histoire vous attend au dernier chapitre atteint.`,
  ]);
}

// =====================================================================
// v13 — L'ASCENSION ÉTERNELLE : une épopée terminée ne meurt jamais.
// Le donjon vit « comme un bâtiment » : on y grimpe étage après étage,
// de plus en plus dur, sans soin entre les salles — jusqu'à la mort ou
// l'abandon. Tous les 3 étages : une épreuve au d20. Tous les 5 : l'écho
// du boss, plus dense à chaque cycle. Le record est gardé par épopée.
// =====================================================================
function recordAscension(p, idDonjon) {
  if (!p.ascensions || typeof p.ascensions !== 'object') p.ascensions = {};
  return p.ascensions[idDonjon] || 0;
}

function monstresDeLEpopee(donjon) {
  const cles = new Set();
  Object.values(donjon.etapes).forEach((e) => {
    if (e.type === 'combat') e.monstres.forEach((cle) => cles.add(cle));
  });
  return [...cles];
}

function bossDeLEpopee(donjon) {
  return Object.values(donjon.etapes).find((e) => e.type === 'boss').monstre;
}

function ouvrirAscension(donjon) {
  etat.ascension = { donjon, etage: 1 };
  afficherToast(`⛰️ L'Ascension de « ${donjon.nom} » commence. Pas de soin entre les étages — grimpez tant que vous tenez debout.`);
  demarrerEtageAscension();
}

function demarrerEtageAscension() {
  const a = etat.ascension;
  if (!a) return;
  const { donjon, etage } = a;

  // Tous les 3 étages (hors paliers de boss) : le donjon éprouve l'équipe.
  if (etage % 5 !== 0 && etage % 3 === 0) {
    rendreEpreuveAscension();
    return;
  }

  const membres = membresEquipe();
  const multEquipe = 1 + 0.35 * (membres.length - 1);
  const multAtkEquipe = 1 + 0.1 * (membres.length - 1);
  const croissanceHp = 1 + 0.15 * (etage - 1);
  const croissanceAtk = 1 + 0.06 * (etage - 1);

  let defs;
  let intro;
  if (etage % 5 === 0) {
    const cleBoss = bossDeLEpopee(donjon);
    const base = defMonstreDonjon(cleBoss);
    defs = [{
      ...base,
      cle: cleBoss,
      nom: `Écho de ${base.nom}`,
      hp: Math.round(base.hp * croissanceHp * multEquipe),
      atk: Math.round(base.atk * croissanceAtk * multAtkEquipe),
      xp: Math.round(base.xp * (0.5 + etage * 0.05)),
    }];
    intro = `⛰️ Étage ${etage} — le donjon reforme l'écho de son maître, plus dense à chaque cycle.`;
  } else {
    const pool = monstresDeLEpopee(donjon);
    const nb = Math.min(4, 2 + Math.floor(etage / 6));
    defs = Array.from({ length: nb }, () => {
      const cle = pool[alea(0, pool.length - 1)];
      const base = defMonstreDonjon(cle);
      return {
        ...base,
        cle,
        hp: Math.round(base.hp * croissanceHp * multEquipe),
        atk: Math.round(base.atk * croissanceAtk * multAtkEquipe),
      };
    });
    intro = `⛰️ Étage ${etage} — le donjon rebat ses cartes et vous oppose une salle nouvelle.`;
  }

  demarrerCombat({
    genre: 'donjon',
    ascension: true,
    zone: null,
    titre: `⛰️ ${donjon.nom} — Ascension, étage ${etage}`,
    intro,
    monstresDef: defs,
    equipe: membres,
    donjon: null,
  });
  rendreCombat();
}

// Étage-épreuve : un jet de d20 dont la difficulté grimpe avec l'étage.
function rendreEpreuveAscension() {
  const a = etat.ascension;
  const { donjon, etage } = a;
  rendreEnteteAscension();
  const scene = el('donjon-scene');
  scene.innerHTML = '';

  const stats = ['for', 'int', 'agi', 'vit', 'cha'];
  const stat = stats[Math.floor(etage / 3) % stats.length];
  const difficulte = 12 + Math.round(donjon.niveauMin * 0.6) + etage;

  const membres = membresEquipe();
  let champion = membres[0];
  membres.forEach((m) => {
    if ((statsEffectives(m)[stat] || 0) > (statsEffectives(champion)[stat] || 0)) champion = m;
  });
  const bonus = statsEffectives(champion)[stat] || 0;
  const nomStat = CARACS[stat].nom;
  const epreuveDe = /^[aeioué]/i.test(nomStat) ? `d’${nomStat}` : `de ${nomStat}`;

  scene.appendChild(carteScene('L’Ascension', '⛰️', `Étage ${etage} — le donjon ne vous envoie personne : il vous éprouve lui-même. Les murs se resserrent, l'air change, et quelque chose attend de voir de quoi vous êtes faits.`));

  const bloc = document.createElement('div');
  bloc.className = 'panneau bloc-epreuve';
  bloc.innerHTML = `<p>🎲 <strong>Épreuve ${epreuveDe}</strong> — difficulté ${difficulte}.
    ${membres.length > 1 ? `C'est <strong>${echapper(champion.nom)}</strong> (le plus doué, ${nomStat} ${bonus}) qui s'y colle.` : `Votre ${nomStat} : ${bonus}.`}</p>`;
  const lancer = document.createElement('button');
  lancer.className = 'btn-principal';
  lancer.textContent = '🎲 Lancer le d20 !';
  lancer.addEventListener('click', () => {
    lancer.disabled = true;
    const de = alea(1, 20);
    const total = de + bonus;
    const critique = de === 20;
    const echecCritique = de === 1;
    const reussite = critique || (!echecCritique && total >= difficulte);
    const resultat = document.createElement('p');
    resultat.className = 'resultat-de';
    resultat.innerHTML = `🎲 <strong>${de}</strong> + ${bonus} (${nomStat}) = <strong>${total}</strong> contre ${difficulte}
      — ${critique ? '🌟 20 NATUREL !' : echecCritique ? '💀 1 naturel…' : reussite ? '✅ Réussite !' : '❌ Échec…'}`;
    bloc.appendChild(resultat);
    const lignes = appliquerEffetDonjon(reussite
      ? { pvPct: 0.12, mpPct: 0.15, po: 15 * etage }
      : { pvPct: -0.15 });
    const texteIssue = reussite
      ? 'Le donjon incline ses murs, presque respectueux : une alcôve s\'ouvre, avec de quoi souffler et de quoi remplir les bourses.'
      : 'Le donjon vous secoue comme un sablier — vous atteignez le palier suivant meurtris, et il compte bien continuer.';
    setTimeout(() => {
      scene.appendChild(carteScene('L’Ascension', '⛰️', texteIssue));
      if (lignes.length) {
        const gains = document.createElement('div');
        gains.className = 'panneau gains-donjon';
        lignes.forEach((l) => {
          const div = document.createElement('div');
          div.className = 'ligne-butin';
          div.textContent = l;
          gains.appendChild(div);
        });
        scene.appendChild(gains);
      }
      const boutons = document.createElement('div');
      boutons.className = 'rangee-boutons scene-boutons';
      const continuer = document.createElement('button');
      continuer.className = 'btn-principal';
      continuer.textContent = `⬆️ Étage ${etage + 1} ➜`;
      continuer.addEventListener('click', () => {
        // Survivre à l'épreuve du donjon compte comme un étage conquis.
        membresEquipe().forEach((m) => {
          if (!m.ascensions || typeof m.ascensions !== 'object') m.ascensions = {};
          if (etage > (m.ascensions[donjon.id] || 0)) m.ascensions[donjon.id] = etage;
          verifierHautsFaits(m);
          sauvegarder(m);
        });
        a.etage++;
        demarrerEtageAscension();
      });
      boutons.appendChild(continuer);
      scene.appendChild(boutons);
      continuer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 900);
  });
  bloc.appendChild(lancer);
  scene.appendChild(bloc);
  montrerEcran('ecran-donjon');
}

function rendreEnteteAscension() {
  const { donjon, etage } = etat.ascension;
  const entete = el('donjon-entete');
  entete.innerHTML = `
    <div class="entete-lieu">
      <h2>⛰️ ${donjon.nom} — Ascension, étage ${etage}</h2>
      <button class="btn-choix btn-compact" id="ascension-quitter">🚪 Abandonner l'ascension</button>
    </div>`;
  el('ascension-quitter').addEventListener('click', () => terminerAscension('abandon'));
}

function terminerAscension(mode) {
  const a = etat.ascension;
  etat.ascension = null;
  if (a) {
    const record = recordAscension(persoActif(), a.donjon.id);
    afficherToast(mode === 'abandon'
      ? `⛰️ Vous redescendez de « ${a.donjon.nom} ». Record conservé : étage ${record}.`
      : `⛰️ Fin de l'ascension. Record : étage ${record}.`);
  }
  naviguer('carte');
}

function apresVictoireAscension(cb) {
  const a = etat.ascension;
  const membres = cb.equipe;
  const partage = membres.length;
  const butin = tirerButinCombat(cb);
  const bonusPo = a.etage * 12;
  const xpParHeros = Math.max(1, Math.round(butin.xp / partage));
  const poParHeros = Math.max(0, Math.round((butin.po + bonusPo) / partage));
  const lignes = [`⭐ +${xpParHeros} XP et 💰 +${poParHeros} po par héros (prime d'étage comprise)`];
  Object.entries(butin.objets).forEach(([id, qte]) => {
    lignes.push(`${OBJETS[id].emoji} ${OBJETS[id].nom}${texteRarete(OBJETS[id])} ×${qte}`);
  });

  let nouveauRecord = false;
  membres.forEach((m) => {
    if (m.hp <= 0) m.hp = 1;
    const poGagne = Math.round(poParHeros * multiplicateurOr(m));
    m.po += poGagne;
    m.compteurs.orTotal += poGagne;
    m.compteurs.monstres += cb.monstres.length;
    progresserQuete(m, 'monstres', cb.monstres.length);
    Object.entries(butin.objets).forEach(([id, qte]) => ajouterObjet(m, id, qte));
    const niveaux = gagnerXp(m, xpParHeros);
    if (!m.ascensions || typeof m.ascensions !== 'object') m.ascensions = {};
    if (a.etage > (m.ascensions[a.donjon.id] || 0)) {
      m.ascensions[a.donjon.id] = a.etage;
      nouveauRecord = true;
    }
    verifierHautsFaits(m);
    nettoyerApresCombat(m); // pas de soin entre les étages : c'est la règle
    if (niveaux > 0) lignes.push(`🎉 ${m.avatar} ${m.nom} passe niveau ${m.niveau} ! PV et PM restaurés.`);
    sauvegarder(m);
  });
  if (nouveauRecord) lignes.push(`⛰️ Nouveau record : étage ${a.etage} !`);

  afficherButin({
    titre: `⛰️ Étage ${a.etage} conquis !`,
    texte: 'Le donjon encaisse le coup — et reconstruit déjà l\'étage suivant, un peu plus haut, un peu plus dur.',
    lignes,
    retour: 'carte',
    boutons: [
      {
        texte: `⬆️ Étage ${a.etage + 1} ➜`,
        classe: 'btn-principal',
        action: () => {
          a.etage++;
          demarrerEtageAscension();
        },
      },
      {
        texte: '🚪 Redescendre (garder le record)',
        action: () => terminerAscension('retraite'),
      },
    ],
  });
}

function apresDefaiteAscension(cb) {
  const a = etat.ascension;
  etat.ascension = null;
  cb.equipe.forEach((m) => nettoyerApresCombat(m));
  const record = recordAscension(persoActif(), a.donjon.id);
  // v14 : l'Ascension tient sa promesse — on y grimpe jusqu'à la MORT.
  traiterMortEquipe(cb, [
    `⛰️ L'étage ${a.etage} de « ${a.donjon.nom} » a eu raison de votre expédition. Record conservé : étage ${record}.`,
  ]);
}

// =====================================================================
// Fin d'un donjon : épilogue et récompenses
// =====================================================================
function terminerDonjon(etape) {
  const contexte = etat.donjon;
  const { donjon, drapeaux } = contexte;
  const p = persoActif();
  const membres = membresEquipe();
  const prog = progresDonjon(p, donjon.id);

  // Épilogue selon les choix faits pendant l'aventure.
  const variante = (etape.variantes || []).find((v) => drapeaux[v.drapeau]);
  const texteFin = variante ? variante.texte : etape.texte;

  prog.fini = (prog.fini || 0) + 1;
  prog.epilogue = variante ? variante.cle : 'defaut';
  prog.checkpoint = null;
  prog.drapeaux = {};
  const premiere = prog.fini === 1;
  const mult = premiere ? 1 : 0.35;

  const lignes = [];
  const xpParHeros = Math.round(donjon.recompenses.xp * mult);
  const poParHeros = Math.round(donjon.recompenses.po * mult);
  lignes.push(`⭐ +${xpParHeros} XP et 💰 +${poParHeros} po par héros${premiere ? '' : ' (histoire déjà vécue)'}`);

  // L'objet unique de l'histoire (variante selon la fin), première fois seulement.
  if (premiere) {
    let idObjet = donjon.recompenses.objet;
    Object.entries(donjon.recompenses.objetParDrapeau || {}).forEach(([drapeau, id]) => {
      if (drapeaux[drapeau]) idObjet = id;
    });
    if (idObjet) {
      ajouterObjet(p, idObjet, 1);
      const objet = OBJETS[idObjet];
      lignes.push(`✨ ${objet.emoji} ${objet.nom}${texteRarete(objet)} — récompense unique de l'histoire !`);
    }
    Object.entries(donjon.recompenses.objets || {}).forEach(([id, qte]) => {
      ajouterObjet(p, id, qte);
      lignes.push(`${OBJETS[id].emoji} ${OBJETS[id].nom} ×${qte}`);
    });
    if (donjon.familier && !p.familiers.includes(donjon.familier)) {
      p.familiers.push(donjon.familier);
      const compagnon = FAMILIERS[donjon.familier];
      lignes.push(`🐾 ${compagnon.emoji} ${compagnon.nom} vous adopte à la fin de l'histoire !`);
    }
  }

  membres.forEach((m) => {
    m.po += poParHeros;
    m.compteurs.orTotal += poParHeros;
    progresserQuete(m, 'donjon', 1);
    const niveaux = gagnerXp(m, xpParHeros);
    if (niveaux > 0) lignes.push(`🎉 ${m.avatar} ${m.nom} passe niveau ${m.niveau} !`);
    verifierHautsFaits(m);
    sauvegarder(m);
  });
  rendreTopbar();

  // Rendu de l'épilogue
  const scene = el('donjon-scene');
  scene.innerHTML = '';
  const epilogue = document.createElement('div');
  epilogue.className = 'scene-donjon epilogue';
  epilogue.innerHTML = `
    <span class="scene-portrait">${donjon.emoji}</span>
    <div class="scene-corps">
      <div class="scene-nom">Épilogue${premiere ? '' : ' (histoire revécue)'}</div>
      <div class="scene-texte">${echapper(texteFin)}</div>
    </div>`;
  scene.appendChild(epilogue);

  const bloc = document.createElement('div');
  bloc.className = 'panneau gains-donjon';
  bloc.innerHTML = '<h3>🎁 Récompenses de l’histoire</h3>';
  lignes.forEach((ligne) => {
    const div = document.createElement('div');
    div.className = 'ligne-butin';
    div.textContent = ligne;
    bloc.appendChild(div);
  });
  scene.appendChild(bloc);

  const boutons = document.createElement('div');
  boutons.className = 'rangee-boutons scene-boutons';
  const retour = document.createElement('button');
  retour.className = 'btn-principal';
  retour.textContent = '🗺️ Refermer le livre — retour à la carte';
  retour.addEventListener('click', () => {
    etat.donjon = null;
    naviguer('carte');
  });
  boutons.appendChild(retour);
  scene.appendChild(boutons);
}
