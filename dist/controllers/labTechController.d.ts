import type { Response } from "express";
import type { AuthenticatedRequest } from "../types";
export declare class LabTechController {
    private static getLabTechId;
    static searchPatient(req: AuthenticatedRequest, res: Response): Promise<Response>;
    static getLabRequests(req: AuthenticatedRequest, res: Response): Promise<Response>;
    static updateLabRequest(req: AuthenticatedRequest, res: Response): Promise<Response>;
}
//# sourceMappingURL=labTechController.d.ts.map