import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, FormConfig } from '@/types';

type ThemeName = 'facebook-light' | 'facebook-dark' | 'whatsapp-dark' | 'whatsapp-light' | 'slack' | 'discord';

interface AppStore {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  activeForms: FormConfig[];
  setActiveForms: (forms: FormConfig[]) => void;
  globalLogo: string;
  setGlobalLogo: (logo: string) => void;
  logoLocations: string[];
  setLogoLocations: (locations: string[]) => void;
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      activeForms: [],
      setActiveForms: (forms) => set({ activeForms: forms }),
      globalLogo: '',
      setGlobalLogo: (logo) => set({ globalLogo: logo }),
      logoLocations: [],
      setLogoLocations: (locations) => set({ logoLocations: locations }),
      theme: 'whatsapp-light',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'pilana-app-storage',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      partialize: (state) => ({
        currentUser: state.currentUser,
        theme: state.theme,
      }),
    }
  )
);

export default useAppStore; 