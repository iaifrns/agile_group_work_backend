import express from 'express';
//import {createTask, createFeedback, updateTask, deleteTask} from '../controller/createTFController';
import {
    createTask,
    createFeedback,
    getAllGroupTasks,
    getTaskById,
    getFeedbackForTask,
    updateTask,
    deleteTask,
    updateTaskMembers,
    getMyTasks
} from '../controller/createTFController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

//POST - create tasks
router.post('/create', authMiddleware, createTask);

//POST - create feedback
router.post('/feedback/:taskId', authMiddleware, createFeedback);

//PUT - update task
router.put('/update/:taskId', authMiddleware, updateTask);

//PUT - update task members
router.put('/update_members/:taskId', authMiddleware, updateTaskMembers);

//DELETE - delete task (admin only)
router.delete('/delete/:taskId', authMiddleware, deleteTask);

// GET- get all feedback for task
router.get('/feedback/:taskId', authMiddleware, getFeedbackForTask);

// GET - all tasks
router.get('/group/:groupId', authMiddleware, getAllGroupTasks);

// GET - all my tasks
router.get('/my_tasks', authMiddleware, getMyTasks);

// GET - single task by ID
router.get('/:taskId', authMiddleware, getTaskById);

export default router;