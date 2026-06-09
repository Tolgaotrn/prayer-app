/**
 * notifications.ts — Namaz vakti + içerik bildirimleri
 *
 * • schedulePrayerNotifications(slots, prefs): seçili namaz vakitleri için
 *   günlük tekrar eden bildirim planlar.
 * • cancelPrayerNotification(key): tek bir vakti iptal eder.
 * • requestPermission(): bildirim izni ister, sonucu döner.
 * • Ayarlar AsyncStorage'da saklanır: noor_notif_prefs
 */
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { PrayerSlot } from './prayerTimes';
import { fetchFeedItems, getOfflineFeedItems, resolveLang, type FeedItem } from './contentDb';
import { translate, resolveUILang } from './i18n';
import { useOnboardingStore } from '../stores/useOnboardingStore';
import { useAppStore } from '../stores/useAppStore';

const PREFS_KEY = 'huda_notif_prefs';

export interface ContentTime { hour: number; minute: number; }

/** Günlük ilham sıklığı: kapalı · her saat · her 3 saat. */
export type InspirationFrequency = 'off' | 'hourly' | 'every3h';

/** Her 3 saatlik modda bildirim gönderilecek (uyanık) saatler. */
export const EVERY_3H_HOURS = [6, 9, 12, 15, 18, 21];

export interface NotifPrefs {
  // Namaz vakitleri — hangilerinin bildirimi açık
  prayerEnabled: Record<string, boolean>;
  // Günlük ilham bildirim sıklığı
  inspirationFrequency: InspirationFrequency;
}

const DEFAULT_PREFS: NotifPrefs = {
  prayerEnabled: {
    fajr: true,
    dhuhr: false,
    asr: false,
    maghrib: true,
    isha: false,
  },
  inspirationFrequency: 'off',
};

// İçerik türü → i18n başlık anahtarı (zaten 5 dilde mevcut, çeviri uydurmuyoruz)
const KIND_TITLE_KEY: Record<FeedItem['kind'], string> = {
  verse:  'rem.dailyVerse',
  hadith: 'rem.dailyHadith',
  dua:    'rem.dailyDua',
  quote:  'rem.dailyWisdom',
};

interface NotifContent { title: string; body: string; meta: string }

/**
 * Bildirimler için SEÇİLİ DİLDE içerik havuzu çeker.
 * - Kaynak: DB feed (offline → AsyncStorage cache servis edilir).
 * - Arapça seçiliyse SADECE Arapça metni olan içerik (quote vb. dışlanır).
 * - Diğer dillerde SADECE o dilin çevirisi (İngilizce sızmaz).
 * - O dilde içerik yoksa havuz boş döner → hiç bildirim planlanmaz.
 * - Her çağrıda karıştırılır → açılışlar arası farklı içerik.
 */
async function loadNotifPool(minCount: number): Promise<NotifContent[]> {
  const rawLang    = useOnboardingStore.getState().language;
  const uiLang     = resolveUILang(rawLang);
  const arabicOnly = rawLang === 'Arabic';
  const lang       = resolveLang(rawLang);
  const app        = useAppStore.getState();

  let items = await fetchFeedItems(
    lang,
    Math.max(minCount, 30),
    app.followedTopics,
    app.isPremium,
    app.savedVerseIds,
    false,
    arabicOnly,
  ).catch(() => [] as FeedItem[]);

  // DB + cache boşsa (internet yok, ilk açılış) → çevrimdışı varsayılan içerik.
  // Böylece bildirimler her dilde offline da seçili dilde çalışır.
  if (items.length === 0) items = getOfflineFeedItems(lang, arabicOnly, app.followedTopics);

  const pool: NotifContent[] = [];
  for (const it of items) {
    const body = (arabicOnly ? it.arabic : it.translation)?.trim();
    if (!body) continue; // içerik yoksa akma
    pool.push({
      title: translate(uiLang, KIND_TITLE_KEY[it.kind] ?? 'rem.daily'),
      body,
      meta: it.reference ?? '',
    });
  }
  // Karıştır — her yeniden planlamada farklı sıra/içerik
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

export async function loadNotifPrefs(): Promise<NotifPrefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    // Eski boolean alanı → yeni sıklık enum'una göç
    if (parsed && typeof parsed.dailyInspirationEnabled === 'boolean' && !parsed.inspirationFrequency) {
      parsed.inspirationFrequency = parsed.dailyInspirationEnabled ? 'hourly' : 'off';
    }
    return { ...DEFAULT_PREFS, ...parsed };
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function saveNotifPrefs(prefs: NotifPrefs): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch { /* sessiz geç */ }
}

export async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Bildirim handler — uygulama açıkken de göster
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Seçili namaz vakitleri için bildirim planla.
 * Başlık = seçili dildeki namaz adı (i18n). Gövde = o dilde gerçek bir ayet/hadis
 * (DB'den). İçerik bulunamazsa gövde boş kalır (yine de namaz adı gösterilir).
 * Her slot için mevcut bildirimi iptal edip yenisini oluşturur.
 */
export async function schedulePrayerNotifications(
  slots: PrayerSlot[],
  prefs: NotifPrefs,
): Promise<void> {
  if (Platform.OS === 'web') return;
  const granted = await requestPermission();
  if (!granted) return;

  const uiLang = resolveUILang(useOnboardingStore.getState().language);
  const pool   = await loadNotifPool(slots.length).catch(() => [] as NotifContent[]);
  let pi = 0;

  for (const slot of slots) {
    const id = `prayer_${slot.key}`;
    // Önce eskiyi iptal et
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});

    if (!prefs.prayerEnabled[slot.key]) continue;

    const title = translate(uiLang, `prayer.${slot.key}`);
    const body  = pool.length > 0 ? pool[pi++ % pool.length].body : '';

    await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: { title, body, sound: false },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: slot.date.getHours(),
        minute: slot.date.getMinutes(),
      },
    }).catch(() => {});
  }
}

/**
 * İlham bildirimlerini planla.
 *  - 'hourly'  → 24 bildirim (her saat farklı içerik)
 *  - 'every3h' → 6 bildirim (uyanık saatler, EVERY_3H_HOURS)
 *  - 'off'     → hepsi iptal
 */
async function scheduleInspiration(freq: InspirationFrequency): Promise<void> {
  if (Platform.OS === 'web') return;

  // Önce mevcut tüm ilham bildirimlerini iptal et (24 slot)
  for (let h = 0; h < 24; h++) {
    await Notifications.cancelScheduledNotificationAsync(`inspiration_${h}`).catch(() => {});
  }
  if (freq === 'off') return;

  const granted = await requestPermission();
  if (!granted) return;

  const hours = freq === 'hourly'
    ? Array.from({ length: 24 }, (_, h) => h)
    : EVERY_3H_HOURS;

  // Seçili dilde içerik havuzu — o dilde içerik yoksa hiç planlama.
  const pool = await loadNotifPool(hours.length);
  if (pool.length === 0) return;

  for (let i = 0; i < hours.length; i++) {
    const h = hours[i];
    const msg = pool[i % pool.length];
    await Notifications.scheduleNotificationAsync({
      identifier: `inspiration_${h}`,
      content: { title: msg.title, body: msg.body, sound: false },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: h,
        minute: 0,
      },
    }).catch(() => {});
  }
}

export async function applyAllNotifPrefs(
  slots: PrayerSlot[],
  prefs: NotifPrefs,
): Promise<void> {
  await schedulePrayerNotifications(slots, prefs);
  await scheduleInspiration(prefs.inspirationFrequency);
}

/**
 * Açılışta / namaz vakitleri değişince bildirimleri SESSİZCE yeniden planlar.
 * İzin DAHA ÖNCE verilmemişse hiçbir şey yapmaz (yeni izin dialog'u açmaz) —
 * böylece DAILY trigger'ların sabit saate kilitlenip kayması önlenir.
 */
export async function refreshScheduledNotifications(slots: PrayerSlot[]): Promise<void> {
  if (Platform.OS === 'web' || slots.length === 0) return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;
    const prefs = await loadNotifPrefs();
    await applyAllNotifPrefs(slots, prefs);
  } catch { /* sessiz geç */ }
}

/**
 * Dil değişince çağrılır — namaz vakitlerini kendi hesaplar, izin verilmişse
 * tüm bildirimleri YENİ dilde yeniden planlar. Slot parametresi gerektirmez.
 */
export async function rescheduleForLanguageChange(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    // Namaz vakitlerini widget sync ile aynı kaynaktan hesapla
    const { computeSlots, resolveLocation } = await import('./prayerTimes');
    const { loadPrayerSettings, buildParams } = await import('./prayerSettings');
    const settings = await loadPrayerSettings();
    const loc      = await resolveLocation();
    const params   = buildParams(settings, loc.countryCode);
    const slots    = computeSlots(loc.latitude, loc.longitude, new Date(), params)
      .filter((s) => s.key !== 'sunrise');

    const prefs = await loadNotifPrefs();
    await applyAllNotifPrefs(slots, prefs);
  } catch { /* sessiz geç */ }
}
