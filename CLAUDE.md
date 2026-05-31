# Noor — Daily Islamic Verses App
## Projeyi anlama rehberi (yeni konuşmalar için)

Bu dosya yeni bir Claude konuşmasının projeyi **sıfırdan anlamadan** devam edebilmesi için yazıldı.
Tolga ile çalışırken şunları bil: kısa ve net konuşur, görmek istediği şeyi önce tarayıcıda/telefonda test etmeni sever, tasarım kararlarında referans görsel verir, beğenmediği şeyi direk söyler.

---

## Projenin özü

**Noor** — günlük İslami ayet, dua, hadis ve alıntı sunan bir mobil uygulama.
**Krem/warm tema artık VARSAYILAN** (darkMode default `false`). Altın aksanlar, gerçek cami fotoğrafları, world-class animasyonlar. Dark mode hâlâ settings toggle ile açılabilir. Onboarding `welcome` ekranı hariç (o `forceDark` ile dark hero) tüm onboarding + ana app krem.

**Çalıştırmak için:**
```bash
npx expo start --tunnel   # telefonda Expo Go ile (SDK 54 gerekli)
npx expo start            # sonra 'w' ile tarayıcıda
```

---

## Tech stack (gerçek kurulu versiyonlar)

| Katman | Kütüphane | Versiyon |
|---|---|---|
| Framework | expo | ~54.0.0 |
| Language | TypeScript strict | ~5.9.2 |
| Routing | expo-router | ~6.0.24 |
| Animasyon | react-native-reanimated | ~4.1.1 |
| Gesture | react-native-gesture-handler | ~2.28.0 |
| State | zustand | ^5.0.14 |
| Lists | FlatList (FlashList v2 kırıldı) | RN built-in |
| Gradient | expo-linear-gradient | ~15.0.8 |
| Blur | expo-blur | ~15.0.8 |
| SVG | react-native-svg | 15.12.1 |
| Image | expo-image | ~3.0.11 |
| Fonts | @expo-google-fonts/playfair-display, plus-jakarta-sans, amiri | ^0.4.x |
| Haptics | expo-haptics | ~15.0.8 |
| Notifications | expo-notifications | ~0.32.17 |
| Konum | expo-location | ~19.0.8 |
| Namaz vakti | adhan | ^4.4.3 |
| RN | react-native | 0.81.5 |
| React | react | 19.1.0 |
| Web desteği | react-native-web, react-dom | ^0.21.0, 19.1.0 |
| Worklets | react-native-worklets | 0.5.1 |
| **Supabase** | **@supabase/supabase-js** | **^2.x** |

### Kritik babel.config.js notu
`babel.config.js`'de **inline `transformImportMeta` plugin** var.
Sebep: zustand devtools `import.meta.env` kullanıyor, web'de klasik script olarak yüklenince
SyntaxError → boş ekran oluyordu. Bu plugin `import.meta` → `({})` dönüştürüyor.
`react-native-reanimated/plugin` **daima en sona** gelmeli.

---

## Dizin yapısı (güncel, tam)

```
islam-app/
├── app/
│   ├── _layout.tsx               ← Root: GestureHandler + SafeArea + fonts + Stack
│   ├── index.tsx                 ← Gate: isCompleted → feed, değilse → welcome
│   ├── (onboarding)/
│   │   ├── welcome.tsx           ← 01 Swipeable ayet kartı + star trails SVG
│   │   ├── name.tsx              ← 02 Gold-glow input (LOCAL STATE — önemli!)
│   │   ├── age.tsx               ← 03 Radio pill seçim
│   │   ├── faith-intro.tsx       ← 04 Animated İslam kemeri
│   │   ├── intention.tsx         ← 05 Multi-select
│   │   ├── feeling.tsx           ← 06 Single-select
│   │   ├── quran-relation.tsx    ← 07 Single-select
│   │   ├── content-select.tsx    ← 08 2×3 icon grid
│   │   ├── content-style.tsx     ← 09 Multi-select
│   │   ├── usage.tsx             ← 10 Multi-select
│   │   ├── home-pref.tsx         ← 11 Multi-select
│   │   ├── language.tsx          ← 12 → direkt reminders'a gider
│   │   ├── translation.tsx       ← DEVRE DIŞI (silinebilir)
│   │   ├── reminders.tsx         ← 13 Stepper + RangeSlider
│   │   ├── notifications.tsx     ← 14 Radial rays + izin
│   │   ├── preparing.tsx         ← 15 SparkleField + auto-advance
│   │   ├── streak-intro.tsx      ← 16 Crescent + dots
│   │   ├── theme-select.tsx      ← 17 Gerçek fotoğraf grid
│   │   ├── attribution.tsx       ← 18 Kaynak sorusu, skip'lenebilir
│   │   └── paywall.tsx           ← 19 Weekly/Yearly, complete() çağırır
│   ├── (tabs)/
│   │   ├── _layout.tsx           ← tabBar: () => null (alt bar YOK)
│   │   ├── feed.tsx              ← ANA SAYFA: Supabase'den verse+hadith karışık, offline-first
│   │   ├── home-card.tsx         ← Namaz vakitleri + günün ayeti (Supabase) + StreakWidget
│   │   ├── themes.tsx            ← 3-kolon galeri, Free/New filtresi
│   │   ├── profile.tsx           ← Premium banner + streak + quick actions + settings
│   │   └── settings.tsx          ← Sections, ToggleSwitch, premium kart
│   ├── verse/[id].tsx            ← Ayet detay: Arapça + çeviri + meta + similar
│   ├── categories.tsx            ← BottomSheet + 4 gradient tile
│   ├── widget-studio.tsx         ← Canlı widget preview
│   ├── explore-topics.tsx        ← Browse topics: arama + Free/Popular/Catalog bölümleri
│   ├── saved-verses.tsx          ← Kayıtlı ayetler listesi
│   ├── reminders-settings.tsx    ← Stepper (frekans) + RangeSlider (saat aralığı)
│   ├── language-settings.tsx     ← Dil seçimi (EN/TR/FR/ID/AR)
│   └── name-settings.tsx         ← İsim düzenleme (profile → name → buraya gelir)
│
├── components/
│   ├── arabic/ArabicText.tsx     ← Amiri font, writingDirection:'rtl' — DAIMA bunu kullan
│   ├── anim/
│   │   ├── Sparkles.tsx
│   │   ├── Crescent.tsx
│   │   └── GlowArch.tsx
│   ├── ui/
│   │   ├── GoldButton.tsx
│   │   ├── GhostButton.tsx
│   │   ├── OptionRow.tsx
│   │   ├── IconGridCard.tsx
│   │   ├── VerseCard.tsx
│   │   ├── StreakWidget.tsx      ← Ortalanmış, altın kenarlık dark modda, flame ikonu YOK
│   │   ├── NotifPreview.tsx
│   │   ├── ProgressDots.tsx
│   │   ├── ToggleSwitch.tsx
│   │   ├── RangeSlider.tsx       ← Çift tutamaçlı saat slider (dakika cinsinden, "HH:MM" store)
│   │   ├── Stepper.tsx
│   │   ├── ThemeTile.tsx
│   │   └── BackButton.tsx
│   ├── layout/
│   │   ├── ScreenContainer.tsx
│   │   ├── OnboardingShell.tsx
│   │   ├── BottomSheet.tsx
│   │   └── FloatingTabBar.tsx    ← KULLANILMIYOR
│   └── onboarding/
│       └── SelectScreen.tsx
│
├── constants/
│   └── theme.ts
│
├── data/
│   ├── types.ts                  ← Verse, Dua, Hadith, Quote, ContentKind (seed tipleri)
│   ├── verses.ts                 ← ~52 seed ayet — offline fallback için
│   ├── duas.ts, hadiths.ts, quotes.ts  ← seed data
│   └── themes.ts                 ← 9 BackgroundTheme — image artık Cloudinary URL ({ uri })
│
├── stores/
│   ├── useOnboardingStore.ts
│   └── useAppStore.ts            ← followedTopics default: ['General']
│
├── lib/
│   ├── haptics.ts
│   ├── useThemeColors.ts
│   ├── supabase.ts               ← Supabase client (anon key)
│   ├── contentDb.ts              ← Offline-first veri katmanı (cache → Supabase → stale → seed)
│   └── prayerTimes.ts            ← usePrayerTimes() hook: expo-location + adhan + reverseGeocode
│
├── content/                      ← Import araçlarının çıktısı (ham, filtrelenmeden önce)
│   ├── hadiths/                  ← ham hadith (7 koleksiyon), base + translations/
│   ├── verses/                   ← ham ayet, base + translations/
│   ├── duas/                     ← ham dua, base + translations/
│   └── quotes/                   ← ham quote, base + translations/
│   (Supabase'de filtreli: verses 395, hadiths 500, duas 78, quotes 198)
│
└── tools/
    ├── import-hadith.mjs         ← fawazahmed0 API → content/hadiths
    ├── import-quran-verses.mjs   ← alquran.cloud → content/verses
    ├── import-duas.mjs           ← fitrahive/dua-dhikr → content/duas
    ├── build-quotes-from-content.mjs
    ├── supabase-schema.sql       ← Supabase'de SQL Editor'da çalıştırılacak DDL
    └── supabase-import.mjs       ← content/ → Supabase (npm run db:import)
```

---

## Supabase yapısı

**URL:** `https://hvxrsscrsqdbfewpmfhl.supabase.co`
**Proje:** noor-app | Region: eu-central-1 (Frankfurt)

**Tablolar:**
```
verses              id, arabic, surah_name, ayah, juz, page, topics[], popularity
verse_translations  id + language (PK), text
hadiths             id, collection, arabic, grade, topics[], source_priority
hadith_translations id + language (PK), text
duas                id, arabic, transliteration, occasion, category, source
dua_translations    id + language (PK), text, title
quotes              id, source_type, author, text, topics[], popularity
quote_translations  id + language (PK), text
themes              id, name, image_url, gradient[], badge, is_free, is_active, sort_order
```

**RLS:** Tüm tablolar public read, write yok (anon key ile yeterli)

**Import komutları:**
```bash
npm run db:import            # tüm tabloları yeniden yükle
node tools/supabase-import.mjs --only=verses   # sadece verses
node tools/supabase-import.mjs --only=themes   # temalar güncelle
```

---

## Tema görselleri — Supabase Storage (Cloudinary'den taşındı)

Tüm 9 tema görseli **Supabase Storage** `themes` bucket'ında (public).
`data/themes.ts`'de `BASE` sabiti + `image: { uri: \`${BASE}/dosya.jpg\` }` formatında.
`expo-image` otomatik cache'ler. Tema image tipi: `{ uri: string }`.

**Bucket URL:** `https://hvxrsscrsqdbfewpmfhl.supabase.co/storage/v1/object/public/themes/`
**Dosyalar:** midnight.jpg, night-mosque.png, sunset-arch.png, interior.png,
sunrise-court.jpg, serene-arch.jpg, quran-light.jpg, bird-sunset.jpg, kaaba.png

**Yeniden yükleme:** `node tools/upload-themes-to-supabase.mjs` (bucket'ı oluşturur + görselleri yükler).
Cloudinary (`dntc8zxaf`) artık kullanılmıyor.

---

## lib/contentDb.ts — Offline-first veri katmanı

```typescript
// Ana export'lar:
fetchFeedItems(lang, limit, followedTopics, isPremium, savedIds, forceFresh) → FeedItem[]
fetchDailyVerse(lang) → FeedItem | null
fetchThemes() → ThemeItem[]
clearContentCache() → void
resolveLang(stored: string | undefined) → Lang  // 'Turkish' → 'tr' vs.

// Cache TTL: 24 saat, key: noor_cache_*
// Fallback sırası: cache → Supabase → stale cache → seed data
// buildFeed artık tüm türleri PARALEL çeker (Promise.all), her türü shuffle eder
// → tek koleksiyon/popülerlik monopolisi yok
```

**İçerik erişim kuralları:**
- ÜCRETSİZ: `General`, `Quran Verses`, `Favorites`, `Duas & Prayers`
- PREMİUM: `Hadiths`, `Islamic Quotes`, `99 Names of Allah`, `Dhikr`, diğer konular
- `General` seçiliyse: verse + favorites (hadiths/quotes dahil değil)
- `Favorites`: kaydedilen içerik HER TÜRDEN olabilir → verses+hadiths+duas+quotes
  tablolarının HEPSİ savedIds ile sorgulanır. Boşsa seed'e DÜŞMEZ (boş ekran gösterir).
- Feed limiti: **100** (feed.tsx). Duas TR/FR çevirisi yok → her zaman EN (ID hariç).

---

## Dil sistemi

**`resolveLang(stored)`** — `lib/contentDb.ts`'te:
```typescript
'Turkish'    → 'tr'
'French'     → 'fr'
'Indonesian' → 'id'
'Arabic'     → 'en'  // Arapça içerik zaten base'de, çeviri olarak en gösterilir
diğerleri   → 'en'
```

**Feed'de Arapça gösterimi (ÖNEMLİ — "Arabic + English" yok artık):**
```typescript
const showArabic   = rawLang === 'Arabic'
const renderArabic = showArabic && item.arabic.trim().length > 0
// Arabic modu → SADECE Arapça (altında çeviri YOK)
// English/Turkish/French/Indonesian → SADECE çeviri (Arapça YOK)
// İkisi MUTUALLY EXCLUSIVE — quote'ta Arapça yoksa çeviriye düşer
```

**Dil seçenekleri** (`language-settings.tsx`):
- 🇬🇧 English (Recommended)
- 🇹🇷 Turkish
- 🇫🇷 French
- 🇮🇩 Indonesian
- 🇸🇦 Arabic
- ~~Arabic + English~~ → KALDIRILDI

---

## Explore Topics ekranı

**Bölümler (sırayla):**
1. Premium banner (premium değilse)
2. StreakWidget
3. **Search bar** (streak'in altında)
4. My Topics (followedTopics chips)
5. **Free** (başlıksız): General, Quran Verses, Favorites — satır içi "Free" rozeti
6. **Most Popular**: 99 Names, Hadiths, Dhikr, Patience, Gratitude (locked)
7. By type, Faith & Belief, Morality, Heart (locked)

**Default:** `followedTopics: ['General']` — store'da default olarak seçili.
**Edit butonu yok** — chip'e dokunmak kaldırıyor.

---

## Renk sistemi

### `useThemeColors()` hook'u — TÜM ekranlar bunu kullanmalı

```typescript
import { useThemeColors } from '../lib/useThemeColors';
const tc = useThemeColors();
// tc.heading, tc.body, tc.muted, tc.cardBg, tc.border, tc.gold, tc.raisedBg...
// tc.isDark → boolean
```

### Dark palette (darkMode=true — artık varsayılan DEĞİL, toggle ile)
```typescript
bg.midnight  '#0A1230' | bg.card '#161E3D' | bg.raised '#1E2A52'
gold.primary '#D4AF37' | gold.bright '#E8C766' | gold.deep '#B8902E'
text.heading '#F5F0E1' | text.body '#C3C9DE' | text.muted '#828BAD'
hairline     'rgba(255,255,255,0.08)'
```

### Warm palette (darkMode=false, toggle ile açılır)
```typescript
warm.bg '#F2EDE4' | warm.surface '#EDE7DC' | warm.raised '#E4DDD3'
warm.border 'rgba(180,155,120,0.25)'
warm.gold '#C9963A' | warm.goldSoft '#D4A855'
warm.text '#2C2418' | warm.body '#5C4F3D' | warm.muted '#9C8E7D'
```

### Typography
- **Playfair Display** → `fonts.serif/serifBold` — başlıklar
- **Plus Jakarta Sans** → `fonts.sans/sansMedium/sansBold` — UI, body
- **Amiri** → `fonts.arabic/arabicBold` — TÜM Arapça metin

---

## Kritik kurallar

1. **Arapça metin** → DAIMA `<ArabicText>` component. Latin placeholder YASAK.
2. **Arka planlar** → Supabase Storage URL `{ uri: '...' }` + `expo-image`. Local `require()` artık sadece onboarding'de. (Cloudinary'den taşındı.)
3. **Animasyonlar** → SADECE `react-native-reanimated v4`. React Native core `Animated` YASAK.
4. **Listeler** → `FlatList` (FlashList v2 API değişti, estimatedItemSize yok).
5. **Her press/select/swipe** → `haptic.*` çağrısı.
6. **İnteraktif elementler** → `accessibilityRole` + `accessibilityLabel`.
7. **Dark/Light mode** → `useThemeColors()` hook, hardcoded `colors.*` kullanma.
8. **Input focus bug** → name.tsx gibi formlarda LOCAL state kullan, submit'te store'a yaz.
9. **Supabase key'leri** — anon key app'te, service_role sadece tools/'da. Asla app bundle'a service_role koyma.
10. **RangeSlider** → store'da `reminderStart/End` string `"HH:MM"` formatında, slider dakika (number) çalışır — dönüşüm reminders-settings.tsx'te yapılır.
11. **Dil değişimi** → `fetchFeedItems(..., forceFresh)` son parametresi cache'i atlar. Feed'de `prevLangRef` ile dil değişimi tespit edilip `forceFresh=true` geçilir; ayrıca lang değişince `setItems([])` + `setLoading(true)`. language-settings + onboarding/language Save'de `clearContentCache()` çağrılır. Bu olmadan dil değişince eski cache (İngilizce) gösterilirdi.
12. **Special offer** → `router.push('/special-offer')` ile açılır (onboarding'i tamamlamaz). Sadece premium durumu ayarlar, geri döner. Onboarding paywallundan tamamen ayrı.
13. **Namaz vakitleri** → `usePrayerTimes()` hook kullan. Hardcoded saat KULLANMA. Telefonda konum izni verince gerçek şehir + vakitleri gösterir.
14. **Paywall güncel yapısı** → `paywall.tsx` = 3 plan (annual/monthly/weekly), krem premium. `special-offer.tsx` = tek sayfa "7 days free". İKİSİ FARKLI EKRAN.

---

## Navigasyon akışı

```
app/index.tsx
  ├─ isCompleted=false → onboarding (YENİ SIRA, aşağıda)
  └─ isCompleted=true  → /(tabs)/feed

ONBOARDING SIRASI (güncel — Vocabulary referansına göre):
  welcome(dark hero) → attribution(how did you hear) → name → age → faith-intro
  → intention → feeling → quran-relation → content-select → content-style
  → usage → home-pref → language → preparing → streak-intro
  → reminders(ZENGİN NOTIFICATION: app icon preview + how many + active hours + "Allow and Save",
              bildirim izni ister) → theme-select → paywall
  NOT: eski notifications.tsx (Crescent izin ekranı) artık akışta DEĞİL (orphan).
       reminders.tsx hem reminder ayarı hem bildirim izni ekranı oldu.

(tabs) — ALT BAR YOK (tabBar: () => null):
  feed = ANA/DEFAULT immersive sayfa:
    - sol üst: 🏠 → home-card
    - üst orta: ❤️ likes/5 pill
    - sağ üst: 👑 crown → paywall
    - aksiyon: Share · Like · Themes
    - sol alt: ▦ → /explore-topics
    - sağ alt: 👤 → profile

Alt ekranlar:
  /explore-topics      ← Browse topics
  /saved-verses        ← Kayıtlı ayetler (Supabase'den çekiyor, krem-aware)
  /reminders-settings  ← Stepper + RangeSlider (Active Hours)
  /language-settings   ← Dil seçimi (krem-aware)
  /name-settings       ← İsim düzenleme (Profile → Name)
  /special-offer       ← "7 days of premium" tekli teklif (onboarding değil, ara sıra çıkar)

Modals:
  /verse/[id]     slide_from_bottom (krem-aware)
  /categories     transparentModal + BottomSheet
  /widget-studio  slide_from_right
  /explore-topics slide_from_bottom
```

---

## State

### useOnboardingStore (key: 'noor-onboarding')
```typescript
name, age, intentions[], feeling, quranRelation,
contentTypes[], contentStyle[], usage[], homePreference[],
language,           // 'English' | 'Turkish' | 'French' | 'Indonesian' | 'Arabic'
reminderCount,      // number
reminderStart,      // string "HH:MM" (örn: "08:00")
reminderEnd,        // string "HH:MM" (örn: "21:00")
selectedTheme, attribution, isCompleted

set(key, value) | toggleArrayItem(key, value)
complete() | reset()
```

### useAppStore (key: 'noor-app')
```typescript
savedVerseIds[], streakDays, lastOpenDate,
isPremium, darkMode, currentVerseIndex,
followedTopics[]    // default: ['General']

toggleSave(verse) | isSaved(id) | registerOpen()
setPremium(v) | setDarkMode(v)
toggleFollowTopic(topic) | isFollowed(topic)
```

---

## Feed ekranı (ana sayfa)

**Veri akışı:**
- `lib/contentDb.ts` → `fetchFeedItems(lang, 30, followedTopics, isPremium, savedIds)`
- Cache hit → anında, cache miss → Supabase → cache yaz
- Fallback: stale cache → seed data (offline garantisi)

**Arapça gösterimi:**
- Sadece `language === 'Arabic'` ise Arapça gösterilir
- Uzun Arapça: `arabicFontSize()` dinamik font (36→17px) + `adjustsFontSizeToFit`
- Kind badge (Verse/Hadith etiketi) → KALDIRILDI

**Content kuralları:**
- Free user + General → sadece verse
- Free user + Favorites → savedIds'deki ayetler
- Premium → hadiths, 99 Names, vb. dahil

---

## Home Card = İşlevsel "Apps" hub (YENİDEN TASARLANDI)

Eski "Good morning + streak + günün ayeti" yapısı KALDIRILDI. Yeni yapı:
**Bölümler (sırayla):** Header (greeting YOK, sadece "Today" + tarih + şehir chip) →
**Prayer card** (next prayer + countdown + 6 slot, "All" → /prayer-times) →
**Apps grid** (2 kolon, gradient ikon rozetli premium kartlar).

**Grid tile'ları → route:**
- Prayer Times → `/prayer-times` (tam günlük takvim, gradient hero + liste)
- Qibla → `/qibla` (SVG dönen pusula, kaabe işareti, hizalama haptic)
- Tasbih → `/dhikr` (SVG progress ring, tap sayaç, 5 zikir, tur sayısı)
- Reminders → `/notifications-settings` (namaz başına toggle + günlük ayet/hadis)
- Home Widgets → `/widget-settings`
- Lock Screen → `/widget-settings`
- Quran → `/(tabs)/feed`
- Duas → `/explore-topics`

**Yeni ekranlar:** `app/qibla.tsx`, `app/dhikr.tsx`, `app/prayer-times.tsx`,
`app/notifications-settings.tsx`. Hepsi `useThemeColors` (krem-aware), `react-native-svg` ile çizim.
Qibla/Dhikr cihaz pusulası + heading `expo-location watchHeadingAsync` (web'de no-op, "compass not available").

**`lib/notifications.ts`:** namaz + içerik bildirimleri. `applyAllNotifPrefs(slots, prefs)`,
`schedulePrayerNotifications` (DAILY trigger her vakit), `scheduleDailyVerse` (08:00),
`scheduleDailyHadith` (20:00). Prefs AsyncStorage `noor_notif_prefs`. Web'de no-op, izin ister.

---

## Profile (SADELEŞTİRİLDİ)

```
← (back) Profile + avatar
├── Premium banner → paywall
├── StreakWidget (streak SADECE burada — home'dan kaldırıldı)
├── Quick Actions: Saved Verses · Reminders  (Themes + Widget KALDIRILDI)
└── Settings card:
    ├── Name → /name-settings (LOCAL state input, store'a kaydet butonunda)
    ├── Language → /language-settings
    ├── Notifications → /reminders-settings
    └── Dark Mode toggle
```
ActionCard `halfWidth` prop: 1 kart tam genişlik, 2+ kart yan yana (%47.8).

---

## StreakWidget

- Flame ikonu YOK — sadece gün sayısı + "day streak" + caption
- Tüm içerik ortalanmış
- **Beyaz çerçeveli kart** (krem zeminde görünür için) — `border 2px`, beyaz `backgroundColor`
- Gün etiketleri ÜSTTE (Su Mo Tu...), altında dolu günler **altın daire + beyaz tik**
- Boş günler: yarı saydam daire, krem-uyumlu
- `banner` prop kaldırıldı (artık yok)

---

## Çözülen bilinen sorunlar

| Sorun | Çözüm |
|---|---|
| Expo Go "incompatible SDK" | SDK 51 → 54 |
| Web boş ekran | babel `transformImportMeta` plugin |
| FlashList v2 TS hata | FlatList'e geçildi |
| Input yazınca kaybolma | Local state, submit'te store |
| Light mode görünmez metinler | `useThemeColors()` hook |
| Firebase Storage ücretli | Cloudinary free tier'a geçildi |
| Tema görselleri bundle boyutu | Cloudinary URL → expo-image cache |
| Feed lokal seed data | Supabase offline-first sistemi |
| Profile → Name → Reminders gidiyordu | `/name-settings` route eklendi |
| Reminders Active Hours değiştirilemiyordu | RangeSlider geri eklendi |
| Uzun Arapça taşıyor | `arabicFontSize()` + `adjustsFontSizeToFit` |
| Dil değişince içerik değişmiyordu (cache fix) | `fetchFeedItems` `forceFresh` param + feed'de `prevLangRef` ile dil değişimi tespiti + `clearContentCache()` Save'de. Eski cache (İngilizce) artık dönmüyor. Web'de TR/FR/ID doğrulandı. |
| Tema görselleri Cloudinary'de | Supabase Storage `themes` bucket'a taşındı (`tools/upload-themes-to-supabase.mjs`) |
| Uzun içerik telefonda taşıyor/okunmuyor | **Import-level filtre** (`supabase-import.mjs` + `import-hadith.mjs`): Arapça >500 VEYA HERHANGİ bir dildeki çeviri >300 karakter → hiç yüklenmez. `removeOrphans()` keep-set dışındaki tüm eski/uzun kayıtları siler (upsert silmediği için şart). Doğrudan Supabase silme KALICI DEĞİL (re-import geri getirir) — filtre import'ta. Kalan: verses 395, hadiths 500, duas 78, quotes 198. |
| Hadis sayısı az (177) | `import-hadith.mjs` okunabilirlik filtresini SEÇİMDEN ÖNCE uyguluyor (30k ham → 2.5k okunabilir → 500 dengeli). Filtre tüm dilleri kontrol eder. Hadis 500'e çıktı (TR 483, FR 399, ID 249 — kaynak API çeviri kapsamı). |
| Arapça modu hâlâ "Arabic+English" gibiydi | `renderArabic` flag: Arabic modu sadece Arapça, diğerleri sadece çeviri (mutually exclusive) |
| Hadis hep Nawawi/aynı 12 geliyordu | `buildFeed` her türü `shuffle` ediyor, `source_priority` order kaldırıldı |
| Favorites yanlış içerik (rastgele ayet) | 4 tablo (verse/hadith/dua/quote) savedIds ile sorgulanır; boşsa seed yerine boş ekran |
| Feed 12 karttan sonra kaymıyordu | `snapToInterval` kaldırıldı (pagingEnabled ile çakışıyordu) + limit 30→100 |
| Ana renk krem'e geçiş (tam) | `darkMode` default `false`. Paylaşılan bileşenler (`OnboardingShell`, `OptionRow`, `ProgressDots`, `Stepper`, `name` input) `useThemeColors`'a bağlandı → krem zeminde koyu kahve metin. Özel hero ekranlar (faith-intro, preparing, streak-intro) metin renkleri krem-aware. `welcome` `forceDark` ile dark hero kaldı. `app.json` userInterfaceStyle/backgroundColor krem. |
| App icon | `assets/themes/icon.jpg` → app.json icon + splash + adaptiveIcon. NotifPreview bu icon'u gösterir. |
| Onboarding sırası (Vocabulary ref) | welcome→attribution→name→...→preparing→streak-intro→reminders(zengin notif)→theme-select→paywall. notifications.tsx orphan oldu. |
| Seçilince satır/kart taşıyordu | `OptionRow` + `IconGridCard`'tan `scale` transform kaldırıldı (full-width satırı ekran kenarından taşırıp sağdaki tik'i kırpıyordu → "tik yok" sanılıyordu). |
| Soru ekranlarında dekoratif ikon (kalp vb.) | Tüm SelectScreen/grid ekranlarından `icon` prop kaldırıldı (dini sade görünüm). |
| IconGridCard krem zeminde lacivertti | `useThemeColors`'a bağlandı (krem kart + altın ikon). |
| age 'center' variant tutarsız tik | `radio` variant'a çevrildi (dolu altın daire + beyaz tik, diğer ekranlarla tutarlı). |
| Paywall dark + karmaşık | Krem "Welcome offer" özel teklif ekranı: hediye ikonu + 63% discount başlık + altın tikli 3 madde + üstü çizili fiyat + Continue. RevenueCat mantığı korundu. |
| GoldButton disabled lacivertti | Krem-uyumlu açık taupe (`#DAD0BE`) + warm muted metin. |
| Language ekranı satırları lacivertti | language.tsx kendi `Row`'u `useThemeColors`'a bağlandı (krem kart + altın seçim). |
| RangeSlider Start/End yazısı görünmüyordu | `useThemeColors` (koyu metin) + handle border krem + track kontrastı. |
| StreakWidget krem zeminde görünmüyordu | Beyaz çerçeveli kart (border 2px), gün etiketleri ÜSTTE, dolu günler altın daire + beyaz tik, "Build a streak" caption. `banner` prop kaldırıldı. |
| NotifPreview "Salubrious" (eski app artığı) | İngilizce hadis + arkada ikinci bildirim "peek" efekti + kalın border. App icon `assets/icons/icon.png`. |
| GoldButton stadium köşe boşlukları | `radii.full`→`radii.xl` yuvarlak-dikdörtgen + gold glow yerine yumuşak nötr gölge. |
| Paywall jenerik hediye ikonu | App'in altın hilal icon'u (`assets/icons/icon.png`) — özgün/İslami marka. (Sadece special-offer'da; onboarding paywall'u orijinal weekly/yearly.) |
| İki paywall ekranı | `app/(onboarding)/paywall.tsx` = 3 kademeli plan (Annual -65% OFF/Monthly/Weekly), 5 özellik (5000+ verses/hadiths/duas, premium themes, reading mode, lock-screen widgets, ad-free), "Start my free trial", krem premium — onboarding sonu. `app/special-offer.tsx` = "We offer 7 days of premium" krem ekran, ara sıra `router.push('/special-offer')` ile (premium yapıp geri döner). İkisi de app icon (`assets/icons/icon.png`) kullanır. |
| Feed çift-tık & swipe animasyon | Slide'a `Gesture.Tap().numberOfTaps(2)` → kaydet + büyük altın kalp burst animasyonu (`heartBurst`). "Swipe up for next" chevron'u `withRepeat` ile zıplıyor (`SwipeHint`). |
| Notification hadis emoji hatası | ﷺ ligature kaldırıldı → "(peace be upon him)" düz metin. |
| App icon yeşildi (krem'e uymuyordu) | `assets/icons/icon.png` altın hilal+yıldız (app.json icon/splash/adaptiveIcon). |
| Namaz vakitleri statik İstanbul'du | `lib/prayerTimes.ts` yazıldı: `usePrayerTimes()` hook → `expo-location` izni ister → `adhan` (MuslimWorldLeague) hesaplar → `reverseGeocode` şehir adı → her dakika countdown günceller → fallback: İstanbul. |
| Home sırası yanlıştı (streak en sonda) | Prayer → **Streak** → **Daily Reflection** sırası. |
| saved-verses seed data kullanıyordu | Supabase'den `fetchFeedItems(['Favorites'])` ile çekiyor + krem-aware + boş durum "Double-tap to save" mesajı. |
| verse/[id] hardcoded koyu renk | `useThemeColors`'a bağlandı (meta chip, aksiyon butonları, similar cards). |
| language-settings hardcoded koyu renk | `useThemeColors`'a bağlandı. |

---

## Content sistemi (tools/)

```bash
npm run import:hadith    # ham hadith (7 koleksiyon: nawawi/bukhari/muslim/abudawud/tirmidhi/ibnmajah/malik)
npm run import:verses    # ham ayet, skorlama ile en popüler
npm run import:duas      # ham dua (fitrahive, EN+ID)
npm run build:quotes     # quote (verse+hadith'ten türetilmiş)
npm run db:import        # content/ → Supabase (UZUNLUK FİLTRESİ uygular: Arapça≤500, çeviri≤300)
```

⚠️ **db:import okunabilirlik filtresi uygular** — `MAX_ARABIC=500`, `MAX_TEXT=300` (TÜM diller).
Arapçası VEYA herhangi bir dildeki çevirisi eşik üstündeyse yüklenmez + Supabase'de varsa
`removeOrphans()` ile silinir. Aynı eşikler `import-hadith.mjs`'te de var (seçimden önce filtre).
Eşikleri değiştirirsen HER İKİ dosyada da güncelle.

**Yeni içerik ekleme akışı:**
1. `tools/` script'i çalıştır → `content/` güncellenir
2. `npm run db:import` → Supabase'e gider
3. Uygulama güncellenmeden tüm kullanıcılara gelir ✅

---

## i18n — Tam uygulama dil sistemi (`lib/i18n.ts`)

Artık dil değişince SADECE içerik değil **tüm arayüz** değişir (EN/TR/FR/ID/AR).

```typescript
const t = useT();                    // t('home.today') → 'Bugün'
<Text>{t('profile.savedCount', { n: 3 })}</Text>   // değişken interpolasyonu {n}
const locale = useLocaleTag();       // toLocaleDateString için 'tr-TR' vb. (tarihler de yerelleşir)
```

- `resolveUILang(stored)`: 'Turkish'→'tr', 'French'→'fr', 'Indonesian'→'id', 'Arabic'→'ar', diğer→'en'
- Eksik anahtar → İngilizce'ye düşer. Anahtarlar düz, nokta notasyonlu (`home.*`, `tile.*`, `prayer.*`, `qibla.*`, `tasbih.*`, `rem.*`, `profile.*`, `feed.*`).
- **Namaz adları da çevrilir** (`prayer.fajr` → TR 'Sabah', 'Öğle', 'İkindi', 'Akşam', 'Yatsı'). UI'da `t(\`prayer.${slot.key}\`)` ile render edilir — `slot.name` (İngilizce) DEĞİL.
- Bağlı ekranlar: home-card, feed, profile, qibla, dhikr, prayer-times, notifications-settings.
- Yeni string eklerken 5 dilin de `Dict`'ine ekle (eksikse en'e düşer ama tutarlılık için ekle).
- Dil değişimi `useT` store aboneliğiyle anında tüm ekranları yeniden render eder. İçerik (ayet/hadis) ayrıca `clearContentCache()` + feed refetch ile gelir (mevcut sistem).

## Bespoke ikonlar (`components/icons/AppGlyphs.tsx`)

Home grid Ionicons YERİNE özel SVG duotone glyph kullanır (premium görünüm):
`mosque, compass, beads, bell, widget, lockscreen, quran, dua`. Hepsi 24×24, 1.7px stroke,
`color` (ana çizgi) + `tint` (yumuşak dolgu). `<AppGlyph name="mosque" color={tc.gold} tint={tc.gold+'2E'} />`.
Yumuşak altın-tint rounded kare içinde tek renk altın → tutarlı tasarım dili.

## Bildirim merkezi (feed sağ üst)

Feed top-bar sağ üstte crown (premium) YANINA bildirim zili eklendi → `/notifications-settings`.
"Tüm bildirimler tek yerde" mantığı: ileride çok bildirim eklenecek, hepsi bu ekranda toplanır.
Profile'daki Notifications satırı + Reminders quick action da `/notifications-settings`'e gider.

---

## iOS Widget & Kilit Ekranı (WidgetKit)

**Sadece iOS.** Expo Go'da ÇALIŞMAZ → EAS dev/preview build şart.

**Mimari:**
```
RN app (lib/widgetSync.ts)
  → ExtensionStorage(@bacons/apple-targets) → App Group UserDefaults "noorWidgetData" (JSON)
  → ExtensionStorage.reloadWidget()
Widget extension (targets/widget/*.swift)
  → UserDefaults(suiteName: "group.com.noor.app") okur → SwiftUI render
```

**App Group:** `group.com.noor.app` (hem app.json `ios.entitlements` hem expo-target.config.js'de).

**Dosyalar:**
- `targets/widget/expo-target.config.js` — widget target tanımı (apple-targets plugin compile eder)
- `targets/widget/NoorWidgetData.swift` — Codable model + App Group okuyucu + nextPrayer/timeline yardımcıları
- `targets/widget/AppIntent.swift` — `WidgetContent` enum (auto/prayer/verse/streak) + config intent → kullanıcı "Edit Widget" ile içeriği seçer
- `targets/widget/Provider.swift` — AppIntentTimelineProvider (namaz vakitlerinde + saatlik entry → geri sayım app açılmadan döner)
- `targets/widget/Views.swift` — SwiftUI: systemSmall/Medium + accessoryInline/Circular/Rectangular (kilit ekranı)
- `targets/widget/NoorWidgetBundle.swift` — `@main` bundle
- `lib/widgetSync.ts` — `syncWidget({language, streakDays, force})`. iOS dışı no-op. `@bacons/apple-targets` LAZY require (web'de global `expo` yok → top-level import patlar). 60sn debounce.
- `app/widget-settings.tsx` — in-app ekran: içerik tipleri + "nasıl eklenir" adımları + "Refresh widgets now". Profile → Quick Actions "Widgets" buradan açılır.

**Senkron noktaları:** `home-card.tsx` açılışta + dil/streak/şehir değişince `syncWidget` çağırır.

**Veri sözleşmesi (noorWidgetData JSON):** verseArabic/Translation/Reference, city, prayers[{name,time,epoch}], tomorrowFajr, streakDays, updatedAt.

⚠️ **BUILD ÖNCESİ ZORUNLU:** `app.json` içindeki `@bacons/apple-targets` → `appleTeamId` şu an `REPLACE_WITH_APPLE_TEAM_ID`. Apple Developer Team ID ile değiştir, yoksa imzalama başarısız olur. App Group `group.com.noor.app` Apple Developer portalında + provisioning profile'da tanımlı olmalı.

**Build:** `eas build --profile development --platform ios` (Windows'ta sorun yok, build EAS bulutta/macOS'ta). Sonra dev client'ta widget eklenir.

## Konum bazlı namaz vakitleri (sağlamlaştırıldı)

`lib/prayerTimes.ts` — `usePrayerTimes()` + export `resolveLocation/computeSlots/nextPrayerInfo/countdownStr`.
- Konum AsyncStorage'a cache'lenir (`noor_last_location`) → açılışta izin beklemeden son şehir gösterilir.
- `getCurrentPositionAsync` 8sn timeout + `getLastKnownPositionAsync` fallback (asılı kalma fix'i).
- Fallback sırası: cache → İstanbul. Sunrise vakti de eklendi (6 slot, home-card space-between sığar).
- `computeSlots/resolveLocation` widget senkronu tarafından da kullanılır (tek kaynak).

---

## Sonraki adımlar

- **Push notifications**: `expo-notifications` kurulu, scheduling yazılmadı
- **Supabase Auth**: Kullanıcı hesabı, streak sync, premium durum
- **Duas TR/FR**: Güvenilir kaynak yok, şimdilik EN+ID
- **`translation.tsx`**: Akışta yok, silinebilir
- **`settings.tsx` (tabs)**: Hiçbir yere bağlı değil (orphan), silinebilir
- **Tema galerisi → Supabase**: `fetchThemes()` var, `themes.tsx` hâlâ lokal `data/themes.ts` kullanıyor
- **special-offer tetikleyici**: `router.push('/special-offer')` hazır, hangi senaryoda çıkacağına karar verilmeli (X gün sonra, crown butonu vb.)

---

## Geliştirme komutları

```bash
npx expo start --tunnel --clear   # telefon (Expo Go SDK 54)
npx expo start --clear            # web: açılınca 'w'
npm run typecheck                 # 0 hata olmalı
npm run db:import                 # content → Supabase
```

**Web test (tarayıcı console):**
```javascript
localStorage.setItem('noor-onboarding', JSON.stringify({
  state: { name: 'Tolga', isCompleted: true, selectedTheme: 1, language: 'Turkish' }, version: 0
}));
localStorage.setItem('noor-app', JSON.stringify({
  state: { savedVerseIds: ['v1','v6'], streakDays: 7, isPremium: false,
           darkMode: true, currentVerseIndex: 0, followedTopics: ['General'] }, version: 0
}));
location.reload();
```
