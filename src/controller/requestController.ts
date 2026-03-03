/*
 * Request Controller
 * Fetch group join request
 * Approve or Decline join request
 *
 */

import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { GroupStatus } from "../generated/prisma/enums.js";

//Get group join request
export const getJoinRequests = async (req: Request, res: Response) => {
    try {
        const {userId, groupId} = req.body;
        
        //if userId exist (user already login or not)
        if (!userId) {
            return res.status(401).json({
                success:false,
                message: "Not authenticated"
            });
        }

        //Check if the group exists
        const group = await prisma.group.findUnique({
            where: {
                id: groupId as string 
            },
            select: { 
                id: true,
                admin: true,
                name: true
            }
        });

        if (!group) {
            return res.status(404).json ({
                success: false,
                message: "Group not found."
            });
        }

        //Only the admin can check requests
        if (group.admin !== userId) {
            return res.status(403).json({
                success: false,
                message: "Forbidden (admin only)"
            });
        }

        //View all join request
        const requests = await prisma.groupMembers.findMany({
            where:{
                group_id: `${ groupId }`,
                status: GroupStatus.REQUEST
            },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    }
                }
            },
            orderBy: {
                id: 'desc'
            }
        });

        const formattedRequests = requests.map(req => ({
            id: req.id,
            student: {
                id: req.student.id,
                name: `${req.student.firstName} ${req.student.lastName}`,
                email: req.student.email,
            }
        }));

        return res.status(200).json({
            success: true,
            count: formattedRequests.length,
            data: formattedRequests
        });

    } catch (error) {
        console.error("Get join requests error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


//Handle requests (Approve/Decline)
export const processJoinRequest = async (req: Request, res: Response) => {
    try{
        const { action, groupId, requestId, userId } = req.body;
        //const userId = (req as any).user?.id;

        //Verify the input
        if (!action || !['Approve', 'Decline'].includes(action)){
            return res.status(400).json({
                success: false,
                message: "Action must be 'Approve' or 'Decline'"
            });
        }

        //Check login status
        //if (!userId) {
            //return res.status(401).json({
              //  success: false,
                //message: "Not authenticated"
            //});
        //}

        //Check if group exists
        const group = await prisma.group.findUnique({
            where: {
                id: `${ groupId }`,
            },
            select: {
                id: true,
                admin: true, 
                name: true
            }
        });

        if(!group) {
            return res.status(400).json({
                success: false,
                message: "Grouop not found."
            });
        }

        //Only the admin can handle requests
        if (group.admin !== userId) {
            return res.status(403).json({
                success: false,
                message: "Forbidden (admin only)"
            });
        }

        //Looking for request
        const joinRequest = await prisma.groupMembers.findUnique({
            where: {
                id: `${ requestId }`
            },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        if(!joinRequest) {
            return res.status(400).json({
                success: false,
                message: "Join request not found."
            })
        }

        //Check if the request belong to certain group
        if (joinRequest.group_id !== groupId) {
            return res.status(400).json({
                success: false,
                message: "Request does not belong to this group."
            });
        }

        //Check if the request has been handled
        if (joinRequest.status !== GroupStatus.REQUEST) {
            return res.status(400).json({
                success: false,
                message: `Request already ${joinRequest.status === GroupStatus.MEMBER ? 'Approved':'Processed'}.`
            });
        }

        //Handle request
        if (action === 'Approve') {
            //Approve: update status to "MEMBER"
            await prisma.groupMembers.update({
                where: {
                    id: `${requestId}`
                }, 
                data: {
                    status: GroupStatus.MEMBER
                }
            });

            return res.status(200).json({
                success: true,
                message: "Request approved successfully.",
                data: {
                    requestId: requestId,
                    status: "Approved",
                    studentName: `${joinRequest.student.firstName} ${joinRequest.student.lastName}`,
                    groupName: group.name
                }
            });
    
        } else {
            //Decline: delete request record
           // await prisma.groupMembers.delete({
               // where:
           // })
        }


    } catch (error) {

    }
}
