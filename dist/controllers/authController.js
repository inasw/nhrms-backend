"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = __importDefault(require("../config/database"));
const jwt_1 = require("../config/jwt");
class AuthController {
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            const user = await database_1.default.user.findUnique({
                where: { email },
                include: {
                    doctor: { include: { hospital: true } },
                    patient: true,
                    adminUser: { include: { hospital: true } },
                    labTech: { include: { hospital: true } },
                },
            });
            if (!user || !user.isActive) {
                return res.status(401).json({
                    success: false,
                    error: "Invalid credentials or inactive account",
                });
            }
            const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    error: "Invalid credentials",
                });
            }
            await database_1.default.user.update({
                where: { id: user.id },
                data: { lastLogin: new Date() },
            });
            const tokenPayload = {
                userId: user.id,
                role: user.role,
                hospitalId: user.doctor?.hospitalId || user.adminUser?.hospitalId,
            };
            const accessToken = (0, jwt_1.generateAccessToken)(tokenPayload);
            const refreshToken = (0, jwt_1.generateRefreshToken)(tokenPayload);
            const userData = {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
            };
            if (user.doctor) {
                userData.doctor = {
                    id: user.doctor.id,
                    licenseNumber: user.doctor.licenseNumber,
                    specialization: user.doctor.specialization,
                    hospital: user.doctor.hospital,
                };
            }
            if (user.patient) {
                userData.patient = {
                    id: user.patient.id,
                    faydaId: user.patient.faydaId,
                    dateOfBirth: user.patient.dateOfBirth,
                    gender: user.patient.gender,
                };
            }
            if (user.adminUser) {
                userData.admin = {
                    id: user.adminUser.id,
                    role: user.adminUser.role,
                    permissions: user.adminUser.permissions,
                    hospital: user.adminUser.hospital,
                };
            }
            if (user.labTech) {
                userData.labTech = {
                    id: user.labTech.id,
                    licenseNumber: user.labTech.licenseNumber,
                    hospital: user.labTech.hospital,
                };
            }
            return res.json({
                success: true,
                data: {
                    user: userData,
                    accessToken,
                    refreshToken,
                },
            });
        }
        catch (error) {
            console.error("Login error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async registerPatient(req, res) {
        try {
            const { firstName, lastName, email, phone, password, faydaId, dateOfBirth, gender, bloodType, height, weight } = req.body;
            const existingUser = await database_1.default.user.findFirst({
                where: {
                    OR: [{ email }, { phone }, { nationalId: faydaId }],
                },
            });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    error: "User with this email, phone, or Fayda ID already exists",
                });
            }
            const hashedPassword = await bcryptjs_1.default.hash(password, 12);
            const result = await database_1.default.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        nationalId: faydaId,
                        firstName,
                        lastName,
                        email,
                        phone,
                        password: hashedPassword,
                        role: "patient",
                    },
                });
                const patient = await tx.patient.create({
                    data: {
                        userId: user.id,
                        faydaId,
                        dateOfBirth: new Date(dateOfBirth),
                        gender,
                        bloodType,
                        height,
                        weight,
                    },
                });
                return { user, patient };
            });
            return res.status(201).json({
                success: true,
                data: {
                    message: "Patient registered successfully",
                    userId: result.user.id,
                    patientId: result.patient.id,
                },
            });
        }
        catch (error) {
            console.error("Patient registration error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async registerDoctor(req, res) {
        try {
            const { firstName, lastName, email, phone, password, licenseNumber, specialization, hospitalId } = req.body;
            const existingUser = await database_1.default.user.findFirst({
                where: {
                    OR: [{ email }, { phone }],
                },
            });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    error: "User with this email or phone already exists",
                });
            }
            const existingDoctor = await database_1.default.doctor.findUnique({
                where: { licenseNumber },
            });
            if (existingDoctor) {
                return res.status(400).json({
                    success: false,
                    error: "Doctor with this license number already exists",
                });
            }
            const hashedPassword = await bcryptjs_1.default.hash(password, 12);
            const result = await database_1.default.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        nationalId: licenseNumber,
                        firstName,
                        lastName,
                        email,
                        phone,
                        password: hashedPassword,
                        role: "doctor",
                    },
                });
                const doctor = await tx.doctor.create({
                    data: {
                        userId: user.id,
                        licenseNumber,
                        specialization,
                        hospitalId,
                    },
                });
                return { user, doctor };
            });
            return res.status(201).json({
                success: true,
                data: {
                    message: "Doctor registered successfully",
                    userId: result.user.id,
                    doctorId: result.doctor.id,
                },
            });
        }
        catch (error) {
            console.error("Doctor registration error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(401).json({
                    success: false,
                    error: "Refresh token required",
                });
            }
            const decoded = (0, jwt_1.verifyToken)(refreshToken);
            const newAccessToken = (0, jwt_1.generateAccessToken)({
                userId: decoded.userId,
                role: decoded.role,
                hospitalId: decoded.hospitalId,
            });
            return res.json({
                success: true,
                data: {
                    accessToken: newAccessToken,
                },
            });
        }
        catch (error) {
            return res.status(401).json({
                success: false,
                error: "Invalid refresh token",
            });
        }
    }
    static async logout(req, res) {
        return res.json({
            success: true,
            message: "Logged out successfully",
        });
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=authController.js.map