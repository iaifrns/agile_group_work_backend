import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// Utility function: Check if group exists and current user is admin
const checkIfGroupExistAndIsAdmin = async (
  req: Request,
  res: Response,
  groupId: string,
  userId: string,
) => {
  const group = await prisma.group.findUnique({
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
export const createSchedule = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user; // Authenticated user from middleware
    const { title, desc, date, groupId } = req.body;

    // If groupId provided, create a group schedule (admin only)
    if (groupId) {
      const group = await checkIfGroupExistAndIsAdmin(
        req,
        res,
        groupId,
        user.id,
      );

      if (!group) return;

      const schedule = await prisma.schedule.create({
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
    const schedule = await prisma.schedule.create({
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
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      message: "An error occured please try later.",
    });
  }
};

// Get all schedules (personal + group schedules user has access to)
export const getAllSchedules = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user; // Authenticated user from middleware

    // Fetch personal schedules AND group schedules where user is a member
    const schedules = await prisma.schedule.findMany({
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
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      message: "An Error occured please try later.",
    });
  }
};

// Get a single schedule by ID with access control
export const getASchedule = async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const user = (req as any).user; // Authenticated user from middleware

    // Fetch schedule if user owns it OR is a member of the associated group
    const schedule = await prisma.schedule.findFirst({
      where: {
        AND: [
          { id: scheduleId as string },
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
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      message: "something went wrong please try later",
    });
  }
};

// Delete a schedule (user can only delete their own schedules)
export const deleteSchedule = async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const user = (req as any).user; // Authenticated user from middleware

    // Verify user owns this schedule
    const schedule = await prisma.schedule.findFirst({
      where: { AND: [{ id: scheduleId as string, user_id: user.id }] },
    });

    if (!schedule) {
      return res.status(406).json({
        success: false,
        message: "Schedule not found or you are not permitted to delete It",
      });
    }

    await prisma.schedule.delete({ where: { id: scheduleId as string } });

    return res.json({
      success: true,
      message: "Schedule deleted successfully",
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      message: "An error occured please try later",
    });
  }
};

// Update a schedule (user can only update their own schedules)
export const updateSchedule = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user; // Authenticated user from middleware
    const { scheduleId } = req.params;
    const { title, desc, date } = req.body;

    // Verify user owns this schedule
    const schedule = await prisma.schedule.findFirst({
      where: { AND: [{ id: scheduleId as string }, { user_id: user.id }] },
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

    const updatedSchedule = await prisma.schedule.update({
      where: { id: scheduleId as string },
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
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      message: "An error occured please try later.",
    });
  }
};