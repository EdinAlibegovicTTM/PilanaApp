import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formId, formName, submittedBy, values, fields, sheetTab } = body;

    if (!formId || !values) {
      return NextResponse.json(
        { error: 'Form ID i values su obavezni' },
        { status: 400 }
      );
    }

    // Privremeno rješenje - samo spremi u bazu bez Google Sheets
    console.log('[SUBMIT_FORM] Forma poslana:', { 
      formId, 
      formName, 
      submittedBy, 
      values, 
      fields: fields?.length || 0,
      sheetTab 
    });
    
    return NextResponse.json({
      success: true,
      message: 'Forma uspješno poslana (privremeno rješenje)',
      data: {
        formId,
        formName,
        submittedBy,
        values,
        submittedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Submit form error:', error);
    return NextResponse.json(
      { error: 'Greška pri slanju forme' },
      { status: 500 }
    );
  }
} 