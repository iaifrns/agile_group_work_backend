import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// Get all notifications for the authenticated student
export const getStudentNotifications = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user; // Authenticated user from middleware

    // Fetch all notifications where this student is in the recipients list
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

// Get only unread notifications for the authenticated student
export const getUnReadNotifications = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user; // Authenticated user from middleware

    // Fetch notifications where student ID is NOT already in the isRead array
    const notifications = await prisma.notification.findMany({
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
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "An Error occured please try later",
    });
  }
};

// Mark multiple notifications as read by adding student ID to isRead array
export const updateNotifications = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user; // Authenticated user from middleware
    const { notificationList } = req.body; // Array of notification IDs to mark as read

    // Update each notification by pushing student ID to isRead array
    await Promise.all(
      (notificationList as string[]).map((notifId) =>
        prisma.notification.update({
          where: {
            id: notifId,
          },
          data: {
            isRead: {
              push: user.id, // Add student ID to the read list
            },
          },
        }),
      ),
    );

    res.status(200).json({
        success: true,
        message: "successfull"
    })
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "something went wrong please try later",
    });
  }
};