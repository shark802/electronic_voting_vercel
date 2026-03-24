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
exports.isFaceVerified = exports.logoutFunction = exports.loginFunction = void 0;
const customErrors_1 = require("../../utils/customErrors");
const database_1 = require("../../config/database");
const query_1 = require("../../data_access/query");
const handleLocalLogin_1 = require("../../utils/handleLocalLogin");
function loginFunction(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id_number, password } = req.body;
        try {
            if (!id_number || !password)
                throw new customErrors_1.BadRequestError("Missing credentials!");
            // const response = await fetch(`https://bagocitycollege.com/BCCWeb/TPLoginAPI?txtUserName=${id_number}&txtPassword=${password}`, {
            //     method: 'GET',
            //     headers: {
            //         'Accept': 'application/json; charset=utf-8',
            //     }
            // });
            // const arrayBuffer = await response.arrayBuffer();
            // const decoder = new TextDecoder('iso-8859-1');
            // const decodedText = decoder.decode(arrayBuffer);
            // const apiResponseObject = JSON.parse(decodedText);
            // if (!apiResponseObject.is_valid) throw new UnauthorizedError("Login Failed!");
            // // Login successful
            // let user = convertApiObjectToUser(apiResponseObject);
            // const connection = await pool.getConnection();
            // try {
            //     await connection.beginTransaction();
            //     await createUser(connection, user); // save user info in database.
            //     const [rowResult] = await connection.execute<RowDataPacket[]>("SELECT * FROM roles WHERE id_number = ?", [user.id_number]);
            //     // If user don't have role yet, add role
            //     if (rowResult.length === 0) {
            //         const voterRole = apiResponseObject.user_group === "STUDENT" ? 1 : 0; // assign the voter role if the user is student.
            //         await connection.execute("INSERT INTO roles (voter, id_number) VALUES (?, ?)", [voterRole, user.id_number]);
            //     }
            //     await connection.commit();
            // } catch (error) {
            //     await connection.rollback()
            //     return next(error);
            // } finally {
            //     await connection.release();
            // }
            // attach this role result to user session
            const [user] = yield (0, query_1.selectQuery)(database_1.pool, `SELECT * FROM users
             LEFT JOIN roles
             ON roles.id_number = users.id_number
             WHERE users.id_number = ?`, [id_number]);
            if (!user || !(user === null || user === void 0 ? void 0 : user.password)) {
                throw new customErrors_1.UnauthorizedError('Login failed!');
            }
            // const isPasswordMatch = await bcrypt.compare(password, user.password);
            const isPasswordMatch = user.password === password;
            if (!isPasswordMatch)
                throw new customErrors_1.UnauthorizedError("Login Failed!");
            // const [userRoleRow] = await selectQuery<Role>(pool, "SELECT * FROM roles WHERE id_number = ?", [user.id_number]);
            req.session.user = {
                user_id: user.id_number,
                roles: {
                    admin: user.admin,
                    program_head: user.program_head,
                    voter: user.voter
                }
            };
            if (user.admin)
                return res.status(302).redirect('/admin/dashboard/overview');
            if (user.program_head)
                return res.status(302).redirect('/program-head/dashboard/overview');
            return res.status(302).redirect('/election');
        }
        catch (error) {
            if (error instanceof Error && error.name === 'TypeError' && error.message === 'fetch failed') {
                yield (0, handleLocalLogin_1.handleLocalLogin)(id_number, password, req, res, next);
            }
            else {
                next(error);
            }
        }
    });
}
exports.loginFunction = loginFunction;
function logoutFunction(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!req.session)
                return next(new Error('No session found'));
            req.session.destroy((error) => {
                if (error) {
                    return next(error);
                }
                res.clearCookie("connect.sid");
                res.status(200).json({ message: 'Logged out successfully' });
            });
        }
        catch (error) {
            console.error('Unexpected error during logout:', error);
            next(error);
        }
    });
}
exports.logoutFunction = logoutFunction;
function isFaceVerified(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            if (!req.session || !((_a = req.session) === null || _a === void 0 ? void 0 : _a.user))
                throw new customErrors_1.UnauthorizedError('Login Required');
            const faceVerified = (_b = req.body) === null || _b === void 0 ? void 0 : _b.faceVerified;
            if (faceVerified === undefined || faceVerified === null)
                throw new customErrors_1.BadRequestError('Face verified status is missing');
            req.session.faceVerified = faceVerified;
            return res.status(200).end();
        }
        catch (error) {
            next(error);
        }
    });
}
exports.isFaceVerified = isFaceVerified;
