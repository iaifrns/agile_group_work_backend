import { Router } from "express";
import {
    getAllGroups,
    getGroupDetails,
    updateGroupName,
    addMemberToGroup,
    removeMemberFromGroup,
    deleteGroup,
} from "../controller/groupController";

const router = Router();

// GET all groups
router.get("/", getAllGroups);

// GET single group details
router.get("/:groupId", getGroupDetails);

// PATCH update group name
router.patch("/:groupId", updateGroupName);

// POST add member to group
router.post("/:groupId/members", addMemberToGroup);

// DELETE remove member from group
router.delete("/:groupId/members/:studentId", removeMemberFromGroup);

// DELETE group
router.delete("/:groupId", deleteGroup);

export default router;