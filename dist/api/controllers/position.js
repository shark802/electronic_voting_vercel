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
exports.removePosition = exports.getAllPositions = exports.addPosition = void 0;
const customErrors_1 = require("../../utils/customErrors");
const query_1 = require("../../data_access/query");
const database_1 = require("../../config/database");
function addPosition(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { position } = req.body;
            if (!position || position === "")
                throw new customErrors_1.BadRequestError("Position is required");
            const existPosition = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM positions WHERE position = ? AND deleted_at IS NULL', [position]);
            if (existPosition.length > 0)
                throw new customErrors_1.ConflictError("Position already exists");
            yield (0, query_1.insertQuery)(database_1.pool, 'INSERT INTO positions (position) VALUES (?)', [position]);
            res.status(201).json({ message: "Position added successfully" });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.addPosition = addPosition;
function getAllPositions(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const positions = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM positions WHERE deleted_at IS NULL');
            res.status(200).json({ positions });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.getAllPositions = getAllPositions;
function removePosition(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const positionId = req.params.id;
            const deletePosition = yield (0, query_1.deleteQuery)(database_1.pool, 'UPDATE positions SET deleted_at = NOW() WHERE position_id = ?', [positionId]);
            if (deletePosition.affectedRows === 0)
                throw new customErrors_1.NotFoundError("Position not found");
            res.status(200).json({ message: "Position removed successfully" });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.removePosition = removePosition;
