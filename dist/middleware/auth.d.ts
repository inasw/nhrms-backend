import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types';
import { UserRole } from '@prisma/client';
export declare const authenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response>;
export declare const authorize: (roles: UserRole[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void | Response;
export declare const requireDoctor: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void | Response;
export declare const requirePatient: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void | Response;
export declare const requireHospitalAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void | Response;
export declare const requireSuperAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void | Response;
export declare const requireAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void | Response;
//# sourceMappingURL=auth.d.ts.map