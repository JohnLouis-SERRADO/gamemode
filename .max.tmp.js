let max = { marge: 0 }, min = { marge: 99 };
const parClasse = {};
ZONES.forEach((z) => {
  const monstres = (z.monstres || []).map((c) => MONSTRES[c]).filter(Boolean);
  if (!monstres.length) return;
  const niveau = niveauReelZone(z);
  classesEtalon().forEach((classe) => {
    const p = personaEquipeNormalement(classe, niveau);
    const t = tensionCombat(monstres, p, 3);
    (parClasse[classe] = parClasse[classe] || []).push(t.marge);
    if (t.marge > max.marge) max = { marge: t.marge, classe, zone: z.nom, niveau, t, p };
    if (t.marge < min.marge) min = { marge: t.marge, classe, zone: z.nom, niveau };
  });
});
console.log('Marge MAXIMALE :', max.marge.toFixed(2) + '×', '—', max.classe, '/', max.zone, `(niv ${max.niveau})`);
console.log('  nettoyer', max.t.toursNettoyage.toFixed(1), 'tours | survivre', max.t.toursSurvie.toFixed(1), 'tours');
console.log('  PV', max.p.maxHp, '| DPS', degatsParTourHeros(max.p).toFixed(0));
console.log('Marge MINIMALE :', min.marge.toFixed(2) + '×', '—', min.classe, '/', min.zone);
console.log('\nPar classe (min / médiane / max sur les 26 zones) :');
Object.entries(parClasse).forEach(([c, l]) => {
  const s = l.slice().sort((a, b) => a - b);
  console.log(`  ${c.padEnd(13)} ${s[0].toFixed(2)}× / ${s[Math.floor(s.length/2)].toFixed(2)}× / ${s[s.length-1].toFixed(2)}×`);
});
console.log('\nRépartition des points du persona (niveau 60) :');
classesEtalon().forEach((c) => {
  const p = personaReference(c, 60);
  console.log(`  ${c.padEnd(13)} stat de classe=${CLASSES_BASE[c].stat} → ` + JSON.stringify(p.stats));
});
