import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { getUserProfile } from "../controller/studentController";

const router = express.Router();

router.get("/profile/:userId", authMiddleware, getUserProfile);

export default router;