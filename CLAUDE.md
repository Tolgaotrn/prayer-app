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
npm run db:import                  # content/ → Supabase
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
| Supabase | @supabase/supabase-js | ^2.x |
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
│   │   ├── theme-select.tsx      ← Gerçek fotoğraf grid
│   │   └── paywall.tsx           ← 3 plan (Annual/Monthly/Weekly), RevenueCat, complete() çağırır
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
│   ├── saved-verses.tsx          ← Supabase'den Favorites
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
│   ├── supabase.ts               ← anon key (service_role SADECE tools/'da)
│   ├── contentDb.ts              ← offline-first: cache→Supabase→stale→seed
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
│   ├── verses.ts                 ← ~52 seed (offline fallback)
│   ├── duas.ts, hadiths.ts, quotes.ts
│   └── themes.ts                 ← 38 tema, Supabase Storage URL'leri
│
└── tools/
    ├── import-hadith.mjs
    ├── import-quran-verses.mjs
    ├── import-duas.mjs
    ├── build-quotes-from-content.mjs
    ├── supabase-schema.sql
    ├── supabase-import.mjs
    └── upload-themes-to-supabase.mjs
```

---

## Onboarding Akışı (GÜNCEL)

```
welcome → attribution → name → age → faith-intro
→ intention → content-select → home-pref
→ language → preparing → streak-intro → reminders → theme-select → paywall
```

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
  → /saved-verses      Kayıtlı içerik (Supabase Favorites)
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

## Supabase

**URL:** `https://hvxrsscrsqdbfewpmfhl.supabase.co`
**App Group:** `group.com.tolgaoturan.huda`

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

**Sayılar (filtreli):** verses 395, hadiths 500, duas 78, quotes 198

**RLS:** Tüm tablolar public read, write yok.

**Tema görselleri:** Supabase Storage `themes` bucket (public).
`BASE = https://hvxrsscrsqdbfewpmfhl.supabase.co/storage/v1/object/public/themes/`

---

## lib/contentDb.ts

```typescript
fetchFeedItems(lang, limit, followedTopics, isPremium, savedIds, forceFresh) → FeedItem[]
fetchDailyVerse(lang) → FeedItem | null
fetchThemes() → ThemeItem[]
clearContentCache() → void
resolveLang(stored) → Lang   // 'Turkish'→'tr', 'French'→'fr', 'Indonesian'→'id', diğer→'en'
```

**İçerik erişim:**
- Ücretsiz: `General`, `Quran Verses`, `Favorites`, `Duas & Prayers`
- Premium: `Hadiths`, `Islamic Quotes`, `99 Names`, `Dhikr`, diğer konular
- `Favorites` → 4 tablodan savedIds ile çeker, boşsa seed'e düşmez (boş ekran)
- Duas TR/FR çevirisi yok → her zaman EN (ID hariç)
- Feed limit: **100**

**Import filtresi:** Arapça ≤500, çeviri ≤300 karakter. Eşik üstü yüklenmez + `removeOrphans()` siler.

---

## Dil Sistemi

**i18n:** `useT()` + `useLocaleTag()` — tüm UI değişir.
```typescript
const t = useT();
t('home.today')                           // → 'Bugün'
t('profile.savedCount', { n: 3 })         // → '3 saved'
```

**resolveLang:** 'Turkish'→'tr', 'French'→'fr', 'Indonesian'→'id', 'Arabic'→'en', diğer→'en'

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

- **Promo kod sistemi KALDIRILDI** (sızıntı riski). `promoUnlocked` alanı store'da
  duruyor — geçmişte redeem etmiş kullanıcılar premium kalır, yeni redeem yolu yok.
- **Paywall**: Annual default seçili, X butonu 2.5 sn gecikmeli, tüm girişler
  `?source=` paramı taşır (onboarding/feed_crown/profile/locked_topic/locked_theme/
  widget/topics_banner/feed_interstitial/second_open/special_offer).
- **special-offer.tsx**: TETİKLERİ DEVRE DIŞI (Tolga kararı 2026-06). Ekran + altyapı
  duruyor; açmak için paywall.tsx skip'i ve monetization.ts registerSession'daki
  yorum satırlarını geri al. RevenueCat `winback` offering, 24h sayaç hazır.
- **index.tsx gate**: `registerSession()` — free kullanıcıda 2. açılışta paywall bir kez daha.
- **Feed interstitial**: free kullanıcıda her 9 kartta bir blur'lu premium teaser +
  feed sonunda end-card (feed.tsx `UpsellSlide`).
- **Kilitli topic**: explore-topics'te direkt paywall yerine örnek içerikli BottomSheet.
- **Trial bildirimi**: `scheduleTrialEndReminder()` — trial bitmeden 1 gün önce 11:00.
- PostHog: `trial_started`, `special_offer_*` eventleri eklendi.

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
8. **Supabase key** → anon key app'te, service_role SADECE tools/'da.
9. **RangeSlider** → store'da "HH:MM" string, slider dakika (number). Dönüşüm reminders-settings.tsx'te.
10. **Dil değişimi** → `clearContentCache()` + `fetchFeedItems(forceFresh=true)`. Feed'de `prevLangRef` ile tespit.
11. **Arka planlar** → Supabase Storage `{ uri }` + `expo-image`. `require()` sadece onboarding'de.
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

- `fetchFeedItems(lang, 100, followedTopics, isPremium, savedIds)` — limit 100
- Çift-tık → kaydet + kalp burst animasyonu (`heartBurst`)
- "Swipe up" chevron → `withRepeat` zıplama (`SwipeHint`)
- Kind badge yok
- `snapToInterval` yok (pagingEnabled ile çakışıyordu)

---

## Paywall Sistemi

| Ekran | Amaç | Açılış |
|---|---|---|
| `/(onboarding)/paywall.tsx` | Onboarding sonu — Annual default, gecikmeli X, `?source=` | onboarding akışı + tüm kilit noktaları |
| `/special-offer.tsx` | İndirimli yıllık (winback) + 24h sayaç | paywall skip + 3. açılış (`registerSession`) |

---

## Temalar (data/themes.ts)

38 tema — `backgroundThemes` dizisi. ID 1-38.
- **Free:** Sunset Arch (2), Grand Interior (3), Bird's Eye Dusk (7)
- **Live (video):** Living Light I (9), Living Light II (10)
- **New badge:** ID 11-38 (Desert Prayer, Blue Night, Golden Arabesque, Iznik Birds, Forest Prayer, Golden Mosque, Kaaba Aerial, Al-Madinah, Ortaköy Sunset, White Dome, Iznik Tulips, Sheikh Zayed Grand, Ottoman Courtyard, Topkapi Corridor, Persian Dome, Ottoman Sunrise, Cedar Forest Light, Wadi Rum (new-theme-1.png)... Riad Fountain, vb.)
- `DEFAULT_THEME_ID = 2` (Sunset Arch)
- `sortedThemes()` → Free → Live → New → düz sıralama
- `resolveWidgetBgURL(widgetThemeId, appThemeId)` → widget bg URL

---

## Sonraki Adımlar

- **Supabase Auth:** Kullanıcı hesabı, streak sync, cross-device
- **Widget liked sync:** `hudaWidgetLiked` → app açılınca `savedVerseIds`'e merge
- **Duas TR/FR:** Güvenilir kaynak yok, şimdilik EN+ID
- **special-offer tetikleyici:** Hangi senaryoda çıkacak? (X gün sonra, crown butonu vb.)
- **themes.tsx:** Hâlâ lokal `data/themes.ts` kullanıyor → `fetchThemes()` Supabase'e geçirilecek
- **`settings.tsx` (tabs):** Orphan — silinebilir
- **`translation.tsx`:** Orphan — silinebilir
- **`feeling.tsx`, `usage.tsx`:** Orphan — silinebilir

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
