import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tajna_jwt_lozinka';
const prisma = new PrismaClient();

// Helper funkcija za autorizaciju
async function verifyAuth(req: NextRequest, requireAdmin = true) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'Nedostaje Authorization header.', status: 401 };
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token || token.trim() === '') {
      return { error: 'Token je prazan.', status: 401 };
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return { error: 'Neispravan token.', status: 401 };
    }
    
    if (!decoded || !decoded.id) {
      return { error: 'Token ne sadrži korisničke podatke.', status: 401 };
    }

    // Provjeri da li korisnik postoji i da li je aktivan
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return { error: 'Korisnik nije pronađen.', status: 401 };
    }

    if (!user.isActive) {
      return { error: 'Korisnik je deaktiviran.', status: 401 };
    }

    if (requireAdmin && user.role !== 'admin') {
      return { error: 'Nemate dozvolu za pristup podešavanjima.', status: 403 };
    }

    return { user };
  } catch (error) {
    console.error('Greška pri verifikaciji:', error);
    return { error: 'Greška pri verifikaciji tokena.', status: 401 };
  }
}

// Helper funkcija za validaciju podataka
function validateSettings(data: any) {
  const errors: string[] = [];

  if (data.exportSheetTab && typeof data.exportSheetTab !== 'string') {
    errors.push('exportSheetTab mora biti string');
  }

  if (data.importSheetTab && typeof data.importSheetTab !== 'string') {
    errors.push('importSheetTab mora biti string');
  }

  if (data.globalLogo && typeof data.globalLogo !== 'string') {
    errors.push('globalLogo mora biti string');
  }

  if (data.appIcon && typeof data.appIcon !== 'string') {
    errors.push('appIcon mora biti string');
  }

  if (data.theme && typeof data.theme !== 'string') {
    errors.push('theme mora biti string');
  }

  if (data.logoLocations) {
    try {
      if (typeof data.logoLocations === 'string') {
        JSON.parse(data.logoLocations);
      } else if (!Array.isArray(data.logoLocations)) {
        errors.push('logoLocations mora biti string ili array');
      }
    } catch {
      errors.push('logoLocations nije validan JSON');
    }
  }

  return errors;
}

// Dohvati trenutna podešavanja aplikacije
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req, false);
    if ('error' in auth) {
      console.error('Auth error:', auth.error);
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let settings = await prisma.appSettings.findUnique({
      where: { id: 1 },
    });

    // Ako podešavanja ne postoje, kreiraj ih sa default vrijednostima
    if (!settings) {
      try {
        settings = await prisma.appSettings.create({
          data: {
            id: 1,
            globalLogo: null,
            exportSheetTab: 'Export',
            importSheetTab: 'Import',
            logoLocations: '[]',
            appIcon: null,
            theme: 'whatsapp-light',
          } as any,
        });
      } catch (createError) {
        console.error('Greška pri kreiranju default podešavanja:', createError);
        return NextResponse.json({ 
          error: 'Greška pri kreiranju podešavanja.',
          details: createError instanceof Error ? createError.message : 'Nepoznata greška'
        }, { status: 500 });
      }
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Greška pri dohvatanju podešavanja:', error);
    return NextResponse.json({ 
      error: 'Greška pri dohvatanju podešavanja.',
      details: error instanceof Error ? error.message : 'Nepoznata greška'
    }, { status: 500 });
  }
}

// Ažuriraj podešavanja aplikacije
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json({ error: 'Nevalidan JSON body.' }, { status: 400 });
    }

    const validationErrors = validateSettings(body);
    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Nevalidni podaci.',
        details: validationErrors
      }, { status: 400 });
    }

    const { globalLogo, exportSheetTab, importSheetTab, logoLocations, appIcon, theme } = body;

    // Provjera obaveznih polja
    if (!exportSheetTab || !importSheetTab) {
      return NextResponse.json({ 
        error: 'Nedostaju obavezna polja.',
        details: ['exportSheetTab i importSheetTab su obavezni']
      }, { status: 400 });
    }

    // Priprema podataka za čuvanje
    const settingsData = {
      globalLogo: globalLogo || null,
      exportSheetTab: exportSheetTab.trim(),
      importSheetTab: importSheetTab.trim(),
      logoLocations: typeof logoLocations === 'string' ? logoLocations : JSON.stringify(logoLocations || []),
      appIcon: appIcon || null,
      theme: theme || 'whatsapp-light',
    };

    const updatedSettings = await prisma.appSettings.upsert({
      where: { id: 1 },
      update: settingsData as any,
      create: {
        id: 1,
        globalLogo: settingsData.globalLogo,
        exportSheetTab: settingsData.exportSheetTab,
        importSheetTab: settingsData.importSheetTab,
        logoLocations: settingsData.logoLocations,
        appIcon: settingsData.appIcon,
        theme: settingsData.theme,
      } as any,
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Greška pri čuvanju podešavanja:', error);
    
    // Specifične Prisma greške
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json({ 
          error: 'Podešavanja već postoje.',
          details: 'Pokušajte ažuriranje umjesto kreiranja'
        }, { status: 409 });
      }
      
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json({ 
          error: 'Neispravni podaci.',
          details: 'Provjerite referencirane podatke'
        }, { status: 400 });
      }
    }

    return NextResponse.json({ 
      error: 'Greška pri čuvanju podešavanja.',
      details: error instanceof Error ? error.message : 'Nepoznata greška'
    }, { status: 500 });
  }
}

// OPTIONS za CORS
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
} 