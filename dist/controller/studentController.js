"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllStudentsNotInGroup = exports.updateUserProfile = exports.getAllStudents = exports.getUserProfile = void 0;
const prisma_1 = require("../lib/prisma");
/*
 * student Controller
 * Fetches student details in profile
 * Update student/profile info (need to add)
 *
 */
// Get a single student's profile by ID
const getUserProfile = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await prisma_1.prisma.student.findUnique({
            where: {
                id: `${userId}`,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                classLevel: true,
                phoneNumber: true,
            },
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "The student does not exist.",
            });
        }
        res.status(200).json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        console.error("Fail to fetch student data: ", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};
exports.getUserProfile = getUserProfile;
// Get all students except the authenticated user
const getAllStudents = async (req, res) => {
    try {
        const user = req.user; // Authenticated user from middleware
        const students = await prisma_1.prisma.student.findMany({
            where: {
                NOT: {
                    id: user.id, // Exclude current user from results
                },
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
            },
        });
        res.json({
            status: "success",
            students,
        });
    }
    catch (e) {
        console.log(e);
        res.json({
            status: "error",
            message: "something went roung try later",
        });
    }
};
exports.getAllStudents = getAllStudents;
// Update user profile information (excluding email)
const updateUserProfile = async (req, res) => {
    try {
        const userId = req.params.userId;
        // Validate request body exists
        if (!req.body) {
            return res.status(400).json({
                success: false,
                message: "Request body is missing. Maybe forget Content-Type: application/json?",
            });
        }
        // Extract updatable fields (email cannot be updated)
        const { firstName, lastName, phoneNumber, classLevel } = req.body;
        // Check if request body has any data
        if (Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Empty request body. Provide at least one field to update.",
            });
        }
        // Only update own profile (commented out)
        //if (req.user.id !== userId) {
        //  return res.status(403).json({
        //    success: false,
        //  message: "You can only update your own profile"
        //});
        //}
        // Ensure at least one valid field is provided for update
        if (!firstName && !lastName && !phoneNumber && !classLevel) {
            return res.status(400).json({
                success: false,
                message: "No valid fields to update provided",
            });
        }
        // Build update object with only fields that have values (trim whitespace)
        const updateData = {
            firstName: "",
            lastName: "",
            phoneNumber: "",
            classLevel: "",
        };
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
        // Update the student record in database
        const updateUser = await prisma_1.prisma.student.update({
            where: {
                id: `${userId}`,
            },
            data: updateData,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                classLevel: true,
                phoneNumber: true,
            },
        });
        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updateUser,
        });
    }
    catch (error) {
        console.error("Update profile error:", error);
        if (error && typeof error === "object" && "code" in error) {
            const prismaError = error;
            // P2025 in Prisma = 'Record to update not found'
            if (prismaError.code === "P2025") {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }
            // Handle other Prisma errors
            if (prismaError.code?.startsWith("P")) {
                return res.status(400).json({
                    success: false,
                    message: `Database error: ${error.code}`,
                });
            }
            res.status(500).json({
                success: false,
                message: "Server error",
            });
        }
    }
};
exports.updateUserProfile = updateUserProfile;
// Get all students who are NOT members of a specific group
const getAllStudentsNotInGroup = async (req, res) => {
    try {
        const groupId = req.params.groupId;
        // Verify group exists
        const group = await prisma_1.prisma.group.findUnique({
            where: {
                id: groupId
            }
        });
        if (!group) {
            return res
                .status(404)
                .json({ success: false, message: "Group not found." });
        }
        // Find students with no membership record for this group
        const students = await prisma_1.prisma.student.findMany({
            where: {
                groupMembers: {
                    none: {
                        group_id: groupId, // Student is not associated with this group
                    }
                }
            },
            select: {
                firstName: true,
                lastName: true,
                email: true,
                id: true,
            }
        });
        return res.json({
            success: true,
            students
        });
    }
    catch (e) {
        console.log(e);
        return res.status(500).json({
            success: false,
            message: "something went wrong"
        });
    }
};
exports.getAllStudentsNotInGroup = getAllStudentsNotInGroup;
