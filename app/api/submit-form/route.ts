import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import googleSheetsService from '@/lib/googleSheets';

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

    // Dohvati konfiguraciju forme iz baze
    const form = await prisma.form.findUnique({
      where: { id: formId }
    });

    if (!form) {
      return NextResponse.json(
        { error: 'Forma nije pronađena' },
        { status: 404 }
      );
    }

    // Provjeri da li su Google Sheets environment variables postavljeni
    const hasGoogleSheetsConfig = process.env.GOOGLE_SHEETS_PRIVATE_KEY && 
                                 process.env.GOOGLE_SHEETS_CLIENT_EMAIL && 
                                 process.env.GOOGLE_SHEET_ID;

    if (hasGoogleSheetsConfig && process.env.GOOGLE_SHEET_ID) {
      try {
        // Parse fields iz JSON stringa
        const formFields = form.fields ? JSON.parse(form.fields) : [];
        
        // Pripremi podatke za Google Sheets
        const formData = {
          id: formId.toString(),
          formId: formId.toString(),
          data: values,
          submittedAt: new Date(),
          submittedBy: submittedBy || 'Unknown',
          status: 'submitted' as const,
          exportedToGoogleSheets: false
        };

        const formConfig = {
          id: form.id.toString(),
          name: form.name,
          googleSheetId: process.env.GOOGLE_SHEET_ID,
          googleSheetName: sheetTab || 'Sheet1',
          fields: formFields,
          layout: {
            columns: 1,
            backgroundColor: '#ffffff',
            gridSize: 10
          },
          requiresConfirmation: false,
          confirmationRoles: [],
          createdAt: form.createdAt,
          updatedAt: form.updatedAt,
          createdBy: 'system',
          isActive: form.isActive
        };

        // Eksportuj u Google Sheets
        const exportResult = await googleSheetsService.exportFormData(formData, formConfig);

        if (exportResult.success) {
          return NextResponse.json({
            success: true,
            message: 'Forma uspješno poslana i eksportovana u Google Sheets',
            data: {
              formId,
              formName,
              submittedBy,
              values,
              submittedAt: new Date().toISOString(),
              googleSheetsExport: exportResult
            }
          });
        } else {
          return NextResponse.json({
            success: false,
            message: 'Forma poslana, ali greška pri eksportu u Google Sheets',
            error: exportResult.message
          }, { status: 500 });
        }

      } catch (googleSheetsError) {
        return NextResponse.json({
          success: false,
          message: 'Forma poslana, ali greška pri Google Sheets integraciji',
          error: googleSheetsError instanceof Error ? googleSheetsError.message : 'Nepoznata greška'
        }, { status: 500 });
      }
    } else {
      // Ako nema Google Sheets konfiguracije, samo vrati uspjeh
      return NextResponse.json({
        success: true,
        message: 'Forma uspješno poslana (Google Sheets nije konfigurisan)',
        data: {
          formId,
          formName,
          submittedBy,
          values,
          submittedAt: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    return NextResponse.json(
      { error: 'Greška pri slanju forme' },
      { status: 500 }
    );
  }
} 