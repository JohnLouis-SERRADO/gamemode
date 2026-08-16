function reference(n) {
  const tous = classesEtalon().map((c) => personaEquipeNormalement(c, n));
  const med = (t) => { const s = t.slice().sort((a, b) => a - b); return (s[2] + s[3]) / 2; };
  return {
    dps: med(tous.map(degatsParTourHeros)),
    pv: med(tous.map((p) => p.maxHp)),
    ten: med(tous.map((p) => sousCarac(statsEffectives(p), 'tenacite'))),
  };
}
const TOURS = 9, MARGE = 2.0, TAILLE = 3, MULT = 1.12;
const TOURS_BOSS = 16, MARGE_BOSS = 1.5;
const pv = [], atk = [], pvB = [], atkB = [];
for (let n = 1; n <= NIVEAU_MAX; n++) {
  const r = reference(n);
  pv.push((r.dps * TOURS) / TAILLE);
  atk.push(r.pv / (TOURS * MARGE * TAILLE * MULT * (1 - r.ten)));
  pvB.push(r.dps * TOURS_BOSS);
  atkB.push(r.pv / (TOURS_BOSS * MARGE_BOSS * MULT * (1 - r.ten)));
}
const monotone = (t) => { let r = 0; return t.map((v) => (r = Math.max(r, v))); };
const fmt = (t, dec) => {
  const l = [];
  for (let i = 0; i < t.length; i += 10) {
    l.push('  ' + t.slice(i, i + 10).map((v) => (dec ? v.toFixed(1) : String(Math.round(v))).padStart(6)).join(', ')
      + `,  // ${i + 1}–${Math.min(i + 10, NIVEAU_MAX)}`);
  }
  return l.join('\n');
};
console.log("// PV cible d'un monstre ordinaire");
console.log(fmt(monotone(pv)));
console.log("\n// ATK cible d'un monstre ordinaire");
console.log(fmt(monotone(atk), true));
console.log("\n// PV cible d'un boss");
console.log(fmt(monotone(pvB)));
console.log("\n// ATK cible d'un boss");
console.log(fmt(monotone(atkB), true));
