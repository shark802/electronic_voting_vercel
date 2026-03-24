import { NextFunction, Request, Response } from "express";
import { insertQuery, selectQuery, updateQuery } from "../../data_access/query";
import { pool } from "../../config/database";
import { User } from "../../utils/types/User";
import { Department } from "../../utils/types/Department";
import { BadRequestError, ConflictError, NotFoundError } from "../../utils/customErrors";
import { Program } from "../../utils/types/Program";

export async function addDepartment(req: Request, res: Response, next: NextFunction) {
    try {
        const { departmentCode } = req.body;

        if (!departmentCode || departmentCode === "") throw new BadRequestError("Department code is required");

        const department = await selectQuery<Department>(pool, 'SELECT * FROM departments WHERE department_code = ? AND deleted_at IS NULL', [departmentCode]);
        if (department.length > 0) throw new ConflictError(`${departmentCode} already exists`);

        await insertQuery(pool, 'INSERT INTO departments (department_code) VALUES (?)', [departmentCode]);
        return res.status(200).json({ message: "Department added successfully" })

    } catch (error) {
        next(error)
    }
}

export async function getAllDepartments(req: Request, res: Response, next: NextFunction) {
    try {
        const departments = await selectQuery<Department>(pool, 'SELECT * FROM departments WHERE deleted_at IS NULL');
        return res.status(200).json({ departments })
    } catch (error) {
        next(error)
    }
}

export async function getDepartmentObject(req: Request, res: Response, next: NextFunction) {
    try {

        const departments = await selectQuery<Department>(pool, 'SELECT * FROM departments WHERE deleted_at IS NULL');
        const programs = await selectQuery<Program>(pool, 'SELECT * FROM programs WHERE deleted_at IS NULL');

        const DEPARTMENT: Record<string, string[]> = {};

        for (const department of departments) {
            DEPARTMENT[department.department_code] = programs.filter(program => program.department === department.department_id).map(program => program.program_code);
        }

        return res.status(200).json({ DEPARTMENT })
    } catch (error) {
        next(error)
    }
}

export async function getDepartmentPrograms(req: Request, res: Response, next: NextFunction) {
    try {
        const departmentCode = req.query.department;

        const [department] = await selectQuery<Department>(pool, 'SELECT department_id FROM departments WHERE department_code = ? AND deleted_at IS NULL', [departmentCode]);
        if (!department) throw new NotFoundError(`Department ${departmentCode} not found`);
        const programs = await selectQuery<Program>(pool, 'SELECT program_code FROM programs WHERE department = ? AND deleted_at IS NULL', [department.department_id]);
        const programCodes = programs.map(program => program.program_code);

        return res.status(200).json({ programs: programCodes })

    } catch (error) {
        next(error)
    }
}

export async function getProgramSection(req: Request, res: Response, next: NextFunction) {
    try {

        const program = req.query.program;
        const currentYear = new Date().getFullYear();

        const sqlSectionResult = await selectQuery<Pick<User, 'section'>>(pool, 'SELECT DISTINCT section FROM users WHERE course = ? AND (year_active = ? OR is_active = 1) ORDER BY section', [program, currentYear]);
        const sections = sqlSectionResult.map(section => section.section);

        return res.status(200).json({ sections });

    } catch (error) {
        next(error)
    }
}

export async function removeDepartment(req: Request, res: Response, next: NextFunction) {
    try {
        const departmentId = req.params.id;
        if (!departmentId || departmentId === "") throw new BadRequestError("Department code is required");

        const sqlRemoveDepartment = await updateQuery(pool, 'UPDATE departments SET deleted_at = ? WHERE department_id = ?', [new Date(), departmentId]);
        if (sqlRemoveDepartment.affectedRows === 0) throw new NotFoundError(`Department ${departmentId} not found`);

        await updateQuery(pool, 'UPDATE programs SET deleted_at = ? WHERE department = ?', [new Date(), departmentId]);

        return res.status(200).json({ message: "Department and its programs have been successfully removed." })
    } catch (error) {
        next(error)
    }
}

export async function setDepartmentMaxSenatorVote(req: Request, res: Response, next: NextFunction) {
    try {
        const { departmentId, maxVote } = req.body;

        if (!departmentId) throw new BadRequestError("Department is required");
        if (!maxVote) throw new BadRequestError("Max vote is required");

        const sqlSetDepartmentMaxSenatorVote = await updateQuery(pool, 'UPDATE departments SET max_select_senator = ? WHERE department_id = ?', [maxVote, departmentId]);
        if (sqlSetDepartmentMaxSenatorVote.affectedRows === 0) throw new NotFoundError(`Department ${departmentId} not found`);

        return res.status(200).json({ message: "Department max senator vote set successfully" })
    } catch (error) {
        console.log(error);
        next(error)
    }
}

export async function addProgram(req: Request, res: Response, next: NextFunction) {
    try {
        const { departmentId, programCode } = req.body;

        if (!departmentId) throw new BadRequestError("Department is required");
        if (!programCode) throw new BadRequestError("Program code is required");

        const existingProgram = await selectQuery<Program>(pool, 'SELECT * FROM programs WHERE program_code = ? AND deleted_at IS NULL', [programCode]);
        if (existingProgram.length > 0) throw new ConflictError(`${programCode} already exists`);

        await insertQuery(pool, 'INSERT INTO programs (department, program_code) VALUES (?, ?)', [departmentId, programCode]);
        return res.status(200).json({ message: "Program added successfully" })

    } catch (error) {
        next(error)
    }
}

export async function getAllPrograms(req: Request, res: Response, next: NextFunction) {
    try {
        const programs = await selectQuery<Program>(pool, 'SELECT * FROM programs p JOIN departments d ON p.department = d.department_id WHERE p.deleted_at IS NULL ORDER BY d.department_code, p.program_code');
        return res.status(200).json({ programs })
    } catch (error) {
        next(error)
    }
}

export async function removeProgram(req: Request, res: Response, next: NextFunction) {
    try {
        const programId = req.params.id;

        const sqlRemoveProgram = await updateQuery(pool, 'UPDATE programs SET deleted_at = ? WHERE program_id = ?', [new Date(), programId]);

        if (sqlRemoveProgram.affectedRows === 0) throw new NotFoundError(`Program ${programId} not found`);

        return res.status(200).json({ message: "Program removed successfully" })
    } catch (error) {
        next(error)
    }
}

export async function getAllYearLevel(req: Request, res: Response, next: NextFunction) {
    try {
        let yearLevelsResult = await selectQuery<{ year_level: number }>(pool, 'SELECT DISTINCT year_level FROM users WHERE year_level IS NOT NULL');
        const yearLevels = yearLevelsResult.map(level => level.year_level).sort();

        return res.status(200).json({ yearLevels });
    } catch (error) {

    }
}