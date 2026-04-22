"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const requestController_1 = require("../controller/requestController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Group join request routes (all protected by authentication middleware)
// GET - get all pending join requests for a group (admin only)
router.get('/:groupId/requests', authMiddleware_1.authMiddleware, requestController_1.getJoinRequests);
// PUT - handle join request (Approve/Decline) (admin only)
router.put('/:groupId/requests/:requestId', authMiddleware_1.authMiddleware, requestController_1.processJoinRequest);
// GET - get all join requests sent by the authenticated student
router.get('/student_request', authMiddleware_1.authMiddleware, requestController_1.getStudentSendRequest);
// DELETE - delete/cancel a pending join request by ID
router.delete('/delete_student_request', authMiddleware_1.authMiddleware, requestController_1.deleteARequest);
exports.default = router;
