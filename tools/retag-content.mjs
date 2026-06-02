/**
 * retag-content.mjs
 * verses + hadiths + quotes LOCAL base.json dosyalarını,
 * İngilizce metin üzerinde güçlü keyword matching ile topic'lere göre etiketler.
 *
 * İçeriği TEKRAR ÇEKMEZ — sadece mevcut content/ JSON'larındaki topics[] alanını günceller.
 *
 * Çalıştır: node tools/retag-content.mjs
 * Ardından: node tools/push-topics.mjs  (Supabase'e sadece topics[] gönderir)
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));

// ── Topic keyword kuralları ──────────────────────────────────
// Her topic için geniş ama isabetli regex'ler. Bir içerik birden çok topic alabilir.
const TOPIC_RULES = [
  { tag: 'patience', regex:
    /\bpatien|\bsabr\b|steadfast|persever|endure|enduring|forbear|bear (with|patiently|the)|restrain.*anger|withhold.*anger|trials?\b|tribulation|afflict|hardship|adversit/i },

  { tag: 'gratitude', regex:
    /\bgrateful|\bgratitude|\bthankful|give thanks|\bthanks\b|\bshukr\b|\bbount(y|ies)|\bfavou?rs? of|blessings? (of|upon)|ungrateful/i },

  { tag: 'hope', regex:
    /\bhope\b|hopes? (for|in)|\bmercy\b|merciful|compassion(ate)?|do not despair|despair not|never despair|relief|ease after|glad tiding|good news|reward.*paradise|rahma/i },

  { tag: 'repentance', regex:
    /\brepent|\btawbah?\b|turn (to|back to|unto|in repentance)|return(s|ed)? (to|unto) (allah|him|god|your lord)|seek(s|ing)? (his )?forgiveness|ask(s|ing)? (for )?forgiveness|forgive (us|me|them|our sins)|oft-returning|accepts? (the )?repentance|\bsin(s|ned|ner|ful)?\b|misdeed|transgress|wrongdoing|heed|warned|punishment.*(sin|evil)|evil (deed|act)/i },

  { tag: 'tawakkul', regex:
    /\btrust\b|reli(es|ance|ed) (on|upon)|rely (on|upon)|depend (on|upon)|put.*trust|sufficient (is|for)|\bguardian\b|\bprotector\b|disposer of (affairs|all)|wakil|tawakkul/i },

  { tag: 'guidance', regex:
    /\bguid(e|es|ed|ance|ing)\b|straight path|right path|the path\b|astray|misguid|show us|lead (us|them) (to|towards)|hidayah|\blight\b.*(path|guidance)|guide.*truth|the (right|true|correct) (way|direction)|whoever (allah|he) guides|whom (allah|he) guides/i },

  { tag: 'forgiveness', regex:
    /\bforgiv(e|es|en|ing|eness)\b|\bpardon|overlook|absolve|efface|wipe (away|out).*(sin|evil)|oft-forgiving|ghafur|conceal.*fault|excuse(s|d)?\b/i },

  { tag: 'peace', regex:
    /\bpeace\b|tranquil|tranquillity|serenit|\bcalm\b|content(ment|ed)?|\bsatisfi|hearts? (find|are at)|at (ease|rest)|assurance|repose|sakina|inner peace/i },

  { tag: 'love', regex:
    /\blove(s|d|th|rs)?\b|\bbeloved\b|affection|\bdear(er|est)?\b|he loves|loves (those|the|them|his|you)|allah loves|stronger in love|for (the sake of|love of) (allah|him)|devot(e|ed|ion)|draw(s|ing)? near|nearness to|seek(s|ing)? (the )?pleasure (of|from)|pleas(es|ed) (allah|him|your lord)|wali\b|awliya|close(r|ness) to (allah|him|god|your lord)|mahabba/i },

  { tag: 'dhikr', regex:
    /remember(s|ing|ed)? (allah|him|god|me|your lord)|remembrance|\bmention(s|ing|ed)? (allah|him|the name)|glorif(y|ies|ied)|glory be|celebrate.*praise|praise (of |be to )?(allah|him|your lord)|tasbih|subhan|hallow|morning and evening|dhikr/i },

  { tag: 'honesty', regex:
    /\btruth(ful|fulness)?\b|\bhonest|\bsincer(e|ity)|do not conceal|conceal.*(testimony|truth|evidence)|\bwitness(es|ing)?\b|\btestimony\b|stand (out |firm )?for justice|\bjust(ice|ly)?\b|\btrust(worthy)?\b|amanah|faithful (to|in)|keep.*(promise|covenant|trust|word)|fulfil.*(promise|covenant|oath)|naseehah|\bfalsehood|\blie(s|d)?\b|tell.*truth|uprigh/i },

  { tag: 'kindness', regex:
    /\bkind(ness|ly)?\b|good to (your )?parents|\bparents\b|charit|\balms\b|\bgive\b.*(poor|needy|orphan)|\borphan|\bneedy\b|feed.*(poor|needy|hungry)|\bgentle\b|righteous(ness)?|do good|benevolen|good (deed|treatment|manner)|neighbou?r|\bihsan\b/i },
];

// Korunacak eski topic'ler (silmiyoruz, sadece ekliyoruz)
function retagItems(items, textMap) {
  let updated = 0;
  for (const it of items) {
    const text = textMap[it.id] ?? '';
    if (!text) continue;
    const topics = new Set(it.topics ?? []);
    const before = topics.size;
    for (const { tag, regex } of TOPIC_RULES) {
      if (regex.test(text)) topics.add(tag);
    }
    it.topics = [...topics];
    if (topics.size > before) updated++;
  }
  return updated;
}

function distribution(items) {
  const d = {};
  for (const it of items) for (const t of (it.topics ?? [])) d[t] = (d[t] ?? 0) + 1;
  return Object.entries(d).sort((a, b) => b[1] - a[1]);
}

function printDist(label, items) {
  console.log(`\n${label} topic distribution:`);
  for (const [k, v] of distribution(items)) console.log(`  ${k.padEnd(14)} ${v}`);
}

function processType(folder, label) {
  const baseP = join(__dir, `../content/${folder}/base.json`);
  const enP   = join(__dir, `../content/${folder}/translations/en.json`);
  const base = JSON.parse(readFileSync(baseP, 'utf8'));
  const en   = JSON.parse(readFileSync(enP, 'utf8'));

  // quote'larda text base'de de olabilir; verse/hadith'te translations/en.json'da
  const textMap = {};
  for (const t of en) textMap[t.id] = t.text;
  // quote base'inde direkt text alanı varsa onu da kullan
  for (const it of base) if (it.text && !textMap[it.id]) textMap[it.id] = it.text;

  const updated = retagItems(base, textMap);
  writeFileSync(baseP, JSON.stringify(base, null, 2));
  console.log(`\n✓ ${label}: ${updated}/${base.length} kayıt güncellendi`);
  printDist(label, base);
}

console.log('🏷  Retag başlıyor (içerik tekrar çekilmiyor, sadece topics[] güncelleniyor)...');
processType('verses',  'Verses');
processType('hadiths', 'Hadiths');
processType('quotes',  'Quotes');
console.log('\n✅ Retag tamamlandı. Şimdi: node tools/push-topics.mjs');
