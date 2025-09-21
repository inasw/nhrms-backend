import type { Response } from "express";
import type { AuthenticatedRequest } from "../types";
export declare class AdminController {
    static getHospitalInfo(req: AuthenticatedRequest, res: Response): Promise<Response>;
    static updateHospitalInfo(req: AuthenticatedRequest, res: Response): Promise<Response>;
    static getDoctors(req: AuthenticatedRequest, res: Response): Promise<Response>;
    static addDoctor(req: AuthenticatedRequest, res: Response): Promise<Response>;
    static updateDoctor(req: AuthenticatedRequest, res: Response): Promise<Response>;
    static generateReport(req: AuthenticatedRequest, res: Response): Promise<Response>;
    static getSettings(req: AuthenticatedRequest, res: Response): Promise<Response>;
    static updateSettings(req: AuthenticatedRequest, res: Response): Promise<Response>;
    static getLabTechs(req: AuthenticatedRequest, res: Response): Promise<Response>;
    static addLabTech(req: AuthenticatedRequest, res: Response): Promise<Response>;
    static updateLabTech(req: AuthenticatedRequest, res: Response): Promise<Response>;
}
//# sourceMappingURL=adminController.d.ts.map