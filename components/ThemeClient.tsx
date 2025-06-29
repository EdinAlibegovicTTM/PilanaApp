"use client";
import React, { useEffect } from "react";
import useAppStore from "@/store/appStore";

export default function ThemeClient({ children }: { children: React.ReactNode }) {
  const { theme } = useAppStore();

  useEffect(() => {
    // Provjeri da li je window definisan (klijentska strana)
    if (typeof window === 'undefined') {
      return;
    }

    document.body.className = ''; // Resetuj sve klase
    document.body.classList.add(`theme-${theme}`);
    
    // Također sačuvaj u localStorage za kompatibilnost
    localStorage.setItem('theme', theme);
  }, [theme]);

  return <>{children}</>;
} 