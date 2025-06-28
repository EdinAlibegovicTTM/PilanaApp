import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Ažuriraj korisnika (npr. aktivacija/deaktivacija)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('[API PUT /users/[id]] Zahtjev za ažuriranje korisnika, ID:', params.id);
    
    const body = await req.json();
    const { username, password, role, ime, prezime, telefon } = body;
    
    console.log('[API PUT /users/[id]] Primljeni podaci:', { username, role, ime, prezime, telefon, hasPassword: !!password });
    
    if (!username || !role) {
      console.log('[API PUT /users/[id]] Nedostaju obavezna polja');
      return NextResponse.json({ error: 'Nedostaju obavezna polja.' }, { status: 400 });
    }
    
    const userId = Number(params.id);
    console.log('[API PUT /users/[id]] Konvertovan ID:', userId);
    
    // Prvo provjeri da li korisnik postoji
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!existingUser) {
      console.log('[API PUT /users/[id]] Korisnik nije pronađen, ID:', userId);
      return NextResponse.json({ error: 'Korisnik nije pronađen.' }, { status: 404 });
    }
    
    console.log('[API PUT /users/[id]] Korisnik pronađen:', existingUser.username);
    
    const data: Record<string, unknown> = { username, role, ime, prezime, telefon };
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }
    
    console.log('[API PUT /users/[id]] Podaci za ažuriranje:', data);
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        ime: true,
        prezime: true,
        telefon: true,
        isActive: true
      }
    });
    
    console.log('[API PUT /users/[id]] Korisnik uspješno ažuriran:', updatedUser.username);
    return NextResponse.json(updatedUser);
  } catch (err: unknown) {
    console.error('[API PUT /users/[id]] Greška pri ažuriranju:', err);
    const error = err as Error;
    return NextResponse.json({ error: error.message || 'Greška pri ažuriranju korisnika.' }, { status: 500 });
  }
}

// Obriši korisnika
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('[API DELETE /users/[id]] Zahtjev za brisanje korisnika, ID:', params.id);
    
    const userId = Number(params.id);
    await prisma.user.delete({ where: { id: userId } });
    
    console.log('[API DELETE /users/[id]] Korisnik uspješno obrisan, ID:', userId);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[API DELETE /users/[id]] Greška pri brisanju:', err);
    const error = err as Error;
    return NextResponse.json({ error: error.message || 'Greška pri brisanju korisnika.' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[API GET /users/[id]] Zahtjev za dohvaćanje korisnika, ID:', params.id);
    
    const userId = Number(params.id);
    const data = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!data) {
      console.log('[API GET /users/[id]] Korisnik nije pronađen, ID:', userId);
      return NextResponse.json({ error: 'Korisnik nije pronađen' }, { status: 404 });
    }
    
    console.log('[API GET /users/[id]] Korisnik pronađen:', data.username);
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('[API GET /users/[id]] Greška pri dohvaćanju korisnika:', error);
    return NextResponse.json({ error: 'Greška pri dohvaćanju korisnika' }, { status: 500 });
  }
} 