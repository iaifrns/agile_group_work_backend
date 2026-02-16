import express from "express";
import { getUserProfile } from "../controller/studentController.js";

const router = express.Router();

router.get("/profile/:userId", getUserProfile);

export default router;