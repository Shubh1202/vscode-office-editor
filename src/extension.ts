import * as vscode from 'vscode';
import { DocxEditorProvider } from './providers/DocxEditorProvider';
import { XlsxEditorProvider } from './providers/XlsxEditorProvider';
import { Logger } from './services/logger';

export function activate(context: vscode.ExtensionContext) {
    Logger.init();
    Logger.info('Docx & Xlsx Custom Editors extension is now active!');

    // Register DOCX Provider
    context.subscriptions.push(DocxEditorProvider.register(context));

    // Register XLSX Provider
    context.subscriptions.push(XlsxEditorProvider.register(context));
}

export function deactivate() {}
