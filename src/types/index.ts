import type { Request } from 'express';
   import type { JwtPayload } from 'jsonwebtoken';
   import { User } from '@prisma/client';

   export interface AuthenticatedRequest extends Request {
      user?: User & { hospitalId?: string; pharmacyId?: string; regionAdminId?: string; region?: string };
   }

   export interface JWTPayload extends JwtPayload {
     userId: string;
     role: string;
     hospitalId?: string;
     regionAdminId?: string;
     region?: string;
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

   // Ethiopian Regions
   export const ETHIOPIAN_REGIONS = [
     "Addis Ababa",
     "Afar",
     "Amhara",
     "Benishangul-Gumuz",
     "Gambela",
     "Harari",
     "Oromia",
     "Sidama",
     "Somali",
     "SNNP",
     "Southwest Ethiopia",
     "Tigray"
   ] as const;

   export type EthiopianRegion = typeof ETHIOPIAN_REGIONS[number];

   // Region Admin specific interfaces
   export interface IRegionAdmin {
     id: string;
     userId: string;
     region: EthiopianRegion;
     permissions: string[];
     lastLogin?: Date;
     createdAt: Date;
     updatedAt: Date;
   }

   export interface IPharmacy {
     id: string;
     name: string;
     code: string;
     address: string;
     phone: string;
     email: string;
     region: string;
     licenseNumber: string;
     type?: string;
     status: string;
     regionAdminId?: string;
     createdAt: Date;
     updatedAt: Date;
   }

   export interface RegionalReport {
     metadata: {
       region: string;
       generatedAt: Date;
       reportType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
       generatedBy: string;
     };
     patientStats: {
       totalPatients: number;
       newPatientsThisMonth: number;
       activePatients: number;
       patientGrowthRate: number;
       averageVisitsPerPatient: number;
       patientsByFacility: Array<{ facilityName: string; count: number }>;
     };
     demographics: {
       ageDistribution: Record<string, number>;
       genderDistribution: Record<string, number>;
       locationDistribution: Array<{ city: string; count: number }>;
       averageAge: number;
     };
     facilityPerformance: Array<{
       facilityName: string;
       totalAppointments: number;
       completedAppointments: number;
       canceledAppointments: number;
       averageWaitTime: number;
     }>;
     serviceUtilization: {
       totalAppointments: number;
       appointmentsByType: Record<string, number>;
       labTestsOrdered: number;
       prescriptionsIssued: number;
     };
     diseasePrevalence: Array<{
       diseaseName: string;
       cases: number;
       percentage: number;
       trend: 'increasing' | 'decreasing' | 'stable';
     }>;
     pharmacyStats: {
       totalPharmacies: number;
       activePharmacies: number;
       totalPrescriptionsDispensed: number;
       topMedicationsDispensed: Array<{ medication: string; count: number }>;
     };
     staffProductivity: {
       totalDoctors: number;
       totalLabTechs: number;
       totalPharmacists: number;
       averagePatientsPerDoctor: number;
     };
   }