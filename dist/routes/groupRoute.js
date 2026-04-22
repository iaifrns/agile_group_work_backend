"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const groupController_1 = require("../controller/groupController");
const router = express_1.default.Router();
// Group management routes (all protected by authentication middleware)
// Get group details by ID
router.get("/:groupId/detail", authMiddleware_1.authMiddleware, groupController_1.getGroupDetails);
// Update group name (admin only)
router.put("/:groupId/update", authMiddleware_1.authMiddleware, groupController_1.updateGroupName);
// Add member to group (admin only)
router.post("/:groupId/members", authMiddleware_1.authMiddleware, groupController_1.addMemberToGroup);
// Remove member from group (admin only, cannot remove self)
router.delete("/:groupId/members/:studentId", authMiddleware_1.authMiddleware, groupController_1.removeMemberFromGroup);
// Create a new group (creator becomes admin)
router.post("/create", authMiddleware_1.authMiddleware, groupController_1.createGroup);
// Delete a group (admin only, cascades to members)
router.delete("/delete_group/:groupId", authMiddleware_1.authMiddleware, groupController_1.deleteGroup);
// Send join request to a group
//router.post("/:groupId/join-request", authMiddleware, sendJoinRequest);
router.post("/:groupId/join_request", authMiddleware_1.authMiddleware, groupController_1.sendJoinRequest);
// GET all groups (excluding groups user is already a member of)
router.get("/", authMiddleware_1.authMiddleware, groupController_1.getAllGroups);
// GET all groups that the authenticated student is a member of
router.get("/get_groups_of_student", authMiddleware_1.authMiddleware, groupController_1.getAllGroupsAStudentIsIn);
exports.default = router;
