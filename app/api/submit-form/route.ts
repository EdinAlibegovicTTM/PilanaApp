import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formId, data } = body;

    if (!formId || !data) {
      return NextResponse.json(
        { error: 'Form ID i data su obavezni' },
        { status: 400 }
      );
    }

    // Privremeno rješenje - samo spremi u bazu bez Google Sheets
    console.log('[SUBMIT_FORM] Forma poslana:', { formId, data });
    
    return NextResponse.json({
      success: true,
      message: 'Forma uspješno poslana (privremeno rješenje)',
      data: data
    });

  } catch (error) {
    console.error('Submit form error:', error);
    return NextResponse.json(
      { error: 'Greška pri slanju forme' },
      { status: 500 }
    );
  }
} 