import express from 'express';
import { getJoinRequests, processJoinRequest } from '../controller/requestController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

//GET - get join requests
router.get('/groups/:groupId/requests', authMiddleware, getJoinRequests);

//PUT - handle join requests (Approve/Decline)
router.put('/groups/:groupId/requests/:requestId', authMiddleware, processJoinRequest);

export default router;