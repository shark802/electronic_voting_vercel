import path from "path";
import fs from "fs";
import { pool } from "../config/database";
import { selectQuery } from "../data_access/query";
import { User } from "../utils/types/User";
import { eventEmitter } from "./globalEventEmitterInstance";
import { Worker } from "worker_threads";

interface WorkerMessage {
    success?: boolean;
    error?: string;
}

eventEmitter.on('addCandidateEvent', async (electionId: string) => {
    let worker: Worker | null = null;
    try {
        const users = await selectQuery<User>(pool, 'SELECT * FROM users WHERE is_active = 1');

        const candidateWorkerPaths = [
            path.join(__dirname, "../utils/workerFiles/registerVotersOnElectionWorker.js"),
            path.join(__dirname, "../utils/workerFiles/registerVotersOnElectionWorker.ts"),
            path.join(process.cwd(), "dist/utils/workerFiles/registerVotersOnElectionWorker.js"),
            path.join(process.cwd(), "src/utils/workerFiles/registerVotersOnElectionWorker.ts"),
        ];
        const workerPath = candidateWorkerPaths.find((candidatePath) => fs.existsSync(candidatePath));
        if (!workerPath) {
            throw new Error("registerVotersOnElectionWorker file was not found in expected locations.");
        }

        worker = new Worker(workerPath);

        worker.postMessage({ users, electionId });

        worker.on('message', (result: WorkerMessage) => {
            if (result.success === true) {
                console.log(`Successfully added voters for election ${electionId}`);
            } else if (result.error) {
                console.error(`Error adding voters for election ${electionId}:`, result.error);
            }
            worker?.terminate();
        });

        worker.on('error', (error) => {
            console.error(`Worker error for election ${electionId}:`, error);
            worker?.terminate();
        });

        worker.on('exit', (code) => {
            if (code !== 0) {
                console.error(`Worker stopped with exit code ${code}`);
            }
        });

    } catch (error) {
        console.error(`Error in addCandidateEvent handler:`, error);
        worker?.terminate();
    }
});