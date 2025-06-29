import { useEffect, useState } from "react";
import useAppStore from "@/store/appStore";

export default function useStoreHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useAppStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }

    const unsub = useAppStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    return () => unsub();
  }, []);

  return hydrated;
} 