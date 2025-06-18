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
const OTThreatIntelTable_1 = __importDefault(require("../components/OTThreatIntelTable"));
const OTThreatIntelFilterPanel_1 = __importDefault(require("../components/OTThreatIntelFilterPanel"));
const OTThreatIntelDetailsPanel_1 = __importDefault(require("../components/OTThreatIntelDetailsPanel"));
const analysisApi_1 = require("../utils/analysisApi");
const App_1 = require("../App");
const OTThreatIntelDashboard = () => {
    const [entries, setEntries] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [lastSync, setLastSync] = React.useState(null);
    const [selected, setSelected] = React.useState(null);
    const [filters, setFilters] = React.useState({});
    const { provider: llmProvider } = React.useContext(App_1.LLMProviderContext);
    // Fetch entries from DB on mount
    React.useEffect(() => {
        fetchEntries();
    }, []);
    const fetchEntries = () => __awaiter(void 0, void 0, void 0, function* () {
        setLoading(true);
        // @ts-ignore
        const data = yield window.electron.invoke('get-ot-threat-intel-entries');
        setEntries(data || []);
        // @ts-ignore
        const last = yield window.electron.invoke('get-ot-threat-intel-last-sync');
        setLastSync(last || null);
        setLoading(false);
    });
    const handleRefresh = () => __awaiter(void 0, void 0, void 0, function* () {
        setLoading(true);
        yield (0, analysisApi_1.syncOTThreatIntel)(llmProvider);
        yield fetchEntries();
    });
    const filteredEntries = React.useMemo(() => {
        // Filtering logic (by vendor, protocol, severity, system type, etc.)
        return entries.filter(e => {
            if (filters.vendor && !e.affected_vendors.includes(filters.vendor))
                return false;
            if (filters.protocol && !e.industrial_protocols.includes(filters.protocol))
                return false;
            if (filters.severity && e.severity !== filters.severity)
                return false;
            if (filters.system && !e.system_targets.includes(filters.system))
                return false;
            return true;
        });
    }, [entries, filters]);
    return (React.createElement("div", { className: "p-6 max-w-7xl mx-auto" },
        React.createElement("div", { className: "flex items-center justify-between mb-6" },
            React.createElement("h1", { className: "text-2xl font-bold text-blue-900" }, "OT Threat Intelligence Dashboard"),
            React.createElement("div", { className: "flex items-center gap-4" },
                React.createElement("button", { className: "px-4 py-2 bg-blue-700 text-white rounded shadow hover:bg-blue-800 text-sm disabled:opacity-50", onClick: handleRefresh, disabled: loading }, loading ? 'Syncing...' : 'Fetch Latest OT Threat Intel'),
                React.createElement("span", { className: "text-xs text-gray-500" },
                    "Last sync: ",
                    lastSync ? new Date(lastSync).toLocaleString() : 'Never'))),
        React.createElement(OTThreatIntelFilterPanel_1.default, { filters: filters, setFilters: setFilters, entries: entries }),
        React.createElement("div", { className: "mt-4 grid grid-cols-3 gap-6" },
            React.createElement("div", { className: "col-span-2" },
                React.createElement(OTThreatIntelTable_1.default, { entries: filteredEntries, onSelect: setSelected })),
            React.createElement("div", { className: "col-span-1" },
                React.createElement(OTThreatIntelDetailsPanel_1.default, { entry: selected, onCurationUpdate: (updated) => __awaiter(void 0, void 0, void 0, function* () {
                        // @ts-ignore
                        yield window.electron.invoke('update-ot-threat-intel-entry', updated);
                        setSelected(updated);
                        setEntries(entries => entries.map(e => e.id === updated.id ? updated : e));
                    }) }))),
        React.createElement("div", { className: "mt-6 flex gap-4" },
            React.createElement("button", { className: "px-4 py-2 bg-red-700 text-white rounded shadow hover:bg-red-800 text-sm disabled:opacity-50", onClick: () => __awaiter(void 0, void 0, void 0, function* () {
                    setLoading(true);
                    // @ts-ignore
                    yield window.electron.invoke('clear-ot-threat-intel');
                    yield fetchEntries();
                    setSelected(null);
                    setLoading(false);
                }), disabled: loading }, loading ? 'Clearing...' : 'Clear All'),
            React.createElement("button", { className: "px-4 py-2 bg-green-700 text-white rounded shadow hover:bg-green-800 text-sm disabled:opacity-50", onClick: () => __awaiter(void 0, void 0, void 0, function* () {
                    setLoading(true);
                    // @ts-ignore
                    yield window.electron.invoke('bulk-ot-threat-intel');
                    yield fetchEntries();
                    setLoading(false);
                }), disabled: loading }, loading ? 'Populating...' : 'Populate with LLM (10+ past year)'))));
};
exports.default = OTThreatIntelDashboard;
