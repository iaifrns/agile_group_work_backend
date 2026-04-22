"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNotifications = exports.getUnReadNotifications = exports.getStudentNotifications = void 0;
const prisma_1 = require("../lib/prisma");
// Get all notifications for the authenticated student
const getStudentNotifications = async (req, res) => {
    try {
        const user = req.user; // Authenticated user from middleware
        // Fetch all notifications where this student is in the recipients list
        const notifications = await prisma_1.prisma.notification.findMany({
            where: {
                students: {
                    some: {
                        id: user.id,
                    },
                },
            },
        });
        res.status(200).json({
            success: true,
            notifications,
        });
    }
    catch (e) {
        console.log(e);
        res.status(500).json({
            success: false,
            message: "An Error occured please try later",
        });
    }
};
exports.getStudentNotifications = getStudentNotifications;
// Get only unread notifications for the authenticated student
const getUnReadNotifications = async (req, res) => {
    try {
        const user = req.user; // Authenticated user from middleware
        // Fetch notifications where student ID is NOT already in the isRead array
        const notifications = await prisma_1.prisma.notification.findMany({
            where: {
                students: {
                    some: {
                        id: user.id,
                    },
                },
                NOT: {
                    isRead: {
                        has: user.id, // Exclude notifications already marked as read by this student
                    },
                },
            },
        });
        res.status(200).json({
            success: true,
            notifications,
        });
    }
    catch (e) {
        console.log(e);
        res.status(500).json({
            success: false,
            message: "An Error occured please try later",
        });
    }
};
exports.getUnReadNotifications = getUnReadNotifications;
// Mark multiple notifications as read by adding student ID to isRead array
const updateNotifications = async (req, res) => {
    try {
        const user = req.user; // Authenticated user from middleware
        const { notificationList } = req.body; // Array of notification IDs to mark as read
        // Update each notification by pushing student ID to isRead array
        await Promise.all(notificationList.map((notifId) => prisma_1.prisma.notification.update({
            where: {
                id: notifId,
            },
            data: {
                isRead: {
                    push: user.id, // Add student ID to the read list
                },
            },
        })));
        res.status(200).json({
            success: true,
            message: "successfull"
        });
    }
    catch (e) {
        console.log(e);
        res.status(500).json({
            success: false,
            message: "something went wrong please try later",
        });
    }
};
exports.updateNotifications = updateNotifications;
