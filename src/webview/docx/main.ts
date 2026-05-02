import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { DocxMessage } from '../../shared/types';

// 1. REGISTER ALL ATTRIBUTORS
const ColorStyle = Quill.import('attributors/style/color');
const BackgroundStyle = Quill.import('attributors/style/background');
const SizeStyle = Quill.import('attributors/style/size');
const FontStyle = Quill.import('attributors/style/font');
const AlignStyle = Quill.import('attributors/style/align');

SizeStyle.whitelist = ['12px', '14px', '16px', '20px', '24px', '32px'];
FontStyle.whitelist = ['sans-serif', 'serif', 'monospace', 'Arial'];

Quill.register(ColorStyle, true);
Quill.register(BackgroundStyle, true);
Quill.register(SizeStyle, true);
Quill.register(FontStyle, true);
Quill.register(AlignStyle, true);

declare const acquireVsCodeApi: any;
const vscode = acquireVsCodeApi();

let quill: any;
let isInitialized = false;

// ERROR BOUNDARY
window.onerror = (msg) => vscode.postMessage({ type: 'error', message: msg });

// HANDSHAKE
const handshakeInterval = setInterval(() => {
    if (!isInitialized) vscode.postMessage({ type: 'ready' });
    else clearInterval(handshakeInterval);
}, 500);

window.addEventListener('message', event => {
    const message: DocxMessage = event.data;
    if (message.type === 'init' && !isInitialized) {
        isInitialized = true;
        clearInterval(handshakeInterval);
        initEditor(message.content || '');
    }
    if ((message as any).type === 'request-save' && quill) {
        vscode.postMessage({ type: 'save', content: quill.root.innerHTML });
    }
});

function initEditor(content: string) {
    const container = document.getElementById('editor-container');
    if (!container) return;
    container.innerHTML = '';

    try {
        quill = new Quill(container, {
            theme: 'snow',
            modules: { toolbar: false, history: { delay: 100, maxStack: 500, userOnly: false } }
        });
        quill.root.innerHTML = content;

        const history = quill.getModule('history');
        setTimeout(() => { if (history) history.clear(); }, 200);

        const applyFormat = (name: string, value: any) => {
            quill.focus();
            quill.format(name, value, 'user');
        };

        // --- FIND & REPLACE ---
        let lastSearchIndex = 0;
        const findNext = () => {
            const term = (document.getElementById('find-input') as HTMLInputElement).value;
            if (!term) return;
            const text = quill.getText();
            let index = text.indexOf(term, lastSearchIndex);
            if (index === -1) index = text.indexOf(term); // Wrap around
            if (index !== -1) {
                quill.setSelection(index, term.length);
                lastSearchIndex = index + term.length;
            }
        };

        document.getElementById('find-btn')?.addEventListener('click', () => {
            const bar = document.getElementById('search-bar');
            if (bar) {
                bar.style.display = bar.style.display === 'flex' ? 'none' : 'flex';
                if (bar.style.display === 'flex') document.getElementById('find-input')?.focus();
            }
        });
        document.getElementById('find-next')?.addEventListener('click', findNext);
        document.getElementById('replace-btn')?.addEventListener('click', () => {
            const findTerm = (document.getElementById('find-input') as HTMLInputElement).value;
            const replaceTerm = (document.getElementById('replace-input') as HTMLInputElement).value;
            const range = quill.getSelection();
            if (range && range.length > 0 && quill.getText(range.index, range.length) === findTerm) {
                quill.deleteText(range.index, range.length);
                quill.insertText(range.index, replaceTerm);
                quill.setSelection(range.index, replaceTerm.length);
            } else { findNext(); }
        });
        document.getElementById('close-search')?.addEventListener('click', () => {
            const bar = document.getElementById('search-bar');
            if (bar) bar.style.display = 'none';
        });

        // --- LINK & IMAGE ---
        document.getElementById('link-btn')?.addEventListener('click', () => {
            const range = quill.getSelection(true); // Force selection
            if (range) {
                const url = prompt('Enter URL:');
                if (url) quill.format('link', url);
            }
        });

        const imgInput = document.getElementById('image-input') as HTMLInputElement;
        document.getElementById('image-btn')?.addEventListener('click', () => imgInput.click());
        imgInput.addEventListener('change', () => {
            const file = imgInput.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const range = quill.getSelection(true);
                    quill.insertEmbed(range.index, 'image', e.target?.result);
                };
                reader.readAsDataURL(file);
            }
        });

        // --- ALL OTHER BUTTONS ---
        document.getElementById('undo-btn')?.addEventListener('click', () => history?.undo());
        document.getElementById('redo-btn')?.addEventListener('click', () => history?.redo());
        
        document.getElementById('text-style-select')?.addEventListener('change', (e) => {
            const val = (e.target as HTMLSelectElement).value;
            quill.format('header', false); quill.format('size', false); quill.format('bold', false);
            switch (val) {
                case 'title': applyFormat('size', '32px'); applyFormat('bold', true); break;
                case 'h1': applyFormat('header', 1); break;
                case 'h2': applyFormat('header', 2); break;
                case 'normal': applyFormat('size', '14px'); break;
            }
        });

        document.getElementById('font-family-select')?.addEventListener('change', (e) => applyFormat('font', (e.target as HTMLSelectElement).value));
        document.getElementById('font-size-select')?.addEventListener('change', (e) => applyFormat('size', (e.target as HTMLSelectElement).value));
        document.getElementById('bold-btn')?.addEventListener('click', () => applyFormat('bold', !quill.getFormat().bold));
        document.getElementById('italic-btn')?.addEventListener('click', () => applyFormat('italic', !quill.getFormat().italic));
        document.getElementById('underline-btn')?.addEventListener('click', () => applyFormat('underline', !quill.getFormat().underline));
        document.getElementById('text-color')?.addEventListener('input', (e) => applyFormat('color', (e.target as HTMLInputElement).value));
        document.getElementById('bg-color')?.addEventListener('input', (e) => applyFormat('background', (e.target as HTMLInputElement).value));
        document.getElementById('page-color')?.addEventListener('input', (e) => { quill.root.style.backgroundColor = (e.target as HTMLInputElement).value; });
        document.getElementById('align-center-btn')?.addEventListener('click', () => applyFormat('align', 'center'));
        document.getElementById('list-bullet-btn')?.addEventListener('click', () => applyFormat('list', 'bullet'));

        quill.on('text-change', () => vscode.postMessage({ type: 'update', content: quill.root.innerHTML }));

    } catch (err) { console.error('Quill Error:', err); }
}
