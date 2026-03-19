import express from 'express';
import {createTask, createFeedback, updateTask, deleteTask} from '../controller/createTFController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

//POST - create tasks
router.post('/create', authMiddleware, createTask);

//POST - create feedback
router.post('/:taskId/feedback', authMiddleware, createFeedback);

//PUT - update task
router.put('/update/:taskId', authMiddleware, updateTask);

//DELETE - delete task (admin only)
router.delete('/delete/:taskId', authMiddleware, deleteTask);

export default router;