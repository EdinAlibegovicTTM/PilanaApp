import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs'; // Za podršku file systema na Vercel-u

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Fajl nije poslan.' }, { status: 400 });
    }

    // Provjeri tip i veličinu
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Samo slike su podržane.' }, { status: 400 });
    }
    
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      return NextResponse.json({ error: 'Fajl je prevelik (max 2MB).' }, { status: 400 });
    }

    // Kreiraj buffer iz fajla
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Kreiraj icons direktorij
    const iconsDir = path.join(process.cwd(), 'public', 'icons');
    await fs.mkdir(iconsDir, { recursive: true });

    // Snimi glavnu ikonicu (192x192)
    const iconPath = path.join(iconsDir, 'icon-192x192.png');
    await fs.writeFile(iconPath, buffer);

    // Snimi favicon (32x32)
    const faviconPath = path.join(iconsDir, 'favicon.ico');
    await fs.writeFile(faviconPath, buffer);

    // Snimi apple touch icon (180x180)
    const appleIconPath = path.join(iconsDir, 'apple-touch-icon.png');
    await fs.writeFile(appleIconPath, buffer);

    // Snimi manifest icon (512x512)
    const manifestIconPath = path.join(iconsDir, 'icon-512x512.png');
    await fs.writeFile(manifestIconPath, buffer);

    // Ažuriraj app-settings sa novom ikonicom
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      // Samo provjeri da li postoji app-settings, ne ažuriraj appIcon
      await prisma.appSettings.upsert({
        where: { id: 1 },
        update: {},
        create: { 
          id: 1
        }
      });
      
      await prisma.$disconnect();
    } catch (dbError) {
      console.error('Greška pri ažuriranju baze podataka:', dbError);
      // Nastavi iako je greška u bazi - fajl je snimljen
    }

    return NextResponse.json({ 
      url: '/icons/icon-192x192.png',
      message: 'Ikonica uspješno postavljena!'
    });
    
  } catch (error) {
    console.error('Greška pri uploadu ikonice:', error);
    return NextResponse.json({ 
      error: 'Greška pri uploadu ikonice.' 
    }, { status: 500 });
  }
} 