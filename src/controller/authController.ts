import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.ts";
import { generator } from "../util/generateToken.ts";
import bcrypt from "bcryptjs";
import type { Request, Response } from "express";

const register = async (req: Request, res: Response) => {
  const { firstName, lastName, email, password, phoneNumber, classLevel } =
    req.body;

  console.log(email);
  const user = await prisma.student.findUnique({
    where: { email: email },
  });

  if (user) {
    return res.json({
      error: "This email is already present in the system",
    });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const student = await prisma.student.create({
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

const login = async (req:Request, res:Response) => {
  const { email, password } = req.body;

  const student = await prisma.student.findUnique({
    where: { email },
  });

  if (!student) {
    return res.json({ error: "Invalide email or password" });
  }

  const compare = await bcrypt.compare(password, student.password);

  if (!compare) {
    return res.json({ error: "Invalide email or password" });
  }

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

const logout = async (req:Request, res:Response) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.json({
    status: "success",
    message: "student logout successfully",
  });
};

const check_token = (req:Request, res:Response) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        loggedIn: false,
      });
    }
    const decoder = jwt.verify(token, process.env.SERVER_KEY!);
    return res.json({ loggedIn: true, id: decoder });
  } catch (e) {
    console.log(e);
    return res.status(401).json({
      loggedIn: false,
    });
  }
};

export { register, login, logout, check_token };
