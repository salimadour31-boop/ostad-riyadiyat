// Tests navigateur (Chrome headless) : node tests/e2e.test.js [url]
// Prérequis : npm i playwright (non versionné) ; Chrome installé.
const { chromium, devices } = require('playwright');
const URL0 = process.argv[2] || 'http://localhost:8765/';
const assert = require('assert');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  let fails = 0; const ok = async (name, fn) => { try { await fn(); console.log('✓', name); } catch (e) { fails++; console.log('✗', name, '\n   ', e.message.slice(0,600)); } };
  for (const [label, opts] of [['desktop', { viewport: { width: 1280, height: 860 } }], ['mobile', { ...devices['Pixel 7'] }]]) {
    console.log(`\n== ${label} ==`);
    const ctx = await browser.newContext({ ...opts, acceptDownloads: true, locale: 'ar-DZ' });
    const page = await ctx.newPage(); const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); page.on('pageerror', e => errors.push(e.message));
    await page.goto(URL0, { waitUntil: 'networkidle' });
    await ok('RTL arabe par défaut', async () => { assert.strictEqual(await page.getAttribute('html', 'dir'), 'rtl'); assert.strictEqual(await page.getAttribute('html', 'lang'), 'ar'); });
    await ok('pas de débordement horizontal', async () => { for (const r of ['home', 'prog', 'fiche', 'plan', 'bank', 'test', 'grades', 'journal', 'settings']) { await page.goto(URL0 + '#' + r); await page.waitForTimeout(150); const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); assert.ok(ov <= 1, r + ' overflow ' + ov); } });
    await ok('programme : 4 niveaux, KaTeX rendu dans la banque', async () => { await page.goto(URL0 + '#prog/4AM'); assert.ok((await page.locator('details').count()) >= 7); await page.goto(URL0 + '#bank'); await page.waitForTimeout(200); assert.ok((await page.locator('.katex').count()) > 5); assert.strictEqual(await page.locator('.katex-error').count(), 0); });
    await ok('générateur + sujet BEM (barème 20)', async () => {
      await page.goto(URL0 + '#test'); await page.selectOption('[data-k=type]', 'bem'); await page.waitForTimeout(100);
      await page.goto(URL0 + '#bank'); await page.selectOption('#by', '4AM'); for (let i = 0; i < 4; i++) await page.locator('[data-add]').nth(i).click();
      await page.selectOption('#bs', '4AM-5'); await page.locator('.ex:has-text("وضعية") [data-add], .ex [data-add]').last().click();
      await page.click('#gg'); await page.waitForSelector('#gout li'); assert.ok(await page.locator('#gout .katex').count() > 0);
      await page.goto(URL0 + '#test'); await page.waitForTimeout(200);
      assert.strictEqual(await page.textContent('#tsum'), '20'); assert.ok((await page.locator('.ex').count()) === 5);
      await page.click('#tsave'); await page.waitForTimeout(300);
      await page.click('#tprint'); await page.waitForTimeout(200); await page.emulateMedia({ media: 'print' });
      assert.ok(await page.isVisible('#printArea .sheet')); assert.ok(!(await page.isVisible('#view'))); assert.ok(await page.locator('#printArea .katex').count() > 0);
      assert.ok((await page.textContent('#printArea')).includes('الجزء الثاني')); await page.emulateMedia({ media: 'screen' });
    });
    await ok('fiche pédagogique : préremplie, impression, DOCX', async () => {
      await page.goto(URL0 + '#fiche/new:3AM-6:1'); await page.waitForTimeout(200);
      assert.ok((await page.inputValue('[data-k=comp]')).includes('فيثاغورس'));
      await page.click('#fSave'); await page.click('#fPrint'); await page.waitForTimeout(100); const txt = await page.textContent('#printArea');
      ['الكفاءة الختامية', 'مركبات الكفاءة', 'مؤشرات الكفاءة', 'الوضعية الانطلاقية', 'التهيئة', 'تقويم ختامي'].forEach(k => assert.ok(txt.includes(k), k));
      const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#fDocx')]); const p = await dl.path(); const buf = require('fs').readFileSync(p); assert.strictEqual(buf.slice(0, 2).toString(), 'PK'); assert.ok(buf.length > 5000);
    });
    await ok('progression 2026-2027', async () => { await page.goto(URL0 + '#plan/1AM'); await page.click('#mk'); await page.waitForSelector('#pt table'); const rows = await page.locator('#pt tr').count(); assert.ok(rows > 30, rows); assert.ok((await page.locator('.pill.exam').count()) === 3); });
    await ok('carnet de notes : CSV, moyennes, rang, export', async () => {
      await page.goto(URL0 + '#grades'); await page.fill('#gcn', '4م1'); await page.selectOption('#gcy', '4AM'); await page.click('#gca');
      await page.fill('#gcsv', 'اللقب;الاسم\nبن علي;محمد\nسعيدي;أمينة\nMansouri;Yacine'); await page.click('#gimp'); await page.waitForTimeout(200);
      assert.strictEqual(await page.locator('#gtab tr[data-sid]').count(), 3);
      const vals = [[14, 10, 8], [16, 18, 17], [9, 7, 11]];
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const inp = page.locator(`#gtab tr[data-sid] >> nth=${i}`).locator('input[type=number]').nth(j); await inp.fill(String(vals[i][j])); await inp.dispatchEvent('change'); await page.waitForTimeout(40); }
      const av = await page.locator('#gtab td.av').allTextContents(); assert.deepStrictEqual(av, ['9.6', '17', '9.8']);
      assert.ok((await page.textContent('#gstat')).includes('33.3'));
      const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#gexp')]); const csv = require('fs').readFileSync(await dl.path(), 'utf8'); assert.ok(csv.includes('9.8') && csv.includes('سعيدي'));
    });
    await ok('cahier de textes', async () => { await page.goto(URL0 + '#journal'); await page.fill('#jc', '4م1'); await page.fill('#jt', 'خاصية فيثاغورس $a^2+b^2=c^2$'); await page.click('#ja'); await page.waitForTimeout(200); assert.ok((await page.locator('table .katex').count()) > 0); });
    await ok('sauvegarde JSON + persistance IndexedDB après rechargement', async () => {
      await page.goto(URL0 + '#settings'); const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#sb')]); const o = JSON.parse(require('fs').readFileSync(await dl.path(), 'utf8')); assert.strictEqual(o.app, 'ostad-riyadiyat'); assert.strictEqual(o.classes[0].students.length, 3); assert.ok(o.fiches.length >= 1 && o.tests.length >= 1 && o.journal.length >= 1);
      await page.reload({ waitUntil: 'networkidle' }); await page.goto(URL0 + '#grades'); await page.waitForTimeout(300); assert.strictEqual(await page.locator('#gtab tr[data-sid]').count(), 3);
    });
    await ok('français (LTR)', async () => { await page.click('#langBtn'); assert.strictEqual(await page.getAttribute('html', 'dir'), 'ltr'); assert.ok((await page.textContent('#nav')).includes('Programme')); await page.click('#langBtn'); assert.strictEqual(await page.getAttribute('html', 'dir'), 'rtl'); });
    await ok('hors ligne : rechargement et navigation', async () => { await page.evaluate(() => navigator.serviceWorker.ready); await page.reload({ waitUntil: 'networkidle' }); await ctx.setOffline(true); await page.reload(); await page.waitForSelector('#nav a'); await page.goto(URL0 + '#bank'); await page.waitForTimeout(300); assert.ok(await page.locator('.katex').count() > 0); await page.goto(URL0 + '#fiche'); const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#fDocx')]); assert.ok(dl); await ctx.setOffline(false); });
    await ok('aucune erreur console', async () => assert.deepStrictEqual(errors, []));
    if (label === 'mobile') { await page.goto(URL0 + '#grades'); await page.screenshot({ path: '/tmp/ostad-mobile.png' }); await page.goto(URL0 + '#test'); await page.click('#tprint'); await page.emulateMedia({ media: 'print' }); await page.pdf?.({ path: '/tmp/ostad-test.pdf' }).catch(() => {}); }
    else { await page.goto(URL0 + '#prog/3AM'); await page.screenshot({ path: '/tmp/ostad-desktop.png' }); }
    await ctx.close();
  }
  // Installabilité : profil persistant (un contexte incognito est toujours refusé par Chrome)
  await ok('installabilité (Chrome : 0 erreur)', async () => { const dir = require('fs').mkdtempSync('/tmp/ostad-prof-'); const pc = await chromium.launchPersistentContext(dir, { executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'] }); const page = pc.pages()[0] || await pc.newPage(); await page.goto(URL0, { waitUntil: 'networkidle' }); await page.evaluate(() => navigator.serviceWorker.ready); await page.reload({ waitUntil: 'networkidle' }); const cdp = await pc.newCDPSession(page); const r = await cdp.send('Page.getInstallabilityErrors'); const m = await cdp.send('Page.getAppManifest'); await pc.close(); assert.deepStrictEqual(r.installabilityErrors, []); assert.deepStrictEqual(m.errors, []); });
  // PDF A4 (headless) d'un sujet
  const ctx = await browser.newContext(); const page = await ctx.newPage(); await page.goto(URL0); await page.evaluate(() => { const A = window.__APP; A.S.draft = { id: 'x', type: 'bem', year: '4AM', term: 3, title: '', duration: '2 سا', items: window.BANK.filter(e => e.seq.startsWith('4AM')).slice(0, 4).concat(window.BANK.filter(e => e.kind === 'integ' && e.seq.startsWith('4AM')).slice(0, 1)), points: [] }; document.getElementById('printArea').innerHTML = '<div class="sheet" dir="rtl">' + A.testHTML(A.S.draft, false) + '</div>'; renderMathInElement(document.getElementById('printArea'), { delimiters: [{ left: '$', right: '$', display: false }] }); });
  await page.emulateMedia({ media: 'print' }); await page.pdf({ path: '/tmp/ostad-bem.pdf', format: 'A4' }); console.log('\nPDF A4 : /tmp/ostad-bem.pdf');
  await browser.close(); console.log(fails ? `\n${fails} échec(s)` : '\nTous les tests navigateur OK'); process.exit(fails ? 1 : 0);
})();
