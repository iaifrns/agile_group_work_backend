"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const studentController_1 = require("../controller/studentController");
const router = express_1.default.Router();
// Student routes (all protected by authentication middleware)
// GET - get user profile by ID
router.get("/profile/:userId", authMiddleware_1.authMiddleware, studentController_1.getUserProfile);
// PUT - update user profile (own profile only)
router.put('/profile/:userId', authMiddleware_1.authMiddleware, studentController_1.updateUserProfile);
// GET - get all students (excluding current authenticated user)
router.get('/get_all_students', authMiddleware_1.authMiddleware, studentController_1.getAllStudents);
// GET - get all students who are NOT members of a specific group
router.get('/student_not_in_group/:groupId', authMiddleware_1.authMiddleware, studentController_1.getAllStudentsNotInGroup);
exports.default = router;
