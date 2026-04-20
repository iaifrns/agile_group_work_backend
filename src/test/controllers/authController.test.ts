import { Request, Response } from "express";
import { register, login, logout, check_token } from "../../controller/authController";
//import { prismaMock } from "../__mocks__/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from '../../lib/prisma';
import { generator } from '../../util/generateToken';

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

const prismaMock = prisma as any;

describe("authController", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

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
      (bcrypt.genSalt as jest.Mock) = jest.fn().mockResolvedValue("salt");
      (bcrypt.hash as jest.Mock) = jest.fn().mockResolvedValue("hashedPassword");

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
      prismaMock.$transaction.mockResolvedValue ({
        student: mockStudent,
        token: "fake-token"
      });

      await register(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          token: "fake-token",
        })
      );
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
      prismaMock.student.findUnique.mockResolvedValue(existingUser as any);

      await register(req as Request, res as Response);

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

      prismaMock.student.findUnique.mockResolvedValue(mockStudent as any);
      (bcrypt.compare as jest.Mock) = jest.fn().mockResolvedValue(true);

      await login(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          token: "fake-token",
        })
      );
    });

    it("should return error for invalid credentials", async () => {
      req.body = {
        email: "wrong@example.com",
        password: "wrongpassword",
      };

      prismaMock.student.findUnique.mockResolvedValue(null);

      await login(req as Request, res as Response);

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

      prismaMock.student.findUnique.mockResolvedValue(mockStudent as any);
      (bcrypt.compare as jest.Mock) = jest.fn().mockResolvedValue(false);

      await login(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        error: "Invalide email or password",
      });
    });
  });

  describe("logout", () => {
    it("should clear cookie and return success", async () => {
      await logout(req as Request, res as Response);

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
      (jwt.verify as jest.Mock) = jest.fn().mockReturnValue({ id: "user-123" });

      check_token(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        loggedIn: true,
        id: { id: "user-123" },
      });
    });

    it("should return loggedIn false for missing token", () => {
      req.cookies = {};

      check_token(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        loggedIn: false,
        message: expect.any(String),
      });
    });
  });
});