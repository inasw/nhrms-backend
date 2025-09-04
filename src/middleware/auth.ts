import type { Response, NextFunction } from "express"
import { verifyToken } from "../config/jwt"
import type { AuthenticatedRequest } from "../types"
import prisma from "../config/database"

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Access token required",
      })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, isActive: true },
    })

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: "Invalid or inactive user",
      })
    }

    req.user = {
      id: decoded.userId,
      role: decoded.role,
      hospitalId: decoded.hospitalId,
    }

    return next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    })
  }
}

export const authorize = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void | Response => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "Insufficient permissions",
      })
    }

    return next()
  }
}

// Role-specific middleware
export const requireDoctor = authorize(["doctor"])
export const requirePatient = authorize(["patient"])
export const requireHospitalAdmin = authorize(["hospital_admin"])
export const requireSuperAdmin = authorize(["super_admin", "moh_admin"])
export const requireAdmin = authorize(["hospital_admin", "super_admin", "moh_admin"])