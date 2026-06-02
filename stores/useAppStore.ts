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
}

interface AppActions {
  toggleSave: (verse: Verse) => void;
  isSaved: (id: string) => boolean;
  registerOpen: () => void;
  setPremium: (v: boolean) => void;
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

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
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
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          const streakDays = state.lastOpenDate === yesterday ? state.streakDays + 1 : 1;
          return { ...state, streakDays, lastOpenDate: today };
        }),

      setPremium: (v) => set({ isPremium: v }),
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
    },
  ),
);
