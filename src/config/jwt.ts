import jwt from "jsonwebtoken"
import type { JWTPayload } from "../types"

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key"
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h"
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d"

export const generateAccessToken = (payload: Omit<JWTPayload, "iat" | "exp">): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions)
}

export const generateRefreshToken = (payload: Omit<JWTPayload, "iat" | "exp">): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN } as jwt.SignOptions)
}

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload
}
