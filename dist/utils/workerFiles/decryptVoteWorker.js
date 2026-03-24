"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const cryptoService_1 = require("../cryptoService");
worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.on('message', (votes) => {
    try {
        const secretKey = cryptoService_1.CryptoService.secretKey();
        votes.forEach(vote => {
            try {
                const iv = cryptoService_1.CryptoService.stringToBuffer(vote.encryption_iv);
                // Decrypt and update the candidate_id
                vote.candidate_id = cryptoService_1.CryptoService.decrypt(vote.candidate_id, secretKey, iv);
            }
            catch (decryptError) {
                console.error(`Error decrypting vote:`, decryptError);
            }
        });
        worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage(votes);
    }
    catch (error) {
        console.error(`Error processing votes:`, error);
        worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage({ error: error.message });
    }
});
