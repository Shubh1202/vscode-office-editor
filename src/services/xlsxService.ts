import * as XLSX from 'xlsx';
import { XlsxData } from '../shared/types';

export class XlsxService {
    public static parse(buffer: Buffer): XlsxData {
        const workbook = XLSX.read(buffer, { 
            type: 'buffer',
            cellStyles: true,
            cellFormula: true,
            cellDates: true,
            cellNF: true
        });
        const sheets = workbook.SheetNames.map(name => {
            const worksheet = workbook.Sheets[name];
            return {
                name,
                data: XLSX.utils.sheet_to_json(worksheet, { 
                    header: 1,
                    defval: '',
                    blankrows: true
                }) as any[][]
            };
        });

        return { sheets };
    }

    public static serialize(data: XlsxData): Buffer {
        const workbook = XLSX.utils.book_new();
        data.sheets.forEach(sheet => {
            const worksheet = XLSX.utils.aoa_to_sheet(sheet.data);
            XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
        });

        return XLSX.write(workbook, { 
            type: 'buffer', 
            bookType: 'xlsx',
            cellStyles: true
        });
    }
}
