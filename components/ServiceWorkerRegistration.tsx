'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Provjeri da li je window definisan (klijentska strana)
    if (typeof window === 'undefined') {
      return;
    }

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js').then(function (registration) {
          // Service Worker registered successfully
        }, function (registrationError) {
          // Service Worker registration failed
        });
      });
    }
  }, []);

  return null;
} 