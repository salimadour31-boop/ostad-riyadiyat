/* Générateurs d'exercices par leçon (contenu ORIGINAL, calculé). MIT.
   Chaque modèle : { rule, f(x, lv) } -> { q, s:[étapes], fig?, chk? }
   lv : 1 تطبيق مباشر، 2 متوسط، 3 وضعية. chk = {fn, in, out} vérifié indépendamment dans tests/. */
(function (root) {
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  const R4 = v => Math.round((v + Number.EPSILON) * 1e4) / 1e4, R2 = v => Math.round((v + Number.EPSILON) * 100) / 100;
  const D = v => { const s = String(R4(v)); return s.replace('.', '{,}'); };          // nombre en mode math (virgule)
  const DT = v => String(R4(v)).replace('.', ',');                                     // nombre en texte
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const FR = (n, d) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d) || 1; n /= g; d /= g; return d === 1 ? `${n}` : `${n < 0 ? '-' : ''}\\dfrac{${Math.abs(n)}}{${d}}`; };
  const P = v => v < 0 ? `(${D(v)})` : D(v);                                            // parenthèses si négatif
  const SG = v => v < 0 ? `- ${D(-v)}` : `+ ${D(v)}`;
  const mono = (a, v, first) => { if (a === 0) return ''; const s = a < 0 ? '-' : first ? '' : '+'; const m = Math.abs(a) === 1 ? '' : D(Math.abs(a)); return `${s}${m}${v}`; };
  const lin = (a, b, v = 'x') => { const t = mono(a, v, true); return (t || '') + (b ? (t ? ` ${b < 0 ? '-' : '+'} ${D(Math.abs(b))}` : D(b)) : (t ? '' : '0')); };
  const NAMES = ['أمين', 'ياسمين', 'رياض', 'مريم', 'إسحاق', 'لينة', 'سفيان', 'نور الهدى', 'أنيس', 'سارة', 'يونس', 'إيناس', 'وسيم', 'هبة', 'عادل', 'ملاك'];
  const WILAYAS = ['تيزي وزو', 'وهران', 'قسنطينة', 'ورقلة', 'بجاية', 'تلمسان', 'سطيف', 'عنابة', 'غرداية', 'باتنة', 'البليدة', 'بسكرة', 'الجلفة', 'تمنراست', 'المدية', 'جيجل'];
  const ITEMS = [['كغ من البطاطا', 60, 90], ['كغ من الطماطم', 80, 160], ['كغ من التمر', 400, 900], ['لتر من الحليب', 25, 60], ['كغ من البرتقال', 120, 260], ['خبزة', 10, 15], ['كراس', 40, 120], ['قلم', 20, 60], ['لتر من زيت الزيتون', 700, 1200], ['كغ من السميد', 50, 110]];
  function X(seed) { const r = rng(seed); const ri = (a, b) => a + Math.floor(r() * (b - a + 1)); const x = { r, ri, nz: (a, b) => { let v; do v = ri(a, b); while (v === 0); return v; }, pick: a => a[Math.floor(r() * a.length)], dec: (a, b, d = 1) => ri(a * 10 ** d, b * 10 ** d) / 10 ** d };
    x.name = () => x.pick(NAMES); x.wil = () => x.pick(WILAYAS); x.item = () => { const it = x.pick(ITEMS); return { n: it[0], p: ri(it[1], it[2]) }; }; return x; }
  const T = {};
