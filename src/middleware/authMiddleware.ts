import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import type { Request, Response, NextFunction } from "express";

// Read the token from the request
// Check if token is valid
export const authMiddleware = async (req:Request, res:Response, next: NextFunction) => {
    
    let token;
    if (
        req.headers.authorization 
        && req.headers.authorization.startsWith("Bearer")
    ){
        token = req.headers.authorization.split(" ") [1] 
    }
    else if (req.cookies?.jwt || req.cookies?.token){
        console.log("Auth middleware reached 2");
        token = req.cookies.jwt || req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({error: "Not authorized, no token provided"})
    }

    try {
        // Verify token and extract the user ID
        const decoded = jwt.verify(token, process.env.SERVER_KEY!);
        console.log("Decoded token:", decoded);

        // extract 'id' from decoded
        const userId = typeof decoded === 'string' ? decoded : decoded.id;

        const user = await prisma.student.findUnique({
            where: {id: userId},
        });

        if (!user){
            return res.status(401).json( {error: "User no longer exists"});
        }

        // If user doesn't exist the middleware returns above, so user is guaranteed to be set when any controller runs
        (req as any).user = user;
        next();

    } catch (err) {
        console.error("Auth middleware error:", err);
        return res.status(401).json({error: "Not authorized, token failed"})
    }

};