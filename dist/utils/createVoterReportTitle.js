"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVoterReportTitle = void 0;
function createVoterReportTitle(voteStatus, department, program, yearLevel, section) {
    // Base title by vote status
    let baseTitle = "";
    if (voteStatus === 0) {
        baseTitle = "Non-Voting Students Report";
    }
    else if (voteStatus === 1) {
        baseTitle = "Voting Students Report";
    }
    else {
        baseTitle = "Student Voting Status Report";
    }
    // Build filter description
    const filters = [];
    if (department) {
        filters.push(department);
    }
    if (program) {
        filters.push(program);
    }
    if (yearLevel) {
        filters.push(`Year ${yearLevel}`);
    }
    if (section) {
        filters.push(`Section ${section}`);
    }
    // Combine into final title
    if (filters.length > 0) {
        return `${baseTitle}: ${filters.join(" | ")}`;
    }
    return baseTitle;
}
exports.createVoterReportTitle = createVoterReportTitle;
