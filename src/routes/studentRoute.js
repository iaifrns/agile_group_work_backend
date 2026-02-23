import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getUserProfile } from "../controllers/studentController.js";

const router = express.Router();

router.get("/profile/:userId", authMiddleware, getUserProfile);

export default router;