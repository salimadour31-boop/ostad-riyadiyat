/* Logique pure (testée sous Node) : barème, moyennes, générateurs, calendrier, CSV. MIT. */
(function (root) {
  // ---------- aléatoire reproductible ----------
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  const nz = (r, a, b) => { let v; do { v = ri(r, a, b); } while (v === 0); return v; };
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const round = (x, d = 2) => Math.round((x + Number.EPSILON) * 10 ** d) / 10 ** d;
  const fmt = x => String(round(x, 4)).replace('.', ',');
  const frac = (n, d) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d) || 1; n /= g; d /= g; return d === 1 ? String(n) : (n < 0 ? '-' : '') + `\\dfrac{${Math.abs(n)}}{${d}}`; };
  const sg = v => v < 0 ? `(${v})` : `${v}`;
  const signed = v => v < 0 ? `- ${-v}` : `+ ${v}`;

  // ---------- générateurs (énoncé et solution en LaTeX dans $...$) ----------
  const GEN = {
    decimal: { ar: 'عمليات على الأعداد العشرية', years: ['1AM', '2AM'], make(r) {
      const a = ri(r, 11, 999) / 10, b = ri(r, 11, 99) / 10, op = ri(r, 0, 2);
      const sym = ['+', '-', '\\times'][op], v = [a + b, a - b, a * b][op];
      return { q: `احسب: $${fmt(a)} ${sym} ${fmt(b)}$`, a: `$${fmt(a)} ${sym} ${fmt(b)} = ${fmt(round(v, 4))}$`, value: round(v, 4) }; } },
    priority: { ar: 'أولوية العمليات', years: ['1AM', '2AM'], make(r) {
      const a = ri(r, 2, 20), b = ri(r, 2, 9), c = ri(r, 2, 9), d = ri(r, 1, 9);
      const v = a + b * c - d;
      return { q: `احسب: $${a} + ${b} \\times ${c} - ${d}$`, a: `$${a} + ${b * c} - ${d} = ${v}$`, value: v }; } },
    fractions: { ar: 'جمع كسرين', years: ['2AM', '3AM'], make(r) {
      const b = ri(r, 2, 9), d = ri(r, 2, 9), a = ri(r, 1, 9), c = ri(r, 1, 9);
      const n = a * d + c * b, den = b * d;
      return { q: `احسب ثم اختزل: $\\dfrac{${a}}{${b}} + \\dfrac{${c}}{${d}}$`, a: `$\\dfrac{${a * d}}{${den}} + \\dfrac{${c * b}}{${den}} = \\dfrac{${n}}{${den}} = ${frac(n, den)}$`, value: n / den }; } },
    relatives: { ar: 'الأعداد النسبية', years: ['2AM', '3AM'], make(r) {
      const a = nz(r, -15, 15), b = nz(r, -15, 15), c = nz(r, -9, 9), v = a - b + c;
      return { q: `احسب: $${sg(a)} - ${sg(b)} + ${sg(c)}$`, a: `$${sg(a)} + ${sg(-b)} + ${sg(c)} = ${v}$`, value: v }; } },
    powers: { ar: 'الكتابة العلمية', years: ['3AM'], make(r) {
      const m = ri(r, 11, 99) / 10, e = nz(r, -4, 6), val = m * 10 ** e;
      const shown = e >= 0 ? String(round(val, 6)) : val.toFixed(-e + 1);
      return { q: `اكتب الكتابة العلمية للعدد $${shown.replace('.', ',')}$`, a: `$${shown.replace('.', ',')} = ${fmt(m)} \\times 10^{${e}}$`, value: val }; } },
    equation: { ar: 'معادلة من الدرجة الأولى', years: ['2AM', '3AM', '4AM'], make(r) {
      const x = nz(r, -9, 9), a = nz(r, 2, 9), b = nz(r, -12, 12), c = a * x + b;
      return { q: `حل المعادلة: $${a}x ${signed(b)} = ${c}$`, a: `$${a}x = ${c} ${signed(-b)} = ${c - b}$ ومنه $x = ${x}$`, value: x }; } },
    inequation: { ar: 'متراجحة من الدرجة الأولى', years: ['3AM', '4AM'], make(r) {
      const a = nz(r, 2, 6) * (r() < 0.3 ? -1 : 1), b = ri(r, -10, 10), x0 = ri(r, -6, 6), c = a * x0 + b;
      const s = a > 0 ? '<' : '>';
      return { q: `حل المتراجحة: $${a}x ${signed(b)} < ${c}$`, a: `$${a}x < ${c - b}$${a < 0 ? ' (نقسم على عدد سالب فيتغير الاتجاه)' : ''} ومنه $x ${s} ${x0}$`, value: x0, sense: s }; } },
    pgcd: { ar: 'القاسم المشترك الأكبر', years: ['4AM'], make(r) {
      const g = ri(r, 2, 15), a = g * ri(r, 2, 20), b = g * ri(r, 2, 20); const G = gcd(a, b);
      const steps = []; let x = Math.max(a, b), y = Math.min(a, b);
      while (y) { steps.push(`${x} = ${y} \\times ${Math.floor(x / y)} + ${x % y}`); [x, y] = [y, x % y]; }
      return { q: `عيّن $PGCD(${a}; ${b})$ بخوارزمية إقليدس ثم اختزل $\\dfrac{${Math.min(a, b)}}{${Math.max(a, b)}}$`, a: steps.map(s => `$${s}$`).join('<br>') + `<br>$PGCD = ${G}$ و $\\dfrac{${Math.min(a, b)}}{${Math.max(a, b)}} = ${frac(Math.min(a, b), Math.max(a, b))}$`, value: G }; } },
    sqrt: { ar: 'تبسيط جذر تربيعي', years: ['4AM'], make(r) {
      const k = ri(r, 2, 9), m = [2, 3, 5, 6, 7][ri(r, 0, 4)], n = k * k * m;
      return { q: `اكتب على الشكل $a\\sqrt{b}$ حيث $b$ أصغر ما يمكن: $\\sqrt{${n}}$`, a: `$\\sqrt{${n}} = \\sqrt{${k * k} \\times ${m}} = ${k}\\sqrt{${m}}$`, value: k * Math.sqrt(m) }; } },
    identity: { ar: 'المتطابقات الشهيرة', years: ['4AM'], make(r) {
      const a = ri(r, 1, 9), t = ri(r, 0, 2);
      const q = [`(x+${a})^2`, `(x-${a})^2`, `(x+${a})(x-${a})`][t];
      const ans = [`x^2 + ${2 * a}x + ${a * a}`, `x^2 - ${2 * a}x + ${a * a}`, `x^2 - ${a * a}`][t];
      return { q: `انشر وبسّط: $${q}$`, a: `$${q} = ${ans}$`, value: ans }; } },
    system: { ar: 'جملة معادلتين', years: ['4AM'], make(r) {
      const x = ri(r, -5, 8), y = ri(r, -5, 8), a = nz(r, 1, 4), b = nz(r, 1, 4), c = nz(r, 1, 4), d = -nz(r, 1, 4);
      const e = a * x + b * y, f = c * x + d * y;
      const term = (k, v, first) => (k < 0 ? '-' : first ? '' : '+') + (Math.abs(k) === 1 ? '' : Math.abs(k)) + v;
      return { q: `حل الجملة: $\\begin{cases} ${term(a, 'x', 1)} ${term(b, 'y')} = ${e} \\\\ ${term(c, 'x', 1)} ${term(d, 'y')} = ${f} \\end{cases}$`, a: `الثنائية $(${x}; ${y})$ (تحقّق بالتعويض)`, value: [x, y] }; } },
    proportion: { ar: 'الرابع المتناسب', years: ['1AM', '2AM', '3AM'], make(r) {
      const k = ri(r, 2, 9), a = ri(r, 2, 12), b = ri(r, 2, 12), unit = ri(r, 0, 1);
      const ctx = unit ? ['كغ من البرتقال', 'دج'] : ['لترات من الوقود', 'دج'];
      const pa = a * k * 10;
      return { q: `ثمن ${a} ${ctx[0]} هو ${pa} ${ctx[1]}. ما ثمن ${b} ${ctx[0]}؟`, a: `$\\dfrac{${pa} \\times ${b}}{${a}} = ${pa * b / a}$ ${ctx[1]}`, value: pa * b / a }; } },
    percent: { ar: 'النسبة المئوية', years: ['1AM', '2AM', '3AM', '4AM'], make(r) {
      const p = [5, 10, 15, 20, 25, 30, 40][ri(r, 0, 6)], v = ri(r, 4, 60) * 100, inc = r() < 0.5;
      const res = inc ? v * (1 + p / 100) : v * (1 - p / 100);
      return { q: `سعر سلعة ${v} دج. ${inc ? 'ارتفع' : 'انخفض'} سعرها بنسبة $${p}\\%$. ما سعرها الجديد؟`, a: `$${v} \\times ${fmt(inc ? 1 + p / 100 : 1 - p / 100)} = ${fmt(res)}$ دج`, value: res }; } },
    pythagore: { ar: 'خاصية فيثاغورس', years: ['3AM', '4AM'], make(r) {
      const tr = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15], [7, 24, 25]][ri(r, 0, 5)], k = ri(r, 1, 3);
      const [a, b, c] = tr.map(v => v * k);
      return { q: `$ABC$ مثلث قائم في $A$ حيث $AB = ${a}\\,cm$ و $AC = ${b}\\,cm$. احسب $BC$.`, a: `$BC^2 = ${a}^2 + ${b}^2 = ${a * a + b * b}$ ومنه $BC = ${c}\\,cm$`, value: c }; } },
    linear: { ar: 'الدالة الخطية والتآلفية', years: ['4AM'], make(r) {
      const a = nz(r, -5, 5), b = ri(r, -9, 9), x = nz(r, -6, 6);
      return { q: `$f$ دالة تآلفية حيث $f(x) = ${a}x ${signed(b)}$. احسب $f(${x})$ ثم عيّن العدد الذي صورته $${b}$.`, a: `$f(${x}) = ${a} \\times ${sg(x)} ${signed(b)} = ${a * x + b}$ ؛ و $f(x) = ${b}$ تعني $x = 0$`, value: a * x + b }; } },
    stats: { ar: 'المتوسط والوسيط', years: ['3AM', '4AM'], make(r) {
      const n = ri(r, 5, 9), arr = Array.from({ length: n }, () => ri(r, 4, 19));
      const s = [...arr].sort((x, y) => x - y), m = arr.reduce((a, b) => a + b, 0) / n;
      const med = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
      return { q: `علامات تلاميذ: ${arr.join('، ')}. احسب المتوسط والوسيط والمدى.`, a: `الترتيب: ${s.join('، ')}<br>المتوسط $\\approx ${fmt(round(m, 2))}$، الوسيط $= ${fmt(med)}$، المدى $= ${s[n - 1] - s[0]}$`, value: { mean: round(m, 2), median: med, range: s[n - 1] - s[0] } }; } }
  };
  function generate(type, seed, count = 1) { const r = rng(seed); return Array.from({ length: count }, () => GEN[type].make(r)); }

  // ---------- barème ----------
  // Répartit `total` entre des éléments selon leurs poids, par pas `step`, somme exacte.
  function bareme(weights, total = 20, step = 0.25) {
    const W = weights.reduce((a, b) => a + b, 0); if (!weights.length || W <= 0) return [];
    const units = Math.round(total / step);
    const raw = weights.map(w => w / W * units), base = raw.map(Math.floor);
    let rest = units - base.reduce((a, b) => a + b, 0);
    raw.map((v, i) => [v - base[i], i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]).forEach(([, i]) => { if (rest > 0) { base[i]++; rest--; } });
    return base.map(u => round(u * step, 4));
  }
  const BEM_POINTS = [3, 3, 3, 3, 8];

  // ---------- moyennes ----------
  const FORMULAS = {
    // Défaut (sources 2024-2026) : ((فرض + تقويم مستمر)/2 + 2×اختبار)/3. L'ancienne (2×CC + 3×E)/5 reste disponible.
    '1-2': { ar: '((الفرض + التقويم المستمر) ÷ 2 + 2 × الاختبار) ÷ 3', fr: '((Devoir + Éval. continue)/2 + 2×Examen)/3', cc: 1, ex: 2 },
    '2-3': { ar: '(2 × معدل المراقبة المستمرة + 3 × الاختبار) ÷ 5 (صيغة قديمة)', fr: '(2×CC + 3×Examen)/5 (ancienne)', cc: 2, ex: 3 }
  };
  const isNum = v => v !== '' && v !== null && v !== undefined && !isNaN(v);
  function ccAverage(evals, devoirs) { // évaluation continue + فرض(s)
    const parts = [evals, ...[].concat(devoirs)].filter(isNum).map(Number);
    return parts.length ? round(parts.reduce((a, b) => a + b, 0) / parts.length, 2) : null;
  }
  function termAverage(g, formula = '1-2') {
    const f = FORMULAS[formula] || FORMULAS['1-2'];
    const cc = ccAverage(g.eval, g.devoir);
    const ex = isNum(g.exam) ? Number(g.exam) : null;
    if (cc === null && ex === null) return null;
    if (cc === null) return round(ex, 2); if (ex === null) return cc;
    return round((f.cc * cc + f.ex * ex) / (f.cc + f.ex), 2);
  }
  function weightedAverage(pairs) { // [{value, coef}]
    const p = pairs.filter(x => isNum(x.value) && x.coef > 0); const c = p.reduce((a, x) => a + x.coef, 0);
    return c ? round(p.reduce((a, x) => a + x.value * x.coef, 0) / c, 2) : null;
  }
  function annualAverage(terms, coefs = [1, 1, 1]) { return weightedAverage(terms.map((v, i) => ({ value: v, coef: coefs[i] ?? 1 }))); }
  const APPRECIATIONS = [[18, 'ممتاز', 'Excellent'], [16, 'جيد جدا', 'Très bien'], [14, 'جيد', 'Bien'], [12, 'قريب من الجيد', 'Assez bien'], [10, 'مقبول', 'Passable'], [8, 'متوسط، عليه بذل المزيد', 'Insuffisant'], [0, 'ضعيف، يحتاج إلى معالجة', 'Faible']];
  function appreciation(avg, table = APPRECIATIONS, lang = 'ar') { if (!isNum(avg)) return ''; const row = table.find(t => avg >= t[0]) || table[table.length - 1]; return lang === 'fr' ? row[2] : row[1]; }
  function ranks(values) { const s = values.map((v, i) => [v, i]).filter(x => isNum(x[0])).sort((a, b) => b[0] - a[0]); const out = values.map(() => null); s.forEach(([v, i], k) => { out[i] = k > 0 && s[k - 1][0] === v ? out[s[k - 1][1]] : k + 1; }); return out; }
  function stats(values) { const v = values.filter(isNum).map(Number); if (!v.length) return null; const m = v.reduce((a, b) => a + b, 0) / v.length; const sd = Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length); const s = [...v].sort((a, b) => a - b), n = s.length; const med = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
    const bands = [[0, 8], [8, 10], [10, 12], [12, 14], [14, 16], [16, 20.01]].map(([a, b]) => ({ from: a, to: Math.min(b, 20), n: v.filter(x => x >= a && x < b).length }));
    return { n, mean: round(m, 2), sd: round(sd, 2), median: round(med, 2), min: Math.min(...v), max: Math.max(...v), pass: round(100 * v.filter(x => x >= 10).length / n, 1), bands }; }

  // ---------- calendrier ----------
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  function defaultCalendar(startYear = 2026) {
    // Valeurs par défaut 2026-2027 (بلاغ وزارة التربية الوطنية) ; modifiables.
    const y = startYear;
    return { start: `${y}-09-21`, end: `${y + 1}-06-04`,
      holidays: [
        { ar: 'عطلة الخريف', from: `${y}-10-28`, to: `${y}-11-01` },
        { ar: 'عطلة الشتاء', from: `${y}-12-18`, to: `${y + 1}-01-02` },
        { ar: 'عطلة الربيع', from: `${y + 1}-03-19`, to: `${y + 1}-04-03` }
      ],
      // Jours fériés (journée à journée, déduits du planning). Dates religieuses = estimations (calendrier lunaire), à corriger selon l'annonce officielle.
      dayOff: [
        { ar: 'عيد الثورة', fr: 'Fête de la Révolution', date: `${y}-11-01` },
        { ar: 'رأس السنة الأمازيغية (يناير)', fr: 'Yennayer', date: `${y + 1}-01-12` },
        { ar: 'عيد الفطر (تقديري)', fr: 'Aïd el-Fitr (estimé)', date: `${y + 1}-03-09`, to: `${y + 1}-03-11`, religious: true },
        { ar: 'عيد العمال', fr: 'Fête du Travail', date: `${y + 1}-05-01` },
        { ar: 'عيد الأضحى (تقديري)', fr: 'Aïd el-Adha (estimé)', date: `${y + 1}-05-16`, to: `${y + 1}-05-18`, religious: true }
      ],
      // Semaines d'examens (déduites du temps d'enseignement). Vides par défaut : le planificateur réserve automatiquement la dernière semaine de chaque trimestre.
      exams: [],
      terms: [`${y}-12-17`, `${y + 1}-03-18`] };
  }
  // Semaines scolaires (début = dimanche). Une semaine entièrement en vacances est sautée.
  function schoolWeeks(cal) {
    const inR = (d, a, b) => iso(d) >= a && iso(d) <= (b || a);
    const inHol = d => cal.holidays.some(h => inR(d, h.from, h.to)) || (cal.dayOff || []).some(o => inR(d, o.date, o.to)) || (cal.exams || []).some(e => inR(d, e.from, e.to));
    let d = parse(cal.start); while (d.getDay() !== 0) d = addDays(d, -1);
    const end = parse(cal.end), weeks = [];
    while (d <= end) {
      const days = [0, 1, 2, 3, 4].map(k => addDays(d, k)).filter(x => x >= parse(cal.start) && x <= end);
      const open = days.filter(x => !inHol(x)).length;
      const first = iso(days[0] || d);
      const term = first <= cal.terms[0] ? 1 : first <= cal.terms[1] ? 2 : 3;
      if (open > 0) weeks.push({ start: iso(d), open, term, partial: open < 5 });
      d = addDays(d, 7);
    }
    weeks.forEach((w, i) => w.n = i + 1); return weeks;
  }
  // Répartit les séquences sur les semaines selon les heures (h/semaine), avec semaines d'évaluation.
  function planYear(seqs, cal, weekly = 5, opts = {}) {
    const weeks = schoolWeeks(cal); const reserve = opts.reserve ?? true;
    const plan = weeks.map(w => ({ ...w, items: [], hours: Math.round(weekly * w.open / 5) }));
    if (reserve) { // 1re semaine : évaluation diagnostique ; avant chaque fin de trimestre : اختبار
      plan[0].items.push({ kind: 'diag', ar: 'تقويم تشخيصي ومعالجة' }); plan[0].hours = Math.max(0, plan[0].hours - weekly);
      for (const t of [1, 2, 3]) { const tw = plan.filter(p => p.term === t); if (tw.length) { const last = tw[tw.length - 1]; last.items.push({ kind: 'exam', ar: `اختبار الفصل ${t}` }); last.hours = Math.max(0, last.hours - weekly); const mid = tw[Math.floor(tw.length / 2)]; mid.items.push({ kind: 'devoir', ar: `فرض الفصل ${t}` }); mid.hours = Math.max(0, mid.hours - 1); } }
    }
    let wi = 0;
    for (const s of seqs) { let left = s.hours; while (left > 0 && wi < plan.length) { const cap = plan[wi].hours - plan[wi].items.filter(i => i.kind === 'seq').reduce((a, i) => a + i.h, 0); if (cap <= 0) { wi++; continue; } const h = Math.min(cap, left); plan[wi].items.push({ kind: 'seq', id: s.id, ar: s.ar, h }); left -= h; if (h === cap) wi++; } if (left > 0) plan.overflow = (plan.overflow || 0) + left; }
    return plan;
  }

  // ---------- CSV ----------
  function parseCSV(text) {
    text = text.replace(/^\uFEFF/, ''); const sep = (text.split('\n')[0].match(/;/g) || []).length > (text.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
    const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < text.length; i++) { const c = text[i];
      if (q) { if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
      else if (c === '"') q = true; else if (c === sep) { row.push(cur); cur = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; } else cur += c; }
    if (cur || row.length) { row.push(cur); rows.push(row); }
    return rows.map(r => r.map(x => x.trim())).filter(r => r.some(x => x));
  }
  function studentsFromCSV(text) {
    const rows = parseCSV(text); if (!rows.length) return [];
    const h = rows[0].join(' ').toLowerCase(); const hasHeader = /nom|prénom|prenom|اللقب|الاسم|name/.test(h);
    return (hasHeader ? rows.slice(1) : rows).map(r => ({ last: r[0] || '', first: r[1] || '', birth: r[2] || '' })).filter(s => s.last || s.first);
  }
  const toCSV = rows => '\uFEFF' + rows.map(r => r.map(v => { v = v == null ? '' : String(v); return /[",;\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; }).join(';')).join('\r\n');

  const API = { rng, gcd, round, fmt, frac, GEN, generate, bareme, BEM_POINTS, FORMULAS, ccAverage, termAverage, weightedAverage, annualAverage, APPRECIATIONS, appreciation, ranks, stats, defaultCalendar, schoolWeeks, planYear, parseCSV, studentsFromCSV, toCSV, iso };
  if (typeof module !== 'undefined') module.exports = API; else root.CORE = API;
})(this);
