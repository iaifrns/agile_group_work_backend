import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import type { Request, Response } from "express";

// Read the token from the request
// Check if token is valid
export const authMiddleware = async (req:Request, res:Response, next: any) => {
    console.log("Auth middleware reached");
    let token;

    if (
        req.headers.authorization 
        && req.headers.authorization.startsWith("Bearer")
    ){
        token = req.headers.authorization.split(" ") [1] 
    }else if (req.cookies?.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return res.status(401).json({error: "Not authorized, no token provided"})
    }

    try{
        // Verify token and extract the user Id
        const decoded = jwt.verify(token, process.env.SERVER_KEY!);

        const user = await prisma.student.findUnique({
            where: {id: decoded as string },
        });

        if (!user){
            return res
            .status(401)
            .json( {error: "User no longer exists"})
        }

        //req.user = user;
        next();

    }catch (err) {
        console.error("Auth middleware error:", err);
        return res.status(401).json({error: "Not authorized, token failed"})
    }

};