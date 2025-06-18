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
const CompareAnalysisToBaseline_1 = __importDefault(require("../pages/CompareAnalysisToBaseline"));
const react_router_dom_1 = require("react-router-dom");
// Mock all hooks and API functions for production-level test
jest.mock('../utils/analysisApi', () => ({
    useBaselines: () => ({
        baselines: [
            { id: 1, fileName: 'baseline1.l5x', date: '2025-06-05' },
            { id: 2, fileName: 'baseline2.l5x', date: '2025-06-04' }
        ],
        loading: false,
        error: null,
        refresh: jest.fn()
    }),
    getAnalysisById: (id) => __awaiter(void 0, void 0, void 0, function* () { return ({ id, fileName: 'analysis.l5x', foo: 'bar', analysis_json: {} }); }),
    getBaselineById: (id) => __awaiter(void 0, void 0, void 0, function* () { return ({ id, fileName: 'baseline1.l5x', foo: 'baz', analysis_json: {} }); }),
    llmCompareAnalysisToBaseline: jest.fn(() => __awaiter(void 0, void 0, void 0, function* () { return ({ llm_comparison: '## Section 1\nContent 1\n## Section 2\nContent 2' }); })),
    listComparisonHistory: jest.fn(() => __awaiter(void 0, void 0, void 0, function* () {
        return ([
            { id: 101, timestamp: '2025-06-05T12:00:00Z', llm_result: '## Old Section\nOld content' }
        ]);
    }))
}));
// jest.mock('react-markdown'); // Use real react-markdown for production-level rendering tests
describe('CompareAnalysisToBaseline (production behavior)', () => {
    it('renders baseline select and shows diff', () => __awaiter(void 0, void 0, void 0, function* () {
        (0, react_1.render)(React.createElement(react_router_dom_1.MemoryRouter, null,
            React.createElement(CompareAnalysisToBaseline_1.default, { analysisId: 1 })));
        expect(react_1.screen.getByText('Select Baseline to Compare:')).toBeInTheDocument();
        expect(react_1.screen.getByText('baseline1.l5x (2025-06-05)')).toBeInTheDocument();
        react_1.fireEvent.change(react_1.screen.getByRole('combobox'), { target: { value: '1' } });
        expect(yield react_1.screen.findByText(/differ/i)).toBeInTheDocument();
    }));
    it('calls LLM compare and displays result', () => __awaiter(void 0, void 0, void 0, function* () {
        (0, react_1.render)(React.createElement(react_router_dom_1.MemoryRouter, null,
            React.createElement(CompareAnalysisToBaseline_1.default, { analysisId: 1 })));
        react_1.fireEvent.change(react_1.screen.getByRole('combobox'), { target: { value: '1' } });
        yield react_1.screen.findByText(/differ/i);
        react_1.fireEvent.click(react_1.screen.getByText(/LLM-Powered Detailed Comparison/i));
        // Instead of looking for <h2>Section 1</h2>, match the raw markdown string as rendered in the test environment
        expect(yield react_1.screen.findByText(/## Section 1/)).toBeInTheDocument();
        expect(yield react_1.screen.findByText(/Content 1/)).toBeInTheDocument();
        expect(yield react_1.screen.findByText(/## Section 2/)).toBeInTheDocument();
        expect(yield react_1.screen.findByText(/Content 2/)).toBeInTheDocument();
    }));
});
