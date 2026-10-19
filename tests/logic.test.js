// Tests de logique : node tests/logic.test.js
const assert = require('assert');
const C = require('../js/core.js'), P = require('../js/programme.js'), B = require('../js/bank.js');
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('✓', name); };
const sum = a => C.round(a.reduce((x, y) => x + y, 0), 4);

ok('barème : somme exacte = 20 pour des poids quelconques', () => {
  const r = C.rng(42);
  for (let i = 0; i < 2000; i++) { const w = Array.from({ length: 1 + Math.floor(r() * 7) }, () => 1 + Math.floor(r() * 8)); for (const step of [0.25, 0.5, 1]) { const b = C.bareme(w, 20, step); assert.strictEqual(sum(b), 20); b.forEach(x => assert.strictEqual(C.round(x / step, 6) % 1, 0)); } }
});
ok('barème : proportionnel et cas limites', () => { assert.deepStrictEqual(C.bareme([1, 1, 1, 1], 20), [5, 5, 5, 5]); assert.deepStrictEqual(C.bareme([3, 3, 3, 3, 8], 20), [3, 3, 3, 3, 8]); assert.deepStrictEqual(C.bareme([], 20), []); assert.deepStrictEqual(C.bareme([1, 1, 1], 20, 0.5), [7, 6.5, 6.5]); });
ok('BEM : 4×3 + 8 = 20', () => assert.strictEqual(sum(C.BEM_POINTS), 20));
ok('moyenne CC = (évaluation + devoir)/2', () => { assert.strictEqual(C.ccAverage(14, 10), 12); assert.strictEqual(C.ccAverage('', 10), 10); assert.strictEqual(C.ccAverage('', ''), null); });
ok('moyenne trimestrielle, formule (2CC+3E)/5', () => { assert.strictEqual(C.termAverage({ eval: 14, devoir: 10, exam: 8 }, '2-3'), C.round((2 * 12 + 3 * 8) / 5, 2)); assert.strictEqual(C.termAverage({ eval: 14, devoir: 10, exam: 8 }, '2-3'), 9.6); });
ok('moyenne trimestrielle, formule (CC+2E)/3', () => assert.strictEqual(C.termAverage({ eval: 15, devoir: 12, exam: 9 }, '1-2'), C.round((13.5 + 18) / 3, 2)));
ok('moyenne : notes manquantes', () => { assert.strictEqual(C.termAverage({ eval: '', devoir: '', exam: 11 }), 11); assert.strictEqual(C.termAverage({ eval: 12, devoir: '', exam: '' }), 12); assert.strictEqual(C.termAverage({}), null); });
ok('moyenne annuelle avec coefficients', () => { assert.strictEqual(C.annualAverage([10, 12, 14]), 12); assert.strictEqual(C.annualAverage([10, 12, 14], [1, 2, 3]), C.round((10 + 24 + 42) / 6, 2)); assert.strictEqual(C.annualAverage([10, null, 14]), 12); });
ok('moyenne pondérée (coefficients de matières)', () => assert.strictEqual(C.weightedAverage([{ value: 12, coef: 4 }, { value: 8, coef: 5 }, { value: 'x', coef: 2 }]), C.round((48 + 40) / 9, 2)));
ok('rangs ex-aequo', () => assert.deepStrictEqual(C.ranks([12, 15, 12, null, 9]), [2, 1, 2, null, 4]));
ok('appréciations', () => { assert.strictEqual(C.appreciation(18.5), 'ممتاز'); assert.strictEqual(C.appreciation(10), 'مقبول'); assert.strictEqual(C.appreciation(3, undefined, 'fr'), 'Faible'); assert.strictEqual(C.appreciation(''), ''); });
ok('statistiques de classe (conseil)', () => { const st = C.stats([8, 12, 14, '', 6]); assert.deepStrictEqual([st.n, st.mean, st.min, st.max, st.pass, st.median, st.sd], [4, 10, 6, 14, 50, 10, 3.16]); assert.strictEqual(st.bands.reduce((a, b) => a + b.n, 0), 4); });
ok('formule par défaut = ((فرض+تقويم)/2 + 2×اختبار)/3', () => assert.strictEqual(C.termAverage({ eval: 15, devoir: 12, exam: 9 }), 10.5));
ok('jours fériés et examens déduits du planning', () => { const c = C.defaultCalendar(2026); const w = C.schoolWeeks(c); const wk = d => w.find(x => x.start <= d && d < C.iso(new Date(new Date(x.start).getTime() + 7 * 864e5))); assert.ok(wk('2027-01-12').open <= 4, 'Yennayer'); const e = wk('2027-05-16'); assert.ok(!e || e.open <= 2, 'Aïd el-Adha'); c.exams = [{ ar: 'x', from: '2027-02-07', to: '2027-02-11' }]; assert.ok(!C.schoolWeeks(c).some(x => x.start === '2027-02-07'), 'semaine examen'); });
ok('générateurs : déterministes et corrects (500 tirages chacun)', () => {
  for (const [k, g] of Object.entries(C.GEN)) {
    assert.deepStrictEqual(C.generate(k, 9, 3), C.generate(k, 9, 3));
    for (const it of C.generate(k, 123, 500)) { assert.ok(it.q && it.a, k); assert.ok((it.q.match(/\$/g) || []).length % 2 === 0, k + ' $ impairs');
      const nums = it.q.match(/-?\d+/g)?.map(Number);
      if (k === 'equation') { const [a, b, c] = it.q.match(/\$(-?\d+)x ([+-]) (\d+) = (-?\d+)\$/).slice(1).map((v, i) => i === 1 ? v : +v); const bb = b === '-' ? -c : c; assert.strictEqual(a * it.value + bb, +it.q.match(/= (-?\d+)\$/)[1]); }
      if (k === 'pgcd') { const [a, b] = it.q.match(/PGCD\((\d+); (\d+)\)/).slice(1).map(Number); assert.strictEqual(a % it.value, 0); assert.strictEqual(b % it.value, 0); assert.strictEqual(C.gcd(a / it.value, b / it.value), 1); }
      if (k === 'pythagore') { const [a, b] = it.q.match(/= (\d+)\\,cm/g).map(s => +s.match(/\d+/)[0]); assert.strictEqual(a * a + b * b, it.value * it.value); }
      if (k === 'sqrt') { const n0 = +it.q.match(/\\sqrt\{(\d+)\}/)[1]; assert.ok(Math.abs(it.value * it.value - n0) < 1e-9); }
      if (k === 'fractions') { const [a, b, c, d] = it.q.match(/\d+/g).map(Number); assert.ok(Math.abs(it.value - (a / b + c / d)) < 1e-12); }
      if (k === 'system') { const m = it.q.replace(/\\\\/g, '|').match(/(-?\d*)x ([+-]\d*)y = (-?\d+) \| (-?\d*)x ([+-]\d*)y = (-?\d+)/); const co = s => s === '' ? 1 : s === '-' ? -1 : s === '+' ? 1 : +s; const [x, y] = it.value; assert.strictEqual(co(m[1]) * x + co(m[2]) * y, +m[3]); assert.strictEqual(co(m[4]) * x + co(m[5]) * y, +m[6]); }
      if (k === 'stats') { assert.ok(it.value.median >= 4 && it.value.median <= 19); }
      void nums; }
  }
});
ok('calendrier 2026-2027 : semaines et trimestres', () => { const w = C.schoolWeeks(C.defaultCalendar(2026)); assert.ok(w.length >= 30 && w.length <= 36, w.length); assert.ok(w.every(x => x.open >= 1 && x.open <= 5)); assert.ok(!w.some(x => x.start === '2026-12-20' || x.start === '2026-12-27'), 'vacances d’hiver exclues'); assert.deepStrictEqual([...new Set(w.map(x => x.term))], [1, 2, 3]); });
ok('progression : chaque séquence placée, heures conservées', () => { for (const y of P.YEARS) { const pl = C.planYear(y.seqs, C.defaultCalendar(2026), y.weekly); const placed = {}; pl.forEach(r => r.items.filter(i => i.kind === 'seq').forEach(i => placed[i.id] = (placed[i.id] || 0) + i.h)); const over = pl.overflow || 0; assert.strictEqual(Object.values(placed).reduce((a, b) => a + b, 0) + over, y.seqs.reduce((a, s) => a + s.hours, 0)); assert.strictEqual(pl.filter(r => r.items.some(i => i.kind === 'exam')).length, 3); pl.forEach(r => assert.ok(r.items.filter(i => i.kind === 'seq').reduce((a, i) => a + i.h, 0) <= r.hours)); } });
ok('CSV : import élèves (; , guillemets, BOM, en-tête)', () => { const s = C.studentsFromCSV('\uFEFFاللقب;الاسم\nبن علي;محمد\n"Saïdi; A";Amina\n\n'); assert.deepStrictEqual(s.map(x => x.last), ['بن علي', 'Saïdi; A']); assert.strictEqual(C.studentsFromCSV('a,b\nc,d').length, 2); const out = C.toCSV([['x;y', 'q"']]); assert.ok(out.includes('"x;y"') && out.includes('"q"""')); });
ok('programme : 4 niveaux, 3 domaines, séquences et ressources', () => { assert.deepStrictEqual(P.YEARS.map(y => y.id), ['1AM', '2AM', '3AM', '4AM']); for (const y of P.YEARS) { assert.ok(y.seqs.length >= 7); assert.deepStrictEqual(new Set(y.seqs.map(s => s.domain)), new Set(['num', 'geo', 'fn'])); y.seqs.forEach(s => assert.ok(s.lessons.length >= 3 && s.hours > 0 && s.competence)); } });
ok('banque : chaque séquence a des exercices, solutions présentes, $ équilibrés', () => { for (const y of P.YEARS) for (const s of y.seqs) assert.ok(B.some(e => e.seq === s.id), s.id); B.forEach(e => { assert.ok(e.q && e.a && [1, 2, 3].includes(e.level)); assert.strictEqual((e.q.match(/\$/g) || []).length % 2, 0, e.id); assert.strictEqual((e.a.match(/\$/g) || []).length % 2, 0, e.id); }); assert.strictEqual(new Set(B.map(e => e.id)).size, B.length); });
console.log(`\n${n} tests OK`);
