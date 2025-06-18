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
jest.mock('../utils/analysisApi', () => ({
    useAnalyses: () => ({
        analyses: [
            { id: 1, fileName: 'test1.l5x', date: '2025-06-05', status: 'complete' },
            { id: 2, fileName: 'test2.l5x', date: '2025-06-04', status: 'complete' }
        ],
        loading: false,
        error: null,
        refresh: jest.fn()
    }),
    getAnalysisById: (id) => __awaiter(void 0, void 0, void 0, function* () { return ({ id, fileName: `test${id}.l5x`, date: '2025-06-05', status: 'complete' }); })
}));
describe('AnalysisPage', () => {
    it('renders analyses table', () => {
        (0, react_1.render)(React.createElement(react_router_dom_1.MemoryRouter, null,
            React.createElement(AnalysisPage_1.default, null)));
        expect(react_1.screen.getByText('Analysis')).toBeInTheDocument();
        expect(react_1.screen.getByText('test1.l5x')).toBeInTheDocument();
        expect(react_1.screen.getByText('test2.l5x')).toBeInTheDocument();
    });
    it('renders analyses table with action buttons', () => {
        (0, react_1.render)(React.createElement(react_router_dom_1.MemoryRouter, null,
            React.createElement(AnalysisPage_1.default, null)));
        expect(react_1.screen.getByText('Analysis')).toBeInTheDocument();
        expect(react_1.screen.getByText('test1.l5x')).toBeInTheDocument();
        expect(react_1.screen.getByText('test2.l5x')).toBeInTheDocument();
        // Check for action buttons using role and accessible name for reliability
        expect(react_1.screen.getAllByRole('button', { name: /view/i }).length).toBeGreaterThan(0);
        expect(react_1.screen.getAllByRole('button', { name: /delete/i }).length).toBeGreaterThan(0);
    });
    it('shows details when View is clicked', () => __awaiter(void 0, void 0, void 0, function* () {
        (0, react_1.render)(React.createElement(react_router_dom_1.MemoryRouter, null,
            React.createElement(AnalysisPage_1.default, null)));
        react_1.fireEvent.click(react_1.screen.getAllByRole('button', { name: /view/i })[0]);
        yield (0, react_1.waitFor)(() => expect(react_1.screen.getByText('Analysis Details')).toBeInTheDocument());
    }));
    it('renders analysis table without compare column', () => {
        (0, react_1.render)(React.createElement(react_router_dom_1.MemoryRouter, null,
            React.createElement(AnalysisPage_1.default, null)));
        expect(react_1.screen.getByText('ID')).toBeInTheDocument();
        expect(react_1.screen.getByText('File Name')).toBeInTheDocument();
        expect(react_1.screen.getByText('Date')).toBeInTheDocument();
        expect(react_1.screen.getByText('Status')).toBeInTheDocument();
        expect(react_1.screen.getByText('Actions')).toBeInTheDocument();
        expect(react_1.screen.queryByText('Compare')).not.toBeInTheDocument();
    });
});
