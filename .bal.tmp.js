const fs = require('fs'), vm = require('vm');
const fichiers = [
  'js/data/base.js','js/data/competences.js','js/data/classes.js','js/data/sous-classes.js',
  'js/data/voies.js','js/data/eveils.js','js/data/tour-eveil.js','js/data/meta.js',
  'js/data/progression.js','js/data/equipement-types.js','js/data/objets-catalogue.js',
  'js/data/objets-craft.js','js/data/objets-generes.js','js/data/equilibrage.js',
  'js/data/monde-vivant.js','js/data/monstres.js','js/data/zones.js','js/data/zones-marches.js',
  'js/donjons/epopees.js','js/donjons/chroniques.js','js/donjons/chroniques-marches.js',
  'js/donjons/moteur.js','js/ui-listes.js','js/game.js','js/monde.js',
];
const faux = () => ({ classList:{add(){},remove(){},toggle(){},contains(){return false;}}, addEventListener(){},
  appendChild(){}, querySelector(){return null;}, querySelectorAll(){return [];}, style:{}, dataset:{},
  textContent:'', innerHTML:'', value:'', remove(){} });
const ctx = { console, Math, JSON, Object, Array, Number, String, Date, Set, Map, RegExp, Error,
  isNaN, parseInt, parseFloat, setTimeout, clearTimeout, setInterval, clearInterval,
  performance:{now:()=>0},
  document:{readyState:'complete',getElementById:()=>null,createElement:faux,querySelector:()=>null,
    querySelectorAll:()=>[],addEventListener(){},body:faux()},
  localStorage:{getItem:()=>null,setItem(){},removeItem(){}} };
ctx.window = ctx; ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of fichiers) {
  try { vm.runInContext(fs.readFileSync(f,'utf8'), ctx, { filename: f }); }
  catch (e) { console.error('[' + f + ']', e.message); }
}
module.exports = { ctx, executer: (c) => vm.runInContext(fs.readFileSync(c,'utf8'), ctx, { filename: c }) };
