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
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const database_1 = require("../../config/database");
const ulid_1 = require("ulid");
worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.on('message', (dataObject) => __awaiter(void 0, void 0, void 0, function* () {
    const { users, electionId } = dataObject;
    const connection = yield database_1.pool.getConnection();
    try {
        const BATCH_COUNT = 100;
        const userBatches = generateUserBatches(users, BATCH_COUNT);
        yield connection.beginTransaction();
        for (let i = 0; i < userBatches.length; i++) {
            const batch = userBatches[i];
            yield createVoterForElection(electionId, batch, connection);
        }
        ;
        yield connection.commit();
        worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage({ success: true });
    }
    catch (error) {
        yield connection.rollback();
        console.error('Error in worker:', error);
        worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
    finally {
        yield connection.release();
    }
}));
// will iterate on array of userBatch to insert in voter table
function createVoterForElection(electionId, batch, connection) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let sqlQuery = `INSERT INTO voters (voter_id, id_number, election_id) VALUES `;
            const sqlQueryValues = batch.map((user) => {
                const voterId = (0, ulid_1.ulid)();
                return `('${voterId}', ${user.id_number}, '${electionId}')`;
            }).join(',');
            sqlQuery = sqlQuery + sqlQueryValues;
            return yield connection.query(sqlQuery);
        }
        catch (error) {
            throw error;
        }
    });
}
function generateUserBatches(users, batchCount) {
    const usersBatch = [];
    for (let i = 0; i < users.length; i += batchCount) {
        usersBatch.push(users.slice(i, Math.min(i + batchCount, users.length)));
    }
    return usersBatch;
}
