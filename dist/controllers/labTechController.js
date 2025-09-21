"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabTechController = void 0;
const database_1 = __importDefault(require("../config/database"));
class LabTechController {
    static async getLabTechId(userId) {
        const labTech = await database_1.default.labTech.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!labTech) {
            throw new Error("Lab tech not found");
        }
        return labTech.id;
    }
    static async searchPatient(req, res) {
        try {
            const { faydaId } = req.query;
            if (!faydaId) {
                return res.status(400).json({
                    success: false,
                    error: "Fayda ID required",
                });
            }
            const patient = await database_1.default.patient.findUnique({
                where: { faydaId: faydaId },
                include: {
                    user: {
                        select: { firstName: true, lastName: true, email: true, phone: true },
                    },
                    doctorPatientAssignments: {
                        include: {
                            doctor: {
                                include: {
                                    hospital: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!patient) {
                return res.status(404).json({
                    success: false,
                    error: "Patient not found",
                });
            }
            const labTech = await database_1.default.labTech.findUnique({
                where: { userId: req.user.id },
                select: { hospitalId: true },
            });
            const hasAccess = patient.doctorPatientAssignments.some((assignment) => assignment.doctor.hospitalId === labTech?.hospitalId);
            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    error: "No access to this patient",
                });
            }
            return res.json({
                success: true,
                data: patient,
            });
        }
        catch (error) {
            console.error("Search patient error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async getLabRequests(req, res) {
        try {
            const labTechId = await LabTechController.getLabTechId(req.user.id);
            const { status, patientId, page = 1, limit = 10 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const whereClause = {};
            if (status) {
                whereClause.status = status;
            }
            if (patientId) {
                whereClause.patientId = patientId;
            }
            const labTech = await database_1.default.labTech.findUnique({ where: { id: labTechId }, select: { hospitalId: true } });
            whereClause.OR = [
                { labTechId: labTechId },
                { labTechId: null, doctor: { hospitalId: labTech?.hospitalId } },
            ];
            const [requests, total] = await Promise.all([
                database_1.default.labRequest.findMany({
                    where: whereClause,
                    include: {
                        patient: {
                            include: {
                                user: { select: { firstName: true, lastName: true } },
                            },
                        },
                        doctor: {
                            include: {
                                user: { select: { firstName: true, lastName: true } },
                            },
                        },
                    },
                    skip,
                    take: Number(limit),
                    orderBy: { requestedAt: "desc" },
                }),
                database_1.default.labRequest.count({ where: whereClause }),
            ]);
            return res.json({
                success: true,
                data: requests,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit)),
                },
            });
        }
        catch (error) {
            console.error("Get lab requests error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async updateLabRequest(req, res) {
        try {
            const { id } = req.params;
            const labTechId = await LabTechController.getLabTechId(req.user.id);
            const { results, attachments, status } = req.body;
            const labRequest = await database_1.default.labRequest.findUnique({
                where: { id },
                include: { doctor: true },
            });
            if (!labRequest) {
                return res.status(404).json({
                    success: false,
                    error: "Lab request not found",
                });
            }
            const labTech = await database_1.default.labTech.findUnique({ where: { id: labTechId }, select: { hospitalId: true } });
            if (labRequest.labTechId !== labTechId && (labRequest.labTechId || labRequest.doctor.hospitalId !== labTech?.hospitalId)) {
                return res.status(403).json({
                    success: false,
                    error: "No access to this lab request",
                });
            }
            const updateData = {};
            if (results)
                updateData.results = results;
            if (attachments)
                updateData.attachments = { push: attachments };
            if (status)
                updateData.status = status;
            if (status === "completed")
                updateData.completedAt = new Date();
            if (!labRequest.labTechId)
                updateData.labTechId = labTechId;
            const updatedRequest = await database_1.default.labRequest.update({
                where: { id },
                data: updateData,
                include: {
                    patient: {
                        include: { user: { select: { firstName: true, lastName: true } } },
                    },
                    doctor: {
                        include: { user: { select: { firstName: true, lastName: true } } },
                    },
                },
            });
            return res.json({
                success: true,
                data: updatedRequest,
            });
        }
        catch (error) {
            console.error("Update lab request error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
}
exports.LabTechController = LabTechController;
//# sourceMappingURL=labTechController.js.map