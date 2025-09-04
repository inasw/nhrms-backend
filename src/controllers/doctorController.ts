import type { Response } from "express"
import prisma from "../config/database"
import type { AuthenticatedRequest, ApiResponse } from "../types"

export class DoctorController {
  // Get assigned patients
  static async getPatients(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const doctorId = await DoctorController.getDoctorId(req.user!.id)
      const { page = 1, limit = 10, status, search } = req.query

      const skip = (Number(page) - 1) * Number(limit)

      const whereClause: any = {
        doctorPatientAssignments: {
          some: {
            doctorId,
            status: status ? (status as string) : "active",
          },
        },
      }

      if (search) {
        whereClause.OR = [
          { faydaId: { contains: search as string, mode: "insensitive" } },
          { user: { firstName: { contains: search as string, mode: "insensitive" } } },
          { user: { lastName: { contains: search as string, mode: "insensitive" } } },
        ]
      }

      const [patients, total] = await Promise.all([
        prisma.patient.findMany({
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
        prisma.patient.count({ where: whereClause }),
      ])

      return res.json({
        success: true,
        data: patients,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      } as ApiResponse)
    } catch (error) {
      console.error("Get patients error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Get patient details
  static async getPatientDetails(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const doctorId = await DoctorController.getDoctorId(req.user!.id)

      // Verify doctor has access to this patient
      const assignment = await prisma.doctorPatientAssignment.findFirst({
        where: {
          doctorId,
          patientId: id,
          status: "active",
        },
      })

      if (!assignment) {
        return res.status(403).json({
          success: false,
          error: "Access denied to this patient",
        } as ApiResponse)
      }

      const patient = await prisma.patient.findUnique({
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
      })

      return res.json({
        success: true,
        data: patient,
      } as ApiResponse)
    } catch (error) {
      console.error("Get patient details error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Get appointments
  static async getAppointments(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const doctorId = await DoctorController.getDoctorId(req.user!.id)
      const { date, status, page = 1, limit = 10 } = req.query

      const skip = (Number(page) - 1) * Number(limit)

      const whereClause: any = { doctorId }

      if (date) {
        const startDate = new Date(date as string)
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 1)

        whereClause.scheduledTime = {
          gte: startDate,
          lt: endDate,
        }
      }

      if (status) {
        whereClause.status = status
      }

      const [appointments, total] = await Promise.all([
        prisma.appointment.findMany({
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
        prisma.appointment.count({ where: whereClause }),
      ])

      return res.json({
        success: true,
        data: appointments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      } as ApiResponse)
    } catch (error) {
      console.error("Get appointments error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Create appointment
  static async createAppointment(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const doctorId = await DoctorController.getDoctorId(req.user!.id)
      const { patientId, scheduledTime, duration, type, reason, notes } = req.body

      // Get doctor's hospital
      const doctor = await prisma.doctor.findUnique({
        where: { id: doctorId },
        select: { hospitalId: true },
      })

      const appointment = await prisma.appointment.create({
        data: {
          patientId,
          doctorId,
          hospitalId: doctor!.hospitalId,
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
      })

      return res.status(201).json({
        success: true,
        data: appointment,
      } as ApiResponse)
    } catch (error) {
      console.error("Create appointment error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Update appointment
  static async updateAppointment(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const doctorId = await DoctorController.getDoctorId(req.user!.id)
      const updates = req.body

      // Verify appointment belongs to doctor
      const appointment = await prisma.appointment.findFirst({
        where: { id, doctorId },
      })

      if (!appointment) {
        return res.status(404).json({
          success: false,
          error: "Appointment not found",
        } as ApiResponse)
      }

      const updatedAppointment = await prisma.appointment.update({
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
      })

      return res.json({
        success: true,
        data: updatedAppointment,
      } as ApiResponse)
    } catch (error) {
      console.error("Update appointment error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Create medical record
  static async createMedicalRecord(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const doctorId = await DoctorController.getDoctorId(req.user!.id)
      const { patientId, recordType, title, content, status, attachments } = req.body

      // Verify doctor has access to patient
      const assignment = await prisma.doctorPatientAssignment.findFirst({
        where: {
          doctorId,
          patientId,
          status: "active",
        },
      })

      if (!assignment) {
        return res.status(403).json({
          success: false,
          error: "Access denied to this patient",
        } as ApiResponse)
      }

      const medicalRecord = await prisma.medicalRecord.create({
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
      })

      return res.status(201).json({
        success: true,
        data: medicalRecord,
      } as ApiResponse)
    } catch (error) {
      console.error("Create medical record error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Get dashboard stats
  static async getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const doctorId = await DoctorController.getDoctorId(req.user!.id)
      const today = new Date()
      const startOfDay = new Date(today.setHours(0, 0, 0, 0))
      const endOfDay = new Date(today.setHours(23, 59, 59, 999))

      const [totalPatients, todayAppointments, activeAlerts, completedAppointments] = await Promise.all([
        prisma.doctorPatientAssignment.count({
          where: { doctorId, status: "active" },
        }),
        prisma.appointment.count({
          where: {
            doctorId,
            scheduledTime: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        }),
        prisma.alert.count({
          where: {
            createdBy: doctorId,
            isResolved: false,
          },
        }),
        prisma.appointment.count({
          where: {
            doctorId,
            status: "completed",
            scheduledTime: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        }),
      ])

      return res.json({
        success: true,
        data: {
          totalPatients,
          todayAppointments,
          activeAlerts,
          completedAppointments,
          responseTime: "15 min", // This would be calculated based on actual data
        },
      } as ApiResponse)
    } catch (error) {
      console.error("Get dashboard stats error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  static async createLabRequest(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const doctorId = await DoctorController.getDoctorId(req.user!.id)
      const { patientId, testType, instructions, labTechId } = req.body

      // Verify doctor has access to patient
      const assignment = await prisma.doctorPatientAssignment.findFirst({
        where: {
          doctorId,
          patientId,
          status: "active",
        },
      })

      if (!assignment) {
        return res.status(403).json({
          success: false,
          error: "Access denied to this patient",
        } as ApiResponse)
      }

      // Optional: Verify labTech belongs to same hospital
      if (labTechId) {
        const doctor = await prisma.doctor.findUnique({ where: { id: doctorId }, select: { hospitalId: true } })
        const labTech = await prisma.labTech.findUnique({ where: { id: labTechId } })
        if (labTech?.hospitalId !== doctor?.hospitalId) {
          return res.status(400).json({
            success: false,
            error: "Lab tech not in the same hospital",
          } as ApiResponse)
        }
      }

      const labRequest = await prisma.labRequest.create({
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
      })

      return res.status(201).json({
        success: true,
        data: labRequest,
      } as ApiResponse)
    } catch (error) {
      console.error("Create lab request error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Helper method to get doctor ID from user ID
  private static async getDoctorId(userId: string): Promise<string> {
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!doctor) {
      throw new Error("Doctor not found")
    }

    return doctor.id
  }
}

