import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Verse } from '../data/types';

interface AppState {
  savedVerseIds: string[];
  streakDays: number;
  lastOpenDate: string | null;
  isPremium: boolean;
  darkMode: boolean;
  currentVerseIndex: number;
  followedTopics: string[];   // explore-topics'te seçilen konular
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
      darkMode: true,
      currentVerseIndex: 0,
      followedTopics: ['General'],

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
    }),
    {
      name: 'noor-app',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
