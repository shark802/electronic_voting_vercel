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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientRegisteredFaceFilename = exports.isClientRegisteredFace = exports.insertUserRegisterFaceInfo = exports.getFaceRecognitionServiceDomain = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const customErrors_1 = require("../../utils/customErrors");
const query_1 = require("../../data_access/query");
const database_1 = require("../../config/database");
const uuid_1 = require("uuid");
dotenv_1.default.config();
function getFaceRecognitionServiceDomain(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const faceServiceDomain = process.env.FACE_RECOGNITION_SERVICE_DOMAIN;
            if (!faceServiceDomain)
                throw new customErrors_1.NotFoundError('Face recognition service domain not found!');
            res.status(200).json({ faceServiceDomain });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.getFaceRecognitionServiceDomain = getFaceRecognitionServiceDomain;
function insertUserRegisterFaceInfo(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            if (!req.session)
                throw new customErrors_1.UnauthorizedError('You need to login first!');
            const id = (0, uuid_1.v4)();
            const userId = (_b = (_a = req.session) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.user_id;
            const savedFaceFilename = req.body.filename;
            if (!savedFaceFilename)
                throw new customErrors_1.BadRequestError('Filename of saved face image is not provided');
            const insertResult = yield (0, query_1.insertQuery)(database_1.pool, 'INSERT INTO register_faces (id, id_number, saved_face_filename, registered_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)', [id, userId, savedFaceFilename]);
            if (insertResult.affectedRows === 0)
                throw new Error('Registration failed!');
            res.status(201).json({ message: 'Face registered' });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.insertUserRegisterFaceInfo = insertUserRegisterFaceInfo;
function isClientRegisteredFace(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            if (!req.session)
                throw new customErrors_1.UnauthorizedError(`Request failed, You have'nt login yet! `);
            const userId = (_a = req.session.user) === null || _a === void 0 ? void 0 : _a.user_id;
            const [RegisterFaceInfo] = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM register_faces WHERE id_number = ? LIMIT 1', [userId]);
            const isRegistered = RegisterFaceInfo ? true : false;
            return res.status(200).json({ isRegistered });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.isClientRegisteredFace = isClientRegisteredFace;
function getClientRegisteredFaceFilename(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            if (!req.session)
                throw new customErrors_1.UnauthorizedError(`Request failed, You have'nt login yet!`);
            const userId = (_a = req.session.user) === null || _a === void 0 ? void 0 : _a.user_id;
            const [RegisterFaceInfo] = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM register_faces WHERE id_number = ? AND deleted_at IS NULL LIMIT 1', [userId]);
            if (!RegisterFaceInfo || !RegisterFaceInfo.saved_face_filename)
                throw new customErrors_1.NotFoundError('Face Registration data not found!');
            return res.status(200).json({ filename: RegisterFaceInfo.saved_face_filename });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.getClientRegisteredFaceFilename = getClientRegisteredFaceFilename;
