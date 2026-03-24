import { Election } from "./types/Election";

export function isElectionEnded(election: Election): boolean {
    const PRESENT_DATETIME = new Date();

    let electionEndDateTime = new Date(election.date_end);
    const [hour, minute] = election.time_end.split(':');
    electionEndDateTime.setHours(Number(hour), Number(minute));

    return PRESENT_DATETIME >= electionEndDateTime;
}

export function isElectionStarted(election: Election): boolean {
    const PRESENT_DATETIME = new Date();

    let electionStartDateTime = new Date(election.date_start);
    const [hour, minute] = election.time_start.split(':');
    electionStartDateTime.setHours(Number(hour), Number(minute));

    return PRESENT_DATETIME >= electionStartDateTime;
}
