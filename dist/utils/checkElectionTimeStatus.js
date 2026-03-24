"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isElectionStarted = exports.isElectionEnded = void 0;
function isElectionEnded(election) {
    const PRESENT_DATETIME = new Date();
    let electionEndDateTime = new Date(election.date_end);
    const [hour, minute] = election.time_end.split(':');
    electionEndDateTime.setHours(Number(hour), Number(minute));
    return PRESENT_DATETIME >= electionEndDateTime;
}
exports.isElectionEnded = isElectionEnded;
function isElectionStarted(election) {
    const PRESENT_DATETIME = new Date();
    let electionStartDateTime = new Date(election.date_start);
    const [hour, minute] = election.time_start.split(':');
    electionStartDateTime.setHours(Number(hour), Number(minute));
    return PRESENT_DATETIME >= electionStartDateTime;
}
exports.isElectionStarted = isElectionStarted;
