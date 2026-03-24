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
exports.insertUsersInDatabase = void 0;
function insertUsersInDatabase(csvUserObject, connection) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                for (const user of csvUserObject) {
                    const sqlQuery = `
                    INSERT INTO users (id_number, lastname, firstname, middlename, course, year_level, section, password, year_active, user_group, is_active, email)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        lastname = VALUES(lastname),
                        firstname = VALUES(firstname),
                        middlename = VALUES(middlename),
                        course = VALUES(course),
                        year_level = VALUES(year_level),
                        section = VALUES(section),
                        password = VALUES(password),
                        year_active = VALUES(year_active),
                        user_group = VALUES(user_group),
                        is_active = VALUES(is_active),
                        email = VALUES(email)
                `;
                    const year_active = new Date().getFullYear();
                    yield connection.execute(sqlQuery, [user["ID NUMBER"], user["LAST NAME"], user["FIRST NAME"], user["MIDDLE NAME"], user.COURSE, user.YEAR, user.SECTION, user.PASSWORD, year_active, 'STUDENT', 1, user.EMAIL]);
                    const [userRole] = yield connection.execute('SELECT * FROM roles WHERE id_number = ? LIMIT 1', [user["ID NUMBER"]]);
                    if (userRole.length === 0) {
                        yield connection.execute('INSERT INTO roles (id_number, voter) VALUES (?, 1)', [user["ID NUMBER"]]);
                    }
                }
                resolve({
                    message: "All users inserted/updated successfully",
                    totalUsersProcessed: csvUserObject.length
                });
            }
            catch (error) {
                reject(error);
            }
        }));
    });
}
exports.insertUsersInDatabase = insertUsersInDatabase;
