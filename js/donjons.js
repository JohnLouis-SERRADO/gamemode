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
        suite: 'avant-boss',
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
              { poids: 3, texte: 'Un goût de miel et d’orage. Une chaleur formidable vous parcourt : la n° 47 était GÉNIALE. (Vitalité retrouvée, et une étrange chance au bout des doigts.)', effet: { pvPct: 0.4, mpPct: 0.4, po: 80 }, suite: 'cobayes' },
              { poids: 2, texte: 'Un goût de chaussette et d’éclair. Votre peau vire au vert pomme pendant une minute — et vos jambes flageolent. La n° 47 était ÉPOUVANTABLE.', effet: { pvPct: -0.2, drapeau: 'teint-vert' }, suite: 'cobayes' },
            ],
          },
          {
            texte: '🚫 Reposer la fiole avec précaution',
            detail: 'Boulon a dit : ne rien boire',
            resultat: 'Vous reposez la fiole. Boulon souffle de soulagement — un vrai petit sifflet de bouilloire.',
            suite: 'cobayes',
          },
        ],
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
        suite: 'runes',
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
            suite: 'boss',
          },
          {
            texte: '💰 « Marché conclu. Ton âme contre la liberté des autres. »',
            detail: 'Accepter son sacrifice — le plus sûr',
            resultat: 'Maëlle hoche la tête, très droite. « Cent ans de “Terre !” dans le vide. Au moins, ce cri-là aura servi. » Elle vous ouvre la voie.',
            suite: 'boss',
          },
        ],
      },
      boss: {
        type: 'boss',
        intro: 'Le capitaine Morvane se retourne, tricorne bas, sourire vert. « Des passagers clandestins ? Parfait. La brume avait justement un creux. »',
        monstre: 'capitaine-morvane',
        modificateurs: [
          { drapeau: 'pavillon-hisse', atkMult: 0.85, annonce: '🏴‍☠️ Morvane parade sous ses couleurs retrouvées — son sabre traîne, sa garde aussi !' },
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
            suite: 'atelier',
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
        suite: 'atelier',
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
            suite: 'avant-boss',
          },
          {
            texte: '🤫 Refuser — garder l’effet de surprise',
            detail: 'Ignarok ne vous verra pas venir : premier sang assuré',
            effet: { drapeau: 'surprise', pvPct: 0.2 },
            resultat: 'Barguzan repose son marteau avec un respect nouveau. « La discrétion. Mon maître n’en a jamais forgé. » Il vous offre à la place une gourde d’eau de source gardée froide dans la pierre — un luxe inouï, ici.',
            suite: 'avant-boss',
          },
        ],
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
        suite: 'avant-boss',
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
            suite: 'avant-boss',
          },
          {
            texte: '🤫 « Reste silencieuse. On entre sans prévenir. »',
            detail: 'Premier sang assuré : l’Archonte frappera à contretemps',
            effet: { drapeau: 'entree-silencieuse' },
            resultat: 'L’Écho s’éteint jusqu’à n’être qu’une veilleuse. Vous poussez les portes du trône dans un silence de fin du monde.',
            suite: 'avant-boss',
          },
        ],
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
function rendreCartesDonjons(conteneur, p) {
  const titre = document.createElement('div');
  titre.className = 'separateur-donjons';
  titre.innerHTML = '📖 <strong>Donjons d’histoire</strong> — des aventures uniques, avec des choix qui comptent';
  conteneur.appendChild(titre);

  DONJONS.forEach((donjon) => {
    const prog = progresDonjon(p, donjon.id);
    const verrouille = p.niveau < donjon.niveauMin;
    const enCours = !!prog.checkpoint;
    const carte = document.createElement('div');
    carte.className = 'carte-zone donjon-histoire' + (verrouille ? ' verrouillee' : '');
    let statut = '';
    if (prog.fini > 0) statut = ' ✅';
    else if (enCours) statut = ' 📖';
    let action = 'Commencer l’histoire';
    if (verrouille) action = `🔒 Atteignez le niveau ${donjon.niveauMin}.`;
    else if (enCours) action = '▶ Reprendre l’aventure en cours';
    else if (prog.fini > 0) action = 'Revivre l’histoire (récompenses réduites)';
    carte.innerHTML = `
      <div class="zone-emoji">${donjon.emoji}</div>
      <div class="zone-nom">${donjon.nom}${statut}</div>
      <div class="zone-plage">histoire · niv. ${donjon.niveauMin}+</div>
      <div class="zone-desc">${verrouille ? action : `${donjon.resume}<br><em>${action}</em>`}</div>`;
    if (!verrouille) rendreCliquable(carte, () => ouvrirDonjon(donjon));
    conteneur.appendChild(carte);
  });
}

// =====================================================================
// Moteur : ouverture, étapes, rendu narratif
// =====================================================================
function ouvrirDonjon(donjon) {
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
    const valeur = statsEffectives(p)[condition.stat] || 0;
    const nomStat = CARACS[condition.stat] ? CARACS[condition.stat].nom : condition.stat;
    return valeur >= condition.min
      ? { ok: true }
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
    lignes.push(`💧 +${Math.round(effet.mpPct * 100)} % de PM pour l'équipe`);
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

function rendreChoixDonjon(etape) {
  const scene = el('donjon-scene');
  scene.appendChild(carteScene(etape.qui, etape.emoji, etape.texte));
  const p = persoActif();

  const boutons = document.createElement('div');
  boutons.className = 'choix-donjon';
  etape.options.forEach((option) => {
    const verif = conditionRemplie(option.condition, p);
    const btn = document.createElement('button');
    btn.className = 'btn-action choix-option';
    btn.disabled = !verif.ok;
    const detail = verif.ok
      ? (option.detail || '')
      : `🔒 ${option.detail || ''} — ${verif.raison}`;
    btn.innerHTML = `<strong>${option.texte}</strong>${detail ? `<span class="action-detail">${detail}</span>` : ''}`;
    btn.addEventListener('click', () => choisirOptionDonjon(etape, option));
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
  cb.equipe.forEach((m) => {
    m.hp = Math.max(1, Math.round(m.maxHp * 0.5));
    m.mp = Math.max(0, Math.round(m.maxMp * 0.5));
    nettoyerApresCombat(m);
    sauvegarder(m);
  });
  etat.donjon = null;
  afficherButin({
    titre: '💫 Repoussés…',
    texte: 'Une force obscure vous rejette hors du donjon. Votre progression est sauvegardée : revenez plus forts, l’histoire vous attend au même chapitre.',
    lignes: ['📖 Reprenez l’aventure depuis la carte, au dernier chapitre atteint.'],
    retour: 'carte',
  });
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
