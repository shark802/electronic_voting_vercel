declare module 'node-xlsx' {
    export function parse(file: string): { sheets: { [key: string]: any[] } };
    export const utils: {
        sheet_to_json(sheet: any[]): any[];
    };
}
