export interface DocxMessage {
    type: 'init' | 'update' | 'save' | 'error';
    content?: string;
    message?: string;
}

export interface XlsxData {
    sheets: {
        name: string;
        data: any[][];
    }[];
}

export interface XlsxMessage {
    type: 'init' | 'update' | 'save' | 'error';
    data?: XlsxData;
    message?: string;
}
