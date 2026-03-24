import { NextFunction, Request, Response } from "express";
import { BadRequestError } from "../../utils/customErrors";
import { selectQuery } from "../../data_access/query";
import { Election } from "../../utils/types/Election";
import { pool } from "../../config/database";
import { getAllVoterInElection } from "../../data_access/voterService";
import { User } from "../../utils/types/User";
import { Voter } from "../../utils/types/Voter";
import { filterVotersByFilterParameter } from "../../utils/filterVotersByFilterParameter";
import { getPaginatedUsers } from "../../utils/getPaginatedUsers";
import { createVoterReportTitle } from "../../utils/createVoterReportTitle";
import { Department } from "../../utils/types/Department";
import { Program } from "../../utils/types/Program";

export async function previewVoterParticipationReports(req: Request, res: Response, next: NextFunction) {
    try {
        const election_id = req.params.id;
        if (!election_id) throw new BadRequestError('Missing required election id');

        // query parameters
        const page = req.query.page || 1
        let voteStatus = req.query.voteStatus || 'voted'; // if voteStatus request query is falsy, assign default 'voted' value;
        const { department, program, year_level, section } = req.query;

        const selectedVoteStatus = voteStatus === 'voted' ? 1 : 0;
        const selectedDepartment = department?.toString();
        const selectedProgram = program?.toString();
        const selectedYearLevel = year_level?.toString();
        const selectedSection = section?.toString();

        // get available departments and map to array of department codes
        const availableDepartments = await selectQuery<Department>(pool, 'SELECT * FROM departments WHERE deleted_at IS NULL');
        const departments = availableDepartments.map(department => department.department_code);

        // get programs based on selected department
        const departmentId = availableDepartments.find(department => department.department_code === selectedDepartment)?.department_id;
        const programs = departmentId ? (await selectQuery<Program>(pool, 'SELECT * FROM programs WHERE department = ? AND deleted_at IS NULL', [departmentId])).map(program => program.program_code) : []

        // get year levels
        const yearLevels = [1, 2, 3, 4];

        const sqlSectionResult = program ? await selectQuery<Pick<User, 'section'>[]>(
            pool,
            `SELECT DISTINCT users.section
            FROM voters JOIN users ON voters.id_number = users.id_number 
            WHERE voters.election_id = ?
            AND course = ?
            ORDER BY users.section`,
            [election_id, program]
        ) : []
        const sections = sqlSectionResult.map(section => Object.values(section)).flat();

        const [election] = await selectQuery<Election>(pool, 'SELECT * FROM elections WHERE election_id = ? LIMIT 1', [election_id]);
        const voters: (Partial<User> & Partial<Voter>)[] = await getAllVoterInElection(election_id);

        // filter voters
        const filteredVoters = await filterVotersByFilterParameter(voters, selectedVoteStatus, selectedDepartment, selectedProgram, selectedYearLevel, selectedSection);
        const reportTitle = createVoterReportTitle(selectedVoteStatus, selectedDepartment, selectedProgram, selectedYearLevel, selectedSection);
        const users = getPaginatedUsers(filteredVoters, page as number);

        const usersSize = filteredVoters.length;

        res.render('report/preview-voter-report', { election, departments, programs, yearLevels, sections, selectedVoteStatus, selectedDepartment, selectedProgram, selectedYearLevel, selectedSection, users, page, usersSize, reportTitle })
    } catch (error) {
        next(error)
    }
}

export async function programHeadVoterParticipationReport(req: Request, res: Response, next: NextFunction) {
    try {
        const election_id = req.params.id;
        if (!election_id) throw new BadRequestError('Missing required election id');

        // query parameters
        const page = req.query.page || 1
        let voteStatus = req.query.voteStatus || 'voted'; // if voteStatus request query is falsy, assign default 'voted' value;
        const { department, program, year_level, section } = req.query;
        const selectedVoteStatus = voteStatus === 'voted' ? 1 : 0;
        const selectedDepartment = department?.toString();
        const selectedProgram = program?.toString();
        const selectedYearLevel = year_level?.toString();
        const selectedSection = section?.toString();

        // get available departments and map to array of department codes
        const availableDepartments = await selectQuery<Department>(pool, 'SELECT * FROM departments WHERE deleted_at IS NULL');
        const departments = availableDepartments.map(department => department.department_code);

        // get programs based on selected department
        const departmentId = availableDepartments.find(department => department.department_code === selectedDepartment)?.department_id;
        const programs = departmentId ? (await selectQuery<Program>(pool, 'SELECT * FROM programs WHERE department = ? AND deleted_at IS NULL', [departmentId])).map(program => program.program_code) : []

        // get year levels
        const yearLevels = [1, 2, 3, 4];

        const sqlSectionResult = program ? await selectQuery<Pick<User, 'section'>[]>(
            pool,
            `SELECT DISTINCT users.section
            FROM voters JOIN users ON voters.id_number = users.id_number 
            WHERE voters.election_id = ?
            AND course = ?
            ORDER BY users.section`,
            [election_id, program]
        ) : []
        const sections = sqlSectionResult.map(section => Object.values(section)).flat();

        const [election] = await selectQuery<Election>(pool, 'SELECT * FROM elections WHERE election_id = ? LIMIT 1', [election_id]);
        const voters: (Partial<User> & Partial<Voter>)[] = await getAllVoterInElection(election_id);

        // filter voters
        const filteredVoters = await filterVotersByFilterParameter(voters, selectedVoteStatus, selectedDepartment, selectedProgram, selectedYearLevel, selectedSection);
        const reportTitle = createVoterReportTitle(selectedVoteStatus, selectedDepartment, selectedProgram, selectedYearLevel, selectedSection);

        const users = getPaginatedUsers(filteredVoters, page as number);

        const usersSize = filteredVoters.length;

        res.render('report/program-head-voter-report', { election, departments, programs, yearLevels, sections, selectedVoteStatus, selectedDepartment, selectedProgram, selectedYearLevel, selectedSection, users, page, usersSize, reportTitle })
    } catch (error) {
        next(error)
    }
}

export async function completeVoterParticipationReports(req: Request, res: Response, next: NextFunction) {
    try {
        const election_id = req.params.id;
        if (!election_id) throw new BadRequestError('Missing required election id');

        // query parameters
        const page = req.query.page || 1
        let voteStatus = req.query.voteStatus || 'voted'; // if voteStatus request query is falsy, assign default 'voted' value;
        const { department, program, year_level, section } = req.query;

        const selectedVoteStatus = voteStatus === 'voted' ? 1 : 0;
        const selectedDepartment = department?.toString();
        const selectedProgram = program?.toString();
        const selectedYearLevel = year_level?.toString();
        const selectedSection = section?.toString();

        // get available departments and map to array of department codes
        const availableDepartments = await selectQuery<Department>(pool, 'SELECT * FROM departments WHERE deleted_at IS NULL');
        const departments = availableDepartments.map(department => department.department_code);

        // get programs based on selected department
        const departmentId = availableDepartments.find(department => department.department_code === selectedDepartment)?.department_id;
        const programs = departmentId ? (await selectQuery<Program>(pool, 'SELECT * FROM programs WHERE department = ? AND deleted_at IS NULL', [departmentId])).map(program => program.program_code) : []

        // get year levels
        const yearLevels = [1, 2, 3, 4];

        const sqlSectionResult = program ? await selectQuery<Pick<User, 'section'>[]>(
            pool,
            `SELECT DISTINCT users.section
            FROM voters JOIN users ON voters.id_number = users.id_number 
            WHERE voters.election_id = ?
            AND course = ?
            ORDER BY users.section`,
            [election_id, program]
        ) : []
        const sections = sqlSectionResult.map(section => Object.values(section)).flat();

        const [election] = await selectQuery<Election>(pool, 'SELECT * FROM elections WHERE election_id = ? LIMIT 1', [election_id]);
        const voters: (Partial<User> & Partial<Voter>)[] = await getAllVoterInElection(election_id);

        // filter voters
        const filteredVoters = await filterVotersByFilterParameter(voters, selectedVoteStatus, selectedDepartment, selectedProgram, selectedYearLevel, selectedSection);
        const reportTitle = createVoterReportTitle(selectedVoteStatus, selectedDepartment, selectedProgram, selectedYearLevel, selectedSection);
        const users = getPaginatedUsers(filteredVoters, page as number);

        const usersSize = filteredVoters.length;

        res.render('report/voter-complete-report', { election, departments, programs, yearLevels, sections, selectedVoteStatus, selectedDepartment, selectedProgram, selectedYearLevel, selectedSection, users, page, usersSize, reportTitle })
    } catch (error) {
        next(error)
    }
}