import Joi from "joi";
import type { Request, Response, NextFunction } from "express";
export declare const validate: (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction) => Response | void;
export declare const loginSchema: Joi.ObjectSchema<any>;
export declare const registerPatientSchema: Joi.ObjectSchema<any>;
export declare const createAppointmentSchema: Joi.ObjectSchema<any>;
export declare const createMedicalRecordSchema: Joi.ObjectSchema<any>;
//# sourceMappingURL=validation.d.ts.map