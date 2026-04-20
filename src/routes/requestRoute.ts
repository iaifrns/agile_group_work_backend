import express from 'express';
import { deleteARequest, getJoinRequests, getStudentSendRequest, processJoinRequest } from '../controller/requestController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Group join request routes (all protected by authentication middleware)

// GET - get all pending join requests for a group (admin only)
router.get('/:groupId/requests', authMiddleware, getJoinRequests);

// PUT - handle join request (Approve/Decline) (admin only)
router.put('/:groupId/requests/:requestId', authMiddleware, processJoinRequest);

// GET - get all join requests sent by the authenticated student
router.get('/student_request', authMiddleware, getStudentSendRequest);

// DELETE - delete/cancel a pending join request by ID
router.delete('/delete_student_request', authMiddleware, deleteARequest);

export default router;