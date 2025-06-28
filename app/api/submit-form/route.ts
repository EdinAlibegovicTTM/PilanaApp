import { NextRequest, NextResponse } from 'next/server';
import { googleSheetsService } from '@/lib/googleSheets';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // 1. Dohvati globalna podešavanja i Sheet ID iz env
    const settings = await prisma.appSettings.findUnique({ where: { id: 1 } }) as { id: number; globalLogo: string | null; exportSheetTab: string | null };
    const googleSheetId = process.env.GOOGLE_SHEET_ID;
    const sheetTab = settings?.exportSheetTab;

    console.log(`[SUBMIT_FORM_DEBUG] Pokretanje obrade... Time: ${new Date().toISOString()}`);
    console.log(`[SUBMIT_FORM_DEBUG] Google Sheet ID iz env: ${googleSheetId ? `"${googleSheetId}"` : 'NIJE POSTAVLJEN'}`);
    console.log(`[SUBMIT_FORM_DEBUG] Export tab iz baze: ${sheetTab ? `"${sheetTab}"` : 'NIJE POSTAVLJEN'}`);

    // Validacija da li podešavanja postoje
    if (!googleSheetId) {
      const errorMessage = 'Google Sheet ID nije konfigurisan u environment varijablama.';
      console.error(`[Form Submit] Error: ${errorMessage}`);
      return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }

    if (!sheetTab) {
      const errorMessage = 'Naziv export taba nije konfigurisan u podešavanjima aplikacije.';
      console.error(`[Form Submit] Error: ${errorMessage}`);
      return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }

    // 2. Preuzmi podatke iz forme
    const body = await req.json();
    const { values, fields, formName, formId } = body;

    // Automatski popuni samo polja tipa 'datetime' ako nisu popunjena
    fields.forEach((field: any) => {
      if (field.type === 'datetime' && !values[field.id]) {
        values[field.id] = new Date().toISOString();
      }
    });

    console.log(`[Form Submit] Attempting to write to Google Sheet. ID: [${googleSheetId}], Tab Name: [${sheetTab}]`);

    // 3. Validiraj pristup Google Sheet-u
    console.log(`[SUBMIT_FORM_DEBUG] Pokušaj validacije pristupa za Sheet ID: "${googleSheetId}" i Tab: "${sheetTab}"`);
    try {
      const hasAccess = await googleSheetsService.validateSheetAccess(googleSheetId, sheetTab);
      if (!hasAccess) {
        const errorMessage = `Nema pristupa Google Sheet-u ili tab '${sheetTab}' ne postoji. Provjerite da li ste podijelili dokument sa emailom servisnog naloga i da li naziv taba tačan.`;
        console.error(`[SUBMIT_FORM_ERROR] Validacija neuspješna. ${errorMessage}`);
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
      }
      console.log(`[SUBMIT_FORM_DEBUG] Validacija pristupa uspješna.`);
    } catch (validationError) {
      const errorMessage = `Greška pri validaciji pristupa Google Sheet-u.`;
      console.error(`[SUBMIT_FORM_ERROR] Uhvaćena greška u validation bloku:`, validationError);
      return NextResponse.json({ success: false, error: `${errorMessage} Detalji u logu servera.` }, { status: 500 });
    }

    // 4. Pripremi podatke za slanje
    const formData = {
      id: `entry_${Date.now()}_${Math.floor(Math.random()*10000)}`,
      formId: formId,
      data: values,
      status: 'submitted' as const,
      exportedToGoogleSheets: false,
      submittedAt: new Date(),
    };
    const formConfig = {
      id: formId,
      name: formName,
      fields,
      googleSheetId: googleSheetId, // Koristi globalni ID
      googleSheetName: sheetTab,    // Koristi globalni tab
      layout: { columns: 1, backgroundColor: '#fff', gridSize: 20 },
      requiresConfirmation: false,
      confirmationRoles: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: '',
      isActive: true,
    };

    // 5. Pozovi servis za upis
    console.log('[SUBMIT_FORM_DEBUG] Pripremljeni podaci se šalju na upis u Google Sheet.');
    const result = await googleSheetsService.exportFormData(formData, formConfig);

    if (result.success) {
      console.log('[SUBMIT_FORM_DEBUG] Podaci uspješno upisani.');
      return NextResponse.json({ success: true });
    } else {
      console.error('[SUBMIT_FORM_ERROR] Servis je vratio grešku pri eksportu:', result.message);
      return NextResponse.json({ success: false, error: result.message }, { status: 500 });
    }
  } catch (err) {
    console.error('[SUBMIT_FORM_ERROR] Generalna greška u submit-form ruti:', err);
    return NextResponse.json({ success: false, error: (err as Error).message || 'Greška pri upisu u Google Sheet.' }, { status: 500 });
  }
} 