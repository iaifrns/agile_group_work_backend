import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { TaskStatus, TaskCategory, TaskType } from "../generated/prisma";

/*
 * Create Task Controller
 * Create Feedback Controller
 * Get All Tasks Controller
 * Get Single Task Controller
 * Update Task Controller
 * Update Feedback Controller
 * Delete Task Controller
 */

//1.Create Task Controller
export const createTask = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const {
      title,
      desc,
      status,
      category,
      type,
      students: studentList,
      groupId,
      dueDate,
    } = req.body;

    //check required fields
    if (!title || !desc || !status || !category) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: title, desc, status, category are needed.",
      });
    }

    //check if status is valid
    if (!Object.values(TaskStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: 
                ${Object.values(TaskStatus).join(", ")}`,
      });
    }

    //check if category is valid
    if (!Object.values(TaskCategory).includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: 
                ${Object.values(TaskCategory).join(", ")}`,
      });
    }

    //check if type is valid
    if (!Object.values(TaskType).includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid type. Must be one of:
                ${Object.values(TaskType).join(", ")}`,
      });
    }

    //check students array
    if (
      !studentList ||
      !Array.isArray(studentList) ||
      studentList.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Group tasks require at least one assigned student",
      });
    }

    //verify for Group task
    if (type.includes("GROUP")) {
      //check groupID
      if (!groupId) {
        return res.status(400).json({
          success: false,
          message: "Group tasks require a groupId",
        });
      }

      //check if group exists
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
          groupMembers: true,
        },
      });

      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Group not found",
        });
      }

      //check if current user is group member
      const isMember = group.groupMembers.some(
        (member) => member.student_id === userId,
      );
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: "You must be a member of this group to create group task",
        });
      }

      //check if assigned students all belong to this group
      const memberIds = group.groupMembers.map((m) => m.student_id);
      const invalidAssignees = studentList.filter((id) =>
        memberIds.includes(id),
      );

      if (invalidAssignees.length === studentList.length) {
        return res.status(400).json({
          success: false,
          message: `These students are not members of the group: 
                    ${invalidAssignees.join(", ")}`,
        });
      }

      const task = await prisma.task.create({
        data: {
          title: title.trim(),
          desc: desc.trim(),
          status: status,
          category: category,
          type: type,
          students: {
            connect: studentList,
          },
          groupId: group.id,
          dueDate,
        },
        select: {
          id: true,
          title: true,
          desc: true,
          status: true,
          category: true,
          type: true,
          groupId: true,
          students: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
              classLevel: true,
            },
          },
          feedBack: true,
          dueDate: true,
          group: {
            select: {
              id: true,
              name: true,
              admin: true,
              createdAt: true,
            },
          },
        },
      });

      return res.status(201).json({
        success: true,
        message: "Group task created successfully",
        data: {
          ...task,
          groupId: groupId,
        },
      });
    }

    //verify personal task
    if (type.includes("PERSONAL")) {
      console.error(studentList);

      //create task body
      const task = await prisma.task.create({
        data: {
          title: title.trim(),
          desc: desc.trim(),
          status: status,
          category: category,
          type: type,
          students: {
            connect: studentList, // link to students: [{id: ""}]
          },
          dueDate,
        },
        select: {
          id: true,
          title: true,
          desc: true,
          status: true,
          category: true,
          type: true,
          groupId: true,
          students: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
              classLevel: true,
            },
          },
          feedBack: true,
          dueDate: true,
        },
      });

      return res.status(201).json({
        success: true,
        message: "Personal task created successfully",
        data: task,
      });
    }
  } catch (e) {
    console.error("Create task error:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

//2.Create Feedback Controller
export const createFeedback = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { message } = req.body;
    const { taskId } = req.params;

    //check login status
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    //check if taskId is valid
    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: "Task ID is required",
      });
    }

    //check if message exists
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Feedback message is required",
      });
    }

    //check if task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId as string },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    //create feedback
    const feedback = await prisma.feedBack.create({
      data: {
        message: message.trim(),
        studentId: userId, //current userId
        taskId: taskId as string,
      },
      include: {
        //return students information
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        //return task information
        task: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Feedback created successfully",
      data: feedback,
    });
  } catch (e) {
    console.error("Create feedback error:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

//3.Update Task Controller
export const updateTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { title, desc, status, category, student } = req.body;

    //check if taskId exist
    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: "Task ID is required",
      });
    }

    //check if req.body exist
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message:
          "Request body is missing. Maybe forget Content-Type: application/json?",
      });
    }

    //check if req.body contains data
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Empty request body. Provide at least one field to update.",
      });
    }

    const updateData: any = {};

    // if one item === null or undefined (trim blank)
    if (title?.trim()) {
      updateData.title = title.trim();
    }
    if (desc?.trim()) {
      updateData.desc = desc.trim();
    }
    if (status) {
      //check if status is valid
      if (!Object.values(TaskStatus).includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: 
                ${Object.values(TaskStatus).join(", ")}`,
        });
      }
      updateData.status = status;
    }
    if (category) {
      //check if category is valid
      if (!Object.values(TaskCategory).includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: 
                ${Object.values(TaskCategory).join(", ")}`,
        });
      }
      updateData.category = category;
    }
    if (student) {
      if (!Array.isArray(student)) {
        return res.status(400).json({
          success: false,
          message: "sudent must be an array of student Ids",
        });
      }
      updateData.students = {
        set: student, //update into new array
      };
    }

    //check if there is any field need to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update provided",
      });
    }

    //update database
    const updateTask = await prisma.task.update({
      where: {
        id: taskId as string,
      },
      data: updateData,
      select: {
        id: true,
        title: true,
        desc: true,
        status: true,
        category: true,
        //sudent: true,
      },
    });

    //return status message
    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: updateTask,
    });
  } catch (error) {
    console.error("Update task error:", error);

    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };

      //P2025 in Prisma = 'Record to update not found'
      if (prismaError.code === "P2025") {
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }

      //other Prisma errors
      if (prismaError.code?.startsWith("P")) {
        return res.status(400).json({
          success: false,
          message: `Database error: ${error.code}`,
        });
      }

      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
};

//3.Update Task assign Controller
export const updateTaskMembers = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { members, oldmembers } = req.body;

    //check if taskId exist
    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: "Task ID is required",
      });
    }

    //check if req.body exist
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message:
          "Request body is missing. Maybe forget Content-Type: application/json?",
      });
    }

    //check if req.body contains data
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Empty request body. Provide at least one field to update.",
      });
    }

    if (members) {
      if (!Array.isArray(members)) {
        return res.status(400).json({
          success: false,
          message: "sudent must be an array of student Ids",
        });
      }
    }

    //update database
    const updateTask = await prisma.task.update({
      where: {
        id: taskId as string,
      },
      data: {
        students: {
            disconnect: oldmembers,
            connect: members
        }
      },
      select: {
        students: true,
      },
    });

    //return status message
    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: updateTask,
    });
  } catch (error) {
    console.error("Update task error:", error);

    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };

      //P2025 in Prisma = 'Record to update not found'
      if (prismaError.code === "P2025") {
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }

      //other Prisma errors
      if (prismaError.code?.startsWith("P")) {
        return res.status(400).json({
          success: false,
          message: `Database error: ${error.code}`,
        });
      }

      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
};

// Delete Task - Admin Only
export const deleteTask = async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const { taskId } = req.params;

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId as string },
    });
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    /*
        Admin check - User must be admin of at least oen group
        Once Task has groupId, update this method
         */
    const adminGroup = await prisma.group.findFirst({
      where: { admin: user.id },
    });
    if (!adminGroup) {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden. Admin Only" });
    }

    // Delete task - feedback records removed automatically via cascade
    await prisma.task.delete({ where: { id: taskId as string } });

    return res.status(200).json({ success: true, message: "Task Deleted" });
  } catch (error) {
    console.error("Delete task error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getFeedbackForTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    // check if taskId is provided
    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: "Task ID is required",
      });
    }

    // check if task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId as string },
      select: {
        id: true,
        title: true,
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // get all feedback for the task, newest first
    const feedbacks = await prisma.feedBack.findMany({
      where: {
        taskId: taskId as string,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        message: true,
        createdAt: true,
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      count: feedbacks.length,
      task: task,
      data: feedbacks,
    });
  } catch (error) {
    console.error("Get feedback for task error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// GET all tasks
export const getAllTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      select: {
        id: true,
        title: true,
        desc: true,
        status: true,
        category: true,
        type: true,
        _count: {
          select: {
            feedBack: true,
            students: true,
          },
        },
        students: true,
        dueDate: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const formattedTasks = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      desc: task.desc,
      status: task.status,
      category: task.category,
      type: task.type,
      feedbackCount: task._count.feedBack,
      studentsCount: task._count.students,
      students: task.students,
      due: task.dueDate,
      createdAt: task.createdAt,
    }));

    return res.status(200).json({
      success: true,
      count: formattedTasks.length,
      data: formattedTasks,
    });
  } catch (error) {
    console.error("Get all tasks error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// GET single task by ID
export const getTaskById = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: "Task ID is required",
      });
    }

    const task = await prisma.task.findUnique({
      where: {
        id: taskId as string,
      },
      select: {
        id: true,
        title: true,
        desc: true,
        status: true,
        category: true,
        type: true,
        dueDate: true,
        createdAt: true,
        groupId: true,
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            classLevel: true,
            phoneNumber: true,
          },
        },
        feedBack: {
          select: {
            id: true,
            message: true,
            createdAt: true,
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("Get task by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
