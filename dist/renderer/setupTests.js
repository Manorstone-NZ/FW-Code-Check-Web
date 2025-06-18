"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@testing-library/jest-dom");
// Polyfill for TextEncoder for React Router/Jest
const util_1 = require("util");
if (global.TextEncoder === undefined) {
    global.TextEncoder = util_1.TextEncoder;
}
