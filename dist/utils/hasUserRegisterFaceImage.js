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
exports.hasUserRegisterFaceImage = void 0;
const database_1 = require("../config/database");
const query_1 = require("../data_access/query");
function hasUserRegisterFaceImage(idNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const [faceImageRow] = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM register_faces WHERE id_number = ? AND deleted_at IS NULL LIMIT 1', [idNumber]);
        const hasRegistered = faceImageRow !== undefined ? true : false;
        return hasRegistered;
    });
}
exports.hasUserRegisterFaceImage = hasUserRegisterFaceImage;
