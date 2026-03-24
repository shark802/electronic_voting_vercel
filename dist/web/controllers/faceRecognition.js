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
exports.faceAuthenticatePage = exports.faceRegisterPage = void 0;
const query_1 = require("../../data_access/query");
const database_1 = require("../../config/database");
function faceRegisterPage(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            res.render('face-recognition/face-register');
        }
        catch (error) {
            next(error);
        }
    });
}
exports.faceRegisterPage = faceRegisterPage;
function faceAuthenticatePage(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const id_number = (_a = req.session.user) === null || _a === void 0 ? void 0 : _a.user_id;
        const electionId = req.query.election;
        const [registerFace] = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM register_faces WHERE id_number = ? LIMIT 1', [id_number]);
        if (!registerFace)
            return res.redirect('/election?redirectMessage=No face registered found for this user!');
        res.render('face-recognition/face-authenticate', { electionId });
    });
}
exports.faceAuthenticatePage = faceAuthenticatePage;
