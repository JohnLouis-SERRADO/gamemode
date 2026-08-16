console.log('TENSION FINALE — par zone (classe médiane) et bornes entre classes\n');
console.log('zone                          | niv | nettoyer | survie | médiane | min  | max');
const toutes = [];
ZONES.forEach((z) => {
  const t = tensionZone(z, 3);
  if (!t) return;
  toutes.push(t.pire.marge, t.meilleure.marge, t.reference.marge);
  console.log([z.nom.slice(0, 29).padEnd(29), String(t.niveau).padStart(3),
    t.reference.toursNettoyage.toFixed(1).padStart(8), t.reference.toursSurvie.toFixed(1).padStart(6),
    t.reference.marge.toFixed(2).padStart(7) + '×', t.pire.marge.toFixed(2).padStart(4) + '×',
    t.meilleure.marge.toFixed(2).padStart(5) + '×'].join(' |'));
});
console.log(`\nMARGE MAXIMALE toutes classes/zones : ${Math.max(...toutes).toFixed(2)}×  (exigé : entre 2 et 4)`);
console.log(`MARGE MINIMALE toutes classes/zones : ${Math.min(...toutes).toFixed(2)}×`);

console.log('\n--- Boss de zone (combat en solo) ---');
const margesBoss = [];
ZONES.forEach((z) => {
  const boss = MONSTRES[z.boss];
  if (!boss) return;
  const niveau = boss.niveau;
  classesEtalon().forEach((c) => {
    const t = tensionCombat([boss], personaEquipeNormalement(c, niveau), 1);
    margesBoss.push({ marge: t.marge, classe: c, zone: z.nom, coup: t.pireCoupPct });
  });
});
margesBoss.sort((a, b) => b.marge - a.marge);
console.log('  plus confortable :', margesBoss[0].marge.toFixed(2) + '×', margesBoss[0].classe, '/', margesBoss[0].zone);
console.log('  plus serré       :', margesBoss[margesBoss.length - 1].marge.toFixed(2) + '×',
  margesBoss[margesBoss.length - 1].classe, '/', margesBoss[margesBoss.length - 1].zone);
console.log('  pire coup d\'un boss :', (Math.max(...margesBoss.map((m) => m.coup)) * 100).toFixed(0) + '% des PV');
