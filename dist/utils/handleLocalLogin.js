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
exports.handleLocalLogin = void 0;
const database_1 = require("../config/database");
const query_1 = require("../data_access/query");
const customErrors_1 = require("./customErrors");
function handleLocalLogin(id_number, password, req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const [user] = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT password FROM users WHERE id_number = ?', [id_number]);
            if (!user || !user.password) {
                return next(new customErrors_1.UnauthorizedError("Login Failed!"));
            }
            const isPasswordMatch = user.password === password;
            if (!isPasswordMatch)
                throw new customErrors_1.UnauthorizedError("Login Failed!");
            const [userRoleRow] = yield (0, query_1.selectQuery)(database_1.pool, "SELECT * FROM roles WHERE id_number = ?", [id_number]);
            req.session.user = {
                user_id: id_number,
                roles: {
                    admin: userRoleRow.admin,
                    program_head: userRoleRow.program_head,
                    voter: userRoleRow.voter
                }
            };
            if (userRoleRow.admin)
                return res.redirect('/admin/dashboard/overview');
            if (userRoleRow.program_head)
                return res.redirect('/program-head/dashboard/overview');
            return res.redirect('/election');
        }
        catch (error) {
            next(error);
        }
    });
}
exports.handleLocalLogin = handleLocalLogin;
