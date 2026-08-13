# ⚔️ GameMode — Les Profondeurs

Un RPG **tour par tour coopératif**, dans l'esprit d'un MMORPG, à jouer **entre amis dans la vraie vie** sur un même écran (mode « hot-seat » : on se passe l'écran à chaque tour).

Aucune installation, aucun serveur : tout tourne dans le navigateur.

## 🎮 Comment jouer

1. Ouvrez `index.html` dans un navigateur (double-clic suffit), ou servez le dossier :
   ```bash
   npx serve .
   ```
2. Choisissez le nombre de joueurs (1 à 5).
3. **Chaque joueur crée son personnage** :
   - un nom et un avatar ;
   - **10 points** à répartir entre Force 💪, Intelligence 🧠, Agilité 🏃 et Vitalité ❤️ ;
   - **4 compétences choisies librement** parmi 18 (physiques, magiques, soutien) ;
   - des modèles rapides (Guerrier, Mage, Archer, Clerc) pour démarrer vite — modifiables.
4. Le groupe affronte les **5 combats du donjon**, jusqu'au gardien final.
5. À chaque tour de combat, on passe l'écran au joueur dont c'est le tour : il choisit son action et sa cible.

## ⚙️ Les règles en bref

- **Initiative** : l'ordre des tours dépend de l'Agilité (plus un dé).
- **Actions** : Attaque gratuite, Défendre (−50 % de dégâts subis, +3 PM), ou une compétence (coût en mana, temps de recharge).
- **Effets de statut** : poison 🧪, étourdissement 💫, bouclier 🛡️, bénédiction 🙏, provocation 😤, régénération 💧.
- **Coups critiques** : 5 % de base + 1 % par point d'Agilité.
- **KO** : un héros à 0 PV est hors combat, mais se relève au campement. Défaite si tout le groupe tombe.
- **Progression** : chaque victoire rapporte de l'XP. Aux niveaux 2 à 5 : +2 points de caractéristiques ; aux niveaux 3 et 5 : une **nouvelle compétence** à apprendre.
- **Campement** : entre deux combats, le groupe récupère des PV et du mana et gère ses montées de niveau.

## 🗂️ Structure du projet

```
index.html      — les écrans du jeu (accueil, création, groupe, combat, camp, fin)
css/style.css   — thème sombre fantasy
js/data.js      — données : caractéristiques, 18 compétences, monstres, rencontres, progression
js/game.js      — état global, création de personnage, campement, montées de niveau
js/combat.js    — moteur de combat tour par tour (initiative, effets, IA des monstres)
```

Le code est en JavaScript pur, sans dépendance ni étape de build.

## 🔮 Pistes pour la suite

- **Jouer en ligne (chacun sur son appareil)** : ajouter un backend temps réel (par exemple Supabase Realtime ou un petit serveur Node + WebSocket) qui synchronise l'état du combat entre les navigateurs. La logique de `combat.js` est déjà séparée de l'affichage, ce qui facilitera cette évolution.
- Sauvegarde du groupe dans `localStorage` pour reprendre une partie.
- Plus de donjons, d'objets et d'équipement.
- Du PvP : deux équipes de joueurs l'une contre l'autre.
