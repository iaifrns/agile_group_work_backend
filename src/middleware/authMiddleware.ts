import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import type { Request, Response, NextFunction } from "express";

// Authentication middleware: validates JWT token and attaches user to request
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    
    let token;
    // Extract token from Authorization header (Bearer scheme)
    if (
        req.headers.authorization 
        && req.headers.authorization.startsWith("Bearer")
    ){
        token = req.headers.authorization.split(" ")[1];
    }
    // Fallback: extract token from cookies (jwt or token)
    else if (req.cookies?.jwt || req.cookies?.token){
        console.log("Auth middleware reached 2");
        token = req.cookies.jwt || req.cookies.token;
    }

    // Reject if no token is present
    if (!token) {
        return res.status(401).json({error: "Not authorized, no token provided"});
    }

    try {
        // Verify token and extract the user ID
        const decoded = jwt.verify(token, process.env.SERVER_KEY!);
        console.log("Decoded token:", decoded);

        // Extract user ID (supports both string and object decoded formats)
        const userId = typeof decoded === 'string' ? decoded : decoded.id;

        // Fetch the user from database
        const user = await prisma.student.findUnique({
            where: {id: userId},
        });

        // Reject if user no longer exists in database
        if (!user){
            return res.status(401).json({error: "User no longer exists"});
        }

        // Attach user to request object for downstream controllers
        (req as any).user = user;
        next(); // Proceed to next middleware/controller

    } catch (err) {
        console.error("Auth middleware error:", err);
        return res.status(401).json({error: "Not authorized, token failed"});
    }

};