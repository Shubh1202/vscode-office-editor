import * as vscode from 'vscode';

export class Logger {
    private static outputChannel: vscode.OutputChannel;

    public static init() {
        this.outputChannel = vscode.window.createOutputChannel('Docx & Xlsx Editors');
    }

    public static info(message: string, ...args: any[]) {
        this.log('INFO', message, ...args);
    }

    public static error(message: string, error?: any) {
        this.log('ERROR', message, error);
        if (error) {
            this.outputChannel.appendLine(`Details: ${error.stack || error.message || JSON.stringify(error)}`);
        }
    }

    public static debug(message: string, ...args: any[]) {
        this.log('DEBUG', message, ...args);
    }

    private static log(level: string, message: string, ...args: any[]) {
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] [${level}] ${message}`;
        
        console.log(formattedMessage, ...args);
        
        if (this.outputChannel) {
            this.outputChannel.appendLine(formattedMessage);
            if (args.length > 0) {
                this.outputChannel.appendLine(`  Context: ${JSON.stringify(args)}`);
            }
        }
    }

    public static show() {
        this.outputChannel.show();
    }
}
