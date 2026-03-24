import { pool } from '../config/database';
import { selectQuery } from '../data_access/query';
import { User } from '../utils/types/User';
import { eventEmitter } from './globalEventEmitterInstance';
import { transporter } from '../config/nodeMailerConfig';
import dotenv from 'dotenv';
import { Election } from '../utils/types/Election';

dotenv.config();

eventEmitter.on('new-vote', async (userId: string, electionId: string) => {
    try {
        const [user] = await selectQuery<User>(pool, 'SELECT * FROM users WHERE id_number = ? LIMIT 1', [userId]);
        const [election] = await selectQuery<Election>(pool, 'SELECT * FROM elections WHERE election_id = ? LIMIT 1', [electionId]);
        const userEmailAddress = user.email;

        if (!process.env.NODEMAILER_USER || !userEmailAddress?.trim()) return;

        let electionDateStart = new Date(election.date_start);
        const [hour, minute] = election.time_start.split(':');
        electionDateStart.setHours(Number(hour), Number(minute));
        const formattedElectionDate = electionDateStart.toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: 'numeric', hour12: true });

        const currentDate = new Date().toLocaleDateString();
        const subject = 'Vote Confirmation';
        const content = `
            <div style="font-family: Arial, sans-serif; background-color: white; color: black; padding: 20px; border: 1px solid #007BFF;">
                <h2 style="color: #007BFF;">Vote Confirmation</h2>
                <p>Dear ${user.firstname} ${user.lastname},</p>
                <p>Thank you for participating in the <strong>${election.election_name}</strong> held on <strong>${formattedElectionDate}</strong>. We confirm that your vote has been successfully recorded.</p>
                <h3 style="color: #007BFF;">Key Details of Your Voting Activity:</h3>
                <p><strong>Election Name:</strong> ${election.election_name}</p>
                <p><strong>Voting Date:</strong> ${currentDate}</p>
                <p><strong>Voting Time:</strong> ${new Date().toLocaleTimeString()}</p>
                <p>Thank you again for your civic engagement!</p>
                <p>Best regards,<br>BCC Comelec</p>
            </div>
            `;

        const options = {
            from: process.env.NODEMAILER_USER,
            to: userEmailAddress, subject,
            html: content
        };

        await transporter.sendMail(options);

    } catch (error) {
        console.error(error);
    }
});