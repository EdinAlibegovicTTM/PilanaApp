import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import OpenAI from 'openai';
import jwt from 'jsonwebtoken';

// Konfiguracija Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const JWT_SECRET = process.env.JWT_SECRET || 'tajna_jwt_lozinka';

const openaiKey = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    // Provjeri autorizaciju
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    let userId = null;
    let role = null;
    if (token) {
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
        role = decoded.role;
      } catch {
        return NextResponse.json({ error: 'Neispravan ili istekao token.' }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: 'Nedostaje Authorization header.' }, { status: 401 });
    }

    // Provjeri allowedUsers iz localStorage (ili request body)
    const body = await request.json();
    // Očekujemo da allowedUsers dođe u body-u (ili dohvatiti iz baze/app-settings po potrebi)
    let allowedUsers: string[] = [];
    if (body.allowedUsers && Array.isArray(body.allowedUsers)) {
      allowedUsers = body.allowedUsers;
    } else {
      // fallback: pokušaj dohvatiti iz app-settings ili odbij
      // (ovdje možeš dodati logiku za dohvat allowedUsers iz baze/app-settings ako treba)
    }

    if (role !== 'admin' && (!userId || !allowedUsers.includes(userId.toString()))) {
      return NextResponse.json({ error: 'Nemate dozvolu za AI izvještaje.' }, { status: 403 });
    }

    const { prompt, sheetName, chat } = body;

    if (!prompt || !sheetName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Koristi fiksni Google Sheet ID iz environment varijabli
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!sheetId) {
      return NextResponse.json({ error: 'Google Sheet ID not configured' }, { status: 500 });
    }
    if (!openaiKey) {
      return NextResponse.json({ error: 'OpenAI API ključ nije postavljen (OPENAI_API_KEY).' }, { status: 500 });
    }

    // Testiraj pristup Google Sheetu
    const sheets = google.sheets({ version: 'v4', auth });
    let response;
    try {
      response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: sheetName,
      });
    } catch (apiError: any) {
      console.error('Google Sheets API error:', apiError);
      return NextResponse.json({ error: 'Greška pri čitanju iz Google Sheeta: ' + (apiError?.message || apiError) }, { status: 500 });
    }

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'No data found in sheet' }, { status: 404 });
    }

    // Prvi red su zaglavlja
    const headers = rows[0];
    const data = rows.slice(1);

    // Analiziraj prompt i generiši izvještaj
    const report = await generateAIReport(prompt, headers, data, chat);

    return NextResponse.json({ report });
  } catch (error: any) {
    console.error('AI Report Error:', error);
    return NextResponse.json({ error: 'Greška: ' + (error?.message || error) }, { status: 500 });
  }
}

async function generateAIReport(prompt: string, headers: string[], data: string[][], chat?: any[]) {
  // Analiziraj prompt i odredi šta korisnik želi
  const analysis = analyzePrompt(prompt);
  
  // Pripremi podatke za AI
  const dataForAI = {
    totalRecords: data.length,
    columns: Object.keys(data[0] || {}),
    sampleData: data.slice(0, 5),
    userRequest: prompt
  };

  // Pokušaj sa različitim AI modelima
  let aiSummary = '';
  let modelUsed = '';

  // Pokušaj GPT-4o prvo
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Ti si AI asistent koji analizira podatke i kreira izvještaje. Odgovaraj na bosanskom jeziku.'
          },
          {
            role: 'user',
            content: `Analiziraj ove podatke i kreiraj izvještaj prema zahtjevu korisnika: ${prompt}\n\nPodaci: ${JSON.stringify(dataForAI, null, 2)}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    if (response.ok) {
      const result = await response.json();
      aiSummary = result.choices[0].message.content;
      modelUsed = 'gpt-4o';
    }
  } catch (error) {
    // Nastavi sa drugim modelom
  }

  // Ako GPT-4o nije uspio, pokušaj GPT-4
  if (!aiSummary) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'Ti si AI asistent koji analizira podatke i kreira izvještaje. Odgovaraj na bosanskom jeziku.'
            },
            {
              role: 'user',
              content: `Analiziraj ove podatke i kreiraj izvještaj prema zahtjevu korisnika: ${prompt}\n\nPodaci: ${JSON.stringify(dataForAI, null, 2)}`
            }
          ],
          max_tokens: 2000,
          temperature: 0.7
        })
      });

      if (response.ok) {
        const result = await response.json();
        aiSummary = result.choices[0].message.content;
        modelUsed = 'gpt-4';
      }
    } catch (error) {
      // Nastavi sa drugim modelom
    }
  }

  // Ako ni GPT-4 nije uspio, pokušaj GPT-3.5-turbo
  if (!aiSummary) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Ti si AI asistent koji analizira podatke i kreira izvještaje. Odgovaraj na bosanskom jeziku.'
            },
            {
              role: 'user',
              content: `Analiziraj ove podatke i kreiraj izvještaj prema zahtjevu korisnika: ${prompt}\n\nPodaci: ${JSON.stringify(dataForAI, null, 2)}`
            }
          ],
          max_tokens: 2000,
          temperature: 0.7
        })
      });

      if (response.ok) {
        const result = await response.json();
        aiSummary = result.choices[0].message.content;
        modelUsed = 'gpt-3.5-turbo';
      }
    } catch (error) {
      // Ako ni ovo ne uspije, vrati grešku
    }
  }

  // Generiši izvještaj na osnovu analize
  const report = {
    title: analysis.title,
    description: analysis.description,
    sections: [
      ...generateSections(analysis, data, headers),
      {
        id: `section_ai_${Date.now()}`,
        type: 'text',
        title: 'AI analiza i preporuke',
        dataSource: 'AI',
        size: 'lg',
        content: aiSummary,
      }
    ],
    parameters: generateParameters(analysis, headers),
    summary: generateSummary(analysis, data)
  };

  return report;
}

function analyzePrompt(prompt: string) {
  const lowerPrompt = prompt.toLowerCase();
  
  // Detektuj tip izvještaja
  let reportType = 'general';
  if (lowerPrompt.includes('prodaja') || lowerPrompt.includes('sales')) reportType = 'sales';
  if (lowerPrompt.includes('finansij') || lowerPrompt.includes('financial')) reportType = 'financial';
  if (lowerPrompt.includes('inventar') || lowerPrompt.includes('inventory')) reportType = 'inventory';
  if (lowerPrompt.includes('zaposlen') || lowerPrompt.includes('employee')) reportType = 'employee';
  if (lowerPrompt.includes('analiza') || lowerPrompt.includes('analysis')) reportType = 'analysis';

  // Detektuj vremenske periode
  let timeFilter = '';
  if (lowerPrompt.includes('godina') || lowerPrompt.includes('year')) timeFilter = 'year';
  if (lowerPrompt.includes('mjesec') || lowerPrompt.includes('month')) timeFilter = 'month';
  if (lowerPrompt.includes('nedelja') || lowerPrompt.includes('week')) timeFilter = 'week';
  if (lowerPrompt.includes('dan') || lowerPrompt.includes('day')) timeFilter = 'day';

  // Detektuj grupisanje
  let groupBy = '';
  if (lowerPrompt.includes('po mjesecu') || lowerPrompt.includes('by month')) groupBy = 'month';
  if (lowerPrompt.includes('po kategoriji') || lowerPrompt.includes('by category')) groupBy = 'category';
  if (lowerPrompt.includes('po zaposlenom') || lowerPrompt.includes('by employee')) groupBy = 'employee';
  if (lowerPrompt.includes('po proizvodu') || lowerPrompt.includes('by product')) groupBy = 'product';

  // Detektuj tip grafikona
  let chartType = 'bar';
  if (lowerPrompt.includes('linijski') || lowerPrompt.includes('line')) chartType = 'line';
  if (lowerPrompt.includes('kružni') || lowerPrompt.includes('pie')) chartType = 'pie';
  if (lowerPrompt.includes('površinski') || lowerPrompt.includes('area')) chartType = 'area';

  return {
    reportType,
    timeFilter,
    groupBy,
    chartType,
    title: generateTitle(prompt, reportType),
    description: generateDescription(prompt, reportType),
  };
}

function generateTitle(prompt: string, type: string) {
  const titles = {
    sales: 'Izvještaj prodaje',
    financial: 'Finansijski izvještaj',
    inventory: 'Izvještaj inventara',
    employee: 'Izvještaj zaposlenih',
    analysis: 'Analitički izvještaj',
    general: 'AI Generisani izvještaj'
  };
  return titles[type as keyof typeof titles] || 'AI Generisani izvještaj';
}

function generateDescription(prompt: string, type: string) {
  return `AI generisani izvještaj na osnovu zahtjeva: "${prompt}"`;
}

function generateSections(analysis: Record<string, unknown>, data: string[][], headers: string[]) {
  const sections = [];

  // Filtriraj prazne kolone i koristi bolje nazive
  const validHeaders = headers
    .map((header, index) => ({ header: header.trim(), index }))
    .filter(({ header }) => header && header.length > 0) // Ukloni prazne kolone
    .map(({ header, index }) => ({
      id: `col_${index}`,
      label: header,
      sheetKey: header,
      width: 150
    }));

  // Dodaj tabelu sa podacima samo ako ima validnih kolona
  if (validHeaders.length > 0) {
    sections.push({
      id: `section_${Date.now()}`,
      type: 'table',
      title: 'Pregled podataka',
      dataSource: 'Sheet1',
      size: 'lg',
      columns: validHeaders
    });
  }

  // Dodaj grafikon ako je potreban i ako ima dovoljno kolona
  if ((analysis.type === 'sales' || analysis.type === 'financial' || analysis.type === 'analysis') && validHeaders.length >= 2) {
    const yField = validHeaders.find(h => 
      h.label.toLowerCase().includes('iznos') || 
      h.label.toLowerCase().includes('amount') || 
      h.label.toLowerCase().includes('prodaja') || 
      h.label.toLowerCase().includes('sales') ||
      h.label.toLowerCase().includes('cijena') ||
      h.label.toLowerCase().includes('price') ||
      h.label.toLowerCase().includes('količina') ||
      h.label.toLowerCase().includes('quantity')
    )?.label || validHeaders[1]?.label || 'Vrijednost';

    sections.push({
      id: `section_${Date.now() + 1}`,
      type: 'chart',
      title: getChartTitle(analysis),
      dataSource: 'Sheet1',
      size: 'md',
      chartType: analysis.chartType,
      xField: validHeaders[0]?.label || 'Kategorija',
      yField: yField,
      color: getChartColor(analysis.type as string)
    });
  }

  // Dodaj sažetak ako je potreban
  if (analysis.type === 'analysis' || analysis.type === 'financial') {
    sections.push({
      id: `section_${Date.now() + 2}`,
      type: 'text',
      title: 'Sažetak analize',
      dataSource: 'Sheet1',
      size: 'sm',
      content: generateSummary(analysis, data)
    });
  }

  return sections;
}

function getChartTitle(analysis: Record<string, unknown>) {
  const titles: Record<string, string> = {
    sales: 'Trend prodaje',
    financial: 'Finansijski trendovi',
    analysis: 'Analiza podataka',
    inventory: 'Pregled inventara',
    employee: 'Performanse zaposlenih'
  };
  return titles[analysis.type as string] || 'Vizualizacija podataka';
}

function getChartColor(type: string) {
  const colors: Record<string, string> = {
    sales: '#10b981', // green
    financial: '#3b82f6', // blue
    analysis: '#8b5cf6', // purple
    inventory: '#f59e0b', // yellow
    employee: '#ef4444' // red
  };
  return colors[type] || '#3b82f6';
}

function generateSummary(analysis: Record<string, unknown>, data: string[][]) {
  const summaries: Record<string, string> = {
    sales: `Analizirano je ${data.length} zapisa prodaje.`,
    financial: `Finansijski pregled sa ${data.length} transakcija.`,
    analysis: `Detaljna analiza ${data.length} podataka.`,
    inventory: `Pregled inventara sa ${data.length} stavki.`,
    employee: `Analiza ${data.length} zaposlenih.`
  };
  return summaries[analysis.type as string] || `Analizirano ${data.length} zapisa.`;
}

function generateParameters(analysis: Record<string, unknown>, headers: string[]) {
  const parameters = [];

  // Dodaj vremenski filter ako je detektovan
  if (analysis.timeFilter) {
    parameters.push({
      name: 'Vremenski period',
      key: 'time_period',
      type: 'dropdown',
      options: ['Sve', 'Ova godina', 'Ovaj mjesec', 'Ova nedelja', 'Danas'],
      description: 'Odaberite vremenski period za filtriranje',
      sheetColumn: headers.find(h => h.toLowerCase().includes('datum') || h.toLowerCase().includes('date')) || 'datum'
    });
  }

  // Dodaj filter za grupisanje
  if (analysis.groupBy) {
    const groupOptions = ['Bez grupisanja'];
    if (analysis.groupBy === 'month') groupOptions.push('Po mjesecu');
    if (analysis.groupBy === 'category') groupOptions.push('Po kategoriji');
    if (analysis.groupBy === 'employee') groupOptions.push('Po zaposlenom');
    if (analysis.groupBy === 'product') groupOptions.push('Po proizvodu');

    parameters.push({
      name: 'Grupisanje',
      key: 'group_by',
      type: 'dropdown',
      options: groupOptions,
      description: 'Odaberite kako želite grupisati podatke',
      sheetColumn: ''
    });
  }

  // Dodaj filter za kategoriju ako postoji
  const categoryColumn = headers.find(h => 
    h.toLowerCase().includes('kategorija') || 
    h.toLowerCase().includes('category') ||
    h.toLowerCase().includes('tip') ||
    h.toLowerCase().includes('type')
  );
  
  if (categoryColumn) {
    parameters.push({
      name: 'Kategorija',
      key: 'category',
      type: 'dropdown',
      options: ['Sve kategorije'],
      description: 'Odaberite kategoriju za filtriranje',
      sheetColumn: categoryColumn
    });
  }

  return parameters;
} 