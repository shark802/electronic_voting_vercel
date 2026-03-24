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
exports.updateVoterPopulationFunction = void 0;
const customErrors_1 = require("../../utils/customErrors");
const database_1 = require("../../config/database");
function updateVoterPopulationFunction(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const electionId = req.params.id;
            const { total, populationPerProgram } = req.body;
            if (!electionId)
                throw new customErrors_1.BadRequestError('Cannot find election id');
            // if (populationPerProgram instanceof Object || Object.keys(populationPerProgram).length === 0) throw new BadRequestError('Invalid data for population');
            const connection = yield database_1.pool.getConnection();
            try {
                yield connection.beginTransaction();
                const [updateTotalPopulation] = yield connection.execute('UPDATE elections SET total_populations = ? WHERE election_id = ?', [total, electionId]);
                if (updateTotalPopulation.affectedRows === 0)
                    throw new customErrors_1.NotFoundError('No changes applied to total populations for election');
                for (const [key, value] of Object.entries(populationPerProgram)) {
                    const [updatePopulationPerProgram] = yield connection.execute('UPDATE program_populations SET program_population = ? WHERE election_id = ? AND program_code = ?', [value, electionId, key]);
                    if (updatePopulationPerProgram.affectedRows === 0)
                        throw new customErrors_1.NotFoundError(`No changes applied to update ${key} population`);
                }
                yield connection.commit();
                res.status(200).json({ message: "Update successful" });
            }
            catch (error) {
                yield connection.rollback();
                next(error);
            }
            finally {
                yield connection.release();
            }
        }
        catch (error) {
            next(error);
        }
    });
}
exports.updateVoterPopulationFunction = updateVoterPopulationFunction;
