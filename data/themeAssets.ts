/**
 * themeAssets — Tema görsellerini uygulama BUNDLE'ına gömer.
 *
 * Neden: Eskiden her tema arka planı Supabase Storage'dan çekiliyordu →
 * cached-egress patlıyordu (her açılış/galeri tüm görselleri indiriyordu).
 * Artık görseller uygulama içinde → 0 egress, anında açılır, offline çalışır.
 *
 * Widget (iOS) bundle'a erişemez → o hâlâ Supabase URL kullanır
 * (data/themes.ts `image.uri` + resolveWidgetBgURL). Bu yüzden temaların hem
 * lokal görseli (burada) hem uzak URL'si (themes.ts) tutulur.
 *
 * require() statik literal yol ister → her dosya tek tek listelenir.
 */
import type { ImageSourcePropType } from 'react-native';

// NOT: Anahtarlar Supabase URL'sindeki dosya adıyla (.png) eşleşir; require ise
// app'e gömülü optimize JPG'yi yükler. Böylece data/themes.ts + widget URL'si
// (Supabase'deki .png) değişmeden kalır, app içi 0 egress JPG kullanır.
const LOCAL: Record<string, ImageSourcePropType> = {
  'night-mosque.png':     require('../assets/themes/night-mosque.jpg'),
  'sunset-arch.png':      require('../assets/themes/sunset-arch.jpg'),
  'interior.png':         require('../assets/themes/interior.jpg'),
  'sunrise-court.jpg':    require('../assets/themes/sunrise-court.jpg'),
  'serene-arch.jpg':      require('../assets/themes/serene-arch.jpg'),
  'quran-light.jpg':      require('../assets/themes/quran-light.jpg'),
  'bird-sunset.jpg':      require('../assets/themes/bird-sunset.jpg'),
  'kaaba.png':            require('../assets/themes/kaaba.jpg'),
  'midnight.jpg':         require('../assets/themes/midnight.jpg'),
  'desert-prayer.jpg':    require('../assets/themes/desert-prayer.jpg'),
  'blue-night.jpg':       require('../assets/themes/blue-night.jpg'),
  'golden-arabesque.jpg': require('../assets/themes/golden-arabesque.jpg'),
  'iznik-birds.jpg':      require('../assets/themes/iznik-birds.jpg'),
  'forest-prayer.jpg':    require('../assets/themes/forest-prayer.jpg'),
  'golden-mosque.jpg':    require('../assets/themes/golden-mosque.jpg'),
  'kaaba-aerial.jpg':     require('../assets/themes/kaaba-aerial.jpg'),
  'madinah.jpg':          require('../assets/themes/madinah.jpg'),
  'ortakoy.jpg':          require('../assets/themes/ortakoy.jpg'),
  'white-dome.jpg':       require('../assets/themes/white-dome.jpg'),
  'iznik-tulips.jpg':     require('../assets/themes/iznik-tulips.jpg'),
  'sheikh-zayed.jpg':     require('../assets/themes/sheikh-zayed.jpg'),
  'ottoman-courtyard.jpg':require('../assets/themes/ottoman-courtyard.jpg'),
  'topkapi-corridor.jpg': require('../assets/themes/topkapi-corridor.jpg'),
  'persian-dome.jpg':     require('../assets/themes/persian-dome.jpg'),
  'ottoman-sunrise.jpg':  require('../assets/themes/ottoman-sunrise.jpg'),
  'cedar-forest.jpg':     require('../assets/themes/cedar-forest.jpg'),
  'new-theme-1.png':      require('../assets/themes/new-theme-1.jpg'),
  'new-theme-2.png':      require('../assets/themes/new-theme-2.jpg'),
  'new-theme-3.png':      require('../assets/themes/new-theme-3.jpg'),
  'new-theme-4.png':      require('../assets/themes/new-theme-4.jpg'),
  'new-theme-5.png':      require('../assets/themes/new-theme-5.jpg'),
  'new-theme-6.png':      require('../assets/themes/new-theme-6.jpg'),
  'new-theme-7.png':      require('../assets/themes/new-theme-7.jpg'),
  'new-theme-8.png':      require('../assets/themes/new-theme-8.jpg'),
  'new-theme-9.png':      require('../assets/themes/new-theme-9.jpg'),
  'new-theme-10.png':     require('../assets/themes/new-theme-10.jpg'),
  'new-theme-11.png':     require('../assets/themes/new-theme-11.jpg'),
};

// Galeri thumbnail'leri (480px, q80, ~43KB) — themes.tsx grid'i 38 görseli aynı
// anda render eder. Tam çözünürlük (1536px) decode etmek cihazda ağır + dev
// tünelinde yavaş. Grid bu küçük versiyonu kullanır; feed/seçili tema tam çözünürlük.
const THUMB: Record<string, ImageSourcePropType> = {
  'night-mosque.png':     require('../assets/themes/thumbs/night-mosque.jpg'),
  'sunset-arch.png':      require('../assets/themes/thumbs/sunset-arch.jpg'),
  'interior.png':         require('../assets/themes/thumbs/interior.jpg'),
  'sunrise-court.jpg':    require('../assets/themes/thumbs/sunrise-court.jpg'),
  'serene-arch.jpg':      require('../assets/themes/thumbs/serene-arch.jpg'),
  'quran-light.jpg':      require('../assets/themes/thumbs/quran-light.jpg'),
  'bird-sunset.jpg':      require('../assets/themes/thumbs/bird-sunset.jpg'),
  'kaaba.png':            require('../assets/themes/thumbs/kaaba.jpg'),
  'midnight.jpg':         require('../assets/themes/thumbs/midnight.jpg'),
  'desert-prayer.jpg':    require('../assets/themes/thumbs/desert-prayer.jpg'),
  'blue-night.jpg':       require('../assets/themes/thumbs/blue-night.jpg'),
  'golden-arabesque.jpg': require('../assets/themes/thumbs/golden-arabesque.jpg'),
  'iznik-birds.jpg':      require('../assets/themes/thumbs/iznik-birds.jpg'),
  'forest-prayer.jpg':    require('../assets/themes/thumbs/forest-prayer.jpg'),
  'golden-mosque.jpg':    require('../assets/themes/thumbs/golden-mosque.jpg'),
  'kaaba-aerial.jpg':     require('../assets/themes/thumbs/kaaba-aerial.jpg'),
  'madinah.jpg':          require('../assets/themes/thumbs/madinah.jpg'),
  'ortakoy.jpg':          require('../assets/themes/thumbs/ortakoy.jpg'),
  'white-dome.jpg':       require('../assets/themes/thumbs/white-dome.jpg'),
  'iznik-tulips.jpg':     require('../assets/themes/thumbs/iznik-tulips.jpg'),
  'sheikh-zayed.jpg':     require('../assets/themes/thumbs/sheikh-zayed.jpg'),
  'ottoman-courtyard.jpg':require('../assets/themes/thumbs/ottoman-courtyard.jpg'),
  'topkapi-corridor.jpg': require('../assets/themes/thumbs/topkapi-corridor.jpg'),
  'persian-dome.jpg':     require('../assets/themes/thumbs/persian-dome.jpg'),
  'ottoman-sunrise.jpg':  require('../assets/themes/thumbs/ottoman-sunrise.jpg'),
  'cedar-forest.jpg':     require('../assets/themes/thumbs/cedar-forest.jpg'),
  'new-theme-1.png':      require('../assets/themes/thumbs/new-theme-1.jpg'),
  'new-theme-2.png':      require('../assets/themes/thumbs/new-theme-2.jpg'),
  'new-theme-3.png':      require('../assets/themes/thumbs/new-theme-3.jpg'),
  'new-theme-4.png':      require('../assets/themes/thumbs/new-theme-4.jpg'),
  'new-theme-5.png':      require('../assets/themes/thumbs/new-theme-5.jpg'),
  'new-theme-6.png':      require('../assets/themes/thumbs/new-theme-6.jpg'),
  'new-theme-7.png':      require('../assets/themes/thumbs/new-theme-7.jpg'),
  'new-theme-8.png':      require('../assets/themes/thumbs/new-theme-8.jpg'),
  'new-theme-9.png':      require('../assets/themes/thumbs/new-theme-9.jpg'),
  'new-theme-10.png':     require('../assets/themes/thumbs/new-theme-10.jpg'),
  'new-theme-11.png':     require('../assets/themes/thumbs/new-theme-11.jpg'),
};

/**
 * Tema görselini uygulama içindeki bundle'dan döndürür. Lokal yoksa (ileride
 * eklenen, henüz bundle'da olmayan tema) Supabase URL'sine düşer (graceful).
 */
export function localThemeSource(image: { uri: string }): ImageSourcePropType {
  const file = image.uri.split('/themes/')[1]?.split('?')[0];
  return (file && LOCAL[file]) ? LOCAL[file] : image;
}

/**
 * Galeri/grid için küçük thumbnail. Thumb yoksa tam çözünürlüğe, o da yoksa
 * Supabase URL'sine düşer (graceful).
 */
export function localThemeThumb(image: { uri: string }): ImageSourcePropType {
  const file = image.uri.split('/themes/')[1]?.split('?')[0];
  return (file && (THUMB[file] ?? LOCAL[file])) ? (THUMB[file] ?? LOCAL[file]) : image;
}
