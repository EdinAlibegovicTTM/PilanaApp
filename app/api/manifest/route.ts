import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  // Dohvati appIcon iz baze
  const settings = await prisma.appSettings.findUnique({ where: { id: 1 } }) as { appIcon?: string } | null;
  const iconUrl = settings?.appIcon || '/icons/icon-192x192.png';
  return NextResponse.json({
    name: 'Pilana App',
    short_name: 'Pilana',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      {
        src: iconUrl,
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: iconUrl,
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  });
} 