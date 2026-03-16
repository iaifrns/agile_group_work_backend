import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { getAllStudents, getUserProfile, updateUserProfile } from "../controller/studentController";

const router = express.Router();

// GET - get user profile (need login)
router.get("/profile/:userId", authMiddleware, getUserProfile);

// PUT - update user profile (need login)
router.put('/profile/:userId', authMiddleware, updateUserProfile);

router.get('/get_all_students', authMiddleware, getAllStudents)

export default router;