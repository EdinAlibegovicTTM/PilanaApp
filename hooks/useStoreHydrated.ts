import { useEffect, useState } from "react";
import useAppStore from "@/store/appStore";

export default function useStoreHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    console.log('[useStoreHydrated] useEffect pokrenut');
    
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
    
    // Čekaj dok Zustand ne rehidrira store iz localStorage
    const unsub = useAppStore.persist.onFinishHydration(() => {
      console.log('[useStoreHydrated] Store rehidriran');
      setHydratedTrue();
    });
    
    // Fallback timeout - 2 sekunde umjesto 1
    const timeout = setTimeout(() => {
      console.log('[useStoreHydrated] Timeout - postavljam hydrated na true');
      setHydratedTrue();
    }, 2000);
    
    // Dodatna provjera - ako localStorage postoji, možemo pretpostaviti da je hydrated
    const storage = localStorage.getItem('pilana-app-storage');
    if (storage) {
      console.log('[useStoreHydrated] localStorage postoji, postavljam hydrated');
      clearTimeout(timeout);
      setHydratedTrue();
    }
    
    return () => {
      clearTimeout(timeout);
      unsub();
    };
  }, []);

  console.log('[useStoreHydrated] Return value:', hydrated);
  return hydrated;
} 