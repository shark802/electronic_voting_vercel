export function createVoterReportTitle(
    voteStatus: number,
    department?: string,
    program?: string,
    yearLevel?: string,
    section?: string
): string {
    // Base title by vote status
    let baseTitle = "";
    if (voteStatus === 0) {
        baseTitle = "Non-Voting Students Report";
    } else if (voteStatus === 1) {
        baseTitle = "Voting Students Report";
    } else {
        baseTitle = "Student Voting Status Report";
    }

    // Build filter description
    const filters: string[] = [];

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