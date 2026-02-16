import express from "express";
import { getUserProfile } from "../controllers/profileController.js";

const router = express.Router();

router.get("/profile/:userId", getUserProfile);

export default router;