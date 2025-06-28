import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface GoogleSheetFormula {
  columnName: string;
  formula: string;
}

interface DatabaseRow {
  [key: string]: unknown;
}

export async function POST(req: NextRequest) {
  try {
    const { qrCode, tableName, searchColumn, returnColumns, googleSheetFormulas } = await req.json();
    
    if (!qrCode || !tableName || !searchColumn) {
      return NextResponse.json({ 
        error: 'Potrebni su qrCode, tableName i searchColumn parametri' 
      }, { status: 400 });
    }

    // Ako postoje Google Sheets formule, koristi ih za prilagođene upite
    if (googleSheetFormulas && googleSheetFormulas.length > 0) {
      const results = await executeGoogleSheetFormulas(tableName, searchColumn, qrCode, googleSheetFormulas);
      return NextResponse.json({
        success: true,
        data: results,
        rowCount: Array.isArray(results) ? results.length : 0
      });
    }

    // Standardni upit
    const selectColumns = returnColumns ? returnColumns.join(', ') : '*';
    const query = `SELECT ${selectColumns} FROM ${tableName} WHERE ${searchColumn} = ?`;
    
    // Izvrši upit
    const results = await prisma.$queryRawUnsafe(query, qrCode);
    
    return NextResponse.json({
      success: true,
      data: results,
      rowCount: Array.isArray(results) ? results.length : 0
    });
    
  } catch (error: unknown) {
    console.error('QR Lookup error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Nepoznata greška';
    return NextResponse.json({ 
      error: 'Greška pri dohvatanju podataka iz baze',
      details: errorMessage 
    }, { status: 500 });
  }
}

// Funkcija za izvršavanje Google Sheets formula
async function executeGoogleSheetFormulas(tableName: string, searchColumn: string, qrCode: string, formulas: GoogleSheetFormula[]) {
  try {
    // Prvo dohvati sve podatke za QR kod
    const baseQuery = `SELECT * FROM ${tableName} WHERE ${searchColumn} = ?`;
    const baseResults = await prisma.$queryRawUnsafe(baseQuery, qrCode);
    
    if (!Array.isArray(baseResults) || baseResults.length === 0) {
      return [];
    }

    // Za svaki red, primijeni formule
    const processedResults = baseResults.map((row: DatabaseRow) => {
      const processedRow: DatabaseRow = { ...row };
      
      formulas.forEach(({ columnName, formula }) => {
        try {
          // Zamijeni reference na kolone sa stvarnim vrijednostima
          let processedFormula = formula;
          
          // Zamijeni reference na kolone (npr. A1, B2, itd.)
          Object.keys(row).forEach((key, index) => {
            const columnRef = String.fromCharCode(65 + index); // A, B, C, itd.
            processedFormula = processedFormula.replace(
              new RegExp(columnRef + '\\d+', 'g'), 
              String(row[key] || 0)
            );
          });
          
          // Zamijeni reference na kolone po imenu
          Object.keys(row).forEach(key => {
            processedFormula = processedFormula.replace(
              new RegExp(`\\b${key}\\b`, 'g'), 
              String(row[key] || 0)
            );
          });
          
          // Izvrši formulu (osnovne matematičke operacije)
          const result = evaluateFormula(processedFormula);
          processedRow[columnName] = result;
          
        } catch (error) {
          console.error(`Greška pri izvršavanju formule za ${columnName}:`, error);
          processedRow[columnName] = 0;
        }
      });
      
      return processedRow;
    });
    
    return processedResults;
    
  } catch (error) {
    console.error('Greška pri izvršavanju Google Sheets formula:', error);
    throw error;
  }
}

// Funkcija za evaluaciju formula (osnovne matematičke operacije)
function evaluateFormula(formula: string): number {
  try {
    // Ukloni sve što nije broj, operator ili zagrada
    const cleanFormula = formula.replace(/[^0-9+\-*/().,]/g, '');
    
    // Zamijeni zareze sa tačkama za decimalne brojeve
    const normalizedFormula = cleanFormula.replace(/,/g, '.');
    
    // Sigurna evaluacija
    // eslint-disable-next-line no-eval
    const result = eval(normalizedFormula);
    
    return isNaN(result) ? 0 : Number(result);
  } catch (error) {
    console.error('Greška pri evaluaciji formule:', formula, error);
    return 0;
  }
} 