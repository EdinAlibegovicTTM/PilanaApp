import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import ThemeClient from '@/components/ThemeClient';
import Header from '@/components/Header';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import ServiceWorkerRegistration from '../components/ServiceWorkerRegistration';
import AxiosInterceptor from '@/components/AxiosInterceptor';

const inter = Inter({ subsets: ['latin'] });

// TEST: Dodajem console.log da vidim da li se layout izvršava
console.log('LAYOUT LOADED - TEST');

export const metadata: Metadata = {
  title: 'Pilana App',
  description: 'Aplikacija za upravljanje formama i izvještajima',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pilana App',
  },
  other: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1877f2',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="bs">
      <head>
        <link rel="icon" href="/icons/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="theme-color" content="#1877f2" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Pilana App" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="robots" content="noindex, nofollow" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeClient>
            <AxiosInterceptor />
            {children}
            <Toaster position="bottom-right" />
          </ThemeClient>
        </ErrorBoundary>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
} 