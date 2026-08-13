# ⚔️ GameMode — Les Royaumes de Valciel

Un **RPG tour par tour dans l'esprit d'un MMORPG** (façon Final Fantasy XIV, en tout petit) : monde persistant, personnages sauvegardés, zones par niveau, équipement, artisanat… et un **multijoueur asynchrone** — chacun joue quand il veut, seul ou avec les autres.

Le tout en JavaScript pur, sans dépendance ni étape de build, jouable dans n'importe quel navigateur — mobile compris.

## 🎮 Ce qu'on y fait

- **Créer son héros** : nom, avatar, 10 points de caractéristiques (Force 💪, Intelligence 🧠, Agilité 🏃, Vitalité ❤️) et **4 compétences choisies librement** parmi 18. Les héros sont **persistants** : sauvegardés sur l'appareil et, quand le monde en ligne est joignable, dans le cloud.
- **Explorer la carte** : 6 zones débloquées par niveau (des Plaines de l'Aube niv. 1 au Cœur des Profondeurs niv. 18), chacune avec ses créatures, ses matériaux à récolter et son **boss de zone**.
- **Combattre au tour par tour** : initiative, critiques, effets de statut, potions en plein combat, fuite… En **solo** ou jusqu'à **3 héros sur le même écran** (on se passe la main à chaque tour).
- **S'équiper** : 6 emplacements (arme, tête, torse, jambes, 2 accessoires), une cinquantaine d'objets qui améliorent réellement les stats.
- **Ville de Valciel** : boutique (achat/vente), **atelier de craft** (matériaux → potions et équipements légendaires introuvables en boutique), auberge (repos gratuit).
- **Progresser** : niveau 1 à 20, +2 points de caractéristiques par niveau, nouvelles compétences aux niveaux 4, 8, 12, 16 et 20.
- **Se retrouver à la taverne** (multijoueur asynchrone) :
  - 💬 **chat** entre tous les joueurs ;
  - 🏆 **classement** des héros ;
  - 🌍 **boss du monde** : une barre de vie géante **partagée par tout le monde** — chacun affronte sa propre instance du boss quand il veut, et tous les dégâts s'additionnent. Quand elle tombe à zéro, un boss plus redoutable apparaît.
- **Jouer sur plusieurs appareils** : chaque héros a un **code de sauvegarde** (fiche du héros) pour le reprendre ailleurs.

## 🌍 Multijoueur : comment ça marche

Le jeu détecte tout seul s'il peut joindre le monde en ligne (un backend Supabase — PostgreSQL + API REST) :

- **En ligne** : héros synchronisés, taverne active, boss du monde commun. Toutes les écritures passent par des fonctions RPC vérifiant un token secret par personnage (avec plafond anti-triche sur les dégâts de boss). Le token n'est jamais lisible publiquement.
- **Hors ligne** : tout le reste du jeu fonctionne normalement, sauvegardé sur l'appareil.

Aucun compte, aucun mot de passe : on crée un héros et on joue.

## 🚀 Lancer le jeu

Ouvrez simplement `index.html` dans un navigateur, ou servez le dossier :

```bash
npx serve .
```

## 🗂️ Structure du projet

```
index.html      — les écrans du jeu (titre, création, carte, zone, combat, butin, ville, boutique, atelier, héros, taverne)
css/style.css   — thème sombre fantasy, pensé mobile d'abord
js/data.js      — caractéristiques, compétences, progression (niveaux 1-20), stats effectives
js/objets.js    — ~50 objets (armes, armures, accessoires, potions, matériaux) + recettes d'atelier
js/zones.js     — 6 zones, ~25 monstres avec butins
js/reseau.js    — client REST Supabase (fetch pur), synchronisation, taverne multijoueur
js/game.js      — profils persistants, création, fiche du héros, inventaire, équipement, navigation
js/monde.js     — carte, exploration, récolte, boss, récompenses, boss du monde
js/ville.js     — boutique, atelier, auberge
js/combat.js    — moteur de combat tour par tour
```

## 🔮 Pistes pour la suite

- Groupes en ligne en temps réel (combat à plusieurs appareils via Supabase Realtime ou WebSocket).
- Quêtes et histoire, donjons instanciés, PvP en arène.
- Métiers de récolte et de craft avec niveaux dédiés.
- Événements mondiaux programmés (invasions, saisons).
