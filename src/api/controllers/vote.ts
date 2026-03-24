import { eventEmitter } from './../../events/globalEventEmitterInstance';
import { NextFunction, Request, Response } from "express";
import { BadRequestError, ConflictError, UnauthorizedError } from "../../utils/customErrors";
import { checkIfUserHasVoted, getVoterDepartment, incrementCandidateVoteCount, saveVote, updateVoterVoteStatus } from "../../data_access/voteService";
import { pool } from "../../config/database";
import { Socket } from "socket.io";
import { Candidate } from "../../utils/types/Candidate";
import { selectQuery, updateQuery } from '../../data_access/query';
import { RegisterFaces } from '../../utils/types/RegisterFaces';
import dotenv from 'dotenv';
dotenv.config();

export async function saveVoteFunction(req: Request, res: Response, next: NextFunction) {
    try {
        const { electionId } = req.body;
        const selectedCandidate: Pick<Candidate, 'id_number' | 'position'>[] = req.body.selectedCandidate
        const user_id = req.session.user!.user_id;
        const ipRegistered = req.session.ipRegistered;
        const faceVerified = req.session?.faceVerified; // available if voter vote online and authenticated their face

        const socket: Socket = res.locals.io;

        if (!ipRegistered && !faceVerified) {
            throw new UnauthorizedError('Unauthorized vote attempt. Please either register your IP or complete face verification.');
        }

        if (!electionId) throw new BadRequestError('Election ID is missing');
        if (!selectedCandidate || typeof selectedCandidate !== 'object' || Object.keys(selectedCandidate).length === 0) throw new BadRequestError('Selected candidate data is missing or invalid');

        const hasVoted = await checkIfUserHasVoted(user_id, electionId);
        if (hasVoted) throw new ConflictError("You have already voted!");

        // Start transaction for saving vote and updating candidate vote count.
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await saveVote(connection, selectedCandidate, user_id, electionId);
            await incrementCandidateVoteCount(connection, selectedCandidate, electionId);
            await updateVoterVoteStatus(connection, user_id, electionId, faceVerified);
            await connection.commit();

            // this event emitter emit a new-vote event that will trigger to send email with the user_id pass
            eventEmitter.emit('new-vote', user_id, electionId);

            //broadcast an event when new vote saved for to update the dashboard realtime
            const department = await getVoterDepartment(user_id);

            socket.emit('new-vote', {
                election_id: electionId,
                voter_id: user_id,
                department,
                voted_candidate_list: selectedCandidate.map(candidate => ({
                    candidate_id: candidate.id_number,
                    candidate_position: candidate.position
                }))
            });


            if (faceVerified) {
                const ENVIRONMENT = process.env.NODE_ENV;
                const FACE_SERVICE_DOMAIN = ENVIRONMENT === 'production' ? `https://${process.env.FACE_RECOGNITION_SERVICE_DOMAIN}` : 'http://localhost:8000';
                const [registerFaceFilename] = await selectQuery<RegisterFaces>(pool, 'SELECT * FROM register_faces WHERE id_number = ? AND deleted_at IS NULL LIMIT 1', [user_id])
                if (registerFaceFilename) {

                    await Promise.all([
                        fetch(`${FACE_SERVICE_DOMAIN}/api/delete/${registerFaceFilename.saved_face_filename}`, { method: 'DELETE' }),
                        updateQuery(pool, 'UPDATE register_faces SET deleted_at = CURRENT_TIMESTAMP() WHERE id = ?', [registerFaceFilename.id])
                    ])
                }
            }

            res.status(200).json({ message: "Vote saved!" });
        } catch (error) {
            await connection.rollback();
            next(error);

        } finally {
            connection.release();
        }

    } catch (error) {
        next(error);
    }
}
