/**
 * retag-hadiths.mjs
 * Mevcut content/hadiths/base.json + translations/en.json üzerinde
 * keyword matching ile topics[] alanını doldurur.
 *
 * Çalıştır: node tools/retag-hadiths.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const CONTENT = join(__dir, '../content/hadiths');

const TOPIC_RULES = [
  { tag: 'patience',    regex: /patien|steadfast|endure|persever|bear.*hardship|trials|adversity|sabr/i },
  { tag: 'gratitude',   regex: /grateful|gratitude|thankful|thank.*allah|shukr|bounty|blessings.*thank/i },
  { tag: 'hope',        regex: /\bhope\b|mercy.*allah|do not despair|rahma|most merciful|hopeful/i },
  { tag: 'repentance',  regex: /repent|tawbah|turn to allah|seeks forgiv|seeks.*pardon|oft-returning|returns to/i },
  { tag: 'tawakkul',    regex: /trust.*allah|rely.*allah|sufficient.*allah|reliance.*allah|tawakkul|put.*trust/i },
  { tag: 'guidance',    regex: /\bguidance\b|straight path|sirat.*mustaqim|guide.*truth|right path|hidayah/i },
  { tag: 'forgiveness', regex: /forgi(v|ve|ves|ving|veness)|pardon.*sin|absolve|sins.*forgi|ghafur|most forgiving/i },
  { tag: 'peace',       regex: /tranquil|peace.*heart|calm.*heart|serenity|contentment|sakina/i },
  { tag: 'love',        regex: /love.*allah|allah.*love|loves.*allah|love.*prophet|love.*believer|mahabbah/i },
  { tag: 'dhikr',       regex: /remembrance.*allah|remember.*allah|glorif|tasbih|subhanallah|alhamdulillah|dhikr|mention.*allah/i },
  { tag: 'honesty',     regex: /\bhonest\b|truthful|trustworthy|amanah|siddiq|speak truth|truthfulness/i },
  { tag: 'kindness',    regex: /\bkindness\b|be kind|ihsan|compassion|gentle.*people|good.*treatment|do good/i },
];

const base = JSON.parse(readFileSync(join(CONTENT, 'base.json'), 'utf8'));
const enTr = JSON.parse(readFileSync(join(CONTENT, 'translations/en.json'), 'utf8'));

const enMap = Object.fromEntries(enTr.map(t => [t.id, t.text]));

let tagged = 0;
for (const hadith of base) {
  const text = enMap[hadith.id] ?? '';
  const currentTopics = new Set(hadith.topics ?? []);
  const before = currentTopics.size;

  for (const { tag, regex } of TOPIC_RULES) {
    if (regex.test(text)) currentTopics.add(tag);
  }

  hadith.topics = [...currentTopics];
  if (currentTopics.size > before) tagged++;
}

writeFileSync(join(CONTENT, 'base.json'), JSON.stringify(base, null, 2));

const summary = {};
for (const h of base) {
  for (const t of (h.topics ?? [])) {
    summary[t] = (summary[t] ?? 0) + 1;
  }
}

console.log(`\nRetag complete: ${tagged} hadiths updated\n`);
console.log('Topic distribution:');
Object.entries(summary).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
  console.log(`  ${k.padEnd(20)} ${v}`);
});
