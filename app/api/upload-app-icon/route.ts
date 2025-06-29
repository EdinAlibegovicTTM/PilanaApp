import { NextRequest, NextResponse } from 'next/server';
import { firebaseStorage } from '@/lib/firebaseAdmin';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

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
    
    let publicUrl: string;

    // Provjeri da li je Firebase Storage dostupan
    if (firebaseStorage) {
      // Koristi Firebase Storage
      const filename = `icons/app-icon-${uuidv4()}.png`;
      const bucket = firebaseStorage.bucket();
      const fileRef = bucket.file(filename);
      
      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type,
          metadata: {
            originalName: file.name,
            uploadedAt: new Date().toISOString(),
            type: 'app-icon'
          }
        }
      });

      publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
    } else {
      // Fallback: koristi base64 encoding
      const base64Data = buffer.toString('base64');
      publicUrl = `data:${file.type};base64,${base64Data}`;
    }

    // Ažuriraj app-settings sa novom ikonicom
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      await prisma.appSettings.upsert({
        where: { id: 1 },
        update: {
          appIcon: publicUrl
        },
        create: { 
          id: 1,
          appIcon: publicUrl
        }
      });
      
      await prisma.$disconnect();
    } catch (dbError) {
      console.error('Greška pri ažuriranju baze podataka:', dbError);
      // Nastavi iako je greška u bazi - fajl je snimljen
    }

    return NextResponse.json({ 
      url: publicUrl,
      message: 'Ikonica uspješno postavljena!'
    });
    
  } catch (error) {
    console.error('Greška pri uploadu ikonice:', error);
    return NextResponse.json({ 
      error: 'Greška pri uploadu ikonice.' 
    }, { status: 500 });
  }
} 