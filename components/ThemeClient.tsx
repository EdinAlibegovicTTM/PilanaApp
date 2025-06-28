"use client";
import React, { useEffect } from "react";

export default function ThemeClient({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Provjeri da li je window definisan (klijentska strana)
    if (typeof window === 'undefined') {
      return;
    }

    const theme = localStorage.getItem('theme') || 'whatsapp-light';
    document.body.className = ''; // Resetuj sve klase
    document.body.classList.add(`theme-${theme}`);
  }, []);

  return <>{children}</>;
} 