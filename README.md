# ⚔️ GameMode — Les Royaumes de Valciel

Un **RPG tour par tour dans l'esprit d'un MMORPG** (façon Final Fantasy XIV, en tout petit) : monde persistant, personnages sauvegardés, zones par niveau, donjons d'histoire façon *Donjons & Dragons*, artisanat par métiers… et un **multijoueur asynchrone** — chacun joue quand il veut, seul ou avec les autres.

Le tout en JavaScript pur, sans dépendance ni étape de build, jouable dans n'importe quel navigateur — mobile compris.

🕹️ **Jouer** : https://johnlouis-serrado.github.io/gamemode/

## 🎮 Ce qu'on y fait

- **Créer son héros** : 6 races à passifs uniques, **21 classes** (compétence signature exclusive + arbre de classe débloqué aux niveaux 5/10/15), 5 caractéristiques (Force 💪, Intelligence 🧠, Agilité 🏃, Vitalité ❤️, Chance 🍀). Progression jusqu'au **niveau 50**, points de maîtrise pour monter ses compétences en rang.
- **Explorer 16 zones** (niveaux 1 à 48), chacune avec ses monstres, son boss, ses difficultés (Normal/Héroïque/Cauchemar) et ses matériaux propres. Les packs de monstres **s'adaptent à la puissance de l'équipe**.
- **Vivre 9 donjons d'histoire** écrits comme des aventures de *Donjons & Dragons* : dialogues, intrigues, choix à conséquences, **votes d'équipe** sur chaque décision, **épreuves au d20** (la meilleure stat de l'équipe s'y colle, 20 naturel = triomphe), trésors, boss à phases uniques et épilogues à variantes. Les trois derniers sont des **défis de niveaux 50, 60 et 70**, enchaînés, pensés pour des équipes complètes.
- **Combattre au tour par tour** : ordre d'initiative affiché, critiques, blocage/esquive, statuts, bombes et élixirs tactiques, boss à mécaniques (phases, invocations, boucliers, enrage). En solo ou en **équipe sur le même écran**, et en **expéditions en ligne** à plusieurs appareils.
- **Pratiquer 3 métiers de récolte** : dans chaque zone, on choisit de **⛏️ miner**, **🔪 dépecer** ou **🌿 herboriser**. Chaque métier monte en niveau (meilleures quantités, matériaux signatures : pierre magique, cuir primal, tissu magique) — et **plus on a de Chance, plus la moisson est riche**. On choisit aussi sa **spécialité** ⭐ (sous-classe de récolteur) : le spécialiste récolte nettement plus dans son métier qu'un héros de passage et y progresse deux fois plus vite, avec un écart qui grandit encore avec la Chance.
- **Faire vivre le Bourg de Valciel**, découpé en quartiers :
  - 🏪 **Le quartier marchand** — trois boutiques spécialisées (armes, armures, accessoires & potions), l'Antiquaire à curiosités, l'Arcanium aux 68 grimoires de compétences ;
  - ⚒️ **La cour des artisans** — la Forge (armes, armures lourdes, lingots), la Tannerie (gants, bottes, cuirs), le Tisserand (accessoires, étoffes) et l'Alchimiste (potions de PV/mana, bombes, philtres) ;
  - 🏛️ **La grand-place** — Guilde des Aventuriers (6 contrats journaliers, 3 récompenses/jour), Auberge, Taverne.
- **Farmer et crafter** : ~4 500 objets en 7 raretés (jusqu'à Divin), panoplies à bonus de set (2/4 pièces), **craft en chaîne** (récolte brute → matériaux raffinés → grandes séries d'équipement, dont une série qui exige les trois métiers).
- **Grimper les tours** : la Tour Sans Fin (étages infinis, sans soins) et la **Tour des Boss** (16 boss, difficultés Normal/Héroïque/Cauchemar).
- **Se retrouver à la taverne** : 💬 chat, 🏆 classement (avec **fiche publique complète** de chaque héros), 🌍 boss du monde à barre de vie partagée, 🤝 comptoir d'échange entre joueurs.
- **31+ hauts faits** à titres portables, familiers à bonus passifs, jouable sur plusieurs appareils via un code de sauvegarde.

## 🌍 Multijoueur : comment ça marche

Le jeu détecte tout seul s'il peut joindre le monde en ligne (un backend Supabase — PostgreSQL + API REST) :

- **En ligne** : héros synchronisés, taverne active, boss du monde commun, groupes multi-appareils, échanges entre joueurs. Toutes les écritures passent par des fonctions RPC vérifiant un token secret par personnage (avec plafonds anti-triche). Le token n'est jamais lisible publiquement.
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
js/donjons.js   — 9 donjons d'histoire : moteur narratif (dialogues, choix, votes, épreuves d20) + récits complets
js/reseau.js    — client REST Supabase (fetch pur), synchronisation, taverne, fiches publiques, échanges
js/game.js      — profils persistants, création, fiche du héros, métiers, hauts faits, navigation
js/monde.js     — carte, exploration, récolte par métier, boss, Tour des Boss, boss du monde
js/ville.js     — quartiers du bourg : boutiques, artisans, Arcanium, Antiquaire, Guilde, Auberge
js/combat.js    — moteur de combat tour par tour (initiative, statuts, mécaniques de boss)
js/groupe.js    — expéditions en ligne à plusieurs appareils
```
