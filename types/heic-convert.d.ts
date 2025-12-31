declare module 'heic-convert' {
    interface HeicConvertOptions {
        buffer: Buffer;
        format: 'JPEG' | 'PNG';
        quality?: number;
        outputBuffer?: boolean;
    }

    function heicConvert(options: HeicConvertOptions): Promise<Buffer>;
    export = heicConvert;
}
