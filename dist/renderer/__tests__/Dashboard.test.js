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
const react_router_dom_1 = require("react-router-dom");
const Dashboard_1 = __importDefault(require("../pages/Dashboard"));
jest.mock('../utils/analysisApi', () => ({
    useAnalyses: () => ({
        analyses: [
            {
                id: 1,
                fileName: 'test.l5x',
                date: '2025-06-05',
                status: 'complete',
                analysis_json: {
                    vulnerabilities: ['Vuln1', 'Vuln2'],
                    instruction_analysis: [
                        { instruction: 'MOV', insight: 'Moves value', risk_level: 'Low' },
                        { instruction: 'ALARM_OFF', insight: 'Disables alarm', risk_level: 'High' },
                        { instruction: 'NOP', insight: 'No operation', risk_level: 'Medium' }
                    ]
                }
            }
        ],
        loading: false,
        error: null
    }),
    useBaselines: () => ({ baselines: [{ id: 1, fileName: 'baseline.l5x', date: '2025-06-01', originalName: 'baseline.l5x' }], loading: false, error: null })
}));
describe('Dashboard', () => {
    it('renders metrics and buttons with correct styles', () => {
        (0, react_1.render)(React.createElement(react_router_dom_1.MemoryRouter, null,
            React.createElement(Dashboard_1.default, null)));
        // Metrics (use getAllByText for repeated labels)
        expect(react_1.screen.getAllByText('Analyses').length).toBeGreaterThan(0);
        expect(react_1.screen.getAllByText('Baselines').length).toBeGreaterThan(0);
        expect(react_1.screen.getAllByText('Vulnerabilities').length).toBeGreaterThan(0);
        expect(react_1.screen.getAllByText('Risks').length).toBeGreaterThan(0);
        // Chart values (use getAllByText for repeated numbers)
        expect(react_1.screen.getAllByText('1').length).toBeGreaterThan(1); // Analyses & Baselines
        expect(react_1.screen.getAllByText('2').length).toBeGreaterThan(1); // Vulnerabilities & Risks (High + Medium)
        // Main action buttons
        const uploadBtn = react_1.screen.getByRole('button', { name: /upload new file/i });
        expect(uploadBtn).toHaveClass('h-10', 'min-w-[130px]', 'px-6', 'py-2', 'rounded-lg', 'font-semibold', 'flex', 'items-center', 'justify-center');
        const baselineBtn = react_1.screen.getByRole('button', { name: /manage baselines/i });
        expect(baselineBtn).toHaveClass('h-10', 'min-w-[130px]', 'px-6', 'py-2', 'rounded-lg', 'font-semibold', 'flex', 'items-center', 'justify-center');
        const compareBtn = react_1.screen.getByRole('button', { name: /compare files/i });
        expect(compareBtn).toHaveClass('h-10', 'min-w-[130px]', 'px-6', 'py-2', 'rounded-lg', 'font-semibold', 'flex', 'items-center', 'justify-center');
        const llmlogBtn = react_1.screen.getByRole('button', { name: /llm log/i });
        expect(llmlogBtn).toHaveClass('h-10', 'min-w-[130px]', 'px-6', 'py-2', 'rounded-lg', 'font-semibold', 'flex', 'items-center', 'justify-center');
    });
});
