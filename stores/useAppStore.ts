import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Verse } from '../data/types';

export type WidgetContentType = 'auto' | 'prayer' | 'verse' | 'hadith' | 'quote' | 'streak';

interface AppState {
  savedVerseIds: string[];
  streakDays: number;
  lastOpenDate: string | null;
  isPremium: boolean;
  darkMode: boolean;
  currentVerseIndex: number;
  followedTopics: string[];
  homeWidgetContent: WidgetContentType;
  lockWidgetContent: WidgetContentType;
  dhikrTotal: number;            // lifetime tesbih sayısı
  dhikrToday: number;            // bugünkü tesbih sayısı
  dhikrTodayDate: string | null; // bugünün tarihi (gün dönüşü için)
  widgetThemeId: number | null;  // widget arka planı: null=app teması, 0=minimal, diğer=tema id
  promoUnlocked: boolean;        // promo kod ile açılan premium "taban"ı — RC bunu ezemez
}

interface AppActions {
  toggleSave: (verse: Verse) => void;
  isSaved: (id: string) => boolean;
  registerOpen: () => void;
  setPremium: (v: boolean) => void;
  redeemPromo: () => void;                          // promo kod → kalıcı premium taban
  applyRevenueCatPremium: (active: boolean) => void; // RC entitlement → premium (promo tabanını korur)
  setDarkMode: (v: boolean) => void;
  setCurrentVerseIndex: (i: number) => void;
  toggleFollowTopic: (topic: string) => void;
  isFollowed: (topic: string) => boolean;
  setHomeWidgetContent: (t: WidgetContentType) => void;
  setLockWidgetContent: (t: WidgetContentType) => void;
  addDhikr: (n?: number) => void;            // app içi dokunuşta artır
  absorbDhikrTotal: (total: number) => void; // widget'taki çekimleri içeri al
  setWidgetThemeId: (id: number | null) => void;
}

/** YEREL tarih anahtarı (YYYY-MM-DD). toISOString() UTC verir ve gece yarısı
 *  yerel günle kaymaz → streak çift artar / atlar. Bu yüzden yerel bileşenler. */
function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayKey(): string {
  return localDateKey(new Date());
}

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      savedVerseIds: [],
      streakDays: 1,
      lastOpenDate: null,
      isPremium: false,
      darkMode: false,
      currentVerseIndex: 0,
      followedTopics: ['General'],
      homeWidgetContent: 'auto',
      lockWidgetContent: 'verse',
      dhikrTotal: 0,
      dhikrToday: 0,
      dhikrTodayDate: null,
      widgetThemeId: null,
      promoUnlocked: false,

      toggleSave: (verse) =>
        set((state) => ({
          savedVerseIds: state.savedVerseIds.includes(verse.id)
            ? state.savedVerseIds.filter((id) => id !== verse.id)
            : [...state.savedVerseIds, verse.id],
        })),

      isSaved: (id) => get().savedVerseIds.includes(id),

      registerOpen: () =>
        set((state) => {
          const today = todayKey();
          if (state.lastOpenDate === today) return state;
          const yd = new Date();
          yd.setDate(yd.getDate() - 1); // setDate DST-güvenli; yerel "dün"
          const yesterday = localDateKey(yd);
          const streakDays = state.lastOpenDate === yesterday ? state.streakDays + 1 : 1;
          return { ...state, streakDays, lastOpenDate: today };
        }),

      setPremium: (v) => set({ isPremium: v }),

      // Promo kod → kalıcı premium tabanı. RevenueCat bunu artık ezemez.
      redeemPromo: () => set({ promoUnlocked: true, isPremium: true }),

      // RevenueCat entitlement durumu → premium. Promo tabanı korunur:
      // RC pasif dönse bile promo kullanıcısı premium kalır.
      applyRevenueCatPremium: (active) =>
        set((state) => ({ isPremium: active || state.promoUnlocked })),
      setDarkMode: (v) => set({ darkMode: v }),
      setCurrentVerseIndex: (i) => set({ currentVerseIndex: i }),

      toggleFollowTopic: (topic) =>
        set((state) => ({
          followedTopics: state.followedTopics.includes(topic)
            ? state.followedTopics.filter((t) => t !== topic)
            : [...state.followedTopics, topic],
        })),

      isFollowed: (topic) => get().followedTopics.includes(topic),

      setHomeWidgetContent: (t) => set({ homeWidgetContent: t }),
      setLockWidgetContent: (t) => set({ lockWidgetContent: t }),

      addDhikr: (n = 1) =>
        set((state) => {
          const today = todayKey();
          const isToday = state.dhikrTodayDate === today;
          return {
            dhikrTotal: state.dhikrTotal + n,
            dhikrToday: (isToday ? state.dhikrToday : 0) + n,
            dhikrTodayDate: today,
          };
        }),

      absorbDhikrTotal: (total) =>
        set((state) => {
          const delta = total - state.dhikrTotal;
          if (delta <= 0) return state;
          const today = todayKey();
          const isToday = state.dhikrTodayDate === today;
          return {
            dhikrTotal: total,
            dhikrToday: (isToday ? state.dhikrToday : 0) + delta,
            dhikrTodayDate: today,
          };
        }),

      setWidgetThemeId: (id) => set({ widgetThemeId: id }),
    }),
    {
      name: 'huda-app',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      // Eski (versiyonsuz) kayıtları koru — yeni alanlar shallow-merge ile
      // initial defaults'tan gelir, mevcut veri (streak, saves, premium) silinmez.
      migrate: (persisted) => persisted as AppState & AppActions,
    },
  ),
);
