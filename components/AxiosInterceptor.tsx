"use client";
import { useEffect } from 'react';
import axios from 'axios';

export default function AxiosInterceptor() {
  useEffect(() => {
    // Provjeri da li je window definisan (klijentska strana)
    if (typeof window === 'undefined') {
      console.log('[AxiosInterceptor] Window nije definisan, preskačem');
      return;
    }

    // Postavi axios interceptor za automatsko dodavanje Authorization header-a
    const interceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        console.log('[AxiosInterceptor] Token postoji:', !!token);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('[AxiosInterceptor] Authorization header postavljen');
        } else {
          console.log('[AxiosInterceptor] Nema tokena');
        }
        return config;
      },
      (error) => {
        console.error('[AxiosInterceptor] Greška u interceptor-u:', error);
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, []);

  return null; // Ova komponenta ne renderuje ništa
} 