"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const React = __importStar(require("react"));
const react_1 = require("@testing-library/react");
const FileUploader_1 = __importDefault(require("../components/FileUploader"));
const AnalysisDetails_1 = __importDefault(require("../components/AnalysisDetails"));
describe('FileUploader', () => {
    it('renders upload UI', () => {
        (0, react_1.render)(React.createElement(FileUploader_1.default, null));
        expect(react_1.screen.getByText('Upload PLC Files')).toBeInTheDocument();
        expect(react_1.screen.getByText(/Drag and drop/)).toBeInTheDocument();
    });
    it('renders analysis details with all structured LLM sections and subfields', () => {
        // Simulate a result as would be returned from backend
        const mockResult = {
            llm_results: `1. EXECUTIVE SUMMARY\nThis is a summary.\n\n2. CYBER SECURITY KEY FINDINGS\n- **Title**: Logic Bomb\n- **Location**: FC540, NW10\n- **Step-by-Step Breakdown**: Triggers after 100 hours.\n- **Risk Level**: Critical\n- **Impact**: Plant shutdown.\n- **Suggested Mitigation**: Remove logic.\n\n3. GENERAL STRUCTURE OBSERVATIONS\nBlock uses FCs, DBs, and memory markers.\n\n4. IMPLICATIONS AND RECOMMENDATIONS\n| Risk | Description | Recommendation |\n|------|-------------|----------------|\n| Logic Bomb | Triggers after 100h | Remove logic, audit all FCs |\n\n5. NEXT STEPS\nAudit all FCs, review change logs.\n\n6. INSTRUCTION-LEVEL ANALYSIS (REQUIRED)\ninstruction_analysis: [ { "instruction": "A M20.0", "insight": "Checks memory marker", "risk_level": "Medium" } ]`,
            vulnerabilities: [],
            recommendations: [],
            instruction_analysis: [
                { instruction: 'A M20.0', insight: 'Checks memory marker', risk_level: 'Medium' }
            ]
        };
        (0, react_1.render)(React.createElement(AnalysisDetails_1.default, { analysis: {
                fileName: 'test.l5x',
                status: 'complete',
                date: '2025-06-05',
                analysis_json: mockResult
            } }));
        // Should render the exact required section headings
        expect(react_1.screen.getByText('EXECUTIVE SUMMARY')).toBeInTheDocument();
        expect(react_1.screen.getByText('CYBER SECURITY KEY FINDINGS')).toBeInTheDocument();
        expect(react_1.screen.getByText('GENERAL STRUCTURE OBSERVATIONS')).toBeInTheDocument();
        expect(react_1.screen.getByText('IMPLICATIONS AND RECOMMENDATIONS')).toBeInTheDocument();
        expect(react_1.screen.getByText('NEXT STEPS')).toBeInTheDocument();
        expect(react_1.screen.getByText('Instruction-level Security Analysis')).toBeInTheDocument();
        expect(react_1.screen.getByText('A M20.0')).toBeInTheDocument();
        expect(react_1.screen.getByText('Checks memory marker')).toBeInTheDocument();
        expect(react_1.screen.getByText('Medium')).toBeInTheDocument();
    });
    it('renders instruction-level analysis section if present', () => {
        const mockResult = {
            llm_results: 'SUMMARY\nThis is a summary.',
            vulnerabilities: [],
            recommendations: [],
            instruction_analysis: [
                { instruction: 'MOV A, B', insight: 'Moves value, no risk', risk_level: 'Low' }
            ]
        };
        (0, react_1.render)(React.createElement(AnalysisDetails_1.default, { analysis: {
                fileName: 'test.l5x',
                status: 'complete',
                date: '2025-06-05',
                analysis_json: mockResult
            } }));
        expect(react_1.screen.getByText('Instruction-level Security Analysis')).toBeInTheDocument();
        expect(react_1.screen.getByText('MOV A, B')).toBeInTheDocument();
        expect(react_1.screen.getByText('Moves value, no risk')).toBeInTheDocument();
        expect(react_1.screen.getByText('Low')).toBeInTheDocument();
    });
    it('renders instruction-level analysis section even if empty', () => {
        const mockResult = {
            llm_results: 'SUMMARY\nThis is a summary.',
            vulnerabilities: [],
            recommendations: [],
            instruction_analysis: []
        };
        (0, react_1.render)(React.createElement(AnalysisDetails_1.default, { analysis: {
                fileName: 'test.l5x',
                status: 'complete',
                date: '2025-06-05',
                analysis_json: mockResult
            } }));
        expect(react_1.screen.getByText('Instruction-level Security Analysis')).toBeInTheDocument();
        expect(react_1.screen.getByText('No instruction-level analysis available.')).toBeInTheDocument();
    });
});
