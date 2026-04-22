"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteARequest = exports.getStudentSendRequest = exports.processJoinRequest = exports.getJoinRequests = void 0;
const prisma_1 = require("../lib/prisma");
const prisma_2 = require("../generated/prisma");
const navigate_1 = require("../types/navigate");
const socket_1 = require("../socket");
/*
 * Request Controller
 * Fetch group join request
 * Approve or Decline join request
 *
 */
// Get all pending join requests for a specific group (admin only)
const getJoinRequests = async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const userId = req.user.id; // Authenticated user from middleware
        // Verify user is authenticated
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated",
            });
        }
        // Check if the group exists and get admin info
        const group = await prisma_1.prisma.group.findUnique({
            where: {
                id: groupId,
            },
            select: {
                id: true,
                admin: true,
                name: true,
            },
        });
        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found.",
            });
        }
        // Only the admin can view join requests
        if (group.admin !== userId) {
            return res.status(403).json({
                success: false,
                message: "Forbidden (admin only)",
            });
        }
        // Fetch all pending join requests for this group
        const requests = await prisma_1.prisma.groupMembers.findMany({
            where: {
                group_id: `${groupId}`,
                status: prisma_2.GroupStatus.REQUEST, // Only pending requests, not approved members
            },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                id: "desc", // Most recent requests first
            },
        });
        // Format request data for cleaner response
        const formattedRequests = requests.map((req) => ({
            id: req.id,
            student: {
                id: req.student.id,
                name: `${req.student.firstName} ${req.student.lastName}`,
                email: req.student.email,
            },
        }));
        return res.status(200).json({
            success: true,
            count: formattedRequests.length,
            data: formattedRequests,
        });
    }
    catch (error) {
        console.error("Get join requests error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};
exports.getJoinRequests = getJoinRequests;
// Handle join requests (Approve/Decline) - Admin only
const processJoinRequest = async (req, res) => {
    try {
        const { groupId, requestId } = req.params;
        const userId = req.user?.id; // Authenticated user from middleware
        const { action } = req.body;
        // Log for debugging
        console.log("Processing request:", {
            groupId,
            requestId,
            userId,
            action,
        });
        // Validate action parameter
        if (!action || !["Approve", "Decline"].includes(action)) {
            return res.status(400).json({
                success: false,
                message: "Action must be 'Approve' or 'Decline'",
            });
        }
        // Check login status (commented out)
        //if (!userId) {
        //return res.status(401).json({
        //  success: false,
        //message: "Not authenticated"
        //});
        //}
        // Check if group exists
        const group = await prisma_1.prisma.group.findUnique({
            where: {
                id: `${groupId}`,
            },
            select: {
                id: true,
                admin: true,
                name: true,
            },
        });
        if (!group) {
            return res.status(400).json({
                success: false,
                message: "Grouop not found.",
            });
        }
        // Only the admin can handle join requests
        if (group.admin !== userId) {
            return res.status(403).json({
                success: false,
                message: "Forbidden (admin only)",
            });
        }
        // Find the join request
        const joinRequest = await prisma_1.prisma.groupMembers.findUnique({
            where: {
                id: `${requestId}`,
            },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        if (!joinRequest) {
            return res.status(400).json({
                success: false,
                message: "Join request not found.",
            });
        }
        // Verify request belongs to the specified group
        if (joinRequest.group_id !== groupId) {
            return res.status(400).json({
                success: false,
                message: "Request does not belong to this group.",
            });
        }
        // Check if request has already been processed
        if (joinRequest.status !== prisma_2.GroupStatus.REQUEST) {
            return res.status(400).json({
                success: false,
                message: `Request already ${joinRequest.status === prisma_2.GroupStatus.MEMBER ? "approved" : "processed"}.`,
            });
        }
        // Handle approval
        if (action === "Approve") {
            // Approve: update status to MEMBER and notify the student
            await prisma_1.prisma.$transaction(async (transaction) => {
                await transaction.groupMembers.update({
                    where: {
                        id: `${requestId}`,
                    },
                    data: {
                        status: prisma_2.GroupStatus.MEMBER,
                    },
                });
                // Send approval notification to the student
                await transaction.notification.create({
                    data: {
                        message: "You were accepted in " + group.name + " congratulation",
                        navigate: navigate_1.NAVIGATE.GROUPDETAIL,
                        students: {
                            connect: [{ id: joinRequest.student.id }],
                        },
                    },
                });
            });
            // Emit real-time notification via Socket.IO
            const io = (0, socket_1.getIo)();
            io.emit("notification", {
                message: "new notification",
            });
            return res.status(200).json({
                success: true,
                message: "Request approved successfully.",
                data: {
                    requestId: requestId,
                    status: "Approved",
                    studentName: `${joinRequest.student.firstName} ${joinRequest.student.lastName}`,
                    groupName: group.name,
                },
            });
        }
        else {
            // Decline: delete the request record and notify the student
            await prisma_1.prisma.$transaction(async (transaction) => {
                await transaction.groupMembers.delete({
                    where: {
                        id: `${requestId}`,
                    },
                });
                // Send rejection notification to the student
                await transaction.notification.create({
                    data: {
                        message: "The request to join " + group.name + " was declined",
                        navigate: "",
                        students: {
                            connect: [{ id: joinRequest.student.id }],
                        },
                    },
                });
            });
            return res.status(200).json({
                success: true,
                message: "Request rejected successfully.",
                data: {
                    requestId: requestId,
                    status: "Rejected",
                    studentName: `${joinRequest.student.firstName} ${joinRequest.student.lastName}`,
                    groupName: group.name,
                },
            });
        }
    }
    catch (error) {
        console.error("Process join request error:", error);
        // Handle Prisma "record not found" error
        if (error && typeof error === "object" && "code" in error) {
            const prismaError = error;
            if (prismaError.code === "P2025") {
                return res.status(404).json({
                    success: false,
                    message: "Request not found.",
                });
            }
        }
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};
exports.processJoinRequest = processJoinRequest;
// Get all pending join requests sent by the authenticated student
const getStudentSendRequest = async (req, res) => {
    try {
        const user = req.user; // Authenticated user from middleware
        // Fetch all REQUEST status entries where this student is the requester
        const requestList = await prisma_1.prisma.groupMembers.findMany({
            where: {
                student_id: user.id,
                status: prisma_2.GroupStatus.REQUEST, // Only pending requests, not approved memberships
            },
            select: {
                id: true,
                group: true, // Include associated group details
            },
        });
        res.status(200).json({
            success: true,
            requestList,
        });
    }
    catch (e) {
        console.log(e);
        return res.status(409).json({
            success: false,
            message: "something went wrong please try later ...",
        });
    }
};
exports.getStudentSendRequest = getStudentSendRequest;
// Delete a pending join request by ID
const deleteARequest = async (req, res) => {
    try {
        const { requestId } = req.body; // ID of the request to delete
        // Remove the group membership request from the database
        const response = await prisma_1.prisma.groupMembers.delete({
            where: {
                id: requestId,
            },
        });
        console.log(response); // Log deleted record for debugging
        res.status(200).json({
            success: true,
            message: "Request deleted successfully",
        });
    }
    catch (e) {
        console.log(e);
        res.status(409).json({
            success: false,
            message: "Something went wrong please try later ...",
        });
    }
};
exports.deleteARequest = deleteARequest;
