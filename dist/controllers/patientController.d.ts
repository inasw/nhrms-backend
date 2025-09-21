import type { Response } from "express";
import type { AuthenticatedRequest } from "../types";
export declare class PatientController {
    static submitVitals(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getVitals(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getLatestVitals(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getAppointments(req: AuthenticatedRequest, res: Response): Promise<void>;
    static requestAppointment(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getMedicalRecords(req: AuthenticatedRequest, res: Response): Promise<void>;
    static searchDoctors(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getHealthAlerts(req: AuthenticatedRequest, res: Response): Promise<void>;
    private static getPatientId;
    private static checkVitalAlerts;
}
//# sourceMappingURL=patientController.d.ts.map