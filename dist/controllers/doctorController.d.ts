import type { Response } from "express";
import type { AuthenticatedRequest } from "../types";
export declare class DoctorController {
    static getPatients(req: AuthenticatedRequest, res: Response): Promise<Response>;
    static getPatientDetails(req: AuthenticatedRequest, res: Response): Promise<Response>;
    static getAppointments(req: AuthenticatedRequest, res: Response): Promise<Response>;
    static createAppointment(req: AuthenticatedRequest, res: Response): Promise<Response>;
    static updateAppointment(req: AuthenticatedRequest, res: Response): Promise<Response>;
    static createMedicalRecord(req: AuthenticatedRequest, res: Response): Promise<Response>;
    static getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<Response>;
    static createLabRequest(req: AuthenticatedRequest, res: Response): Promise<Response>;
    private static getDoctorId;
}
//# sourceMappingURL=doctorController.d.ts.map