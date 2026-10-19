/* Installation : bouton « تثبيت / Installer », beforeinstallprompt, instructions par plateforme, détection des navigateurs intégrés. MIT. */
(function (root) {
  const APP_URL = 'https://salimadour31-boop.github.io/ostad-riyadiyat/';
  const RELEASE = 'https://github.com/salimadour31-boop/ostad-riyadiyat/releases/latest';
  let deferred = null; const subs = [];
  function detect(ua = navigator.userAgent, nav = navigator) {
    const ios = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && (nav.maxTouchPoints || 0) > 1);
    const android = /Android/i.test(ua), samsung = /SamsungBrowser/i.test(ua), edge = /Edg\//.test(ua), windows = /Windows/i.test(ua);
    const inapp = /FBAN|FBAV|FB_IAB|Instagram|Messenger|Line\/|MicroMessenger|TikTok|Snapchat|Twitter|; wv\)/i.test(ua);
    const standalone = !!((root.matchMedia && root.matchMedia('(display-mode: standalone)').matches) || nav.standalone);
    const platform = inapp ? 'inapp' : ios ? 'ios' : samsung ? 'samsung' : android ? 'android' : windows ? (edge ? 'edge' : 'windows') : 'desktop';
    return { ios, android, samsung, edge, windows, inapp, standalone, platform };
  }
  const intentLink = (url = APP_URL) => `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url)};end`;
  const STEPS = {
    android: { ar: ['افتح الرابط في Chrome.', 'اضغط زر «تثبيت» أو القائمة ⋮ ثم «تثبيت التطبيق» / «إضافة إلى الشاشة الرئيسية».', 'أو حمّل ملف APK من صفحة الإصدارات.'], fr: ['Ouvrez le lien dans Chrome.', 'Bouton « Installer » ou menu ⋮ → « Installer l’application ».', 'Ou téléchargez l’APK depuis la page des versions.'] },
    samsung: { ar: ['في Samsung Internet اضغط القائمة ☰.', 'اختر «إضافة صفحة إلى» ثم «الشاشة الرئيسية» (أو أيقونة التنزيل ⬇ في شريط العنوان).'], fr: ['Dans Samsung Internet, menu ☰.', '« Ajouter la page à » → « Écran d’accueil » (ou l’icône ⬇ de la barre d’adresse).'] },
    ios: { ar: ['افتح الرابط في Safari (وليس داخل تطبيق آخر).', 'اضغط زر المشاركة ⬆︎ أسفل الشاشة.', 'اختر «إضافة إلى الشاشة الرئيسية» ثم «إضافة».'], fr: ['Ouvrez le lien dans Safari.', 'Touchez Partager ⬆︎.', '« Sur l’écran d’accueil » → « Ajouter ».'] },
    windows: { ar: ['في Chrome: أيقونة التثبيت ⊕ في شريط العنوان، أو القائمة ⋮ ← «حفظ ومشاركة» ← «تثبيت الصفحة كتطبيق».', 'أو حمّل الاختصار (.bat / .url) من صفحة الإصدارات.'], fr: ['Chrome : icône ⊕ dans la barre d’adresse, ou ⋮ → « Caster, enregistrer et partager » → « Installer la page en tant qu’application ».', 'Ou téléchargez le raccourci (.bat / .url) sur la page des versions.'] },
    edge: { ar: ['في Edge: أيقونة «التطبيق متاح» في شريط العنوان، أو القائمة … ← «التطبيقات» ← «تثبيت هذا الموقع كتطبيق».'], fr: ['Edge : icône « Application disponible » dans la barre d’adresse, ou … → « Applications » → « Installer ce site en tant qu’application ».'] },
    inapp: { ar: ['أنت داخل متصفح تطبيق (فيسبوك، إنستغرام…) لا يسمح بالتثبيت.', 'افتح الصفحة في Chrome (الزر أدناه) أو انسخ الرابط والصقه في المتصفح.'], fr: ['Vous êtes dans le navigateur d’une application (Facebook…), qui ne permet pas l’installation.', 'Ouvrez la page dans Chrome (bouton ci-dessous) ou copiez le lien.'] }
  };
  STEPS.desktop = STEPS.windows;
  const NAMES = { android: 'Android – Chrome', samsung: 'Samsung Internet', ios: 'iPhone / iPad – Safari', windows: 'Windows – Chrome', edge: 'Windows – Edge', inapp: 'متصفح داخل تطبيق / In-app' };
  const fr = () => (root.I18N && root.I18N.lang === 'fr');
  async function prompt() { if (!deferred) return false; deferred.prompt(); const r = await deferred.userChoice.catch(() => ({})); deferred = null; notify(); return r.outcome || true; }
  function stepsHTML(p) { const L = fr() ? 'fr' : 'ar'; return `<ol>${STEPS[p][L].map(s => `<li>${s}</li>`).join('')}</ol>`; }
  function showHelp() {
    const d = detect(), L = fr(); const m = document.createElement('div'); m.className = 'modal'; m.id = 'installHelp'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-labelledby', 'ihT');
    m.innerHTML = `<div class="modal-box"><h2 id="ihT">${L ? 'Installer l’application' : 'تثبيت التطبيق'} – ${NAMES[d.platform] || ''}</h2>${stepsHTML(d.platform)}
      ${d.inapp || (d.android && !d.samsung) ? `<p><a class="btn" id="ihChrome" href="${intentLink()}">${L ? 'Ouvrir dans Chrome' : 'افتح في Chrome'}</a></p>` : ''}
      <p><button class="btn sec" id="ihCopy" type="button">${L ? 'Copier le lien' : 'نسخ الرابط'}</button> <code dir="ltr">${APP_URL}</code></p>
      <details><summary>${L ? 'Autres appareils' : 'أجهزة أخرى'}</summary>${['android', 'samsung', 'ios', 'windows', 'edge'].filter(p => p !== d.platform).map(p => `<h3>${NAMES[p]}</h3>${stepsHTML(p)}`).join('')}</details>
      <p><a href="installer.html">${L ? 'Page d’installation (QR code, APK, Windows)' : 'صفحة التثبيت (رمز QR، APK، ويندوز)'}</a> · <a href="${RELEASE}" rel="noopener">APK / Windows</a></p>
      <div class="bar"><button class="btn" id="ihClose" type="button">${L ? 'Fermer' : 'إغلاق'}</button></div></div>`;
    document.body.appendChild(m); const close = () => m.remove(); m.querySelector('#ihClose').onclick = close; m.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    m.querySelector('#ihCopy').onclick = () => { (navigator.clipboard ? navigator.clipboard.writeText(APP_URL) : Promise.reject()).catch(() => {}); };
    m.querySelector('#ihClose').focus(); return m;
  }
  async function click() { if (deferred) return prompt(); showHelp(); return 'help'; }
  function notify() { subs.forEach(f => { try { f(!!deferred); } catch (e) { } }); }
  function button(cls = 'btn') { const d = detect(); const b = document.createElement('button'); b.type = 'button'; b.className = cls + ' install-btn'; b.textContent = fr() ? '⬇ Installer' : '⬇ تثبيت التطبيق'; b.onclick = click; if (d.standalone) b.hidden = true; return b; }
  if (root.addEventListener) {
    root.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; notify(); });
    root.addEventListener('appinstalled', () => { deferred = null; document.querySelectorAll('.install-btn').forEach(b => b.hidden = true); });
  }
  const API = { detect, intentLink, STEPS, click, prompt, showHelp, button, onChange: f => subs.push(f), get available() { return !!deferred; }, APP_URL, RELEASE };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.INSTALL = API;
})(typeof window !== 'undefined' ? window : globalThis);
