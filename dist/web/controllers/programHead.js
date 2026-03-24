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
exports.programHeadDashboardVoteTallyPage = exports.programHeadDashboardOverviewPage = void 0;
const database_1 = require("../../config/database");
const query_1 = require("../../data_access/query");
// import { Program } from "../../utils/enums/program";
// import { Position } from "../../utils/enums/position";
// import { CANDIDATE_POSITION } from "../../config/constants/CandidatePosition";
// import { DEPARTMENT } from "../../config/constants/BccDepartments";
function programHeadDashboardOverviewPage(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userSession = req.session.user;
            if (!userSession)
                return res.redirect('/?redirectMessage=You need to login first');
            const [user] = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM users WHERE id_number = ?', [userSession.user_id]);
            const elections = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM elections WHERE is_close = 0 AND deleted_at IS NULL ORDER BY date_start, time_start');
            const electionIdList = elections.map(election => election.election_id);
            let populationPerProgram = [];
            if (electionIdList.length > 0) {
                populationPerProgram = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM program_populations WHERE election_id IN ( ? )', [electionIdList]);
            }
            res.render("program/dashboard_overview_program_head", { elections, user, populationPerProgram });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.programHeadDashboardOverviewPage = programHeadDashboardOverviewPage;
// TODO
function programHeadDashboardVoteTallyPage(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userSession = req.session.user;
            if (!userSession)
                return res.redirect('/?redirectMessage=You need to login first');
            const [user] = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM users WHERE id_number = ?', [userSession.user_id]);
            const elections = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM elections WHERE is_close = 0 AND deleted_at IS NULL ORDER BY date_start, time_start');
            const candidatePosition = (yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM positions WHERE deleted_at IS NULL')).map(position => position.position);
            const programs = (yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM departments WHERE deleted_at IS NULL')).map(department => department.department_code);
            const electionIdList = elections.map(election => election.election_id);
            let candidates = [];
            if (electionIdList.length > 0) {
                candidates = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM candidates WHERE election_id IN ( ? ) AND deleted IS NULL', [electionIdList]);
            }
            res.render('program/dashboard-vote-tally-program-head', { elections, candidatePosition, programs, candidates, user });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.programHeadDashboardVoteTallyPage = programHeadDashboardVoteTallyPage;
