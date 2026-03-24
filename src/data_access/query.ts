import { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";

/**
 * Function to Insert a Query in database
 */
export async function insertQuery(	dbConnection: Pool,	query: string,	value?: any[]): Promise<ResultSetHeader> {
	const [result] = await dbConnection.query<ResultSetHeader>(query, value);
	return result;
}

/**
 * Generic function that Executes a SELECT query on the database.
 * Optionally accepts an object with properties similar to database table
 */
export async function selectQuery<T>(dbConnection: Pool, query: string,	value?: any[]): Promise<T[]> {
	type rowData = T & RowDataPacket;
	let [result] = await dbConnection.query<rowData[]>(query, value);
	return result;
}

/**
 * A function to update entities in database
 */
export async function updateQuery(dbConnection: Pool,query: string,value?: any[]): Promise<ResultSetHeader> {
	const [result] = await dbConnection.query<ResultSetHeader>(query, value);
	return result;
}

/**
 * A function to delete entities in database
 */
export async function deleteQuery(dbConnection: Pool,query: string,value?: any[]): Promise<ResultSetHeader> {
	const [result] = await dbConnection.query<ResultSetHeader>(query, value);
	return result;
}
