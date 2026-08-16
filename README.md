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

**Six sous-caractéristiques** — 💥 Critique · 🎲 Coup direct · ⚖️ Détermination · 🛡️ Ténacité · 💨 Célérité · 💧 Piété — qui déterminent *comment*. Elles ne s'achètent pas avec des points : elles viennent de l'équipement, ce qui rend le choix d'un objet aussi structurant que celui d'une compétence. Chacune est **plafonnée** : empiler une seule sous-caractéristique cesse de payer.

Un coup peut être **critique** (×1,5) *ou* **direct** (×1,25), jamais les deux — la Détermination, elle, majore tout sans exception. La Ténacité retranche des dégâts à plat, la Célérité décide de l'ordre du tour, la Piété gonfle le mana.

### L'équipement a enfin une logique

Un mage ne porte pas d'armure de fer. Quatre **catégories d'armure** (tissu · cuir · maille · plaque) et six **familles d'arme** (lame · arc · bâton · calice · runique · pavois), chacune réservée aux classes qui en ont l'usage — et l'inventaire dit *pourquoi* un objet vous est refusé plutôt que de le griser en silence.

**18 298 objets** en 7 raretés (jusqu'au Divin ✨), dont **5 314 en boutique** et **386 recettes** d'artisanat. Chaque objet affiche, en face de ce que vous portez déjà, l'écart exact : `+3 💪 / −2 ❤️ ▲ mieux que l'équipé`.

### Un monde qui tourne sans vous

Le header affiche en permanence **l'heure du jour** (🌅 aube · ☀️ jour · 🌙 nuit) et la **météo** (claire · pluie · brume · tempête · canicule · blizzard), qui change toutes les trois heures pour **tous les joueurs en même temps** — même graine, même ciel. Et ça compte : la pluie dope l'eau et éteint le feu, le blizzard gèle, la nuit fait mal. Récolter sous la bonne météo rapporte davantage.

### Explorer, raconter, mourir

- **26 zones** (niveaux 1 à 90) en **quatre actes** qui se répondent, du champ de blé des Plaines de l'Aube jusqu'au Trône du Premier Roi. Combats, filons à ⛏️ miner, coins d'🌿 herboriste, histoires uniques par carte, mini-boss champions, marchand nomade — et la **menace du boss** qui tombe sans prévenir.
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
- **Un bac à sable admin** 🛠️ : taper `admin-valciel` dans « Reprendre un héros » ouvre une console rangée en 9 sections. Local par défaut.

## 🌍 Multijoueur : comment ça marche

Le jeu détecte tout seul s'il peut joindre le monde en ligne (un backend Supabase — PostgreSQL + API REST) :

- **En ligne** : héros synchronisés, taverne active, boss du monde commun, groupes multi-appareils, échanges entre joueurs. Toutes les écritures passent par des fonctions RPC vérifiant un token secret par personnage (avec plafonds anti-triche). Le token n'est jamais lisible publiquement.
- **Les expéditions de groupe** (jusqu'à 4 appareils) proposent six genres : explorer une zone, son boss, un étage de la **Tour Sans Fin**, la **Tour des Boss**, l'**assaut du boss final d'un donjon**, ou l'**Ascension éternelle d'une épopée**. C'est la **progression du chef** qui ouvre les expéditions — chacun combat à pleine puissance, et le record de chacun progresse. La défaite est mortelle, comme en solo.
- **Hors ligne** : tout le reste du jeu fonctionne normalement, sauvegardé sur l'appareil.

Aucun compte, aucun mot de passe : on crée un héros et on joue.

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

**204 tests** en 18 suites vérifient les invariants qui ne doivent jamais casser : la courbe d'XP est strictement croissante jusqu'au niveau 100, chaque spécialité reçoit la même dotation de statistiques, les cinq raretés d'Éveil tirables restent dans un écart de 10 %, aucune migration de sauvegarde ne retire quoi que ce soit à un héros existant, et aucun service de la Tour ne vide un grimoire.

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
js/data/progression.js           — courbe d'XP jusqu'au niveau 100, stats effectives
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
js/tests.js                      — les 168 tests
```
