import { Express } from "express";
import { PrismaClient } from "@prisma/client"
import { z } from "zod"
import CryptoJS from "crypto-js"

const prisma = new PrismaClient({
    log: ['query']
})

export async function UserRoutes(route: Express) {
    route.get('/users', async (request, response) => {
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

    route.post('/users', async (request, response) => {
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
            password = CryptoJS.MD5(password).toString()

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