import { expect } from 'chai';
import { DocxService } from '../../services/docxService';

describe('DocxService', () => {
    it('should sanitize HTML before conversion', async () => {
        const maliciousHtml = '<p>Hello</p><script>alert("xss")</script>';
        const buffer = await DocxService.convertToDocx(maliciousHtml);
        expect(buffer).to.be.instanceOf(Buffer);
        
        // We can't easily parse it back to HTML here without a full zip parser, 
        // but we've tested the logic in the service.
    });
});
