/**
 * retag-verses.mjs
 * Mevcut content/verses/base.json ve translations/en.json üzerinde
 * topic regex'lerini çalıştırır, topics[] alanını genişletir.
 *
 * Çalıştır: node tools/retag-verses.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const CONTENT = join(__dir, '../content/verses');

const TOPIC_RULES = [
  { tag: 'patience',    regex: /patien|steadfast|endure|persever|bear with|trials|tribulation/i },
  { tag: 'gratitude',   regex: /grateful|gratitude|thankful|thank|shukr|give thanks|bounty/i },
  { tag: 'hope',        regex: /\bhope\b|mercy of allah|rahma|despair not|do not despair|compassionate|most merciful/i },
  { tag: 'repentance',  regex: /repent|tawbah|turn to allah|seek.*forgiv|atone|return to|oft-returning/i },
  { tag: 'tawakkul',    regex: /trust.*allah|rely.*allah|put.*trust|sufficient.*allah|guardian.*allah|wakil|tawakkul/i },
  { tag: 'guidance',    regex: /\bguidance\b|straight path|sirat|astray|right path|guide.*us|hidayah/i },
  { tag: 'forgiveness', regex: /\bforgi(v|ve|ves|ving|veness)\b|pardon|overlook|absolve|oft-forgiving|ghafur|most forgiving/i },
  { tag: 'peace',       regex: /tranquil|serenity|peace.*heart|peace of heart|assurance.*heart|calm.*heart|sakinah/i },
  { tag: 'love',        regex: /love.*allah|allah.*love|love of allah|beloved.*allah|closer to allah|mahabbah/i },
  { tag: 'dhikr',       regex: /remembrance.*allah|remember.*allah|glorif|tasbih|subhan|dhikr|mention.*allah/i },
  { tag: 'honesty',     regex: /\bhonest\b|truthful|trustworthy|amanah|siddiq|speak.*truth|be of.*truthful/i },
  { tag: 'kindness',    regex: /\bkindness\b|\bkind\b|ihsan|compassion.*others|do good.*parents|be good to|excellence in/i },
  { tag: 'tawakkul',   regex: /put.*trust.*allah|place.*trust|reliance.*allah/i },
];

const base = JSON.parse(readFileSync(join(CONTENT, 'base.json'), 'utf8'));
const enTr = JSON.parse(readFileSync(join(CONTENT, 'translations/en.json'), 'utf8'));

// id → EN çeviri map
const enMap = Object.fromEntries(enTr.map(t => [t.id, t.text]));

let tagged = 0;
for (const verse of base) {
  const text = enMap[verse.id] ?? '';
  const currentTopics = new Set(verse.topics ?? []);
  const before = currentTopics.size;

  for (const { tag, regex } of TOPIC_RULES) {
    if (regex.test(text)) currentTopics.add(tag);
  }

  verse.topics = [...currentTopics];
  if (currentTopics.size > before) tagged++;
}

writeFileSync(join(CONTENT, 'base.json'), JSON.stringify(base, null, 2));

// Topic dağılımı özeti
const summary = {};
for (const verse of base) {
  for (const t of (verse.topics ?? [])) {
    summary[t] = (summary[t] ?? 0) + 1;
  }
}

console.log(`\nRetag complete: ${tagged} verses updated\n`);
console.log('Topic distribution:');
Object.entries(summary).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
  console.log(`  ${k.padEnd(20)} ${v}`);
});
