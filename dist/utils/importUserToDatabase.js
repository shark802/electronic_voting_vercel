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
exports.importUsersToDatabase = void 0;
const database_1 = require("../config/database");
const query_1 = require("../data_access/query");
const userService_1 = require("../data_access/userService");
/**
 * Processes and inserts user data into the database in batches using a worker thread.
 *
 * This function accepts an array of user objects (parsed from a CSV file) and offloads
 * the task of inserting this data into the database to a worker thread.
 *
 * @param csvUsersData - An array of user objects parsed from a CSV file.
 * @returns {Promise<number>} - A promise that resolves with the number of successfully processed users.
 *                              If an error occurs, the promise is rejected with the error.
 */
function importUsersToDatabase(csvUsersData, importId, filename, connection, socket) {
    return __awaiter(this, void 0, void 0, function* () {
        const importSize = csvUsersData.length;
        console.log(`Importing ${filename}`);
        const startTime = Date.now();
        for (let i = 0; i < csvUsersData.length; i++) {
            const user = csvUsersData[i];
            try {
                yield (0, userService_1.insertUsersInDatabase)([user], connection);
                const percentageInserted = ((i + 1) / importSize) * 100;
                socket.emit('user-import-update', {
                    percentage: percentageInserted,
                    status: 'PENDING',
                    currentInserted: i + 1,
                    importId: importId
                });
            }
            catch (error) {
                console.error(`Error inserting user ${i + 1}:`, error);
                yield (0, query_1.updateQuery)(database_1.pool, 'UPDATE users_import_records SET status = ? WHERE id = ? ', ['Failed', importId]);
                socket.emit('user-import-failed', {
                    status: 'FAILED',
                    userIndex: i + 1,
                });
                throw error;
            }
        }
        const endTime = Date.now();
        const totalTimeInMilliseconds = endTime - startTime;
        const totalMinutes = Math.floor(totalTimeInMilliseconds / (1000 * 60));
        const remainingSeconds = Math.floor((totalTimeInMilliseconds % (1000 * 60)) / 1000);
        const importTimeInMinutes = `${totalMinutes}:${remainingSeconds} mins `;
        console.log(`Successfully processed ${importSize} users.\n Time taken: ${importTimeInMinutes}`);
        return {
            importSize,
            importTimeInMinutes
        };
    });
}
exports.importUsersToDatabase = importUsersToDatabase;
