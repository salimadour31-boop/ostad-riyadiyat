// Concatène src/t*.js -> js/lessons.js (aucune dépendance). Usage : node scripts/build-lessons.js
const fs = require('fs'), path = require('path'); const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter(f => /^t\d+.*\.js$/.test(f)).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
fs.writeFileSync(path.join(__dirname, '..', 'js', 'lessons.js'), '/* FICHIER GÉNÉRÉ par scripts/build-lessons.js à partir de src/ — ne pas modifier directement. */\n' + files.map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join(''));
console.log('js/lessons.js <-', files.join(', '));
