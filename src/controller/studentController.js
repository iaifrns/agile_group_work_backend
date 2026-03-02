/*
 * Student Controller
 * Fetches student details in profile
 * Update student/profile info (need to add)
 *
 */

import { prisma } from "../lib/prisma.js";

export const getUserProfile = async (req, res) => {
    try{
        const userId = req.params.userId

        const user = await prisma.student.findUnique({
            where : {
                id: userId
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

//update user profile info
export const updateUserProfile = async (req,res) => {
    try {
        //get user id and 
        const userId = req.params.userId;

        //check if req.body exist
        if (!req.body){
            return res.status(400).json({
                success: false,
                message: "Request body is missing. Maybe forget Content-Type: application/json?"
            });
        }

        //get update body (not include email)
        const { firstName, lastName, phoneNumber, classLevel } = req.body;          

        //check if req.body contains data
        if (Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Empty request body. Provide at least one field to update."
            })
        }

        //only update own profile
        if (req.user.id !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own profile"
            });
        }

        //check if any field updates
        if (!firstName && !lastName && !email && !phoneNumber && !classLevel) {
            return res.status(400).json({
                success: false,
                message: "No fileds to update provided"
            });
        }

        //get updated items (only those with values)
        const updateData = {};
        // if one item === null or undefined (trim blank)
        if (firstName?.trim()) {
            updateData.firstName = firstName.trim();
        }
        if (lastName?.trim()) {
            updateData.lastName = lastName.trim();
        }
        if (phoneNumber?.trim()) {
            updateData.phoneNumber = phoneNumber.trim();
        }
        if (classLevel?.trim()) {
            updateData.classLevel = classLevel.trim();
        }

        //update database
        const updateUser = await prisma.student.update({
            where: {
                id: userId
            },
            data: updateData,
            select: {
                id: true,
                firstName: true,
                lastName:true,
                email: true,
                classLevel: true,
                phoneNumber: true                
            }
        });

        //return status message
        res.status(200).json({
            success: true,
            messgae: "Profile updated successfully",
            data: updateUser
        });

    }catch (error) {
        console.error("Update profile error:", error);

        //P2025 in Prisma = 'Record to update not found'
        if (error.code === 'P2025') {  
            return res.statuse(404).json({
                success: false,
                message: "User not found"
            });
        }

        //other Prisma errors
        if (error.code ?.startWith('P')){
            return res.status(400).json({
                success: false,
                message: `Database error: ${error.code}`
            });
        }

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};