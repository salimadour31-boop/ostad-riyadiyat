/* Figures SVG (géométrie, repères, graphes, diagrammes). Sans dépendance. MIT.
   spec.type : geo | grid | graph | bar | pie
   geo  : { pts:{A:[x,y],...}, segs:[['A','B','6 cm'],...], lines:[['A','B']], circles:[{c:'O', r:3}|{c:[x,y],r}], right:[['B','A','C']] (angle droit en A), arcs:[['B','A','C','40°']], polys:[['A','B','C']] }
   grid : repère quadrillé + éléments geo (coordonnées numériques), axes:true
   graph: { xmin,xmax,ymin,ymax, fns:[{a,b,label}], pts }
   bar/pie : { labels:[], values:[] } */
(function (root) {
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const COLORS = ['#0f6b5c', '#3538cd', '#b54708', '#b42318', '#6941c6', '#027a48', '#c11574', '#475467'];
  const f2 = v => Math.round(v * 100) / 100;
  function frame(bb, W, pad) {
    const w = bb.x1 - bb.x0 || 1, h = bb.y1 - bb.y0 || 1, s = Math.min((W - 2 * pad) / w, (W * 0.75 - 2 * pad) / h);
    const H = Math.round(h * s + 2 * pad), WW = Math.round(w * s + 2 * pad);
    return { s, W: WW, H, X: x => f2(pad + (x - bb.x0) * s), Y: y => f2(H - pad - (y - bb.y0) * s) };
  }
  const svgOpen = (W, H, title) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(title || 'figure')}" class="fig" font-family="Arial, sans-serif" font-size="14" direction="ltr">` + (title ? `<title>${esc(title)}</title>` : '');
  function geo(spec, W = 360) {
    const P = {}; for (const [k, v] of Object.entries(spec.pts || {})) P[k] = v;
    const get = p => Array.isArray(p) ? p : P[p];
    const all = Object.values(P).slice(); (spec.circles || []).forEach(c => { const o = get(c.c); all.push([o[0] - c.r, o[1] - c.r], [o[0] + c.r, o[1] + c.r]); });
    if (spec.grid) all.push([spec.grid.xmin, spec.grid.ymin], [spec.grid.xmax, spec.grid.ymax]);
    if (!all.length) all.push([0, 0], [1, 1]);
    const bb = { x0: Math.min(...all.map(p => p[0])), x1: Math.max(...all.map(p => p[0])), y0: Math.min(...all.map(p => p[1])), y1: Math.max(...all.map(p => p[1])) };
    const m = spec.grid ? 0 : Math.max(bb.x1 - bb.x0, bb.y1 - bb.y0) * 0.12 || 1; bb.x0 -= m; bb.x1 += m; bb.y0 -= m; bb.y1 += m;
    const F = frame(bb, W, 22); let o = svgOpen(F.W, F.H, spec.title);
    if (spec.grid) { const g = spec.grid; for (let x = Math.ceil(g.xmin); x <= g.xmax; x++) o += `<line x1="${F.X(x)}" y1="${F.Y(g.ymin)}" x2="${F.X(x)}" y2="${F.Y(g.ymax)}" stroke="#d0d5dd" stroke-width="${x === 0 && g.axes ? 1.6 : 0.6}" ${x === 0 && g.axes ? 'stroke="#344054"' : ''}/>`;
      for (let y = Math.ceil(g.ymin); y <= g.ymax; y++) o += `<line x1="${F.X(g.xmin)}" y1="${F.Y(y)}" x2="${F.X(g.xmax)}" y2="${F.Y(y)}" stroke="#d0d5dd" stroke-width="0.6"/>`;
      if (g.axes) { o += `<line x1="${F.X(g.xmin)}" y1="${F.Y(0)}" x2="${F.X(g.xmax)}" y2="${F.Y(0)}" stroke="#344054" stroke-width="1.6"/><line x1="${F.X(0)}" y1="${F.Y(g.ymin)}" x2="${F.X(0)}" y2="${F.Y(g.ymax)}" stroke="#344054" stroke-width="1.6"/>`;
        o += `<text x="${F.X(0) - 12}" y="${F.Y(0) + 15}" font-size="12">O</text><text x="${F.X(1) - 3}" y="${F.Y(0) + 15}" font-size="11">1</text><text x="${F.X(0) - 12}" y="${F.Y(1) + 4}" font-size="11">1</text>`; } }
    (spec.polys || []).forEach((pl, i) => { o += `<polygon points="${pl.map(p => get(p)).map(p => F.X(p[0]) + ',' + F.Y(p[1])).join(' ')}" fill="${COLORS[i % 8]}22" stroke="none"/>`; });
    (spec.circles || []).forEach(c => { const p = get(c.c); o += `<circle cx="${F.X(p[0])}" cy="${F.Y(p[1])}" r="${f2(c.r * F.s)}" fill="none" stroke="#3538cd" stroke-width="1.6"/>`; });
    (spec.lines || []).forEach(([a, b, lab]) => { const p = get(a), q = get(b), dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, e = 3 * Math.max(bb.x1 - bb.x0, bb.y1 - bb.y0) / L;
      o += `<line x1="${F.X(p[0] - dx * e)}" y1="${F.Y(p[1] - dy * e)}" x2="${F.X(q[0] + dx * e)}" y2="${F.Y(q[1] + dy * e)}" stroke="#475467" stroke-width="1.2" stroke-dasharray="${lab === 'dash' ? '5 4' : ''}"/>`; });
    (spec.segs || []).forEach(([a, b, lab, opt]) => { const p = get(a), q = get(b); o += `<line x1="${F.X(p[0])}" y1="${F.Y(p[1])}" x2="${F.X(q[0])}" y2="${F.Y(q[1])}" stroke="${opt === 'dash' ? '#667085' : '#101828'}" stroke-width="1.8" ${opt === 'dash' ? 'stroke-dasharray="5 4"' : ''}/>`;
      if (lab) { const mx = (F.X(p[0]) + F.X(q[0])) / 2, my = (F.Y(p[1]) + F.Y(q[1])) / 2, dx = F.X(q[0]) - F.X(p[0]), dy = F.Y(q[1]) - F.Y(p[1]), L = Math.hypot(dx, dy) || 1; o += `<text x="${f2(mx - dy / L * 13)}" y="${f2(my + dx / L * 13 + 5)}" text-anchor="middle" font-size="13" fill="#b54708">${esc(lab)}</text>`; } });
    (spec.right || []).forEach(([b, a, c]) => { const A = get(a), B = get(b), C = get(c); const u = [B[0] - A[0], B[1] - A[1]], v = [C[0] - A[0], C[1] - A[1]], lu = Math.hypot(...u), lv = Math.hypot(...v), k = 11 / F.s;
      const p1 = [A[0] + u[0] / lu * k, A[1] + u[1] / lu * k], p3 = [A[0] + v[0] / lv * k, A[1] + v[1] / lv * k], p2 = [p1[0] + v[0] / lv * k, p1[1] + v[1] / lv * k];
      o += `<polyline points="${[p1, p2, p3].map(p => F.X(p[0]) + ',' + F.Y(p[1])).join(' ')}" fill="none" stroke="#101828" stroke-width="1.2"/>`; });
    (spec.arcs || []).forEach(([b, a, c, lab]) => { const A = get(a), B = get(b), C = get(c), r = 22, t1 = Math.atan2(-(B[1] - A[1]), B[0] - A[0]), t2 = Math.atan2(-(C[1] - A[1]), C[0] - A[0]);
      let d = t2 - t1; while (d <= -Math.PI) d += 2 * Math.PI; while (d > Math.PI) d -= 2 * Math.PI; const ax = F.X(A[0]), ay = F.Y(A[1]);
      o += `<path d="M${f2(ax + r * Math.cos(t1))},${f2(ay + r * Math.sin(t1))} A${r},${r} 0 0 ${d > 0 ? 1 : 0} ${f2(ax + r * Math.cos(t2))},${f2(ay + r * Math.sin(t2))}" fill="none" stroke="#b42318" stroke-width="1.3"/>`;
      if (lab) { const tm = t1 + d / 2; o += `<text x="${f2(ax + 36 * Math.cos(tm))}" y="${f2(ay + 36 * Math.sin(tm) + 5)}" text-anchor="middle" font-size="12" fill="#b42318">${esc(lab)}</text>`; } });
    const cx = (bb.x0 + bb.x1) / 2, cy = (bb.y0 + bb.y1) / 2;
    for (const [k, p] of Object.entries(P)) { if (k.startsWith('_')) continue; const dx = p[0] - cx, dy = p[1] - cy, L = Math.hypot(dx, dy) || 1;
      o += `<circle cx="${F.X(p[0])}" cy="${F.Y(p[1])}" r="2.6" fill="#101828"/><text x="${f2(F.X(p[0]) + dx / L * 13)}" y="${f2(F.Y(p[1]) - dy / L * 13 + 5)}" text-anchor="middle" font-weight="bold" font-size="14">${esc(k)}</text>`; }
    return o + '</svg>';
  }
  function graph(spec, W = 360) {
    const g = { xmin: spec.xmin ?? -5, xmax: spec.xmax ?? 5, ymin: spec.ymin ?? -5, ymax: spec.ymax ?? 5 };
    const F = frame({ x0: g.xmin, x1: g.xmax, y0: g.ymin, y1: g.ymax }, W, 18); let o = svgOpen(F.W, F.H, spec.title);
    for (let x = Math.ceil(g.xmin); x <= g.xmax; x++) o += `<line x1="${F.X(x)}" y1="${F.Y(g.ymin)}" x2="${F.X(x)}" y2="${F.Y(g.ymax)}" stroke="#e4e7ec" stroke-width="0.7"/>`;
    for (let y = Math.ceil(g.ymin); y <= g.ymax; y++) o += `<line x1="${F.X(g.xmin)}" y1="${F.Y(y)}" x2="${F.X(g.xmax)}" y2="${F.Y(y)}" stroke="#e4e7ec" stroke-width="0.7"/>`;
    o += `<line x1="${F.X(g.xmin)}" y1="${F.Y(0)}" x2="${F.X(g.xmax)}" y2="${F.Y(0)}" stroke="#344054" stroke-width="1.4"/><line x1="${F.X(0)}" y1="${F.Y(g.ymin)}" x2="${F.X(0)}" y2="${F.Y(g.ymax)}" stroke="#344054" stroke-width="1.4"/><text x="${F.X(0) - 11}" y="${F.Y(0) + 14}" font-size="11">O</text><text x="${F.X(1) - 3}" y="${F.Y(0) + 14}" font-size="11">1</text><text x="${F.X(0) - 11}" y="${F.Y(1) + 4}" font-size="11">1</text>`;
    (spec.fns || []).forEach((f, i) => { const y = x => f.a * x + (f.b || 0); let x0 = g.xmin, x1 = g.xmax; if (f.a) { const xa = (g.ymin - f.b) / f.a, xb = (g.ymax - f.b) / f.a; x0 = Math.max(g.xmin, Math.min(xa, xb)); x1 = Math.min(g.xmax, Math.max(xa, xb)); }
      o += `<line x1="${F.X(x0)}" y1="${F.Y(y(x0))}" x2="${F.X(x1)}" y2="${F.Y(y(x1))}" stroke="${COLORS[i % 8]}" stroke-width="2"/>`; if (f.label) o += `<text x="${F.X(x1) - 6}" y="${F.Y(y(x1)) + (f.a > 0 ? 16 : -6)}" text-anchor="end" fill="${COLORS[i % 8]}" font-size="13">${esc(f.label)}</text>`; });
    (spec.pts || []).forEach(p => o += `<circle cx="${F.X(p[0])}" cy="${F.Y(p[1])}" r="3" fill="#b42318"/><text x="${F.X(p[0]) + 6}" y="${F.Y(p[1]) - 6}" font-size="13" font-weight="bold">${esc(p[2] || '')}</text>`);
    return o + '</svg>';
  }
  function bar(spec, W = 360) { const v = spec.values, n = v.length, mx = Math.max(...v, 1), H = 230, pad = 34, bw = (W - 2 * pad) / n; let o = svgOpen(W, H, spec.title);
    const step = mx > 50 ? 10 : mx > 20 ? 5 : mx > 10 ? 2 : 1; for (let y = 0; y <= mx; y += step) { const yy = f2(H - pad - y / mx * (H - 2 * pad)); o += `<line x1="${pad}" y1="${yy}" x2="${W - pad / 2}" y2="${yy}" stroke="#e4e7ec"/><text x="${pad - 4}" y="${yy + 4}" text-anchor="end" font-size="11">${y}</text>`; }
    v.forEach((x, i) => { const h = x / mx * (H - 2 * pad); o += `<rect x="${f2(pad + i * bw + bw * 0.18)}" y="${f2(H - pad - h)}" width="${f2(bw * 0.64)}" height="${f2(h)}" fill="${COLORS[i % 8]}"/><text x="${f2(pad + (i + 0.5) * bw)}" y="${H - pad + 15}" text-anchor="middle" font-size="12" direction="rtl">${esc(spec.labels[i])}</text>`; });
    return o + `<line x1="${pad}" y1="${H - pad}" x2="${W - pad / 2}" y2="${H - pad}" stroke="#344054"/><line x1="${pad}" y1="${pad / 2}" x2="${pad}" y2="${H - pad}" stroke="#344054"/></svg>`; }
  function pie(spec, W = 360) { const v = spec.values, T = v.reduce((a, b) => a + b, 0) || 1, H = 220, r = 85, cx = 105, cy = 110; let o = svgOpen(W, H, spec.title), a = -Math.PI / 2;
    v.forEach((x, i) => { const d = x / T * 2 * Math.PI, a2 = a + d; o += d >= 2 * Math.PI - 1e-9 ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${COLORS[i % 8]}"/>` : `<path d="M${cx},${cy} L${f2(cx + r * Math.cos(a))},${f2(cy + r * Math.sin(a))} A${r},${r} 0 ${d > Math.PI ? 1 : 0} 1 ${f2(cx + r * Math.cos(a2))},${f2(cy + r * Math.sin(a2))} Z" fill="${COLORS[i % 8]}" stroke="#fff"/>`;
      o += `<rect x="215" y="${30 + i * 22}" width="12" height="12" fill="${COLORS[i % 8]}"/><text x="232" y="${41 + i * 22}" font-size="12" direction="rtl" text-anchor="start">${esc(spec.labels[i])} (${f2(x / T * 360)}°)</text>`; a = a2; });
    return o + '</svg>'; }
  function render(spec, W) { if (!spec) return ''; try { switch (spec.type) { case 'graph': return graph(spec, W); case 'bar': return bar(spec, W); case 'pie': return pie(spec, W); case 'grid': return geo({ ...spec, grid: { xmin: spec.xmin ?? -6, xmax: spec.xmax ?? 6, ymin: spec.ymin ?? -5, ymax: spec.ymax ?? 5, axes: spec.axes !== false } }, W); default: return geo(spec, W); } } catch (e) { return `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>`; } }
  // Préréglages de l'outil figures
  const PRESETS = {
    triangle: { ar: 'مثلث', make: o => ({ type: 'geo', pts: { A: [0, 0], B: [+o.c || 6, 0], C: [+o.cx || 2, +o.cy || 4] }, segs: [['A', 'B', o.l1 || ''], ['B', 'C', o.l2 || ''], ['C', 'A', o.l3 || '']] }), fields: { c: 'AB', cx: 'C x', cy: 'C y', l1: 'AB', l2: 'BC', l3: 'CA' } },
    right: { ar: 'مثلث قائم', make: o => ({ type: 'geo', pts: { A: [0, 0], B: [+o.b || 4, 0], C: [0, +o.c || 3] }, segs: [['A', 'B', o.l1 || ''], ['B', 'C', o.l2 || ''], ['C', 'A', o.l3 || '']], right: [['B', 'A', 'C']] }), fields: { b: 'AB', c: 'AC', l1: 'AB', l2: 'BC', l3: 'AC' } },
    thales: { ar: 'وضعية طالس', make: o => { const k = Math.min(0.9, Math.max(0.1, +o.k || 0.4)); const A = [0, 0], B = [7, 0], C = [3, 5]; return { type: 'geo', pts: { A, B, C, M: [B[0] * k, 0], N: [C[0] * k, C[1] * k] }, segs: [['A', 'B'], ['A', 'C'], ['B', 'C'], ['M', 'N']] }; }, fields: { k: 'AM/AB' } },
    circle: { ar: 'دائرة', make: o => { const r = +o.r || 3; return { type: 'geo', pts: { O: [0, 0], A: [r, 0] }, circles: [{ c: 'O', r }], segs: [['O', 'A', o.l || 'r']] }; }, fields: { r: 'r', l: 'label' } },
    grid: { ar: 'معلم ونقط', make: o => { const pts = {}; String(o.p || 'A(2;3) B(-3;1)').replace(/([A-Z])\s*\(\s*(-?[\d.]+)\s*[;,]\s*(-?[\d.]+)\s*\)/g, (_, n, x, y) => pts[n] = [+x, +y]); return { type: 'grid', pts, segs: o.join ? Object.keys(pts).map((k, i, a) => [k, a[(i + 1) % a.length]]).slice(0, Math.max(0, Object.keys(pts).length - (Object.keys(pts).length > 2 ? 0 : 1))) : [] }; }, fields: { p: 'A(2;3) B(-3;1)', join: '1/0' } },
    graph: { ar: 'تمثيل دالة', make: o => ({ type: 'graph', fns: String(o.f || '2x+1').split(/[;،]/).map(s => { const m = s.replace(/\s/g, '').replace(',', '.').match(/^(-?[\d.]*)x([+-][\d.]+)?$/); const a = m ? (m[1] === '' ? 1 : m[1] === '-' ? -1 : +m[1]) : 1; return { a, b: m && m[2] ? +m[2] : 0, label: s.trim() }; }) }), fields: { f: 'ax+b ; ...' } },
    bar: { ar: 'مخطط بالأعمدة', make: o => ({ type: 'bar', labels: String(o.l || 'أ;ب;ج').split(/[;،]/), values: String(o.v || '3;5;2').split(/[;،]/).map(Number) }), fields: { l: 'labels ;', v: 'values ;' } },
    pie: { ar: 'مخطط دائري', make: o => ({ type: 'pie', labels: String(o.l || 'أ;ب;ج').split(/[;،]/), values: String(o.v || '3;5;2').split(/[;،]/).map(Number) }), fields: { l: 'labels ;', v: 'values ;' } }
  };
  const API = { render, PRESETS };
  if (typeof module !== 'undefined') module.exports = API; else root.FIG = API;
})(this);
