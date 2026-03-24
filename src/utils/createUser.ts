import { User } from "./types/User";
import { ResultSetHeader } from "mysql2";
import { PoolConnection } from "mysql2/promise";

/**
 * 
 * @param connection 
 * @param user 
 * @returns 
 */
export async function createUser(connection: PoolConnection, user: Partial<User>) {

    const insertUserQuery = `
        INSERT INTO users (id_number, firstname, lastname, middlename, email, cp_number, course, year_level, section, program_description, is_active, user_group)
        VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            middlename = VALUES(middlename),
            email = VALUES(email),
            cp_number = VALUES(cp_number),
            year_level = VALUES(year_level),
            section = VALUES(section),
            program_description = VALUES(program_description),
            is_active = VALUES(is_active),
            user_group = VALUES(user_group)`;
    const insertUserValues = [user.id_number, user.firstname, user.lastname, user.middlename, user.email, user.cp_number, user.course, user.year_level, user.section, user.program_description, user.is_active, user.user_group];

    const [insertUserResult] = await connection.execute<ResultSetHeader>(insertUserQuery, insertUserValues); // -Insert a new User or update some user columns if the user is already exist
    return insertUserResult;
}