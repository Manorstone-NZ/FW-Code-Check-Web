import fs from 'fs';
import xml2js from 'xml2js';

export interface PLCFileAnalysis {
    fileName: string;
    securityRisks: string[];
    analysisResults: any;
}

export const analyzeL5XFile = async (filePath: string): Promise<PLCFileAnalysis> => {
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(fileContent);

    const securityRisks: string[] = [];
    // Perform analysis on the parsed XML data
    // Example: Check for insecure configurations
    if (result['project']['security'][0]['insecure'][0] === 'true') {
        securityRisks.push('Insecure configuration detected.');
    }

    return {
        fileName: filePath,
        securityRisks,
        analysisResults: result,
    };
};

export const analyzeTXTFile = async (filePath: string): Promise<PLCFileAnalysis> => {
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    const securityRisks: string[] = [];

    // Perform analysis on the TXT file content
    // Example: Check for hardcoded passwords
    if (fileContent.includes('password=')) {
        securityRisks.push('Hardcoded password detected.');
    }

    return {
        fileName: filePath,
        securityRisks,
        analysisResults: null,
    };
};