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

const PREFS_KEY = 'noor_notif_prefs';

export interface NotifPrefs {
  // Namaz vakitleri — hangilerinin bildirimi açık
  prayerEnabled: Record<string, boolean>;
  // İçerik bildirimleri
  dailyVerseEnabled: boolean;
  dailyHadithEnabled: boolean;
}

const DEFAULT_PREFS: NotifPrefs = {
  prayerEnabled: {
    fajr: true,
    dhuhr: false,
    asr: false,
    maghrib: true,
    isha: false,
  },
  dailyVerseEnabled: true,
  dailyHadithEnabled: false,
};

export async function loadNotifPrefs(): Promise<NotifPrefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
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

/** Günlük ayet bildirimi (sabah 08:00) */
export async function scheduleDailyVerse(enabled: boolean): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync('daily_verse').catch(() => {});
  if (!enabled) return;
  const granted = await requestPermission();
  if (!granted) return;
  await Notifications.scheduleNotificationAsync({
    identifier: 'daily_verse',
    content: {
      title: 'Your daily verse ✦',
      body: 'A new verse is waiting for you. Open Noor to read it.',
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 8,
      minute: 0,
    },
  }).catch(() => {});
}

/** Günlük hadis bildirimi (akşam 20:00) */
export async function scheduleDailyHadith(enabled: boolean): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync('daily_hadith').catch(() => {});
  if (!enabled) return;
  const granted = await requestPermission();
  if (!granted) return;
  await Notifications.scheduleNotificationAsync({
    identifier: 'daily_hadith',
    content: {
      title: 'Hadith of the day',
      body: 'A wisdom from the Prophet (peace be upon him) awaits you.',
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  }).catch(() => {});
}

export async function applyAllNotifPrefs(
  slots: PrayerSlot[],
  prefs: NotifPrefs,
): Promise<void> {
  await schedulePrayerNotifications(slots, prefs);
  await scheduleDailyVerse(prefs.dailyVerseEnabled);
  await scheduleDailyHadith(prefs.dailyHadithEnabled);
}
