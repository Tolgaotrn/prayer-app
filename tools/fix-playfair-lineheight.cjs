const { readFileSync, writeFileSync, readdirSync, statSync } = require('fs');
const { join } = require('path');

const SIZE_TO_LH = { 17:24, 18:26, 19:28, 20:29, 22:32, 24:34, 26:37, 28:40, 34:48, 38:54, 44:62 };

function findTSX(dir, results) {
  results = results || [];
  var entries = readdirSync(dir);
  for (var i = 0; i < entries.length; i++) {
    var f = entries[i];
    var p = join(dir, f);
    var stat = statSync(p);
    if (stat.isDirectory() && f !== 'node_modules' && !f.startsWith('.')) {
      findTSX(p, results);
    } else if (f.endsWith('.tsx')) {
      results.push(p);
    }
  }
  return results;
}

var root = process.cwd();
var files = findTSX(join(root, 'app')).concat(findTSX(join(root, 'components')));
var totalFixed = 0;

for (var fi = 0; fi < files.length; fi++) {
  var file = files[fi];
  var src = readFileSync(file, 'utf8');
  var lines = src.split('\n');
  var newLines = lines.slice();
  var changed = false;

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var hasFontFamily = /fontFamily:\s*fonts\.serif(Bold|Semibold|Medium)?[^a-zA-Z]/.test(line);
    var hasFontSize   = /fontSize:\s*\d+/.test(line);

    if (!hasFontFamily || !hasFontSize) continue;

    var sizeMatch = line.match(/fontSize:\s*(\d+)/);
    if (!sizeMatch) continue;
    var lh = SIZE_TO_LH[parseInt(sizeMatch[1])];
    if (!lh) continue;

    // lineHeight zaten var mı? (aynı satır veya ±3 satır)
    var alreadyHas = false;
    var check = lines.slice(Math.max(0, i - 3), Math.min(lines.length, i + 4));
    for (var ci = 0; ci < check.length; ci++) {
      if (/lineHeight/.test(check[ci])) { alreadyHas = true; break; }
    }
    if (alreadyHas) continue;

    // Satırın sonuna ekle
    var trimmed = line.trimEnd();
    var last = trimmed[trimmed.length - 1];
    if (last === ',') {
      newLines[i] = trimmed + ' lineHeight: ' + lh + ',';
    } else {
      newLines[i] = trimmed + ', lineHeight: ' + lh + ',';
    }
    changed = true;
    totalFixed++;
  }

  if (changed) {
    writeFileSync(file, newLines.join('\n'));
    var rel = file.replace(root, '').replace(/\\/g, '/');
    console.log('Fixed:', rel);
  }
}

console.log('\nTotal:', totalFixed, 'lineHeight fixes applied.');
