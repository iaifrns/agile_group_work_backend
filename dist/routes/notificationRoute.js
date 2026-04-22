"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notificationController_1 = require("../controller/notificationController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Notification routes (all protected by authentication middleware)
// GET all notifications for the authenticated student
router.get("/student_notification", authMiddleware_1.authMiddleware, notificationController_1.getStudentNotifications);
// GET only unread notifications for the authenticated student
router.get("/unread_notification", authMiddleware_1.authMiddleware, notificationController_1.getUnReadNotifications);
// PUT mark notifications as read (adds student ID to isRead array)
router.put("/modify", authMiddleware_1.authMiddleware, notificationController_1.updateNotifications);
exports.default = router;
