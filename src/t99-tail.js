  // ======================= Correspondance leçon -> modèle =======================
  const TMAP = {
    '1AM-1': ['natOps', 'decFrac', 'pow10', 'orderDec', 'decAddSub', 'decMul', 'estimate'],
    '1AM-2': ['geoParallel', 'geoPerp', 'midpoint1', 'notation', 'triConstruct', 'quadConstruct', 'circleBasic', 'tiling', 'rectArea', 'rightTriArea', 'circlePerim'],
    '1AM-3': ['euclid', 'div235', 'div49', 'decDiv', 'decDivNat', 'approx'],
    '1AM-4': ['angleSum1', 'angleMeasure', 'angleDraw', 'angleClass', 'symShapes', 'symAxes', 'reflectPoint', 'reflectSegment', 'reflectCircle', 'reflectProps', 'perpBisector', 'bisector'],
    '1AM-5': ['quotFrac', 'fracWrite', 'fracSimplify', 'fracCompare', 'fracOf', 'relOrder', 'coordRead', 'substitute', 'missing'],
    '1AM-6': ['isProp', 'propTable', 'fourth', 'percent1', 'scale', 'readChart', 'drawChart'],
    '1AM-7': ['cuboidCount', 'cuboidEdges', 'cuboidNet', 'cuboidVol', 'volUnits'],
    '2AM-1': ['priority', 'priorityParen', 'distrib', 'approxSci'],
    '2AM-2': ['triExist', 'centralPoint', 'centralSeg', 'centralProps', 'centerSym'],
    '2AM-3': ['fracCommon', 'fracAdd', 'fracMul', 'fracOfFrac'],
    '2AM-4': ['angleComp', 'angleVert', 'angleParallel', 'triAngleSum'],
    '2AM-5': ['relCompare', 'relAdd', 'relSub', 'relDistance', 'expandSimple', 'eqSimple'],
    '2AM-6': ['triIneq', 'circumcircle', 'paraProps', 'paraSpecial', 'paraArea'],
    '2AM-7': ['propGraph', 'percent2', 'scale', 'speed', 'freqTable', 'drawChart'],
    '2AM-8': ['prismCount', 'prismArea', 'cylinder', 'prismVol'],
    '3AM-1': ['relMul', 'relProd', 'relDiv', 'ratAdd', 'ratMulDiv'],
    '3AM-2': ['circumcenter3', 'incircle', 'median', 'altitude'],
    '3AM-3': ['powInt', 'pow10neg', 'powRules', 'sciNotation'],
    '3AM-4': ['midline', 'midlineConv', 'triProp'],
    '3AM-5': ['expand', 'removeParen', 'inequalityOps', 'eq1', 'ineq1', 'modelize'],
    '3AM-6': ['rightCircle', 'pyth', 'pythConv', 'cosine', 'tangent'],
    '3AM-7': ['percentChain', 'propGraph', 'groupedFreq', 'weightedMean'],
    '3AM-8': ['translateCoords', 'translateProps', 'translatePara', 'pyramidVol', 'coneVol'],
    '4AM-1': ['divisors', 'pgcd', 'coprime', 'irreducible', 'sqrtDef', 'xsq', 'sqrtOps', 'rationalize'],
    '4AM-2': ['thales', 'thalesConv', 'divideSeg', 'trigRatios', 'trigCalc', 'trigIdent'],
    '4AM-3': ['identity', 'factor', 'zeroProduct', 'eq1', 'ineq1', 'modelize'],
    '4AM-4': ['vecTranslate', 'vecEqual', 'chasles', 'vecComp', 'midCoord', 'distance'],
    '4AM-5': ['system', 'linearFn', 'percentLinear', 'affineFn', 'affine2pts', 'systemGraph'],
    '4AM-6': ['groupedFreq', 'meanMedian', 'spreadsheet'],
    '4AM-7': ['rotation', 'inscribed', 'regPolygon', 'sphere', 'section', 'scaling']
  };
  const LV_PTS = { 1: 3, 2: 4, 3: 5 }, LV_AR = { 1: 'تطبيق مباشر', 2: 'تعميق', 3: 'وضعية' }, LV_FR = { 1: 'application', 2: 'approfondissement', 3: 'situation' };
  function normFig(f) { if (!f) return undefined; f = { ...f };
    if (f.type === 'graph' && !f.fns) { f.fns = [{ a: f.a, b: f.b || 0 }, ...(f.extra || [])]; const ys = f.fns.flatMap(g => [g.a * f.xmin + g.b, g.a * f.xmax + g.b]); f.ymin = f.ymin ?? Math.floor(Math.min(0, ...ys)); f.ymax = f.ymax ?? Math.ceil(Math.max(0, ...ys)); }
    if (f.right && f.right.length && typeof f.right[0] === 'string') { const ks = Object.keys(f.pts).filter(k => !f.right.includes(k)); f.right = f.right.map(a => [ks[0], a, ks[1]]); }
    return f; }
  function stepPts(n, total) { const base = Math.floor(total / n * 4) / 4; const L = Array(n).fill(base); let rest = Math.round((total - base * n) * 4); for (let i = n - 1; rest > 0; i = (i - 1 + n) % n, rest--) L[i] += 0.25; return L; }
  function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  // Un exercice déterministe : (séquence, index de leçon, niveau, variante)
  function make(seqId, li, lv, v = 0) { const name = (TMAP[seqId] || [])[li]; const t = T[name]; if (!t) return null;
    const seed = hash(`${seqId}|${li}|${lv}|${v}`); const o = t.f(X(seed), lv); const s = (o.s || []).filter(Boolean); const pts = LV_PTS[lv]; const sp = stepPts(Math.max(1, s.length), pts);
    return { id: `g-${seqId}-${li}-${lv}-${v}`, seq: seqId, lesson: li, tpl: name, level: lv, kind: 'ex', pts, q: o.q, s, sp, a: s.map((st, i) => `${st} <span class="bp">(${sp[i]} ن)</span>`).join('<br>'), fig: normFig(o.fig), chk: o.chk, rule: t.rule, gen: true }; }
  function forLesson(seqId, li, perLevel = 2, vStart = 0) { const out = []; for (const lv of [1, 2, 3]) for (let v = vStart; v < vStart + perLevel; v++) { const e = make(seqId, li, lv, v); if (e) out.push(e); } return out; }
  function ruleOf(seqId, li) { const t = T[(TMAP[seqId] || [])[li]]; return t ? t.rule : ''; }
  const API = { T, TMAP, make, forLesson, ruleOf, LV_AR, LV_FR, X, gcd, normFig };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.LESSONS = API;
})(typeof window !== 'undefined' ? window : globalThis);
