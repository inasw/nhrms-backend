"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorController = void 0;
const database_1 = __importDefault(require("../config/database"));
class DoctorController {
    static async getPatients(req, res) {
        try {
            const doctorId = await DoctorController.getDoctorId(req.user.id);
            const { page = 1, limit = 10, status, search } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const whereClause = {
                doctorPatientAssignments: {
                    some: {
                        doctorId,
                        status: status ? status : "active",
                    },
                },
            };
            if (search) {
                whereClause.OR = [
                    { faydaId: { contains: search, mode: "insensitive" } },
                    { user: { firstName: { contains: search, mode: "insensitive" } } },
                    { user: { lastName: { contains: search, mode: "insensitive" } } },
                ];
            }
            const [patients, total] = await Promise.all([
                database_1.default.patient.findMany({
                    where: whereClause,
                    include: {
                        user: {
                            select: { firstName: true, lastName: true, email: true, phone: true },
                        },
                        vitals: {
                            orderBy: { recordedAt: "desc" },
                            take: 1,
                        },
                        alerts: {
                            where: { isResolved: false },
                            orderBy: { createdAt: "desc" },
                        },
                    },
                    skip,
                    take: Number(limit),
                    orderBy: { updatedAt: "desc" },
                }),
                database_1.default.patient.count({ where: whereClause }),
            ]);
            return res.json({
                success: true,
                data: patients,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit)),
                },
            });
        }
        catch (error) {
            console.error("Get patients error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async getPatientDetails(req, res) {
        try {
            const { id } = req.params;
            const doctorId = await DoctorController.getDoctorId(req.user.id);
            const assignment = await database_1.default.doctorPatientAssignment.findFirst({
                where: {
                    doctorId,
                    patientId: id,
                    status: "active",
                },
            });
            if (!assignment) {
                return res.status(403).json({
                    success: false,
                    error: "Access denied to this patient",
                });
            }
            const patient = await database_1.default.patient.findUnique({
                where: { id },
                include: {
                    user: {
                        select: { firstName: true, lastName: true, email: true, phone: true },
                    },
                    vitals: {
                        orderBy: { recordedAt: "desc" },
                        take: 10,
                    },
                    medicalRecords: {
                        orderBy: { date: "desc" },
                        take: 20,
                        include: {
                            doctor: {
                                include: {
                                    user: {
                                        select: { firstName: true, lastName: true },
                                    },
                                },
                            },
                        },
                    },
                    alerts: {
                        where: { isResolved: false },
                        orderBy: { createdAt: "desc" },
                    },
                    emergencyContacts: true,
                },
            });
            return res.json({
                success: true,
                data: patient,
            });
        }
        catch (error) {
            console.error("Get patient details error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async getAppointments(req, res) {
        try {
            const doctorId = await DoctorController.getDoctorId(req.user.id);
            const { date, status, page = 1, limit = 10 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const whereClause = { doctorId };
            if (date) {
                const startDate = new Date(date);
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + 1);
                whereClause.scheduledTime = {
                    gte: startDate,
                    lt: endDate,
                };
            }
            if (status) {
                whereClause.status = status;
            }
            const [appointments, total] = await Promise.all([
                database_1.default.appointment.findMany({
                    where: whereClause,
                    include: {
                        patient: {
                            include: {
                                user: {
                                    select: { firstName: true, lastName: true, phone: true },
                                },
                            },
                        },
                        hospital: {
                            select: { name: true },
                        },
                    },
                    skip,
                    take: Number(limit),
                    orderBy: { scheduledTime: "asc" },
                }),
                database_1.default.appointment.count({ where: whereClause }),
            ]);
            return res.json({
                success: true,
                data: appointments,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit)),
                },
            });
        }
        catch (error) {
            console.error("Get appointments error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async createAppointment(req, res) {
        try {
            const doctorId = await DoctorController.getDoctorId(req.user.id);
            const { patientId, scheduledTime, duration, type, reason, notes } = req.body;
            const doctor = await database_1.default.doctor.findUnique({
                where: { id: doctorId },
                select: { hospitalId: true },
            });
            const appointment = await database_1.default.appointment.create({
                data: {
                    patientId,
                    doctorId,
                    hospitalId: doctor.hospitalId,
                    scheduledTime: new Date(scheduledTime),
                    duration: duration || 30,
                    type,
                    reason,
                    notes,
                    status: "confirmed",
                },
                include: {
                    patient: {
                        include: {
                            user: {
                                select: { firstName: true, lastName: true },
                            },
                        },
                    },
                },
            });
            return res.status(201).json({
                success: true,
                data: appointment,
            });
        }
        catch (error) {
            console.error("Create appointment error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async updateAppointment(req, res) {
        try {
            const { id } = req.params;
            const doctorId = await DoctorController.getDoctorId(req.user.id);
            const updates = req.body;
            const appointment = await database_1.default.appointment.findFirst({
                where: { id, doctorId },
            });
            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    error: "Appointment not found",
                });
            }
            const updatedAppointment = await database_1.default.appointment.update({
                where: { id },
                data: updates,
                include: {
                    patient: {
                        include: {
                            user: {
                                select: { firstName: true, lastName: true },
                            },
                        },
                    },
                },
            });
            return res.json({
                success: true,
                data: updatedAppointment,
            });
        }
        catch (error) {
            console.error("Update appointment error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async createMedicalRecord(req, res) {
        try {
            const doctorId = await DoctorController.getDoctorId(req.user.id);
            const { patientId, recordType, title, content, status, attachments } = req.body;
            const assignment = await database_1.default.doctorPatientAssignment.findFirst({
                where: {
                    doctorId,
                    patientId,
                    status: "active",
                },
            });
            if (!assignment) {
                return res.status(403).json({
                    success: false,
                    error: "Access denied to this patient",
                });
            }
            const medicalRecord = await database_1.default.medicalRecord.create({
                data: {
                    patientId,
                    doctorId,
                    recordType,
                    title,
                    content,
                    status,
                    attachments: attachments || [],
                },
                include: {
                    patient: {
                        include: {
                            user: {
                                select: { firstName: true, lastName: true },
                            },
                        },
                    },
                },
            });
            return res.status(201).json({
                success: true,
                data: medicalRecord,
            });
        }
        catch (error) {
            console.error("Create medical record error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async getDashboardStats(req, res) {
        try {
            const doctorId = await DoctorController.getDoctorId(req.user.id);
            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0));
            const endOfDay = new Date(today.setHours(23, 59, 59, 999));
            const [totalPatients, todayAppointments, activeAlerts, completedAppointments] = await Promise.all([
                database_1.default.doctorPatientAssignment.count({
                    where: { doctorId, status: "active" },
                }),
                database_1.default.appointment.count({
                    where: {
                        doctorId,
                        scheduledTime: {
                            gte: startOfDay,
                            lte: endOfDay,
                        },
                    },
                }),
                database_1.default.alert.count({
                    where: {
                        createdBy: doctorId,
                        isResolved: false,
                    },
                }),
                database_1.default.appointment.count({
                    where: {
                        doctorId,
                        status: "completed",
                        scheduledTime: {
                            gte: startOfDay,
                            lte: endOfDay,
                        },
                    },
                }),
            ]);
            return res.json({
                success: true,
                data: {
                    totalPatients,
                    todayAppointments,
                    activeAlerts,
                    completedAppointments,
                    responseTime: "15 min",
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
    static async createLabRequest(req, res) {
        try {
            const doctorId = await DoctorController.getDoctorId(req.user.id);
            const { patientId, testType, instructions, labTechId } = req.body;
            const assignment = await database_1.default.doctorPatientAssignment.findFirst({
                where: {
                    doctorId,
                    patientId,
                    status: "active",
                },
            });
            if (!assignment) {
                return res.status(403).json({
                    success: false,
                    error: "Access denied to this patient",
                });
            }
            if (labTechId) {
                const doctor = await database_1.default.doctor.findUnique({ where: { id: doctorId }, select: { hospitalId: true } });
                const labTech = await database_1.default.labTech.findUnique({ where: { id: labTechId } });
                if (labTech?.hospitalId !== doctor?.hospitalId) {
                    return res.status(400).json({
                        success: false,
                        error: "Lab tech not in the same hospital",
                    });
                }
            }
            const labRequest = await database_1.default.labRequest.create({
                data: {
                    patientId,
                    doctorId,
                    labTechId,
                    testType,
                    instructions,
                    status: "pending",
                },
                include: {
                    patient: {
                        include: {
                            user: { select: { firstName: true, lastName: true } },
                        },
                    },
                    labTech: {
                        include: {
                            user: { select: { firstName: true, lastName: true } },
                        },
                    },
                },
            });
            return res.status(201).json({
                success: true,
                data: labRequest,
            });
        }
        catch (error) {
            console.error("Create lab request error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async getDoctorId(userId) {
        const doctor = await database_1.default.doctor.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!doctor) {
            throw new Error("Doctor not found");
        }
        return doctor.id;
    }
}
exports.DoctorController = DoctorController;
//# sourceMappingURL=doctorController.js.map