import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

//util funciton
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

// create schedule: this goes for both personal and group
export const createSchedule = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { title, desc, date, groupId } = req.body;

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
        include:{
            group: true
        }
      });

      return res.json({
        success: true,
        data: schedule,
      });
    }

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

//get all schedule
export const getAllSchedules = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const schedules = await prisma.schedule.findMany({
      where: {
        OR: [
          { user_id: user.id },
          { group: { groupMembers: { some: { student_id: user.id } } } },
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

// get one schedule
export const getASchedule = async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const user = (req as any).user;

    const schedule = await prisma.schedule.findFirst({
      where: {
        AND: [
          { id: scheduleId as string },
          {
            OR: [
              { user_id: user.id },
              { group: { groupMembers: { some: { id: user.id } } } },
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

//delete schedule
export const deleteSchedule = async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const user = (req as any).user;

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

//update schedule
export const updateSchedule = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { scheduleId } = req.params;
    const { title, desc, date } = req.body;

    const schedule = await prisma.schedule.findFirst({
      where: { AND: [{ id: scheduleId as string }, { user_id: user.id }] },
    });

    if (!schedule) {
      return res.status(406).json({
        success: false,
        message: "Schedule not found or you are not permitted to delete It",
      });
    }

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
