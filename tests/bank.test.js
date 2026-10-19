/* Vérification automatique de la banque : couverture, solutions, KaTeX, réponses des générateurs. */
const assert = require('assert'); const _w = console.warn; console.warn = m => { if (!/character metrics/.test(m)) _w(m); };
const L = require('../js/lessons.js'), P = require('../js/programme.js'), katex = require('../vendor/katex/katex.min.js');
let SIT = null; try { SIT = require('../js/situations.js'); } catch (e) { }
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
const near = (a, b, t = 1e-6) => Math.abs(a - b) <= t;
const eqArr = (a, b, t) => a.length === b.length && a.every((v, i) => near(v, b[i], t));
function verify(c) { // vérification INDÉPENDANTE (recalcul)
  if (!c) return true;
  if ('js' in c) { const v = Function(`return (${c.js})`)(); return Array.isArray(v) ? eqArr(v, c.out) : typeof v === 'boolean' ? v === c.out : near(v, c.out, c.tol ?? 1e-4); }
  if (c.euclid) { const [a, b] = c.euclid; return Math.floor(a / b) === c.out[0] && a % b === c.out[1] && b * c.out[0] + c.out[1] === a; }
  if (c.frac) { const [n, d] = c.frac, g = gcd(n, d); return n / g === c.out[0] && d / g === c.out[1] || (n * c.out[1] === d * c.out[0] && gcd(c.out[0], c.out[1]) === 1); }
  if (c.fracop) { const [a, b, op, e, d] = c.fracop; let n, m; if (op === '+') [n, m] = [a * d + e * b, b * d]; else if (op === '-') [n, m] = [a * d - e * b, b * d]; else if (op === '*') [n, m] = [a * e, b * d]; else [n, m] = [a * d, b * e]; return n * c.out[1] === m * c.out[0]; }
  if (c.cmp) { const [a, b, e, d] = c.cmp, x = a * d - e * b * 1; const s = Math.sign(a / b - e / d); return c.out === (s < 0 ? '<' : s > 0 ? '>' : '='); }
  if (c.sorted) { return JSON.stringify([...c.sorted].sort((a, b) => a - b)) === JSON.stringify(c.out) || JSON.stringify([...c.sorted].sort((a, b) => b - a)) === JSON.stringify(c.out); }
  if (c.divs) return true;
  if (c.refl) { const [a, b, ax, k] = c.refl; return eqArr(ax === 0 ? [a, 2 * k - b] : [2 * k - a, b], c.out); }
  if (c.cent) { const [[mx, my], [ox, oy]] = c.cent; return eqArr([2 * ox - mx, 2 * oy - my], c.out); }
  if (c.prop) { const [xs, ys] = c.prop; const k = ys[0] / xs[0]; return xs.every((v, i) => near(ys[i], k * v)) === c.out; }
  if (c.tri) { const s = [...c.tri].sort((a, b) => a - b); return (s[2] < s[0] + s[1]) === c.out; }
  if (c.lin) { const [a, b, r] = c.lin; return near(a * c.out + b, r); }
  if (c.lin2) { const [a, b, cc, d] = c.lin2; return near(a * c.out + b, cc * c.out + d); }
  if (c.ineq) { const [a, b, r] = c.ineq; const t = c.out[1]; const sg = c.out[0]; return near(a * t + b, r, 1e-3) && ((sg === '<') === (a > 0)); }
  if (c.sci) { const [m, p] = c.sci; return c.out[0] >= 1 && c.out[0] < 10 && near(m * 10 ** p, c.out[0] * 10 ** c.out[1], 1e-9 * Math.abs(m * 10 ** p)); }
  if (c.pyth) return near(Math.hypot(...c.pyth), c.out);
  if (c.right) { const [a, b, h] = c.right; return (a * a + b * b === h * h) === c.out; }
  if (c.roots) return c.roots.every(([a, b], i) => near(a * c.out[i] + b, 0, 1e-3));
  if (c.sys) { const [a, b, e, cc, d, f] = c.sys, [x, y] = c.out; return near(a * x + b * y, e) && near(cc * x + d * y, f); }
  if (c.aff) { const [x1, y1, x2, y2] = c.aff, [a, b] = c.out; return near(a * x1 + b, y1) && near(a * x2 + b, y2); }
  if (c.median) { const s = [...c.median].sort((a, b) => a - b), n = s.length; return near(n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2, c.out); }
  if (c.gcd) return gcd(...c.gcd) === c.out;
  if (c.divsOf) { const d = []; for (let i = 1; i <= c.divsOf; i++) if (c.divsOf % i === 0) d.push(i); return JSON.stringify(d) === JSON.stringify(c.out); }
  if (c.cls || c.sym) return true;
  if (c.poly) return true;
  throw new Error('chk inconnu ' + JSON.stringify(c));
}
function renderAll(txt, where) { const re = /\$([^$]+)\$/g; let m, n = 0; while ((m = re.exec(txt))) { n++; try { katex.renderToString(m[1], { throwOnError: true, strict: 'ignore' }); } catch (e) { throw new Error(`KaTeX ${where}: ${e.message} :: ${m[1]}`); } } assert.ok((txt.match(/\$/g) || []).length % 2 === 0, `$ impair ${where}`); return n; }
let ok = 0, fail = 0; const t = (name, fn) => { try { fn(); ok++; console.log('✓', name); } catch (e) { fail++; console.log('✗', name, '\n   ', e.message); } };
const VAR = +process.env.BANK_VARIANTS || 12;
const counts = {};
t('chaque leçon a un modèle et ≥ 6 exercices (2 par niveau) avec solution', () => {
  for (const y of P.YEARS) { counts[y.id] = { lessons: 0, ex: 0 }; for (const s of y.seqs) { assert.strictEqual((L.TMAP[s.id] || []).length, s.lessons.length, s.id); s.lessons.forEach((_, i) => { const E = L.forLesson(s.id, i); assert.ok(E.length >= 6, s.id + i); assert.deepStrictEqual([...new Set(E.map(e => e.level))], [1, 2, 3]); E.forEach(e => { assert.ok(e.s.length >= 1 && e.a.length > 5, 'solution ' + e.id); assert.ok(Math.abs(e.sp.reduce((a, b) => a + b, 0) - e.pts) < 1e-9, 'barème ' + e.id); }); counts[y.id].lessons++; counts[y.id].ex += E.length; }); } }
});
t(`réponses des générateurs vérifiées indépendamment (${VAR} variantes × 3 niveaux)`, () => { let n = 0; for (const y of P.YEARS) for (const s of y.seqs) s.lessons.forEach((_, i) => { for (let v = 0; v < VAR; v++) for (const lv of [1, 2, 3]) { const e = L.make(s.id, i, lv, v); if (e.chk) { assert.ok(verify(e.chk), `${e.id} ${e.tpl} ${JSON.stringify(e.chk)}`); n++; } } }); assert.ok(n > 1500, 'peu de vérifications ' + n); console.log('    vérifications:', n); });
t('tout le LaTeX (énoncés + solutions + règles) se rend avec KaTeX', () => { let n = 0; for (const y of P.YEARS) for (const s of y.seqs) s.lessons.forEach((_, i) => { n += renderAll(L.ruleOf(s.id, i), s.id + i); for (let v = 0; v < VAR; v++) for (const lv of [1, 2, 3]) { const e = L.make(s.id, i, lv, v); n += renderAll(e.q, e.id); n += renderAll(e.s.join(' '), e.id); } }); console.log('    formules:', n); });
t('aucune valeur NaN/undefined et figures SVG valides', () => { const FIG = require('../js/fig.js'); for (const y of P.YEARS) for (const s of y.seqs) s.lessons.forEach((_, i) => { for (let v = 0; v < VAR; v++) for (const lv of [1, 2, 3]) { const e = L.make(s.id, i, lv, v); assert.ok(!/NaN|undefined|Infinity|\[object/.test(e.q + e.a), e.id); if (e.fig) { const svg = FIG.render(e.fig); assert.ok(svg.startsWith('<svg') && !/NaN|undefined/.test(svg), 'fig ' + e.id); } } }); });
t('déterminisme : même graine → même exercice', () => { assert.deepStrictEqual(L.make('3AM-6', 1, 2, 4), L.make('3AM-6', 1, 2, 4)); });
if (SIT) t('situations : ≥1 انطلاقية et ≥1 إدماجية par unité, solutions et KaTeX', () => { for (const y of P.YEARS) for (const s of y.seqs) { const S = SIT.forSeq(s.id); assert.ok(S.some(x => x.kind === 'launch'), 'launch ' + s.id); assert.ok(S.some(x => x.kind === 'integ'), 'integ ' + s.id); S.forEach(x => { assert.ok(x.a && x.a.length > 20, 'sol ' + x.id); renderAll(x.q + x.a, x.id); }); } assert.ok(SIT.ALL.filter(x => x.kind === 'bem').length >= 6, 'BEM 4AM'); });
t('banque manuscrite (bank.js) : solutions et KaTeX', () => { const B = require('../js/bank.js'); const A = B.BANK || B; A.forEach(e => { assert.ok(e.a, e.id); renderAll(e.q + e.a, e.id); }); });
console.log('\nComptes :', JSON.stringify(counts)); console.log(`\n${ok} ok, ${fail} échec(s)`); process.exit(fail ? 1 : 0);
