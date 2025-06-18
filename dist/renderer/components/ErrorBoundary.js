"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const debugLog_1 = require("../utils/debugLog");
class ErrorBoundary extends react_1.default.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error, errorInfo: null };
    }
    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        (0, debugLog_1.debugLog)('RENDER_ERROR', {
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
        });
    }
    render() {
        var _a, _b;
        if (this.state.hasError) {
            return (react_1.default.createElement("div", { style: { color: 'red', padding: 16 } },
                react_1.default.createElement("h2", null, "Something went wrong."),
                react_1.default.createElement("pre", null, (_a = this.state.error) === null || _a === void 0 ? void 0 : _a.toString()),
                react_1.default.createElement("details", { style: { whiteSpace: 'pre-wrap' } }, (_b = this.state.errorInfo) === null || _b === void 0 ? void 0 : _b.componentStack)));
        }
        return this.props.children;
    }
}
exports.default = ErrorBoundary;
