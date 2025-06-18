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
const Sidebar_1 = __importDefault(require("../components/Sidebar"));
const react_router_dom_1 = require("react-router-dom");
describe('Sidebar', () => {
    beforeEach(() => {
        // @ts-ignore
        window.electron = { invoke: jest.fn() };
    });
    it('renders the First Watch logo', () => {
        (0, react_1.render)(React.createElement(react_router_dom_1.MemoryRouter, null,
            React.createElement(Sidebar_1.default, null)));
        expect(react_1.screen.getByAltText('First Watch Logo')).toBeInTheDocument();
    });
    it('highlights the active nav item', () => {
        (0, react_1.render)(React.createElement(react_router_dom_1.MemoryRouter, { initialEntries: ['/baselines'] },
            React.createElement(Sidebar_1.default, null)));
        const baselines = react_1.screen.getByText('Baselines');
        expect(baselines.closest('a')).toHaveClass('bg-white');
    });
    it('shows LLM status indicator (online)', () => __awaiter(void 0, void 0, void 0, function* () {
        // @ts-ignore
        window.electron.invoke.mockResolvedValueOnce({ ok: true });
        (0, react_1.render)(React.createElement(react_router_dom_1.MemoryRouter, null,
            React.createElement(Sidebar_1.default, null)));
        expect(yield react_1.screen.findByText(/LLM: Online/i)).toBeInTheDocument();
    }));
    it('shows LLM status indicator (offline)', () => __awaiter(void 0, void 0, void 0, function* () {
        // @ts-ignore
        window.electron.invoke.mockResolvedValueOnce({ ok: false, error: 'No key' });
        (0, react_1.render)(React.createElement(react_router_dom_1.MemoryRouter, null,
            React.createElement(Sidebar_1.default, null)));
        expect(yield react_1.screen.findByText(/LLM: Offline/i)).toBeInTheDocument();
    }));
    it('renders Comparisons link', () => {
        (0, react_1.render)(React.createElement(react_router_dom_1.MemoryRouter, null,
            React.createElement(Sidebar_1.default, null)));
        expect(react_1.screen.getByText('Comparisons')).toBeInTheDocument();
    });
});
