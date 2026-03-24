import jsPDF from "jspdf";
import 'jspdf-autotable';
import { User } from "../types/User";
import autoTable, { RowInput } from "jspdf-autotable";
import fs from "fs";
import path from "path";

/**
 * Renders the document header
 */
async function renderHeader(pdf: jsPDF, pageWidth: number, title: string): Promise<number> {
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

    // Title
    pdf.setFontSize(11);
    const titleWidth = pdf.getTextWidth(title);
    pdf.text(title, (pageWidth - titleWidth) / 2, 25);

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

export async function genereateTablePdf(users: Partial<User>[], reportTitle: string, electionName: string) {
    // Create a new instance of jsPDF
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    let yPosition = margin;

    // Add header
    yPosition = await renderHeader(pdf, pageWidth, electionName) + 8;

    // Add report title (subtitle)
    pdf.setFontSize(14);
    pdf.setFont("helvetica", 'normal');
    const reportTitleWidth = pdf.getTextWidth(reportTitle);
    pdf.text(reportTitle, (pageWidth - reportTitleWidth) / 2, yPosition);
    yPosition += 8;

    // Set the start position for the table
    const startY = yPosition;

    // Prepare table data - ensure it's properly typed
    const tableBody: RowInput[] = users.map((user, index) => [
        (index + 1).toString(),
        user.id_number || '',
        `${user.lastname || ''}, ${user.firstname || ''}`,
        `${user.course || ''} ${user.year_level || ''} - ${user.section || ''}`
    ]);

    // Use type assertion for pdf
    autoTable(pdf, {
        head: [['#', 'User ID', 'Full Name', 'Course/Year/Section']], // Table headers
        body: tableBody,  // Table rows data
        startY: startY, // Start position for the table
        margin: { left: margin, right: margin },
        styles: {
            fontSize: 9,
            cellPadding: 3,
            lineColor: [220, 220, 220],
            lineWidth: 0.1,
            font: "helvetica",
            textColor: [50, 50, 50]
        },
        headStyles: {
            fillColor: [51, 108, 232],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 10,
            cellPadding: 4
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        },
        theme: 'grid', // Adds borders to all cells
        didDrawPage: function () {
            // Footer - Page number
            const pageInfo = (pdf.internal as any).getCurrentPageInfo();
            const pageText = `Page ${pageInfo.pageNumber}`;

            pdf.setFontSize(10);
            pdf.text(pageText, pdf.internal.pageSize.getWidth() - 30, pdf.internal.pageSize.getHeight() - 10);
        }
    });

    // Generate PDF as a Buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

    return pdfBuffer;
}