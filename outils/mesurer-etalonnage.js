'use strict';

// Mesure, sur les niveaux 1-50 (où le héros n'a pas changé), les rapports
// implicites entre les tables cibles actuelles du bestiaire et le héros de
// référence : hp/dph, bossHp/dph, et la marge médiane que les tables
// actuelles produisent. Ces constantes servent ensuite à régénérer les
// tables pour les niveaux 51-100, où la dotation en points a changé.
const jeu = require('./charger-jeu')();
const e = jeu.evaluer;

const classes = e('classesEtalon()');
const lignes = [];
for (let n = 1; n <= 100; n += 1) {
  const personas = classes.map((c) => e(`personaEquipeNormalement(${JSON.stringify(c)}, ${n})`));
  const dphs = personas.map((p) => e('degatsParTourHeros')(p)).sort((a, b) => a - b);
  const med = dphs[Math.floor(dphs.length / 2)];
  const pv = e(`cibleMonstre(PV_CIBLE_MONSTRE, ${n})`);
  const atk = e(`cibleMonstre(ATK_CIBLE_MONSTRE, ${n})`);
  const pvB = e(`cibleMonstre(PV_CIBLE_BOSS, ${n})`);
  const atkB = e(`cibleMonstre(ATK_CIBLE_BOSS, ${n})`);
  const monstre = { hp: pv, atk, attaques: [{ mult: 1, poids: 1 }] };
  const boss = { hp: pvB, atk: atkB, attaques: [{ mult: 1, poids: 1 }], boss: true };
  const marges = personas.map((p) => e('tensionCombat')([monstre], p, 3).marge).sort((a, b) => a - b);
  const margesB = personas.map((p) => e('tensionCombat')([boss], p, 1).marge).sort((a, b) => a - b);
  lignes.push({
    n,
    med: Math.round(med * 10) / 10,
    kPv: +(pv / med).toFixed(2),
    kPvB: +(pvB / med).toFixed(2),
    marge: +marges[Math.floor(marges.length / 2)].toFixed(2),
    margeB: +margesB[Math.floor(margesB.length / 2)].toFixed(2),
  });
}
lignes.filter((l) => [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 70, 80, 90, 100].includes(l.n))
  .forEach((l) => console.log(JSON.stringify(l)));
