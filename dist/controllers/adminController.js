"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = __importDefault(require("../config/database"));
class AdminController {
    static async getHospitalInfo(req, res) {
        try {
            const hospitalId = req.user.hospitalId;
            if (!hospitalId) {
                return res.status(400).json({
                    success: false,
                    error: "Hospital ID not found",
                });
            }
            const hospital = await database_1.default.hospital.findUnique({
                where: { id: hospitalId },
                include: {
                    doctors: {
                        where: { isActive: true },
                        include: {
                            user: {
                                select: { firstName: true, lastName: true },
                            },
                        },
                    },
                    _count: {
                        select: {
                            doctors: true,
                            appointments: true,
                        },
                    },
                },
            });
            return res.json({
                success: true,
                data: hospital,
            });
        }
        catch (error) {
            console.error("Get hospital info error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async updateHospitalInfo(req, res) {
        try {
            const hospitalId = req.user.hospitalId;
            const updates = req.body;
            if (!hospitalId) {
                return res.status(400).json({
                    success: false,
                    error: "Hospital ID not found",
                });
            }
            const hospital = await database_1.default.hospital.update({
                where: { id: hospitalId },
                data: updates,
            });
            await database_1.default.auditLog.create({
                data: {
                    action: "hospital_updated",
                    entityType: "Hospital",
                    entityId: hospitalId,
                    performedBy: req.user.id,
                    metadata: { updates },
                },
            });
            return res.json({
                success: true,
                data: hospital,
            });
        }
        catch (error) {
            console.error("Update hospital info error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async getDoctors(req, res) {
        try {
            const hospitalId = req.user.hospitalId;
            const { page = 1, limit = 10, status, specialty } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const whereClause = { hospitalId };
            if (status) {
                whereClause.isActive = status === "active";
            }
            if (specialty) {
                whereClause.specialization = {
                    contains: specialty,
                    mode: "insensitive",
                };
            }
            const [doctors, total] = await Promise.all([
                database_1.default.doctor.findMany({
                    where: whereClause,
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                                phone: true,
                                lastLogin: true,
                            },
                        },
                        _count: {
                            select: {
                                doctorPatientAssignments: {
                                    where: { status: "active" },
                                },
                                appointments: {
                                    where: {
                                        scheduledTime: {
                                            gte: new Date(),
                                        },
                                    },
                                },
                            },
                        },
                    },
                    skip,
                    take: Number(limit),
                    orderBy: { createdAt: "desc" },
                }),
                database_1.default.doctor.count({ where: whereClause }),
            ]);
            return res.json({
                success: true,
                data: doctors,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit)),
                },
            });
        }
        catch (error) {
            console.error("Get doctors error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async addDoctor(req, res) {
        try {
            const hospitalId = req.user.hospitalId;
            const { firstName, lastName, email, phone, licenseNumber, specialization, password } = req.body;
            if (!firstName || !lastName || !email || !phone || !licenseNumber || !specialization || !password) {
                return res.status(400).json({
                    success: false,
                    error: `Missing required fields: ${[
                        !firstName && 'firstName',
                        !lastName && 'lastName',
                        !email && 'email',
                        !phone && 'phone',
                        !licenseNumber && 'licenseNumber',
                        !specialization && 'specialization',
                        !password && 'password',
                    ].filter(Boolean).join(', ')}`,
                });
            }
            if (!hospitalId) {
                return res.status(400).json({
                    success: false,
                    error: "Hospital ID not found",
                });
            }
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
                        createdBy: req.user.id,
                    },
                });
                const doctor = await tx.doctor.create({
                    data: {
                        userId: user.id,
                        licenseNumber,
                        specialization,
                        hospitalId: hospitalId,
                    },
                });
                return { user, doctor };
            });
            await database_1.default.auditLog.create({
                data: {
                    action: "doctor_added",
                    entityType: "Doctor",
                    entityId: result.doctor.id,
                    performedBy: req.user.id,
                    metadata: { licenseNumber, specialization },
                },
            });
            return res.status(201).json({
                success: true,
                data: {
                    message: "Doctor added successfully",
                    doctorId: result.doctor.id,
                },
            });
        }
        catch (error) {
            console.error("Add doctor error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async updateDoctor(req, res) {
        try {
            const { id } = req.params;
            const hospitalId = req.user.hospitalId;
            const updates = req.body;
            const doctor = await database_1.default.doctor.findFirst({
                where: { id, hospitalId },
            });
            if (!doctor) {
                return res.status(404).json({
                    success: false,
                    error: "Doctor not found",
                });
            }
            const { firstName, lastName, email, phone, ...doctorUpdates } = updates;
            const userUpdates = {};
            if (firstName)
                userUpdates.firstName = firstName;
            if (lastName)
                userUpdates.lastName = lastName;
            if (email)
                userUpdates.email = email;
            if (phone)
                userUpdates.phone = phone;
            const result = await database_1.default.$transaction(async (tx) => {
                if (Object.keys(userUpdates).length > 0) {
                    await tx.user.update({
                        where: { id: doctor.userId },
                        data: { ...userUpdates, updatedBy: req.user.id },
                    });
                }
                if (Object.keys(doctorUpdates).length > 0) {
                    await tx.doctor.update({
                        where: { id },
                        data: doctorUpdates,
                    });
                }
                return await tx.doctor.findUnique({
                    where: { id },
                    include: {
                        user: {
                            select: { firstName: true, lastName: true, email: true, phone: true },
                        },
                    },
                });
            });
            await database_1.default.auditLog.create({
                data: {
                    action: "doctor_updated",
                    entityType: "Doctor",
                    entityId: id,
                    performedBy: req.user.id,
                    metadata: { updates },
                },
            });
            return res.json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            console.error("Update doctor error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async generateReport(req, res) {
        try {
            const hospitalId = req.user.hospitalId;
            const { type, title, parameters } = req.body;
            const report = await database_1.default.report.create({
                data: {
                    hospitalId: hospitalId,
                    type,
                    title,
                    generatedBy: req.user.id,
                    parameters,
                    status: "pending",
                },
            });
            setTimeout(async () => {
                await database_1.default.report.update({
                    where: { id: report.id },
                    data: {
                        status: "completed",
                        completedAt: new Date(),
                        fileUrl: `/reports/${report.id}.pdf`,
                    },
                });
            }, 2000);
            return res.status(201).json({
                success: true,
                data: report,
            });
        }
        catch (error) {
            console.error("Generate report error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async getSettings(req, res) {
        try {
            const hospitalId = req.user.hospitalId;
            const { type } = req.query;
            const whereClause = { hospitalId };
            if (type) {
                whereClause.settingType = type;
            }
            const settings = await database_1.default.systemSetting.findMany({
                where: whereClause,
                orderBy: { key: "asc" },
            });
            return res.json({
                success: true,
                data: settings,
            });
        }
        catch (error) {
            console.error("Get settings error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async updateSettings(req, res) {
        try {
            const hospitalId = req.user.hospitalId;
            const { settings } = req.body;
            const updatePromises = settings.map((setting) => database_1.default.systemSetting.upsert({
                where: {
                    hospitalId_key: {
                        hospitalId: hospitalId,
                        key: setting.key,
                    },
                },
                update: {
                    value: setting.value,
                    updatedBy: req.user.id,
                },
                create: {
                    hospitalId: hospitalId,
                    settingType: setting.settingType,
                    key: setting.key,
                    value: setting.value,
                    updatedBy: req.user.id,
                },
            }));
            await Promise.all(updatePromises);
            await database_1.default.auditLog.create({
                data: {
                    action: "settings_updated",
                    entityType: "SystemSetting",
                    entityId: hospitalId,
                    performedBy: req.user.id,
                    metadata: { settingsCount: settings.length },
                },
            });
            return res.json({
                success: true,
                message: "Settings updated successfully",
            });
        }
        catch (error) {
            console.error("Update settings error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async getLabTechs(req, res) {
        try {
            const hospitalId = req.user.hospitalId;
            const { page = 1, limit = 10, status } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const whereClause = { hospitalId };
            if (status) {
                whereClause.isActive = status === "active";
            }
            const [labTechs, total] = await Promise.all([
                database_1.default.labTech.findMany({
                    where: whereClause,
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                                phone: true,
                                lastLogin: true,
                            },
                        },
                        _count: {
                            select: {
                                labRequests: true,
                            },
                        },
                    },
                    skip,
                    take: Number(limit),
                    orderBy: { createdAt: "desc" },
                }),
                database_1.default.labTech.count({ where: whereClause }),
            ]);
            return res.json({
                success: true,
                data: labTechs,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit)),
                },
            });
        }
        catch (error) {
            console.error("Get lab techs error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async addLabTech(req, res) {
        try {
            const hospitalId = req.user.hospitalId;
            const { firstName, lastName, email, phone, licenseNumber, password } = req.body;
            if (!hospitalId) {
                return res.status(400).json({
                    success: false,
                    error: "Hospital ID not found",
                });
            }
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
            if (licenseNumber) {
                const existingLabTech = await database_1.default.labTech.findUnique({
                    where: { licenseNumber },
                });
                if (existingLabTech) {
                    return res.status(400).json({
                        success: false,
                        error: "Lab tech with this license number already exists",
                    });
                }
            }
            const hashedPassword = await bcryptjs_1.default.hash(password, 12);
            const result = await database_1.default.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        nationalId: licenseNumber || `LT-${Date.now()}`,
                        firstName,
                        lastName,
                        email,
                        phone,
                        password: hashedPassword,
                        role: "lab_tech",
                        createdBy: req.user.id,
                    },
                });
                const labTech = await tx.labTech.create({
                    data: {
                        userId: user.id,
                        licenseNumber,
                        hospitalId,
                    },
                });
                return { user, labTech };
            });
            await database_1.default.auditLog.create({
                data: {
                    action: "lab_tech_added",
                    entityType: "LabTech",
                    entityId: result.labTech.id,
                    performedBy: req.user.id,
                    metadata: { firstName, lastName, email },
                },
            });
            return res.status(201).json({
                success: true,
                data: {
                    message: "Lab tech added successfully",
                    labTechId: result.labTech.id,
                },
            });
        }
        catch (error) {
            console.error("Add lab tech error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async updateLabTech(req, res) {
        try {
            const { id } = req.params;
            const hospitalId = req.user.hospitalId;
            const updates = req.body;
            const labTech = await database_1.default.labTech.findFirst({
                where: { id, hospitalId },
            });
            if (!labTech) {
                return res.status(404).json({
                    success: false,
                    error: "Lab tech not found",
                });
            }
            const { firstName, lastName, email, phone, ...labTechUpdates } = updates;
            const userUpdates = {};
            if (firstName)
                userUpdates.firstName = firstName;
            if (lastName)
                userUpdates.lastName = lastName;
            if (email)
                userUpdates.email = email;
            if (phone)
                userUpdates.phone = phone;
            const result = await database_1.default.$transaction(async (tx) => {
                if (Object.keys(userUpdates).length > 0) {
                    await tx.user.update({
                        where: { id: labTech.userId },
                        data: { ...userUpdates, updatedBy: req.user.id },
                    });
                }
                if (Object.keys(labTechUpdates).length > 0) {
                    await tx.labTech.update({
                        where: { id },
                        data: labTechUpdates,
                    });
                }
                return await tx.labTech.findUnique({
                    where: { id },
                    include: {
                        user: {
                            select: { firstName: true, lastName: true, email: true, phone: true },
                        },
                    },
                });
            });
            await database_1.default.auditLog.create({
                data: {
                    action: "lab_tech_updated",
                    entityType: "LabTech",
                    entityId: id,
                    performedBy: req.user.id,
                    metadata: { updates },
                },
            });
            return res.json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            console.error("Update lab tech error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
}
exports.AdminController = AdminController;
//# sourceMappingURL=adminController.js.map