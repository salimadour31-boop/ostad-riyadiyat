/* Ostad Riyadiyat – interface. MIT. */
(function () {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rich = s => esc(s).replace(/&lt;br&gt;/g, '<br>').replace(/\n/g, '<br>');
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const L = () => I18N.lang, fr = () => L() === 'fr';
  const nm = o => (fr() && o.fr) ? o.fr : o.ar;
  const view = $('#view');
  const S = { settings: { lang: 'ar', teacher: '', school: '', wilaya: '', schoolYear: '2026-2027', formula: '1-2', termCoefs: [1, 1, 1] }, classes: [], fiches: [], tests: [], journal: [], plans: {}, draft: null, curClass: null, curTerm: 1 };
  const KEYS = ['settings', 'classes', 'fiches', 'tests', 'journal', 'plans', 'draft'];
  const timers = {};
  function save(k) { clearTimeout(timers[k]); timers[k] = setTimeout(() => DB.set(k, S[k]).catch(e => console.warn(e)), 250); }
  function toast(m) { const el = $('#toast'); el.textContent = m; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 1800); }
  function math(el) { if (window.renderMathInElement) renderMathInElement(el, { delimiters: [{ left: '$', right: '$', display: false }], throwOnError: false }); }
  function download(name, data, type) { const b = data instanceof Blob ? data : new Blob([data], { type }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
  function printHTML(html) { const p = $('#printArea'); p.innerHTML = `<div class="sheet" dir="rtl" lang="ar">${html}</div>`; math(p); setTimeout(() => window.print(), 50); }
  const yearOpts = (sel, withAll) => (withAll ? `<option value="">${t('all')}</option>` : '') + PROG.YEARS.map(y => `<option value="${y.id}" ${y.id === sel ? 'selected' : ''}>${y.id} – ${esc(nm(y))}</option>`).join('');
  const seqOpts = (yid, sel, withAll) => (withAll ? `<option value="">${t('all')}</option>` : '') + (PROG.year(yid)?.seqs || []).map((s, i) => `<option value="${s.id}" ${s.id === sel ? 'selected' : ''}>${i + 1}. ${esc(nm(s))}</option>`).join('');
  const domTag = d => `<span class="tag d-${d}">${esc(nm(PROG.DOMAINS[d]))}</span>`;
  const officialHeader = (extra = '') => { const st = S.settings; return `<div class="hdr"><div class="c">الجمهورية الجزائرية الديمقراطية الشعبية</div><div>وزارة التربية الوطنية</div><div>${t('schoolYear')}: ${esc(st.schoolYear)}</div><div>${esc('مديرية التربية لولاية')}: ${esc(st.wilaya || '........')}</div><div>${esc('المتوسطة')}: ${esc(st.school || '........')}</div>${extra}</div>`; };

  // ---------------- routes ----------------
  const ROUTES = ['home', 'prog', 'fiche', 'plan', 'bank', 'test', 'grades', 'journal', 'settings'];
  function nav() { const cur = (location.hash.slice(1) || 'home').split('/')[0]; $('#nav').innerHTML = ROUTES.map(r => `<a href="#${r}" class="${r === cur ? 'on' : ''}">${t(r)}</a>`).join(''); }
  function route() { const [r, arg] = (location.hash.slice(1) || 'home').split('/'); nav(); (V[r] || V.home)(arg); math(view); $$('[data-t]').forEach(e => e.textContent = t(e.dataset.t)); $('#langBtn').textContent = fr() ? 'العربية' : 'Français'; document.title = t('appName') + ' – ' + t(r in V ? r : 'home'); }
  const V = {};

  V.home = () => {
    view.innerHTML = `<h1>${t('appName')}</h1><p class="muted">${t('homeIntro')}</p>
      <div class="grid">${ROUTES.slice(1).map(r => `<a class="tile" href="#${r}"><b>${t(r)}</b><small>${t('d_' + r)}</small></a>`).join('')}</div>
      <p class="muted" style="margin-top:1rem">${t('privacy')}</p>
      <button id="installBtn" class="btn sec" hidden>${t('install')}</button>`;
    if (deferredPrompt) { const b = $('#installBtn'); b.hidden = false; b.onclick = () => { deferredPrompt.prompt(); deferredPrompt = null; b.hidden = true; }; }
  };

  // ---------------- programme ----------------
  V.prog = (yid) => {
    yid = yid || S.settings.lastYear || '1AM'; const y = PROG.year(yid) || PROG.YEARS[0];
    const tot = y.seqs.reduce((a, s) => a + s.hours, 0);
    view.innerHTML = `<h1>${t('prog')}</h1><div class="bar">${PROG.YEARS.map(x => `<a class="btn ${x.id === y.id ? '' : 'sec'}" href="#prog/${x.id}">${x.id}</a>`).join('')}</div>
      <div class="card"><h2>${esc(nm(y))}</h2><p><b>${t('global')}:</b> ${esc(y.global)}</p>
      <p class="muted">${y.weekly} ${t('hours')} / ${fr() ? 'semaine' : 'أسبوعيا'} · ${y.seqs.length} ${fr() ? 'séquences' : 'مقاطع'} · ${tot} ${t('hours')}</p>
      <p class="muted">${fr() ? 'Composantes de la compétence :' : 'مركبات الكفاءة:'} ${PROG.COMPONENTS.map(c => esc(nm(c))).join(' · ')}</p><p class="warn">${t('verify')}</p></div>
      ${y.seqs.map((s, i) => `<details ${i === 0 ? 'open' : ''}><summary>${i + 1}. ${esc(nm(s))} ${domTag(s.domain)} <span class="muted">(${s.hours} ${t('hours')})</span></summary>
        <p><b>${t('competence')}:</b> ${esc(s.competence)}</p><b>${t('resources')}:</b><ol>${s.lessons.map((l, j) => `<li>${esc(l)} <a href="#fiche/new:${s.id}:${j}" class="btn sm sec">${t('fiche')}</a></li>`).join('')}</ol>
        <div class="bar"><a class="btn sm sec" href="#bank/${s.id}">${t('bank')} (${BANK.filter(e => e.seq === s.id).length})</a></div></details>`).join('')}`;
    S.settings.lastYear = y.id; save('settings');
  };

  // ---------------- fiche ----------------
  const STAGES = () => [
    { name: 'التهيئة (تقويم تشخيصي)', dur: '10 د', act: 'أسئلة قصيرة للتحقق من المكتسبات القبلية اللازمة للدرس.', ind: 'يسترجع مكتسباته القبلية.' },
    { name: 'أنشطة بناء التعلمات (وضعية تعلمية، تقويم بنائي)', dur: '20 د', act: '', ind: 'يبحث، يخمن، يجرب ويبرر.' },
    { name: 'الحوصلة (إرساء الموارد)', dur: '10 د', act: '', ind: 'يصوغ النتيجة ويدونها.' },
    { name: 'إعادة الاستثمار (تقويم ختامي)', dur: '15 د', act: '', ind: 'يوظف المورد في وضعية مماثلة.' },
    { name: 'الواجب المنزلي / المعالجة', dur: '5 د', act: '', ind: '' }];
  function newFiche(seqId, li) {
    const s = PROG.seq(seqId) || PROG.YEARS[0].seqs[0], y = PROG.year(s.id.slice(0, 3)), lesson = s.lessons[li] ?? s.lessons[0];
    const ex = BANK.filter(e => e.seq === s.id), sit = ex.find(e => e.level === 3) || ex[ex.length - 1], app = ex.find(e => e.level === 1) || ex[0];
    const st = STAGES(); st[1].act = `وضعية تعلمية تقود التلميذ إلى اكتشاف: ${lesson}.`; st[2].act = `صياغة القاعدة/الخاصية المتعلقة بـ: ${lesson} مع مثال محلول.`;
    st[3].act = app ? app.q : ''; st[4].act = 'تمارين من الكتاب المدرسي أو من بنك التمارين حسب صعوبات التلاميذ.';
    return { id: uid(), year: y.id, seq: s.id, lesson, date: new Date().toISOString().slice(0, 10), cls: '', duration: '1 سا',
      finalComp: y.global, comp: s.competence, components: PROG.COMPONENTS.map(c => c.ar),
      indicators: `- يتعرف على ${lesson}.\n- يوظف ${lesson} في حل مشكلات بسيطة.\n- يحرر حلا منظما ويبرر خطواته.`,
      means: 'الكتاب المدرسي، السبورة، الأدوات الهندسية، الحاسبة', situation: sit ? sit.q : '', stages: st, solution: app ? app.a : '' };
  }
  let F = null;
  V.fiche = (arg) => {
    if (arg && arg.startsWith('new:')) { const [, sid, li] = arg.split(':'); F = newFiche(sid, +li); history.replaceState(null, '', '#fiche'); }
    else if (arg) F = structuredClone(S.fiches.find(f => f.id === arg) || F);
    if (!F) F = newFiche((PROG.year(S.settings.lastYear || '1AM') || PROG.YEARS[0]).seqs[0].id, 0);
    const s = PROG.seq(F.seq);
    view.innerHTML = `<h1>${t('fiche')}</h1>
      <div class="card"><div class="row"><label>${t('year')}<select id="fy">${yearOpts(F.year)}</select></label><label>${t('seq')}<select id="fs">${seqOpts(F.year, F.seq)}</select></label>
      <label>${t('lesson')}<select id="fl">${s.lessons.map((l, i) => `<option value="${i}" ${l === F.lesson ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label></div>
      <div class="bar"><button class="btn sec" id="fReset">${t('newFiche')}</button></div></div>
      <div class="card" id="fform">
        <div class="row"><label>${t('date')}<input type="date" data-k="date" value="${esc(F.date)}"></label><label>${t('cls')}<input data-k="cls" value="${esc(F.cls)}"></label><label>${t('duration')}<input data-k="duration" value="${esc(F.duration)}"></label></div>
        <label>الكفاءة الختامية<textarea data-k="finalComp">${esc(F.finalComp)}</textarea></label>
        <label>الكفاءة المستهدفة (المقطع)<textarea data-k="comp">${esc(F.comp)}</textarea></label>
        <label>مركبات الكفاءة<textarea data-k="components">${esc(F.components.join('\n'))}</textarea></label>
        <label>مؤشرات الكفاءة<textarea data-k="indicators">${esc(F.indicators)}</textarea></label>
        <label>الوسائل<input data-k="means" value="${esc(F.means)}"></label>
        <label>الوضعية الانطلاقية / المشكلة (يمكن كتابة الرياضيات بين $...$)<textarea data-k="situation">${esc(F.situation)}</textarea></label>
        <h2>سير الحصة</h2>
        ${F.stages.map((st, i) => `<div class="card" style="padding:.6rem"><div class="row"><label style="flex:3">المرحلة<input data-st="${i}" data-f="name" value="${esc(st.name)}"></label><label style="flex:1">${t('duration')}<input data-st="${i}" data-f="dur" value="${esc(st.dur)}"></label></div>
          <label>الأنشطة المقترحة<textarea data-st="${i}" data-f="act">${esc(st.act)}</textarea></label><label>مؤشر الكفاءة / التقويم<input data-st="${i}" data-f="ind" value="${esc(st.ind)}"></label></div>`).join('')}
        <label>حل نشاط التقويم (للأستاذ)<textarea data-k="solution">${esc(F.solution)}</textarea></label>
      </div>
      <div class="bar"><button class="btn" id="fSave">${t('save')}</button><button class="btn sec" id="fPrint">${t('print')}</button><button class="btn sec" id="fDocx">${t('docx')}</button></div>
      <h2>${t('myFiches')}</h2><div id="flist">${S.fiches.length ? `<table><tr><th>${t('date')}</th><th>${t('year')}</th><th>${t('lesson')}</th><th></th></tr>${S.fiches.map(f => `<tr><td>${esc(f.date)}</td><td>${f.year}</td><td>${esc(f.lesson)}</td><td><a class="btn sm sec" href="#fiche/${f.id}">${t('open')}</a> <button class="btn sm danger" data-del="${f.id}">${t('del')}</button></td></tr>`).join('')}</table>` : `<p class="muted">${t('empty')}</p>`}</div>`;
    $('#fy').onchange = e => { F = newFiche(PROG.year(e.target.value).seqs[0].id, 0); V.fiche(); };
    $('#fs').onchange = e => { F = newFiche(e.target.value, 0); V.fiche(); };
    $('#fl').onchange = e => { F = newFiche(F.seq, +e.target.value); V.fiche(); };
    $('#fReset').onclick = () => { F = newFiche(F.seq, 0); V.fiche(); };
    $('#fform').oninput = e => { const el = e.target; if (el.dataset.k) F[el.dataset.k] = el.dataset.k === 'components' ? el.value.split('\n') : el.value; else if (el.dataset.st) F.stages[+el.dataset.st][el.dataset.f] = el.value; };
    $('#fSave').onclick = () => { const i = S.fiches.findIndex(f => f.id === F.id); if (i >= 0) S.fiches[i] = structuredClone(F); else S.fiches.unshift(structuredClone(F)); save('fiches'); toast(t('saved')); V.fiche(F.id); };
    $('#fPrint').onclick = () => printHTML(ficheHTML(F));
    $('#fDocx').onclick = () => ficheDocx(F);
    $$('[data-del]').forEach(b => b.onclick = () => { if (confirm(t('confirmDel'))) { S.fiches = S.fiches.filter(f => f.id !== b.dataset.del); save('fiches'); V.fiche(); } });
  };
  function ficheHTML(f) {
    const s = PROG.seq(f.seq), y = PROG.year(f.year);
    return officialHeader(`<div>${t('teacher')}: ${esc(S.settings.teacher || '........')}</div><div>المستوى: ${esc(y.ar)} ${f.cls ? '– ' + esc(f.cls) : ''}</div>`) +
      `<h2>مذكرة رقم ...... – ${esc(f.lesson)}</h2>
      <table><tr><th style="width:24%">الميدان</th><td>${esc(PROG.DOMAINS[s.domain].ar)}</td><th>المدة</th><td>${esc(f.duration)}</td></tr>
      <tr><th>المقطع التعلمي</th><td colspan="3">${esc(s.ar)}</td></tr><tr><th>المورد المعرفي</th><td colspan="3">${esc(f.lesson)}</td></tr>
      <tr><th>الكفاءة الختامية</th><td colspan="3">${rich(f.finalComp)}</td></tr><tr><th>الكفاءة المستهدفة</th><td colspan="3">${rich(f.comp)}</td></tr>
      <tr><th>مركبات الكفاءة</th><td colspan="3">${f.components.map(esc).join('<br>')}</td></tr><tr><th>مؤشرات الكفاءة</th><td colspan="3">${rich(f.indicators)}</td></tr>
      <tr><th>الوسائل</th><td colspan="3">${esc(f.means)}</td></tr><tr><th>التاريخ</th><td colspan="3">${esc(f.date)}</td></tr></table>
      <p class="exh">الوضعية الانطلاقية / المشكلة:</p><p>${rich(f.situation)}</p>
      <table><tr><th style="width:20%">المراحل</th><th style="width:9%">المدة</th><th>سير الحصة (الأنشطة)</th><th style="width:22%">مؤشرات الكفاءة / التقويم</th></tr>
      ${f.stages.map(st => `<tr><td><b>${esc(st.name)}</b></td><td>${esc(st.dur)}</td><td>${rich(st.act)}</td><td>${rich(st.ind)}</td></tr>`).join('')}</table>
      ${f.solution ? `<p class="exh">حل نشاط التقويم:</p><p>${rich(f.solution)}</p>` : ''}<p class="muted" style="margin-top:1rem">ملاحظات ونقد ذاتي: ............................................................</p>`;
  }
  const tex2txt = s => String(s || '').replace(/\$([^$]*)\$/g, (_, m) => m.replace(/\\dfrac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)').replace(/\\sqrt\{([^}]*)\}/g, '√($1)').replace(/\\times/g, '×').replace(/\\div/g, '÷').replace(/\{,\}/g, ',').replace(/\^\{?2\}?/g, '²').replace(/\^\{?3\}?/g, '³').replace(/\\circ/g, '°').replace(/\\widehat\{([^}]*)\}/g, '∠$1').replace(/\\overrightarrow\{([^}]*)\}/g, '→$1').replace(/\\(geq|leq|parallel|approx|pi|Delta|%|,)/g, m2 => ({ '\\geq': '≥', '\\leq': '≤', '\\parallel': '∥', '\\approx': '≈', '\\pi': 'π', '\\Delta': 'Δ', '\\%': '%', '\\,': ' ' }[m2])).replace(/\\[a-z]+/gi, '').replace(/[{}]/g, '')).replace(/<br>/g, '\n');
  function ficheDocx(f) {
    if (!window.docx) { loadScript('vendor/docx/docx.umd.js').then(() => ficheDocx(f)); return; }
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } = window.docx;
    const P = (txt, bold) => String(txt).split('\n').map(l => new Paragraph({ bidirectional: true, alignment: AlignmentType.RIGHT, children: [new TextRun({ text: tex2txt(l), bold, rightToLeft: true, font: 'Arial', size: 24 })] }));
    const cell = (txt, bold, w) => new TableCell({ children: P(txt, bold), width: w ? { size: w, type: WidthType.PERCENTAGE } : undefined });
    const s = PROG.seq(f.seq), y = PROG.year(f.year), st = S.settings;
    const info = [['المستوى', y.ar + (f.cls ? ' – ' + f.cls : '')], ['الميدان', PROG.DOMAINS[s.domain].ar], ['المقطع التعلمي', s.ar], ['المورد المعرفي', f.lesson], ['المدة', f.duration], ['الكفاءة الختامية', f.finalComp], ['الكفاءة المستهدفة', f.comp], ['مركبات الكفاءة', f.components.join('\n')], ['مؤشرات الكفاءة', f.indicators], ['الوسائل', f.means], ['التاريخ', f.date]];
    const doc = new Document({ sections: [{ properties: { page: { margin: { top: 700, bottom: 700, left: 700, right: 700 } } }, children: [
      ...P('الجمهورية الجزائرية الديمقراطية الشعبية – وزارة التربية الوطنية', true),
      ...P(`المتوسطة: ${st.school || '........'}    ${t('teacher')}: ${st.teacher || '........'}    السنة الدراسية: ${st.schoolYear}`),
      ...P(`مذكرة: ${f.lesson}`, true),
      new Table({ visuallyRightToLeft: true, width: { size: 100, type: WidthType.PERCENTAGE }, rows: info.map(([k, v]) => new TableRow({ children: [cell(k, true, 25), cell(v, false, 75)] })) }),
      ...P('الوضعية الانطلاقية / المشكلة:', true), ...P(f.situation || ''),
      new Table({ visuallyRightToLeft: true, width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ tableHeader: true, children: ['المراحل', 'المدة', 'سير الحصة', 'مؤشرات الكفاءة / التقويم'].map(x => cell(x, true)) }), ...f.stages.map(x => new TableRow({ children: [cell(x.name, true, 20), cell(x.dur, false, 9), cell(x.act || '', false, 49), cell(x.ind || '', false, 22)] }))] }),
      ...(f.solution ? [...P('حل نشاط التقويم:', true), ...P(f.solution)] : [])] }] });
    Packer.toBlob(doc).then(b => download(`mudhakkira-${f.year}-${f.date}.docx`, b));
  }
  function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }

  // ---------------- progression ----------------
  V.plan = (yid) => {
    yid = yid || S.settings.lastYear || '1AM'; const y = PROG.year(yid);
    const P = S.plans[yid] || (S.plans[yid] = { cal: CORE.defaultCalendar(2026), weekly: y.weekly, rows: null, notes: {} });
    const c = P.cal;
    view.innerHTML = `<h1>${t('plan')}</h1><div class="bar">${PROG.YEARS.map(x => `<a class="btn ${x.id === yid ? '' : 'sec'}" href="#plan/${x.id}">${x.id}</a>`).join('')}</div>
      <div class="card" id="calf"><h2>${t('calendar')}</h2>
      <div class="row"><label>${t('start')}<input type="date" data-c="start" value="${c.start}"></label><label>${t('end')}<input type="date" data-c="end" value="${c.end}"></label><label>${t('weekly')}<input type="number" min="1" max="10" id="wk" value="${P.weekly}"></label></div>
      <h3>${t('holidays')}</h3>${c.holidays.map((h, i) => `<div class="row"><label>${t('title')}<input data-h="${i}" data-f="ar" value="${esc(h.ar)}"></label><label>${t('from')}<input type="date" data-h="${i}" data-f="from" value="${h.from}"></label><label>${t('to')}<input type="date" data-h="${i}" data-f="to" value="${h.to}"></label></div>`).join('')}
      <h3>${t('termEnds')}</h3><div class="row"><label>1<input type="date" data-t="0" value="${c.terms[0]}"></label><label>2<input type="date" data-t="1" value="${c.terms[1]}"></label></div>
      <p class="muted">${fr() ? 'Valeurs 2026-2027 selon le communiqué du ministère (rentrée 21/09/2026) ; adaptez-les.' : 'القيم الافتراضية لموسم 2026-2027 حسب بلاغ الوزارة (الدخول 21 سبتمبر 2026)؛ يمكن تعديلها.'}</p>
      <div class="bar"><button class="btn" id="mk">${t('makePlan')}</button><button class="btn sec" id="pp">${t('print')}</button><button class="btn sec" id="pcsv">${t('exportCsv')}</button></div></div><div id="pt"></div>`;
    $('#calf').oninput = e => { const el = e.target; if (el.dataset.c) c[el.dataset.c] = el.value; else if (el.dataset.h) c.holidays[+el.dataset.h][el.dataset.f] = el.value; else if (el.dataset.t) c.terms[+el.dataset.t] = el.value; else if (el.id === 'wk') P.weekly = +el.value || 5; save('plans'); };
    const draw = () => { const rows = P.rows; if (!rows) { $('#pt').innerHTML = ''; return; }
      $('#pt').innerHTML = (rows.overflow ? `<p class="warn">${t('overflow')} ${rows.overflow} ${t('hours')}</p>` : '') + `<div class="tbl-wrap"><table><tr><th>${t('week')}</th><th>${t('from')}</th><th>${t('term')}</th><th>${t('content')}</th><th>${t('notes')}</th></tr>${rows.map(r => `<tr class="${r.partial ? 'week-hol' : ''}"><td>${r.n}</td><td>${r.start}${r.partial ? ` <small class="muted">(${r.open}/5)</small>` : ''}</td><td>${r.term}</td><td>${r.items.map(i => `<span class="pill ${i.kind}">${esc(i.kind === 'seq' ? `${i.id.slice(4)}. ${i.ar} (${i.h} سا)` : i.ar)}</span>`).join('')}</td><td><input data-n="${r.n}" value="${esc(P.notes[r.n] || '')}"></td></tr>`).join('')}</table></div>`;
      $$('#pt [data-n]').forEach(i => i.oninput = () => { P.notes[i.dataset.n] = i.value; save('plans'); }); };
    $('#mk').onclick = () => { const rows = CORE.planYear(y.seqs, c, P.weekly); P.rows = rows; P.rows.overflow = rows.overflow; P.overflow = rows.overflow || 0; save('plans'); draw(); };
    if (P.rows) P.rows.overflow = P.overflow; draw();
    $('#pp').onclick = () => { if (!P.rows) $('#mk').click(); printHTML(officialHeader(`<div>${t('teacher')}: ${esc(S.settings.teacher || '........')}</div><div>المستوى: ${esc(y.ar)}</div>`) + `<h2>التدرج السنوي لبناء التعلمات – مادة الرياضيات</h2><table><tr><th>الأسبوع</th><th>بداية الأسبوع</th><th>الفصل</th><th>المحتوى</th><th>ملاحظات</th></tr>${P.rows.map(r => `<tr><td>${r.n}</td><td>${r.start}</td><td>${r.term}</td><td>${r.items.map(i => esc(i.kind === 'seq' ? `م${i.id.slice(4)}: ${i.ar} (${i.h} سا)` : i.ar)).join('<br>')}</td><td>${esc(P.notes[r.n] || '')}</td></tr>`).join('')}</table>`); };
    $('#pcsv').onclick = () => { if (!P.rows) $('#mk').click(); download(`tadarruj-${yid}.csv`, CORE.toCSV([['week', 'start', 'term', 'content', 'notes'], ...P.rows.map(r => [r.n, r.start, r.term, r.items.map(i => i.kind === 'seq' ? `${i.ar} (${i.h}h)` : i.ar).join(' | '), P.notes[r.n] || ''])]), 'text/csv'); };
    S.settings.lastYear = yid; save('settings');
  };

  // ---------------- banque + générateurs ----------------
  let lastGen = [];
  V.bank = (arg) => {
    const f = V.bank.f || (V.bank.f = { year: S.settings.lastYear || '1AM', seq: '', level: '' });
    if (arg && PROG.seq(arg)) { f.seq = arg; f.year = arg.slice(0, 3); }
    const list = BANK.filter(e => e.seq.startsWith(f.year) && (!f.seq || e.seq === f.seq) && (!f.level || e.level === +f.level));
    const gens = Object.entries(CORE.GEN).filter(([, g]) => g.years.includes(f.year));
    view.innerHTML = `<h1>${t('bank')}</h1><div class="card"><div class="row"><label>${t('year')}<select id="by">${yearOpts(f.year)}</select></label><label>${t('seq')}<select id="bs">${seqOpts(f.year, f.seq, true)}</select></label>
      <label>${t('level')}<select id="bl"><option value="">${t('all')}</option>${[1, 2, 3].map(l => `<option value="${l}" ${+f.level === l ? 'selected' : ''}>${t('lv' + l)}</option>`).join('')}</select></label></div></div>
      <div class="card"><h2>${t('generator')}</h2><div class="row"><label>${t('type')}<select id="gt">${gens.map(([k, g]) => `<option value="${k}">${esc(g.ar)}</option>`).join('')}</select></label><label>${t('count')}<input type="number" id="gn" min="1" max="12" value="4"></label><button class="btn" id="gg">${t('generate')}</button></div><div id="gout"></div></div>
      <p class="muted">${list.length} ${fr() ? 'exercices (originaux)' : 'تمرين (أصلي)'}</p>
      ${list.map(e => `<div class="ex"><div class="lvl">${esc(nm(PROG.seq(e.seq)))} · ${t('lv' + e.level)} · ${e.pts} ${t('points')}</div><div>${rich(e.q)}</div><details><summary>${t('showSol')}</summary><div class="sol">${rich(e.a)}</div></details><button class="btn sm sec" data-add="${e.id}">${t('addToTest')}</button></div>`).join('')}`;
    $('#by').onchange = e => { f.year = e.target.value; f.seq = ''; V.bank(); math(view); };
    $('#bs').onchange = e => { f.seq = e.target.value; V.bank(); math(view); };
    $('#bl').onchange = e => { f.level = e.target.value; V.bank(); math(view); };
    $('#gg').onclick = () => { const k = $('#gt').value, n = Math.min(12, Math.max(1, +$('#gn').value || 4)); lastGen = CORE.generate(k, Date.now() % 1e9, n).map(x => ({ ...x, type: k }));
      const o = $('#gout'); o.innerHTML = `<ol>${lastGen.map(g => `<li>${rich(g.q)}<div class="sol muted">${rich(g.a)}</div></li>`).join('')}</ol><button class="btn sm" id="gadd">${t('addToTest')}</button>`; math(o);
      $('#gadd').onclick = () => { const g = CORE.GEN[k]; addToDraft({ q: `${g.ar}:<br>` + lastGen.map((x, i) => `${i + 1}) ${x.q}`).join('<br>'), a: lastGen.map((x, i) => `${i + 1}) ${x.a}`).join('<br>'), pts: Math.min(6, n), kind: 'ex', src: 'gen:' + k }); }; };
    $$('[data-add]').forEach(b => b.onclick = () => { const e = BANK.find(x => x.id === b.dataset.add); addToDraft({ q: e.q, a: e.a, pts: e.pts, kind: e.kind, src: e.id }); });
  };
  function draft() { if (!S.draft) S.draft = { id: uid(), type: 'devoir', year: S.settings.lastYear || '1AM', term: 1, title: '', duration: '1 سا', items: [], points: [] }; return S.draft; }
  function addToDraft(it) { const d = draft(); if (d.type === 'bem' && it.kind === 'integ' && d.items.length >= 4) d.items.splice(4, 0, it); else d.items.push(it); d.points = []; save('draft'); toast(t('added') + ` (${d.items.length})`); }

  // ---------------- devoirs / examens ----------------
  const weights = d => d.type === 'bem' ? d.items.map((it, i) => it.kind === 'integ' ? 8 : 3) : d.items.map(it => it.pts || 3);
  function points(d) { if (d.points && d.points.length === d.items.length) return d.points; if (d.type === 'bem' && d.items.length === 5) return CORE.BEM_POINTS.slice(); return CORE.bareme(weights(d), 20, 0.5); }
  V.test = (arg) => {
    if (arg) { const s = S.tests.find(x => x.id === arg); if (s) S.draft = structuredClone(s); history.replaceState(null, '', '#test'); }
    const d = draft(), pts = points(d), sum = CORE.round(pts.reduce((a, b) => a + (+b || 0), 0), 2);
    view.innerHTML = `<h1>${t('test')}</h1><div class="card" id="tf"><div class="row">
      <label>${t('type')}<select data-k="type">${['devoir', 'exam', 'bem'].map(x => `<option value="${x}" ${d.type === x ? 'selected' : ''}>${t(x)}</option>`).join('')}</select></label>
      <label>${t('year')}<select data-k="year">${yearOpts(d.year)}</select></label><label>${t('term')}<select data-k="term">${[1, 2, 3].map(x => `<option ${+d.term === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
      <label>${t('duration')}<input data-k="duration" value="${esc(d.duration)}"></label><label>${t('title')}<input data-k="title" value="${esc(d.title)}" placeholder="${esc(defaultTitle(d))}"></label></div>
      ${d.type === 'bem' ? `<p class="muted">${fr() ? 'Structure BEM : Partie I = 4 exercices (3 pts chacun), Partie II = situation d’intégration (8 pts), durée 2 h.' : 'هيكلة شهادة التعليم المتوسط: الجزء الأول 4 تمارين (3 نقاط لكل تمرين)، الجزء الثاني وضعية إدماجية (8 نقاط)، المدة ساعتان.'}</p>` : ''}
      <div class="bar"><a class="btn sec" href="#bank">${t('fromBank')} / ${t('fromGen')}</a><button class="btn sec" id="tauto">${t('autoBareme')}</button><button class="btn sec" id="tnew">${t('new')}</button></div></div>
      ${d.items.length ? d.items.map((it, i) => `<div class="ex"><div class="lvl">${partLabel(d, i)} · <label style="display:inline">${t('points')} <input type="number" step="0.25" min="0" data-p="${i}" value="${pts[i]}" style="width:5.5rem"></label>
        <button class="btn sm sec" data-mv="${i}:-1">${t('up')}</button><button class="btn sm sec" data-mv="${i}:1">${t('down')}</button><button class="btn sm danger" data-rm="${i}">${t('del')}</button></div><div>${rich(it.q)}</div><details><summary>${t('showSol')}</summary><div class="sol">${rich(it.a)}</div></details></div>`).join('') : `<p class="muted">${t('empty')} – ${t('fromBank')}</p>`}
      <p><b>${t('total')}: <span id="tsum">${sum}</span>/20</b> <span class="warn" id="twarn">${d.items.length && sum !== 20 ? t('sumWarn') : ''}</span></p>
      <div class="bar"><button class="btn" id="tsave">${t('save')}</button><button class="btn sec" id="tprint">${t('print')}</button><button class="btn sec" id="tkey">${t('key')}</button></div>
      <h2>${t('myTests')}</h2>${S.tests.length ? `<table>${S.tests.map(x => `<tr><td>${esc(x.title || defaultTitle(x))}</td><td>${x.year}</td><td>${x.items.length}</td><td><a class="btn sm sec" href="#test/${x.id}">${t('open')}</a> <button class="btn sm danger" data-dt="${x.id}">${t('del')}</button></td></tr>`).join('')}</table>` : `<p class="muted">${t('empty')}</p>`}`;
    $('#tf').onchange = e => { const k = e.target.dataset.k; if (!k || k === 'title' || k === 'duration') return; d[k] = e.target.value; if (k === 'type') { d.duration = d.type === 'devoir' ? '1 سا' : '2 سا'; if (d.type === 'bem') d.year = '4AM'; } d.points = []; save('draft'); V.test(); math(view); };
    $('#tf').oninput = e => { const k = e.target.dataset.k; if (k === 'title' || k === 'duration') { d[k] = e.target.value; save('draft'); } };
    $$('[data-p]').forEach(inp => inp.oninput = () => { d.points = pts.slice(); $$('[data-p]').forEach(x => d.points[+x.dataset.p] = +x.value || 0); const s = CORE.round(d.points.reduce((a, b) => a + b, 0), 2); $('#tsum').textContent = s; $('#twarn').textContent = s !== 20 ? t('sumWarn') : ''; save('draft'); });
    $('#tauto').onclick = () => { d.points = []; save('draft'); V.test(); math(view); };
    $('#tnew').onclick = () => { S.draft = null; draft(); save('draft'); V.test(); };
    $$('[data-rm]').forEach(b => b.onclick = () => { d.items.splice(+b.dataset.rm, 1); d.points = []; save('draft'); V.test(); math(view); });
    $$('[data-mv]').forEach(b => b.onclick = () => { const [i, s] = b.dataset.mv.split(':').map(Number), j = i + s; if (j < 0 || j >= d.items.length) return; [d.items[i], d.items[j]] = [d.items[j], d.items[i]]; d.points = []; save('draft'); V.test(); math(view); });
    $('#tsave').onclick = () => { const i = S.tests.findIndex(x => x.id === d.id); const c = structuredClone({ ...d, points: points(d) }); if (i >= 0) S.tests[i] = c; else S.tests.unshift(c); save('tests'); toast(t('saved')); V.test(); math(view); };
    $('#tprint').onclick = () => printHTML(testHTML(d, false));
    $('#tkey').onclick = () => printHTML(testHTML(d, true));
    $$('[data-dt]').forEach(b => b.onclick = () => { if (confirm(t('confirmDel'))) { S.tests = S.tests.filter(x => x.id !== b.dataset.dt); save('tests'); V.test(); } });
  };
  const ORD = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر'];
  function partLabel(d, i) { if (d.type === 'bem') return i < 4 ? `الجزء الأول – التمرين ${ORD[i]}` : 'الجزء الثاني – الوضعية الإدماجية'; return d.items[i].kind === 'integ' && i === d.items.length - 1 ? 'الوضعية الإدماجية' : `التمرين ${ORD[i] || i + 1}`; }
  function defaultTitle(d) { return d.type === 'bem' ? 'موضوع تجريبي على نمط شهادة التعليم المتوسط – مادة الرياضيات' : d.type === 'exam' ? `اختبار الفصل ${['', 'الأول', 'الثاني', 'الثالث'][d.term]} في مادة الرياضيات` : `فرض الفصل ${['', 'الأول', 'الثاني', 'الثالث'][d.term]} في مادة الرياضيات`; }
  function testHTML(d, key) {
    const y = PROG.year(d.year), pts = points(d);
    let html = officialHeader(`<div>المستوى: ${esc(y.ar)}</div><div>المدة: ${esc(d.duration)}</div>`) + `<h2>${esc(d.title || defaultTitle(d))}${key ? ' – التصحيح النموذجي وسلم التنقيط' : ''}</h2>`;
    d.items.forEach((it, i) => { if (d.type === 'bem' && (i === 0 || i === 4)) html += `<p class="exh" style="text-align:center">${i === 0 ? 'الجزء الأول (12 نقطة)' : 'الجزء الثاني (08 نقاط)'}</p>`;
      html += `<div class="exblock"><p class="exh">${partLabel(d, i).replace(/^الجزء [^–]+– /, '')}: (${String(pts[i]).replace('.', ',')} ن)</p><div>${rich(key ? it.a : it.q)}</div></div>`; });
    if (key) html += `<table style="margin-top:1rem"><tr><th>التمرين</th>${d.items.map((_, i) => `<th>${i + 1}</th>`).join('')}<th>المجموع</th></tr><tr><td>النقاط</td>${pts.map(p => `<td>${p}</td>`).join('')}<td>${CORE.round(pts.reduce((a, b) => a + b, 0), 2)}</td></tr></table>`;
    else html += `<p style="text-align:center;margin-top:1.2rem">بالتوفيق</p>`;
    return html;
  }

  // ---------------- gradebook ----------------
  V.grades = () => {
    const st = S.settings; let c = S.classes.find(x => x.id === S.curClass) || S.classes[0];
    const T = S.curTerm;
    view.innerHTML = `<h1>${t('grades')}</h1>
      <div class="card"><div class="row"><label>${t('classes')}<select id="gc">${S.classes.map(x => `<option value="${x.id}" ${c && x.id === c.id ? 'selected' : ''}>${esc(x.name)} (${x.year})</option>`).join('') || `<option>${t('empty')}</option>`}</select></label>
      <label>${t('className')}<input id="gcn" placeholder="1م1"></label><label>${t('year')}<select id="gcy">${yearOpts('1AM')}</select></label><button class="btn" id="gca">${t('add')}</button>${c ? `<button class="btn danger" id="gcd">${t('del')}</button>` : ''}</div>
      <div class="row"><label>${t('formula')}<select id="gf">${Object.entries(CORE.FORMULAS).map(([k, f]) => `<option value="${k}" ${st.formula === k ? 'selected' : ''}>${esc(nm(f))}</option>`).join('')}</select></label>
      <label>${t('termCoefs')}<input id="gtc" value="${st.termCoefs.join(' ; ')}"></label></div>
      <p class="muted">${fr() ? 'CC = moyenne (évaluation continue, devoir). Les deux formules circulent (circulaires différentes selon les années) : choisissez celle de votre établissement.' : 'معدل المراقبة المستمرة = (التقويم المستمر + الفرض) ÷ 2. اختر الصيغة المعتمدة في مؤسستك حسب آخر منشور وزاري.'}</p></div>
      ${c ? `<div class="card"><h2>${t('students')} – ${esc(c.name)}</h2><label>${t('pasteCsv')}<textarea id="gcsv" placeholder="بن علي;محمد&#10;سعيدي;أمينة"></textarea></label>
      <div class="bar"><input type="file" id="gfile" accept=".csv,.txt" style="max-width:260px"><button class="btn sec" id="gimp">${t('importCsv')}</button><button class="btn sec" id="gexp">${t('exportCsv')}</button><button class="btn sec" id="gpr">${t('print')}</button></div></div>
      <div class="bar">${[1, 2, 3].map(x => `<button class="btn ${x === T ? '' : 'sec'}" data-term="${x}">${t('term')} ${x}</button>`).join('')}<button class="btn ${T === 0 ? '' : 'sec'}" data-term="0">${t('annual')}</button></div>
      <div class="tbl-wrap" id="gtab"></div><div id="gstat" class="card"></div>` : ''}`;
    $('#gc').onchange = e => { S.curClass = e.target.value; V.grades(); };
    $('#gca').onclick = () => { const n = $('#gcn').value.trim(); if (!n) return; const x = { id: uid(), name: n, year: $('#gcy').value, students: [], g: {} }; S.classes.push(x); S.curClass = x.id; save('classes'); V.grades(); };
    $('#gf').onchange = e => { st.formula = e.target.value; save('settings'); V.grades(); };
    $('#gtc').onchange = e => { const v = e.target.value.split(/[;,\s]+/).map(Number).filter(n => n >= 0); if (v.length === 3) { st.termCoefs = v; save('settings'); V.grades(); } };
    if (!c) return;
    $('#gcd').onclick = () => { if (confirm(t('confirmDel'))) { S.classes = S.classes.filter(x => x.id !== c.id); S.curClass = null; save('classes'); V.grades(); } };
    $('#gimp').onclick = async () => { const fl = $('#gfile').files[0]; const txt = fl ? await fl.text() : $('#gcsv').value; const list = CORE.studentsFromCSV(txt); list.forEach(s => c.students.push({ id: uid(), ...s })); save('classes'); toast(`+${list.length}`); V.grades(); };
    $$('[data-term]').forEach(b => b.onclick = () => { S.curTerm = +b.dataset.term; V.grades(); });
    const g = (sid, term) => ((c.g[sid] ||= {})[term] ||= { eval: '', devoir: '', exam: '', app: '' });
    const avgOf = (sid, term) => CORE.termAverage(g(sid, term), st.formula);
    const annual = sid => CORE.annualAverage([1, 2, 3].map(x => avgOf(sid, x)), st.termCoefs);
    const draw = () => {
      if (T === 0) { const an = c.students.map(s => annual(s.id)), rk = CORE.ranks(an);
        $('#gtab').innerHTML = `<table class="grades"><tr><th>#</th><th>${t('last')} ${t('first')}</th><th>${t('term')} 1</th><th>${t('term')} 2</th><th>${t('term')} 3</th><th>${t('annual')}</th><th>${t('rank')}</th><th>${t('appr')}</th></tr>${c.students.map((s, i) => `<tr><td>${i + 1}</td><td class="name">${esc(s.last)} ${esc(s.first)}</td>${[1, 2, 3].map(x => `<td>${avgOf(s.id, x) ?? ''}</td>`).join('')}<td><b>${an[i] ?? ''}</b></td><td>${rk[i] ?? ''}</td><td>${CORE.appreciation(an[i], undefined, L())}</td></tr>`).join('')}</table>`;
        statBox(an); return; }
      const av = c.students.map(s => avgOf(s.id, T)), rk = CORE.ranks(av);
      $('#gtab').innerHTML = `<table class="grades"><tr><th>#</th><th>${t('last')} ${t('first')}</th><th>${t('eval')}</th><th>${t('devoir')}</th><th>${t('exam2')}</th><th>${t('avg')}</th><th>${t('rank')}</th><th>${t('appr')}</th><th></th></tr>${c.students.map((s, i) => { const x = g(s.id, T); return `<tr data-sid="${s.id}"><td>${i + 1}</td><td class="name">${esc(s.last)} ${esc(s.first)}</td>${['eval', 'devoir', 'exam'].map(f => `<td><input type="number" inputmode="decimal" min="0" max="20" step="0.25" data-f="${f}" value="${esc(x[f])}" aria-label="${t(f === 'exam' ? 'exam2' : f)}"></td>`).join('')}<td class="av"><b>${av[i] ?? ''}</b></td><td>${rk[i] ?? ''}</td><td><input data-f="app" value="${esc(x.app)}" placeholder="${esc(CORE.appreciation(av[i], undefined, L()))}" style="min-width:9rem"></td><td><button class="btn sm danger" data-rs="${s.id}" aria-label="${t('del')}">×</button></td></tr>`; }).join('')}</table>`;
      $$('#gtab input').forEach(inp => inp.onchange = () => { const sid = inp.closest('tr').dataset.sid; let v = inp.value; if (inp.dataset.f !== 'app' && v !== '') { v = Math.min(20, Math.max(0, +v)); inp.value = v; } g(sid, T)[inp.dataset.f] = v; save('classes'); refresh(); });
      $$('[data-rs]').forEach(b => b.onclick = () => { if (confirm(t('confirmDel'))) { c.students = c.students.filter(s => s.id !== b.dataset.rs); delete c.g[b.dataset.rs]; save('classes'); draw(); } });
      statBox(av);
    };
    const refresh = () => { // mise à jour en place (garde le focus pendant la saisie)
      const av = c.students.map(s => avgOf(s.id, T)), rk = CORE.ranks(av);
      $$('#gtab tr[data-sid]').forEach((tr, i) => { tr.querySelector('.av').innerHTML = `<b>${av[i] ?? ''}</b>`; tr.children[6].textContent = rk[i] ?? ''; tr.querySelector('[data-f=app]').placeholder = CORE.appreciation(av[i], undefined, L()); });
      statBox(av);
    };
    const statBox = av => { const s = CORE.stats(av); $('#gstat').innerHTML = `<h3>${t('classStats')}</h3>` + (s ? `<p>${fr() ? 'Élèves notés' : 'عدد المقيّمين'}: ${s.n} · ${t('avg')}: <b>${s.mean}</b> · min ${s.min} · max ${s.max} · ${t('passRate')} (≥10): <b>${s.pass}%</b></p>` : `<p class="muted">${t('empty')}</p>`); };
    draw();
    const rowsFor = () => T === 0 ? [['#', 'nom', 'prenom', 'T1', 'T2', 'T3', 'annuelle', 'rang', 'appreciation'], ...c.students.map((s, i) => { const an = c.students.map(x => annual(x.id)), rk = CORE.ranks(an); return [i + 1, s.last, s.first, avgOf(s.id, 1), avgOf(s.id, 2), avgOf(s.id, 3), an[i], rk[i], CORE.appreciation(an[i], undefined, L())]; })]
      : [['#', 'nom', 'prenom', 'evaluation', 'devoir', 'examen', 'moyenne', 'rang', 'appreciation'], ...c.students.map((s, i) => { const av = c.students.map(x => avgOf(x.id, T)), rk = CORE.ranks(av), x = g(s.id, T); return [i + 1, s.last, s.first, x.eval, x.devoir, x.exam, av[i], rk[i], x.app || CORE.appreciation(av[i], undefined, L())]; })];
    $('#gexp').onclick = () => download(`notes-${c.name}-${T || 'annuel'}.csv`, CORE.toCSV(rowsFor()), 'text/csv');
    $('#gpr').onclick = () => { const r = rowsFor(); const hdr = T === 0 ? ['الرقم', 'اللقب', 'الاسم', 'ف1', 'ف2', 'ف3', 'المعدل السنوي', 'الرتبة', 'الملاحظة'] : ['الرقم', 'اللقب', 'الاسم', 'التقويم', 'الفرض', 'الاختبار', 'المعدل', 'الرتبة', 'الملاحظة'];
      printHTML(officialHeader(`<div>${t('teacher')}: ${esc(st.teacher || '........')}</div><div>القسم: ${esc(c.name)} – ${T ? 'الفصل ' + T : 'سنوي'}</div>`) + `<h2>كشف نقاط مادة الرياضيات</h2><table><tr>${hdr.map(h => `<th>${h}</th>`).join('')}</tr>${r.slice(1).map(x => `<tr>${x.map(v => `<td>${esc(v ?? '')}</td>`).join('')}</tr>`).join('')}</table>`); };
  };

  // ---------------- cahier de textes ----------------
  V.journal = () => {
    const cls = [...new Set([...S.classes.map(c => c.name), ...S.journal.map(j => j.cls)])].filter(Boolean);
    const flt = V.journal.flt || '';
    const list = S.journal.filter(j => !flt || j.cls === flt).sort((a, b) => (b.date + b.hour).localeCompare(a.date + a.hour));
    view.innerHTML = `<h1>${t('journal')}</h1><div class="card" id="jf"><div class="row"><label>${t('date')}<input type="date" id="jd" value="${new Date().toISOString().slice(0, 10)}"></label><label>${fr() ? 'Heure' : 'الساعة'}<input id="jh" placeholder="08:00-09:00"></label>
      <label>${t('cls')}<input id="jc" list="jcl"><datalist id="jcl">${cls.map(c => `<option value="${esc(c)}">`).join('')}</datalist></label></div>
      <div class="row"><label>${t('seq')}<select id="js">${PROG.YEARS.map(y => `<optgroup label="${y.id}">${y.seqs.map((s, i) => `<option value="${s.id}">${y.id} م${i + 1}: ${esc(s.ar)}</option>`).join('')}</optgroup>`).join('')}</select></label></div>
      <label>${t('content')}<textarea id="jt"></textarea></label><label>${t('homework')}<input id="jw"></label><label>${t('notes')}<input id="jn"></label>
      <div class="bar"><button class="btn" id="ja">${t('add')}</button></div></div>
      <div class="bar"><label>${t('cls')}<select id="jflt"><option value="">${t('all')}</option>${cls.map(c => `<option ${c === flt ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label><button class="btn sec" id="jp">${t('print')}</button><button class="btn sec" id="jx">${t('exportCsv')}</button></div>
      ${list.length ? `<div class="tbl-wrap"><table><tr><th>${t('date')}</th><th>${t('cls')}</th><th>${t('seq')}</th><th>${t('content')}</th><th>${t('homework')}</th><th></th></tr>${list.map(j => `<tr><td>${esc(j.date)} ${esc(j.hour)}</td><td>${esc(j.cls)}</td><td>${esc(PROG.seq(j.seq)?.ar || '')}</td><td>${rich(j.content)}</td><td>${esc(j.homework)}</td><td><button class="btn sm danger" data-dj="${j.id}">${t('del')}</button></td></tr>`).join('')}</table></div>` : `<p class="muted">${t('empty')}</p>`}`;
    $('#ja').onclick = () => { const j = { id: uid(), date: $('#jd').value, hour: $('#jh').value, cls: $('#jc').value.trim(), seq: $('#js').value, content: $('#jt').value, homework: $('#jw').value, notes: $('#jn').value }; if (!j.content.trim()) { $('#jt').focus(); return; } S.journal.push(j); save('journal'); toast(t('saved')); V.journal(); math(view); };
    $('#jflt').onchange = e => { V.journal.flt = e.target.value; V.journal(); math(view); };
    $$('[data-dj]').forEach(b => b.onclick = () => { if (confirm(t('confirmDel'))) { S.journal = S.journal.filter(j => j.id !== b.dataset.dj); save('journal'); V.journal(); } });
    $('#jp').onclick = () => printHTML(officialHeader(`<div>${t('teacher')}: ${esc(S.settings.teacher || '........')}</div><div>القسم: ${esc(flt || 'كل الأقسام')}</div>`) + `<h2>الكراس اليومي / دفتر النصوص – مادة الرياضيات</h2><table><tr><th>التاريخ</th><th>القسم</th><th>المقطع</th><th>المحتوى</th><th>الواجب</th><th>ملاحظات</th></tr>${list.slice().reverse().map(j => `<tr><td>${esc(j.date)} ${esc(j.hour)}</td><td>${esc(j.cls)}</td><td>${esc(PROG.seq(j.seq)?.ar || '')}</td><td>${rich(j.content)}</td><td>${esc(j.homework)}</td><td>${esc(j.notes)}</td></tr>`).join('')}</table>`);
    $('#jx').onclick = () => download('cahier-de-textes.csv', CORE.toCSV([['date', 'heure', 'classe', 'sequence', 'contenu', 'devoir', 'remarques'], ...list.map(j => [j.date, j.hour, j.cls, PROG.seq(j.seq)?.ar || '', j.content, j.homework, j.notes])]), 'text/csv');
  };

  // ---------------- réglages ----------------
  V.settings = () => {
    const st = S.settings;
    view.innerHTML = `<h1>${t('settings')}</h1><div class="card" id="sf"><div class="row">${['teacher', 'school', 'wilaya', 'schoolYear'].map(k => `<label>${t(k)}<input data-k="${k}" value="${esc(st[k])}"></label>`).join('')}</div></div>
      <div class="card"><p>${t('privacy')}</p><div class="bar"><button class="btn" id="sb">${t('backup')}</button><label class="btn sec" style="color:var(--c)">${t('restore')}<input type="file" id="sr" accept=".json,application/json" hidden></label><button class="btn danger" id="sw">${t('wipe')}</button></div></div>
      <div class="card"><h2>${fr() ? 'À propos' : 'حول التطبيق'}</h2><p>${fr() ? 'Logiciel libre (licence MIT). Programme reconstitué à partir de sources publiques ; exercices originaux. Code source :' : 'برنامج حر (رخصة MIT). المنهاج معاد بناؤه من مصادر عامة، والتمارين أصلية. الشفرة المصدرية:'} <a href="https://github.com/salimadour31-boop/ostad-riyadiyat" rel="noopener">GitHub</a></p></div>`;
    $('#sf').oninput = e => { st[e.target.dataset.k] = e.target.value; save('settings'); };
    $('#sb').onclick = () => { const o = { app: 'ostad-riyadiyat', version: 1, exported: new Date().toISOString() }; KEYS.forEach(k => o[k] = S[k]); download(`ostad-riyadiyat-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(o, null, 1), 'application/json'); };
    $('#sr').onchange = async e => { try { const o = JSON.parse(await e.target.files[0].text()); if (o.app !== 'ostad-riyadiyat') throw new Error('format'); for (const k of KEYS) if (k in o) { S[k] = o[k]; await DB.set(k, o[k]); } toast(t('restored')); I18N.set(S.settings.lang); route(); } catch (err) { alert('JSON ✗ ' + err.message); } };
    $('#sw').onclick = async () => { if (confirm(t('confirmDel'))) { await DB.clear(); location.reload(); } };
  };

  // ---------------- démarrage ----------------
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; const b = $('#installBtn'); if (b) { b.hidden = false; b.onclick = () => { deferredPrompt.prompt(); deferredPrompt = null; b.hidden = true; }; } });
  $('#langBtn').onclick = () => { S.settings.lang = fr() ? 'ar' : 'fr'; I18N.set(S.settings.lang); save('settings'); route(); };
  window.addEventListener('hashchange', () => { route(); view.focus({ preventScroll: true }); window.scrollTo(0, 0); });
  window.addEventListener('afterprint', () => { $('#printArea').innerHTML = ''; });
  (async () => {
    try { const all = await DB.all(); for (const k of KEYS) if (all[k] !== undefined) S[k] = k === 'settings' ? { ...S.settings, ...all[k] } : all[k]; } catch (e) { console.warn('IndexedDB', e); }
    I18N.set(S.settings.lang); route();
    if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(e => console.warn(e));
  })();
  window.__APP = { S, testHTML, ficheHTML, points };
})();
