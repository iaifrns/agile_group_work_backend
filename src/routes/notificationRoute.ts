import express from "express";
import { getStudentNotifications, getUnReadNotifications, updateNotifications } from "../controller/notificationController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/student_notification", authMiddleware, getStudentNotifications);
router.get("/unread_notification", authMiddleware, getUnReadNotifications);
router.put("/modify", authMiddleware, updateNotifications);

export default router
