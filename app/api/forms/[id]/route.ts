import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Dohvati formu po id-u
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const form = await prisma.form.findUnique({ where: { id: Number(params.id) } });
  if (!form) return NextResponse.json({ error: 'Forma nije pronađena.' }, { status: 404 });
  const parsedForm = {
    ...form,
    fields: form.fields ? JSON.parse(form.fields) : [],
    allowedUsers: form.allowedUsers ? JSON.parse(form.allowedUsers) : [],
    layout: {
      columns: 1,
      backgroundColor: form.backgroundColor || '#ffffff',
      gridSize: 20
    }
  };
  return NextResponse.json(parsedForm);
}

// Izmijeni formu po id-u
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { name, description, backgroundColor, fields, allowedUsers, image, layout } = body;
    
    // Izvuci backgroundColor iz layout objekta ako postoji
    const bgColor = backgroundColor || (layout?.backgroundColor) || '#ffffff';
    
    const updatedForm = await prisma.form.update({
      where: { id: Number(params.id) },
      data: {
        name,
        description,
        backgroundColor: bgColor,
        fields: JSON.stringify(fields),
        allowedUsers: JSON.stringify(allowedUsers || []),
        image: image,
      }
    });
    const parsedForm = {
      ...updatedForm,
      fields: updatedForm.fields ? JSON.parse(updatedForm.fields) : [],
      allowedUsers: updatedForm.allowedUsers ? JSON.parse(updatedForm.allowedUsers) : [],
      layout: {
        columns: 1,
        backgroundColor: updatedForm.backgroundColor || '#ffffff',
        gridSize: 20
      }
    };
    return NextResponse.json(parsedForm);
  } catch (error) {
    console.error('Greška pri ažuriranju forme:', error);
    return NextResponse.json({ error: 'Došlo je do greške prilikom ažuriranja forme.' }, { status: 500 });
  }
}

// Obriši formu po id-u
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.form.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ success: true });
} 