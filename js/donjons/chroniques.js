'use strict';

// =====================================================================
// Les Chroniques des terres : un récit court par carte du monde
// =====================================================================

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
    ep2: { stat: 'dex', texte: 'La colline de la tanière est un piège à chevilles : terriers, os rongés, cailloux roulants. Il faut monter vite ET en silence.', ok: 'Vous montez comme des chats, de pierre sûre en pierre sûre. Au sommet, le vent tourne en votre faveur : il ne vous a pas sentis venir.', ko: 'Un os craque sous une botte. Toute la colline hurle. Vous finissez la montée en courant, sous une pluie de cailloux.' },
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
    zone: 'foret', nom: 'Le Berceau de Soie', emoji: '🕸️', statAcces: 'dex',
    pnj: { nom: 'Toinou le bûcheron', emoji: '🪓' },
    resume: 'La Matriarche tisse un cocon géant autour du chêne-cœur de la forêt. Ce qui en sortira n’a pas de nom.',
    scenes: [
      'La Forêt des Murmures murmure plus fort que d’habitude — et dans une seule direction. Au centre, là où poussait le chêne-cœur millénaire, les arbres sont blancs de soie jusqu’à la cime.',
      '« Je coupais du bois, je vous jure, du bois normal, » balbutie Toinou, l’apprenti bûcheron, la hache encore tremblante. « Et d’un coup : la soie. Partout. La Matriarche a enveloppé le chêne-cœur — elle en fait un berceau. Un berceau GÉANT. »',
      '« Le vieux forestier disait : ce que la Veuve-Reine couve dans un arbre-cœur naît avec les souvenirs de l’arbre. Mille ans de forêt dans une bête à huit pattes… Coupez la soie. Vite. Et pardon pour ce que j’ai réveillé. »',
    ],
    ep1: { stat: 'dex', texte: 'La toile commence bien avant le berceau : des fils-pièges tendus entre les troncs, fins comme des cheveux, sonores comme des cordes de luth. Un seul frôlé, et toute la forêt saura.', ok: 'Vous dansez entre les fils, ployés, tordus, retenant vos capes. Le dernier fil vibre — frôlé par une feuille morte, pas par vous. Dans un cocon abandonné : la bourse d’un voyageur moins souple.', ko: 'Une boucle de ceinture accroche un fil. La note court jusqu’au cœur de la forêt — et quelque chose d’énorme, là-bas, cesse de tisser pour écouter.' },
    combat1: 'Les sentinelles de la toile descendent des cimes en silence, suspendues à leurs fils.',
    dilemme: {
      texte: '« Il y a les œufs de la couvée d’avant, » chuchote Toinou en désignant une grappe de cocons. « On peut les porter hors de la toile — la Matriarche nous suivra à moitié folle mais elle mordra retenu, ses petits sont dans nos bras. Ou on passe au large, et tant pis pour l’avantage. »',
      optA: { stat: 'dex', texte: '🥚 Porter les cocons hors de la toile', detail: 'la Matriarche n’osera pas frapper fort', resultat: 'Vous cueillez les cocons comme des fruits trop mûrs et les déposez dans la fougère, hors de la toile. Un frisson parcourt toute la soie : elle SAIT. Et elle a peur pour eux.' },
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
    relique: { nom: 'Fil du Berceau', emoji: '🧵', bonus: { dex: 4, celerite: 2, pvMax: 16 }, desc: 'Un fil de la Veuve-Reine, incassable et léger. Récompense du « Berceau de Soie ».' },
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
    ep2: { stat: 'dex', texte: 'La dernière danse avant minuit : une gigue des morts au tempo impossible, où chaque faux pas vous rapproche des caveaux « invités permanents ».', ok: 'Vous tenez le tempo, puis le doublez. Les danseurs morts s’écartent en applaudissant des phalanges — le parquet est à vous.', ko: 'Le tempo vous sème. Des mains osseuses vous remettent dans le rythme sans douceur : on danse JUSQU’AU BOUT, ici.' },
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
    relique: { nom: 'Rose Noire du Bal', emoji: '🥀', bonus: { cha: 5, dex: 3, celerite: 2, pvMax: 18 }, desc: 'Elle ne fane pas — elle attend le prochain bal. Récompense du « Bal des Couronnes ».' },
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
      optA: { stat: 'dex', texte: '🥁 Poser les tambours d’eau en silence', detail: 'le Ver remontera sonné, au lieu choisi', resultat: 'Vous enterrez les tambours en quinconce, sur la pointe des pieds, pendant que le sol frémit sous vos semelles. La dernière outre vibre juste — le piège est une partition, et elle est prête.' },
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
    relique: { nom: 'Éclat de la Perle-Mère', emoji: '💠', bonus: { vit: 5, for: 3, tenacite: 2, pvMax: 24 }, desc: 'Un fragment qui ancre celui qui le porte. Récompense de « La Perle du Dessous ».' },
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
    zone: 'jungle-vai', nom: 'La Mue Royale', emoji: '🐍', statAcces: 'dex',
    pnj: { nom: 'Kaï le chasseur de lianes', emoji: '🏹' },
    resume: 'La Matriarche Sarpense mue — et sa vieille peau, imprégnée de mille ans de venin, se relève derrière elle. Il y aura bientôt DEUX reines.',
    scenes: [
      'La Jungle de Vaï-Sombre s’est tue — et quand la jungle se tait, les anciens disent qu’elle retient sa respiration. Au cœur des lianes, la Matriarche Sarpense a entamé sa Mue Royale, la première depuis un siècle.',
      '« Le problème n’est pas la mue, » murmure Kaï, accroupi sur une branche comme chez lui. « Le problème, c’est la PEAU. Mille ans de venin, de mémoire et de rancune imprégnés dedans. On raconte qu’une mue royale abandonnée se relève au bout de neuf jours. On est au huitième. »',
      '« Deux reines, une jungle : ça finit en guerre de territoire, et nous au milieu. Il faut brûler la vieille peau avant qu’elle ne marche — ou convaincre la Matriarche de la dévorer elle-même, comme l’exige l’ancienne coutume qu’elle a “oubliée”. Suivez mes marques. Et ne touchez à RIEN de brillant. »',
    ],
    ep1: { stat: 'dex', texte: 'La piste de Kaï traverse la canopée : trente mètres au-dessus du sol, de liane en liane, sur des branches que la sève de mue rend glissantes comme du verre huilé.', ok: 'Vous volez de prise en prise sur les traces de Kaï, qui finit par cesser de se retourner pour vérifier — son plus grand compliment. Dans un nid de feuilles : le carquois perdu de son maître, intact.', ko: 'Une branche vernie de sève se dérobe. La canopée vous fait la courte échelle à l’envers — étage par étage, jusqu’au tapis de fougères qui amortit mal.' },
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
    relique: { nom: 'Écaille de la Mue Royale', emoji: '🐍', bonus: { dex: 7, vit: 4, celerite: 3, pvMax: 26 }, desc: 'Une écaille de la première heure, souple et impénétrable. Récompense de « La Mue Royale ».' },
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
    relique: { nom: 'Coquille de l’Œuf de Foudre', emoji: '⚡', bonus: { vit: 6, dex: 5, tenacite: 3, pvMax: 28 }, desc: 'Un éclat de coquille qui gronde quand le danger approche. Récompense de « L’Œuf de Foudre ».' },
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
    relique: { nom: 'Facette du Sculpteur', emoji: '💎', bonus: { int: 9, vit: 5, tenacite: 3, pmMax: 34 }, desc: 'Un fragment d’Avatar où votre reflet bouge — lui. Récompense de « La Seconde Nuit ».' },
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
    ep2: { stat: 'dex', texte: 'La dernière vanne est sur le toit : une course de crête entre les arcs, sur des chemins de ronde où la foudre tombe TOUTES les quatre secondes — trois pour courir, une pour se plaquer. Volta compte à voix haute.', ok: 'Trois-secondes-PLAT. Trois-secondes-PLAT. Vous remontez la crête comme une couture d’éclairs, réglés sur la voix de Volta — la vanne s’ouvre, le ciel aspire son dû, et la citadelle soupire de tous ses créneaux.', ko: 'Un « plat » trop tardif : la foudre vous frôle assez près pour vous friser jusqu’à l’âme. La vanne s’ouvre — vous, vous vibrerez encore une semaine.' },
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
    relique: { nom: 'Fusible de Volta', emoji: '⚡', bonus: { int: 10, dex: 6, celerite: 3, pmMax: 40 }, desc: 'Il saute AVANT le coup dur — c’est tout son art. Récompense du « Paratonnerre ».' },
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
// Sorti en fonction : les Chroniques des Marches sont ajoutées après le
// chargement de ce fichier et doivent repasser par le même générateur.
function construireChroniques(liste) {
  liste.forEach((c) => {
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
}

construireChroniques(CHRONIQUES);
