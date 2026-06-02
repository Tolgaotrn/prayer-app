// Playfair lineHeight oranını 1.45x → 1.65x'e günceller
// Sadece fonts.serif* olan style bloklarındaki lineHeight değerlerini değiştirir

const fs = require('fs');
const path = require('path');

// fontSize → doğru lineHeight (1.65x oranı)
const CORRECT_LH = {
  17: 28,
  18: 30,
  19: 32,
  20: 33,
  22: 36,
  24: 40,
  26: 43,
  28: 46,
  34: 56,
  38: 63,
  44: 73,
};

function walk(dir) {
  var result = [];
  var entries = fs.readdirSync(dir);
  for (var i = 0; i < entries.length; i++) {
    var f = entries[i];
    var p = path.join(dir, f);
    if (fs.statSync(p).isDirectory() && f !== 'node_modules' && f[0] !== '.') {
      result = result.concat(walk(p));
    } else if (f.endsWith('.tsx')) {
      result.push(p);
    }
  }
  return result;
}

var root = process.cwd();
var files = walk(path.join(root, 'app')).concat(walk(path.join(root, 'components')));
var totalUpdates = 0;

for (var fi = 0; fi < files.length; fi++) {
  var file = files[fi];
  var src = fs.readFileSync(file, 'utf8');
  var lines = src.split('\n');
  var changed = false;

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];

    // fonts.serif* ve fontSize hem aynı satırda var mı?
    if (!(/fonts\.serif(Bold|Semibold|Medium)?[^A-Za-z]/.test(line))) continue;
    if (!(/fontSize:\s*(\d+)/.test(line))) continue;

    var sizeMatch = line.match(/fontSize:\s*(\d+)/);
    if (!sizeMatch) continue;
    var fontSize = parseInt(sizeMatch[1]);
    var correctLh = CORRECT_LH[fontSize];
    if (!correctLh) continue;

    // Aynı satırda veya ±2 satırda lineHeight var mı?
    var context = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3));
    var lhMatch = null;
    var lhLineIdx = -1;
    for (var ci = 0; ci < context.length; ci++) {
      var m = context[ci].match(/lineHeight:\s*(\d+)/);
      if (m) {
        lhMatch = m;
        lhLineIdx = Math.max(0, i - 2) + ci;
        break;
      }
    }

    if (!lhMatch) continue; // lineHeight yok, başka script ekledi mi kontrol et
    var currentLh = parseInt(lhMatch[1]);
    if (currentLh === correctLh) continue; // Zaten doğru

    // Güncelle
    lines[lhLineIdx] = lines[lhLineIdx].replace('lineHeight: ' + currentLh, 'lineHeight: ' + correctLh);
    changed = true;
    totalUpdates++;
  }

  if (changed) {
    fs.writeFileSync(file, lines.join('\n'));
    var rel = file.replace(root, '').split(path.sep).join('/');
    console.log('Updated:', rel);
  }
}

console.log('\nTotal updates:', totalUpdates);
