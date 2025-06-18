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
const InstructionAnalysisTable_1 = __importDefault(require("../components/InstructionAnalysisTable"));
describe('InstructionAnalysisTable', () => {
    it('renders table headers and rows correctly', () => {
        const data = [
            { instruction: 'MOV A, B', insight: 'Moves value', risk_level: 'Low' },
            { instruction: 'ALARM_OFF', insight: 'Disables alarm', risk_level: 'High' },
            { instruction: 'NOP', insight: 'No operation', risk_level: 'Medium' },
        ];
        (0, react_1.render)(React.createElement(InstructionAnalysisTable_1.default, { data: data }));
        expect(react_1.screen.getByText('Instruction')).toBeInTheDocument();
        expect(react_1.screen.getByText('Insight')).toBeInTheDocument();
        expect(react_1.screen.getByText('Risk Level')).toBeInTheDocument();
        expect(react_1.screen.getByText('MOV A, B')).toBeInTheDocument();
        expect(react_1.screen.getByText('Moves value')).toBeInTheDocument();
        expect(react_1.screen.getByText('Low')).toBeInTheDocument();
        expect(react_1.screen.getByText('ALARM_OFF')).toBeInTheDocument();
        expect(react_1.screen.getByText('Disables alarm')).toBeInTheDocument();
        expect(react_1.screen.getByText('High')).toBeInTheDocument();
        expect(react_1.screen.getByText('NOP')).toBeInTheDocument();
        expect(react_1.screen.getByText('No operation')).toBeInTheDocument();
        expect(react_1.screen.getByText('Medium')).toBeInTheDocument();
    });
    it('renders empty state if no data', () => {
        (0, react_1.render)(React.createElement(InstructionAnalysisTable_1.default, { data: [] }));
        expect(react_1.screen.getByText(/Instruction/i)).toBeInTheDocument();
        // Should not render any rows
        expect(react_1.screen.queryByText('Low')).not.toBeInTheDocument();
        expect(react_1.screen.queryByText('High')).not.toBeInTheDocument();
        expect(react_1.screen.queryByText('Medium')).not.toBeInTheDocument();
    });
});
