import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { withRateLimit, uploadRateLimiter } from '@/lib/rateLimit';
import { withCors } from '@/lib/cors';

export const runtime = 'nodejs';

// Lista dozvoljenih MIME tipova
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp'
];

// Maksimalna veličina fajla (2MB)
const MAX_FILE_SIZE = 2 * 1024 * 1024;

async function uploadImageHandler(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Fajl nije poslan.' }, { status: 400 });
    }

    // Validacija MIME tipa
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: `Nedozvoljen tip fajla. Dozvoljeni tipovi: ${ALLOWED_MIME_TYPES.join(', ')}` 
      }, { status: 400 });
    }

    // Validacija veličine fajla
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `Fajl je prevelik. Maksimalna veličina: ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
      }, { status: 400 });
    }

    // Validacija imena fajla
    const fileName = file.name;
    if (!fileName || fileName.length > 255) {
      return NextResponse.json({ error: 'Nevažeće ime fajla.' }, { status: 400 });
    }

    // Provjeri da li ima ekstenziju
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!ext || !['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return NextResponse.json({ error: 'Nedozvoljena ekstenzija fajla.' }, { status: 400 });
    }

    // Kreiraj buffer iz fajla
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Kreiraj uploads direktorij
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    // Generiši jedinstveno ime fajla
    const filename = `${uuidv4()}.${ext}`;
    const filePath = path.join(uploadsDir, filename);

    // Snimi fajl
    await fs.writeFile(filePath, buffer);

    // Generiši javni URL
    const publicUrl = `/uploads/${filename}`;
    
    return NextResponse.json({ 
      url: publicUrl,
      filename: filename,
      size: file.size,
      type: file.type
    });
  } catch (error) {
    console.error('Greška pri uploadu slike:', error);
    return NextResponse.json({ 
      error: (error as Error).message || 'Greška pri uploadu slike.' 
    }, { status: 500 });
  }
}

// Eksportuj handler sa rate limiting i CORS
export const POST = withCors(withRateLimit(uploadImageHandler, uploadRateLimiter)); 