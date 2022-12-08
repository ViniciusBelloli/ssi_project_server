import { Express, Request, Response } from "express";
import { prisma } from "../lib/prisma"
import { z } from "zod"
import * as dotenv from 'dotenv'
import deserializeUser from "../middleware/deserializeUser";
dotenv.config()

export async function UserRoutes(route: Express) {
    route.get('/users', deserializeUser, async (request: Request, response: Response) => {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                createdAt: true,
                userPublicKey: true,
                password: false,
            }
        })

        return response.json(users)
    })

    route.post('/users', deserializeUser, async (request: Request, response: Response) => {
        const createUserBody = z.object({
            name: z.string(),
            email: z.string(),
            password: z.string(),
            userPublicKey: z.string(),
            userRevokeKey: z.string(),
        })

        let { name, email, password, userPublicKey, userRevokeKey } = createUserBody.parse(request.body)

        let user = await prisma.user.findUnique({
            where: {
                email,
            }
        })

        if (!user) {
            user = await prisma.user.create({
                data: {
                    name,
                    email,
                    password,
                    userPublicKey,
                    userRevokeKey
                }
            })
        }

        return response.status(201).json(user)
    })
}