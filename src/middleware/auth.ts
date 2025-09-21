import type { Response, NextFunction } from 'express';
import { verifyToken } from '../config/jwt';
import type { AuthenticatedRequest } from '../types';
import prisma from '../config/database';
import { UserRole } from '@prisma/client';

// List of valid UserRole enum values for validation
const validRoles = Object.values(UserRole) as string[];

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    // Validate role
    if (!validRoles.includes(decoded.role)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid user role',
      });
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        nationalId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        password: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
        doctor: { select: { hospitalId: true } },
        adminUser: { select: { hospitalId: true } },
        labTech: { select: { hospitalId: true } },
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or inactive user',
      });
    }

    req.user = {
      ...user,
      hospitalId:
        user.doctor?.hospitalId ||
        user.adminUser?.hospitalId ||
        user.labTech?.hospitalId,
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
};

export const authorize = (roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void | Response => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
    }

    return next();
  };
};

// Role-specific middleware
export const requireDoctor = authorize([UserRole.doctor]);
export const requirePatient = authorize([UserRole.patient]);
export const requireHospitalAdmin = authorize([UserRole.hospital_admin]);
export const requireSuperAdmin = authorize([UserRole.super_admin, UserRole.moh_admin]);
export const requireAdmin = authorize([UserRole.hospital_admin, UserRole.super_admin, UserRole.moh_admin]);