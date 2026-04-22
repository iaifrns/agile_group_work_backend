"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
//import {createTask, createFeedback, updateTask, deleteTask} from '../controller/createTFController';
const createTFController_1 = require("../controller/createTFController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
//POST - create tasks
router.post('/create', authMiddleware_1.authMiddleware, createTFController_1.createTask);
//POST - create feedback
router.post('/feedback/:taskId', authMiddleware_1.authMiddleware, createTFController_1.createFeedback);
//PUT - update task
router.put('/update/:taskId', authMiddleware_1.authMiddleware, createTFController_1.updateTask);
//PUT - update task members
router.put('/update_members/:taskId', authMiddleware_1.authMiddleware, createTFController_1.updateTaskMembers);
//DELETE - delete task (admin only)
router.delete('/delete/:taskId', authMiddleware_1.authMiddleware, createTFController_1.deleteTask);
// GET- get all feedback for task
router.get('/feedback/:taskId', authMiddleware_1.authMiddleware, createTFController_1.getFeedbackForTask);
// GET - all tasks
router.get('/group/:groupId', authMiddleware_1.authMiddleware, createTFController_1.getAllGroupTasks);
// GET - all my tasks
router.get('/my_tasks', authMiddleware_1.authMiddleware, createTFController_1.getMyTasks);
//GET - get all tasks either group or personal
router.get('/get_all_task', authMiddleware_1.authMiddleware, createTFController_1.getAllTasks);
// GET - single task by ID
router.get('/:taskId', authMiddleware_1.authMiddleware, createTFController_1.getTaskById);
exports.default = router;
