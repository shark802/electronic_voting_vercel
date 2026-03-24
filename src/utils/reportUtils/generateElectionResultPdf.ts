import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CandidateVoteTally } from "../types/CandidatesVoteTally";
import { Election } from "../types/Election";
import { ProgramPopulations } from "../types/ProgramPopulations";
import fs from "fs";
import path from "path";

type GeneratePdfParams = {
    candidatesVoteTally: CandidateVoteTally[];
    election: Election;
    positionArray: string[];
    departmentArray: string[];
    programPopulation: ProgramPopulations[];
    certificationDetails?: {
        preparedBy: {
            name: string;
            position: string;
        }[];
        notedBy: Array<{
            name: string;
            position: string;
        }>;
        sasoChairperson: {
            name: string;
            position: string;
        };
        approvedBy: {
            name: string;
            position: string;
        }[];
    };
};

/**
 * Renders the document header
 */
async function renderHeader(pdf: jsPDF, pageWidth: number, electionName: string): Promise<number> {
    // Load images using fs
    const leftImagePath = path.join(process.cwd(), 'public', 'img', 'bcc-logo.png');
    const rightImagePath = path.join(process.cwd(), 'public', 'img', 'bago-city-collge-SSG.jpg');

    const leftImageData = new Uint8Array(fs.readFileSync(leftImagePath));
    const rightImageData = new Uint8Array(fs.readFileSync(rightImagePath));

    // Calculate image dimensions (maintaining aspect ratio)
    const maxHeight = 20;
    const leftImageWidth = 25; // Fixed width for left image
    const rightImageWidth = 25; // Fixed width for right image

    // Add left image
    pdf.addImage(leftImageData, 'JPEG', 20, 8, leftImageWidth, maxHeight);

    // Add right image
    pdf.addImage(rightImageData, 'JPEG', pageWidth - rightImageWidth - 20, 8, rightImageWidth, maxHeight);

    // School name
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    const schoolName = "BAGO CITY COLLEGE";
    const schoolNameWidth = pdf.getTextWidth(schoolName);
    pdf.text(schoolName, (pageWidth - schoolNameWidth) / 2, 13);

    // SSG text
    pdf.setFontSize(12);
    const ssgText = "SUPREME STUDENT GOVERNMENT";
    const ssgTextWidth = pdf.getTextWidth(ssgText);
    pdf.text(ssgText, (pageWidth - ssgTextWidth) / 2, 18);

    // Election name
    pdf.setFontSize(11);
    const electionNameWidth = pdf.getTextWidth(electionName);
    pdf.text(electionName, (pageWidth - electionNameWidth) / 2, 25);

    // Generation timestamp
    const dateTimeString = `Generated on: ${new Date().toLocaleString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    } as Intl.DateTimeFormatOptions)}`;

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(100);
    const dateTimeWidth = pdf.getTextWidth(dateTimeString);
    pdf.text(dateTimeString, (pageWidth - dateTimeWidth) / 2, 28);

    // Add a line below the header
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.3);
    pdf.line(15, 32, pageWidth - 15, 32);

    pdf.setTextColor(0);
    return 38;
}

/**
 * Generates a formal election results PDF document
 * @param params - Configuration parameters for the PDF generation
 * @returns Promise with PDF buffer
 */
export async function generateElectionResultPdf({
    candidatesVoteTally,
    election,
    positionArray,
    departmentArray,
    programPopulation,
    certificationDetails
}: GeneratePdfParams): Promise<Buffer> {
    // Initialize PDF document
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const { width: pageWidth, height: pageHeight } = pdf.internal.pageSize;
    const margin = 15;
    let yPosition = margin;

    // Add header with title and date (only on first page)
    yPosition = await renderHeader(pdf, pageWidth, election.election_name) + 8;

    // Process each position
    for (const position of positionArray) {
        const candidatesForPosition = candidatesVoteTally.filter(
            (candidate) => candidate.position === position
        );

        if (!candidatesForPosition.length) continue;

        // Check if we need a new page
        if (yPosition > pageHeight - 60) {
            pdf.addPage();
            yPosition = margin + 10; // Start from margin without header
        }

        // Add position header
        yPosition = renderPositionHeader(pdf, position, margin + 2, yPosition) + 6;

        // Render either by department (for senators) or directly
        if (position === "SENATOR") {
            yPosition = await renderSenatorsByDepartment(
                pdf,
                candidatesForPosition,
                departmentArray,
                election.election_name,
                programPopulation,
                position,
                margin + 2,
                yPosition,
                pageHeight
            );
        } else {
            yPosition = renderCandidatesTable(
                pdf,
                candidatesForPosition,
                election.total_populations,
                margin,
                yPosition
            ) + 10;
        }
    }

    // Add signatures section with header
    yPosition = await renderSignatures(pdf, pageWidth, pageHeight, yPosition, certificationDetails, election.election_name);

    // Add footer with page numbers
    addFooters(pdf, pageWidth, pageHeight);

    // Return PDF buffer
    return Buffer.from(pdf.output("arraybuffer"));
}

/**
 * Renders the position header
 */
function renderPositionHeader(pdf: jsPDF, position: string, margin: number, yPosition: number): number {
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text(formatPositionName(position).toUpperCase(), margin, yPosition);
    return yPosition;
}

/**
 * Renders senators grouped by department
 */
async function renderSenatorsByDepartment(
    pdf: jsPDF,
    candidatesForPosition: CandidateVoteTally[],
    departmentArray: string[],
    electionName: string,
    programPopulation: ProgramPopulations[],
    position: string,
    margin: number,
    yPosition: number,
    pageHeight: number
): Promise<number> {
    for (const department of departmentArray) {
        const candidatesForDepartment = candidatesForPosition.filter(
            (candidate) => candidate.department_name === department
        );

        if (!candidatesForDepartment.length) continue;

        // Check if we need a new page
        if (yPosition > pageHeight - 60) {
            pdf.addPage();
            yPosition = margin + 10; // Start from margin without header

            pdf.setFontSize(14);
            pdf.setFont("helvetica", "bold");
            pdf.text(`${formatPositionName(position)} (continued)`, margin, yPosition);
            yPosition += 10;
        }

        // Add department header
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "italic");
        pdf.text(`Department: ${department}`, margin + 2, yPosition);
        yPosition += 3;

        const departmentPopulation = programPopulation.find((dept) => dept.program_code === department)

        // Render table for this department
        yPosition = renderCandidatesTable(
            pdf,
            candidatesForDepartment,
            departmentPopulation?.program_population || 0,
            margin,
            yPosition
        ) + 10;
    }

    return yPosition;
}

/**
 * Renders the candidates table
 */
function renderCandidatesTable(
    pdf: jsPDF,
    candidates: CandidateVoteTally[],
    population: number,
    margin: number,
    yPosition: number
): number {
    // Sort candidates by vote count (descending)
    const sortedCandidates = [...candidates].sort((a, b) => b.vote_count - a.vote_count);

    // Prepare table data
    const tableData = sortedCandidates.map((candidate, index) => [
        index + 1, // Rank
        `${candidate.firstname} ${candidate.lastname}`,
        candidate.party || '-',
        candidate.course || '-',
        candidate.vote_count,
        calculatePercentage(candidate.vote_count, population)
    ]);

    // Skip if no data
    if (!tableData.length) return yPosition;

    // Render table
    autoTable(pdf, {
        startY: yPosition,
        head: [["Rank", "Name", "Partylist", "Course", "Vote Count", "Percentage"]],
        body: tableData,
        margin: { left: margin + 2, right: margin + 2 },
        styles: { fontSize: 10, cellPadding: 2 },
        headStyles: {
            fillColor: [51, 108, 232],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        columnStyles: {
            0: { cellWidth: 15 },
            4: { halign: 'center' },
            5: { halign: 'center' }
        }
    });

    return (pdf as any).lastAutoTable.finalY;
}

/**
 * Renders signature section at the end of the document
 */
async function renderSignatures(
    pdf: jsPDF,
    pageWidth: number,
    pageHeight: number,
    yPosition: number,
    certificationDetails?: GeneratePdfParams['certificationDetails'],
    electionName?: string
): Promise<number> {
    // Add a new page for signatures
    pdf.addPage();

    // Add header to certification page with election name
    yPosition = await renderHeader(pdf, pageWidth, electionName || "OFFICIAL CERTIFICATION") + 10;

    // Add certification title
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("CERTIFICATION OF ELECTION RESULTS", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 20;

    // Default certification details if none provided
    const defaultDetails = {
        preparedBy: [{
            name: "Earl John Paildan",
            position: "BCC COMELEC Chairperson"
        }],
        notedBy: [
            {
                name: "Mr. Anthony S. Malabanan, MIT",
                position: "MAT-MATH BSIS Department Head"
            },
            {
                name: "Dr. Rosemarie Lagunday, Ed.D",
                position: "AB Department Head"
            },
            {
                name: "Mr. Alain S. Acuna",
                position: "Criminology Department Head"
            },
            {
                name: "Dr. Remedios E. Alvarez, PhD",
                position: "Education Department Head"
            },
            {
                name: "Ma. Lucille Del Castillo",
                position: "SASO Chairperson - Designate"
            }
        ],
        approvedBy: [{
            name: "Dr. Deborah Natalia E. Singson",
            position: "College President"
        }]
    };

    // Use provided details or defaults
    const details = certificationDetails || defaultDetails;

    // Calculate column widths and positions
    const leftColumnX = 20;
    const rightColumnX = pageWidth / 2 + 20;
    const signatureLineWidth = 60;
    const marginBottom = 30; // Reduced bottom margin
    const signatureHeight = 25; // Height needed for one signature

    // Helper function to check if we need a new page
    const checkNewPage = (requiredHeight: number) => {
        if (yPosition + requiredHeight > pageHeight - marginBottom) {
            pdf.addPage();
            yPosition = 20; // Reset position for new page
            return true;
        }
        return false;
    };

    // Helper function to render signatures in two columns
    const renderTwoColumnSignatures = (title: string, people: Array<{ name: string, position: string }>) => {
        if (!people || people.length === 0) return yPosition;

        // Check if we need a new page for the title
        checkNewPage(15);

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.text(`${title}:`, leftColumnX, yPosition);
        yPosition += 15;

        // Render in two columns
        for (let i = 0; i < people.length; i += 2) {
            // Check if we need a new page for the next signature pair
            if (checkNewPage(signatureHeight)) {
                // If we're starting a new page, we might want to repeat the title
                if (i > 0) {
                    pdf.setFont("helvetica", "normal");
                    pdf.text(`${title} (continued):`, leftColumnX, yPosition);
                    yPosition += 15;
                }
            }

            const currentY = yPosition;

            // Left column
            pdf.setDrawColor(0);
            pdf.setLineWidth(0.5);
            pdf.line(leftColumnX, currentY, leftColumnX + signatureLineWidth, currentY);
            yPosition += 5;

            pdf.setFont("helvetica", "normal");
            pdf.text(people[i].name, leftColumnX, yPosition);
            yPosition += 5;
            pdf.setFont("helvetica", "bold");
            pdf.text(people[i].position, leftColumnX, yPosition);

            // Right column (if exists)
            if (i + 1 < people.length) {
                yPosition = currentY;
                pdf.setDrawColor(0);
                pdf.setLineWidth(0.5);
                pdf.line(rightColumnX, currentY, rightColumnX + signatureLineWidth, currentY);
                yPosition += 5;

                pdf.setFont("helvetica", "normal");
                pdf.text(people[i + 1].name, rightColumnX, yPosition);
                yPosition += 5;
                pdf.setFont("helvetica", "bold");
                pdf.text(people[i + 1].position, rightColumnX, yPosition);
            }

            yPosition += 15;
        }
        yPosition += 10;
        return yPosition;
    };

    // Render all sections using the helper function
    yPosition = renderTwoColumnSignatures("Prepared By", details.preparedBy);
    yPosition = renderTwoColumnSignatures("Noted By", details.notedBy);
    yPosition = renderTwoColumnSignatures("Approved By", details.approvedBy);

    return yPosition;
}

/**
 * Adds footers to all pages
 */
function addFooters(pdf: jsPDF, pageWidth: number, pageHeight: number): void {
    const totalPages = pdf.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);

        // Draw footer line
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.3);
        pdf.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);

        // Add page number and footer text
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(8);
        pdf.setTextColor(100);
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
        pdf.text("Confidential - Official Election Results", 15, pageHeight - 10);
    }
}

/**
 * Formats position names from snake_case to Title Case
 */
function formatPositionName(position: string): string {
    return position
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Calculates percentage with 2 decimal places
 */
function calculatePercentage(votes: number, totalVotes: number): string {
    if (totalVotes === 0) return "0.00%";
    return `${(votes / totalVotes * 100).toFixed(2)}%`;
}
