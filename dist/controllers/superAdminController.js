"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperAdminController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = __importDefault(require("../config/database"));
class SuperAdminController {
    static async getFacilities(req, res) {
        try {
            const { page = 1, limit = 10, region, type, status } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const whereClause = {};
            if (region) {
                whereClause.region = {
                    contains: region,
                    mode: "insensitive",
                };
            }
            if (type) {
                whereClause.type = type;
            }
            if (status) {
                whereClause.status = status;
            }
            const [facilities, total] = await Promise.all([
                database_1.default.hospital.findMany({
                    where: whereClause,
                    include: {
                        _count: {
                            select: {
                                doctors: true,
                                adminUsers: true,
                                appointments: true,
                            },
                        },
                    },
                    skip,
                    take: Number(limit),
                    orderBy: { createdAt: "desc" },
                }),
                database_1.default.hospital.count({ where: whereClause }),
            ]);
            return res.json({
                success: true,
                data: facilities,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit)),
                },
            });
        }
        catch (error) {
            console.error("Get facilities error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async registerFacility(req, res) {
        try {
            const { name, code, address, phone, email, region, type, operatingHours } = req.body;
            const existingFacility = await database_1.default.hospital.findUnique({
                where: { code },
            });
            if (existingFacility) {
                return res.status(400).json({
                    success: false,
                    error: "Facility with this code already exists",
                });
            }
            const facility = await database_1.default.hospital.create({
                data: {
                    name,
                    code,
                    address,
                    phone,
                    email,
                    region,
                    type,
                    operatingHours,
                    status: "active",
                    createdBy: req.user.id,
                },
            });
            await database_1.default.auditLog.create({
                data: {
                    action: "facility_registered",
                    entityType: "Hospital",
                    entityId: facility.id,
                    performedBy: req.user.id,
                    metadata: { name, code, region, type },
                },
            });
            return res.status(201).json({
                success: true,
                data: facility,
            });
        }
        catch (error) {
            console.error("Register facility error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async getFacilityDetails(req, res) {
        try {
            const { id } = req.params;
            const facility = await database_1.default.hospital.findUnique({
                where: { id },
                include: {
                    doctors: {
                        include: {
                            user: {
                                select: { firstName: true, lastName: true, email: true },
                            },
                        },
                    },
                    adminUsers: {
                        include: {
                            user: {
                                select: { firstName: true, lastName: true, email: true },
                            },
                        },
                    },
                    _count: {
                        select: {
                            appointments: true,
                            reports: true,
                        },
                    },
                },
            });
            if (!facility) {
                return res.status(404).json({
                    success: false,
                    error: "Facility not found",
                });
            }
            return res.json({
                success: true,
                data: facility,
            });
        }
        catch (error) {
            console.error("Get facility details error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async updateFacility(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const facility = await database_1.default.hospital.update({
                where: { id },
                data: updates,
            });
            await database_1.default.auditLog.create({
                data: {
                    action: "facility_updated",
                    entityType: "Hospital",
                    entityId: id,
                    performedBy: req.user.id,
                    metadata: { updates },
                },
            });
            return res.json({
                success: true,
                data: facility,
            });
        }
        catch (error) {
            console.error("Update facility error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async getFacilityAdmins(req, res) {
        try {
            const { page = 1, limit = 10, hospitalId, status } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const whereClause = { role: "hospital_admin" };
            if (hospitalId) {
                whereClause.hospitalId = hospitalId;
            }
            if (status) {
                whereClause.user = {
                    isActive: status === "active",
                };
            }
            const [admins, total] = await Promise.all([
                database_1.default.adminUser.findMany({
                    where: whereClause,
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                                phone: true,
                                isActive: true,
                                lastLogin: true,
                            },
                        },
                        hospital: {
                            select: { name: true, code: true },
                        },
                    },
                    skip,
                    take: Number(limit),
                    orderBy: { createdAt: "desc" },
                }),
                database_1.default.adminUser.count({ where: whereClause }),
            ]);
            return res.json({
                success: true,
                data: admins,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit)),
                },
            });
        }
        catch (error) {
            console.error("Get facility admins error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async createFacilityAdmin(req, res) {
        try {
            const { user, hospitalId, permissions } = req.body;
            const { firstName, lastName, email, phone, password } = user;
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
            if (!password) {
                return res.status(400).json({
                    success: false,
                    error: "Password is required",
                });
            }
            const hashedPassword = await bcryptjs_1.default.hash(password, 12);
            const result = await database_1.default.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        nationalId: email,
                        firstName,
                        lastName,
                        email,
                        phone,
                        password: hashedPassword,
                        role: "hospital_admin",
                        createdBy: req.user.id,
                    },
                });
                const admin = await tx.adminUser.create({
                    data: {
                        userId: user.id,
                        hospitalId,
                        role: "hospital_admin",
                        permissions: permissions || [],
                    },
                });
                return { user, admin };
            });
            await database_1.default.auditLog.create({
                data: {
                    action: "admin_created",
                    entityType: "AdminUser",
                    entityId: result.admin.id,
                    performedBy: req.user.id,
                    metadata: { email, hospitalId },
                },
            });
            return res.status(201).json({
                success: true,
                data: {
                    message: "Facility administrator created successfully",
                    adminId: result.admin.id,
                },
            });
        }
        catch (error) {
            console.error("Create facility admin error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async updateFacilityAdmin(req, res) {
        try {
            const { id } = req.params;
            const { user, hospitalId, permissions, isActive } = req.body;
            const { firstName, lastName, email, phone, password } = user || {};
            const existingAdmin = await database_1.default.adminUser.findUnique({
                where: { id },
                include: { user: true },
            });
            if (!existingAdmin) {
                return res.status(404).json({
                    success: false,
                    error: "Administrator not found",
                });
            }
            if (email || phone) {
                const existingUser = await database_1.default.user.findFirst({
                    where: {
                        OR: [
                            { email: email || undefined, id: { not: existingAdmin.userId } },
                            { phone: phone || undefined, id: { not: existingAdmin.userId } },
                        ],
                    },
                });
                if (existingUser) {
                    return res.status(400).json({
                        success: false,
                        error: "Email or phone already in use by another user",
                    });
                }
            }
            const userUpdateData = {};
            if (firstName)
                userUpdateData.firstName = firstName;
            if (lastName)
                userUpdateData.lastName = lastName;
            if (email)
                userUpdateData.email = email;
            if (phone)
                userUpdateData.phone = phone;
            if (password)
                userUpdateData.password = await bcryptjs_1.default.hash(password, 12);
            if (isActive !== undefined)
                userUpdateData.isActive = isActive;
            const adminUpdateData = {};
            if (hospitalId)
                adminUpdateData.hospitalId = hospitalId;
            if (permissions)
                adminUpdateData.permissions = permissions;
            const result = await database_1.default.$transaction(async (tx) => {
                let updatedUser = existingAdmin.user;
                if (Object.keys(userUpdateData).length > 0) {
                    updatedUser = await tx.user.update({
                        where: { id: existingAdmin.userId },
                        data: userUpdateData,
                    });
                }
                let updatedAdmin = existingAdmin;
                if (Object.keys(adminUpdateData).length > 0) {
                    updatedAdmin = await tx.adminUser.update({
                        where: { id },
                        data: adminUpdateData,
                        include: { user: true },
                    });
                }
                else {
                    updatedAdmin = await tx.adminUser.findUnique({
                        where: { id },
                        include: { user: true },
                    });
                }
                return { user: updatedUser, admin: updatedAdmin };
            });
            await database_1.default.auditLog.create({
                data: {
                    action: "admin_updated",
                    entityType: "AdminUser",
                    entityId: id,
                    performedBy: req.user.id,
                    metadata: {
                        updatedFields: {
                            user: userUpdateData,
                            admin: adminUpdateData,
                        },
                    },
                },
            });
            return res.json({
                success: true,
                data: {
                    message: "Facility administrator updated successfully",
                    adminId: result.admin.id,
                },
            });
        }
        catch (error) {
            console.error("Update facility admin error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async getDashboardStats(req, res) {
        try {
            const [totalFacilities, activeFacilities, totalDoctors, totalPatients, totalAppointments, recentActivity] = await Promise.all([
                database_1.default.hospital.count(),
                database_1.default.hospital.count({ where: { status: "active" } }),
                database_1.default.doctor.count({ where: { isActive: true } }),
                database_1.default.patient.count(),
                database_1.default.appointment.count({
                    where: {
                        scheduledTime: {
                            gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        },
                    },
                }),
                database_1.default.auditLog.findMany({
                    take: 10,
                    orderBy: { timestamp: "desc" },
                    select: {
                        action: true,
                        entityType: true,
                        timestamp: true,
                        metadata: true,
                    },
                }),
            ]);
            return res.json({
                success: true,
                data: {
                    facilities: {
                        total: totalFacilities,
                        active: activeFacilities,
                        inactive: totalFacilities - activeFacilities,
                    },
                    staff: {
                        doctors: totalDoctors,
                    },
                    patients: {
                        total: totalPatients,
                    },
                    appointments: {
                        today: totalAppointments,
                    },
                    recentActivity,
                },
            });
        }
        catch (error) {
            console.error("Get dashboard stats error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async getAuditLogs(req, res) {
        try {
            const { page = 1, limit = 50, action, entityType, startDate, endDate } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const whereClause = {};
            if (action) {
                whereClause.action = {
                    contains: action,
                    mode: "insensitive",
                };
            }
            if (entityType) {
                whereClause.entityType = entityType;
            }
            if (startDate && endDate) {
                whereClause.timestamp = {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                };
            }
            const [logs, total] = await Promise.all([
                database_1.default.auditLog.findMany({
                    where: whereClause,
                    skip,
                    take: Number(limit),
                    orderBy: { timestamp: "desc" },
                }),
                database_1.default.auditLog.count({ where: whereClause }),
            ]);
            return res.json({
                success: true,
                data: logs,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit)),
                },
            });
        }
        catch (error) {
            console.error("Get audit logs error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
}
exports.SuperAdminController = SuperAdminController;
//# sourceMappingURL=superAdminController.js.map