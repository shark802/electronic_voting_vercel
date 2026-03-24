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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const query_1 = require("../data_access/query");
const globalEventEmitterInstance_1 = require("./globalEventEmitterInstance");
const nodeMailerConfig_1 = require("../config/nodeMailerConfig");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
globalEventEmitterInstance_1.eventEmitter.on('new-vote', (userId, electionId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [user] = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM users WHERE id_number = ? LIMIT 1', [userId]);
        const [election] = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM elections WHERE election_id = ? LIMIT 1', [electionId]);
        const userEmailAddress = user.email;
        if (!process.env.NODEMAILER_USER || !(userEmailAddress === null || userEmailAddress === void 0 ? void 0 : userEmailAddress.trim()))
            return;
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
        yield nodeMailerConfig_1.transporter.sendMail(options);
    }
    catch (error) {
        console.error(error);
    }
}));
