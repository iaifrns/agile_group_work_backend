import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const getStudentNotifications = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const notifications = await prisma.notification.findMany({
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
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "An Error occured please try later",
    });
  }
};
