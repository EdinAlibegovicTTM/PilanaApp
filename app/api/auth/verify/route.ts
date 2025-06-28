import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'tajna_jwt_lozinka';
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Nedostaje Authorization header.' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verifikuj token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Dohvati korisnika iz baze
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Korisnik nije pronađen ili je deaktiviran.' }, { status: 401 });
    }

    // Ukloni password iz response-a
    const { password: _password, ...userData } = user;

    // Dodaj permissions na osnovu role
    let permissions: string[] = [];
    if (user.role === 'admin' || user.role === 'manager') {
      permissions = ['forms', 'reports'];
    } else if (user.role === 'user') {
      permissions = ['forms'];
    }
    const responseUser = { ...userData, permissions };

    return NextResponse.json({ user: responseUser, valid: true });
  } catch (error) {
    console.error('[VERIFY] Greška pri verifikaciji tokena:', error);
    return NextResponse.json({ error: 'Neispravan token.' }, { status: 401 });
  }
} 