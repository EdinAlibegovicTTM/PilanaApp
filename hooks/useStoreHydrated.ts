import { useState, useEffect } from 'react';
import useAppStore from '@/store/appStore';

export default function useStoreHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (useAppStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }

    const onFinishHydration = () => {
      setHydrated(true);
    };

    const timeout = setTimeout(() => {
      setHydrated(true);
    }, 1000);

    useAppStore.persist.onFinishHydration(onFinishHydration);

    return () => {
      clearTimeout(timeout);
      useAppStore.persist.onFinishHydration(() => {});
    };
  }, []);

  return hydrated;
} 