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
      setCurrentUser: (user) => set({ currentUser: user }),
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
    }
  )
);

export default useAppStore; 