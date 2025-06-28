import { NextRequest, NextResponse } from 'next/server';
import googleSheetsService from '@/lib/googleSheets';

interface GroupedData {
  [key: string]: string | number;
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const googleSheetName = searchParams.get('googleSheetName');
  const groupBy = searchParams.get('groupBy'); // npr. 'Naziv proizvoda,Dimenzija,Vrsta obrade'
  const sumBy = searchParams.get('sumBy'); // npr. 'Količina'

  if (!googleSheetName) {
    return NextResponse.json({ error: 'Nedostaje googleSheetName.' }, { status: 400 });
  }

  // Koristi fiksni Google Sheet ID iz environment varijabli
  const googleSheetId = process.env.GOOGLE_SHEET_ID;
  if (!googleSheetId) {
    return NextResponse.json({ error: 'Google Sheet ID not configured' }, { status: 500 });
  }

  // Pripremi parametre za filtriranje
  const filterParams: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (key !== 'googleSheetName' && key !== 'groupBy' && key !== 'sumBy' && value) {
      filterParams[key] = value;
    }
  });

  try {
    // Dohvati sve podatke iz sheeta
    const values = await googleSheetsService.getAllSheetData(googleSheetId, googleSheetName);
    if (!values || values.length === 0) {
      return NextResponse.json({ data: [] });
    }
    // Prva linija su zaglavlja
    const headers = values[0];
    const rows = values.slice(1);
    // Pretvori u objekte
    let data: Record<string, string | number>[] = rows.map(row => {
      const obj: Record<string, string> = {};
      headers.forEach((h: string, i: number) => {
        obj[h] = row[i] || '';
      });
      return obj;
    });
    // Filtriraj po parametrima
    if (Object.keys(filterParams).length > 0) {
      data = data.filter(row => {
        return Object.entries(filterParams).every(([key, value]) => {
          return (String(row[key]) || '').toLowerCase().includes(value.toLowerCase());
        });
      });
    }
    // Grupisanje i sabiranje
    if (groupBy && sumBy) {
      const groupCols = groupBy.split(',').map(s => s.trim());
      const sumCol = sumBy.trim();
      const grouped: Record<string, GroupedData> = {};
      for (const row of data) {
        const key = groupCols.map(col => String(row[col]) || '').join('|');
        if (!grouped[key]) {
          grouped[key] = { ...groupCols.reduce((acc, col) => ({ ...acc, [col]: row[col] }), {}), [sumCol]: 0 };
        }
        grouped[key][sumCol] = Number(grouped[key][sumCol]) + parseFloat(String(row[sumCol]) || '0');
      }
      data = Object.values(grouped);
    }
    return NextResponse.json({ data });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Greška pri dohvaćanju podataka iz Google Sheeta.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 