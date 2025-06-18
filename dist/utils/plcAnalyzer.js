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
exports.analyzeTXTFile = exports.analyzeL5XFile = void 0;
const fs_1 = __importDefault(require("fs"));
const xml2js_1 = __importDefault(require("xml2js"));
const analyzeL5XFile = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    const fileContent = yield fs_1.default.promises.readFile(filePath, 'utf-8');
    const parser = new xml2js_1.default.Parser();
    const result = yield parser.parseStringPromise(fileContent);
    const securityRisks = [];
    // Perform analysis on the parsed XML data
    // Example: Check for insecure configurations
    if (result['project']['security'][0]['insecure'][0] === 'true') {
        securityRisks.push('Insecure configuration detected.');
    }
    return {
        fileName: filePath,
        securityRisks,
        analysisResults: result,
    };
});
exports.analyzeL5XFile = analyzeL5XFile;
const analyzeTXTFile = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    const fileContent = yield fs_1.default.promises.readFile(filePath, 'utf-8');
    const securityRisks = [];
    // Perform analysis on the TXT file content
    // Example: Check for hardcoded passwords
    if (fileContent.includes('password=')) {
        securityRisks.push('Hardcoded password detected.');
    }
    return {
        fileName: filePath,
        securityRisks,
        analysisResults: null,
    };
});
exports.analyzeTXTFile = analyzeTXTFile;
