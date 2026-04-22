"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
// Authentication middleware: validates JWT token and attaches user to request
const authMiddleware = async (req, res, next) => {
    let token;
    // Extract token from Authorization header (Bearer scheme)
    if (req.headers.authorization
        && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    // Fallback: extract token from cookies (jwt or token)
    else if (req.cookies?.jwt || req.cookies?.token) {
        console.log("Auth middleware reached 2");
        token = req.cookies.jwt || req.cookies.token;
    }
    // Reject if no token is present
    if (!token) {
        return res.status(401).json({ error: "Not authorized, no token provided" });
    }
    try {
        // Verify token and extract the user ID
        const decoded = jsonwebtoken_1.default.verify(token, process.env.SERVER_KEY);
        console.log("Decoded token:", decoded);
        // Extract user ID (supports both string and object decoded formats)
        const userId = typeof decoded === 'string' ? decoded : decoded.id;
        // Fetch the user from database
        const user = await prisma_1.prisma.student.findUnique({
            where: { id: userId },
        });
        // Reject if user no longer exists in database
        if (!user) {
            return res.status(401).json({ error: "User no longer exists" });
        }
        // Attach user to request object for downstream controllers
        req.user = user;
        next(); // Proceed to next middleware/controller
    }
    catch (err) {
        console.error("Auth middleware error:", err);
        return res.status(401).json({ error: "Not authorized, token failed" });
    }
};
exports.authMiddleware = authMiddleware;
