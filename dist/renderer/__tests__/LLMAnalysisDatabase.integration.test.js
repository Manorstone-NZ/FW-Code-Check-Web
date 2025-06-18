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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const React = __importStar(require("react"));
const react_1 = require("@testing-library/react");
const react_router_dom_1 = require("react-router-dom");
const AnalysisPage_1 = __importDefault(require("../pages/AnalysisPage"));
// Mock the analysisApi to simulate backend/database
jest.mock('../utils/analysisApi', () => {
    const actual = jest.requireActual('../utils/analysisApi');
    return Object.assign(Object.assign({}, actual), { useAnalyses: () => ({
            analyses: [
                {
                    id: 1,
                    fileName: 'llmtest.l5x',
                    date: '2025-06-12',
                    status: 'complete',
                    analysis_json: {
                        llm_results: '1. EXECUTIVE SUMMARY\nThis is a test summary from LLM.',
                        instruction_analysis: [
                            { instruction: 'MOV A, B', insight: 'Moves value', risk_level: 'Low' },
                            { instruction: 'ALARM_OFF', insight: 'Disables alarm', risk_level: 'High' }
                        ],
                        vulnerabilities: [],
                        recommendations: [],
                        report: { category: {} }
                    }
                }
            ],
            loading: false,
            error: null,
            refresh: jest.fn()
        }), getAnalysisById: (id) => __awaiter(void 0, void 0, void 0, function* () {
            return ({
                id,
                fileName: 'llmtest.l5x',
                date: '2025-06-12',
                status: 'complete',
                analysis_json: {
                    llm_results: '1. EXECUTIVE SUMMARY\nThis is a test summary from LLM.',
                    instruction_analysis: [
                        { instruction: 'MOV A, B', insight: 'Moves value', risk_level: 'Low' },
                        { instruction: 'ALARM_OFF', insight: 'Disables alarm', risk_level: 'High' }
                    ],
                    vulnerabilities: [],
                    recommendations: [],
                    report: { category: {} }
                }
            });
        }) });
});
describe('LLM Analysis Database Integration', () => {
    it('writes and recalls LLM response for an analysis', () => __awaiter(void 0, void 0, void 0, function* () {
        (0, react_1.render)(React.createElement(react_router_dom_1.MemoryRouter, null,
            React.createElement(AnalysisPage_1.default, null)));
        // Find and click the View button for the analysis
        const viewBtn = react_1.screen.getAllByRole('button', { name: /view/i })[0];
        react_1.fireEvent.click(viewBtn);
        // Wait for the details to appear
        yield (0, react_1.waitFor)(() => {
            // LLM Results should be visible in the details
            expect(react_1.screen.getByText(/executive summary/i)).toBeInTheDocument();
            expect(react_1.screen.getByText(/test summary from llm/i)).toBeInTheDocument();
        });
    }));
});
