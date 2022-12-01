import express from "express";
import cors from 'cors';

import { PrismaClient } from "@prisma/client"
import { z } from "zod"

const app = express();

app.use(express.json());
app.use(cors())

const prisma = new PrismaClient({
    log: ['query']
})

app.get('/users', async (request, response) => {
    const users = await prisma.user.findMany()

    return response.json(users)
})

app.post('/users', async (request, response) => {
    const createUserBody = z.object({
        name: z.string(),
        email: z.string(),
        password: z.string(),
    })

    const { name, email, password } = createUserBody.parse(request.body)

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
            }
        })
    }

    return response.status(201).json(user)
})

app.listen(3333)