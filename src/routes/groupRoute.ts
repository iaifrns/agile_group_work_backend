import { Router } from "express";
import {
    createGroup,
    getAllGroups,
    getGroupDetails,
    updateGroupName,
    addMemberToGroup,
    removeMemberFromGroup,
    deleteGroup,
    //sendJoinRequest,
} from "../controller/groupController";

const router = Router();

// GET all groups
router.get("/", getAllGroups);

// Create a new group
router.post("/", createGroup);

// Send Join Request Group
//router.post("/:groupId/join-requests", sendJoinRequest);

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