'use strict';

// Lance la suite de tests du jeu (js/tests.js) sous Node, sans navigateur.
// C'est exactement ce que fait tests.html, avec un rapport console.
//
//   node outils/lancer-tests.js             → rapport complet
//   node outils/lancer-tests.js --echecs    → seulement les échecs
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const chargerJeu = require('./charger-jeu');

const jeu = chargerJeu();
jeu.performance = { now: () => Date.now() };
const codeTests = fs.readFileSync(path.join(__dirname, '..', 'js', 'tests.js'), 'utf8');
vm.runInContext(codeTests, jeu, { filename: 'js/tests.js' });

const seulementEchecs = process.argv.includes('--echecs');
const SUITES = jeu.evaluer('SUITES');
let reussis = 0;
let echoues = 0;
const debut = Date.now();
SUITES.forEach((s) => {
  const lignes = [];
  let echecsSuite = 0;
  s.cas.forEach((cas) => {
    try {
      cas.corps();
      reussis += 1;
      if (!seulementEchecs) lignes.push(`  ✓ ${cas.nom}`);
    } catch (erreur) {
      echoues += 1;
      echecsSuite += 1;
      lignes.push(`  ✕ ${cas.nom}\n      ${String(erreur.message).split('\n').join('\n      ')}`);
    }
  });
  if (!seulementEchecs || echecsSuite > 0) {
    console.log(`\n■ ${s.nom} — ${s.cas.length - echecsSuite}/${s.cas.length}`);
    lignes.forEach((l) => console.log(l));
  }
});
const duree = Date.now() - debut;
console.log(echoues
  ? `\n✕ ${echoues} test(s) en échec sur ${reussis + echoues} — ${duree} ms`
  : `\n✓ ${reussis} tests au vert — ${duree} ms`);
process.exit(echoues ? 1 : 0);
