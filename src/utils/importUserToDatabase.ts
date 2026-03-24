import { CsvUserObject } from "./types/CsvUserObject";
import { pool } from "../config/database";
import { updateQuery } from "../data_access/query";
import { Connection } from "mysql2/promise";
import { insertUsersInDatabase } from "../data_access/userService";
import { Socket } from "socket.io";

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
export async function importUsersToDatabase(csvUsersData: CsvUserObject[], importId: string, filename: string, connection: Connection, socket: Socket) {

    const importSize = csvUsersData.length;

    console.log(`Importing ${filename}`);
    const startTime = Date.now();

    for (let i = 0; i < csvUsersData.length; i++) {
        const user = csvUsersData[i];

        try {

            await insertUsersInDatabase([user], connection);

            const percentageInserted = ((i + 1) / importSize) * 100;
            socket.emit('user-import-update', {
                percentage: percentageInserted,
                status: 'PENDING',
                currentInserted: i + 1,
                importId: importId
            });


        } catch (error) {

            console.error(`Error inserting user ${i + 1}:`, error);

            await updateQuery(pool, 'UPDATE users_import_records SET status = ? WHERE id = ? ', ['Failed', importId])

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
}