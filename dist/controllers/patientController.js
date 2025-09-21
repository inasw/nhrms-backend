"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientController = void 0;
const database_1 = __importDefault(require("../config/database"));
class PatientController {
    static async submitVitals(req, res) {
        try {
            const patientId = await PatientController.getPatientId(req.user.id);
            const { heartRate, bloodPressure, temperature, bloodSugar, oxygenSaturation, weight, notes, source = "manual", deviceId, } = req.body;
            const vitalRecords = [];
            if (heartRate !== undefined) {
                vitalRecords.push({
                    patientId,
                    type: "heartRate",
                    value: Number(heartRate),
                    unit: "bpm",
                    timestamp: new Date(),
                    source,
                    deviceId,
                    notes,
                });
            }
            if (bloodPressure !== undefined) {
                const [systolic, diastolic] = bloodPressure.split("/").map(Number);
                vitalRecords.push({
                    patientId,
                    type: "bloodPressureSystolic",
                    value: systolic,
                    unit: "mmHg",
                    timestamp: new Date(),
                    source,
                    deviceId,
                    notes,
                }, {
                    patientId,
                    type: "bloodPressureDiastolic",
                    value: diastolic,
                    unit: "mmHg",
                    timestamp: new Date(),
                    source,
                    deviceId,
                    notes,
                });
            }
            if (temperature !== undefined) {
                vitalRecords.push({
                    patientId,
                    type: "temperature",
                    value: Number(temperature),
                    unit: "C",
                    timestamp: new Date(),
                    source,
                    deviceId,
                    notes,
                });
            }
            if (bloodSugar !== undefined) {
                vitalRecords.push({
                    patientId,
                    type: "bloodSugar",
                    value: Number(bloodSugar),
                    unit: "mg/dL",
                    timestamp: new Date(),
                    source,
                    deviceId,
                    notes,
                });
            }
            if (oxygenSaturation !== undefined) {
                vitalRecords.push({
                    patientId,
                    type: "oxygenSaturation",
                    value: Number(oxygenSaturation),
                    unit: "%",
                    timestamp: new Date(),
                    source,
                    deviceId,
                    notes,
                });
            }
            if (weight !== undefined) {
                vitalRecords.push({
                    patientId,
                    type: "weight",
                    value: Number(weight),
                    unit: "kg",
                    timestamp: new Date(),
                    source,
                    deviceId,
                    notes,
                });
            }
            const createdVitals = await database_1.default.patientVital.createMany({
                data: vitalRecords,
            });
            const newVitals = await database_1.default.patientVital.findMany({
                where: {
                    patientId,
                    timestamp: { gte: new Date(Date.now() - 1000) },
                },
            });
            await PatientController.checkVitalAlerts(patientId, newVitals);
            res.status(201).json({
                success: true,
                data: newVitals,
            });
        }
        catch (error) {
            console.error("Submit vitals error:", error);
            res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async getVitals(req, res) {
        try {
            const patientId = await PatientController.getPatientId(req.user.id);
            const { page = 1, limit = 20, startDate, endDate } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const whereClause = { patientId };
            if (startDate && endDate) {
                whereClause.timestamp = {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                };
            }
            const [vitals, total] = await Promise.all([
                database_1.default.patientVital.findMany({
                    where: whereClause,
                    skip,
                    take: Number(limit),
                    orderBy: { timestamp: "desc" },
                }),
                database_1.default.patientVital.count({ where: whereClause }),
            ]);
            res.json({
                success: true,
                data: vitals,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit)),
                },
            });
        }
        catch (error) {
            console.error("Get vitals error:", error);
            res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async getLatestVitals(req, res) {
        try {
            const patientId = await PatientController.getPatientId(req.user.id);
            const latestVitals = await database_1.default.patientVital.findMany({
                where: { patientId },
                orderBy: { timestamp: "desc" },
                take: 10,
            });
            res.json({
                success: true,
                data: latestVitals,
            });
        }
        catch (error) {
            console.error("Get latest vitals error:", error);
            res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async getAppointments(req, res) {
        try {
            const patientId = await PatientController.getPatientId(req.user.id);
            const { status, upcoming, page = 1, limit = 10 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const whereClause = { patientId };
            if (status) {
                whereClause.status = status;
            }
            if (upcoming === "true") {
                whereClause.scheduledTime = {
                    gte: new Date(),
                };
            }
            const [appointments, total] = await Promise.all([
                database_1.default.appointment.findMany({
                    where: whereClause,
                    include: {
                        doctor: {
                            include: {
                                user: {
                                    select: { firstName: true, lastName: true },
                                },
                            },
                        },
                        hospital: {
                            select: { name: true, address: true, phone: true },
                        },
                    },
                    skip,
                    take: Number(limit),
                    orderBy: { scheduledTime: "desc" },
                }),
                database_1.default.appointment.count({ where: whereClause }),
            ]);
            res.json({
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
            res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async requestAppointment(req, res) {
        try {
            const patientId = await PatientController.getPatientId(req.user.id);
            const { doctorId, hospitalId, requestedDate, preferredTime, reason, notes } = req.body;
            const appointmentRequest = await database_1.default.appointmentRequest.create({
                data: {
                    patientId,
                    doctorId,
                    hospitalId,
                    requestedDate: new Date(requestedDate),
                    preferredTime,
                    reason,
                    notes,
                },
                include: {
                    hospital: {
                        select: { name: true },
                    },
                },
            });
            res.status(201).json({
                success: true,
                data: appointmentRequest,
            });
        }
        catch (error) {
            console.error("Request appointment error:", error);
            res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async getMedicalRecords(req, res) {
        try {
            const patientId = await PatientController.getPatientId(req.user.id);
            const { type, page = 1, limit = 20 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const whereClause = { patientId };
            if (type) {
                whereClause.recordType = type;
            }
            const [records, total] = await Promise.all([
                database_1.default.medicalRecord.findMany({
                    where: whereClause,
                    include: {
                        doctor: {
                            include: {
                                user: {
                                    select: { firstName: true, lastName: true },
                                },
                                hospital: {
                                    select: { name: true },
                                },
                            },
                        },
                    },
                    skip,
                    take: Number(limit),
                    orderBy: { date: "desc" },
                }),
                database_1.default.medicalRecord.count({ where: whereClause }),
            ]);
            res.json({
                success: true,
                data: records,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit)),
                },
            });
        }
        catch (error) {
            console.error("Get medical records error:", error);
            res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async searchDoctors(req, res) {
        try {
            const { specialty, region, name, page = 1, limit = 10 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const whereClause = { isActive: true };
            if (specialty) {
                whereClause.specialization = {
                    contains: specialty,
                    mode: "insensitive",
                };
            }
            if (region) {
                whereClause.hospital = {
                    region: {
                        contains: region,
                        mode: "insensitive",
                    },
                };
            }
            if (name) {
                whereClause.user = {
                    OR: [
                        { firstName: { contains: name, mode: "insensitive" } },
                        { lastName: { contains: name, mode: "insensitive" } },
                    ],
                };
            }
            const [doctors, total] = await Promise.all([
                database_1.default.doctor.findMany({
                    where: whereClause,
                    include: {
                        user: {
                            select: { firstName: true, lastName: true },
                        },
                        hospital: {
                            select: { name: true, address: true, region: true },
                        },
                    },
                    skip,
                    take: Number(limit),
                }),
                database_1.default.doctor.count({ where: whereClause }),
            ]);
            res.json({
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
            console.error("Search doctors error:", error);
            res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async getHealthAlerts(req, res) {
        try {
            const patientId = await PatientController.getPatientId(req.user.id);
            const { isRead, page = 1, limit = 20 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const whereClause = { patientId };
            if (isRead !== undefined) {
                whereClause.isRead = isRead === "true";
            }
            const [alerts, total] = await Promise.all([
                database_1.default.healthAlert.findMany({
                    where: whereClause,
                    skip,
                    take: Number(limit),
                    orderBy: { createdAt: "desc" },
                }),
                database_1.default.healthAlert.count({ where: whereClause }),
            ]);
            res.json({
                success: true,
                data: alerts,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit)),
                },
            });
        }
        catch (error) {
            console.error("Get health alerts error:", error);
            res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async getPatientId(userId) {
        const patient = await database_1.default.patient.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!patient) {
            throw new Error("Patient not found");
        }
        return patient.id;
    }
    static async checkVitalAlerts(patientId, vital) {
        const alerts = [];
        if (vital.bloodPressure) {
            const [systolic, diastolic] = vital.bloodPressure.split("/").map(Number);
            if (systolic > 140 || diastolic > 90) {
                alerts.push({
                    patientId,
                    type: 'vital',
                    message: "High blood pressure detected",
                    severity: systolic > 160 || diastolic > 100 ? 'high' : 'medium',
                    relatedRecordId: vital.id
                });
            }
        }
        if (vital.heartRate && (vital.heartRate < 60 || vital.heartRate > 100)) {
            alerts.push({
                patientId,
                type: 'vital',
                message: vital.heartRate < 60 ? "Low heart rate detected" : "High heart rate detected",
                severity: 'medium',
                relatedRecordId: vital.id
            });
        }
        if (vital.bloodSugar && (vital.bloodSugar < 70 || vital.bloodSugar > 200)) {
            alerts.push({
                patientId,
                type: 'vital',
                message: vital.bloodSugar < 70 ? "Low blood sugar detected" : "High blood sugar detected",
                severity: 'high',
                relatedRecordId: vital.id
            });
        }
        if (alerts.length > 0) {
            await database_1.default.healthAlert.createMany({
                data: alerts,
            });
        }
    }
}
exports.PatientController = PatientController;
//# sourceMappingURL=patientController.js.map