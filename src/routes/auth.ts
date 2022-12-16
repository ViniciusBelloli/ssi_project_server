import { get } from "lodash";
import { Express, Request, Response } from "express";
import config from "config";
import { prisma } from "../lib/prisma"
import { z } from "zod"
import { verifyJwt, signJwt } from "../utils/jwt.utils";
import { addDays } from 'date-fns'

export async function AuthRoutes(route: Express) {
    route.post('/auth', async (request: Request, response: Response) => {
        const createUserBody = z.object({
            email: z.string(),
            password: z.string(),
        })

        let { email, password } = createUserBody.parse(request.body)

        let user = await prisma.user.findUnique({
            where: {
                email,
            }
        })

        if (!user) {
            return response.status(404).json({})
        }

        if (!(user.password === password)) {
            return response.status(401).json({})
        }

        let token = await prisma.token.findFirst({
            where: {
                userId: user.id
            },
            orderBy: {
                expirationDate: 'desc'
            }
        })

        let accessToken = ""
        let refreshToken = ""
        let tokenData = { id: user.id }

        if (!token) {
            // create an access token
            accessToken = signJwt(
                { ...tokenData },
                "accessTokenPrivateKey",
                { expiresIn: config.get("accessTokenTtl") } // 7 days,
            );

            // create a refresh token
            refreshToken = signJwt(
                { ...tokenData },
                "refreshTokenPrivateKey",
                { expiresIn: config.get("refreshTokenTtl") } // 1 Year,
            );

            let currentDate = new Date()
            let expirationDate = addDays(currentDate, 7)

            await prisma.token.create({
                data: {
                    accessToken,
                    refreshToken,
                    expirationDate,
                    userId: user.id
                }
            })
        } else {
            accessToken = token.accessToken
            refreshToken = token.refreshToken
        }

        return response.status(200).json({
            id: user.id,
            userPublicKey: user.userPublicKey,
            userName: user.name,
            accessToken: accessToken,
            refreshToken: refreshToken
        })
    })
}

export async function reIssueAccessToken({
    refreshToken,
}: {
    refreshToken: string;
}) {
    const { decoded } = verifyJwt(refreshToken, "refreshTokenPublicKey");
    if (!decoded || !get(decoded, "id")) return false;
    let id = <string>(get(decoded, "id") || '')

    // if (!session || !session.valid) return false;
    const user = await prisma.user.findUnique({
        where: {
            id,
        }
    })

    if (!user) return false;

    let tokenData = { id: user.id }

    const accessToken = signJwt(
        { ...tokenData },
        "accessTokenPrivateKey",
        { expiresIn: config.get("accessTokenTtl") } // 15 minutes
    );

    return accessToken;
}
