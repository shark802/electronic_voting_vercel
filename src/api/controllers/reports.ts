import { NextFunction, Request, Response } from "express";
import { getAllVoterInElection } from "../../data_access/voterService";
import { selectQuery } from "../../data_access/query";
import { Election } from "../../utils/types/Election";
import { pool } from "../../config/database";
import { genereateTablePdf } from "../../utils/reportUtils/generateTablePdf";
import { BadRequestError } from "../../utils/customErrors";
import { filterVotersByFilterParameter } from "../../utils/filterVotersByFilterParameter";
import { User } from "../../utils/types/User";
import { Voter } from "../../utils/types/Voter";
import { createVoterReportTitle } from "../../utils/createVoterReportTitle";
import { generateElectionResult, getElectionResult } from "../../data_access/election";
import { CryptoService } from "../../utils/cryptoService";
import { CandidateVoteTally } from "../../utils/types/CandidatesVoteTally";
import { generateElectionResultPdf } from "../../utils/reportUtils/generateElectionResultPdf";
import { Department } from "../../utils/types/Department";
import { Position } from "../../utils/types/Positions";
import 'jspdf-autotable';
import { ProgramPopulations } from "../../utils/types/ProgramPopulations";
import path from 'path';
import fs from 'fs';


export async function generateVoterReportInPdf(req: Request, res: Response, next: NextFunction) {
    try {

        const election_id = req.params.id;
        if (!election_id) throw new BadRequestError('Missing required election id');

        let voteStatus = req.query.voteStatus || 'voted'; // if voteStatus request query is falsy, assign default 'voted' value;
        const { department, program, year_level, section } = req.query;

        const selectedVoteStatus = voteStatus === 'voted' ? 1 : 0;
        const selectedDepartment = department?.toString();
        const selectedProgram = program?.toString();
        const selectedYearLevel = year_level?.toString();
        const selectedSection = section?.toString();

        const [election] = await selectQuery<Election>(pool, 'SELECT * FROM elections WHERE election_id = ? LIMIT 1', [election_id]);
        const voters: (Partial<User> & Partial<Voter>)[] = await getAllVoterInElection(election_id);

        // filter voters
        const filteredVoters = await filterVotersByFilterParameter(voters, selectedVoteStatus, selectedDepartment, selectedProgram, selectedYearLevel, selectedSection);
        const reportTitle = createVoterReportTitle(selectedVoteStatus, selectedDepartment, selectedProgram, selectedYearLevel, selectedSection);

        const pdfBuffer = await genereateTablePdf(filteredVoters, reportTitle, election.election_name)
        const filename = reportTitle
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "_");

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);

        // Send the PDF as a response
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generating PDF:', error);
        next(error);
    }
}

export async function generatePdfElectionResult(req: Request, res: Response, next: NextFunction) {
    try {
        const electionId = req.params.id;

        const [election] = await selectQuery<Election>(pool, 'SELECT * FROM elections WHERE election_id = ?', [electionId]);
        const departments = await selectQuery<Department>(pool, 'SELECT department_code FROM departments WHERE deleted_at IS NULL ORDER BY department_code');
        let positions = await selectQuery<Position>(pool, 'SELECT position FROM positions WHERE deleted_at IS NULL');
        const programPopulation = await selectQuery<ProgramPopulations>(pool, 'SELECT * FROM program_populations WHERE election_id = ?', [electionId])

        const departmentArray = departments.map(department => department.department_code);
        const positionArray = positions.map(position => position.position);

        const electionResult = await getElectionResult(electionId);
        let candidatesVoteTally
        if (!electionResult) {
            candidatesVoteTally = await generateElectionResult(electionId)
        } else {
            const secretKey = CryptoService.secretKey();
            const iv = CryptoService.stringToBuffer(electionResult.encryption_iv)
            const decryptResult = CryptoService.decrypt(electionResult.result, secretKey, iv)
            candidatesVoteTally = JSON.parse(decryptResult)
        }

        (candidatesVoteTally as CandidateVoteTally[]).sort((a, b) => Number(b.vote_count) - Number(a.vote_count))

        // Read certification details
        let certificationDetails;
        try {
            const filePath = path.join(__dirname, './../../../public/docs/certification-details.json');
            if (fs.existsSync(filePath)) {
                const fileContent = fs.readFileSync(filePath, 'utf8');
                certificationDetails = JSON.parse(fileContent);
            }
        } catch (error) {
            console.error('Error reading certification details:', error);
        }

        // Generate PDF with certification details
        const pdfBuffer = await generateElectionResultPdf({
            candidatesVoteTally,
            election: election,
            departmentArray,
            positionArray,
            programPopulation,
            certificationDetails
        });

        const pdfFilename = election.election_name.replace(/\s+/g, '-').toLocaleLowerCase();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${pdfFilename}-result.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        next(error);
    }
}
