import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Dohvati sve forme
export async function GET() {
  try {
    const forms = await prisma.form.findMany();
    // Parsiraj fields i allowedUsers iz JSON stringa
    const parsedForms = forms.map((form: Record<string, unknown>) => ({
      ...form,
      fields: typeof form.fields === 'string' ? JSON.parse(form.fields) : [],
      allowedUsers: typeof form.allowedUsers === 'string' ? JSON.parse(form.allowedUsers) : [],
    }));
    return NextResponse.json(parsedForms);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Greška na serveru.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Dodaj novu formu
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, backgroundColor, fields, allowedUsers, image } = body;
    const newForm = await prisma.form.create({
      data: {
        name,
        description,
        backgroundColor,
        fields: JSON.stringify(fields),
        allowedUsers: JSON.stringify(allowedUsers || []),
        image: image || 'uploads/default.png',
      }
    });
    // Parsiraj fields i allowedUsers za response
    const parsedForm = {
      ...newForm,
      fields: newForm.fields ? JSON.parse(newForm.fields) : [],
      allowedUsers: newForm.allowedUsers ? JSON.parse(newForm.allowedUsers) : [],
    };
    return NextResponse.json(parsedForm, { status: 201 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Greška na serveru.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 