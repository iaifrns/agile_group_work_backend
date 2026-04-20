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
  getAllGroupsAStudentIsIn,
} from "../controller/groupController";

const router = express.Router();

// Group management routes (all protected by authentication middleware)

// Get group details by ID
router.get("/:groupId/detail", authMiddleware, getGroupDetails);

// Update group name (admin only)
router.put("/:groupId/update", authMiddleware, updateGroupName);

// Add member to group (admin only)
router.post("/:groupId/members", authMiddleware, addMemberToGroup);

// Remove member from group (admin only, cannot remove self)
router.delete(
  "/:groupId/members/:studentId",
  authMiddleware,
  removeMemberFromGroup,
);

// Create a new group (creator becomes admin)
router.post("/create", authMiddleware, createGroup);

// Delete a group (admin only, cascades to members)
router.delete("/delete_group/:groupId", authMiddleware, deleteGroup);

// Send join request to a group
//router.post("/:groupId/join-request", authMiddleware, sendJoinRequest);
router.post("/:groupId/join_request", authMiddleware, sendJoinRequest);

// GET all groups (excluding groups user is already a member of)
router.get("/", authMiddleware, getAllGroups);

// GET all groups that the authenticated student is a member of
router.get("/get_groups_of_student", authMiddleware, getAllGroupsAStudentIsIn);

export default router;