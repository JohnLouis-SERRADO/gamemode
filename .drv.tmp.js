console.log('Composantes de la survie au niveau 63 (zone La Mer de Verre) :\n');
console.log('classe        |   PV | ténacité | dégâts subis/tour | survie | DPS  | nettoyer | marge');
const z = ZONES.filter((x) => niveauReelZone(x) === 63)[0];
const mobs = z.monstres.map((c) => MONSTRES[c]).filter(Boolean);
classesEtalon().forEach((c) => {
  const p = personaEquipeNormalement(c, 63);
  const s = statsEffectives(p);
  const t = tensionCombat(mobs, p, 3);
  const recu = p.maxHp / t.toursSurvie;
  console.log([c.padEnd(13), String(p.maxHp).padStart(5),
    (sousCarac(s, 'tenacite') * 100).toFixed(0).padStart(7) + '%',
    recu.toFixed(1).padStart(17), t.toursSurvie.toFixed(1).padStart(6),
    degatsParTourHeros(p).toFixed(0).padStart(5),
    t.toursNettoyage.toFixed(1).padStart(8), t.marge.toFixed(2).padStart(6) + '×'].join(' |'));
});
console.log('\nPoints de vie : 25 + vit×7 + (niv−1)×6 + pvMax de l\'équipement');
classesEtalon().forEach((c) => {
  const p = personaEquipeNormalement(c, 63);
  const s = statsEffectives(p);
  console.log(`  ${c.padEnd(13)} vit=${String(s.vit).padStart(3)} → ${s.vit * 7} PV de vitalité, ${s.pvMax} PV d'équipement`);
});
