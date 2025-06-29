import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Ažuriraj korisnika (npr. aktivacija/deaktivacija)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { username, password, role, ime, prezime, telefon } = body;
    
    if (!username || !role) {
      return NextResponse.json({ error: 'Nedostaju obavezna polja.' }, { status: 400 });
    }
    
    const userId = Number(params.id);
    
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!existingUser) {
      return NextResponse.json({ error: 'Korisnik nije pronađen.' }, { status: 404 });
    }
    
    const data: Record<string, unknown> = { username, role, ime, prezime, telefon };
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }
    
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
    
    return NextResponse.json(updatedUser);
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || 'Greška pri ažuriranju korisnika.' }, { status: 500 });
  }
}

// Obriši korisnika
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = Number(params.id);
    await prisma.user.delete({ where: { id: userId } });
    
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || 'Greška pri brisanju korisnika.' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = Number(params.id);
    const data = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!data) {
      return NextResponse.json({ error: 'Korisnik nije pronađen' }, { status: 404 });
    }
    
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Greška pri dohvaćanju korisnika' }, { status: 500 });
  }
} 