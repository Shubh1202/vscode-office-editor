import * as mammoth from 'mammoth';
import htmlToDocx from 'html-to-docx';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { Logger } from './logger';

export class DocxService {
    private static _dompurify: any;

    private static get dompurify() {
        if (!this._dompurify) {
            try {
                Logger.info('Initializing JSDOM for Sanitization...');
                const window = new JSDOM('').window;
                this._dompurify = createDOMPurify(window as any);
                Logger.info('JSDOM Initialized successfully.');
            } catch (err) {
                Logger.error('Failed to initialize JSDOM', err);
            }
        }
        return this._dompurify;
    }

    public static async convertToHtml(buffer: Buffer): Promise<string> {
        const startTime = Date.now();
        Logger.info(`Starting DOCX to HTML conversion (${buffer.length} bytes)`);

        try {
            const options = {
                styleMap: [
                    "p[style-name='Heading 1'] => h1:fresh",
                    "p[style-name='Heading 2'] => h2:fresh",
                    "p[style-name='Heading 3'] => h3:fresh",
                    "r[style-name='Strong'] => strong",
                    "r[style-name='Emphasis'] => em"
                ],
                convertImage: mammoth.images.imgElement((image: any) => {
                    return image.read("base64").then((imageBuffer: any) => {
                        return {
                            src: `data:${image.contentType};base64,${imageBuffer}`
                        };
                    });
                })
            };

            const result = await mammoth.convertToHtml({ buffer }, options);
            Logger.info(`Mammoth conversion complete in ${Date.now() - startTime}ms`);

            // Use simple sanitization if JSDOM is slow
            const rawHtml = result.value;
            const sanitized = this.dompurify ? this.dompurify.sanitize(rawHtml) : rawHtml;
            
            Logger.info(`Sanitization complete. Total time: ${Date.now() - startTime}ms`);
            return sanitized;
        } catch (error: any) {
            Logger.error('DOCX Conversion Error', error);
            throw error;
        }
    }

    public static async convertToDocx(html: string): Promise<Buffer> {
        Logger.info('Starting HTML to DOCX conversion');
        const sanitizedHtml = this.dompurify ? this.dompurify.sanitize(html, {
            ALLOWED_TAGS: ['p', 'b', 'i', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'span', 'strong', 'em', 'br', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
            ALLOWED_ATTR: ['style', 'src', 'width', 'height']
        }) : html;
        
        const docStyles = `<style>table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #000; padding: 5px; } img { max-width: 100%; }</style>`;
        const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8">${docStyles}</head><body>${sanitizedHtml}</body></html>`;
        
        return await htmlToDocx(fullHtml, undefined, {
            table: { row: { cantSplit: true } },
            footer: true,
            pageNumber: true,
        }) as Buffer;
    }
}
