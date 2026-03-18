import type { Request, Response } from "express";
import { prisma } from '../lib/prisma';
import { TaskStatus, TaskCategory } from "../generated/prisma";

/*
 * Create Task Controller
 * Create Feedback Controller
 * 
 * Update Task Controller
 * Update Feedback Controller
 *
 */

//1.Create Task Controller
export const createTask = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { title, desc, status, category, assign } = req.body;
        
        //check login status
        if (!userId) {
            return res.status(401).json({
                success:false,
                message: "Not authenticated"
            });
        }
        
        //check required fields
        if (!title || !desc || !status || !category) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: title, desc, status, category are needed."
            });
        }

        //check if status is valid
        if (!Object.values(TaskStatus).includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: 
                ${Object.values(TaskStatus).join(', ')}`
            });
        }
        
        //check if category is valid
        if (!Object.values(TaskCategory).includes(category)) {
            return res.status(400).json({
                success: false,
                message: `Invalid category. Must be one of: 
                ${Object.values(TaskCategory).join(', ')}`
            });
        }

        //check if assign is a valid array
        if (assign && !Array.isArray(assign)) {
            return res.status(400).json({
                success: false,
                message: "Assign must be an array of student Ids"
            });
        }

        //create task body
        const task = await prisma.task.create({
            data: {
                title: title.trim(),
                desc: desc.trim(),
                status: status,
                category: category,
                assign: assign || []
            },
            include: {
                feedBack: true
            }
        });

        return res.status(201).json({
            success: true, 
            message: "Task created successfully",
            data: task
        });

    } catch (e) {
        console.error("Create task error:", e);
        return res.status(500).json({
            success: false,
            message: "Server error"
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
                success:false,
                message: "Not authenticated"
            });
        }        

        //check if taskId is valid
        if (!taskId) {
            return res.status(400).json({
                success: false,
                message: "Task ID is required"
            });
        }

        //check if message exists
        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "Feedback message is required"
            });
        }

        //check if task exists
        const task = await prisma.task.findUnique({
            where: { id: taskId as string }
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        //create feedback
        const feedback = await prisma.feedBack.create({
            data: {
                message: message.trim(),
                studentId: userId, //current userId
                taskId: taskId as string
            },
            include: {
                //return student information
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                //return task information
                task: {
                    select: {
                        id: true,
                        title: true,
                        status: true
                    }
                }
            }
        });

        return res.status(201).json({
            success: true,
            message: "Feedback created successfully",
            data: feedback
        });

    } catch (e) {
        console.error("Create feedback error:", e);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


//3.Update Task Controller
export const updateTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { title, desc, status, category, assign } = req.body;    

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
        if (!Object.values(TaskStatus).includes(status)){
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: 
                ${Object.values(TaskStatus).join(', ')}`
            });
        }
        updateData.status = status;
    }
    if (category) {
        //check if category is valid    
        if (!Object.values(TaskCategory).includes(category)){
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: 
                ${Object.values(TaskCategory).join(', ')}`
            });
        }        
        updateData.category = category;
    }
    if (assign) {
        if (!Array.isArray(assign)) {
            return res.status(400).json({
                success: false,
                message: "Assign must be an array of student Ids"
            });
        }
        updateData.assign = {
            set: assign   //update into new array
        }
    }

    //check if there is any field need to update
    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
            success: false,
            message: "No valid fields to update provided"
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
        assign: true,
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

