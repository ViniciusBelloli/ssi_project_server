import { Express, Request, Response } from "express";
import { prisma } from "../lib/prisma"
import { z } from "zod"
import deserializeUser from "../middleware/deserializeUser";

export async function MessageRoutes(route: Express) {
    route.post('/message', deserializeUser, async (request: Request, response: Response) => {
        const getMessageBody = z.object({
            userFrom: z.string(),
            userReceive: z.string(),
            messageFrom: z.string(),
            messageReceive: z.string(),
        })

        let { userFrom, userReceive, messageFrom, messageReceive } = getMessageBody.parse(request.body)

        try {
            let messageResp = await prisma.messages.create({
                data: {
                    userFrom,
                    userReceive,
                    messageFrom,
                    messageReceive,
                }
            })

            return response.status(201).json(messageResp)
        } catch (error) {
            return response.status(400).json({})
        }
    })

    route.post('/message/get', deserializeUser, async (request: Request, response: Response) => {
        const getMessageBody = z.object({
            userFrom: z.string(),
            userReceive: z.string(),
        })

        let { userFrom, userReceive } = getMessageBody.parse(request.body)

        try {
            let messageResp = await prisma.messages.findMany({
                where: {
                    userFrom: { in: [userFrom, userReceive] },
                    userReceive: { in: [userReceive, userFrom] },
                },
                orderBy: {
                    createdAt: 'asc'
                },
            })

            return response.status(200).json(messageResp)
        } catch (error) {
            return response.status(400).json({})
        }
    })
}