import { parentPort } from "worker_threads";
import { User } from "../types/User";
import { pool } from "../../config/database";
import { ulid } from "ulid";
import { PoolConnection } from "mysql2/promise";

type DataObject = {
    users: User[];
    electionId: string;
}

parentPort?.on('message', async (dataObject: DataObject) => {
    const { users, electionId } = dataObject;
    const connection = await pool.getConnection();

    try {

        const BATCH_COUNT = 100;
        const userBatches = generateUserBatches(users, BATCH_COUNT);


        await connection.beginTransaction();

        for (let i = 0; i < userBatches.length; i++) {
            const batch = userBatches[i];
            await createVoterForElection(electionId, batch, connection)
        };

        await connection.commit()

        parentPort?.postMessage({ success: true });

    } catch (error) {
        await connection.rollback()
        console.error('Error in worker:', error);
        parentPort?.postMessage({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    } finally {
        await connection.release();
    }
});

// will iterate on array of userBatch to insert in voter table
async function createVoterForElection(electionId: string, batch: User[], connection: PoolConnection) {
    try {

        let sqlQuery = `INSERT INTO voters (voter_id, id_number, election_id) VALUES `;
        const sqlQueryValues = batch.map((user) => {
            const voterId = ulid();
            return `('${voterId}', ${user.id_number}, '${electionId}')`
        }).join(',');

        sqlQuery = sqlQuery + sqlQueryValues;

        return await connection.query(sqlQuery);

    } catch (error) {
        throw error;
    }
}

function generateUserBatches(users: User[], batchCount: number): User[][] {
    const usersBatch: User[][] = [];

    for (let i = 0; i < users.length; i += batchCount) {
        usersBatch.push(users.slice(i, Math.min(i + batchCount, users.length)));
    }

    return usersBatch;
}
