import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { getAllStudents, getAllStudentsNotInGroup, getUserProfile, updateUserProfile } from "../controller/studentController";

const router = express.Router();

// Student routes (all protected by authentication middleware)

// GET - get user profile by ID
router.get("/profile/:userId", authMiddleware, getUserProfile);

// PUT - update user profile (own profile only)
router.put('/profile/:userId', authMiddleware, updateUserProfile);

// GET - get all students (excluding current authenticated user)
router.get('/get_all_students', authMiddleware, getAllStudents);

// GET - get all students who are NOT members of a specific group
router.get('/student_not_in_group/:groupId', authMiddleware, getAllStudentsNotInGroup);

export default router;