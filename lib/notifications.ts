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

const PREFS_KEY = 'huda_notif_prefs';

export interface ContentTime { hour: number; minute: number; }

export interface NotifPrefs {
  // Namaz vakitleri — hangilerinin bildirimi açık
  prayerEnabled: Record<string, boolean>;
  // Saatlik ilham bildirimleri (tek toggle)
  dailyInspirationEnabled: boolean;
}

const DEFAULT_PREFS: NotifPrefs = {
  prayerEnabled: {
    fajr: true,
    dhuhr: false,
    asr: false,
    maghrib: true,
    isha: false,
  },
  dailyInspirationEnabled: false,
};

/** 24 saatlik farklı ilham mesajları — her saat için ayrı içerik */
const HOURLY_INSPIRATION: { title: string; body: string }[] = [
  { title: 'Huda · Dawn Reminder',       body: 'Verily, with every difficulty there is relief. (94:6)' },
  { title: 'Huda · Early Morning',       body: 'Actions are but by intentions. — Bukhari & Muslim' },
  { title: 'Huda · Morning Reflection',  body: 'Whoever fears Allah — He will make for him a way out. (65:2)' },
  { title: 'Huda · Morning Verse',       body: 'Your smile to your brother is charity. — Tirmidhi' },
  { title: 'Huda · A Morning Thought',   body: 'And He is with you wherever you are. (57:4)' },
  { title: 'Huda · Before You Start',    body: 'The most beloved deeds to Allah are the most consistent, even if small.' },
  { title: 'Huda · Good Morning',        body: 'Allah does not burden a soul beyond that it can bear. (2:286)' },
  { title: 'Huda · Morning Inspiration', body: 'Be conscious of Allah wherever you are. — Tirmidhi' },
  { title: 'Huda · Mid-Morning',         body: 'Whoever travels a path seeking knowledge, Allah eases his path to Paradise.' },
  { title: 'Huda · Forenoon',            body: 'Indeed, Allah is with the patient. (2:153)' },
  { title: 'Huda · Late Morning',        body: 'A good word is charity. — Bukhari & Muslim' },
  { title: 'Huda · Before Midday',       body: 'None of you truly believes until he loves for his brother what he loves for himself.' },
  { title: 'Huda · Midday Reminder',     body: 'Whoever believes in Allah, let him speak good or remain silent.' },
  { title: 'Huda · Afternoon Light',     body: 'Indeed, Allah is gentle and loves gentleness. — Muslim' },
  { title: 'Huda · Early Afternoon',     body: 'So remember Me; I will remember you. (2:152)' },
  { title: 'Huda · Afternoon Verse',     body: 'Whoever does not show mercy to people, Allah will not show mercy to him.' },
  { title: 'Huda · Late Afternoon',      body: 'Do not lose hope, nor be sad. (3:139)' },
  { title: 'Huda · Pre-Sunset',          body: 'Cleanliness is half of faith. — Muslim' },
  { title: 'Huda · Evening Thought',     body: 'And whoever relies upon Allah — then He is sufficient for him. (65:3)' },
  { title: 'Huda · Evening Verse',       body: 'Modesty is a branch of faith. — Bukhari & Muslim' },
  { title: 'Huda · After Maghrib',       body: 'He who knows himself knows his Lord.' },
  { title: 'Huda · Night Reflection',    body: 'The Muslim is one from whose tongue and hand others are safe.' },
  { title: 'Huda · Late Evening',        body: 'And in His remembrance do hearts find rest. (13:28)' },
  { title: 'Huda · Night Reminder',      body: 'Whoever remains silent is saved. — Tirmidhi' },
];

export async function loadNotifPrefs(): Promise<NotifPrefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
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

const PRAYER_MESSAGES: Record<string, { title: string; body: string }> = {
  fajr:    { title: 'Fajr · Dawn Prayer',   body: 'Time for Fajr. Begin your day with the remembrance of Allah.' },
  sunrise: { title: 'Sunrise',              body: 'The sun has risen. A new day of blessings awaits.' },
  dhuhr:   { title: 'Dhuhr · Midday Prayer', body: 'Time for Dhuhr. Pause and reconnect with Allah.' },
  asr:     { title: 'Asr · Afternoon Prayer', body: 'Time for Asr. The afternoon prayer awaits you.' },
  maghrib: { title: 'Maghrib · Sunset Prayer', body: 'The sun has set. Time for Maghrib prayer.' },
  isha:    { title: 'Isha · Night Prayer',   body: 'End your day with Isha prayer. Peace be upon you.' },
};

/**
 * Seçili namaz vakitleri için bildirim planla.
 * Her slot için mevcut bildirimi iptal edip yenisini oluşturur.
 */
export async function schedulePrayerNotifications(
  slots: PrayerSlot[],
  prefs: NotifPrefs,
): Promise<void> {
  if (Platform.OS === 'web') return;
  const granted = await requestPermission();
  if (!granted) return;

  for (const slot of slots) {
    const id = `prayer_${slot.key}`;
    // Önce eskiyi iptal et
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});

    if (!prefs.prayerEnabled[slot.key]) continue;

    // Vaktin saati + dakikasını bugünden al
    const now = new Date();
    const trigger = new Date(slot.date);
    // Eğer vakit geçtiyse yarına planla
    if (trigger <= now) {
      trigger.setDate(trigger.getDate() + 1);
    }

    await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: {
        title: PRAYER_MESSAGES[slot.key]?.title ?? slot.name,
        body: PRAYER_MESSAGES[slot.key]?.body ?? `Time for ${slot.name} prayer.`,
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: slot.date.getHours(),
        minute: slot.date.getMinutes(),
      },
    }).catch(() => {});
  }
}

/** Saatlik ilham bildirimlerini planla (24 adet, her saat farklı içerik) */
async function scheduleHourlyInspiration(enabled: boolean): Promise<void> {
  if (Platform.OS === 'web') return;

  // Önce mevcut tüm saatlik bildirimleri iptal et
  for (let h = 0; h < 24; h++) {
    await Notifications.cancelScheduledNotificationAsync(`inspiration_${h}`).catch(() => {});
  }
  if (!enabled) return;

  const granted = await requestPermission();
  if (!granted) return;

  for (let h = 0; h < 24; h++) {
    const msg = HOURLY_INSPIRATION[h];
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
  await scheduleHourlyInspiration(prefs.dailyInspirationEnabled);
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
