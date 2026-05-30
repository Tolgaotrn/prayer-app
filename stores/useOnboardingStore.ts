import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingState {
  name: string;
  age: string;
  intentions: string[];
  feeling: string;
  quranRelation: string;
  contentTypes: string[];
  contentStyle: string[];
  usage: string[];
  homePreference: string[];
  language: string;
  reminderCount: number;
  reminderStart: string;
  reminderEnd: string;
  selectedTheme: number;
  attribution: string;
  isCompleted: boolean;
}

interface OnboardingActions {
  set: <K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) => void;
  toggleArrayItem: (
    key: 'intentions' | 'contentTypes' | 'contentStyle' | 'usage' | 'homePreference',
    value: string,
  ) => void;
  complete: () => void;
  reset: () => void;
}

const initial: OnboardingState = {
  name: '',
  age: '',
  intentions: [],
  feeling: '',
  quranRelation: '',
  contentTypes: [],
  contentStyle: [],
  usage: [],
  homePreference: [],
  language: 'English',
  reminderCount: 3,
  reminderStart: '08:00',
  reminderEnd: '21:00',
  selectedTheme: 0,
  attribution: '',
  isCompleted: false,
};

export const useOnboardingStore = create<OnboardingState & OnboardingActions>()(
  persist(
    (set) => ({
      ...initial,
      set: (key, value) => set({ [key]: value } as Partial<OnboardingState>),
      toggleArrayItem: (key, value) =>
        set((state) => {
          const list = state[key];
          return {
            [key]: list.includes(value)
              ? list.filter((v) => v !== value)
              : [...list, value],
          } as Partial<OnboardingState>;
        }),
      complete: () => set({ isCompleted: true }),
      reset: () => set(initial),
    }),
    {
      name: 'noor-onboarding',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
