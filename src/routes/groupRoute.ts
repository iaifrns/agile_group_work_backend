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
router.get("/:groupId/detail", authMiddleware, getGroupDetails);
router.put("/:groupId/update", authMiddleware, updateGroupName);
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
router.post("/:groupId/join_request", authMiddleware, sendJoinRequest);

// GET all groups
router.get("/", authMiddleware, getAllGroups);

router.get("/get_groups_of_student", authMiddleware, getAllGroupsAStudentIsIn);

export default router;
