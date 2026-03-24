"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoService = void 0;
const crypto_1 = __importDefault(require("crypto"));
class CryptoService {
    static encrypt(dataToEncrypt, secretKey, iv) {
        const cipher = crypto_1.default.createCipheriv(this.ALGORITHM, secretKey, iv);
        let encrypted = cipher.update(dataToEncrypt, this.INPUT_ENCODING, this.OUTPUT_ENCODING);
        encrypted += cipher.final(this.OUTPUT_ENCODING);
        return encrypted;
    }
    static decrypt(encryptedData, secretKey, iv) {
        const decipher = crypto_1.default.createDecipheriv(this.ALGORITHM, secretKey, iv);
        let decrypted = decipher.update(encryptedData, this.OUTPUT_ENCODING, this.INPUT_ENCODING);
        decrypted += decipher.final(this.INPUT_ENCODING);
        return decrypted;
    }
    static secretKey() {
        const key = '65a6b1c3ba49d76236d34006db51d32a258f28026921fa87f97662737971d9f5';
        return Buffer.from(key, 'hex');
    }
    static generateIv() {
        return crypto_1.default.randomBytes(16).toString('hex');
    }
    static stringToBuffer(data) {
        return Buffer.from(data, 'hex');
    }
}
exports.CryptoService = CryptoService;
CryptoService.ALGORITHM = 'aes-256-cbc';
CryptoService.INPUT_ENCODING = 'utf8';
CryptoService.OUTPUT_ENCODING = 'hex';
