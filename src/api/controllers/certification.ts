import { Request, Response, NextFunction } from "express";
import fs from 'fs';
import path from 'path';

// Default certification structure
const DEFAULT_CERTIFICATION = {
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

// Function to create default JSON file
const createDefaultCertificationFile = (filePath: string): void => {
    try {
        if (!fs.existsSync(filePath)) {
            console.log('Creating default certification file');
            // Create directory if it doesn't exist
            const dirPath = path.dirname(filePath);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
            fs.writeFileSync(filePath, JSON.stringify(DEFAULT_CERTIFICATION, null, 2));
            console.log('Default certification file created successfully');
        }
    } catch (error) {
        console.error('Error creating default certification file:', error);
        throw error;
    }
};

// Function to get certification details
export async function getCertificationDetails(req: Request, res: Response, next: NextFunction) {
    try {
        const filePath = path.join(__dirname, './../../../public/docs/certification-details.json');

        // Create default file if it doesn't exist
        createDefaultCertificationFile(filePath);

        // Read the file
        const data = fs.readFileSync(filePath, 'utf8');
        const certificationDetails = JSON.parse(data);

        return res.status(200).json(certificationDetails);
    } catch (error) {
        console.error('Error reading certification details:', error);
        return res.status(500).json({ error: 'Failed to read certification details' });
    }
}

export async function updateCertificationDetails(req: Request, res: Response, next: NextFunction) {
    try {

        const { certificationDetails } = req.body;

        if (!certificationDetails) {
            console.log('Missing certification details');
            return res.status(400).json({ error: 'Certification details are required' });
        }

        // Create directory if it doesn't exist
        const dirPath = path.join(__dirname, './../../../public/docs');
        if (!fs.existsSync(dirPath)) {
            console.log('Creating docs directory');
            fs.mkdirSync(dirPath, { recursive: true });
        }

        // Save the updated details to a JSON file
        const filePath = path.join(dirPath, 'certification-details.json');
        console.log('Saving to file:', filePath);

        try {
            fs.writeFileSync(filePath, JSON.stringify(certificationDetails, null, 2));
            console.log('File saved successfully');
        } catch (writeError) {
            console.error('Error writing file:', writeError);
            return res.status(500).json({ error: 'Failed to write certification details to file' });
        }

        return res.status(200).json({
            message: "Certification details updated successfully"
        });

    } catch (error) {
        console.error('Error saving certification details:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
} 