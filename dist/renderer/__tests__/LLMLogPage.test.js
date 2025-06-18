"use strict";
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
const react_1 = __importDefault(require("react"));
const react_2 = require("@testing-library/react");
const LLMLogPage_1 = __importDefault(require("../pages/LLMLogPage"));
// Mock window.electron.invoke
beforeAll(() => {
    // @ts-ignore
    window.electron = { invoke: jest.fn() };
});
afterEach(() => {
    // @ts-ignore
    window.electron.invoke.mockReset();
});
describe('LLMLogPage', () => {
    it('renders single-line summaries and expands to show details', () => __awaiter(void 0, void 0, void 0, function* () {
        // @ts-ignore
        window.electron.invoke.mockResolvedValue([
            { id: 1, timestamp: '2025-06-05T12:00:00Z', prompt: 'Prompt1', result: 'Result1', success: true },
            { id: 2, timestamp: '2025-06-05T12:01:00Z', prompt: 'Prompt2', result: { error: 'fail' }, success: false }
        ]);
        yield (0, react_2.act)(() => __awaiter(void 0, void 0, void 0, function* () {
            (0, react_2.render)(react_1.default.createElement(LLMLogPage_1.default, null));
        }));
        expect(react_2.screen.getByText(/LLM Interaction Log/i)).toBeInTheDocument();
        expect(react_2.screen.getByText('Result1')).toBeInTheDocument(); // summary
        expect(react_2.screen.getByText('fail')).toBeInTheDocument(); // summary
        // Expand first
        yield (0, react_2.act)(() => __awaiter(void 0, void 0, void 0, function* () {
            react_2.screen.getAllByText('View')[0].click();
        }));
        expect(react_2.screen.getByText(/Prompt1/)).toBeInTheDocument();
        // Use getAllByText for Result1 since it appears in both summary and details
        expect(react_2.screen.getAllByText(/Result1/).length).toBeGreaterThan(1);
        // Collapse
        yield (0, react_2.act)(() => __awaiter(void 0, void 0, void 0, function* () {
            react_2.screen.getAllByText('Hide')[0].click();
        }));
        expect(react_2.screen.queryByText(/Prompt1/)).not.toBeInTheDocument();
        expect(react_2.screen.queryAllByText(/Result1/)[0]).toBeInTheDocument();
    }));
    it('shows error if log fetch fails', () => __awaiter(void 0, void 0, void 0, function* () {
        // @ts-ignore
        window.electron.invoke.mockRejectedValue(new Error('fail to load'));
        yield (0, react_2.act)(() => __awaiter(void 0, void 0, void 0, function* () {
            (0, react_2.render)(react_1.default.createElement(LLMLogPage_1.default, null));
        }));
        yield (0, react_2.waitFor)(() => expect(react_2.screen.getByText(/fail to load/i)).toBeInTheDocument());
    }));
    it('shows empty state if no logs', () => __awaiter(void 0, void 0, void 0, function* () {
        // @ts-ignore
        window.electron.invoke.mockResolvedValue([]);
        yield (0, react_2.act)(() => __awaiter(void 0, void 0, void 0, function* () {
            (0, react_2.render)(react_1.default.createElement(LLMLogPage_1.default, null));
        }));
        yield (0, react_2.waitFor)(() => expect(react_2.screen.getByText(/No LLM interactions logged yet/i)).toBeInTheDocument());
    }));
});
