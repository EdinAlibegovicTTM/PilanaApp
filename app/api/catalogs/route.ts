import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Konfiguracija Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    
    // Dohvatanje svih tabova iz Google Sheet-a
    if (action === 'tabs') {
      const spreadsheetId = process.env.GOOGLE_SHEET_ID;
      if (!spreadsheetId) {
        return NextResponse.json({ error: 'GOOGLE_SHEET_ID nije konfigurisan' }, { status: 500 });
      }

      const response = await sheets.spreadsheets.get({
        spreadsheetId,
      });

      const tabs = response.data.sheets?.map(sheet => ({
        title: sheet.properties?.title,
        sheetId: sheet.properties?.sheetId,
      })) || [];

      return NextResponse.json({ tabs });
    }

    // Dohvatanje svih podataka iz taba za linked dropdown-ove
    if (action === 'allData') {
      const catalogTab = searchParams.get('tab') || 'Katalozi';
      const spreadsheetId = process.env.GOOGLE_SHEET_ID;
      
      if (!spreadsheetId) {
        return NextResponse.json({ error: 'GOOGLE_SHEET_ID nije konfigurisan' }, { status: 500 });
      }

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${catalogTab}!A:Z`, // Dohvata sve kolone
      });

      const rows = response.data.values || [];
      if (rows.length === 0) {
        return NextResponse.json({ data: [] });
      }

      // Prvi red su zaglavlja (nazivi kolona)
      const headers = rows[0];
      const data = rows.slice(1).map(row => {
        const obj: any = {};
        headers.forEach((header: string, index: number) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });

      return NextResponse.json({ data, headers });
    }

    // Postojeća logika za pojedinačne kolone
    const catalogTab = searchParams.get('tab') || 'Import';
    const column = searchParams.get('column') || 'A';
    const dependencyValue = searchParams.get('dependencyValue');
    const dependencyColumn = searchParams.get('dependencyColumn');
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    
    if (!spreadsheetId) {
      return NextResponse.json({ error: 'GOOGLE_SHEET_ID nije konfigurisan' }, { status: 500 });
    }

    // Konvertuj naziv kolone u slovo (A, B, C...)
    let columnLetter = column;
    if (column.match(/^[A-Za-z]+$/)) {
      // Ako je već slovo, koristi ga
      columnLetter = column.toUpperCase();
    } else {
      // Ako je naziv kolone, trebamo pronaći indeks
      // Za sada ćemo koristiti A kao default
      columnLetter = 'A';
    }

    let range = `${catalogTab}!${columnLetter}:${columnLetter}`;
    
    // Ako postoji zavisnost, dohvataj samo redove koji odgovaraju dependencyValue
    if (dependencyValue && dependencyColumn) {
      const dependencyRange = `${catalogTab}!${dependencyColumn}:${dependencyColumn}`;
      const columnRange = `${catalogTab}!${column}:${column}`;
      
      const [dependencyResponse, columnResponse] = await Promise.all([
        sheets.spreadsheets.values.get({ spreadsheetId, range: dependencyRange }),
        sheets.spreadsheets.values.get({ spreadsheetId, range: columnRange })
      ]);

      const dependencyValues = dependencyResponse.data.values?.[0] || [];
      const columnValues = columnResponse.data.values?.[0] || [];
      
      const filteredValues = columnValues.filter((_, index) => 
        dependencyValues[index] === dependencyValue
      );

      return NextResponse.json({ 
        options: Array.from(new Set(filteredValues)).filter(Boolean) 
      });
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const values = response.data.values?.[0] || [];
    const uniqueValues = Array.from(new Set(values)).filter(Boolean);

    return NextResponse.json({ options: uniqueValues });

  } catch (error) {
    console.error('Greška pri dohvatanju kataloga:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvatanju podataka iz Google Sheet-a' },
      { status: 500 }
    );
  }
} 