"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.check_token = exports.logout = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const generateToken_1 = require("../util/generateToken");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Register a new student user
const register = async (req, res) => {
    const { firstName, lastName, email, password, phoneNumber, classLevel } = req.body;
    console.log(email);
    // Check if user already exists
    const user = await prisma_1.prisma.student.findUnique({
        where: { email: email },
    });
    if (user) {
        return res.json({
            error: "This email is already present in the system",
        });
    }
    // Hash password before storing
    const salt = await bcryptjs_1.default.genSalt(10);
    const hashedPassword = await bcryptjs_1.default.hash(password, salt);
    // Transaction: create student, generate token, and create welcome notification
    const { student, token } = await prisma_1.prisma.$transaction(async (trans) => {
        const student = await trans.student.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashedPassword,
                phoneNumber,
                classLevel,
            },
        });
        const token = (0, generateToken_1.generator)(student.id, res);
        // Create welcome notification for the new student
        await trans.notification.create({
            data: {
                message: "Welcome to Linko we are happy to have you here.",
                students: {
                    connect: [{ id: student.id }],
                },
                navigate: "profile",
            },
        });
        return { student, token };
    });
    res.json({
        status: "success",
        data: {
            name: firstName + " " + lastName,
            email,
            id: student.id,
        },
        token,
    });
};
exports.register = register;
// Login existing student user
const login = async (req, res) => {
    const { email, password } = req.body;
    // Find student by email
    const student = await prisma_1.prisma.student.findUnique({
        where: { email },
    });
    if (!student) {
        return res.json({ error: "Invalide email or password" });
    }
    // Verify password
    const compare = await bcryptjs_1.default.compare(password, student.password);
    if (!compare) {
        return res.json({ error: "Invalide email or password" });
    }
    // Generate and set auth token
    const token = (0, generateToken_1.generator)(student.id, res);
    res.json({
        status: "success",
        data: {
            name: student.firstName + " " + student.lastName,
            email,
            id: student.id,
        },
        token,
    });
};
exports.login = login;
// Logout student - clear auth cookie
const logout = async (req, res) => {
    res.cookie("token", "", {
        httpOnly: true,
        expires: new Date(0),
    });
    res.json({
        status: "success",
        message: "student logout successfully",
    });
};
exports.logout = logout;
// Verify JWT token validity
const check_token = (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({
                loggedIn: false,
                message: "this thing was here init",
            });
        }
        const decoder = jsonwebtoken_1.default.verify(token, process.env.SERVER_KEY);
        return res.json({ loggedIn: true, id: decoder });
    }
    catch (e) {
        console.log(e);
        return res.status(401).json({
            loggedIn: false,
            message: "what the fuck",
        });
    }
};
exports.check_token = check_token;
