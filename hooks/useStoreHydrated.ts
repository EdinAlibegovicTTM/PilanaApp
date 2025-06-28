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
    
    // Timeout da se izađe iz loading stanja ako se store ne rehidrira
    const timeout = setTimeout(() => {
      console.log('[useStoreHydrated] Timeout - postavljam hydrated na true');
      setHydrated(true);
    }, 3000); // Povećano na 3 sekunde za debugging
    
    // Čekaj dok Zustand ne rehidrira store iz localStorage
    const unsub = useAppStore.persist.onFinishHydration(() => {
      console.log('[useStoreHydrated] Store rehidriran');
      clearTimeout(timeout);
      setHydrated(true);
    });
    
    // Ako je već hydrated
    if (useAppStore.persist.hasHydrated()) {
      console.log('[useStoreHydrated] Store već rehidriran');
      clearTimeout(timeout);
      setHydrated(true);
    }
    
    // Dodatna provjera - ako localStorage postoji, možemo pretpostaviti da je hydrated
    const storage = localStorage.getItem('pilana-app-storage');
    if (storage) {
      console.log('[useStoreHydrated] localStorage postoji:', storage);
      setTimeout(() => {
        if (!hydrated) {
          console.log('[useStoreHydrated] Force setting hydrated from localStorage');
          clearTimeout(timeout);
          setHydrated(true);
        }
      }, 1000);
    }
    
    return () => {
      clearTimeout(timeout);
      unsub();
    };
  }, [hydrated]);

  console.log('[useStoreHydrated] Return value:', hydrated);
  return hydrated;
} 