import { google } from 'googleapis';
import { FormData, FormConfig, ExportStatus } from '@/types';

class GoogleSheetsService {
  private auth: any;
  private sheets: any;
  private isInitialized = false;

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
      const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;

      if (!privateKey || !clientEmail) {
        throw new Error('GOOGLE_SHEETS_PRIVATE_KEY and GOOGLE_SHEETS_CLIENT_EMAIL environment variables must be set.');
      }
      
      this.auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: clientEmail,
          private_key: privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Google Sheets auth:', error);
      throw error;
    }
  }

  async exportFormData(formData: FormData, formConfig: FormConfig): Promise<ExportStatus> {
    try {
      if (!this.isInitialized) {
        await this.initializeAuth();
      }

      // Prepare data for export
      const exportData = this.prepareExportData(formData, formConfig);
      
      // Find the next empty row
      const nextRow = await this.findNextEmptyRow(formConfig.googleSheetId, formConfig.googleSheetName);
      
      // Export data to Google Sheets
      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId: formConfig.googleSheetId,
        range: `${formConfig.googleSheetName}!A${nextRow}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [exportData]
        }
      });

      return {
        success: true,
        message: 'Podaci uspješno eksportovani u Google Sheets',
        timestamp: new Date(),
        retryCount: 0,
        data: response.data
      };

    } catch (error) {
      console.error('Export failed:', error);
      return {
        success: false,
        message: `Greška pri eksportu: ${error instanceof Error ? error.message : 'Nepoznata greška'}`,
        timestamp: new Date(),
        retryCount: 0,
        data: error
      };
    }
  }

  private prepareExportData(formData: FormData, formConfig: FormConfig): any[] {
    const columnMap: { [key: string]: any } = {};
    let maxColIndex = -1;

    const colToIndex = (col: string): number => {
      let index = 0;
      for (let i = 0; i < col.length; i++) {
        index = index * 26 + (col.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
      }
      return index - 1;
    };

    formConfig.fields.forEach(field => {
      const col = field.options.googleSheetColumn?.toUpperCase();
      if (col) {
        // Pronalazimo vrijednost koristeći field.id, što je ispravan ključ u formData.data
        const value = formData.data[field.id] || ''; 
        const colIndex = colToIndex(col);
        
        if (colIndex !== -1) {
            columnMap[colIndex] = value;
            if (colIndex > maxColIndex) {
                maxColIndex = colIndex;
            }
        }
      }
    });

    if (maxColIndex === -1) {
        return []; // Nema definisanih kolona
    }

    const exportRow = new Array(maxColIndex + 1).fill('');
    for (const indexStr in columnMap) {
      const index = parseInt(indexStr, 10);
      if (!isNaN(index)) {
        exportRow[index] = columnMap[indexStr];
      }
    }
    
    return exportRow;
  }

  private async findNextEmptyRow(spreadsheetId: string, sheetName: string): Promise<number> {
    try {
      // Prvo dohvati sve podatke iz tab-a da vidimo strukturu
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}`,
      });

      const values = response.data.values || [];
      
      if (values.length === 0) {
        return 1; // Ako je tab potpuno prazan, počni od prvog reda
      }

      // Pronađi prvi red koji je potpuno prazan
      for (let rowIndex = 0; rowIndex < values.length; rowIndex++) {
        const row = values[rowIndex];
        const isEmptyRow = !row || row.every((cell: any) => !cell || cell.toString().trim() === '');
        
        if (isEmptyRow) {
          return rowIndex + 1; // +1 jer Google Sheets počinje od 1, ne od 0
        }
      }

      // Ako nema praznih redova, dodaj na kraj
      return values.length + 1;
      
    } catch (error) {
      console.error('Error finding next empty row:', error);
      return 1; // Default to first row if error
    }
  }

  async importDataFromSheet(
    spreadsheetId: string, 
    sheetName: string, 
    cell: string
  ): Promise<string | number | null> {
    try {
      if (!this.isInitialized) {
        await this.initializeAuth();
      }

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!${cell}`,
      });

      const values = response.data.values;
      return values && values.length > 0 ? values[0][0] : null;

    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  }

  async getSheetColumns(spreadsheetId: string, sheetName: string): Promise<string[]> {
    try {
      if (!this.isInitialized) {
        await this.initializeAuth();
      }

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!1:1`, // Get first row (headers)
      });

      const values = response.data.values;
      return values && values.length > 0 ? values[0] : [];

    } catch (error) {
      console.error('Failed to get sheet columns:', error);
      return [];
    }
  }

  async validateSheetAccess(spreadsheetId: string, sheetName: string): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initializeAuth();
      }

      await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A1`,
      });

      return true;
    } catch (error) {
      console.error('Sheet access validation failed:', error);
      return false;
    }
  }

  async batchExport(formDataArray: Array<{ formData: FormData; formConfig: FormConfig }>): Promise<ExportStatus[]> {
    const results: ExportStatus[] = [];
    
    for (const { formData, formConfig } of formDataArray) {
      const result = await this.exportFormData(formData, formConfig);
      results.push(result);
      
      // Add small delay between exports to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }

  async getAllSheetData(spreadsheetId: string, sheetName: string): Promise<any[][]> {
    try {
      if (!this.isInitialized) {
        await this.initializeAuth();
      }
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}`,
      });
      return response.data.values || [];
    } catch (error) {
      console.error('Failed to get all sheet data:', error);
      return [];
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
export default googleSheetsService; 