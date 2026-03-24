import crypto from 'crypto';

export class CryptoService {
    private static readonly ALGORITHM = 'aes-256-cbc';
    private static readonly INPUT_ENCODING = 'utf8';
    private static readonly OUTPUT_ENCODING = 'hex';

    static encrypt(dataToEncrypt: any, secretKey: Buffer, iv: Buffer): string {
        const cipher = crypto.createCipheriv(this.ALGORITHM, secretKey, iv);
        let encrypted = cipher.update(dataToEncrypt, this.INPUT_ENCODING, this.OUTPUT_ENCODING);
        encrypted += cipher.final(this.OUTPUT_ENCODING);
        return encrypted;
    }

    static decrypt(encryptedData: string, secretKey: Buffer, iv: Buffer): string {
        const decipher = crypto.createDecipheriv(this.ALGORITHM, secretKey, iv);
        let decrypted = decipher.update(encryptedData, this.OUTPUT_ENCODING, this.INPUT_ENCODING);
        decrypted += decipher.final(this.INPUT_ENCODING);
        return decrypted;
    }

    static secretKey() {
        const key = '65a6b1c3ba49d76236d34006db51d32a258f28026921fa87f97662737971d9f5';
        return Buffer.from(key, 'hex')
    }

    static generateIv() {
        return crypto.randomBytes(16).toString('hex');
    }

    static stringToBuffer(data: string) {
        return Buffer.from(data, 'hex')
    }
}
