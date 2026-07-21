# Huda — Islamic Companion App
> Yeni konuşmalar için tam bağlam rehberi. Bunu oku, sormadan devam et.

---

## Uygulama Durumu

**🟢 CANLI — App Store'da yayında** (Haziran 2026)
- Bundle: `com.tolgaoturan.huda`
- EAS slug: `noor` (Expo Dashboard proje adı — uygulama adı Huda)
- App fiyatı: **Free** (gelir IAP aboneliklerinden)
- Abonelik planları: Annual (-65%) / Monthly / Weekly — RevenueCat ile yönetilir

---

## Tolga ile çalışma kuralları

- Kısa ve net konuş. Uzun açıklama yapma.
- Bir şeyi beğenmezse direk söyler — savunmaya geçme, hemen düzelt.
- Tasarım değişikliklerinde referans görsel/ekran görüntüsü verir, birebir uygula.
- **İslami ikonlar serbest** (Kâbe, cami, hilal, yıldız, tesbih, geometrik desen, altın aksan). Minimalist tut. **Diğer dinlerin sembolleri YASAK** — Hristiyanlık (haç), Yahudilik (Davud yıldızı) vb.
- Önce çalış, sonra açıkla. Kodu yaz, sonra ne yaptığını 3-4 satırda özetle.
- Her ekran `useThemeColors()` kullanmalı — hardcoded renk yasak.
- Rebuild gerektiren değişiklikler (Swift, app.json native config) için mutlaka uyar.

---

## Projenin özü

**Huda** — günlük İslami ayet, dua, hadis ve alıntı sunan bir mobil uygulama.

**Tema:** Krem/warm — `darkMode` default `false`. Altın aksanlar, gerçek cami fotoğrafları. Dark mode settings'te toggle ile açılır. `welcome.tsx` hariç her yer krem.

**Çalıştır:**
```bash
npx expo start --tunnel --clear   # telefon (Expo Go SDK 54)
npx expo start --clear            # web → 'w'
npm run typecheck                  # 0 hata olmalı
node tools/build-offline-content.mjs  # content/ → data/offlineContent.ts (gömülü, Supabase YOK)
eas build --profile development --platform ios  # Swift değişikliklerinde
```

**Web test (console):**
```javascript
localStorage.setItem('huda-onboarding', JSON.stringify({
  state: { name: 'Tolga', isCompleted: true, selectedTheme: 2, language: 'Turkish' }, version: 1
}));
localStorage.setItem('huda-app', JSON.stringify({
  state: { savedVerseIds: [], streakDays: 7, isPremium: true,
           darkMode: false, currentVerseIndex: 0, followedTopics: ['General'],
           homeWidgetContent: 'auto', lockWidgetContent: 'verse' }, version: 0
}));
location.reload();
```

---

## Tech Stack

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
| SVG | react-native-svg | 15.12.1 |
| Image | expo-image | ~3.0.11 |
| Fonts | playfair-display, plus-jakarta-sans, amiri | ^0.4.x |
| Haptics | expo-haptics | ~15.0.8 |
| Notifications | expo-notifications | ~0.32.17 |
| Konum | expo-location | ~19.0.8 |
| Namaz vakti | adhan | ^4.4.3 |
| RevenueCat | react-native-purchases | — |
| Analytics | posthog-react-native | — |
| RN | react-native | 0.81.5 |

**Kritik babel notu:** `babel.config.js`'de inline `transformImportMeta` plugin var (zustand devtools `import.meta` → web'de hata veriyordu). `react-native-reanimated/plugin` daima en sona gelir.

---

## Dizin yapısı

```
islam-app/
├── app/
│   ├── _layout.tsx               ← Root stack + fonts + GestureHandler + PostHog + RevenueCat + RTL sync
│   ├── index.tsx                 ← Gate: isCompleted → feed, değilse → welcome
│   │
│   ├── (onboarding)/             ← GÜNCEL AKIŞ (aşağıda detay)
│   │   ├── welcome.tsx           ← forceDark hero, star trails SVG
│   │   ├── attribution.tsx       ← "How did you hear" — skip'lenebilir
│   │   ├── name.tsx              ← LOCAL STATE input (store'a submit'te yaz)
│   │   ├── age.tsx               ← radio variant
│   │   ├── faith-intro.tsx       ← GlowArch animasyonu + serene-arch arka plan
│   │   ├── intention.tsx         ← multi-select → content-select'e gider
│   │   ├── content-select.tsx    ← 2×3 icon grid → home-pref'e gider
│   │   ├── home-pref.tsx         ← multi-select → language'a gider
│   │   ├── language.tsx          ← → preparing'e gider
│   │   ├── preparing.tsx         ← SparkleField + auto-advance
│   │   ├── streak-intro.tsx      ← Tesbih ring animasyonu (33 bead, dönen, altın) — Crescent KALDIRILDI
│   │   ├── reminders.tsx         ← Stepper + RangeSlider + bildirim izni
│   │   ├── theme-select.tsx      ← Gerçek fotoğraf grid → first-verse'e gider
│   │   ├── first-verse.tsx       ← Aha-moment: seçili tema üstünde Daily Wisdom, swipe-up → complete()+paywall
│   │   └── paywall.tsx           ← Akışın SON adımı (2026-07'de geri eklendi) — 3 plan, RevenueCat, ?source=onboarding
│   │   [ORPHAN — akışta değil]: feeling.tsx, usage.tsx, notifications.tsx, translation.tsx
│   │
│   ├── (tabs)/
│   │   ├── _layout.tsx           ← tabBar: () => null — alt bar YOK
│   │   ├── feed.tsx              ← ANA SAYFA: immersive feed, çift-tık kaydet, swipe
│   │   ├── home-card.tsx         ← "Today" hub: namaz kartı + apps grid
│   │   ├── themes.tsx            ← 3-kolon galeri (38 tema)
│   │   ├── profile.tsx           ← Identity + premium + quick actions + settings + redeem
│   │   └── settings.tsx          ← ORPHAN (hiçbir yere bağlı değil, silinebilir)
│   │
│   ├── verse/[id].tsx            ← Ayet detay (slide_from_bottom)
│   ├── explore-topics.tsx        ← Browse + followed topics (slide_from_bottom)
│   ├── saved-verses.tsx          ← Gömülü havuzdan Favorites (fetchFeedItems(['Favorites']))
│   ├── dhikr.tsx                 ← Tesbih sayacı — custom dhikr modal ile
│   ├── qibla.tsx                 ← SVG pusula + expo-location heading
│   ├── prayer-times.tsx          ← Tam günlük takvim
│   ├── notifications-settings.tsx← Namaz + içerik bildirimleri
│   ├── reminders-settings.tsx    ← Stepper + RangeSlider
│   ├── language-settings.tsx     ← Dil seçimi
│   ├── name-settings.tsx         ← İsim düzenleme
│   ├── widget-settings.tsx       ← Home/Lock sekmeli, içerik seçici grid + background seçici
│   ├── widget-studio.tsx         ← Widget studio ekranı
│   ├── location-setup.tsx        ← Premium konum ekranı — izin red → inline banner
│   ├── special-offer.tsx         ← İndirimli yıllık teklif — TETİKLERİ DEVRE DIŞI (Tolga kararı)
│   └── categories.tsx            ← BottomSheet + 4 tile
│
├── components/
│   ├── arabic/ArabicText.tsx     ← Amiri font, rtl — DAIMA bunu kullan
│   ├── anim/
│   │   ├── Sparkles.tsx
│   │   ├── Crescent.tsx          ← RadialRays + StarTrails da burada
│   │   └── GlowArch.tsx          ← faith-intro'da kullanılıyor
│   ├── icons/AppGlyphs.tsx       ← SVG duotone glyph: mosque/compass/beads/bell/widget/lockscreen
│   ├── onboarding/
│   │   └── SelectScreen.tsx      ← Onboarding seçim ekranı base component
│   ├── ui/
│   │   ├── GoldButton.tsx        ← shimmer animasyonu, disabled: taupe renk
│   │   ├── GhostButton.tsx
│   │   ├── OptionRow.tsx         ← check/radio variant, scale transform YOK
│   │   ├── IconGridCard.tsx      ← useThemeColors bağlı
│   │   ├── VerseCard.tsx
│   │   ├── StreakWidget.tsx       ← flame ikonu YOK, beyaz çerçeve, altın daire + tik
│   │   ├── RangeSlider.tsx       ← çift tutamaç, dakika → "HH:MM"
│   │   ├── Stepper.tsx
│   │   ├── ToggleSwitch.tsx
│   │   ├── BackButton.tsx
│   │   ├── ProgressDots.tsx
│   │   ├── ThemeTile.tsx
│   │   ├── NotifPreview.tsx
│   │   └── NotifShowcase.tsx
│   ├── ErrorBoundary.tsx         ← Tüm ağacı sarar
│   └── layout/
│       ├── ScreenContainer.tsx
│       ├── OnboardingShell.tsx
│       ├── FloatingTabBar.tsx
│       └── BottomSheet.tsx
│
├── stores/
│   ├── useOnboardingStore.ts     ← key: 'huda-onboarding'
│   └── useAppStore.ts            ← key: 'huda-app'
│
├── lib/
│   ├── useThemeColors.ts         ← TÜM ekranlar bunu kullanır
│   ├── i18n.ts                   ← useT() + useLocaleTag()
│   ├── contentDb.ts              ← GÖMÜLÜ içerik, senkron, Supabase YOK (2026-06 kaldırıldı)
│   ├── prayerTimes.ts            ← usePrayerTimes() + computeSlots + resolveLocation
│   ├── prayerSettings.ts         ← Namaz hesap ayarları
│   ├── widgetSync.ts             ← iOS widget sync: feed items + weather + prayers
│   ├── notifications.ts          ← schedulePrayerNotifications + scheduleDailyVerse
│   ├── revenueCat.ts             ← useConfigureRevenueCat() + satın alma fonksiyonları
│   ├── weather.ts                ← Open-Meteo hava durumu
│   ├── hijri.ts                  ← Hicri takvim dönüşümü
│   ├── rtl.ts                    ← syncRTLOnStartup — Arapça dil RTL düzeni
│   ├── useRTL.ts                 ← RTL hook
│   ├── haptics.ts
│   └── cities.ts                 ← offline şehir listesi (location-setup için)
│
├── targets/widget/               ← iOS WidgetKit (EAS build gerekir)
│   ├── NoorWidgetBundle.swift    ← 9 widget tanımı
│   ├── NoorWidgetData.swift      ← HudaWidgetData + FeedItemData + WeatherData + DhikrState
│   ├── Provider.swift            ← StaticConfiguration provider + ImageIO downsample
│   ├── AppIntent.swift           ← Next/Prev/Like/DhikrTap/DhikrReset intents
│   └── Views.swift               ← 9 widget görünümü
│
├── data/
│   ├── types.ts
│   ├── offlineContent.ts         ← GERÇEK içerik kaynağı: OFFLINE_CONTENT + OFFLINE_REFLECTIONS +
│   │                                OFFLINE_NAMES. Generator çıktısı, EL İLE DÜZENLEME YOK.
│   ├── verses.ts, duas.ts, hadiths.ts, quotes.ts  ← ESKİ seed dosyaları, contentDb.ts ARTIK KULLANMIYOR
│   │                                (widget-studio.tsx hâlâ verses.ts import ediyor — kontrol et)
│   ├── themeAssets.ts            ← tema görsellerini bundle'a gömen require() haritası
│   └── themes.ts                 ← 38 tema; `image.uri` Supabase URL formatında ama
│                                    localThemeSource()/localThemeThumb() ile gömülü görsele çevrilir.
│                                    TEK istisna: iOS widget (Swift) bu URL'yi native tarafta kullanıyor.
│
└── tools/
    ├── build-offline-content.mjs ← content/ → data/offlineContent.ts (GÜNCEL üretim yolu)
    ├── import-hadith.mjs, import-quran-verses.mjs, import-duas.mjs, import-asmaul-husna.mjs
    ├── build-quotes-from-content.mjs
    └── supabase-schema.sql, supabase-import.mjs, upload-themes-to-supabase.mjs, vb.
        ← ESKİ Supabase araçları, artık kullanılmıyor (silinmedi, gerekirse temizlenebilir)
```

---

## Onboarding Akışı (GÜNCEL)

```
welcome → attribution → name → age → faith-intro
→ intention → content-select → home-pref
→ language → preparing → streak-intro → reminders → theme-select → first-verse → paywall → feed
```

**Not (2026-07 güncel):** `paywall.tsx` akışın SON adımı — `first-verse.tsx` `complete()`
çağırıp `router.replace('/(onboarding)/paywall?source=onboarding')` yapar. Paywall'ın
`finish()`'i `source==='onboarding'` özel durumunda `router.back()` DEĞİL, direkt
`router.replace('/(tabs)/feed')` yapar (aksi halde X'e basınca first-verse'e geri dönerdi).
Paywall ayrıca crown/locked-topic/locked-theme/günlük-limit gibi diğer noktalardan da
`?source=` ile açılıyor — oralarda davranış değişmedi (`router.back()`).

**ProgressDots:** `OnboardingShell` `totalSteps=9`, adımlar sırayla
attribution(0)·name(1)·age(2)·intention(3)·content-select(4)·home-pref(5)·language(6)·
reminders(7)·theme-select(8). Yeni bir form ekranı eklenirse/sıra değişirse BU numaraları güncelle.

**Kaldırılanlar (akışta YOK):**
- `feeling.tsx` — "What is most present in your heart" → ÇIKARILDI
- `usage.tsx` — "How do you plan to use this app" → ÇIKARILDI
- `quran-relation.tsx` — zaten kaldırılmıştı

**faith-intro.tsx:** GlowArch animasyonu (altın kemer + hilal + yıldız SVG) + serene-arch arka plan. Bu ekranı değiştirme — Tolga onayladı.

**streak-intro.tsx:** Crescent kaldırıldı → **Tesbih ring animasyonu** (33 bead, dönen, altın). Ortada "١" (Arabic 1) + "DAY".

---

## Navigasyon & Ekranlar

```
/(tabs)/feed           ANA SAYFA
  sol üst: 🏠 → home-card
  sağ üst: 🔔 → notifications-settings  |  👑 → paywall
  sol alt: ▦ → explore-topics
  sağ alt: 👤 → profile
  çift-tık: kaydet + kalp burst animasyonu

/home-card             Today hub: namaz kartı + 6 tile grid
/explore-topics        Browse topics (slide_from_bottom)
/profile               Identity + premium banner + quick actions + settings
  → /saved-verses      Kayıtlı içerik (gömülü havuzdan fetchFeedItems(['Favorites']))
  → /notifications-settings
  → /name-settings
  → /language-settings
  → paywall

/dhikr                 Tesbih sayacı + custom dhikr ekleme modalı
/qibla                 SVG pusula
/prayer-times          Tam namaz takvimi
/widget-settings       Home/Lock sekmeli widget içerik seçici + background seçici
/widget-studio         Widget studio
/location-setup        Premium tasarımlı konum ekranı
/special-offer         İndirimli yıllık teklif — tetikler DEVRE DIŞI (ekran duruyor, paywall.tsx + monetization.ts'te yorumlu)
```

---

## State Yönetimi

### useOnboardingStore — `'huda-onboarding'`
```typescript
name, age, intentions[], feeling, quranRelation,
contentTypes[], contentStyle[], usage[], homePreference[],
language,        // 'English' | 'Turkish' | 'French' | 'Indonesian' | 'Arabic'
reminderCount,
reminderStart,   // "HH:MM"
reminderEnd,     // "HH:MM"
selectedTheme, attribution, isCompleted

set(key, value) | toggleArrayItem(key, value) | complete() | reset()
```

### useAppStore — `'huda-app'`
```typescript
savedVerseIds[],
streakDays, lastOpenDate,
isPremium, darkMode,
currentVerseIndex,
followedTopics[],          // default: ['General']
homeWidgetContent,         // 'auto'|'prayer'|'verse'|'hadith'|'quote'|'streak'
lockWidgetContent,         // default 'verse'
widgetThemeId,             // null=app teması, 0=minimal, diğer=tema id
dhikrTotal, dhikrToday, dhikrTodayDate,

toggleSave(verse) | isSaved(id) | registerOpen()
setPremium(v) | setDarkMode(v)
toggleFollowTopic(topic) | isFollowed(topic)
setHomeWidgetContent(t) | setLockWidgetContent(t)
addDhikr(count) | absorbDhikrTotal(n)
```

---

## Renk Sistemi

### `useThemeColors()` — zorunlu, hardcoded renk YASAK

```typescript
const tc = useThemeColors();
// tc.heading, tc.body, tc.muted
// tc.cardBg, tc.raisedBg, tc.border
// tc.gold, tc.onGold
// tc.isDark → boolean
```

### Krem (default, darkMode=false)
```
bg:     #F2EDE4 (surface), #EDE7DC (card), #E4DDD3 (raised)
border: rgba(180,155,120,0.25)
gold:   #C9963A / soft: #D4A855
text:   #2C2418 (heading), #5C4F3D (body), #9C8E7D (muted)
```

### Dark (toggle ile)
```
bg:     #0A1230 (midnight), #161E3D (card), #1E2A52 (raised)
gold:   #D4AF37 / bright: #E8C766 / deep: #B8902E
text:   #F5F0E1 (heading), #C3C9DE (body), #828BAD (muted)
```

### Typography
- **Playfair Display** → `fonts.serif / serifBold` — başlıklar
- **Plus Jakarta Sans** → `fonts.sans / sansMedium / sansBold / sansSemibold` — UI
- **Amiri** → `fonts.arabic / arabicBold` — TÜM Arapça metin (`<ArabicText>` ile)

---

## RevenueCat

`lib/revenueCat.ts` — `useConfigureRevenueCat()` _layout.tsx'te çağrılır.
- Abonelik planları: Annual / Monthly / Weekly
- `paywall.tsx` RevenueCat purchase fonksiyonlarını kullanır
- `setPremium(true/false)` useAppStore'a yansır
- Restore Purchase → profile'dan

---

## Supabase — TAMAMEN KALDIRILDI (2026-06-19)

Sebep: egress kotası dolunca proje (storage + DB REST) **HTTP 402 Payment Required**
dönmeye başladı → içerik + welcome video + widget görselleri yüklenmiyordu. Geri
dönülmeyecek bir karar — Supabase artık kullanılmıyor.

**Ne değişti:** Tüm içerik (`verses`/`hadiths`/`duas`/`quotes`/reflections/99 isim) artık
`content/` klasöründen `tools/build-offline-content.mjs` ile üretilip **app bundle'ına
gömülü** (`data/offlineContent.ts`, ~1.8MB, 1390 item). `lib/supabase.ts` silindi,
`@supabase/supabase-js` package.json'dan kaldırıldı. İçerik değiştirmek artık
**app güncellemesi** gerektirir (canlı DB yok).

**KALAN tek istisna:** `data/themes.ts`'teki tema görsel URL'leri (Supabase Storage
formatında) — SADECE iOS widget (native Swift, bundle'a erişemiyor) bunları kullanır.
Uygulama içi tüm görseller `themeAssets.ts` üzerinden gömülü. Yani Supabase 402 hâlâ
çözülmezse **widget arka planları** yüklenmez ama uygulama içi hiçbir şey etkilenmez.
Widget bg'yi de App Group'a gömme işi bilinçli olarak ileriye bırakıldı.

---

## lib/contentDb.ts — GÖMÜLÜ içerik katmanı (senkron, ağ çağrısı yok)

```typescript
fetchFeedItems(lang, limit, followedTopics, isPremium, savedIds, _forceFresh, arabicOnly) → Promise<FeedItem[]>
                                  // _forceFresh imza uyumluluğu için duruyor, artık anlamsız (cache yok)
getOfflineFeedItems(lang, arabicOnly, topics) → FeedItem[]   // senkron havuz erişimi
getDailyReflection(lang, arabicOnly) → FeedItem | null       // first-verse.tsx aha-moment
fetchItemById(id, lang) → Promise<FeedItem | null>
clearContentCache() → void   // geriye dönük: eski Supabase-dönemi cache anahtarlarını siler
resolveLang(stored) → Lang   // 'Turkish'→tr,'French'→fr,'Indonesian'→id,'German'→de,'Urdu'→ur, diğer→en
```

**İçerik erişim:**
- Ücretsiz: `General` (Daily Wisdom = reflections), `Favorites`
- Premium: `Quran Verses`, `Hadiths`, `Duas & Prayers`, `Islamic Quotes`, `99 Names`, diğer konular
- **General feed ASLA Quran ayeti göstermez** — `isDailyWisdomFeed` guard'ı `kind==='verse'`
  öğelerini eler. İstisna: saf `Favorites` (saved-verses) — kullanıcının kaydettiği ayetler
  gösterilir, filtre uygulanmaz.
- Dilde reflection yetersizse (< 8) İngilizce ile tamamlanır (Arapça hariç — RTL kuralı)
- Duas TR/FR çevirisi yok → sadece `en`/`id` (`DUA_LANGS`)
- `de` dilinde hadis çevirisi YOK → o kombinasyonda hadith feed boş kalır (içerik boşluğu, kod hatası değil)

---

## Dil Sistemi

**i18n:** `useT()` + `useLocaleTag()` — tüm UI değişir.
```typescript
const t = useT();
t('home.today')                           // → 'Bugün'
t('profile.savedCount', { n: 3 })         // → '3 saved'
```

**resolveLang:** 'Turkish'→'tr', 'French'→'fr', 'Indonesian'→'id', 'German'→'de', 'Urdu'→'ur', 'Arabic'→'en', diğer→'en'

**RTL:** `lib/rtl.ts` → `syncRTLOnStartup(lang)` — Arapça seçilince I18nManager.forceRTL(true) + reload.
`lib/useRTL.ts` — ekranlarda RTL durumunu okumak için.

**Feed Arapça kuralı (MUTUALLY EXCLUSIVE):**
- `language === 'Arabic'` → SADECE Arapça göster
- Diğer diller → SADECE çeviri göster (Arapça yok)

---

## dhikr.tsx — Tesbih Ekranı

Altta "CHOOSE DHIKR" + "+ Custom" butonlu yatay kaydırmalı seçici.
- Her tile: Arapça metin + transliterasyon + hedef sayı
- Seçili tile: koyu arka plan (dark modda lacivert, krem modda koyu kahve)
- **+ Custom modal:** Arapça (opsiyonel), isim, hedef sayı → listeye ekler, otomatik seçer
- 5 varsayılan: SubhanAllah×33, Alhamdulillah×33, Allahu Akbar×34, La ilaha illallah×100, Astaghfirullah×100
- `useFocusEffect` ile widget'taki çekimleri absorb, her tap shared'a yazar
- Stat satırı: rounds (oturum) · today · all time (kalıcı)

---

## Monetizasyon Akışı (lib/monetization.ts)

**İki gating mekanizması birlikte çalışıyor:**

1. **Onboarding sonu paywall (2026-07'de geri eklendi).** `theme-select.tsx` →
   `first-verse.tsx` (aha-moment) → `complete()` + `paywall?source=onboarding` →
   satın al/restore veya X ile kapat → `feed`. Bu adımda `source==='onboarding'`
   olduğu için paywall'ın `finish()`'i `router.back()` YAPMAZ (first-verse'e
   dönmesin diye), direkt `router.replace('/(tabs)/feed')` yapar.
2. **Günlük swipe-limiti (2026-06-18'den beri).** `useAppStore`: `FREE_DAILY_LIMIT = 15`
   (`stores/useAppStore.ts`), `freeViewsDate`/`freeViewsUsed`, `registerContentView()` /
   `freeLimitReached()`. Gece yarısı (yerel saat) sıfırlanır. Feed `onViewable`'da her
   yeni içerik sayılır (geri kaydırma saymaz); limit dolunca ileri kaydırma
   `paywall?source=daily_limit`'e düşer + son görülebilir karta snap-back.
   PostHog: `daily_limit_hit`. Bu noktada paywall `router.back()` ile geldiği karta döner.

2. açılış paywall'ı ve feed-içi interstitial/end-card (UpsellSlide) hâlâ KALDIRILMIŞ
durumda — geri getirilmedi, sadece onboarding-sonu paywall'ı geri geldi.

**Diğer kararlar:**
- **Promo kod sistemi KALDIRILDI** (sızıntı riski). `promoUnlocked` alanı store'da
  duruyor — geçmişte redeem etmiş kullanıcılar premium kalır, yeni redeem yolu yok.
- **Paywall**: Annual default seçili, X butonu 2.5 sn gecikmeli.
- **special-offer.tsx**: TETİKLERİ DEVRE DIŞI (Tolga kararı 2026-06). Ekran + altyapı
  duruyor; açmak için paywall.tsx skip'i ve monetization.ts registerSession'daki
  yorum satırlarını geri al. RevenueCat `winback` offering, 24h sayaç hazır.
- **Kilitli topic**: explore-topics'te direkt paywall yerine örnek içerikli BottomSheet.
- **Trial bildirimi**: `scheduleTrialEndReminder()` — trial bitmeden 1 gün önce 11:00.
- PostHog: `trial_started`, `daily_limit_hit`, `special_offer_*` eventleri.

---

## widget-settings.tsx — Widget Ayarları

İki sekme: **Home Screen** / **Lock Screen**
Her sekmede içerik seçici grid:
- Prayer Times, Verse of the Day, Hadith (👑), Quote (👑), Streak, Smart (Auto)
- Seçim `useAppStore`'a kaydedilir
- "Apply & refresh widget" → `syncWidget` çağırır
- Her sekmenin kendi "How to add" adımları var

**Widget background seçici** (global, sekme bağımsız):
- `useAppStore.widgetThemeId`: `null`=app teması izle, `0`=minimal (görsel yok → gradient), diğer=tema id
- `resolveWidgetBgURL(widgetThemeId, selectedTheme)` (data/themes.ts) → widget bg URL'si
- App teması + Minimal + tüm temalar yatay thumbnail grid
- home-card.tsx ve widget-settings.tsx bu helper ile `themeImageURL` çözer
- Widget arka planı uygulama temasından BAĞIMSIZ

---

## location-setup.tsx — Konum Ekranı

**Premium tasarım:** Animasyonlu compass hero (pulse rings + dönen tick marks), feature pills (Prayer times · Qibla · Sunrise), privacy notu.

**İzin reddedilince:** Manuel şehir sayfasına yönlendirme YOK. Aynı ekranda inline banner: "Location access is off. Enable it in Settings or choose your city below." + "Choose my city" butonu.

---

## iOS Widget Sistemi (WidgetKit)

> ⚠️ Expo Go'da ÇALIŞMAZ. Her Swift değişikliği EAS rebuild gerektirir.
> `eas build --profile development --platform ios`

**Bundle ID'ler — ASLA değiştirme:**
| Target | Bundle Identifier |
|---|---|
| Ana uygulama | `com.tolgaoturan.huda` |
| Widget target | `com.tolgaoturan.huda.widget` |

**EAS:** slug=`noor` (Expo Dashboard proje adı), uygulama adı Huda'dır — karıştırma.

**App Group:** `group.com.tolgaoturan.huda`
**UserDefaults key:** `hudaWidgetData`
**Feed index key:** `hudaFeedIndex`
**Liked key:** `hudaWidgetLiked`
**Dhikr key:** `hudaDhikr` — app + widget ortak tesbih sayacı

### 10 Widget (NoorWidgetBundle.swift)

| # | Kind | Boyut | İçerik |
|---|---|---|---|
| 1 | `HudaFeedSmall` | Small | Tek kart (verse/hadith/quote) + ❤️ (iOS 17+) |
| 2 | `HudaFeedMedium` | Medium | ← → butonlu gezinme + dots (iOS 17+) |
| 3 | `HudaFeedLarge` | Large | Temiz okuma: Arapça + çeviri, düğme yok |
| 4 | `HudaNextPrayer` | Small + Lock | Sıradaki namaz + geri sayım |
| 5 | `HudaNextPrayerMedium` | Medium | Next büyük + 5 vaktin mini tablosu |
| 6 | `HudaPrayerTimes` | Large | Tam takvim + altta günün ayeti |
| 7 | `HudaWeather` | Medium | Sol: hava durumu, Sağ: namaz tablosu |
| 8 | `HudaStreak` | Small | Streak sayısı |
| 9 | `HudaDhikr` | Small | Tesbih sayacı — tıkla say, hedefte (33) tur tamamla, döngü |
| 10 | `HudaVerseLock` | Lock (Rect+Inline) | Günün ayeti — kilit ekranı, arka plansız (accessory tinted) |

**Widget gallery'de açıklama (2. başlık) KALDIRILDI** — sadece `.configurationDisplayName`, `.description` yok.

**systemSmall boş/beyaz render FIX:** Eski `themeBackground(fill:false)` full-res blur + çift görsel yapıp systemSmall bellek bütçesini aşıyordu → boş render. Artık küçük widget'lar `smallBackground` + ImageIO downsample (maxPixel 360, blur YOK) kullanır. `HudaEntry.themeImageSmall` ayrı tutulur.

### iOS 17+ Interactive Buttons
- `NextItemIntent` — feedIndex++ → widget reload
- `PrevItemIntent` — feedIndex-- → widget reload
- `LikeItemIntent` — item ID'yi `hudaWidgetLiked`'a yazar
- `DhikrTapIntent` — `hudaDhikr` count++ → hedefte rounds++, count=0; total++ → reload
- `DhikrResetIntent` — count/rounds=0 (total korunur)

### widgetSync.ts
```typescript
syncWidget({
  language, streakDays, force?,
  followedTopics,   // topic filtresi
  isPremium,        // premium kontrol
  savedVerseIds,    // favorites için
})
```
- `fetchFeedItems` ile 10 item çeker (topic + premium aware)
- Open-Meteo API'den hava durumu (ücretsiz, API key yok) — `lib/weather.ts`
- 60sn debounce, `force:true` ile atlanır
- `home-card.tsx`'den çağrılır: açılışta + dil/streak/şehir/premium değişince

### Veri Sözleşmesi (JSON)
```json
{
  "feedItems": [{"id":"v1","kind":"verse","arabic":"...","text":"...","meta":"Al-Fatiha 1:1"}],
  "weather":   {"temp":"18°","high":"22°","low":"12°","condition":"Partly Cloudy","sfSymbol":"cloud.sun.fill"},
  "city":      "Istanbul",
  "prayers":   [{"name":"Fajr","time":"05:12","epoch":1234567890}],
  "tomorrowFajr": {"name":"Fajr","time":"05:11","epoch":1234654290},
  "streakDays": 7,
  "updatedAt":  1234567890
}
```

### Build Öncesi Zorunlu
- `app.json` → `@bacons/apple-targets` → `appleTeamId: "REPLACE_WITH_APPLE_TEAM_ID"`
- App Group `group.com.tolgaoturan.huda` Apple Developer + provisioning profile'da tanımlı olmalı

---

## Namaz Vakitleri

`lib/prayerTimes.ts` — `usePrayerTimes()` hook
- `expo-location` izni → `adhan` (MuslimWorldLeague) hesaplar → `reverseGeocode` şehir
- AsyncStorage cache (`noor_last_location`) → izin beklemeden son şehir gösterilir
- `getCurrentPositionAsync` 8sn timeout + `getLastKnownPositionAsync` fallback
- Fallback: İstanbul
- `computeSlots / resolveLocation` → widget sync de kullanır (tek kaynak)
- `lib/prayerSettings.ts` → hesap metodu ayarları

---

## Kritik Kurallar

1. **Arapça metin** → `<ArabicText>` component. Latin placeholder YASAK.
2. **Animasyonlar** → SADECE `react-native-reanimated v4`. Core `Animated` YASAK.
3. **Listeler** → `FlatList`. FlashList v2 kırık.
4. **Her etkileşim** → `haptic.*` çağrısı.
5. **İkonlar** → İslami ikonlar serbest (Kâbe, cami, hilal, yıldız, tesbih, geometrik, altın). Diğer dinlerin sembolleri (haç, Davud yıldızı) YASAK.
6. **Dark/Light** → `useThemeColors()`. Hardcoded renk yasak.
7. **Input** → LOCAL state kullan, submit'te store'a yaz (`name.tsx` örneği).
8. **İçerik** → Supabase YOK, her şey `data/offlineContent.ts`'e gömülü. Değiştirmek için
   `content/` güncelle → `node tools/build-offline-content.mjs` → app güncellemesi yayınla.
9. **RangeSlider** → store'da "HH:MM" string, slider dakika (number). Dönüşüm reminders-settings.tsx'te.
10. **Dil değişimi** → Feed'de `prevLangRef` ile tespit edilir (ağ çağrısı yok, anında yeniden hesaplanır).
11. **Arka planlar** → `themeAssets.ts` üzerinden gömülü `require()` + `expo-image`. Widget (Swift) İSTİSNA: hâlâ Supabase URL.
12. **Accessibility** → `accessibilityRole` + `accessibilityLabel` her interaktif elemana.

---

## Profile Ekranı

```
← Profile
├── Identity card (avatar initials + name + plan badge + streak pill)
├── Premium banner → paywall  [sadece free user]
├── Redeem a Code → /promo-code  [sadece free user]
├── Quick Actions: Saved Verses · Reminders
├── Appearance: Theme → /themes | Dark Mode toggle
├── Account: Name → /name-settings | Language → /language-settings
├── Support: Rate App | Contact Us | About
└── Legal: Privacy | Terms | Restore Purchase
```

---

## Feed Ekranı

- `fetchFeedItems(lang, 250, followedTopics, isPremium, savedIds, langChanged, showArabic)` — limit 250
- Çift-tık → kaydet + kalp burst animasyonu (`heartBurst`)
- "Swipe up" chevron → `withRepeat` zıplama (`SwipeHint`)
- Kind badge yok
- `snapToInterval` yok (pagingEnabled ile çakışıyordu)

---

## Paywall Sistemi

| Ekran | Amaç | Açılış |
|---|---|---|
| `/(onboarding)/paywall.tsx` | Annual default, gecikmeli X, `?source=` | **onboarding akışının son adımı** (first-verse sonrası) + crown/locked_topic/locked_theme/widget/daily_limit |
| `/special-offer.tsx` | İndirimli yıllık (winback) + 24h sayaç | TETİKLERİ DEVRE DIŞI (bkz. Monetizasyon) |

---

## Temalar (data/themes.ts)

38 tema — `backgroundThemes` dizisi. ID 1-38. Tüm görseller `themeAssets.ts` üzerinden gömülü.
- **Free:** Sunset Arch (2), Grand Interior (3), Bird's Eye Dusk (7)
- **ID 9-10:** ~~Living Light I/II (video)~~ KALDIRILDI (2026-07) — video Supabase 402 +
  yerel gömülü değildi, tile'lar yüklenmiyordu. Statik temaya çevrildi: **Radiant Light** (9,
  quran-light.jpg) ve **Golden Glow** (10, golden-mosque.jpg). `video`/`badge:'Live'` alanları silindi.
- **New badge:** ID 11-38 (Desert Prayer, Blue Night, Golden Arabesque, Iznik Birds, Forest Prayer, Golden Mosque, Kaaba Aerial, Al-Madinah, Ortaköy Sunset, White Dome, Iznik Tulips, Sheikh Zayed Grand, Ottoman Courtyard, Topkapi Corridor, Persian Dome, Ottoman Sunrise, Cedar Forest Light, Wadi Rum (new-theme-1.png)... Riad Fountain, vb.)
- `DEFAULT_THEME_ID = 2` (Sunset Arch)
- `sortedThemes()` → Free → New → düz sıralama
- `resolveWidgetBgURL(widgetThemeId, appThemeId)` → widget bg URL (Supabase — widget istisnası, bkz. yukarı)
- `ThemeTile.tsx`: gömülü görsel HER ZAMAN altta render edilir (video/uzak kaynak üstte, varsa) —
  yüklenemezse tile siyah kalmaz, fallback görünür.

---

## Sonraki Adımlar

- **Kullanıcı hesabı / streak sync / cross-device:** Şu an backend yok (Supabase kaldırıldı).
  İleride gerekirse yeniden değerlendirilecek — şimdilik gündemde değil.
- **Widget bg'yi gömme:** Widget arka planı hâlâ Supabase URL'sine bağımlı (402 riski taşıyor).
  App Group'a gömmek ayrı bir iş olarak ileriye bırakıldı (Tolga 2026-06).
- **Widget liked sync:** `hudaWidgetLiked` → app açılınca `savedVerseIds`'e merge
- **Duas TR/FR:** Güvenilir kaynak yok, şimdilik EN+ID
- **Hadis DE çevirisi:** Yok — `de` dilinde hadith feed boş kalıyor
- **special-offer tetikleyici:** Hangi senaryoda çıkacak? (X gün sonra, crown butonu vb.)
- **`settings.tsx` (tabs):** Orphan — silinebilir
- **`translation.tsx`:** Orphan — silinebilir
- **`feeling.tsx`, `usage.tsx`:** Orphan — silinebilir
- **`data/verses.ts`, `duas.ts`, `hadiths.ts`, `quotes.ts`:** contentDb.ts artık kullanmıyor
  (`offlineContent.ts`'e geçti). `widget-studio.tsx` hâlâ `verses.ts` import ediyor — kontrol edilip
  o da geçirilirse bu 4 dosya tamamen silinebilir.
- **`tools/supabase-*`:** Artık kullanılmayan eski Supabase araçları — temizlik adayı.

---

## graphify

```bash
graphify query "<soru>"        # kod soruları için önce bunu çalıştır
graphify path "<A>" "<B>"      # iki dosya arasındaki ilişki
graphify explain "<kavram>"    # odaklı kavram açıklaması
graphify update .              # kod değiştirince grafiği güncelle (AST-only)
```
`graphify-out/wiki/index.md` varsa geniş navigasyon için kullan.
`GRAPH_REPORT.md` sadece genel mimari review için.
