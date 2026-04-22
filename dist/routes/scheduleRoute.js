"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const scheduleController_1 = require("../controller/scheduleController");
const router = express_1.default.Router();
// create route
router.post("/create", authMiddleware_1.authMiddleware, scheduleController_1.createSchedule);
//get all schedules
router.get("/get_all_schedule", authMiddleware_1.authMiddleware, scheduleController_1.getAllSchedules);
//get one schedule
router.get("/get_one_schedule/:scheduleId", authMiddleware_1.authMiddleware, scheduleController_1.getASchedule);
//delete schedule
router.delete("/:scheduleId", authMiddleware_1.authMiddleware, scheduleController_1.deleteSchedule);
//update schedule
router.put("/update/:scheduleId", authMiddleware_1.authMiddleware, scheduleController_1.updateSchedule);
exports.default = router;
