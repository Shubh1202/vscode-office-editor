import * as vscode from 'vscode';
import * as path from 'path';

export class XlsxEditorProvider implements vscode.CustomEditorProvider {
    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new XlsxEditorProvider(context);
        return vscode.window.registerCustomEditorProvider(XlsxEditorProvider.viewType, provider, {
            webviewOptions: { retainContextWhenHidden: true },
            supportsMultipleEditorsPerDocument: false,
        });
    }

    private static readonly viewType = 'docxxlsx.xlsxEditor';
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
                    const buffer = await vscode.workspace.fs.readFile(document.uri);
                    webviewPanel.webview.postMessage({
                        type: 'init',
                        content: Buffer.from(buffer).toString('base64')
                    });
                    break;
                case 'save':
                    if (e.content) {
                        const newBuffer = Buffer.from(e.content, 'base64');
                        await vscode.workspace.fs.writeFile(document.uri, newBuffer);
                        vscode.window.showInformationMessage('Excel file saved successfully.');
                    }
                    break;
            }
        });

        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);
        webviewPanel.onDidDispose(() => this._activeWebviews.delete(webviewPanel));
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'xlsxEditor.js'));
        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'nonce-${nonce}';">
                <style>
                    html, body { height: 100%; width: 100%; margin: 0; padding: 0; overflow: hidden; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
                    #toolbar { position: fixed; top: 0; left: 0; right: 0; height: 35px; background: var(--vscode-sideBar-background); border-bottom: 1px solid var(--vscode-panel-border); display: flex; align-items: center; padding: 0 10px; z-index: 1000; }
                    #editor-container { position: absolute; top: 36px; left: 0; right: 0; bottom: 0; }
                </style>
            </head>
            <body>
                <div id="toolbar">
                    <span style="font-size: 11px; opacity: 0.8;">Office Excel View</span>
                </div>
                <div id="editor-container"></div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }

    // MANDATORY INTERFACE METHODS
    public async saveCustomDocument(document: vscode.CustomDocument, cancellation: vscode.CancellationToken): Promise<void> {
        for (const panel of this._activeWebviews) {
            panel.webview.postMessage({ type: 'request-save' });
        }
    }
    public async saveCustomDocumentAs(document: vscode.CustomDocument, destination: vscode.Uri, cancellation: vscode.CancellationToken): Promise<void> {}
    public async revertCustomDocument(document: vscode.CustomDocument, cancellation: vscode.CancellationToken): Promise<void> {}
    public async backupCustomDocument(document: vscode.CustomDocument, context: vscode.CustomDocumentBackupContext, cancellation: vscode.CancellationToken): Promise<vscode.CustomDocumentBackup> {
        return { id: context.destination.toString(), delete: () => {} };
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) { text += possible.charAt(Math.floor(Math.random() * possible.length)); }
    return text;
}
