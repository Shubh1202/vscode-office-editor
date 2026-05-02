import * as vscode from 'vscode';
import * as path from 'path';
import { DocxService } from '../services/docxService';
import { Logger } from '../services/logger';

export class DocxEditorProvider implements vscode.CustomEditorProvider {
    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new DocxEditorProvider(context);
        return vscode.window.registerCustomEditorProvider(
            DocxEditorProvider.viewType, 
            provider,
            {
                webviewOptions: { retainContextWhenHidden: true },
                supportsMultipleEditorsPerDocument: false,
            }
        );
    }

    private static readonly viewType = 'docxxlsx.docxEditor';
    private _activeWebviews = new Set<vscode.WebviewPanel>();

    private readonly _onDidChangeCustomDocument = new vscode.EventEmitter<vscode.CustomDocumentEditEvent<vscode.CustomDocument>>();
    public readonly onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;

    constructor(private readonly context: vscode.ExtensionContext) {}

    public async openCustomDocument(uri: vscode.Uri): Promise<vscode.CustomDocument> {
        return { uri, dispose: () => {} };
    }

    public async resolveCustomEditor(
        document: vscode.CustomDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        this._activeWebviews.add(webviewPanel);
        webviewPanel.webview.options = { enableScripts: true };

        webviewPanel.webview.onDidReceiveMessage(async (e) => {
            switch (e.type) {
                case 'ready':
                    try {
                        const buffer = await vscode.workspace.fs.readFile(document.uri);
                        const content = await DocxService.convertToHtml(Buffer.from(buffer));
                        webviewPanel.webview.postMessage({ type: 'init', content });
                    } catch (error: any) {
                        webviewPanel.webview.postMessage({ type: 'error', message: error.message });
                    }
                    break;
                case 'save':
                    try {
                        if (e.content) {
                            const newBuffer = await DocxService.convertToDocx(e.content);
                            await vscode.workspace.fs.writeFile(document.uri, newBuffer);
                            vscode.window.showInformationMessage('File saved successfully.');
                        }
                    } catch (error: any) {
                        vscode.window.showErrorMessage(`Save failed: ${error.message}`);
                    }
                    break;
            }
        });

        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);
        webviewPanel.onDidDispose(() => this._activeWebviews.delete(webviewPanel));
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'docxEditor.js'));
        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'nonce-${nonce}';">
                <style>
                    html, body { height: 100%; width: 100%; margin: 0; padding: 0; overflow: hidden; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); font-family: var(--vscode-font-family); }
                    #toolbar { position: fixed; top: 0; left: 0; right: 0; height: 38px; display: flex; background: var(--vscode-sideBar-background); border-bottom: 1px solid var(--vscode-panel-border); padding: 0 5px; align-items: center; gap: 4px; z-index: 1000; }
                    #editor-container { position: absolute; top: 41px; left: 0; right: 0; bottom: 0; background: var(--vscode-editor-background); overflow: auto; }
                    .tool-btn { background: transparent; color: var(--vscode-foreground); border: none; padding: 4px 6px; cursor: pointer; border-radius: 3px; display: flex; align-items: center; justify-content: center; }
                    .tool-btn:hover { background: var(--vscode-toolbar-hoverBackground); }
                    .divider { width: 1px; background: var(--vscode-panel-border); height: 18px; margin: 0 4px; }
                    select { background: var(--vscode-dropdown-background); color: var(--vscode-dropdown-foreground); border: 1px solid var(--vscode-dropdown-border); padding: 2px; font-size: 11px; outline: none; height: 24px; border-radius: 2px; }
                    input[type="color"] { width: 22px; height: 22px; border: none; padding: 0; background: transparent; cursor: pointer; }
                    .ql-container.ql-snow { border: none !important; }
                    .ql-editor { padding: 50px 80px; line-height: 1.6; min-height: 100%; }
                    
                    #search-bar { 
                        display: none; position: fixed; top: 42px; right: 20px; 
                        background: var(--vscode-editorWidget-background); 
                        border: 1px solid var(--vscode-widget-border); padding: 8px;
                        box-shadow: 0 2px 8px var(--vscode-widget-shadow); z-index: 2000;
                        border-radius: 4px; gap: 5px; align-items: center;
                    }
                </style>
            </head>
            <body>
                <div id="toolbar">
                    <button id="undo-btn" class="tool-btn" title="Undo"><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4.854 1.146a.5.5 0 0 1 .708 0l4 4a.5.5 0 0 1-.708.708L5.5 2.707V9.5a4.5 4.5 0 1 0 9 0V8h1v1.5a5.5 5.5 0 1 1-11 0V2.707L1.146 5.854a.5.5 0 1 1-.708-.708l4-4z"/></svg></button>
                    <button id="redo-btn" class="tool-btn" title="Redo"><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M11.146 1.146a.5.5 0 0 0-.708 0l-4 4a.5.5 0 0 0 .708.708L10.5 2.707V9.5a4.5 4.5 0 1 1-9 0V8h-1v1.5a5.5 5.5 0 1 0 11 0V2.707l3.354 3.147a.5.5 0 0 0 .708-.708l-4-4z"/></svg></button>
                    <div class="divider"></div>
                    
                    <select id="text-style-select">
                        <option value="normal">Normal</option>
                        <option value="title">Title</option>
                        <option value="h1">Heading</option>
                        <option value="h2">Sub Heading</option>
                    </select>

                    <select id="font-family-select"><option value="sans-serif">Sans-Serif</option><option value="serif">Serif</option><option value="monospace">Monospace</option></select>
                    <select id="font-size-select"><option value="12px">12</option><option value="14px" selected>14</option><option value="16px">16</option><option value="20px">20</option></select>
                    <div class="divider"></div>
                    
                    <button id="bold-btn" class="tool-btn"><b>B</b></button>
                    <button id="italic-btn" class="tool-btn"><i>I</i></button>
                    <button id="underline-btn" class="tool-btn"><u>U</u></button>
                    <div class="divider"></div>

                    <label title="Text Color" style="display:flex;align-items:center;"><input type="color" id="text-color" value="#ffffff">🎨</label>
                    <label title="Highlight Color" style="display:flex;align-items:center;"><input type="color" id="bg-color" value="#ffff00">🖍️</label>
                    <label title="Page Color" style="display:flex;align-items:center;"><input type="color" id="page-color" value="#ffffff">📄</label>
                    <div class="divider"></div>

                    <button id="list-bullet-btn" class="tool-btn" title="Bullets"><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M6 3h9v2H6V3zm0 5h9v2H6V8zm0 5h9v2H6v-2zM2 3h2v2H2V3zm0 5h2v2H2V8zm0 5h2v2H2v-2z"/></svg></button>
                    <button id="align-center-btn" class="tool-btn" title="Center"><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M1 3h14v1H1V3zm3 3h8v1H4V6zm-3 3h14v1H1V9zm3 3h8v1H4v-1z"/></svg></button>
                    
                    <div class="divider"></div>
                    <button id="link-btn" class="tool-btn" title="Insert Link">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4.715 6.542L3.343 7.914a3 3 0 104.243 4.243l1.828-1.829A3 3 0 008.586 5.5L8 6.086a1.002 1.002 0 00-.154.199 2 2 0 01.861 3.337L6.88 11.45a2 2 0 11-2.83-2.83l.793-.792a4.018 4.018 0 01-.128-1.287z"/><path d="M6.586 4.672A3 3 0 007.414 9.5l.586-.586a1.003 1.003 0 00.154-.199 2 2 0 01-.861-3.337L9.12 3.55a2 2 0 012.828 2.83l-.793.792a4.02 4.02 0 01.128 1.287l1.372-1.372a3 3 0 10-4.243-4.243L6.586 4.672z"/></svg>
                    </button>
                    <button id="image-btn" class="tool-btn" title="Insert Image">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h11A1.5 1.5 0 0 1 15 2.5v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 13.5v-11zM2.5 2a.5.5 0 0 0-.5.5v8.79l3.15-3.15a.5.5 0 0 1 .71 0l2.14 2.14 3.15-3.15a.5.5 0 0 1 .71 0L14 9.14V2.5a.5.5 0 0 0-.5-.5h-11zm11.5 8.55l-2.15-2.15-3.14 3.14a.5.5 0 0 1-.71 0l-2.14-2.14L2 12.55V13.5a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-.95zM4.5 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/></svg>
                    </button>
                    <button id="find-btn" class="tool-btn" title="Find & Replace">🔍</button>
                </div>
                
                <div id="search-bar">
                    <input type="text" id="find-input" placeholder="Find...">
                    <button id="find-next" class="tool-btn">↓</button>
                    <input type="text" id="replace-input" placeholder="Replace...">
                    <button id="replace-btn" class="tool-btn" style="background:var(--vscode-button-background);color:var(--vscode-button-foreground);padding:2px 6px;font-size:10px;">Replace</button>
                    <button id="close-search" class="tool-btn">✕</button>
                </div>

                <div id="editor-container">
                    <div style="padding: 20px; text-align: center; color: var(--vscode-descriptionForeground);">Restoring all systems...</div>
                </div>
                <input type="file" id="image-input" accept="image/*" style="display: none;">
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }

    public async saveCustomDocument(document: vscode.CustomDocument): Promise<void> {
        for (const panel of this._activeWebviews) { panel.webview.postMessage({ type: 'request-save' }); }
    }
    public async saveCustomDocumentAs(document: vscode.CustomDocument, destination: vscode.Uri): Promise<void> {}
    public async revertCustomDocument(document: vscode.CustomDocument): Promise<void> {}
    public async backupCustomDocument(document: vscode.CustomDocument, context: vscode.CustomDocumentBackupContext): Promise<vscode.CustomDocumentBackup> {
        return { id: context.destination.toString(), delete: () => {} };
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) { text += possible.charAt(Math.floor(Math.random() * possible.length)); }
    return text;
}
