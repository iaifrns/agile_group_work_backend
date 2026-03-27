import express from "express";
import { getStudentNotifications } from "../controller/notificationController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/student_notification", authMiddleware, getStudentNotifications);

export default router
