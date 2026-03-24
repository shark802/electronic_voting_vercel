import { Election } from "./types/Election";

export function isValidTimeToVote(election: Election) {
    const PRESENT_DATE_TIME = new Date();
    const startDateAndTime = dateFormatter(election.date_start, election.time_start);
    const endDateAndTime = dateFormatter(election.date_end, election.time_end);

    if (PRESENT_DATE_TIME >= startDateAndTime && PRESENT_DATE_TIME < endDateAndTime) return true;

    return false;
}

function dateFormatter(date: string, time: string) {
    let dateToFormat = new Date(date);
    const [hour, minute] = time.split(":").map(Number)
    dateToFormat.setHours(hour, minute);
    return dateToFormat;
} 