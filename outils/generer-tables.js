'use strict';

// =====================================================================
// Régénère les tables figées dérivées du héros et de la courbe d'XP :
//   • PUISSANCE_ETALON (js/data/progression.js) — le maximum courant du
//     minimum par classe, mesuré par le banc d'équilibrage ;
//   • XP_CIBLE_MONSTRE (js/data/monstres.js) — l'XP d'un monstre de
//     niveau n, déduite du coût du niveau suivant et du rythme voulu.
//
// À relancer chaque fois que la courbe d'XP, la dotation en points, le
// catalogue d'objets ou les familiers changent. Le test « la table
// PUISSANCE_ETALON colle au héros réellement mesuré » veille au grain.
//
//   node outils/generer-tables.js          → affiche les tables
//   node outils/generer-tables.js --ecrire → les écrit dans les sources
// =====================================================================
const fs = require('fs');
const path = require('path');
const jeu = require('./charger-jeu')();
const e = jeu.evaluer;

const NIVEAU_MAX = e('NIVEAU_MAX');

// --- 1. PUISSANCE_ETALON --------------------------------------------
const etalon = [];
let record = 0;
for (let n = 1; n <= NIVEAU_MAX; n += 1) {
  record = Math.max(record, e(`puissancesEtalon(${n})`).min);
  etalon.push(record);
}

// --- 2. XP_CIBLE_MONSTRE --------------------------------------------
// Le rythme voulu, dans l'unité que mesurent les tests : combien de packs
// de trois monstres de son niveau (au facteur d'XP près, hors étirement)
// pour gagner un niveau. De 5 au niveau 1 à 27 au niveau 99, en
// progression géométrique — la même douceur que la courbe d'XP.
const RYTHME_DEBUT = 5;
const RYTHME_FIN = 27;
const facteurXp = e('FACTEUR_XP_HISTORIQUE * REDUCTION_XP_V20');
const rythme = (n) => RYTHME_DEBUT * Math.pow(RYTHME_FIN / RYTHME_DEBUT, (n - 1) / (NIVEAU_MAX - 2));
const xpCible = [];
for (let n = 1; n <= NIVEAU_MAX; n += 1) {
  const palier = e(`incrementXp(${Math.min(NIVEAU_MAX, n + 1)})`);
  xpCible.push(Math.max(1, Math.round(palier / (3 * facteurXp * rythme(Math.min(n, NIVEAU_MAX - 1))))));
}

// --- Mise en forme : dix valeurs par ligne, alignées ------------------
function formater(table, largeur) {
  const lignes = [];
  for (let i = 0; i < table.length; i += 10) {
    const tranche = table.slice(i, i + 10).map((v) => String(v).padStart(largeur)).join(', ');
    lignes.push(`  ${tranche},  // ${i + 1}–${i + 10}`);
  }
  return lignes.join('\n');
}

const blocEtalon = formater(etalon, 6);
const blocXp = formater(xpCible, 6);

if (process.argv.includes('--ecrire')) {
  const remplacerTable = (fichier, nomTable, bloc) => {
    const chemin = path.join(__dirname, '..', fichier);
    const source = fs.readFileSync(chemin, 'utf8');
    const motif = new RegExp(`(const ${nomTable} = \\[\\n)[\\s\\S]*?(\\n\\];)`);
    if (!motif.test(source)) throw new Error(`${nomTable} introuvable dans ${fichier}`);
    fs.writeFileSync(chemin, source.replace(motif, `$1${bloc}$2`));
    console.log(`✔ ${nomTable} réécrite dans ${fichier}`);
  };
  remplacerTable('js/data/progression.js', 'PUISSANCE_ETALON', blocEtalon);
  remplacerTable('js/data/monstres.js', 'XP_CIBLE_MONSTRE', blocXp);
} else {
  console.log(`const PUISSANCE_ETALON = [\n${blocEtalon}\n];\n`);
  console.log(`const XP_CIBLE_MONSTRE = [\n${blocXp}\n];`);
}
