// Batch script'in bozduğu satırları düzelt:
// Hatalı: { fontFamily: ..., fontSize: N }, lineHeight: X,
// Doğru:  { fontFamily: ..., fontSize: N, lineHeight: X },

const { readFileSync, writeFileSync, readdirSync, statSync } = require('fs');
const { join } = require('path');

function findTSX(dir, results) {
  results = results || [];
  var entries = readdirSync(dir);
  for (var i = 0; i < entries.length; i++) {
    var f = entries[i];
    var p = join(dir, f);
    if (statSync(p).isDirectory() && f !== 'node_modules' && !f.startsWith('.')) findTSX(p, results);
    else if (f.endsWith('.tsx')) results.push(p);
  }
  return results;
}

var root = process.cwd();
var files = findTSX(join(root, 'app')).concat(findTSX(join(root, 'components')));
var fixed = 0;

for (var fi = 0; fi < files.length; fi++) {
  var file = files[fi];
  var src = readFileSync(file, 'utf8');
  var original = src;

  // Pattern: }, lineHeight: N,  (hatalı ekleme)
  // Düzelt: hatalı } lineHeight: N kısmını bul ve satırı yeniden yaz
  // Örnek satır: "  headerTitle: { fontFamily: ..., fontSize: 24 }, lineHeight: 34,"
  // İstenen:     "  headerTitle: { fontFamily: ..., fontSize: 24, lineHeight: 34 },"
  src = src.replace(
    /(\s+\S[\s\S]*?fontFamily:[^}]+fontSize:\s*\d+)\s*\},\s*lineHeight:\s*(\d+),/g,
    function(match, before, lh) {
      return before + ', lineHeight: ' + lh + ' },';
    }
  );

  if (src !== original) {
    writeFileSync(file, src);
    var rel = file.replace(root, '').replace(/\\/g, '/');
    console.log('Corrected:', rel);
    fixed++;
  }
}
console.log('Done:', fixed, 'files corrected');
