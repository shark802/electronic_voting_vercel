"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const database_1 = require("../config/database");
const query_1 = require("../data_access/query");
const globalEventEmitterInstance_1 = require("./globalEventEmitterInstance");
const worker_threads_1 = require("worker_threads");
globalEventEmitterInstance_1.eventEmitter.on('addCandidateEvent', (electionId) => __awaiter(void 0, void 0, void 0, function* () {
    let worker = null;
    try {
        const users = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM users WHERE is_active = 1');
        // Determine the correct path based on environment
        const isDev = process.env.NODE_ENV !== 'production';
        const workerPath = isDev
            ? path_1.default.join(__dirname, '../../src/utils/workerFiles/registerVotersOnElectionWorker.ts')
            : path_1.default.join(__dirname, '../utils/workerFiles/registerVotersOnElectionWorker.js');
        worker = new worker_threads_1.Worker(workerPath);
        worker.postMessage({ users, electionId });
        worker.on('message', (result) => {
            if (result.success === true) {
                console.log(`Successfully added voters for election ${electionId}`);
            }
            else if (result.error) {
                console.error(`Error adding voters for election ${electionId}:`, result.error);
            }
            worker === null || worker === void 0 ? void 0 : worker.terminate();
        });
        worker.on('error', (error) => {
            console.error(`Worker error for election ${electionId}:`, error);
            worker === null || worker === void 0 ? void 0 : worker.terminate();
        });
        worker.on('exit', (code) => {
            if (code !== 0) {
                console.error(`Worker stopped with exit code ${code}`);
            }
        });
    }
    catch (error) {
        console.error(`Error in addCandidateEvent handler:`, error);
        worker === null || worker === void 0 ? void 0 : worker.terminate();
    }
}));
