import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Korisničko ime i lozinka su obavezni' },
        { status: 400 }
      );
    }

    // Pronađi korisnika
    const user = await prisma.user.findFirst({
      where: { username }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Pogrešno korisničko ime ili lozinka' },
        { status: 401 }
      );
    }

    // Provjeri lozinku
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Pogrešno korisničko ime ili lozinka' },
        { status: 401 }
      );
    }

    // Generiši JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    // Dodaj permissions na osnovu role
    let permissions: string[] = [];
    if (user.role === 'admin' || user.role === 'manager') {
      permissions = ['forms', 'reports'];
    } else if (user.role === 'user') {
      permissions = ['forms'];
    }

    return NextResponse.json({
      user: { id: user.id, username: user.username, role: user.role, permissions },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Greška pri prijavi' },
      { status: 500 }
    );
  }
} 