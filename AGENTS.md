# Noor — Daily Islamic Verses App
## Projeyi anlama rehberi (yeni konuşmalar için)

Bu dosya yeni bir Codex konuşmasının projeyi **sıfırdan anlamadan** devam edebilmesi için yazıldı.
Tolga ile çalışırken şunları bil: kısa ve net konuşur, görmek istediği şeyi önce tarayıcıda/telefonda test etmeni sever, tasarım kararlarında referans görsel verir, beğenmediği şeyi direk söyler.

---

## Projenin özü

**Noor** — günlük İslami ayet, dua, hadis ve alıntı sunan bir mobil uygulama.
Dark-first tasarım, altın aksanlar, gerçek cami fotoğrafları, world-class animasyonlar.

**Çalıştırmak için:**
```bash
npx expo start --tunnel   # telefonda Expo Go ile (SDK 54 gerekli)
npx expo start            # sonra 'w' ile tarayıcıda
```

**Expo Go SDK:** Telefondaki Expo Go **SDK 54** — projeyi de 54'e yükselttik.

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
| Lists | @shopify/flash-list | 2.0.2 |
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
│   │   ├── language.tsx          ← 12 → artık direkt reminders'a gider (translation ATLANDI)
│   │   ├── translation.tsx       ← DEVRE DIŞI (dosya var ama akışta yok, silebilirsin)
│   │   ├── reminders.tsx         ← 13 Stepper + RangeSlider
│   │   ├── notifications.tsx     ← 14 Radial rays + izin
│   │   ├── preparing.tsx         ← 15 SparkleField + auto-advance
│   │   ├── streak-intro.tsx      ← 16 Crescent + dots
│   │   ├── theme-select.tsx      ← 17 Gerçek fotoğraf grid
│   │   ├── attribution.tsx       ← 18 Kaynak sorusu, skip'lenebilir
│   │   └── paywall.tsx           ← 19 Weekly/Yearly, complete() çağırır
│   ├── (tabs)/
│   │   ├── _layout.tsx           ← FloatingTabBar kullanan tabs
│   │   ├── feed.tsx              ← İmmersive dikey feed (FlatList, pagingEnabled)
│   │   ├── home-card.tsx         ← YENİ: Namaz vakitleri + hero + StreakWidget
│   │   ├── themes.tsx            ← 3-kolon galeri, Free/New filtresi
│   │   ├── profile.tsx           ← YENİ: Premium banner + streak + quick actions + settings
│   │   └── settings.tsx          ← Sections, ToggleSwitch, premium kart
│   ├── verse/[id].tsx            ← Ayet detay: Arapça + çeviri + meta + similar
│   ├── categories.tsx            ← BottomSheet + 4 gradient tile
│   └── widget-studio.tsx         ← Canlı widget preview
│
├── components/
│   ├── arabic/ArabicText.tsx     ← Amiri font, writingDirection:'rtl' — DAIMA bunu kullan
│   ├── anim/
│   │   ├── Sparkles.tsx          ← Sparkle, Star, SparkleField
│   │   ├── Crescent.tsx          ← Crescent, RadialRays, StarTrails
│   │   └── GlowArch.tsx          ← İslam kemeri stroke animasyonu
│   ├── ui/
│   │   ├── GoldButton.tsx        ← Altın gradient CTA + shimmer
│   │   ├── GhostButton.tsx       ← İkincil outlined buton
│   │   ├── OptionRow.tsx         ← check | radio | center varyantları
│   │   ├── IconGridCard.tsx      ← İçerik tipi grid kartı
│   │   ├── VerseCard.tsx         ← frosted=true (BlurView) veya solid
│   │   ├── StreakWidget.tsx      ← Ay ikonu + gün sayacı + haftalık noktalar
│   │   ├── NotifPreview.tsx      ← Mock iOS bildirim
│   │   ├── ProgressDots.tsx      ← Onboarding ilerleme — aktif dot altın pill'e spring
│   │   ├── ToggleSwitch.tsx      ← Spring knob, interpolateColor track
│   │   ├── RangeSlider.tsx       ← Çift tutamaçlı saat aralığı slider
│   │   ├── Stepper.tsx           ← −/N×Daily/+ sayaç
│   │   └── ThemeTile.tsx         ← expo-image + gradient overlay + badge + checkmark
│   ├── layout/
│   │   ├── ScreenContainer.tsx   ← SafeArea + gradient bg + OPSİYONEL backgroundImage prop
│   │   ├── OnboardingShell.tsx   ← Progress dots + icon + title + pinned GoldButton
│   │   ├── BottomSheet.tsx       ← Spring + gesture dismiss
│   │   └── FloatingTabBar.tsx    ← Frosted pill — tabs: feed/home-card/themes/profile/settings
│   └── onboarding/
│       └── SelectScreen.tsx      ← Generic multi/single select (9 ekranda kullanılır)
│
├── constants/
│   └── theme.ts                  ← Renk paletleri (dark + warm), spacing, radii, fonts
│
├── data/
│   ├── types.ts                  ← Verse, Dua, Hadith, Quote, ContentKind
│   ├── verses.ts                 ← 52 Kuran ayeti, gerçek Arapça Unicode
│   ├── duas.ts                   ← 20 dua
│   ├── hadiths.ts                ← 20 hadis
│   ├── quotes.ts                 ← 20 İslami alıntı
│   └── themes.ts                 ← 9 BackgroundTheme (image + gradient)
│
├── stores/
│   ├── useOnboardingStore.ts     ← Zustand v5 + AsyncStorage persist
│   └── useAppStore.ts            ← Zustand v5 + AsyncStorage persist
│
├── lib/
│   └── haptics.ts                ← haptic.light/medium/heavy/select/success
│
├── assets/
│   └── themes/                   ← 9 gerçek cami fotoğrafı (widget-resim'den kopyalandı)
│       ├── midnight.jpg          ← Koyu lacivert gece + hilal
│       ├── night-mosque.png      ← Gece camii + ay
│       ├── sunset-arch.png       ← Altın gün batımı kemer
│       ├── interior.png          ← Cami içi kubbe
│       ├── sunrise-court.jpg     ← Sabah cami avlusu (VARSAYILAN tema 0)
│       ├── serene-arch.jpg       ← Serene gate — faith-intro bg
│       ├── quran-light.jpg       ← Geometrik ışık + rahledeki Kuran
│       ├── bird-sunset.jpg       ← Kuşbakışı günbatımı
│       └── kaaba.png             ← Kabe kuşbakışı
│
├── figma/                        ← 27 tasarım referans PNG (import ETME, sadece bak)
├── widget-resim/                 ← Orijinal kaynak fotoğraflar
├── app.json
├── babel.config.js               ← transformImportMeta + reanimated/plugin (sona)
├── metro.config.js
├── tsconfig.json                 ← strict, baseUrl ".", @/* paths
└── package.json
```

---

## Renk sistemi (`constants/theme.ts`)

### Dark palette (varsayılan)
```typescript
bg.midnight  = '#0A1230'  // ekran arka planı
bg.deep      = '#0D1635'  // gradient sonu
bg.card      = '#161E3D'  // kartlar
bg.raised    = '#1E2A52'  // seçili / hover
bg.premium   = '#07101F'  // paywall
gold.primary = '#D4AF37'
gold.bright  = '#E8C766'
gold.deep    = '#B8902E'
text.heading = '#F5F0E1'
text.body    = '#C3C9DE'
text.muted   = '#828BAD'
text.onGold  = '#1A1206'  // altın arka plan üzerindeki metin
green.streak = '#2E7D32'
green.accent = '#4CAF72'
white        = '#FFFFFF'
hairline     = 'rgba(255,255,255,0.08)'
```

### Warm palette (yeni eklendi — referans: "Deen Buddy" app sıcak tonu)
```typescript
warm.bg      = '#F2EDE4'  // ana arka plan
warm.surface = '#EDE7DC'  // kart
warm.raised  = '#E4DDD3'  // hover
warm.border  = 'rgba(180,155,120,0.25)'
warm.gold    = '#C9963A'
warm.goldSoft= '#D4A855'
warm.text    = '#2C2418'  // koyu kahve başlık
warm.body    = '#5C4F3D'
warm.muted   = '#9C8E7D'
```

### Typography
- **Playfair Display** → `fonts.serif/serifMedium/serifSemibold/serifBold` — başlıklar
- **Plus Jakarta Sans** → `fonts.sans/sansMedium/sansSemibold/sansBold` — UI, body
- **Amiri** → `fonts.arabic/arabicBold` — TÜM Arapça metin

---

## Kritik kurallar

1. **Arapça metin** → DAIMA `<ArabicText>` component. Latin placeholder YASAK.
2. **Arka planlar** → `assets/themes/` klasöründeki gerçek fotoğraflar + `expo-image` + `LinearGradient` overlay. `figma/` PNGleri IMPORT ETME.
3. **Animasyonlar** → SADECE `react-native-reanimated v4`. React Native core `Animated` YASAK.
4. **Listeler** → `FlatList` (FlashList v2 API değişti, feed'de FlatList kullanılıyor).
5. **Her press/select/swipe** → `haptic.*` çağrısı.
6. **İnteraktif elementler** → `accessibilityRole` + `accessibilityLabel`.
7. **Zustand persist hydration** → `persist.onFinishHydration` callback olarak çağrılmalı (v5).
8. **Input focus bug** → name.tsx gibi formlarda store'u her tuşta güncelleme — LOCAL state kullan, submit'te store'a yaz.

---

## Navigasyon akışı

```
app/index.tsx
  ├─ isCompleted=false → /welcome → /name → /age → /faith-intro
  │   → /intention → /feeling → /quran-relation → /content-select
  │   → /content-style → /usage → /home-pref → /language
  │   → /reminders (translation ATLANDI) → /notifications
  │   → /preparing → /streak-intro → /theme-select → /attribution
  │   → /paywall → complete() → replace /(tabs)/feed
  └─ isCompleted=true → /(tabs)/feed

(tabs) — ALT BAR KALDIRILDI (tabBar: () => null):
  feed = ANA/DEFAULT immersive sayfa, kendi köşe butonları var:
    - sol üst: home → home-card (prayer times)
    - üst orta: ❤️ likes progress (savedCount/5)
    - sağ üst: 👑 crown → paywall
    - aksiyon satırı: Share, Like, Themes(→themes), Info(→verse detail)
    - sol alt: ▦ grid → /explore-topics (99 İsim vb. premium kilitli)
    - sağ alt: 👤 person → profile
  home-card / themes / profile / settings = BackButton ile feed'e döner
  (FloatingTabBar.tsx artık KULLANILMIYOR — kod duruyor ama _layout null veriyor)

YENİ EKRANLAR:
  /explore-topics      ← premium konu listesi (kilitli), slide_from_bottom
  /saved-verses        ← kayıtlı ayetler
  /reminders-settings  ← bildirim ayarları (Stepper)
  /language-settings   ← dil seçimi

Modals:
  /verse/[id]     ← slide_from_bottom
  /categories     ← transparentModal + BottomSheet
  /widget-studio  ← slide_from_right
  /profile        ← home-card'daki profil butonundan da açılır
```

---

## State

### useOnboardingStore (AsyncStorage persist, key: 'noor-onboarding')
```typescript
name, age, intentions[], feeling, quranRelation,
contentTypes[], contentStyle[], usage[], homePreference[],
language, reminderCount, reminderStart, reminderEnd,
selectedTheme, attribution, isCompleted

set(key, value)
toggleArrayItem(key, value)
complete()    // isCompleted = true
reset()       // dev: onboarding'i sıfırla
```

### useAppStore (AsyncStorage persist, key: 'noor-app')
```typescript
savedVerseIds[], streakDays, lastOpenDate,
isPremium, darkMode, currentVerseIndex

toggleSave(verse), isSaved(id), registerOpen()
setPremium(v), setDarkMode(v), setCurrentVerseIndex(i)
```

---

## Home Card (yeni tasarım — bu konuşmada yapıldı)

Referans: "Deen Buddy" uygulamasından layout ilhamı alındı, Noor'un dark/gold paleti korundu.

**Bölümler (yukarıdan aşağı):**
1. **Header** — "Good Morning, [name] 🌙" + tarih + sağ üstte profile butonu
2. **Namaz vakitleri kartı** — "NEXT PRAYER: Maghrib · 2h 14m away" + Istanbul chip + 5 vakit ikonu (aktif vakit altın halkası)
   - Şu an **placeholder data** (statik). Gerçek hesap için `adhan` + `expo-location` hazır kurulu.
   - Gerçek namaz vakti hook'u: `lib/prayerTimes.ts` + `lib/usePrayerTimes.ts` — henüz yazılmadı ama paketler kurulu.
3. **Daily Reflection** — "Open Feed →" linki + hero kart (gerçek cami fotoğrafı + Arapça ayet + çeviri + altın referans satırı)
4. **Your Streak** — mevcut `StreakWidget` component

---

## Profile ekranı (yeni — bu konuşmada yapıldı)

```
Profile
├── Premium banner (altın, paywall'a yönlendirir)
├── StreakWidget
├── Quick Actions grid 2×2
│   ├── Saved Verses → home-card
│   ├── Reminders → Alert (henüz)
│   ├── Themes → /themes
│   └── Widget → /widget-studio
└── Settings card
    ├── Name (salt okunur, değiştirmek için reset)
    ├── Language
    ├── Dark Mode toggle
    └── Notifications
```

---

## Animasyon referansları

| Efekt | Pattern |
|---|---|
| Ekran girişi | `FadeInDown.delay(i * 80)` stagger |
| Altın shimmer | `withRepeat(withSequence(...), -1)` translateX |
| Glow pulse | `withRepeat(withTiming(1, 2s), -1, true)` |
| Sparkle | `SparkleField` component |
| Star trails | `StarTrails` — 60s SVG rotate |
| Feed snap | `FlatList pagingEnabled + snapToInterval=SCREEN_H` |
| Bottom sheet | `withSpring(0, {damping:18, stiffness:150})` |
| Seçim | `withSpring(1.015)` scale + `withTiming(gold)` borderColor |

---

## Çözülen bilinen sorunlar (bir daha uğraşma)

| Sorun | Çözüm |
|---|---|
| Expo Go "incompatible SDK" | SDK 51 → 54 yükseltmesi, `npx expo install --fix` |
| Web boş ekran | `import.meta.env` (zustand) → babel inline plugin `transformImportMeta` |
| `babel-preset-expo` hata | v56 yüklenmişti → `~54.0.10` sabitlendi |
| `FlashList estimatedItemSize` TS hatası | FlashList v2 API değişti → `FlatList`'e geçildi |
| Input yazınca kaybolma | store her tuşta re-render → local state, submit'te store |
| `@expo/vector-icons` type hatası | SDK 54'te ayrı kurulum gerekiyor |
| `react-native-worklets` eksik | reanimated v4 dependency, kuruldu |
| ngrok tunnel | ngrok.com'dan ücretsiz hesap + auth token gerekli |

---

## Henüz yapılmayanlar / sonraki adımlar

- **Gerçek namaz vakitleri**: `adhan` + `expo-location` kurulu, `lib/prayerTimes.ts` ve `lib/usePrayerTimes.ts` yazılacak, home-card'daki placeholder data bununla değiştirilecek
- **Supabase entegrasyonu**: Kullanıcı verisi (saved, streak, premium) için — ayetler/hadisler lokal kalacak (offline-first)
- **`translation.tsx`** dosyası hâlâ var ama akışta kullanılmıyor — istersen silebilirsin
- **Onboarding akışı**: `quran-relation.tsx` da çıkarılabilir (Arapça okuma odaklı)
- **Gerçek push notification** scheduling: `expo-notifications` kurulu
- **Warm palette uygulaması**: `constants/theme.ts`'e `warm.*` eklendi ama henüz hiçbir ekranda kullanılmıyor — Tolga beğenirse uygulanacak

---

## Geliştirme komutları

```bash
npx expo start --tunnel --clear   # telefon (Expo Go SDK 54 gerekli)
npx expo start --clear            # web + tunnel denemesi
npm run typecheck                 # tsc --noEmit (0 hata olmalı)
npx expo-doctor                   # 18/18 geçmeli
```

**Onboarding sıfırlama (dev):**
```typescript
useOnboardingStore.getState().reset()  // sonra uygulamayı yenile
```

**Web'de test için tarayıcı console:**
```javascript
localStorage.setItem('noor-onboarding', JSON.stringify({
  state: { name: 'Tolga', isCompleted: true, selectedTheme: 6 },
  version: 0
}));
location.reload();
```

---

## graphify

Bu projede graphify-out/ klasöründe knowledge graph var.

- Kodla ilgili sorularda önce `graphify query "<soru>"` çalıştır
- İlişkiler için `graphify path "<A>" "<B>"`
- Genel mimari için `graphify-out/GRAPH_REPORT.md`
- Kod değişikliğinden sonra `graphify update .`
