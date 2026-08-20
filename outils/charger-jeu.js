'use strict';

// =====================================================================
// Harnais Node : charge les fichiers du jeu dans un contexte partagé,
// comme le ferait un navigateur, pour les outils de génération de tables
// (courbes d'XP des monstres, étalon de puissance, cibles du bestiaire).
//
//   const jeu = require('./charger-jeu')();
//   jeu.incrementXp(50); jeu.puissancesEtalon(80); …
//
// Aucune interface n'est démarrée : un document factice absorbe les
// écouteurs que game.js pose au chargement.
// =====================================================================
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RACINE = path.join(__dirname, '..');

// L'ordre de tests.html : les mêmes fichiers, dans le même ordre.
const FICHIERS = [
  'js/data/base.js',
  'js/data/competences.js',
  'js/data/classes.js',
  'js/data/sous-classes.js',
  'js/data/passifs.js',
  'js/data/voies.js',
  'js/data/voies-passifs.js',
  'js/data/eveils.js',
  'js/data/eveils-passifs.js',
  'js/data/tour-eveil.js',
  'js/data/meta.js',
  'js/data/progression.js',
  'js/data/equipement-types.js',
  'js/data/objets-catalogue.js',
  'js/data/objets-craft.js',
  'js/data/objets-generes.js',
  'js/data/equilibrage.js',
  'js/data/monde-vivant.js',
  'js/data/monstres.js',
  'js/data/zones.js',
  'js/data/zones-marches.js',
  'js/donjons/epopees.js',
  'js/donjons/chroniques.js',
  'js/donjons/chroniques-marches.js',
  'js/donjons/moteur.js',
  'js/ui-listes.js',
  'js/game.js',
  'js/monde.js',
  'js/ville.js',
  'js/combat.js',
  'js/groupe.js',
];

function elementFactice() {
  // `echapper` du jeu passe par textContent → innerHTML : l'élément
  // factice reproduit ce couple, sinon tout texte échappé devient vide.
  // Un innerHTML écrit directement se relit tel quel (cartes de combat).
  let texte = null;
  let html = '';
  return {
    get textContent() { return texte != null ? texte : html; },
    set textContent(v) { texte = String(v == null ? '' : v); },
    get innerHTML() {
      if (texte == null) return html;
      return texte.replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },
    set innerHTML(v) { html = String(v == null ? '' : v); texte = null; },
    value: '', className: '', style: {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    dataset: {},
    addEventListener() {}, removeEventListener() {},
    appendChild(e) { return e; }, insertAdjacentHTML() {}, querySelector() { return null; },
    querySelectorAll() { return []; }, setAttribute() {}, removeAttribute() {},
    focus() {}, remove() {}, scrollIntoView() {},
  };
}

module.exports = function chargerJeu() {
  const contexte = {
    console,
    setTimeout, clearTimeout, setInterval, clearInterval,
    Math, Date, JSON, Object, Array, Number, String, Boolean, RegExp, Promise, Map, Set,
    document: {
      readyState: 'loading',
      addEventListener() {},
      // Comme dans tests.html : les écrans du jeu n'existent pas, et le
      // démarrage de l'interface s'en aperçoit par ce null.
      getElementById() { return null; },
      createElement() { return elementFactice(); },
      querySelector() { return null; },
      querySelectorAll() { return []; },
      body: elementFactice(),
      documentElement: elementFactice(),
    },
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    navigator: { userAgent: 'node' },
    location: { href: 'file:///', hash: '', search: '' },
    fetch() { return Promise.reject(new Error('pas de réseau dans le harnais')); },
    alert() {}, confirm() { return false; },
    requestAnimationFrame(fn) { return setTimeout(fn, 0); },
  };
  contexte.window = contexte;
  contexte.globalThis = contexte;
  vm.createContext(contexte);

  FICHIERS.forEach((fichier) => {
    const code = fs.readFileSync(path.join(RACINE, fichier), 'utf8');
    vm.runInContext(code, contexte, { filename: fichier });
  });
  // Les const/let du jeu ne deviennent pas des propriétés du contexte :
  // `evaluer` donne accès à tout, par expression.
  contexte.evaluer = (code) => vm.runInContext(code, contexte);
  return contexte;
};
