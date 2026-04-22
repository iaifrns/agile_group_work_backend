"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSchedule = exports.deleteSchedule = exports.getASchedule = exports.getAllSchedules = exports.createSchedule = void 0;
const prisma_1 = require("../lib/prisma");
// Utility function: Check if group exists and current user is admin
const checkIfGroupExistAndIsAdmin = async (req, res, groupId, userId) => {
    const group = await prisma_1.prisma.group.findUnique({
        where: {
            id: groupId,
        },
    });
    if (!group) {
        res
            .status(406)
            .json({ success: false, message: "This group does not exist." });
        return null;
    }
    if (group.admin != userId) {
        res.status(409).json({
            success: false,
            message: "Only admin have access to this functionality",
        });
        return null;
    }
    return group;
};
// Create schedule: supports both personal and group schedules
const createSchedule = async (req, res) => {
    try {
        const user = req.user; // Authenticated user from middleware
        const { title, desc, date, groupId } = req.body;
        // If groupId provided, create a group schedule (admin only)
        if (groupId) {
            const group = await checkIfGroupExistAndIsAdmin(req, res, groupId, user.id);
            if (!group)
                return;
            const schedule = await prisma_1.prisma.schedule.create({
                data: {
                    date: date,
                    title: title,
                    desc: desc,
                    group_id: group.id,
                    user_id: user.id,
                },
                include: {
                    group: true,
                },
            });
            return res.json({
                success: true,
                data: schedule,
            });
        }
        // Create a personal schedule
        const schedule = await prisma_1.prisma.schedule.create({
            data: {
                title: title,
                desc: desc,
                date: date,
                user_id: user.id,
            },
        });
        return res.json({
            success: true,
            data: schedule,
        });
    }
    catch (e) {
        console.log(e);
        return res.status(500).json({
            success: false,
            message: "An error occured please try later.",
        });
    }
};
exports.createSchedule = createSchedule;
// Get all schedules (personal + group schedules user has access to)
const getAllSchedules = async (req, res) => {
    try {
        const user = req.user; // Authenticated user from middleware
        // Fetch personal schedules AND group schedules where user is a member
        const schedules = await prisma_1.prisma.schedule.findMany({
            where: {
                OR: [
                    { user_id: user.id }, // Personal schedules
                    {
                        group: {
                            groupMembers: {
                                some: { AND: [{ student_id: user.id }, { status: "MEMBER" }] }, // User is an approved group member
                            },
                        },
                    }, // Group schedules
                ],
            },
            include: {
                user: true,
                group: true,
            },
        });
        return res.json({
            success: true,
            data: schedules,
        });
    }
    catch (e) {
        console.log(e);
        return res.status(500).json({
            success: false,
            message: "An Error occured please try later.",
        });
    }
};
exports.getAllSchedules = getAllSchedules;
// Get a single schedule by ID with access control
const getASchedule = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const user = req.user; // Authenticated user from middleware
        // Fetch schedule if user owns it OR is a member of the associated group
        const schedule = await prisma_1.prisma.schedule.findFirst({
            where: {
                AND: [
                    { id: scheduleId },
                    {
                        OR: [
                            { user_id: user.id }, // User created it
                            { group: { groupMembers: { some: { id: user.id } } } }, // User is in the group
                        ],
                    },
                ],
            },
            include: {
                user: true,
                group: true,
            },
        });
        if (!schedule) {
            return res.status(409).json({
                success: false,
                message: "You are not authorize to have access to this schedule",
            });
        }
        return res.json({
            success: true,
            data: schedule,
        });
    }
    catch (e) {
        console.log(e);
        return res.status(500).json({
            success: false,
            message: "something went wrong please try later",
        });
    }
};
exports.getASchedule = getASchedule;
// Delete a schedule (user can only delete their own schedules)
const deleteSchedule = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const user = req.user; // Authenticated user from middleware
        // Verify user owns this schedule
        const schedule = await prisma_1.prisma.schedule.findFirst({
            where: { AND: [{ id: scheduleId, user_id: user.id }] },
        });
        if (!schedule) {
            return res.status(406).json({
                success: false,
                message: "Schedule not found or you are not permitted to delete It",
            });
        }
        await prisma_1.prisma.schedule.delete({ where: { id: scheduleId } });
        return res.json({
            success: true,
            message: "Schedule deleted successfully",
        });
    }
    catch (e) {
        console.log(e);
        return res.status(500).json({
            success: false,
            message: "An error occured please try later",
        });
    }
};
exports.deleteSchedule = deleteSchedule;
// Update a schedule (user can only update their own schedules)
const updateSchedule = async (req, res) => {
    try {
        const user = req.user; // Authenticated user from middleware
        const { scheduleId } = req.params;
        const { title, desc, date } = req.body;
        // Verify user owns this schedule
        const schedule = await prisma_1.prisma.schedule.findFirst({
            where: { AND: [{ id: scheduleId }, { user_id: user.id }] },
        });
        if (!schedule) {
            return res.status(406).json({
                success: false,
                message: "Schedule not found or you are not permitted to delete It",
            });
        }
        // Validate input fields are not blank
        if (!title.trim() || !desc.trim() || !date.trim()) {
            return res.status(409).json({
                success: false,
                message: "blanque information can't be passed to update schedule",
            });
        }
        const updatedSchedule = await prisma_1.prisma.schedule.update({
            where: { id: scheduleId },
            data: {
                title: title,
                desc: desc,
                date: date,
            },
        });
        return res.json({
            success: true,
            message: "Schedule updated successfully",
            data: updatedSchedule,
        });
    }
    catch (e) {
        console.log(e);
        return res.status(500).json({
            success: false,
            message: "An error occured please try later.",
        });
    }
};
exports.updateSchedule = updateSchedule;
