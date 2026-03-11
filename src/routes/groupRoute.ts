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
router.delete("/:groupId", authMiddleware, deleteGroup);
// Create a new group
router.post("/create", authMiddleware, createGroup);

// GET all groups
router.get("/", authMiddleware, getAllGroups);

export default router;
