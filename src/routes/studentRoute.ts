import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.ts";
import { getUserProfile } from "../controller/studentController.ts";

const router = express.Router();

router.get("/profile/:userId", authMiddleware, getUserProfile);

export default router;