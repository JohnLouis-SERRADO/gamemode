# ⚔️ GameMode — Les Royaumes de Valciel

Un **RPG tour par tour dans l'esprit d'un MMORPG** (façon Final Fantasy XIV, en tout petit) : monde persistant, personnages sauvegardés, zones par niveau, donjons d'histoire façon *Donjons & Dragons*, artisanat par métiers… et un **multijoueur asynchrone** — chacun joue quand il veut, seul ou avec les autres.

Le tout en JavaScript pur, sans dépendance ni étape de build, jouable dans n'importe quel navigateur — mobile compris.

🕹️ **Jouer** : https://johnlouis-serrado.github.io/gamemode/

## 🎮 Ce qu'on y fait

- **Créer son héros** en trois pages guidées — identité (nom, avatar et **code de récupération** optionnel type email), race & classe, puis compétences : 6 races à passifs uniques, **21 classes** possédant chacune **8 compétences exclusives** (4 de base + signature dès le niveau 1, puis l'arbre aux niveaux 5/10/15) clairement séparées du **pool commun** (Arcanium, montées de niveau), 5 caractéristiques (Force 💪, Intelligence 🧠, Agilité 🏃, Vitalité ❤️, Chance 🍀). Toujours **8 sorts équipés au maximum**. Une fenêtre confirme toujours le choix du code (avec ou sans) avant la naissance du héros. Progression jusqu'au **niveau 50**, points de maîtrise pour monter ses compétences en rang. Le **coût en mana évolue avec la puissance** : plus une compétence frappe fort (stats), plus elle coûte — sans jamais dépasser 30 % du mana maximum.
- **Explorer 16 zones** (niveaux 1 à 48) via une **exploration unifiée** : combats (avec option 🔪 dépecer), filons à ⛏️ miner, coins d'🌿 herboriste, **histoires uniques** propres à chaque carte (une collection par zone), **mini-boss champions**, marchand nomade… et la **menace du boss** : un avertissement tombe — rester ou repartir ? — puis le maître des lieux frappe sans prévenir, au plus tard 8 explorations plus tard. Une fois vaincu, son **défi libre** se débloque (re-combats à volonté). Chaque carte affiche sa **puissance conseillée** ⚡, comparée à la vôtre.
- **Vivre 25 donjons d'histoire** écrits comme des aventures de *Donjons & Dragons* : dialogues, intrigues, choix à conséquences, **votes d'équipe** sur chaque décision, **épreuves au d20** (la meilleure stat de l'équipe s'y colle, 20 naturel = triomphe), trésors, boss à phases uniques et épilogues à variantes. Ils se répartissent en deux registres :
  - 📜 **Les Chroniques des terres** — la petite histoire de chaque carte (16 récits, un par zone, avec son PNJ, son dilemme et son boss de zone renforcé). Accès exigeant : niveau minimum, caractéristique minimum, **objet-clé de la zone en poche** et **boss de la carte vaincu**. Récompense : une relique unique par chronique.
  - 📖 **Les Épopées de Valciel** — les grandes histoires (6 récits fondateurs + les **défis 50/60/70** enchaînés). Une épopée terminée ne meurt jamais : elle ouvre son **Ascension éternelle** — des étages sans fin de plus en plus durs (épreuve au d20 tous les 3 étages, écho du boss tous les 5), **sans soin entre les salles, jusqu'à la mort ou l'abandon**, avec un record par épopée.
- **Combattre au tour par tour** : ordre d'initiative affiché, critiques, blocage/esquive, statuts, bombes et élixirs tactiques, boss à mécaniques (phases, invocations, boucliers, enrage). L'équipe se déploie sur **deux lignes** — ⚔️ avant et 🏹 arrière : en ligne arrière, les coups **physiques** perdent 40 % (donnés ET subis) tandis que la **magie ignore les lignes** ; les lanceurs de sorts y démarrent naturellement, et **se déplacer consomme un tour**. En solo ou en **équipe sur le même écran**, et en **expéditions en ligne** à plusieurs appareils.
- **Invoquer des créatures** 🐾 : six sorts d'invocation à l'Arcanium (Loup spectral, Golem de basalte, Feu follet, Ondine des marées, Corbeau d'orage, Ombre de Nihelm). Une invocation par héros et par combat — sauf pour l'**Invocateur** 🐉, qui en entretient **deux à la fois** : la créature apparaît avec **50 % du mana de son maître**, des stats **bridées aux siennes**, ses 4 compétences propres qu'elle paie en mana — puis **en PV** quand il s'épuise — et elle combat **toute seule, au hasard**, jusqu'à sa mort ou la fin du combat.
- **Pratiquer 3 métiers de récolte**, au fil de l'exploration : les filons se **⛏️ minent**, les herbes s'**🌿 herborisent**, et les dépouilles des combats se **🔪 dépècent**. Chaque métier monte en niveau (meilleures quantités, matériaux signatures : pierre magique, cuir primal, tissu magique) — et **plus on a de Chance, plus la moisson est riche**. Au **niveau 5**, chaque héros choisit obligatoirement sa **spécialité** ⭐ (sous-classe de récolteur) via une fenêtre dédiée : le spécialiste récolte nettement plus dans son métier qu'un héros de passage et y progresse deux fois plus vite, avec un écart qui grandit encore avec la Chance. Et chaque sous-classe compte : le craft suit les filières — les pièces de forge exigent pierres et minerais, les cuirs de la Tannerie viennent des dépouilles, les accessoires du Tisserand se tissent de plantes et fibres, avec les matériaux signatures des spécialistes dès le niveau 20.
- **Faire vivre le Bourg de Valciel**, découpé en quartiers :
  - 🏪 **Le quartier marchand** — trois boutiques spécialisées (armes, armures, accessoires & potions) qui vendent **du commun au légendaire, sans bonus de panoplie** (le mythique et le divin se gagnent ou se fabriquent), l'Antiquaire à curiosités, l'Arcanium aux grimoires de compétences **communes** (dont les 6 sorts d'invocation). Filtres par type et rareté partout, **à l'achat comme à la vente**, avec toutes les infos des objets ;
  - ⚒️ **La cour des artisans** — la Forge, la Tannerie, le Tisserand et l'Alchimiste : le **vrai grand craft**, selon le niveau du joueur, avec des séries en **7 raretés jusqu'au Divin** et leurs bonus passifs de panoplie. Les recettes encore verrouillées s'affichent grisées avec leur cadenas 🔒 ;
  - 🧺 **La halle aux matières** — trois fournisseurs, un par filière : ⛏️ La Minière, 🐾 Le Séchoir et 🌿 L'Herboristerie. **Tous les matériaux de craft s'y achètent** selon le niveau du joueur — bruts (4× le rachat), raffinés, et même les signatures des spécialistes (6×, niveau 20+) : récolter reste la voie du malin. Chaque fournisseur rachète aussi les surplus de sa filière ;
  - 🏛️ **La grand-place** — Guilde des Aventuriers : 6 contrats journaliers **avec rareté** (du commun au divin — plus le contrat est rare, plus il exige et plus il paie, coffre dopé à la clé), 3 récompenses/jour ; Auberge, Taverne.
- **Farmer et crafter** : ~4 500 objets en 7 raretés (jusqu'à Divin), panoplies à bonus de set (2/4 pièces), **craft en chaîne** (récolte brute → matériaux raffinés → grandes séries d'équipement, dont une série qui exige les trois métiers).
- **Grimper les tours** : la Tour Sans Fin (étages infinis, sans soins) et la **Tour des Boss** (16 boss, difficultés Normal/Héroïque/Cauchemar).
- **Se retrouver à la taverne** : 💬 chat, 🏆 **sept classements** (niveau, ⚡ puissance, fortune, boss du monde, tours, hauts faits — avec **fiche publique complète** de chaque héros), 🌍 boss du monde à barre de vie partagée, 🤝 comptoir d'échange entre joueurs avec filtres et infos complètes des objets.
- **Jouer comme sur mobile** : header d'état (nom, niveau, ⚡ puissance, PV, mana), **barre de navigation basse** (Carte · Ville · Inventaire · Taverne · Profil — avec déconnexion), **popups de célébration** à chaque déblocage (zones, tours, compétences de classe, hauts faits, familiers, difficultés…), et tout ce qui n'est pas débloqué s'affiche **grisé avec son cadenas** 🔒. La **puissance du joueur** (stats + équipement + niveau) est affichée partout et comparée aux recommandations de chaque contenu.
- **Craindre la mort** : une expédition qui tombe, c'est la mort — l'équipement porté est **perdu à jamais**, le familier qui accompagnait le héros **meurt avec lui**, la moitié de la bourse s'évapore et **1 niveau s'efface** (avec ses points de caractéristiques). Puis la ville, le repos… et la révélation : mourir renvoie dans le passé, là où le destin peut encore s'écrire autrement — car les compétences, métiers et hauts faits, eux, survivent au voyage.
- **36 hauts faits** à titres portables, familiers à bonus passifs, jouable sur plusieurs appareils via le **code de récupération** choisi à la création (ou ajouté plus tard depuis la fiche) — le code de sauvegarde technique reste là en secours. Et si un héros est supprimé, la **purge est totale** : plus aucune trace de son nom nulle part (classement, chat, échanges, groupes).

## 🌍 Multijoueur : comment ça marche

Le jeu détecte tout seul s'il peut joindre le monde en ligne (un backend Supabase — PostgreSQL + API REST) :

- **En ligne** : héros synchronisés, taverne active, boss du monde commun, groupes multi-appareils, échanges entre joueurs. Toutes les écritures passent par des fonctions RPC vérifiant un token secret par personnage (avec plafonds anti-triche). Le token n'est jamais lisible publiquement.
- **Les expéditions de groupe** (jusqu'à 4 appareils) proposent six genres : explorer une zone, son boss, un étage de la **Tour Sans Fin**, la **Tour des Boss**, l'**assaut du boss final d'un donjon**, ou l'**Ascension éternelle d'une épopée** — des étages **sans fin, enchaînés sans soin ni retour au salon** (écho du boss tous les 5 étages, épreuve au d20 tous les 3 — le plus doué de l'équipe s'y colle, le sort de tous en dépend). C'est la **progression du chef** qui ouvre les expéditions (étages, difficultés, donjons) — aucune limite imposée par les autres membres, **chacun combat à pleine puissance** — et le record de **chacun** progresse à chaque victoire. Les **invocations** combattent aussi en ligne, et la **défaite est mortelle** — la vraie mort, sur chaque écran, comme en solo.
- **Hors ligne** : tout le reste du jeu fonctionne normalement, sauvegardé sur l'appareil.

Aucun compte, aucun mot de passe : on crée un héros et on joue.

## 🚀 Lancer le jeu

Ouvrez simplement `index.html` dans un navigateur, ou servez le dossier :

```bash
npx serve .
```

## 🗂️ Structure du projet

```
index.html      — les écrans du jeu (titre, création, carte, zone, combat, butin, ville, boutiques, ateliers, donjon, héros, sac, taverne)
css/style.css   — thème sombre fantasy, pensé mobile d'abord
js/data.js      — caractéristiques, classes, compétences, métiers, hauts faits, progression (niveaux 1-50)
js/objets.js    — ~4 500 objets (générateurs par niveau/rareté), panoplies, recettes, raffinage
js/zones.js     — 16 zones, ~65 monstres avec butins
js/donjons.js   — 25 donjons d'histoire (16 Chroniques + 9 Épopées) : moteur narratif (dialogues, choix, votes, épreuves d20, Ascension éternelle) + récits complets
js/reseau.js    — client REST Supabase (fetch pur), synchronisation, taverne, fiches publiques, échanges
js/game.js      — profils persistants, création, fiche du héros, métiers, hauts faits, navigation
js/monde.js     — carte, exploration, récolte par métier, boss, Tour des Boss, boss du monde
js/ville.js     — quartiers du bourg : boutiques, artisans, Arcanium, Antiquaire, Guilde, Auberge
js/combat.js    — moteur de combat tour par tour (initiative, statuts, mécaniques de boss)
js/groupe.js    — expéditions en ligne à plusieurs appareils
```
