"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMedicalRecordSchema = exports.createAppointmentSchema = exports.registerPatientSchema = exports.loginSchema = exports.validate = void 0;
const joi_1 = __importDefault(require("joi"));
const validate = (schema) => {
    return (req, res, next) => {
        console.log("Request body:", req.body);
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: error.details[0].message,
            });
        }
        next();
    };
};
exports.validate = validate;
exports.loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(6).required(),
});
exports.registerPatientSchema = joi_1.default.object({
    firstName: joi_1.default.string().required(),
    lastName: joi_1.default.string().required(),
    email: joi_1.default.string().email().required(),
    phone: joi_1.default.string().required(),
    password: joi_1.default.string().min(8).required(),
    faydaId: joi_1.default.string().required(),
    dateOfBirth: joi_1.default.date().required(),
    gender: joi_1.default.string().valid("male", "female", "other").required(),
    bloodType: joi_1.default.string().optional(),
    height: joi_1.default.number().optional(),
    weight: joi_1.default.number().optional(),
});
exports.createAppointmentSchema = joi_1.default.object({
    patientId: joi_1.default.string().required(),
    doctorId: joi_1.default.string().required(),
    scheduledTime: joi_1.default.date().required(),
    duration: joi_1.default.number().default(30),
    type: joi_1.default.string().valid("new", "checkup", "consultation", "followup").required(),
    reason: joi_1.default.string().optional(),
    notes: joi_1.default.string().optional(),
});
exports.createMedicalRecordSchema = joi_1.default.object({
    patientId: joi_1.default.string().required(),
    recordType: joi_1.default.string().valid("consultation", "prescription", "lab_order", "diagnosis").required(),
    title: joi_1.default.string().required(),
    content: joi_1.default.object().required(),
    status: joi_1.default.string().optional(),
    attachments: joi_1.default.array().items(joi_1.default.string()).optional(),
});
//# sourceMappingURL=validation.js.map