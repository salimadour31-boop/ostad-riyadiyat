# أستاذ الرياضيات · Ostad Riyadiyat

**تطبيق ويب مجاني ومفتوح المصدر لأساتذة الرياضيات في التعليم المتوسط بالجزائر (1م – 4م).**
**Application web libre et gratuite pour les professeurs de mathématiques du cycle moyen en Algérie (1AM – 4AM).**

🔗 Démo / التجربة : https://salimadour31-boop.github.io/ostad-riyadiyat/

---

<div dir="rtl" lang="ar">

## بالعربية

تطبيق يعمل في المتصفح، يمكن **تثبيته** على الهاتف أو الحاسوب، و**يعمل دون إنترنت** بعد أول زيارة. الواجهة بالعربية (من اليمين إلى اليسار) مع إمكانية التحويل إلى الفرنسية.

### الوظائف
- **المنهاج**: السنوات الأربع، الميادين الثلاثة (أنشطة عددية، أنشطة هندسية، الدوال وتنظيم معطيات)، المقاطع التعلمية، الموارد، الكفاءات والحجم الساعي المقترح.
- **مولد المذكرات**: مذكرة حصة وفق النموذج المعتاد (الكفاءة الختامية، مركبات الكفاءة، مؤشرات الكفاءة، الوضعية الانطلاقية، مراحل الحصة والمدة، التقويم)، معبأة مسبقا وقابلة للتعديل، طباعة/PDF وتنزيل Word.
- **التدرج السنوي**: توزيع المقاطع على أسابيع السنة الدراسية 2026-2027 (العطل والفصول قيم افتراضية قابلة للتعديل) مع أسابيع الفرض والاختبار.
- **بنك تمارين أصلية** لكل مقطع بثلاثة مستويات مع الحلول، و**مولدات تمارين عددية** (كسور، أعداد نسبية، معادلات، جذور، القاسم المشترك الأكبر، فيثاغورس، دوال، إحصاء…).
- **إعداد الفروض والاختبارات**: اختيار التمارين، هيكلة شهادة التعليم المتوسط (4 تمارين × 3 ن + وضعية إدماجية 8 ن)، توزيع آلي للعلامات على 20، تصحيح نموذجي، ورقة A4 بالعربية.
- **دفتر التنقيط**: الأقسام، التلاميذ (استيراد CSV)، التقويم المستمر والفرض والاختبار لكل فصل، المعدلات بصيغة قابلة للاختيار، الرتبة، الملاحظات، إحصاء لمجلس القسم، تصدير CSV وطباعة.
- **الكراس اليومي** للحصص المنجزة.
- **الخصوصية**: لا حساب ولا خادم؛ كل البيانات في متصفحك (IndexedDB)، مع نسخ احتياطي واسترجاع بصيغة JSON.

### تنبيه
تقسيم المقاطع معاد بناؤه من تدرجات منشورة لموسم 2025-2026 (انظر `docs/recherche.md`). قارنه دائما بالتدرج الذي يعتمده مفتشك. التمارين كلها أصلية ولا تنقل من الكتاب المدرسي.

</div>

## En français

PWA installable, **hors ligne**, en arabe (RTL) avec interface française.

### Fonctions
- **Programme** : niveaux, domaines, séquences, ressources, compétences, volumes horaires suggérés.
- **Fiche pédagogique (مذكرة)** préremplie et modifiable, impression/PDF et export **Word (.docx)**.
- **Progression annuelle** sur le calendrier 2026-2027 (vacances et trimestres modifiables), semaines de devoir et composition.
- **Banque d'exercices originaux** (3 niveaux, corrigés) et **générateurs** d'exercices numériques.
- **Devoirs / compositions / sujet type BEM** : barème automatique sur 20, corrigé type, mise en page A4 arabe.
- **Carnet de notes** : classes, élèves (import CSV), notes par trimestre, moyennes (formule configurable), rangs, appréciations, statistiques pour le conseil de classe, export CSV.
- **Cahier de textes**.
- **Données locales uniquement** (IndexedDB), sauvegarde/restauration JSON. Aucun compte, aucun serveur, aucune donnée envoyée.

### Développement
Aucun build : HTML/CSS/JS statiques. Bibliothèques incluses localement : [KaTeX](https://katex.org) (MIT) et [docx](https://github.com/dolanmiu/docx) (MIT).

```bash
npm run serve          # http://localhost:8765
npm test               # tests de logique (Node)
npm i && npm run test:e2e   # tests Chrome headless (desktop + mobile, hors ligne, impression, installabilité)
```

Structure : `js/programme.js` (programme), `js/bank.js` (exercices), `js/core.js` (logique testée), `js/app.js` (interface), `sw.js` (hors ligne), `docs/recherche.md` (recherche et sources).

### Contribuer
Corrections du programme, nouveaux exercices **originaux**, traductions : les PR sont bienvenues. Ne copiez pas de pages de manuels ni de sujets protégés.

### Licence
MIT – voir `LICENSE`. KaTeX et docx : licence MIT (fichiers `LICENSE` dans `vendor/`).
