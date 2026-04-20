import express from "express";
import { getStudentNotifications, getUnReadNotifications, updateNotifications } from "../controller/notificationController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

// Notification routes (all protected by authentication middleware)

// GET all notifications for the authenticated student
router.get("/student_notification", authMiddleware, getStudentNotifications);

// GET only unread notifications for the authenticated student
router.get("/unread_notification", authMiddleware, getUnReadNotifications);

// PUT mark notifications as read (adds student ID to isRead array)
router.put("/modify", authMiddleware, updateNotifications);

export default router;