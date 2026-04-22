import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { generator } from "../util/generateToken";
import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { DefaultArgs } from "@prisma/client/runtime/client";
import { PrismaClient } from "../generated/prisma/client";

// Register a new student user
const register = async (req: Request, res: Response) => {
  const { firstName, lastName, email, password, phoneNumber, classLevel } =
    req.body;

  console.log(email);
  // Check if user already exists
  const user = await prisma.student.findUnique({
    where: { email: email },
  });

  if (user) {
    return res.json({
      error: "This email is already present in the system",
    });
  }

  // Hash password before storing
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Transaction: create student, generate token, and create welcome notification
  const { student, token } = await prisma.$transaction(
    async (
      trans: Omit<
        PrismaClient<never, undefined, DefaultArgs>,
        "$connect" | "$disconnect" | "$on" | "$use" | "$extends"
      >,
    ) => {
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

      const token = generator(student.id, res);

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
    },
  );

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

// Login existing student user
const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Find student by email
  const student = await prisma.student.findUnique({
    where: { email },
  });

  if (!student) {
    return res.json({ error: "Invalide email or password" });
  }

  // Verify password
  const compare = await bcrypt.compare(password, student.password);

  if (!compare) {
    return res.json({ error: "Invalide email or password" });
  }

  // Generate and set auth token
  const token = generator(student.id, res);

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

// Logout student - clear auth cookie
const logout = async (req: Request, res: Response) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.json({
    status: "success",
    message: "student logout successfully",
  });
};

// Verify JWT token validity
const check_token = (req: Request, res: Response) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({
        loggedIn: false,
        message: "this thing was here init",
      });
    }
    const decoder = jwt.verify(token, process.env.SERVER_KEY!);
    return res.json({ loggedIn: true, id: decoder });
  } catch (e) {
    console.log(e);
    return res.status(401).json({
      loggedIn: false,
      message: "what the fuck",
    });
  }
};

export { register, login, logout, check_token };
