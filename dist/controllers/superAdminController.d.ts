import type { Response } from "express";
import type { AuthenticatedRequest } from "../types";
export declare class SuperAdminController {
    static getFacilities(req: AuthenticatedRequest, res: Response): Promise<Response>;
    static registerFacility(req: AuthenticatedRequest, res: Response): Promise<Response>;
    static getFacilityDetails(req: AuthenticatedRequest, res: Response): Promise<Response>;
    static updateFacility(req: AuthenticatedRequest, res: Response): Promise<Response>;
    static getFacilityAdmins(req: AuthenticatedRequest, res: Response): Promise<Response>;
    static createFacilityAdmin(req: AuthenticatedRequest, res: Response): Promise<Response>;
    static updateFacilityAdmin(req: AuthenticatedRequest, res: Response): Promise<Response>;
    static getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<Response>;
    static getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<Response>;
}
//# sourceMappingURL=superAdminController.d.ts.map