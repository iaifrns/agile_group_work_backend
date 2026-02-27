import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";

export const getUserProfile = async (req:Request, res:Response) => {
    try{
        const userId = req.params.userId

        const user = await prisma.student.findUnique({
            where : {
                id: `${userId}`
            },
            select: {
                id: true,
                firstName: true,
                lastName:true,
                email: true,
                classLevel: true,
                phoneNumber: true
            }
        });

        if(!user){
            return res.status(404).json({
                success: false,
                message: "The student do not exists."
            });
        }

        res.status(200).json({
            success: true,
            data:user
        });

    } catch (error){
        console.error("Fail to fetch student data: ", error);
        res.status(500).json({
            success: false,
            message: "server error"
        });

    }
};