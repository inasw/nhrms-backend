import type { Request, Response } from "express";
export declare class AuthController {
    static login(req: Request, res: Response): Promise<Response>;
    static registerPatient(req: Request, res: Response): Promise<Response>;
    static registerDoctor(req: Request, res: Response): Promise<Response>;
    static refreshToken(req: Request, res: Response): Promise<Response>;
    static logout(req: Request, res: Response): Promise<Response>;
}
//# sourceMappingURL=authController.d.ts.map