/* LaTeX (sous-ensemble utilisé par l'application) -> équations Word natives (OMML) via docx.Math. MIT.
   OMML.runs(texte, docx, {size}) : découpe "texte $math$ texte" en TextRun (arabe RTL) et Math.
   OMML.parse(latex) : arbre {t:'run'|'frac'|'sqrt'|'sup'|'sub'}. OMML.plain(latex) : repli texte. */
(function (root) {
  const SYM = { times: '×', div: '÷', le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠', approx: '≈', circ: '°', pi: 'π', infty: '∞', parallel: '∥', perp: '⊥', ldots: '…', cdots: '⋯', cdot: '·', mapsto: '↦', to: '→', Delta: 'Δ', alpha: 'α', beta: 'β', in: '∈', notin: '∉', mathbb: '', pm: '±', sin: 'sin', cos: 'cos', tan: 'tan', triangle: '△', angle: '∠', backslash: '\\', '%': '%', ',': ' ', ';': ' ', ':': ' ', '!': '', ' ': ' ', quad: '  ', qquad: '   ', '{': '{', '}': '}', '\\': ' ; ', lbrace: '{', rbrace: '}' };
  function parse(s) {
    let i = 0;
    function group() { // après '{'
      let depth = 1, j = i; while (j < s.length && depth) { if (s[j] === '\\') { j += 2; continue; } if (s[j] === '{') depth++; else if (s[j] === '}') depth--; j++; }
      const inner = s.slice(i, j - 1); i = j; return inner; }
    function arg() { while (s[i] === ' ') i++; if (s[i] === '{') { i++; return parse(group()); } if (s[i] === '\\') { const n = []; one(n); return n; } return [{ t: 'run', v: s[i++] || '' }]; }
    function rawArg() { while (s[i] === ' ') i++; if (s[i] === '{') { i++; return group(); } return s[i++] || ''; }
    const out = [];
    function push(n, v) { const last = n[n.length - 1]; if (last && last.t === 'run' && v.t === 'run') last.v += v.v; else n.push(v); }
    function one(n) {
      const c = s[i];
      if (c === '\\') { i++; let name = ''; if (/[a-zA-Z]/.test(s[i])) { while (/[a-zA-Z]/.test(s[i])) name += s[i++]; } else name = s[i++];
        if (name === 'frac' || name === 'dfrac' || name === 'tfrac') { const a = arg(), b = arg(); n.push({ t: 'frac', n: a, d: b }); return; }
        if (name === 'sqrt') { let deg = null; if (s[i] === '[') { const j = s.indexOf(']', i); deg = parse(s.slice(i + 1, j)); i = j + 1; } n.push({ t: 'sqrt', c: arg(), deg }); return; }
        if (name === 'text' || name === 'mathrm' || name === 'textbf' || name === 'operatorname' || name === 'mathbf') { push(n, { t: 'run', v: rawArg() }); return; }
        if (name === 'widehat' || name === 'hat') { const a = arg(); push(n, { t: 'run', v: '∡' }); a.forEach(x => push(n, x)); return; }
        if (name === 'overrightarrow' || name === 'vec') { const a = arg(); a.forEach(x => push(n, x.t === 'run' ? { t: 'run', v: x.v + '\u20D7' } : x)); return; }
        if (name === 'underbrace' || name === 'overline' || name === 'boxed') { arg().forEach(x => push(n, x)); if (s[i] === '_') { i++; arg(); } return; }
        if (name === 'left' || name === 'right') { const ch = s[i] === '\\' ? (i++, s[i++]) : s[i++]; if (ch !== '.') push(n, { t: 'run', v: ch === '{' ? '{' : ch === '}' ? '}' : ch }); return; }
        if (name === 'begin' || name === 'end') { const env = rawArg(); if (name === 'begin' && env === 'cases') push(n, { t: 'run', v: '{ ' }); return; }
        if (name in SYM) { push(n, { t: 'run', v: SYM[name] }); return; }
        push(n, { t: 'run', v: name }); return; }
      if (c === '{') { i++; const g = group(); if (g === ',') push(n, { t: 'run', v: ',' }); else parse(g).forEach(x => push(n, x)); return; }
      if (c === '^' || c === '_') { i++; let base = n.pop(); if (!base) base = { t: 'run', v: '' }; else if (base.t === 'run' && base.v.length > 1) { const v = base.v; const m = v.match(/(\d+|.)$/u); n.push({ t: 'run', v: v.slice(0, v.length - m[0].length) }); base = { t: 'run', v: m[0] }; }
        const e = arg(); n.push(c === '^' ? { t: 'sup', b: [base], e } : { t: 'sub', b: [base], e }); return; }
      if (c === '&') { i++; return; }
      i++; push(n, { t: 'run', v: c === '~' ? ' ' : c });
    }
    while (i < s.length) one(out);
    return out.filter(x => !(x.t === 'run' && x.v === ''));
  }
  function plain(s) { const f = n => n.map(x => x.t === 'run' ? x.v : x.t === 'frac' ? `(${f(x.n)})/(${f(x.d)})` : x.t === 'sqrt' ? `√(${f(x.c)})` : x.t === 'sup' ? `${f(x.b)}^${f(x.e)}` : `${f(x.b)}_${f(x.e)}`).join(''); return f(parse(s)); }
  function toDocx(nodes, d) { return nodes.map(x => x.t === 'run' ? new d.MathRun(x.v) : x.t === 'frac' ? new d.MathFraction({ numerator: toDocx(x.n, d), denominator: toDocx(x.d, d) }) : x.t === 'sqrt' ? new d.MathRadical({ children: toDocx(x.c, d), ...(x.deg ? { degree: toDocx(x.deg, d) } : {}) }) : x.t === 'sup' ? new d.MathSuperScript({ children: toDocx(x.b, d), superScript: toDocx(x.e, d) }) : new d.MathSubScript({ children: toDocx(x.b, d), subScript: toDocx(x.e, d) })); }
  const clean = t => String(t ?? '').replace(/<br\s*\/?>/gi, '\n').replace(/<span class="bp">\(([^)]*)\)<\/span>/g, '($1)').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  // Segments d'une ligne : texte (RTL si arabe) + équations natives
  function runs(text, d, o = {}) { const size = o.size || 24, bold = !!o.bold; const parts = String(text).split(/\$([^$]+)\$/); const out = [];
    parts.forEach((p, k) => { if (!p) return; if (k % 2) { try { out.push(new d.Math({ children: toDocx(parse(p), d) })); } catch (e) { out.push(new d.TextRun({ text: plain(p), size, bold })); } }
      else out.push(new d.TextRun({ text: p, size, bold, rightToLeft: /[\u0600-\u06FF]/.test(p), font: 'Arial' })); });
    return out; }
  // Paragraphes (une ligne = un paragraphe) avec équations
  function paragraphs(text, d, o = {}) { return clean(text).split('\n').map(l => new d.Paragraph({ bidirectional: o.rtl !== false, alignment: o.align || d.AlignmentType.RIGHT, spacing: { after: 60 }, children: runs(l, d, o) })); }
  // SVG -> PNG (navigateur) pour insérer les figures dans Word
  function svgToPng(svg, scale = 2) { return new Promise((res, rej) => { const m = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/) || svg.match(/width="([\d.]+)"[^>]*height="([\d.]+)"/); const w = m ? +m[1] : 360, h = m ? +m[2] : 240;
    const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = w * scale; c.height = h * scale; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height); c.toBlob(b => b ? b.arrayBuffer().then(buf => res({ data: new Uint8Array(buf), w, h })) : rej(new Error('png')), 'image/png'); };
    img.onerror = rej; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.includes('xmlns=') ? svg : svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')); }); }
  async function figure(spec, d, FIG, maxW = 300) { if (!spec || !FIG || typeof document === 'undefined') return null; try { const p = await svgToPng(FIG.render(spec)); const k = Math.min(1, maxW / p.w); return new d.Paragraph({ alignment: d.AlignmentType.CENTER, children: [new d.ImageRun({ data: p.data, transformation: { width: Math.round(p.w * k), height: Math.round(p.h * k) } })] }); } catch (e) { return null; } }
  const API = { parse, plain, runs, paragraphs, figure, svgToPng, clean };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.OMML = API;
})(typeof window !== 'undefined' ? window : globalThis);
