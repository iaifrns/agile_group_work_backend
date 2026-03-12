import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  createGroup,
  getAllGroups,
  getGroupDetails,
  updateGroupName,
  addMemberToGroup,
  removeMemberFromGroup,
  deleteGroup,
  sendJoinRequest,
} from "../controller/groupController";

const router = express.Router();
router.get("/:groupId", authMiddleware, getGroupDetails);
router.put("/:groupId", authMiddleware, updateGroupName);
router.post("/:groupId/members", authMiddleware, addMemberToGroup);
router.delete(
  "/:groupId/members/:studentId",
  authMiddleware,
  removeMemberFromGroup,
);

// Create a new group
router.post("/create", authMiddleware, createGroup);

router.delete("/:groupId", authMiddleware, deleteGroup);

//router.post("/:groupId/join-request", authMiddleware, sendJoinRequest);
router.post("/:groupId", authMiddleware, sendJoinRequest,)

// GET all groups
router.get("/", authMiddleware, getAllGroups);

export default router;