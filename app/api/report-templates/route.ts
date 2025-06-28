import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tajna_jwt_lozinka';
const prisma = new PrismaClient();

// Dohvati sve predloške
export async function GET() {
  try {
    const templates = await prisma.reportTemplate.findMany();
    // Parsiraj sections i parameters iz JSON stringa
    const parsedTemplates = templates.map((tpl: Record<string, unknown>) => ({
      ...tpl,
      parameters: tpl.parameters ? JSON.parse(tpl.parameters as string) : [],
      sections: tpl.sections ? JSON.parse(tpl.sections as string) : [],
      allowedUsers: tpl.allowedUsers ? JSON.parse(tpl.allowedUsers as string) : [],
    }));
    return NextResponse.json(parsedTemplates);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Greška na serveru.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Kreiraj novi predložak
export async function POST(req: NextRequest) {
  try {
    // Provjeri autorizaciju
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Nedostaje autorizacijski token.' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verifikuj token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Dohvati korisnika iz baze
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Korisnik nije pronađen ili je deaktiviran.' }, { status: 401 });
    }

    // Samo admin može kreirati izvještaje
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Nemate dozvolu za kreiranje izvještaja.' }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, thumbnail, parameters, sections, allowedUsers, googleSheetName } = body;
    
    // Validacija obaveznih polja
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Naziv izvještaja je obavezan.' }, { status: 400 });
    }
    
    if (!googleSheetName || !googleSheetName.trim()) {
      return NextResponse.json({ error: 'Google Sheet naziv je obavezan.' }, { status: 400 });
    }
    
    // Validacija parametara
    if (parameters && Array.isArray(parameters)) {
      for (let i = 0; i < parameters.length; i++) {
        const param = parameters[i];
        if (!param.name || !param.name.trim()) {
          return NextResponse.json({ error: `Parametar ${i + 1} mora imati naziv.` }, { status: 400 });
        }
      }
    }
    
    // Validacija sekcija
    if (sections && Array.isArray(sections)) {
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        if (!section.type) {
          return NextResponse.json({ error: `Sekcija ${i + 1} mora imati tip.` }, { status: 400 });
        }
        if (section.type === 'table' && (!section.columns || !Array.isArray(section.columns) || section.columns.length === 0)) {
          return NextResponse.json({ error: `Tabela sekcija "${section.title || i + 1}" mora imati kolone.` }, { status: 400 });
        }
      }
    }
    
    // Provjeri da li već postoji izvještaj sa istim nazivom
    const existingTemplate = await prisma.reportTemplate.findFirst({
      where: { name: name.trim() }
    });
    
    if (existingTemplate) {
      return NextResponse.json({ error: 'Izvještaj sa ovim nazivom već postoji.' }, { status: 409 });
    }
    
    const newTemplate = await prisma.reportTemplate.create({
      data: {
        name: name.trim(),
        description: description?.trim() || '',
        thumbnail: thumbnail?.trim() || '',
        googleSheetId: '',
        googleSheetName: googleSheetName.trim(),
        parameters: JSON.stringify(parameters || []),
        sections: JSON.stringify(sections || []),
        allowedUsers: JSON.stringify(allowedUsers || []),
        createdBy: user.id,
      }
    });
    
    return NextResponse.json({
      message: 'Izvještaj uspješno kreiran!',
      template: newTemplate
    }, { status: 201 });
    
  } catch (err: unknown) {
    console.error('Greška pri kreiranju izvještaja:', err);
    const errorMessage = err instanceof Error ? err.message : 'Greška na serveru.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 