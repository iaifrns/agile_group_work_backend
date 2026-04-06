import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  createSchedule,
  deleteSchedule,
  getAllSchedules,
  getASchedule,
  updateSchedule,
} from "../controller/scheduleController";

const router = express.Router();

// create route
router.post("/create", authMiddleware, createSchedule);

//get all schedules
router.get("/get_all_schedule", authMiddleware, getAllSchedules);

//get one schedule
router.get("/get_one_schedule/:scheduleId", authMiddleware, getASchedule);

//delete schedule
router.delete("/:scheduleId", authMiddleware, deleteSchedule);

//update schedule
router.put("/update/:scheduleId", authMiddleware, updateSchedule);

export default router
