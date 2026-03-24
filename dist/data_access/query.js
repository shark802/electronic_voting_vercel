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
exports.deleteQuery = exports.updateQuery = exports.selectQuery = exports.insertQuery = void 0;
/**
 * Function to Insert a Query in database
 */
function insertQuery(dbConnection, query, value) {
    return __awaiter(this, void 0, void 0, function* () {
        const [result] = yield dbConnection.query(query, value);
        return result;
    });
}
exports.insertQuery = insertQuery;
/**
 * Generic function that Executes a SELECT query on the database.
 * Optionally accepts an object with properties similar to database table
 */
function selectQuery(dbConnection, query, value) {
    return __awaiter(this, void 0, void 0, function* () {
        let [result] = yield dbConnection.query(query, value);
        return result;
    });
}
exports.selectQuery = selectQuery;
/**
 * A function to update entities in database
 */
function updateQuery(dbConnection, query, value) {
    return __awaiter(this, void 0, void 0, function* () {
        const [result] = yield dbConnection.query(query, value);
        return result;
    });
}
exports.updateQuery = updateQuery;
/**
 * A function to delete entities in database
 */
function deleteQuery(dbConnection, query, value) {
    return __awaiter(this, void 0, void 0, function* () {
        const [result] = yield dbConnection.query(query, value);
        return result;
    });
}
exports.deleteQuery = deleteQuery;
