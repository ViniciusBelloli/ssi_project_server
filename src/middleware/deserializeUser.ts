import { get } from "lodash";
import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/jwt.utils";
import { reIssueAccessToken } from "../routes/auth";
import { addDays } from "date-fns";
import { prisma } from "../lib/prisma"

const deserializeUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const accessToken = get(req, "headers.authorization", "").replace(
    /^Bearer\s/,
    ""
  );

  const refreshTokenResp = get(req, "headers.x-refresh")

  if (!accessToken) {
    // return next();
    return res.status(401).json({ auth: false, message: 'No token provided.' });
  }

  const { decoded, expired } = verifyJwt(accessToken, "accessTokenPublicKey");

  if (decoded) {
    res.locals.user = decoded;
    return next();
  }

  if (expired && refreshTokenResp) {
    let refreshToken = <string>refreshTokenResp
    const newAccessToken = await reIssueAccessToken({ refreshToken });

    if (newAccessToken) {
      res.setHeader("x-access-token", newAccessToken);
    }

    const result = verifyJwt(newAccessToken as string, "accessTokenPublicKey");
    let currentDate = new Date()
    let expirationDate = addDays(currentDate, 7)
    let userId = <string><unknown>get(result.decoded, "id")

    await prisma.token.create({
      data: {
        accessToken,
        refreshToken,
        expirationDate,
        userId,
      }
    })

    res.locals.user = result.decoded;
    return next();
  }

  return next();
};

export default deserializeUser;
