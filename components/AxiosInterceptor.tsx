"use client";
import { useEffect } from 'react';
import axios from 'axios';

export default function AxiosInterceptor() {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const interceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, []);

  return null;
} 