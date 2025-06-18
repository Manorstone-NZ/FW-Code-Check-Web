"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const SectionCard = ({ title, children, highlight }) => (react_1.default.createElement("div", { className: `bg-white rounded-xl shadow-md p-6 border ${highlight ? 'border-[#D9534F]' : 'border-gray-100'} mb-4` },
    react_1.default.createElement("div", { className: `font-bold text-lg mb-2 ${highlight ? 'text-[#D9534F]' : 'text-[#232B3A]'}` }, title),
    react_1.default.createElement("div", { className: "text-gray-700 whitespace-pre-line text-base" }, children)));
exports.default = SectionCard;
