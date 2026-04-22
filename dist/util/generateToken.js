"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generator = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Generate JWT token and set it as an HTTP-only cookie
const generator = (studentId, res) => {
    const payload = { id: studentId };
    const token = jsonwebtoken_1.default.sign(payload, process.env.SERVER_KEY);
    // Set token in cookie for automatic inclusion in subsequent requests
    res.cookie('token', token, {
        httpOnly: true, // Prevents client-side JavaScript access (XSS protection)
        secure: false, // Set to true in production with HTTPS
        sameSite: 'lax' // CSRF protection
    });
    return token;
};
exports.generator = generator;
