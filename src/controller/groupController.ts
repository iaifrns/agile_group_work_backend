import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { GroupStatus } from "../generated/prisma";
import { NAVIGATE } from "../types/navigate";
import { getIo } from "../socket";

/*
 * Group Controller
 * Fetches Group details
 * Update Group name
 * Adds Member to Group
 * Remove Member
 * Deletes Group
 *
 * All operations require user to be Group Admin
 */

type MemberList = {
  student: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    phoneNumber: string;
    classLevel: string | null;
  };
};

// Helper: Verify group exists and current user is admin
const getGroupVerifyAdmin = async (
  groupId: string | string[],
  userId: string,
  res: Response,
) => {
  const group = await prisma.group.findUnique({
    where: { id: groupId as string },
  });
  if (!group) {
    res.status(404).json({ success: false, error: "Group Not Found" });
    return null;
  }
  if (group.admin !== userId) {
    res.status(403).json({ success: false, error: "Admin only" });
    return null;
  }
  return group;
};

// Helper: Get full name of a student by ID
const getStudentName = async (student_id: string) => {
  const student = await prisma.student.findUnique({
    where: { id: student_id },
    select: { firstName: true, lastName: true },
  });

  return student?.firstName + " " + student?.lastName;
};

// Helper: Extract student IDs from member list
const returnSTudentsId = (members: MemberList[]) => {
  return members.map((member) => member.student.id);
};

//helper function to get all members of a group
const getGroupMembers = async (groupId: string) => {
  const members = await prisma.groupMembers.findMany({
    where: {
      group_id: groupId,
    },
    select: {
      student: true,
    },
  });

  return members;
};

//Get the Group details - Retrieves full group details - Does NOT require Admin
export const getGroupDetails = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;

    const group = await prisma.group.findUnique({
      where: {
        id: groupId as string,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        admin: true,
        groupMembers: {
          where: {
            status: GroupStatus.MEMBER,
          },
          select: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                classLevel: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      // Return 404 if it doesn't exist
      return res
        .status(404)
        .json({ success: false, message: "Group not found." });
    }

    const members = group.groupMembers.map((gm) => gm.student);

    return res.status(200).json({
      success: true,
      data: {
        id: group.id,
        name: group.name,
        createdAt: group.createdAt,
        admin: group.admin,
        members,
      },
    });
  } catch (error) {
    console.error("getGroupDetails error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Update the Group name - Only Admin can update
export const updateGroupName = async (req: Request, res: Response) => {
  const user = (req as any).user; // Authenticated user from middleware
  try {
    const { groupId } = req.params;
    const { name } = req.body;

    // Validate group name input
    if (!name || typeof name !== "string" || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Name is required" });
    }

    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId as string },
    });

    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found." });
    }
    // Verify current user is the group admin
    if (group.admin !== user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden (admin only)" });
    }

    // Transaction: update group name and notify all members
    const updated = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.group.update({
        where: { id: groupId as string },
        data: { name: name.trim() },
        select: { id: true, name: true, createdAt: true, admin: true },
      });

      // Get all group members to send notifications
      const members = await getGroupMembers(groupId as string);

      // Create notification for all members about name change
      await transaction.notification.create({
        data: {
          message:
            user.firstName +
            " " +
            user.lastName +
            " change the name of the group to " +
            name,
          navigate: NAVIGATE.GROUPDETAIL,
          students: {
            connect: returnSTudentsId(members).map((i) => {
              return { id: i };
            }),
          },
        },
      });
      return updated;
    });

    // Emit real-time notification via Socket.IO
    const io = getIo();

    io.emit("notification", {
      message: "new notification",
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("updateGroupName error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Add Member to Group - Admin Only
export const addMemberToGroup = async (req: Request, res: Response) => {
  const user = (req as any).user; // Authenticated user from middleware
  try {
    const { groupId } = req.params;
    const { studentId } = req.body;

    // Validate student ID input
    if (!studentId || typeof studentId !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "StudentId is required" });
    }

    // Verify user is group admin and group exists
    const group = await getGroupVerifyAdmin(groupId, user.id, res);
    if (!group) return;

    // Check if student to add exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found." });
    }

    // Check if student is already a member
    const existing = await prisma.groupMembers.findFirst({
      where: { group_id: groupId as string, student_id: studentId },
    });

    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Student is already a member" });
    }

    // Transaction: add member and create notifications
    await prisma.$transaction(async (transaction) => {
      // Add student as member
      await transaction.groupMembers.create({
        data: {
          student_id: studentId,
          group_id: groupId as string,
          status: GroupStatus.MEMBER,
        },
      });

      // Get all current members for notification
      const members = await getGroupMembers(groupId as string);

      // Create two notifications: one for all members, one specifically for the added student
      await Promise.all([
        // Notify all existing members about new member joining
        transaction.notification.create({
          data: {
            message:
              student.firstName +
              " " +
              student.lastName +
              " join the group " +
              group.name,
            navigate: NAVIGATE.GROUPDETAIL,
            students: {
              connect: returnSTudentsId(members).map((i) => ({ id: i })),
            },
          },
        }),
        // Notify the added student directly
        transaction.notification.create({
          data: {
            message:
              student.firstName +
              " " +
              student.lastName +
              " you have been added to " +
              group.name,
            isRead: [],
            navigate: NAVIGATE.GROUPDETAIL,
            students: {
              connect: [{ id: studentId }],
            },
          },
        }),
      ]);
    });

    // Emit real-time notification via Socket.IO
    const io = getIo();

    io.emit("notification", {
      message: "new notification",
    });

    return res
      .status(201)
      .json({ success: true, message: "Member added successfully." });
  } catch (error) {
    console.error("addMemberToGroup error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Remove Member from Group - Admin Only - Admin cannot remove themselves
export const removeMemberFromGroup = async (req: Request, res: Response) => {
  const user = (req as any).user; // Authenticated user from middleware
  try {
    const { groupId, studentId } = req.params;
    // Verify user is group admin and group exists
    const group = await getGroupVerifyAdmin(groupId, user.id, res);
    if (!group) return;

    // Prevent admin from removing themselves
    if (studentId === group.admin) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot remove Admin" });
    }

    // Check if membership exists
    const membership = await prisma.groupMembers.findFirst({
      where: { group_id: groupId as string, student_id: studentId as string },
    });

    if (!membership) {
      return res
        .status(404)
        .json({ success: false, message: "Membership not found." });
    }

    // Transaction: remove member and create notifications
    await prisma.$transaction(async (transaction) => {
      // Delete the membership record
      await transaction.groupMembers.delete({ where: { id: membership.id } });

      // Get removed student's name and remaining members list
      const [name, members] = await Promise.all([
        getStudentName(studentId as string),
        getGroupMembers(group.id),
      ]);

      // Create notifications: one for remaining members, one for removed student
      await Promise.all([
        // Notify remaining members about removal
        transaction.notification.create({
          data: {
            message: "admin removed " + name + " from " + group.name + "group",
            navigate: NAVIGATE.GROUPDETAIL,
            students: {
              connect: returnSTudentsId(members).map((i) => ({ id: i })),
            },
          },
        }),
        // Notify the removed student
        transaction.notification.create({
          data: {
            message: "admin removed you from " + group.name + "group",
            navigate: NAVIGATE.GROUPDETAIL,
            students: {
              connect: [{ id: membership.student_id }],
            },
          },
        }),
      ]);
    });

    // Emit real-time notification via Socket.IO
    const io = getIo();

    io.emit("notification", {
      message: "new notification",
    });

    return res
      .status(200)
      .json({ success: true, message: "Member removed successfully." });
  } catch (error) {
    console.error("removeMemberFromGroup error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Deleting a Group - Only Admin - Related groupMembers records are removed auto via cascade delete
export const deleteGroup = async (req: Request, res: Response) => {
  const user = (req as any).user; // Authenticated user from middleware
  try {
    const { groupId } = req.params;
    // Verify user is group admin and group exists
    const group = await getGroupVerifyAdmin(groupId, user.id, res);
    if (!group) return;

    // Transaction: delete group and notify all members
    await prisma.$transaction(async (transaction) => {
      // Get all members before deletion for notification
      const members = await getGroupMembers(groupId as string);
      // Delete the group (cascade deletes groupMembers automatically)
      await transaction.group.delete({ where: { id: groupId as string } });
      // Create notification for all former members
      await transaction.notification.create({
        data: {
          message: group.name + " was deleted",
          students: {
            connect: returnSTudentsId(members).map((i) => ({ id: i })),
          },
          navigate: "",
        },
      });
    });

    // Emit real-time notification via Socket.IO
    const io = getIo();

    io.emit("notification", {
      message: "new notification",
    });

    return res
      .status(200)
      .json({ success: true, message: "Group deleted successfully." });
  } catch (error) {
    console.error("deleteGroup error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// API End point to return all group
// Get all groups - for frontend display
export const getAllGroups = async (req: Request, res: Response) => {
  const user = (req as any).user; // Authenticated user from middleware
  try {
    // Fetch groups that the user is NOT already a member of
    const groups = await prisma.group.findMany({
      where: {
        groupMembers: {
          none: {
            student_id: user.id, // Exclude groups where user is already a member
          },
        },
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        admin: true,
        _count: {
          select: {
            groupMembers: true, // Count total members in the group
          },
        },
      },
      orderBy: {
        createdAt: "desc", // Newest groups first
      },
    });

    // Format group data for cleaner response
    const formattedGroups = groups.map((group) => ({
      id: group.id,
      name: group.name,
      createdAt: group.createdAt,
      admin: group.admin,
      membersCount: group._count.groupMembers,
    }));

    return res.status(200).json({
      success: true,
      count: formattedGroups.length,
      data: formattedGroups,
    });
  } catch (error) {
    console.error("getAllGroups error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// API Endpoint for group creation
// Create Group - creator becomes admin
export const createGroup = async (req: Request, res: Response) => {
  //const user = (req as any).user;
  try {
    const { name, id } = req.body;
    //const adminId = user.id;

    // Validate group name input
    if (!name || typeof name !== "string" || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Group name is required" });
    }

    // Validate user ID input
    if (!id || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Group name is required",
      });
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Prevent duplicate group names
    const existingGroup = await prisma.group.findFirst({
      where: {
        name: name.trim(),
      },
    });

    if (existingGroup) {
      return res.status(409).json({
        success: false,
        message: "A group with this name already exists",
      });
    }

    // Transaction: create group, add creator as member, and create notification
    const group = await prisma.$transaction(async (tx) => {
      const newGroup = await tx.group.create({
        data: {
          name: name.trim(),
          admin: id, // Creator becomes admin
        },
      });

      // Add creator as first member
      await tx.groupMembers.create({
        data: {
          group_id: newGroup.id,
          student_id: id,
          status: GroupStatus.MEMBER,
        },
      });

      // Send confirmation notification to creator
      await tx.notification.create({
        data: {
          message: "group created successfully",
          students: {
            connect: [{ id: student.id }],
          },
          navigate: NAVIGATE.GROUPDETAIL,
        },
      });

      return newGroup;
    });

    // Emit real-time notification via Socket.IO
    const io = getIo();

    io.emit("notification", {
      message: "new notification",
    });

    return res.status(201).json({
      success: true,
      message: "Group created successfully",
      data: {
        id: group.id,
        name: group.name,
        admin: group.admin,
        createdAt: group.createdAt,
      },
    });
  } catch (error) {
    console.error("createGroup error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// API FOR SEND JOIN REQUEST
export const sendJoinRequest = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const studentId = (req as any).user?.id; // Authenticated user from middleware

    // Verify user is authenticated
    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId as string },
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found.",
      });
    }

    // Prevent admin from sending join request to their own group
    if (group.admin === studentId) {
      return res.status(400).json({
        success: false,
        message: "Admin is already part of this group.",
      });
    }

    // Check if student already has a membership/request in this group
    const existingRecord = await prisma.groupMembers.findFirst({
      where: {
        group_id: groupId as string,
        student_id: studentId,
      },
    });

    if (existingRecord) {
      if (existingRecord.status === GroupStatus.MEMBER) {
        return res.status(409).json({
          success: false,
          message: "Student is already a member of this group.",
        });
      }

      if (existingRecord.status === GroupStatus.REQUEST) {
        return res.status(409).json({
          success: false,
          message: "Join request already sent.",
        });
      }
    }

    // Transaction: create join request and send notifications
    const joinRequest = await prisma.$transaction(async (transaction) => {
      const joinRequest = await transaction.groupMembers.create({
        data: {
          group_id: groupId as string,
          student_id: studentId,
          status: GroupStatus.REQUEST, // Pending approval
        },
      });

      // Create notifications: one for student, one for group admin
      await Promise.all([
        // Confirm to student that request was sent
        transaction.notification.create({
          data: {
            message: "Join Request send to " + group.name,
            navigate: NAVIGATE.REQUESTLIST,
            students: {
              connect: [{ id: studentId }],
            },
          },
        }),
        // Notify group admin about incoming request
        transaction.notification.create({
          data: {
            message: "A request to join " + group.name + "was send",
            navigate: NAVIGATE.REQUESTLIST,
            students: {
              connect: [{ id: group.admin }],
            },
          },
        }),
      ]);

      return joinRequest;
    });

    // Emit real-time notification via Socket.IO
    const io = getIo();

    io.emit("notification", {
      message: "new notification",
    });

    return res.status(201).json({
      success: true,
      message: "Join request sent successfully.",
      data: {
        id: joinRequest.id,
        group_id: joinRequest.group_id,
        student_id: joinRequest.student_id,
        status: joinRequest.status,
      },
    });
  } catch (error) {
    console.error("sendJoinRequest error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get all groups that a student is a member of
export const getAllGroupsAStudentIsIn = async (req: Request, res: Response) => {
  const user = (req as any).user; // Authenticated user from middleware
  try {
    // Fetch groups where user has MEMBER status
    const groups = await prisma.group.findMany({
      where: {
        groupMembers: {
          some: {
            student_id: user.id,
            status: GroupStatus.MEMBER, // Only approved memberships
          },
        },
      },
      select: {
        id: true,
        name: true,
        admin: true,
      },
    });

    return res.json({
      status: "success",
      groups,
    });
  } catch (e) {
    console.log(e);
    return res.json({
      status: "error",
      message: "something went wrong try later",
    });
  }
};