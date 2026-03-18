import express from 'express';
import { deleteARequest, getJoinRequests, getStudentSendRequest, processJoinRequest } from '../controller/requestController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

//GET - get join requests
router.get('/:groupId/requests', authMiddleware, getJoinRequests);

//PUT - handle join requests (Approve/Decline)
router.put('/:groupId/requests/:requestId', authMiddleware, processJoinRequest);

router.get('/student_request', authMiddleware, getStudentSendRequest)

router.delete('/delete_student_request', authMiddleware, deleteARequest)

export default router;