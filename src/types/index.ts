import type { Request } from 'express';
   import type { JwtPayload } from 'jsonwebtoken';
   import { User } from '@prisma/client';

   export interface AuthenticatedRequest extends Request {
      user?: User & { hospitalId?: string; pharmacyId?: string };
   }

   export interface JWTPayload extends JwtPayload {
     userId: string;
     role: string;
     hospitalId?: string;
   }

   export interface FaydaPatientProfile {
     id: string;
     fullName: string;
     dateOfBirth: string;
     gender: string;
     nationality: string;
     region: string;
     subcity?: string;
     woreda?: string;
     kebele?: string;
     bloodType?: string;
     allergies?: string[];
     chronicConditions?: string[];
     verificationStatus: 'verified' | 'pending' | 'expired';
   }

   export interface ApiResponse<T = any> {
     success: boolean;
     data?: T;
     message?: string;
     error?: string;
     pagination?: {
       page: number;
       limit: number;
       total: number;
       totalPages: number;
     };
   }