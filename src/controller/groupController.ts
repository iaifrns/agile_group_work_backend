import { Request, Response } from "express";
import {prisma} from "../lib/prisma";

/*
 * Group Controller
 * Fetches Group details
 * Update Group name
 * Adds Member to Group
 * Remove Member
 * Deletes Group
 *
 * All operations require user to be Group Admin
 */

//Get the Group details - Retrieves full group details - Does NOT require Admin
export const getGroupDetails = async (req: Request, res: Response) => {
    try{
        const {groupId} = req.params;
        const group = await prisma.group.findUnique({
            where: {id: groupId as string},
            select:{
                id:true,
                name: true,
                createdAt: true,
                groupMembers:{
                    select:{
                        student:{
                            select:{
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                classLevel: true,
                                phoneNumber: true,
                            },
                        },
                    },
                },
            },
        });

        if (!group) {
            // Return 404 if it doesn't exist
            return res.status(404).json({success:false, message: "Group not found."});
        }
        const members = group.groupMembers.map((gm) => gm.student);

        return res.status(200).json({
            success:true,
            data: {
                id: group.id,
                name: group.name,
                createdAt: group.createdAt,
                //admin: group.admin,
                members,
            },
        });
}   catch (error){
    console.error("getGroupDetails error:", error);
    return res.status(500).json({success: false, message:"Server Error"});
    }
};

// Update the Group name - Only Admin can update
export const updateGroupName = async (req: Request, res: Response) => {
    try{
        const {groupId} = req.params;
        const {name} = req.body;

        if (!name || typeof name !== "string" || !name.trim()) {
            return res.status(400).json({success: false, message: "Name is required"});
        }
        const group = await prisma.group.findUnique({ where: {id: groupId as string} });
        if (!group){
            return res.status(404).json({success: false, message: "Group not found."});
        }
        if (group.admin !== req.body.id){
            return res.status(403).json({success: false, message: "Forbidden (admin only"});
        }
        const updated = await prisma.group.update({
            where: {id: groupId as string},
            data: {name: name.trim()},
            select: {id: true, name: true, createdAt: true, admin: true},
        });
        return res.status(200).json({success: true, data: updated});
    } catch(error){
        console.error("updateGroupName error:", error);
        return res.status(500).json({success: false, message: "Server Error"});
    }
};

// Add Member to Group - Admin Only
export const addMemberToGroup = async (req: Request, res: Response) => {
    try{
        const {groupId} = req.params;
        const {studentId} = req.body;
        if (!studentId || typeof studentId !== "string"){
            return res.status(400).json({success: false, message: "StudentId is required"});
        }
        const group = await prisma.group.findUnique({where: {id:groupId as string}});
        if (!group){
            return res.status(404).json({success: false, message: "Group not found."});
        }
        if (group.admin !== req.body.id){
            return res.status(403).json({success: false, message: "Forbidden (Admin only)"});
        }
        const student = await prisma.group.findUnique({where: {id:studentId}});
        if (!student){
            return res.status(404).json({success: false, message: "Student not found."});
        }
        const existing = await prisma.groupMembers.findFirst({
            where: {group_id: groupId as string, student_id: studentId},
        });
        if (existing){
            return res.status(409).json({success: false, message: "Student is already a member"});
        }
        await prisma.groupMembers.create({
            data:{student_id: studentId, group_id: groupId as string},
        });
        return res.status(201).json({success: true, message: "Member added successfully."});
    } catch(error){
        console.error("addMemberToGroup error:", error);
        return res.status(500).json({success: false, message: "Server Error"});
    }
};

// Remove Member from Group - Admin Only - Admin cannot remove themselves
export const removeMemberFromGroup = async (req: Request, res: Response) => {
    try {
        const {groupId, studentId} = req.params;
        const group = await prisma.group.findUnique({where: {id:groupId as string}});
        if (!group){
            return res.status(404).json({success: false, message: "Group not found."});
        }
        if (group.admin !== req.body.id){
            return res.status(403).json({success: false, message: "Forbidden (Admin only)"});
        }
        if (studentId === group.admin){
            return res.status(400).json({success: false, message: "Cannot remove Admin"});
        }
        const membership = await prisma.groupMembers.findFirst({
            where: {group_id: groupId as string, student_id: studentId as string},
        });
        if (!membership){
            return res.status(404).json({success: false, message: "Membership not found."});
        }
        await prisma.groupMembers.delete({where: {id: membership.id}});
        return res.status(200).json({success: true, message: "Member removed successfully."});
    } catch(error){
        console.error("removeMemberFromGroup error:", error);
        return res.status(500).json({success: false, message: "Server Error"});
    }
};

// Deleting a Group - Only Admin - Related groupMembers records are removed auto via cascade delete
export const deleteGroup = async (req: Request, res: Response) => {
    try{
        const {groupId} = req.params;
        const group = await prisma.group.findUnique({where: {id:groupId as string}});
        if (!group){
            return res.status(404).json({success: false, message: "Group not found."});
        }
        if (group.admin !== req.body.id){
            return res.status(403).json({success: false, message: "Forbidden (Admin only)"});
        }
        await prisma.group.delete({where: {id:groupId as string}});
        return res.status(200).json({success: true, message: "Group deleted successfully."});
    } catch(error){
        console.error("deleteGroup error:", error);
        return res.status(500).json({success: false, message: "Server Error"});
    }
};