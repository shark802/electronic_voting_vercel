import { parentPort } from 'worker_threads';
import { Vote } from '../types/Votes';
import { CryptoService } from '../cryptoService';

parentPort?.on('message', (votes: Vote[]) => {
    try {
        const secretKey = CryptoService.secretKey();

        votes.forEach(vote => {
            try {
                const iv = CryptoService.stringToBuffer(vote.encryption_iv);

                // Decrypt and update the candidate_id
                vote.candidate_id = CryptoService.decrypt(vote.candidate_id, secretKey, iv);
            } catch (decryptError) {
                console.error(`Error decrypting vote:`, decryptError);
            }
        });

        parentPort?.postMessage(votes);
    } catch (error) {
        console.error(`Error processing votes:`, error);

        parentPort?.postMessage({ error: (error as Error).message });
    }
});
