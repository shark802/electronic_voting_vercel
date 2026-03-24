import { NextFunction, Request, Response } from "express";
import { pool } from "../../config/database";
import { selectQuery } from "../../data_access/query";
import { Election } from "../../utils/types/Election";
import { User } from "../../utils/types/User";
import { Position } from "../../utils/types/Positions";
import { Department } from "../../utils/types/Department";
// import { Program } from "../../utils/enums/program";
// import { Position } from "../../utils/enums/position";
// import { CANDIDATE_POSITION } from "../../config/constants/CandidatePosition";
// import { DEPARTMENT } from "../../config/constants/BccDepartments";

export async function programHeadDashboardOverviewPage(req: Request, res: Response, next: NextFunction) {
    try {
        const userSession = req.session.user;
        if (!userSession) return res.redirect('/?redirectMessage=You need to login first');
        const [user] = await selectQuery<User>(pool, 'SELECT * FROM users WHERE id_number = ?', [userSession.user_id]);

        const elections = await selectQuery<Election>(pool, 'SELECT * FROM elections WHERE is_close = 0 AND deleted_at IS NULL ORDER BY date_start, time_start');

        const electionIdList = elections.map(election => election.election_id);
        let populationPerProgram: unknown[] = []

        if (electionIdList.length > 0) {
            populationPerProgram = await selectQuery(pool, 'SELECT * FROM program_populations WHERE election_id IN ( ? )', [electionIdList])
        }

        res.render("program/dashboard_overview_program_head", { elections, user, populationPerProgram });

    } catch (error) {
        next(error);
    }
}

// TODO
export async function programHeadDashboardVoteTallyPage(req: Request, res: Response, next: NextFunction) {
    try {
        const userSession = req.session.user;
        if (!userSession) return res.redirect('/?redirectMessage=You need to login first');
        const [user] = await selectQuery<User>(pool, 'SELECT * FROM users WHERE id_number = ?', [userSession.user_id]);

        const elections = await selectQuery<Election>(pool, 'SELECT * FROM elections WHERE is_close = 0 AND deleted_at IS NULL ORDER BY date_start, time_start');
        const candidatePosition = (await selectQuery<Position>(pool, 'SELECT * FROM positions WHERE deleted_at IS NULL')).map(position => position.position);
        const programs = (await selectQuery<Department>(pool, 'SELECT * FROM departments WHERE deleted_at IS NULL')).map(department => department.department_code);

        const electionIdList = elections.map(election => election.election_id);
        let candidates: unknown[] = []

        if (electionIdList.length > 0) {
            candidates = await selectQuery(pool, 'SELECT * FROM candidates WHERE election_id IN ( ? ) AND deleted IS NULL', [electionIdList])
        }

        res.render('program/dashboard-vote-tally-program-head', { elections, candidatePosition, programs, candidates, user })
    } catch (error) {
        next(error)
    }

}