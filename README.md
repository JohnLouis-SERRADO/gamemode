# ⚔️ GameMode — Les Royaumes de Valciel

Un **RPG tour par tour dans l'esprit d'un MMORPG** (façon Final Fantasy XIV, en tout petit) : monde persistant, personnages sauvegardés, zones par niveau, donjons d'histoire façon *Donjons & Dragons*, artisanat par métiers… et un **multijoueur asynchrone** — chacun joue quand il veut, seul ou avec les autres.

Le tout en JavaScript pur, sans dépendance ni étape de build, jouable dans n'importe quel navigateur — mobile compris.

🕹️ **Jouer** : https://johnlouis-serrado.github.io/gamemode/

## 🎮 Ce qu'on y fait

### Devenir quelqu'un — six classes, quatre paliers d'identité

On ne choisit pas un métier une fois pour toutes : on le **devient**, par paliers, sur cent niveaux.

| Palier | Niveau | Ce qu'on choisit | Combien de possibilités |
| --- | --- | --- | --- |
| **Classe** | 1 | Son rôle dans le groupe | **6** |
| **Spécialité** | 10 | Sa manière de le tenir | **27** (4 à 5 par classe) |
| **Voie** | 50 | Son parti pris de jeu | **81** (3 par spécialité) |
| **Éveil** | 80 | Ce qui vous rend unique | **162** (6 par spécialité, tirés au sort) |

Les six classes couvrent la trinité MMORPG au complet :

- 🛡️ **Gardien** *(tank, plaque)* — Templier · Paladin · Chevalier Noir · Colosse
- ⚔️ **Guerrier** *(DPS mêlée physique, plaque)* — Berserker · Moine · Assassin · Danselame · Duelliste
- 🏹 **Franc-tireur** *(DPS distance physique, cuir)* — Rôdeur · Voleur · Traqueur · Voltigeur
- 🔮 **Arcaniste** *(DPS distance magique, tissu)* — Pyromancien · Givremage · Élémentaliste · Nécromancien · Invocateur
- ✨ **Devin** *(soigneur, tissu)* — Barde · Chaman · Druide · Oracle
- 🌑 **Runelame** *(DPS mêlée magique, maille)* — Faucheur · Corrupteur · Métamorphe · Runemaître · Vibrelame

**L'Éveil** est le seul palier qu'on ne choisit pas librement : au niveau 80, **trois propositions** sont tirées au sort parmi les six Éveils de votre spécialité, en six raretés (Rare → Épique → Légendaire → Mythique → Divin, plus un **Éveil caché** qui ne sort d'aucun tirage et se mérite par une condition secrète). Pourquoi trois et pas cinq : chaque spécialité ne compte que cinq Éveils tirables, et un tirage de cinq les aurait tous sortis à chaque fois — relances, verrou et garantie n'auraient servi à rien. Les cinq raretés tirables sont **équilibrées à 10 % près** — un Divin n'est pas plus fort, il est plus *singulier*. Cinq relances sans Mythique ? La sixième le garantit.

**701 compétences** au total : 56 de classe (48 pour les six classes jouables, plus les 8 de l'Aventurier historique, gardées pour les vieilles sauvegardes), 216 de spécialité, 81 de Voie, 324 d'Éveil et 24 du pool commun acheté à l'Arcanium. Ce pool commun est le seul qui s'achète : les compétences de spécialité, de Voie et d'Éveil se méritent à leur palier, jamais en boutique. Toujours **8 sorts équipés au maximum** — l'arbitrage ne disparaît jamais.

### Les caractéristiques, modèle Final Fantasy XIV

**Six attributs principaux** — 💪 Force · 🎯 Dextérité · 🧠 Intelligence · 🕊️ Esprit · ❤️ Vitalité · 🍀 Chance — qui déterminent *combien* vous frappez.

**Cinq sous-caractéristiques** — 💥 Critique · 🎲 Coup direct · ⚖️ Détermination · 💨 Célérité · 💧 Piété — qui déterminent *comment*. Elles ne s'achètent pas avec des points : elles viennent de l'équipement, ce qui rend le choix d'un objet aussi structurant que celui d'une compétence. Chacune est **plafonnée** : empiler une seule sous-caractéristique cesse de payer.

Un coup peut être **critique** (×1,5) *ou* **direct** (×1,25), jamais les deux — la Détermination, elle, majore tout sans exception. La Célérité décide de l'ordre du tour, la Piété gonfle le mana.

Elles étaient six : la **Ténacité** retranchait jusqu'à 40 % des dégâts subis, à plat et sans jet. Elle a été retirée (v21). Comme elle venait de l'équipement et que l'équipement se ramasse par paliers, deux zones voisines pouvaient opposer au joueur des dégâts du simple au double sans qu'une ligne du bestiaire ait bougé — mesuré au banc : 1,4 % des points de vie par tour là où le héros portait ses 40 %, 2,6 % là où il n'en portait que 4 %. La difficulté ne se lisait plus dans les monstres, elle se lisait dans le stuff. Encaisser se joue désormais avec ce qui se voit : les points de vie, les boucliers, la défense, la ligne où l'on se place — et le bestiaire a été recalibré sur des dégâts qu'on peut enfin lire directement.

### L'équipement a enfin une logique

Un mage ne porte pas d'armure de fer. Quatre **catégories d'armure** (tissu · cuir · maille · plaque) et six **familles d'arme** (lame · arc · bâton · calice · runique · pavois), chacune réservée aux classes qui en ont l'usage — et l'inventaire dit *pourquoi* un objet vous est refusé plutôt que de le griser en silence.

**18 298 objets** en 7 raretés (jusqu'au Divin ✨), dont **5 314 en boutique** et **386 recettes** d'artisanat. Chaque objet affiche, en face de ce que vous portez déjà, l'écart exact : `+3 💪 / −2 ❤️ ▲ mieux que l'équipé`.

### Un monde qui tourne sans vous

Le header affiche en permanence **l'heure du jour** (🌅 aube · ☀️ jour · 🌙 nuit) et la **météo** (claire · pluie · brume · tempête · canicule · blizzard), qui change toutes les trois heures pour **tous les joueurs en même temps** — même graine, même ciel. Et ça compte : la pluie dope l'eau et éteint le feu, le blizzard gèle, la nuit fait mal. Récolter sous la bonne météo rapporte davantage.

### Explorer, raconter, mourir

- **26 zones** (niveaux 1 à 90) en **quatre actes** qui se répondent, du champ de blé des Plaines de l'Aube jusqu'au Trône du Premier Roi.

  Chaque carte se joue par **cinq modes** — les mêmes partout, et **chacun avec sa ressource** :

  | Mode | Ce qu'on y fait | Ce qu'on en rapporte |
  | --- | --- | --- |
  | 🧭 **Expédition** | L'aventure : combats, histoires uniques, champions, marchand nomade | De l'or et des vivres — **aucun matériau d'artisanat** |
  | ⛏️ **Miner** | On sort la pioche | Pierres, minerais, cristaux |
  | 🌿 **Récolte** | On cueille | Plantes, fibres, étoffes |
  | 🔪 **Chasse** | Une **battue** : les peaux se prennent sur la bête, au combat | Cuirs, os, dépouilles |
  | 👑 **Boss** | Le maître des lieux, une fois vaincu la première fois | Son coffre et son trophée |

  La règle vaut jusque dans le butin des monstres : une battue rapporte des peaux, une embuscade rend la filière qu'on était en train de récolter, et une expédition ne rend **jamais** de matériau. Et la **menace du boss** tombe toujours sans prévenir.
- **35 donjons d'histoire** écrits comme des aventures de *Donjons & Dragons* : dialogues, choix à conséquences, **votes d'équipe**, **épreuves au d20**, boss à phases et épilogues à variantes.
  - 📜 **26 Chroniques des terres** — une par carte, avec son PNJ, son dilemme et son boss renforcé. Accès exigeant : niveau, caractéristique minimum, objet-clé en poche, boss de la carte vaincu.
  - 📖 **9 Épopées de Valciel** — les grandes histoires. Une épopée terminée ouvre son **Ascension éternelle** : des étages sans fin, **sans soin entre les salles**, jusqu'à la mort ou l'abandon.
- **Craindre la mort** : une expédition qui tombe, c'est la mort. L'équipement porté est **perdu à jamais**, le familier meurt avec le héros, la moitié de la bourse s'évapore et **un niveau s'efface**. Compétences, métiers et hauts faits, eux, survivent au voyage.

### 🗝️ La Tour de l'Éveil — défaire ses choix

Au niveau 60 s'ouvre la contrepartie de tout ce qui précède : **tout choix définitif a une porte de sortie payante**. Sept services, réglés en **Sceaux** — une monnaie qui ne s'achète pas et se gagne uniquement en grimpant la Tour Sans Fin et la Tour des Boss (un Sceau Majeur à chaque étage multiple de dix) :

changer de Voie · changer de spécialité · changer de rôle · relancer son Éveil · verrouiller une proposition · forcer une rareté Mythique · révéler un Éveil caché.

Le coût suit la gravité du changement, et **aucun service ne retire quoi que ce soit du grimoire** : rechoisir sa spécialité ne fait oublier aucune compétence apprise.

### Le Bourg de Valciel

- 🏪 **Le quartier marchand** — trois boutiques spécialisées, l'Antiquaire à curiosités, l'Arcanium aux grimoires. Le mythique et le divin ne s'achètent pas : ils se gagnent ou se fabriquent.
- ⚒️ **La cour des artisans** — Forge, Tannerie, Tisserand, Alchimiste : le vrai grand craft, en 7 raretés, avec bonus passifs de panoplie.
- 🧺 **La halle aux matières** — trois fournisseurs, un par filière : tous les matériaux s'achètent, mais récolter reste la voie du malin.
- 🏛️ **La grand-place** — Guilde des Aventuriers (6 contrats journaliers avec rareté, 3 récompenses/jour), Auberge, Taverne, et la Tour de l'Éveil à partir du niveau 60.

**3 métiers de récolte** (mineur · tanneur · tisseur) avec spécialité obligatoire au niveau 5, et une économie où **l'or est une contrainte** : les prix ont été relevés et les gains resserrés pour que la bourse redevienne un choix.

### Le confort, partout

- **Une barre de recherche sur chaque liste** — boutiques, inventaire, artisanat, Arcanium, comptoir d'échange, compétences. Elle ignore les accents et la casse, accepte les mots dans n'importe quel ordre, et cherche dans le nom, la description, la rareté, l'emplacement, le niveau, les bonus et la panoplie.
- **Tri et filtres** repliés dans un tiroir « Affiner » : la première ligne de résultats reste à portée de pouce.
- **Pagination** à 12 éléments, pour que 5 000 objets ne fassent pas 90 écrans de défilement.
- **Comparaison à l'équipé** sur chaque pièce, dans la boutique comme au comptoir d'échange.
- Design **mobile d'abord** : cibles tactiles de 44 px, contrastes vérifiés, focus visible au clavier, et respect de `prefers-reduced-motion`.

### Et aussi

- **Combat tour par tour** à deux lignes (⚔️ avant / 🏹 arrière), initiative par Célérité, statuts, bombes, boss à mécaniques.
- **Invocations** 🐾 : six créatures qui combattent seules, en payant leur mana — puis les PV de leur maître.
- **Tours sans fin** : la Tour Sans Fin et la Tour des Boss (16 boss, Normal/Héroïque/Cauchemar).
- **Taverne** : chat, sept classements, boss du monde à barre de vie partagée, comptoir d'échange.
- **37 hauts faits**, 6 races à passifs, 13 familiers à bonus.
- **Un bac à sable admin** 🛠️ : **cliquer sur le portrait du héros**, en haut à gauche, ouvre un verrou — le code donne accès à une console rangée en 9 sections, qui règle à la main le niveau (à la hausse comme à la baisse), les points de caractéristiques et de maîtrise, l'or, les Sceaux, les objets, les compétences, les métiers et les donjons. Le statut reste acquis au héros : le portrait mène ensuite droit à la console, et la « Zone rouge » permet d'y renoncer. L'autre porte existe toujours : taper `admin-valciel` dans « Reprendre un héros » crée un héros admin de zéro, local par défaut.
  Le verrou est un garde-fou de confort, pas une sécurité : tout le jeu tourne dans le navigateur du joueur.

## 🌍 Multijoueur : comment ça marche

Le jeu détecte tout seul s'il peut joindre le monde en ligne (un backend Supabase — PostgreSQL + API REST) :

- **En ligne** : héros synchronisés, taverne active, boss du monde commun, groupes multi-appareils, échanges entre joueurs. Toutes les écritures passent par des fonctions RPC vérifiant un token secret par personnage (avec plafonds anti-triche). Le token n'est jamais lisible publiquement.
- **Les expéditions de groupe** (jusqu'à 4 appareils) proposent six genres : explorer une zone, son boss, un étage de la **Tour Sans Fin**, la **Tour des Boss**, l'**assaut du boss final d'un donjon**, ou l'**Ascension éternelle d'une épopée**. C'est la **progression du chef** qui ouvre les expéditions — chacun combat à pleine puissance, et le record de chacun progresse. La défaite est mortelle, comme en solo.
- **Le groupe vit en direct** : chaque héros republie son état tant qu'il est au salon — l'**auberge**, un **niveau gagné**, une **compétence apprise** ou une **pièce d'équipement** arrivent sur les écrans des autres tout seuls, et c'est cet état-là que le chef fait combattre. On peut même quitter l'écran du groupe pour filer au Bourg : la veille continue en arrière-plan et ramène au combat quand le chef le lance. Et **recharger la page ne coûte plus le groupe** : on le retrouve au démarrage. Une expédition lancée fige les combattants — personne ne se soigne au milieu d'un combat.
- **Hors ligne** : tout le reste du jeu fonctionne normalement, sauvegardé sur l'appareil.

Aucun compte, aucun mot de passe : on crée un héros et on joue.

## ⚖️ Équilibrage : puissance et difficulté

Deux courbes gouvernent le jeu, et elles sont désormais **mesurées, pas devinées**.

- **L'équipement pèse ~40 % d'un héros** (contre 88 % avant la v20, où le personnage ne comptait
  plus, seul son butin comptait). Les trois générateurs — butin, étal du marchand, forges
  d'artisan — passent par une même échelle réglée en un seul endroit, et les pièces uniques
  écrites à la main sont plafonnées sur cette échelle. La rareté, elle, s'écarte **davantage**
  qu'avant : une pièce divine vaut quatre communes.
- **La puissance conseillée** n'est plus une formule approximative calibrée sur un héros nu, mais
  une mesure : `js/data/equilibrage.js` construit, pour chaque classe et chaque niveau, le héros le
  plus fort que le jeu autorise, et la recommandation se cale sur la classe la **moins** bien lotie.
- **Le bestiaire est calibré sur cette courbe.** Les points de vie et l'attaque écrits dans
  `js/data/monstres.js` disent le *caractère* de chaque bête ; l'échelle absolue est dérivée du
  héros, pour qu'un groupe de trois monstres de votre niveau tombe en une petite dizaine de tours
  et coûte à peu près la moitié de vos points de vie. Les récompenses suivent l'effort : un
  monstre plus long à abattre rapporte davantage.
- **Les compétences sont calibrées** sur le budget de leur rôle et de leur palier : un sort débloqué
  plus tard frappe forcément plus fort que le précédent, et un DPS frappe plus fort qu'un tank, qui
  frappe plus fort qu'un soigneur. Chaque sort garde son caractère — recharge, portée, cibles — donc
  deux compétences de valeur égale par tour n'ont pas du tout la même tête : l'une entretient la
  pression, l'autre s'économise pour achever.
- **Le niveau 100 ne s'atteint pas en une soirée.** Il demande environ 2 800 combats en farmant de
  façon optimale — soit **une trentaine d'heures**, délais du moteur compris. Un combat ne peut pas
  durer moins de ~45 s : le moteur impose 900 ms par tour de monstre et 400 ms entre deux tours, et
  une bataille tient une dizaine de manches. Jalons : niveau 26 en 3 h, niveau 51 en 10 h, niveau 81
  en 24 h. La progression est étirée de 1,45× au niveau 1 à
  3,1× au niveau 99 : les premiers niveaux restent vifs, la route se durcit à mesure qu'on approche
  du bout. Quatre heures de jeu mènent au niveau 30 environ, pas au bout — et ce décompte ne
  couvre que la montée en niveau : ni les trajets, ni l'inventaire, ni les donjons, ni les morts.
- **Aucun niveau ne se gagne en moins de dix combats.** Le plancher est posé là où il ne peut pas
  être contourné — au moment où l'expérience est créditée — et non dans la table des monstres : une
  table ne peut pas savoir qu'un héros de niveau 3 ira farmer la zone de niveau 90, qu'un groupe
  fera tomber six monstres d'un coup, ou qu'un joueur cumulera les quatre bonus d'XP du jeu (×1,39).
  Aucun gain, quelle qu'en soit la source, ne vaut plus d'un dixième du niveau en cours.
- **La courbe d'expérience monte régulièrement.** Un niveau coûte plus cher que le précédent — c'est
  le principe — mais la pente ne doit pas faire mur : il fallait 1,6 combat pour le niveau 1 et 185
  pour le niveau 99, un rapport de 114. L'XP d'un monstre est désormais dérivée du rythme voulu
  (une petite demi-douzaine de combats par niveau au début, une trentaine à la fin), et un test
  interdit qu'un palier exige d'un coup plus de 1,6 fois le précédent.
- **La marge de survie reste entre 2 et 4** dans le meilleur des cas, toutes classes et toutes
  zones confondues — au-delà, on survit quatre fois plus longtemps qu'il ne faut pour gagner et le
  combat cesse d'en être un. La Vitalité, seule caractéristique qui achetait deux choses à la fois
  (les points de vie de tous, et les dégâts du Gardien), ne rend plus que 60 % de sa valeur en
  attaque : le Gardien reste de loin le plus résistant, et tue lentement.

Les tests surveillent le tout — c'est précisément ce contrôle qui manquait.

## 🚀 Lancer le jeu

Ouvrez simplement `index.html` dans un navigateur, ou servez le dossier :

```bash
npx serve .
```

## ✅ Tests

Le jeu embarque sa propre page de tests, qui charge exactement les mêmes fichiers de données que le jeu :

```bash
npx serve .   # puis ouvrir /tests.html
```

**256 tests** en 23 suites vérifient les invariants qui ne doivent jamais casser : la courbe d'XP est strictement croissante jusqu'au niveau 100, chaque spécialité reçoit la même dotation de statistiques, aucune migration de sauvegarde ne retire quoi que ce soit à un héros existant, l'instantané publié au groupe est toujours le héros tel qu'il est *maintenant* — et, depuis la v20, **l'équilibrage lui-même est sous test** : l'équipement ne doit jamais peser plus de la moitié d'un héros, la puissance conseillée doit rester atteignable par les six classes, la tension d'un combat doit rester dans la même fourchette du niveau 1 au niveau 100, et personne ne doit pouvoir tuer d'un seul coup — ni les monstres, ni vous.

Depuis la **v22**, deux garde-fous de plus ferment la boucle : les quatre tables de cibles du bestiaire (PV et attaque, monstre et boss) sont **dérivées du héros de référence** et un test refuse qu'elles s'en écartent de plus de 2 %, et un héros équipé **mythique** — le plancher que désigne le chiffre « conseillé » — doit encore franchir l'intégralité du contenu de son niveau. Le héros de référence, lui, est désormais le vrai plafond du jeu : il se bloquait jusque-là sur du vieux matériel, et toute la difficulté était calibrée sur un fantôme un tiers trop faible.

## 🗂️ Structure du projet

```
index.html                       — tous les écrans du jeu
tests.html                       — la page de tests
css/style.css                    — thème sombre fantasy, mobile d'abord (35 jetons de design)

js/data/base.js                  — 6 attributs, 6 sous-caractéristiques, raretés, races
js/data/competences.js           — moteur de compétences, coût en mana, portées
js/data/classes.js               — les 6 classes de base
js/data/sous-classes.js          — 27 spécialités et leurs compétences
js/data/voies.js                 — 81 Voies (niveau 50)
js/data/eveils.js                — 162 Éveils (niveau 80), tirage et garanties
js/data/tour-eveil.js            — la Tour de l'Éveil, Sceaux et 7 services
js/data/progression.js           — courbe d'XP jusqu'au niveau 100, stats effectives, échelle de l'équipement
js/data/equilibrage.js           — le banc d'essai : héros étalon par classe et par niveau, tension d'un combat
js/data/equipement-types.js      — catégories d'armure, familles d'arme, qui porte quoi
js/data/objets-catalogue.js      — objets écrits à la main
js/data/objets-generes.js        — générateurs par niveau, rareté et catégorie
js/data/objets-craft.js          — séries de craft, panoplies, raffinage
js/data/monde-vivant.js          — heure du jour, météo partagée, effets
js/data/monstres.js              — bestiaire commun
js/data/zones.js                 — actes I et II (niveaux 1 à 46)
js/data/zones-marches.js         — actes III et IV (niveaux 52 à 90)
js/data/meta.js                  — métiers, hauts faits, familiers, quêtes

js/donjons/epopees.js            — les 9 Épopées de Valciel
js/donjons/chroniques.js         — les Chroniques des actes I et II
js/donjons/chroniques-marches.js — les Chroniques des actes III et IV
js/donjons/moteur.js             — moteur narratif (dialogues, votes, d20, Ascension)

js/ui-listes.js                  — recherche, tri, pagination, comparaison — partagés par toutes les listes
js/game.js                       — profils persistants, création, migrations, navigation
js/monde.js                      — carte, exploration, récolte, boss, tours
js/ville.js                      — le Bourg : boutiques, artisans, Arcanium, Guilde, Tour de l'Éveil
js/combat.js                     — combat tour par tour (initiative, critiques, statuts, boss)
js/groupe.js                     — expéditions en ligne à plusieurs appareils
js/reseau.js                     — client REST Supabase, taverne, fiches publiques, échanges
js/tests.js                      — les 256 tests

sql/                             — les fonctions RPC du backend Supabase, versionnées ici
```
