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
      const requestWhereClause: any = { doctorId }

      if (date) {
        const startDate = new Date(date as string)
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 1)

        whereClause.scheduledTime = {
          gte: startDate,
          lt: endDate,
        }
        requestWhereClause.requestedDate = {
          gte: startDate,
          lt: endDate,
        }
      }

      if (status) {
        whereClause.status = status
        requestWhereClause.status = status
      }

      // Get both appointments and appointment requests
      const [appointments, appointmentRequests, appointmentTotal, requestTotal] = await Promise.all([
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
        prisma.appointmentRequest.findMany({
          where: requestWhereClause,
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
          skip: 0,
          take: Number(limit),
          orderBy: { requestedDate: "asc" },
        }),
        prisma.appointment.count({ where: whereClause }),
        prisma.appointmentRequest.count({ where: requestWhereClause }),
      ])

      // Convert appointment requests to appointment format
      const formattedRequests = appointmentRequests.map(r => ({
        id: r.id,
        scheduledTime: r.requestedDate,
        patient: r.patient,
        duration: 30,
        type: "Consultation",
        status: "pending",
        reason: r.reason,
        notes: r.notes,
  vitals: (r as any).vitals,
        hospital: r.hospital,
        isRequest: true
      }))

      // Combine and sort all appointments
      const allAppointments = [...appointments, ...formattedRequests]
        .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())

      const total = appointmentTotal + requestTotal

      return res.json({
        success: true,
        data: allAppointments,
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

  // Approve appointment request
  static async approveAppointmentRequest(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const doctorId = await DoctorController.getDoctorId(req.user!.id)
      const { id } = req.params
      const { scheduledTime, duration = 30 } = req.body

      const appointmentRequest = await prisma.appointmentRequest.findFirst({
        where: { id, doctorId },
      })

      if (!appointmentRequest) {
        return res.status(404).json({
          success: false,
          error: "Appointment request not found",
        } as ApiResponse)
      }

      // Get doctor's hospital ID
      const doctor = await prisma.doctor.findUnique({
        where: { id: doctorId },
        select: { hospitalId: true },
      })

      // Create doctor-patient assignment if it doesn't exist
      const assignment = await prisma.doctorPatientAssignment.upsert({
        where: {
          doctorId_patientId: {
            doctorId,
            patientId: appointmentRequest.patientId,
          },
        },
        update: {
          status: "active",
        },
        create: {
          doctorId,
          patientId: appointmentRequest.patientId,
          status: "active",
        },
      })
      
      console.log("Doctor-Patient assignment created/updated:", {
        doctorId,
        patientId: appointmentRequest.patientId,
        assignmentId: assignment.id,
        status: assignment.status
      })

      // Create actual appointment
      const appointment = await prisma.appointment.create({
        data: {
          patientId: appointmentRequest.patientId,
          doctorId,
          hospitalId: appointmentRequest.hospitalId || doctor!.hospitalId,
          scheduledTime: new Date(scheduledTime || appointmentRequest.requestedDate),
          duration,
          type: "consultation",
          reason: appointmentRequest.reason,
          notes: appointmentRequest.notes,
          status: "confirmed",
        },
      })

      // Update request status instead of deleting
      await prisma.appointmentRequest.update({
        where: { id },
        data: { status: "confirmed" },
      })

      return res.json({
        success: true,
        data: appointment,
        message: "Appointment approved successfully",
      } as ApiResponse)
    } catch (error) {
      console.error("Approve appointment request error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Reject appointment request
  static async rejectAppointmentRequest(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const doctorId = await DoctorController.getDoctorId(req.user!.id)
      const { id } = req.params
      const { reason } = req.body

      const updated = await prisma.appointmentRequest.updateMany({
        where: { id, doctorId },
        data: { status: "rejected", notes: reason || "Rejected by doctor" },
      })

      if (updated.count === 0) {
        return res.status(404).json({
          success: false,
          error: "Appointment request not found",
        } as ApiResponse)
      }

      return res.json({
        success: true,
        message: "Appointment request rejected successfully",
      } as ApiResponse)
    } catch (error) {
      console.error("Reject appointment request error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Get lab results for patients
  static async getLabResults(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const doctorId = await DoctorController.getDoctorId(req.user!.id)
      const { patientId, page = 1, limit = 10, status } = req.query

      const skip = (Number(page) - 1) * Number(limit)
      const whereClause: any = { doctorId }

      if (patientId) {
        whereClause.patientId = patientId
      }

      if (status) {
        whereClause.status = status
      }

      const [labResults, total] = await Promise.all([
        prisma.labRequest.findMany({
          where: whereClause,
          include: {
            patient: {
              include: {
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
            labTech: {
              include: {
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
          skip,
          take: Number(limit),
          orderBy: { requestedAt: "desc" },
        }),
        prisma.labRequest.count({ where: whereClause }),
      ])

      return res.json({
        success: true,
        data: labResults,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      } as ApiResponse)
    } catch (error) {
      console.error("Get lab results error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Create prescription
  static async createPrescription(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const doctorId = await DoctorController.getDoctorId(req.user!.id)
      const { patientId, medications, instructions, duration } = req.body

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

      const prescription = await prisma.prescription.create({
        data: {
          patientId,
          doctorId,
          medications,
          instructions,
          status: "active",
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
        data: prescription,
      } as ApiResponse)
    } catch (error) {
      console.error("Create prescription error:", error)
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

  // Get appointment requests
  static async getAppointmentRequests(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const doctorId = await DoctorController.getDoctorId(req.user!.id)
      const { page = 1, limit = 10, status } = req.query

      const skip = (Number(page) - 1) * Number(limit)
      const whereClause: any = { doctorId }

      if (status) {
        whereClause.status = status
      }

      const [requests, total] = await Promise.all([
        prisma.appointmentRequest.findMany({
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
          orderBy: { createdAt: "desc" },
        }),
        prisma.appointmentRequest.count({ where: whereClause }),
      ])

      return res.json({
        success: true,
        data: requests,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      } as ApiResponse)
    } catch (error) {
      console.error("Get appointment requests error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Get lab requests
  static async getLabRequests(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const doctorId = await DoctorController.getDoctorId(req.user!.id)
      const { patientId, page = 1, limit = 10, status } = req.query

      const skip = (Number(page) - 1) * Number(limit)
      const whereClause: any = { doctorId }

      if (patientId) {
        whereClause.patientId = patientId
      }

      if (status) {
        whereClause.status = status
      }

      const [labRequests, total] = await Promise.all([
        prisma.labRequest.findMany({
          where: whereClause,
          include: {
            patient: {
              include: {
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
            labTech: {
              include: {
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
          skip,
          take: Number(limit),
          orderBy: { requestedAt: "desc" },
        }),
        prisma.labRequest.count({ where: whereClause }),
      ])

      return res.json({
        success: true,
        data: labRequests,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      } as ApiResponse)
    } catch (error) {
      console.error("Get lab requests error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  static async createLabRequest(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const doctorId = await DoctorController.getDoctorId(req.user!.id)
      const { patientId, testType, instructions, labTechId, priority = "routine" } = req.body

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

  // Get prescriptions for patients
  static async getPrescriptions(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const doctorId = await DoctorController.getDoctorId(req.user!.id)
      const { patientId, page = 1, limit = 10, status } = req.query

      const skip = (Number(page) - 1) * Number(limit)
      const whereClause: any = { doctorId }

      if (patientId) {
        whereClause.patientId = patientId
      }

      if (status) {
        whereClause.status = status
      }

      const [prescriptions, total] = await Promise.all([
        prisma.prescription.findMany({
          where: whereClause,
          include: {
            patient: {
              include: {
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
            pharmacy: {
              select: { name: true },
            },
          },
          skip,
          take: Number(limit),
          orderBy: { issuedAt: "desc" },
        }),
        prisma.prescription.count({ where: whereClause }),
      ])

      return res.json({
        success: true,
        data: prescriptions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      } as ApiResponse)
    } catch (error) {
      console.error("Get prescriptions error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Get medical records for patients
  static async getMedicalRecords(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const doctorId = await DoctorController.getDoctorId(req.user!.id)
      const { patientId, page = 1, limit = 10, recordType } = req.query

      const skip = (Number(page) - 1) * Number(limit)
      const whereClause: any = { doctorId }

      if (patientId) {
        whereClause.patientId = patientId
      }

      if (recordType) {
        whereClause.recordType = recordType
      }

      const [medicalRecords, total] = await Promise.all([
        prisma.medicalRecord.findMany({
          where: whereClause,
          include: {
            patient: {
              include: {
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
          skip,
          take: Number(limit),
          orderBy: { date: "desc" },
        }),
        prisma.medicalRecord.count({ where: whereClause }),
      ])

      return res.json({
        success: true,
        data: medicalRecords,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      } as ApiResponse)
    } catch (error) {
      console.error("Get medical records error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Update prescription status
  static async updatePrescription(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const doctorId = await DoctorController.getDoctorId(req.user!.id)
      const updates = req.body

      // Verify prescription belongs to doctor
      const prescription = await prisma.prescription.findFirst({
        where: { id, doctorId },
      })

      if (!prescription) {
        return res.status(404).json({
          success: false,
          error: "Prescription not found",
        } as ApiResponse)
      }

      const updatedPrescription = await prisma.prescription.update({
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
        data: updatedPrescription,
      } as ApiResponse)
    } catch (error) {
      console.error("Update prescription error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Update medical record
  static async updateMedicalRecord(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const doctorId = await DoctorController.getDoctorId(req.user!.id)
      const updates = req.body

      // Verify medical record belongs to doctor
      const medicalRecord = await prisma.medicalRecord.findFirst({
        where: { id, doctorId },
      })

      if (!medicalRecord) {
        return res.status(404).json({
          success: false,
          error: "Medical record not found",
        } as ApiResponse)
      }

      const updatedRecord = await prisma.medicalRecord.update({
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
        data: updatedRecord,
      } as ApiResponse)
    } catch (error) {
      console.error("Update medical record error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Search patients with enhanced functionality
  static async searchPatients(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const doctorId = await DoctorController.getDoctorId(req.user!.id)
      const { query, page = 1, limit = 10, gender, ageMin, ageMax, condition } = req.query

      const skip = (Number(page) - 1) * Number(limit)
      const whereClause: any = {
        doctorPatientAssignments: {
          some: {
            doctorId,
            status: "active",
          },
        },
      }

      if (query) {
        whereClause.OR = [
          { faydaId: { contains: query as string, mode: "insensitive" } },
          { user: { firstName: { contains: query as string, mode: "insensitive" } } },
          { user: { lastName: { contains: query as string, mode: "insensitive" } } },
          { user: { phone: { contains: query as string } } },
        ]
      }

      if (gender) {
        whereClause.gender = gender
      }

      if (condition) {
        whereClause.chronicConditions = {
          has: condition as string
        }
      }

      // Age filtering would require date calculation
      if (ageMin || ageMax) {
        const now = new Date()
        if (ageMax) {
          const minBirthDate = new Date(now.getFullYear() - Number(ageMax), now.getMonth(), now.getDate())
          whereClause.dateOfBirth = { gte: minBirthDate }
        }
        if (ageMin) {
          const maxBirthDate = new Date(now.getFullYear() - Number(ageMin), now.getMonth(), now.getDate())
          whereClause.dateOfBirth = { ...whereClause.dateOfBirth, lte: maxBirthDate }
        }
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
      console.error("Search patients error:", error)
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

