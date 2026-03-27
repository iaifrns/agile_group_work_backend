import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { GroupStatus } from "../generated/prisma";
import { NAVIGATE } from "../types/navigate";

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

//Helper Function
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

//helper function
const getStudentName = async (student_id: string) => {
  const student = await prisma.student.findUnique({
    where: { id: student_id },
    select: { firstName: true, lastName: true },
  });

  return student?.firstName + " " + student?.lastName;
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
  const user = (req as any).user;
  try {
    const { groupId } = req.params;
    const { name } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Name is required" });
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId as string },
    });

    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found." });
    }
    if (group.admin !== user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden (admin only)" });
    }

    const updated = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.group.update({
        where: { id: groupId as string },
        data: { name: name.trim() },
        select: { id: true, name: true, createdAt: true, admin: true },
      });

      await transaction.notification.create({
        data: {
          message:
            user.firstName +
            " " +
            user.lastName +
            " change the name of the group to " +
            name,
          isRead: false,
          navigate: NAVIGATE.GROUPDETAIL,
        },
      });
      return updated;
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("updateGroupName error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Add Member to Group - Admin Only
export const addMemberToGroup = async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const { groupId } = req.params;
    const { studentId } = req.body;

    if (!studentId || typeof studentId !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "StudentId is required" });
    }

    const group = await getGroupVerifyAdmin(groupId, user.id, res);
    if (!group) return;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found." });
    }

    const existing = await prisma.groupMembers.findFirst({
      where: { group_id: groupId as string, student_id: studentId },
    });

    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Student is already a member" });
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.groupMembers.create({
        data: {
          student_id: studentId,
          group_id: groupId as string,
          status: GroupStatus.MEMBER,
        },
      });

      await transaction.notification.create({
        data: {
          message:
            student.firstName +
            " " +
            student.lastName +
            " join the group " +
            group.name,
          isRead: false,
          navigate: NAVIGATE.GROUPDETAIL,
        },
      });
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
  const user = (req as any).user;
  try {
    const { groupId, studentId } = req.params;
    const group = await getGroupVerifyAdmin(groupId, user.id, res);
    if (!group) return;

    if (studentId === group.admin) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot remove Admin" });
    }

    const membership = await prisma.groupMembers.findFirst({
      where: { group_id: groupId as string, student_id: studentId as string },
    });

    if (!membership) {
      return res
        .status(404)
        .json({ success: false, message: "Membership not found." });
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.groupMembers.delete({ where: { id: membership.id } });
      const name = await getStudentName(studentId as string);
      await transaction.notification.create({
        data: {
          message: "admin removed " + name + " from " + group.name + "group",
          isRead: false,
          navigate: NAVIGATE.GROUPDETAIL,
        },
      });
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
  const user = (req as any).user;
  try {
    const { groupId } = req.params;
    const group = await getGroupVerifyAdmin(groupId, user.id, res);
    if (!group) return;

    await prisma.group.delete({ where: { id: groupId as string } });

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
  const user = (req as any).user;
  try {
    const groups = await prisma.group.findMany({
      where: {
        groupMembers: {
          none: {
            student_id: user.id,
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
            groupMembers: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

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

    if (!name || typeof name !== "string" || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Group name is required" });
    }

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

    //prevent duplicate group names
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

    // Create group and add creator as first member
    const group = await prisma.$transaction(async (tx) => {
      const newGroup = await tx.group.create({
        data: {
          name: name.trim(),
          admin: id,
        },
      });

      await tx.groupMembers.create({
        data: {
          group_id: newGroup.id,
          student_id: id,
          status: GroupStatus.MEMBER,
        },
      });

      return newGroup;
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
    const studentId = (req as any).user?.id;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // check if group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId as string },
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found.",
      });
    }

    // optional: prevent admin from sending join request to own group
    if (group.admin === studentId) {
      return res.status(400).json({
        success: false,
        message: "Admin is already part of this group.",
      });
    }

    // check if student already has a membership/request in this group
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

    const joinRequest = await prisma.groupMembers.create({
      data: {
        group_id: groupId as string,
        student_id: studentId,
        status: GroupStatus.REQUEST,
      },
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

export const getAllGroupsAStudentIsIn = async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const groups = await prisma.group.findMany({
      where: {
        groupMembers: {
          some: {
            student_id: user.id,
            status: GroupStatus.MEMBER,
          },
        },
      },
      select: {
        id: true,
        name: true,
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
