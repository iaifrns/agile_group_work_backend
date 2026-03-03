import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { getUserProfile, updateUserProfile } from "../controller/studentController";

const router = express.Router();

// GET - get user profile (need login)
router.get("/profile/:userId", authMiddleware, getUserProfile);

// PUT - update user profile (need login)
router.put('/profile/:userId',authMiddleware, updateUserProfile);

export default router;