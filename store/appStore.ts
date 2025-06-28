import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, FormConfig } from '@/types';

interface AppStore {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  activeForms: FormConfig[];
  setActiveForms: (forms: FormConfig[]) => void;
  globalLogo: string;
  setGlobalLogo: (logo: string) => void;
  logoLocations: string[];
  setLogoLocations: (locations: string[]) => void;
}

const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      currentUser: null,
      setCurrentUser: (user) => {
        set({ currentUser: user });
        console.log('[Zustand] setCurrentUser:', user);
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            console.log('[Zustand] pilana-app-storage:', localStorage.getItem('pilana-app-storage'));
          }, 100);
        }
      },
      activeForms: [],
      setActiveForms: (forms) => set({ activeForms: forms }),
      globalLogo: '',
      setGlobalLogo: (logo) => set({ globalLogo: logo }),
      logoLocations: [],
      setLogoLocations: (locations) => set({ logoLocations: locations }),
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
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('[Store] Store rehydrated, currentUser:', state.currentUser);
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              console.log('[Store] pilana-app-storage nakon rehidracije:', localStorage.getItem('pilana-app-storage'));
            }, 100);
          }
        }
      }
    }
  )
);

export default useAppStore; 