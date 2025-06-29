import { useEffect, useState } from "react";
import useAppStore from "@/store/appStore";

export default function useStoreHydrated() {
  // TEST: Odmah postavi hydrated na true
  const [hydrated, setHydrated] = useState(true);

  useEffect(() => {
    console.log('[useStoreHydrated] useEffect pokrenut');
    console.log('[useStoreHydrated] Window definisan:', typeof window !== 'undefined');
    console.log('[useStoreHydrated] Store hasHydrated:', useAppStore.persist.hasHydrated());
    console.log('[useStoreHydrated] localStorage pilana-app-storage:', localStorage.getItem('pilana-app-storage'));
    
    // Provjeri da li je window definisan
    if (typeof window === 'undefined') {
      console.log('[useStoreHydrated] Window nije definisan, preskačem');
      return;
    }
    
    // Funkcija za postavljanje hydrated na true
    const setHydratedTrue = () => {
      console.log('[useStoreHydrated] Postavljam hydrated na true');
      setHydrated(true);
    };
    
    // Provjeri da li je store već rehidriran
    if (useAppStore.persist.hasHydrated()) {
      console.log('[useStoreHydrated] Store već rehidriran');
      setHydratedTrue();
      return;
    }
    
    // Dodatna provjera - ako localStorage postoji, možemo pretpostaviti da je hydrated
    const storage = localStorage.getItem('pilana-app-storage');
    if (storage) {
      console.log('[useStoreHydrated] localStorage postoji, postavljam hydrated');
      setHydratedTrue();
      return;
    }
    
    // Čekaj dok Zustand ne rehidrira store iz localStorage
    console.log('[useStoreHydrated] Postavljam onFinishHydration listener');
    const unsub = useAppStore.persist.onFinishHydration(() => {
      console.log('[useStoreHydrated] Store rehidriran kroz onFinishHydration');
      setHydratedTrue();
    });
    
    // Fallback timeout - 3 sekunde
    const timeout = setTimeout(() => {
      console.log('[useStoreHydrated] Timeout - postavljam hydrated na true');
      setHydratedTrue();
    }, 3000);
    
    return () => {
      console.log('[useStoreHydrated] Cleanup - brišem timeout i listener');
      clearTimeout(timeout);
      unsub();
    };
  }, []);

  console.log('[useStoreHydrated] Return value:', hydrated);
  return hydrated;
} 