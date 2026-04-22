"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const authController_1 = require("../../controller/authController");
//import { prismaMock } from "../__mocks__/prisma";
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../../lib/prisma");
jest.mock('../../lib/prisma', () => {
    const { mockDeep } = require('jest-mock-extended');
    const prismaMock = mockDeep();
    return {
        prisma: prismaMock
    };
});
// Mock the generator function
jest.mock("../../util/generateToken", () => ({
    generator: jest.fn((id, res) => "fake-token"),
}));
const prismaMock = prisma_1.prisma;
describe("authController", () => {
    let req;
    let res;
    beforeEach(() => {
        req = {
            body: {},
            cookies: {},
        };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            cookie: jest.fn(),
        };
        jest.clearAllMocks();
    });
    describe("register", () => {
        it("should register a new user successfully", async () => {
            req.body = {
                firstName: "John",
                lastName: "Doe",
                email: "john@example.com",
                password: "password123",
                phoneNumber: "1234567890",
                classLevel: "Year 2",
            };
            prismaMock.student.findUnique.mockResolvedValue(null);
            bcryptjs_1.default.genSalt = jest.fn().mockResolvedValue("salt");
            bcryptjs_1.default.hash = jest.fn().mockResolvedValue("hashedPassword");
            const mockStudent = {
                id: "user-123",
                firstName: "John",
                lastName: "Doe",
                email: "john@example.com",
                password: "hashedPassword",
                phoneNumber: "1234567890",
                classLevel: "Year 2",
            };
            // Mock the transaction properly
            prismaMock.$transaction.mockResolvedValue({
                student: mockStudent,
                token: "fake-token"
            });
            await (0, authController_1.register)(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: "success",
                token: "fake-token",
            }));
        });
        it("should return error if email already exists", async () => {
            req.body = {
                email: "existing@example.com",
                password: "password123",
            };
            const existingUser = {
                id: "existing-id",
                firstName: "Existing",
                lastName: "User",
                email: "existing@example.com",
                password: "hashed",
                phoneNumber: "1234567890",
                classLevel: "Year 1",
            };
            prismaMock.student.findUnique.mockResolvedValue(existingUser);
            await (0, authController_1.register)(req, res);
            expect(res.json).toHaveBeenCalledWith({
                error: "This email is already present in the system",
            });
        });
    });
    describe("login", () => {
        it("should login user successfully", async () => {
            req.body = {
                email: "john@example.com",
                password: "password123",
            };
            const mockStudent = {
                id: "user-123",
                firstName: "John",
                lastName: "Doe",
                email: "john@example.com",
                password: "hashedPassword",
                phoneNumber: "1234567890",
                classLevel: "Year 2",
            };
            prismaMock.student.findUnique.mockResolvedValue(mockStudent);
            bcryptjs_1.default.compare = jest.fn().mockResolvedValue(true);
            await (0, authController_1.login)(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: "success",
                token: "fake-token",
            }));
        });
        it("should return error for invalid credentials", async () => {
            req.body = {
                email: "wrong@example.com",
                password: "wrongpassword",
            };
            prismaMock.student.findUnique.mockResolvedValue(null);
            await (0, authController_1.login)(req, res);
            expect(res.json).toHaveBeenCalledWith({
                error: "Invalide email or password",
            });
        });
        it("should return error for wrong password", async () => {
            req.body = {
                email: "john@example.com",
                password: "wrongpassword",
            };
            const mockStudent = {
                id: "user-123",
                firstName: "John",
                lastName: "Doe",
                email: "john@example.com",
                password: "hashedPassword",
                phoneNumber: "1234567890",
                classLevel: "Year 2",
            };
            prismaMock.student.findUnique.mockResolvedValue(mockStudent);
            bcryptjs_1.default.compare = jest.fn().mockResolvedValue(false);
            await (0, authController_1.login)(req, res);
            expect(res.json).toHaveBeenCalledWith({
                error: "Invalide email or password",
            });
        });
    });
    describe("logout", () => {
        it("should clear cookie and return success", async () => {
            await (0, authController_1.logout)(req, res);
            expect(res.cookie).toHaveBeenCalledWith("token", "", {
                httpOnly: true,
                expires: expect.any(Date),
            });
            expect(res.json).toHaveBeenCalledWith({
                status: "success",
                message: "student logout successfully",
            });
        });
    });
    describe("check_token", () => {
        it("should return loggedIn true for valid token", () => {
            req.cookies = { token: "valid-token" };
            jsonwebtoken_1.default.verify = jest.fn().mockReturnValue({ id: "user-123" });
            (0, authController_1.check_token)(req, res);
            expect(res.json).toHaveBeenCalledWith({
                loggedIn: true,
                id: { id: "user-123" },
            });
        });
        it("should return loggedIn false for missing token", () => {
            req.cookies = {};
            (0, authController_1.check_token)(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                loggedIn: false,
                message: expect.any(String),
            });
        });
    });
});
