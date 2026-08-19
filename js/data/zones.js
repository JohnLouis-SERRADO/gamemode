'use strict';

// =====================================================================
// Cartes du monde : zones, récoltes, histoires de carte, mini-boss
// =====================================================================

// =====================================================================
// Zones du monde
// =====================================================================
// =====================================================================
// v19 — Les actes du fil conducteur.
//
// La carte du monde se lit par acte plutôt qu'en une seule colonne de
// trente entrées : chaque acte se replie, et un acte dont aucune carte
// n'est encore accessible reste fermé.
//
// v22 — LES BORNES D'UN ACTE NE SONT PLUS DÉCLARÉES, ELLES SONT MESURÉES.
//
// CE QUI N'ALLAIT PAS. Les actes annonçaient « niv. 21-50 » et « niv.
// 51-78 » ; leurs premières cartes ouvraient au niveau 22 et au niveau 52.
// Le joueur atteignait le niveau 21, lisait « Acte II — niv. 21-50 »,
// dépliait… et ne trouvait qu'un cadenas « atteignez le niveau 22 ». Les
// deux bornes venaient de deux endroits différents, elles ont fini par se
// contredire.
//
// `de` et `a` ne servent plus qu'à RECRUTER les cartes d'un acte. Ce que
// l'en-tête affiche est calculé sur les cartes réellement présentes —
// impossible de promettre un niveau d'entrée qui n'existe pas.
// =====================================================================
// =====================================================================
// v26 — LE MONDE EN SIX ACTES : une seule histoire, du niveau 1 au 100.
//
// Le fil conducteur reste celui de Valciel : le monde est une
// RECONSTRUCTION, recousue six fois par le Premier Roi. Mais il se
// raconte désormais en six chapitres qui se suivent — chaque acte est un
// arc, chaque carte un chapitre, et les cartes se lisent dans l'ordre.
//
//   I    Le Réveil des Terres Sauvages   on part de rien, et les terres
//        elles-mêmes semblent mal réveillées — premiers indices.
//   II   L'Épreuve des Arides            sable, roche et cendre : les
//        ossements qu'on y déterre portent des COUTURES.
//   III  Les Mémoires Perdues            les archives des royaumes
//        oubliés : sept versions du monde, la nôtre est la septième.
//   IV   L'Abîme Élémen-Terre            les forces primordiales se
//        déchaînent — la couture faiblit, les éléments le sentent.
//   V    Les Frontières du Sanctuaire    aux portes du vide : les dieux
//        recousus, le néant, le dernier rempart.
//   VI   Le Crépuscule de la Réalité     la Couture, et celui qui coud.
//
// `de` et `a` ne servent qu'à RECRUTER les cartes d'un acte (par leur
// niveau d'entrée) ; les bornes affichées sont mesurées sur les cartes.
// =====================================================================
const ACTES_MONDE = [
  { id: 'reveil', nom: 'Acte I — Le Réveil des Terres Sauvages', emoji: '🌿', de: 1, a: 19,
    resume: 'Inscrit les premiers pas du héros face aux mystères d’un monde indompté.' },
  { id: 'arides', nom: 'Acte II — L’Épreuve des Arides', emoji: '🏜️', de: 20, a: 39,
    resume: 'Forge l’esprit du voyageur au travers des enfers de sable et de roche.' },
  { id: 'memoires', nom: 'Acte III — Les Mémoires Perdues', emoji: '🕯️', de: 40, a: 59,
    resume: 'Lève le voile sur les secrets séculaires des royaumes oubliés.' },
  { id: 'abime', nom: 'Acte IV — L’Abîme Élémen-Terre', emoji: '🌋', de: 60, a: 76,
    resume: 'Bouscule la destinée de l’aventurier face au déchaînement des forces primordiales.' },
  { id: 'sanctuaire', nom: 'Acte V — Les Frontières du Sanctuaire', emoji: '💀', de: 77, a: 91,
    resume: 'Éprouve la foi du champion aux portes du vide et des reliques divines.' },
  { id: 'crepuscule', nom: 'Acte VI — Le Crépuscule de la Réalité', emoji: '🪡', de: 92, a: 100,
    resume: 'Scelle l’ultime marche du champion vers le trône où se joue le sort du monde.' },
];

const EXPLORATIONS_POUR_BOSS = 3;

// ---------------------------------------------------------------------
// Acte I — Le Réveil des Terres Sauvages (niv. 1-20).
// Les chapitres 1 à 5 : le héros se lève, et les terres sauvages avec
// lui. À la fin de l'acte, la Forêt Pétrifiée pose la première vraie
// question : qu'est-ce qui peut changer une forêt en pierre EN UNE NUIT ?
// ---------------------------------------------------------------------
const ZONES = [
  {
    id: 'plaines', nom: 'Plaines de l’Aube', emoji: '🌾', niveauMin: 1, niveauMax: 4,
    desc: 'Tout commence ici : des prairies dorées, des gobelins voleurs de poules, et une route qui part vers l’inconnu. Les anciens disent que même le Premier Roi a foulé ces herbes — personne ne sait plus qui c’était.',
    monstres: ['gobelin', 'loup', 'sanglier'], boss: 'loupAlpha',
    recolte: [{ id: 'fibre-sauvage', chance: 0.9 }, { id: 'herbe-lunaire', chance: 0.55 }, { id: 'peau-de-loup', chance: 0.55 }, { id: 'defense-sanglier', chance: 0.4 }, { id: 'minerai-cuivre', chance: 0.3 }],
  },
  {
    id: 'foret', nom: 'Forêt des Murmures', emoji: '🌲', niveauMin: 4, niveauMax: 8,
    desc: 'Passé les Plaines, les arbres se resserrent et se mettent à chuchoter. Ils ne parlent pas de vous : ils répètent, en boucle, quelque chose qu’ils ont vu il y a très longtemps — et que personne ne comprend encore.',
    monstres: ['araignee', 'bandit', 'treant'], boss: 'araigneeMatriarche',
    recolte: [{ id: 'bois-chene', chance: 0.8 }, { id: 'seve-ambree', chance: 0.5 }, { id: 'soie-araignee', chance: 0.35 }, { id: 'fibre-sauvage', chance: 0.4 }, { id: 'minerai-cuivre', chance: 0.3 }],
  },
  {
    id: 'marais', nom: 'Marais de Brumeciel', emoji: '🐸', niveauMin: 8, niveauMax: 12,
    desc: 'La forêt s’enfonce et devient marais. La brume y monte à heure fixe, comme réglée par une main invisible — et sous l’eau noire, des pierres taillées affleurent, trop droites pour être naturelles. Ne buvez pas l’eau.',
    monstres: ['grenouilleGeante', 'sorciereMarais', 'serpentVoile'], boss: 'hydreBrumes',
    recolte: [{ id: 'lotus-noir', chance: 0.7 }, { id: 'herbe-lunaire', chance: 0.45 }, { id: 'soie-araignee', chance: 0.3 }, { id: 'seve-ambree', chance: 0.3 }, { id: 'minerai-cuivre', chance: 0.25 }],
  },
  {
    id: 'jungle-vai', nom: 'Jungle de Vaï-Sombre', emoji: '🌴', niveauMin: 12, niveauMax: 16,
    desc: 'Au sud du marais, la végétation devient folle : une jungle si dense que le jour n’y descend jamais tout à fait. Tout y pousse trop vite, tout y mord — comme si la terre elle-même avait la fièvre. Les chasseurs parlent d’arbres qui poussent en une nuit. Vous allez bientôt voir pire.',
    monstres: ['grenouilleDard', 'panthereOmbre', 'hommeLiane'], boss: 'matriarcheSarpense',
    recolte: [{ id: 'liane-tressee', chance: 0.8 }, { id: 'orchidee-lunaire', chance: 0.5 }, { id: 'venin-concentre', chance: 0.35 }, { id: 'lotus-noir', chance: 0.3 }, { id: 'minerai-cuivre', chance: 0.25 }],
  },
  {
    id: 'foret-petrifiee', nom: 'Forêt Pétrifiée', emoji: '🗿', niveauMin: 16, niveauMax: 20,
    desc: 'Et soudain, plus un bruit. Une forêt entière changée en pierre en une seule nuit, il y a mille ans — chaque feuille, chaque oiseau, figés en plein geste. C’est ici que le monde pose sa première vraie question : QU’EST-CE qui peut faire ça à une forêt ? La réponse est plus loin sur la route.',
    monstres: ['treantPetrifie', 'basilicRunique', 'moissonneurRunique'], boss: 'avatarQuartz',
    recolte: [{ id: 'bois-petrifie', chance: 0.75 }, { id: 'ambre-noir', chance: 0.45 }, { id: 'sphere-runique', chance: 0.2 }, { id: 'venin-concentre', chance: 0.3 }, { id: 'seve-ambree', chance: 0.35 }],
  },
];

// ---------------------------------------------------------------------
// Acte II — L'Épreuve des Arides (niv. 20-40).
// Chapitres 6 à 10 : le sable, la roche et la cendre. On y découvre les
// traces d'une civilisation d'AVANT les Royaumes — et dans la Vallée,
// des ossements qui portent des coutures. C'est le premier indice.
// ---------------------------------------------------------------------
ZONES.push(
  {
    id: 'collines', nom: 'Collines de Cuivre', emoji: '⛰️', niveauMin: 20, niveauMax: 24,
    desc: 'Passé la forêt de pierre, la terre devient rousse et sèche. Les clans orcs tiennent les mines — et leurs galeries les plus profondes butent toutes sur le même mur lisse, trop parfait, qu’aucun pic n’entame. Les orcs creusent AILLEURS, et ne disent pas pourquoi.',
    monstres: ['orc', 'chamanGobelin', 'golemMineur'], boss: 'chefOrc',
    recolte: [{ id: 'minerai-fer', chance: 0.8 }, { id: 'minerai-cuivre', chance: 0.5 }, { id: 'peau-de-loup', chance: 0.35 }, { id: 'fibre-sauvage', chance: 0.35 }, { id: 'ambre-noir', chance: 0.25 }],
  },
  {
    id: 'falaises-hurlantes', nom: 'Falaises Hurlantes', emoji: '🪨', niveauMin: 24, niveauMax: 28,
    desc: 'Des à-pics battus par des vents qui hurlent — et en écoutant bien, ce ne sont pas des cris : ce sont des NOMS. Des milliers de noms, récités sans fin, comme une liste qu’on refuse d’oublier. Personne n’a jamais retrouvé un seul de leurs porteurs.',
    monstres: ['harpieHurlante', 'gargouilleVigie', 'elementaireBourrasque'], boss: 'rokhTempetueux',
    recolte: [{ id: 'basalte-poli', chance: 0.8 }, { id: 'plume-de-rokh', chance: 0.5 }, { id: 'cristal-hurleur', chance: 0.3 }, { id: 'minerai-fer', chance: 0.35 }, { id: 'orchidee-lunaire', chance: 0.25 }],
  },
  {
    id: 'desert', nom: 'Désert d’Ambrezine', emoji: '🏜️', niveauMin: 28, niveauMax: 32,
    desc: 'Un océan de dunes ambrées, brûlant le jour, glacial la nuit. Sous le sable, les caravaniers déterrent des perles parfaites — et parfois des pans de murailles qui n’appartiennent à aucun royaume connu. Le désert recouvre quelque chose. Il le fait très bien.',
    monstres: ['scorpionGeant', 'banditDunes', 'elementaireSable'], boss: 'verDesSables',
    recolte: [{ id: 'perle-des-sables', chance: 0.6 }, { id: 'basalte-poli', chance: 0.35 }, { id: 'plume-de-rokh', chance: 0.3 }, { id: 'venin-concentre', chance: 0.25 }, { id: 'herbe-lunaire', chance: 0.3 }],
  },
  {
    id: 'steppe-cendres', nom: 'Steppe des Cendres', emoji: '🌋', niveauMin: 32, niveauMax: 36,
    desc: 'Après le sable, la cendre. Une plaine grise où la terre couve encore, comme au lendemain d’un incendie que personne n’a vu brûler. Les cendres fertilisent tout — et quand le vent les soulève, elles dessinent une seconde les contours d’un paysage qui n’est pas celui-ci.',
    monstres: ['chacalCendre', 'salamandreBraise', 'ogreMagmatique'], boss: 'behemothCendre',
    recolte: [{ id: 'cendre-fertile', chance: 0.7 }, { id: 'obsidienne-brute', chance: 0.45 }, { id: 'coeur-de-braise', chance: 0.25 }, { id: 'plume-de-rokh', chance: 0.3 }, { id: 'basalte-poli', chance: 0.3 }],
  },
  {
    id: 'vallee-geants', nom: 'Vallée des Géants', emoji: '🦴', niveauMin: 36, niveauMax: 40, note: 'équipe conseillée',
    desc: 'Le cimetière des géants d’avant les Royaumes. En dégageant les os, les pilleurs ont remarqué un détail qui change tout : certains fémurs portent des COUTURES. De grands points réguliers, comme si quelqu’un avait réparé les géants — ou le monde autour d’eux. Gardez cette image en tête. Elle reviendra.',
    monstres: ['geantDechu', 'mammouthSpectral', 'chamanOsseux'], boss: 'roiOssements',
    recolte: [{ id: 'os-de-geant', chance: 0.75 }, { id: 'peau-de-mammouth', chance: 0.45 }, { id: 'relique-antique', chance: 0.2 }, { id: 'obsidienne-brute', chance: 0.3 }, { id: 'cendre-fertile', chance: 0.3 }],
  },
);

// ---------------------------------------------------------------------
// Acte III (début) — Les Mémoires Perdues (niv. 40-60).
// Chapitre 11 : les Cryptes ouvrent l'acte des archives. La suite de
// l'acte (chant-ruines, jardins, balance, bibliothèque) vit dans
// zones-marches.js — c'est là que la vérité des sept mondes se lit.
// ---------------------------------------------------------------------
ZONES.push(
  {
    id: 'cryptes', nom: 'Cryptes Oubliées', emoji: '🕯️', niveauMin: 40, niveauMax: 44,
    desc: 'Sous la frontière des Arides, les tombeaux d’un royaume que l’Histoire a rayé. Ses rois n’ont pas de noms, ses dates ne collent à aucun calendrier — comme si ce royaume avait existé AVANT le début officiel du monde. Ses habitants, eux, se souviennent. Et ils n’apprécient pas les visites.',
    monstres: ['squelette', 'archerSquelette', 'pretreDechu', 'spectre'], boss: 'roiDechu',
    recolte: [{ id: 'os-ancien', chance: 0.8 }, { id: 'poussiere-spectre', chance: 0.45 }, { id: 'relique-antique', chance: 0.25 }, { id: 'os-de-geant', chance: 0.3 }, { id: 'cendre-fertile', chance: 0.3 }],
  },
);

// ---------------------------------------------------------------------
// Acte IV (chapitres 16 à 19) — L'Abîme Élémen-Terre (niv. 60-77).
// Les forces primordiales se déchaînent : mer, glace, magma, foudre.
// On comprendra à l'acte V POURQUOI les éléments s'affolent — la
// couture du monde faiblit, et ils le sentent avant tout le monde.
// ---------------------------------------------------------------------
ZONES.push(
  {
    id: 'abysses-emeraude', nom: 'Abysses d’Émeraude', emoji: '🐚', niveauMin: 60, niveauMax: 64,
    desc: 'L’acte des éléments s’ouvre sous la mer : une cité engloutie dont les lanternes brûlent encore, à des profondeurs où aucune flamme ne devrait vivre. L’océan y est agité de courants qui n’obéissent plus à aucune marée — le premier élément à s’affoler. Pas le dernier.',
    monstres: ['mureneRodeuse', 'crabeCuirasse', 'sireneFuneste'], boss: 'leviathanCorallien',
    recolte: [{ id: 'nacre-abyssale', chance: 0.7 }, { id: 'corail-sanglant', chance: 0.45 }, { id: 'larme-de-sirene', chance: 0.25 }, { id: 'perle-des-sables', chance: 0.35 }, { id: 'encre-noyee', chance: 0.2 }],
  },
  {
    id: 'pics', nom: 'Pics Gelés', emoji: '🏔️', niveauMin: 64, niveauMax: 68,
    desc: 'Après l’eau, le froid. Des sommets où le blizzard souffle depuis des années sans une seule accalmie — les glaciers avancent à vue d’œil, comme si l’hiver cherchait à recouvrir quelque chose avant qu’on ne le trouve. Les cristaux qu’on y taille ne fondent jamais. Jamais.',
    monstres: ['loupGlaces', 'elementaireGivre', 'yeti'], boss: 'elementaireAncien',
    recolte: [{ id: 'cristal-givre', chance: 0.75 }, { id: 'peau-de-mammouth', chance: 0.4 }, { id: 'nacre-abyssale', chance: 0.25 }, { id: 'obsidienne-brute', chance: 0.3 }],
  },
  {
    id: 'profondeurs', nom: 'Cœur des Profondeurs', emoji: '🌋', niveauMin: 68, niveauMax: 71,
    desc: 'Sous la glace, le feu. Le cœur incandescent du monde — et il a le hoquet : les coulées remontent, redescendent, s’arrêtent en plein air. Le Gardien éternel veille ici depuis la première aube, et pour la première fois de sa très longue garde, il a l’air INQUIET.',
    monstres: ['golemAncien', 'ombre', 'dragonnet'], boss: 'gardienEternel',
    recolte: [{ id: 'noyau-golem', chance: 0.6 }, { id: 'ecaille-draconique', chance: 0.35 }, { id: 'cristal-givre', chance: 0.35 }, { id: 'coeur-de-braise', chance: 0.3 }, { id: 'cendre-fertile', chance: 0.25 }],
  },
  {
    id: 'citadelle-foudre', nom: 'Citadelle de Foudre', emoji: '⛈️', niveauMin: 71, niveauMax: 74, note: 'équipe conseillée',
    desc: 'La forteresse volante des Archontes, échouée entre deux nuages. Ses maîtres commandaient à la foudre — et leurs registres, encore lisibles, parlent d’un « déséquilibre des fondations du monde » qu’ils avaient juré de surveiller. La foudre, elle, n’a pas cessé de monter la garde.',
    monstres: ['sentinelleAcier', 'vouivreOrage', 'forgeronFoudroye'], boss: 'archonteTempete',
    recolte: [{ id: 'fragment-de-foudre', chance: 0.7 }, { id: 'acier-celeste', chance: 0.4 }, { id: 'plume-d-archon', chance: 0.15 }, { id: 'noyau-golem', chance: 0.3 }, { id: 'orchidee-lunaire', chance: 0.25 }],
  },
);

// ---------------------------------------------------------------------
// Acte V (chapitre 23) — Les Frontières du Sanctuaire (niv. 77-92).
// Le Néant Scintillant : la déchirure elle-même. Le reste de l'acte
// (ossuaire, marches grises, gué, rempart) vit dans zones-marches.js.
// ---------------------------------------------------------------------
ZONES.push(
  {
    id: 'neant-scintillant', nom: 'Néant Scintillant', emoji: '🌌', niveauMin: 83, niveauMax: 86, note: 'équipe requise',
    desc: 'Une déchirure dans le monde, pleine d’étoiles qui ne sont pas les nôtres. C’est par des fentes comme celle-ci que tout ce que vous avez combattu s’est infiltré — et ce qui vit DANS la déchirure n’a pas de nom. Équipe obligatoire. Sérieusement.',
    monstres: ['horreurDuVide', 'tisseuseEtoiles', 'echoNeant'], boss: 'devoreurMondes',
    recolte: [{ id: 'etoffe-du-neant', chance: 0.7 }, { id: 'eclat-d-etoile', chance: 0.4 }, { id: 'essence-primordiale', chance: 0.15 }, { id: 'cendre-grise', chance: 0.3 }, { id: 'plume-d-archon', chance: 0.2 }],
  },
);

function zonePar(idZone) {
  return ZONES.find((z) => z.id === idZone);
}

// =====================================================================
// v17 : HISTOIRES DES TERRES — chaque carte cache des histoires uniques,
// découvertes au hasard de l'exploration. Chacune ne se vit qu'une fois
// (collection par héros) ; quand tout est découvert, la carte n'a plus
// de secrets — et le dit.
// recompense : { po?, xp?, soinPct?, materiau? (id de z.recolte) }
// =====================================================================

// « Histoire 1/5 de Le Trône du Premier Roi » : les cartes des Marches
// et de la Couture portent presque toutes un article, et le « de » collé
// devant donnait du « de Le » et du « de Les ». On contracte comme on
// parle. Les noms sans article (Plaines de l'Aube, Pics Gelés) gardent
// leur « de » tout simple.
function deLaCarte(nom) {
  if (/^Les\s+/i.test(nom)) return `des ${nom.replace(/^Les\s+/i, '')}`;
  if (/^Le\s+/i.test(nom)) return `du ${nom.replace(/^Le\s+/i, '')}`;
  if (/^La\s+/i.test(nom)) return `de la ${nom.replace(/^La\s+/i, '')}`;
  if (/^L[’']/i.test(nom)) return `de l’${nom.replace(/^L[’']/i, '')}`;
  return `de ${nom}`;
}

const HISTOIRES_ZONES = {
  plaines: [
    { titre: 'Le puits aux offrandes', texte: 'Un vieux puits croule sous les piécettes. Une inscription : « Prends si tu oses, donne si tu peux. » Vous osez.', recompense: { po: 15 } },
    { titre: 'L’épouvantail vétéran', texte: 'Un épouvantail porte un heaume cabossé et une médaille. Les corbeaux le saluent. Vous aussi, au cas où.', recompense: { xp: 25 } },
    { titre: 'La bergère et le loup', texte: 'Une bergère partage son pain : « Le Loup alpha ? Il était l’agneau de mon troupeau, avant la nuit des étoiles rouges. »', recompense: { soinPct: 0.2 } },
    { titre: 'Le marché fantôme', texte: 'À l’aube, des étals translucides vendent des souvenirs. Vous repartez avec une poignée de pièces très réelles.', recompense: { po: 25 } },
    { titre: 'Le gobelin poète', texte: 'Un gobelin déclame des vers sur un tonneau. C’est mauvais, mais sincère. Il vous paie pour avoir applaudi.', recompense: { po: 10, xp: 15 } },
  ],
  foret: [
    { titre: 'L’arbre à serments', texte: 'Un chêne couvert de rubans murmure les promesses qu’on lui a confiées. Vous en nouez un. La forêt approuve.', recompense: { xp: 35 } },
    { titre: 'Le luthier disparu', texte: 'Une cabane abandonnée, un violon inachevé. Quand le vent passe, il joue tout seul — juste, en plus.', recompense: { po: 30 } },
    { titre: 'Les toiles-cartes', texte: 'Les araignées tissent des toiles qui ressemblent à des cartes. L’une d’elles indique une cache de sève.', recompense: { materiau: 'seve-ambree' } },
    { titre: 'Le cercle de champignons', texte: 'Vous dormez par erreur dans un cercle de champignons. Vous vous réveillez reposé, avec des souvenirs qui ne sont pas les vôtres.', recompense: { soinPct: 0.35 } },
    { titre: 'Le bandit repenti', texte: 'Un bandit à la retraite garde un pont qui ne mène nulle part. Il paie les passants pour « garder la main ».', recompense: { po: 20, xp: 20 } },
  ],
  collines: [
    { titre: 'La mine chantante', texte: 'Une galerie où le cuivre vibre comme une cloche. Les mineurs orcs y interdisent les jurons — « ça désaccorde ».', recompense: { materiau: 'minerai-cuivre' } },
    { titre: 'Le duel de sommets', texte: 'Deux clans orcs règlent leurs différends à qui hurle le plus fort d’une colline à l’autre. On vous prend pour arbitre.', recompense: { po: 35, xp: 25 } },
    { titre: 'Le golem jardinier', texte: 'Un golem mineur cultive des fleurs dans un casque rouillé. Il vous offre un caillou « qui lui ressemblait ».', recompense: { materiau: 'minerai-fer' } },
    { titre: 'La forge froide', texte: 'Une forge abandonnée où le feu refuse de prendre depuis cent ans. Sur l’enclume, quelqu’un a laissé sa paie.', recompense: { po: 45 } },
    { titre: 'L’écho fidèle', texte: 'Dans cette vallée, l’écho répond avec trois secondes de retard — et parfois de meilleures idées que vous.', recompense: { xp: 40 } },
  ],
  marais: [
    { titre: 'Les lanternes des noyés', texte: 'Des feux follets alignés balisent un chemin sûr à travers la vase. Au bout, une bourse encore sèche.', recompense: { po: 40 } },
    { titre: 'La sorcière de comptoir', texte: 'Une sorcière tient une échoppe de thés « légèrement prophétiques ». Le vôtre annonce : « grosse fatigue, belle victoire ».', recompense: { soinPct: 0.3 } },
    { titre: 'Le lotus qui compte', texte: 'Un lotus noir n’éclot que si on lui récite la table de sept. Une grenouille vous souffle les réponses.', recompense: { materiau: 'lotus-noir' } },
    { titre: 'Le radeau du cartographe', texte: 'Un radeau chargé de cartes détrempées. Toutes fausses, sauf une, qui mène à un coffre de brume.', recompense: { po: 30, xp: 30 } },
    { titre: 'Le chœur des crapauds', texte: 'À la pleine lune, les crapauds chantent en canon. L’hydre, dit-on, garde le silence pour écouter.', recompense: { xp: 45 } },
  ],
  cryptes: [
    { titre: 'Le bibliothécaire mort', texte: 'Un squelette range inlassablement des ossuaires par ordre alphabétique. Il vous paie pour un coup de main.', recompense: { po: 50 } },
    { titre: 'La couronne d’essai', texte: 'Une couronne de plomb sur un coussin : « Essayez-moi. » Vous entendez trois secondes des pensées du Roi déchu. Ça suffit.', recompense: { xp: 55 } },
    { titre: 'Les bougies loyales', texte: 'Des bougies s’allument sur votre passage et s’éteignent derrière vous. L’une d’elles vous suit. Elle fond en pièces d’or.', recompense: { po: 40, xp: 25 } },
    { titre: 'Le gisant modeste', texte: '« Ci-gît quelqu’un de très bien, demandez autour. » La dalle sonne creux : quelqu’un de très bien cachait son épargne.', recompense: { po: 60 } },
    { titre: 'La poussière qui se souvient', texte: 'La poussière de spectre dessine des scènes du royaume disparu. Vous en apprenez plus qu’aucun livre.', recompense: { materiau: 'poussiere-spectre' } },
  ],
  desert: [
    { titre: 'L’oasis à l’envers', texte: 'Une oasis dont l’eau coule vers le haut. Les caravaniers y remplissent leurs gourdes en les tenant à l’envers.', recompense: { soinPct: 0.35 } },
    { titre: 'Le sphinx bègue', texte: 'Un sphinx pose des énigmes, mais bégaie la réponse en même temps. Il paie pour votre discrétion.', recompense: { po: 55 } },
    { titre: 'La dune roulante', texte: 'Une dune se déplace contre le vent. Sur son sommet, un mât de navire — et sa caisse de bord.', recompense: { po: 35, xp: 35 } },
    { titre: 'Les perles de rosée', texte: 'À l’aube, le désert transpire des perles. Le Ver colossal les évite : « trop précieuses pour être digérées ».', recompense: { materiau: 'perle-des-sables' } },
    { titre: 'Le cadran d’ombre', texte: 'Un obélisque projette l’ombre d’un autre lieu. Pendant une minute, vous voyez la mer. Vous en revenez grandi.', recompense: { xp: 60 } },
  ],
  pics: [
    { titre: 'Le refuge du silence', texte: 'Un refuge où le blizzard n’entre pas, par politesse. Le livre d’or contient trois siècles de mercis — et des étrennes.', recompense: { po: 60 } },
    { titre: 'La harpe de glace', texte: 'Des stalactites accordées jouent quand le vent tourne. Le yéti écoute, assis, presque délicat.', recompense: { xp: 65 } },
    { titre: 'Le thé de l’ermite', texte: 'Un ermite vous sert un thé qui fume à l’envers. « Réchauffe pour trois jours. » Il dit vrai.', recompense: { soinPct: 0.4 } },
    { titre: 'Le cristal boudeur', texte: 'Un cristal de givre refuse d’être ramassé — sauf si on lui présente les choses gentiment.', recompense: { materiau: 'cristal-givre' } },
    { titre: 'La cordée fantôme', texte: 'Des alpinistes spectraux vous assurent dans un passage délicat. Au sommet, leur cairn contient leur dernière paie.', recompense: { po: 45, xp: 40 } },
  ],
  profondeurs: [
    { titre: 'Le lac de verre', texte: 'Un lac de lave figée, poli comme un miroir. Votre reflet a une seconde de retard et l’air désolé.', recompense: { xp: 80 } },
    { titre: 'La monnaie du Gardien', texte: 'Des pièces frappées d’un visage que personne ne connaît. Les collectionneurs de Valciel en raffolent.', recompense: { po: 80 } },
    { titre: 'Le jardin d’obsidienne', texte: 'Des fleurs de verre noir poussent dans la chaleur. En cueillir une sans la briser porte chance — et rapporte.', recompense: { po: 50, xp: 50 } },
    { titre: 'L’écaille votive', texte: 'Un autel dragon couvert d’écailles offertes. Le dragonnet de tête vous en tend une : « pour la route ».', recompense: { materiau: 'ecaille-draconique' } },
    { titre: 'Le souffle du monde', texte: 'Une faille exhale un air brûlant à intervalles réguliers. Les anciens disaient : « le monde respire ». Vous respirez avec lui.', recompense: { soinPct: 0.5 } },
  ],
  'jungle-vai': [
    { titre: 'Le pont de lianes tressées', texte: 'Un pont tissé par les hommes-lianes eux-mêmes. Le péage : une histoire drôle. La vôtre passe, de justesse.', recompense: { po: 70 } },
    { titre: 'L’orchidée horloge', texte: 'Une orchidée qui s’ouvre à heure fixe. Les chasseurs règlent leurs montres dessus — et paient pour la garder secrète.', recompense: { materiau: 'orchidee-lunaire' } },
    { titre: 'La pluie tiède', texte: 'Il pleut à travers trois étages de canopée : l’eau arrive triée — potable, tiède, presque sucrée.', recompense: { soinPct: 0.4 } },
    { titre: 'Le temple aux singes', texte: 'Des singes gardent un temple et exigent un tribut de fruits. Ils rendent la monnaie en vieilles pièces d’or.', recompense: { po: 60, xp: 55 } },
    { titre: 'Les lucioles cartographes', texte: 'La nuit, les lucioles dessinent la carte exacte de la jungle. La Matriarche les laisse faire : même elle s’y perd.', recompense: { xp: 90 } },
  ],
  'falaises-hurlantes': [
    { titre: 'Le vent nominatif', texte: 'Le vent hurle des noms. Quand il crie le vôtre, les harpies s’écartent avec respect toute la journée.', recompense: { xp: 90 } },
    { titre: 'Le nid de trop-plein', texte: 'Les rokhs jettent de leurs nids ce qui brille trop. En contrebas, ça fait un tas très intéressant.', recompense: { po: 75 } },
    { titre: 'La gargouille mélomane', texte: 'Une gargouille fredonne du basalte — c’est une berceuse minérale. Vous dormez dix minutes, récupérez dix heures.', recompense: { soinPct: 0.45 } },
    { titre: 'Le cristal accordeur', texte: 'Un cristal hurleur donne le « la » à toute la falaise. Il mue une fois l’an : la vieille peau se ramasse.', recompense: { materiau: 'cristal-hurleur' } },
    { titre: 'L’escalier des paris', texte: 'Des marches taillées par des géants parieurs : chaque palier cache la mise d’un pari perdu.', recompense: { po: 55, xp: 60 } },
  ],
  'abysses-emeraude': [
    { titre: 'Les lanternes patientes', texte: 'Les lanternes de la cité engloutie brûlent sous l’eau depuis mille ans. L’une s’éteint à votre passage — relève de la garde.', recompense: { xp: 110 } },
    { titre: 'Le banc d’écailles', texte: 'Des poissons-miroirs vous escortent en reflétant un trésor. C’est une pub : le trésor existe, moyennant péage.', recompense: { po: 90 } },
    { titre: 'La sirène enrouée', texte: 'Une sirène a perdu sa voix. Vous chantez à sa place — les abysses, bon public, applaudissent en perles.', recompense: { materiau: 'nacre-abyssale' } },
    { titre: 'La bulle d’air ancien', texte: 'Une bulle d’air de l’ancien monde, prisonnière d’une arche. La respirer, c’est respirer l’an mille d’avant.', recompense: { soinPct: 0.5 } },
    { titre: 'Le marché des méduses', texte: 'Des méduses-lanternes tiennent un marché nocturne. Votre monnaie ne vaut rien ici — la leur, beaucoup chez vous.', recompense: { po: 70, xp: 70 } },
  ],
  'steppe-cendres': [
    { titre: 'Les fleurs de l’après', texte: 'Sur la cendre poussent des fleurs qui n’existent nulle part ailleurs. Les chacals les gardent — sauf une, pour vous.', recompense: { materiau: 'cendre-fertile' } },
    { titre: 'Le feu de camp éternel', texte: 'Un feu de camp brûle sans bois ni fumée depuis la Grande Éruption. La marmite au-dessus est toujours pleine.', recompense: { soinPct: 0.5 } },
    { titre: 'La caravane de verre', texte: 'La chaleur a vitrifié une caravane entière. Dans les coffres translucides, tout se voit — et se récupère.', recompense: { po: 95 } },
    { titre: 'L’ogre comptable', texte: 'Un ogre magmatique compte les braises une à une : « l’inventaire du volcan ». Il paie les auditeurs externes.', recompense: { po: 65, xp: 75 } },
    { titre: 'Le geyser ponctuel', texte: 'Un geyser de cendre chaude jaillit chaque heure pile. Le Béhémoth s’en sert de réveil.', recompense: { xp: 120 } },
  ],
  'foret-petrifiee': [
    { titre: 'La sève de pierre', texte: 'Au cœur d’un tronc pétrifié, la sève coule encore — en pierre liquide. Une goutte tient dans une fiole, et vaut cher.', recompense: { po: 120 } },
    { titre: 'Les feuilles gravées', texte: 'Chaque feuille de pierre porte une ligne de l’histoire de la nuit fatale. Vous en lisez un chapitre entier.', recompense: { xp: 150 } },
    { titre: 'L’oiseau statue', texte: 'Un oiseau pétrifié en plein vol, suspendu à rien. Le toucher porte bonheur ; le dépoussiérer rapporte.', recompense: { po: 80, xp: 80 } },
    { titre: 'L’ambre témoin', texte: 'Un bloc d’ambre noir enferme la dernière seconde d’avant la pétrification. Les runes du basilic y sont lisibles.', recompense: { materiau: 'ambre-noir' } },
    { titre: 'La clairière épargnée', texte: 'Une clairière verte, intacte, au milieu de la pierre. Personne ne sait pourquoi. On y dort comme nulle part.', recompense: { soinPct: 0.6 } },
  ],
  'vallee-geants': [
    { titre: 'La dent creuse', texte: 'Une molaire de géant, grande comme une maison — et aménagée en cache par des contrebandiers pressés.', recompense: { po: 130 } },
    { titre: 'La berceuse tellurique', texte: 'La nuit, la vallée ronfle. Les anciens jurent que les géants ne sont pas morts — juste très fatigués.', recompense: { xp: 160 } },
    { titre: 'L’os qui pousse', texte: 'Un fémur planté en terre a bourgeonné. Le chaman des os refuse d’en parler. Il en tombe des éclats précieux.', recompense: { materiau: 'os-de-geant' } },
    { titre: 'Le gué des phalanges', texte: 'On traverse la rivière sur les phalanges d’une main de géant. La légende dit qu’elle se refermera un jour. Pas aujourd’hui.', recompense: { po: 85, xp: 90 } },
    { titre: 'Le souffle chaud', texte: 'D’une gorge rocheuse monte un souffle tiède et régulier. Vous faites la sieste dedans. Meilleure sieste de votre vie.', recompense: { soinPct: 0.6 } },
  ],
  'citadelle-foudre': [
    { titre: 'Les horloges folles', texte: 'Toutes les horloges de la citadelle donnent une heure différente — chacune l’heure d’un monde. La vôtre paie en avance.', recompense: { po: 150 } },
    { titre: 'La bibliothèque conductrice', texte: 'Les livres se lisent en les touchant : le savoir passe en une décharge. Vous repartez les cheveux dressés et l’esprit plein.', recompense: { xp: 190 } },
    { titre: 'Le paratonnerre fleuri', texte: 'Au sommet, un paratonnerre a fleuri en fragments de foudre. Le jardinier automate vous en offre une bouture.', recompense: { materiau: 'fragment-de-foudre' } },
    { titre: 'La salle des échos', texte: 'Une salle qui rejoue les conversations d’il y a mille ans. Les Archontes y débattaient de vous. En bien, semble-t-il.', recompense: { po: 100, xp: 100 } },
    { titre: 'Le bain d’orage', texte: 'Une cuve où l’orage se prend en bain. S’y tremper picote — puis répare tout ce qui doit l’être.', recompense: { soinPct: 0.7 } },
  ],
  'neant-scintillant': [
    { titre: 'L’étoile apprivoisée', texte: 'Une petite étoile vous suit comme un chat. Elle repart en vous laissant une poignée de sa poussière.', recompense: { materiau: 'eclat-d-etoile' } },
    { titre: 'La porte sans maison', texte: 'Une porte seule, debout dans le vide. Frapper est poli. On vous glisse un pourboire sous la porte.', recompense: { po: 170 } },
    { titre: 'Le rivage du rien', texte: 'Le néant a une plage. Les vagues y déposent ce que les mondes perdent — aujourd’hui : une leçon, et des pièces.', recompense: { po: 110, xp: 120 } },
    { titre: 'Votre constellation', texte: 'Les étoiles d’ici se réarrangent pour dessiner votre silhouette. Le Dévoreur trouve ça « de mauvais goût ».', recompense: { xp: 220 } },
    { titre: 'Le silence habité', texte: 'Un silence si complet qu’il soigne. Vous restez une minute. Ou un an. Difficile à dire.', recompense: { soinPct: 0.75 } },
  ],
};

// =====================================================================
// v17 : MINI-BOSS — chaque zone a ses champions, versions redoutables
// des monstres locaux. Ils surgissent au hasard de l'exploration et
// laissent un petit coffre.
// =====================================================================
const TITRES_MINI_BOSS = ['le Balafré', 'l’Ancien', 'le Colossal', 'la Terreur locale', 'le Marque-Noir', 'l’Insatiable'];

function miniBossDe(z) {
  const cle = z.monstres[alea(0, z.monstres.length - 1)];
  const base = MONSTRES[cle];
  const titre = TITRES_MINI_BOSS[alea(0, TITRES_MINI_BOSS.length - 1)];
  return {
    ...base,
    cle,
    nom: `${base.nom} ${titre}`,
    niveau: (base.niveau || 1) + 1,
    miniBoss: true,
    hp: Math.round(base.hp * 2.6),
    atk: Math.round(base.atk * 1.3),
    dex: base.dex + 2,
    xp: Math.round(base.xp * 2.5),
    po: [base.po[0] * 2, base.po[1] * 3],
    drops: (base.drops || []).map((d) => ({ id: d.id, chance: Math.min(1, d.chance * 2) })),
  };
}
