import { expect } from 'chai';
import { XlsxService } from '../../services/xlsxService';
import * as XLSX from 'xlsx';

describe('XlsxService', () => {
    it('should serialize and parse data correctly', () => {
        const testData = {
            sheets: [
                {
                    name: 'Sheet1',
                    data: [
                        ['Name', 'Age'],
                        ['Alice', 30],
                        ['Bob', 25]
                    ]
                }
            ]
        };

        const buffer = XlsxService.serialize(testData);
        expect(buffer).to.be.instanceOf(Buffer);

        const parsedData = XlsxService.parse(buffer);
        expect(parsedData.sheets).to.have.lengthOf(1);
        expect(parsedData.sheets[0].name).to.equal('Sheet1');
        expect(parsedData.sheets[0].data).to.deep.equal(testData.sheets[0].data);
    });

    it('should handle multiple sheets', () => {
        const testData = {
            sheets: [
                { name: 'S1', data: [['A1']] },
                { name: 'S2', data: [['B1']] }
            ]
        };

        const buffer = XlsxService.serialize(testData);
        const parsedData = XlsxService.parse(buffer);

        expect(parsedData.sheets).to.have.lengthOf(2);
        expect(parsedData.sheets[1].name).to.equal('S2');
    });
});
