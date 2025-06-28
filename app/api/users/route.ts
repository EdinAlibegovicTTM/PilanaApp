import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET() {
  const users = await prisma.user.findMany({
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
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { username, email, password, role, ime, prezime, telefon } = body;

  if (!username || !email || !password || !role) {
    return NextResponse.json({ error: 'Nedostaju obavezna polja.' }, { status: 400 });
  }

  // Provjeri da li username ili email već postoji
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { username },
        { email }
      ]
    }
  });
  if (existing) {
    return NextResponse.json({ error: 'Korisničko ime ili email već postoji.' }, { status: 409 });
  }

  // Hashiraj lozinku
  const password_hash = await bcrypt.hash(password, 10);

  // Unesi korisnika (isActive=true)
  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: password_hash,
      role,
      ime,
      prezime,
      telefon,
      isActive: true
    },
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

  return NextResponse.json(user, { status: 201 });
} 