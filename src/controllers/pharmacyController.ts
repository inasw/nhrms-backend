import type { Response } from "express"
import prisma from "../config/database"
import type { AuthenticatedRequest, ApiResponse } from "../types"

export class PharmacyController {
  // Get prescriptions for pharmacy
  static async getPrescriptions(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const pharmacistId = await PharmacyController.getPharmacistId(req.user!.id)
      const pharmacist = await prisma.pharmacist.findUnique({
        where: { id: pharmacistId },
        select: { pharmacyId: true },
      })

      const { page = 1, limit = 10, status, patientId, search } = req.query
      const skip = (Number(page) - 1) * Number(limit)

      const whereClause: any = { pharmacyId: pharmacist!.pharmacyId }

      if (status) {
        whereClause.status = status
      }

      if (patientId) {
        whereClause.patientId = patientId
      }

      if (search) {
        whereClause.OR = [
          { patient: { faydaId: { contains: search as string, mode: "insensitive" } } },
          { patient: { user: { firstName: { contains: search as string, mode: "insensitive" } } } },
          { patient: { user: { lastName: { contains: search as string, mode: "insensitive" } } } },
        ]
      }

      const [prescriptions, total] = await Promise.all([
        prisma.prescription.findMany({
          where: whereClause,
          include: {
            patient: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, phone: true },
                },
              },
            },
            doctor: {
              include: {
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
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

  // Get prescription details
  static async getPrescriptionDetails(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const pharmacistId = await PharmacyController.getPharmacistId(req.user!.id)
      const pharmacist = await prisma.pharmacist.findUnique({
        where: { id: pharmacistId },
        select: { pharmacyId: true },
      })

      const prescription = await prisma.prescription.findFirst({
        where: {
          id,
          pharmacyId: pharmacist!.pharmacyId,
        },
        include: {
          patient: {
            include: {
              user: {
                select: { firstName: true, lastName: true, phone: true, email: true },
              },
            },
          },
          doctor: {
            include: {
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
          pharmacy: {
            select: { name: true, address: true, phone: true },
          },
        },
      })

      if (!prescription) {
        return res.status(404).json({
          success: false,
          error: "Prescription not found",
        } as ApiResponse)
      }

      return res.json({
        success: true,
        data: prescription,
      } as ApiResponse)
    } catch (error) {
      console.error("Get prescription details error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Dispense prescription
  static async dispensePrescription(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const { notes } = req.body
      const pharmacistId = await PharmacyController.getPharmacistId(req.user!.id)
      const pharmacist = await prisma.pharmacist.findUnique({
        where: { id: pharmacistId },
        select: { pharmacyId: true },
      })

      const prescription = await prisma.prescription.findFirst({
        where: {
          id,
          pharmacyId: pharmacist!.pharmacyId,
          status: "pending",
        },
      })

      if (!prescription) {
        return res.status(404).json({
          success: false,
          error: "Prescription not found or already dispensed",
        } as ApiResponse)
      }

      const updatedPrescription = await prisma.prescription.update({
        where: { id },
        data: {
          status: "dispensed",
          dispensedAt: new Date(),
          pharmacistId,
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

      return res.json({
        success: true,
        data: updatedPrescription,
        message: "Prescription dispensed successfully",
      } as ApiResponse)
    } catch (error) {
      console.error("Dispense prescription error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Get recent patients
  static async getRecentPatients(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const pharmacistId = await PharmacyController.getPharmacistId(req.user!.id)
      const pharmacist = await prisma.pharmacist.findUnique({
        where: { id: pharmacistId },
        select: { pharmacyId: true },
      })

      // Get patients who have prescriptions from this pharmacy, ordered by most recent
      const recentPatients = await prisma.patient.findMany({
        where: {
          prescriptions: {
            some: {
              pharmacyId: pharmacist!.pharmacyId,
            },
          },
        },
        include: {
          user: {
            select: { firstName: true, lastName: true, phone: true },
          },
          prescriptions: {
            where: {
              pharmacyId: pharmacist!.pharmacyId,
            },
            include: {
              doctor: {
                include: {
                  user: {
                    select: { firstName: true, lastName: true },
                  },
                },
              },
            },
            orderBy: {
              issuedAt: 'desc',
            },
          },
        },
        orderBy: {
          prescriptions: {
            _count: 'desc',
          },
        },
        take: 10,
      })

      return res.json({
        success: true,
        data: recentPatients,
      } as ApiResponse)
    } catch (error) {
      console.error("Get recent patients error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Cancel prescription
  static async cancelPrescription(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const { reason } = req.body
      const pharmacistId = await PharmacyController.getPharmacistId(req.user!.id)
      const pharmacist = await prisma.pharmacist.findUnique({
        where: { id: pharmacistId },
        select: { pharmacyId: true },
      })

      const prescription = await prisma.prescription.findFirst({
        where: {
          id,
          pharmacyId: pharmacist!.pharmacyId,
        },
      })

      if (!prescription) {
        return res.status(404).json({
          success: false,
          error: "Prescription not found",
        } as ApiResponse)
      }

      const updatedPrescription = await prisma.prescription.update({
        where: { id },
        data: {
          status: "cancelled",
        },
      })

      return res.json({
        success: true,
        data: updatedPrescription,
        message: "Prescription cancelled",
      } as ApiResponse)
    } catch (error) {
      console.error("Cancel prescription error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Get dashboard stats
  static async getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const pharmacistId = await PharmacyController.getPharmacistId(req.user!.id)
      const pharmacist = await prisma.pharmacist.findUnique({
        where: { id: pharmacistId },
        select: { pharmacyId: true },
      })

      const today = new Date()
      const startOfDay = new Date(today.setHours(0, 0, 0, 0))
      const endOfDay = new Date(today.setHours(23, 59, 59, 999))

      const [pendingPrescriptions, dispensedToday, totalDispensed, cancelledToday] = await Promise.all([
        prisma.prescription.count({
          where: {
            pharmacyId: pharmacist!.pharmacyId,
            status: "pending",
          },
        }),
        prisma.prescription.count({
          where: {
            pharmacyId: pharmacist!.pharmacyId,
            status: "dispensed",
            dispensedAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        }),
        prisma.prescription.count({
          where: {
            pharmacyId: pharmacist!.pharmacyId,
            status: "dispensed",
          },
        }),
        prisma.prescription.count({
          where: {
            pharmacyId: pharmacist!.pharmacyId,
            status: "cancelled",
          },
        }),
      ])

      return res.json({
        success: true,
        data: {
          pendingPrescriptions,
          dispensedToday,
          totalDispensed,
          cancelledToday,
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

  // Search patients
  static async searchPatients(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { query, page = 1, limit = 10 } = req.query

      if (!query) {
        return res.status(400).json({
          success: false,
          error: "Search query is required",
        } as ApiResponse)
      }

      const skip = (Number(page) - 1) * Number(limit)

      const whereClause: any = {
        OR: [
          { faydaId: { contains: query as string, mode: "insensitive" } },
          { user: { firstName: { contains: query as string, mode: "insensitive" } } },
          { user: { lastName: { contains: query as string, mode: "insensitive" } } },
          { user: { phone: { contains: query as string } } },
        ],
      }

      const [patients, total] = await Promise.all([
        prisma.patient.findMany({
          where: whereClause,
          include: {
            user: {
              select: { firstName: true, lastName: true, phone: true },
            },
          },
          skip,
          take: Number(limit),
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

  // Get pharmacy profile
  static async getPharmacyProfile(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const pharmacistId = await PharmacyController.getPharmacistId(req.user!.id)
      const pharmacist = await prisma.pharmacist.findUnique({
        where: { id: pharmacistId },
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true, phone: true },
          },
          pharmacy: {
            select: { name: true, address: true, phone: true, email: true, region: true, type: true },
          },
        },
      })

      if (!pharmacist) {
        return res.status(404).json({
          success: false,
          error: "Pharmacist not found",
        } as ApiResponse)
      }

      return res.json({
        success: true,
        data: pharmacist,
      } as ApiResponse)
    } catch (error) {
      console.error("Get pharmacy profile error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Update pharmacy profile
  static async updatePharmacyProfile(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const pharmacistId = await PharmacyController.getPharmacistId(req.user!.id)
      const { firstName, lastName, phone, email } = req.body

      const pharmacist = await prisma.pharmacist.findUnique({
        where: { id: pharmacistId },
        select: { userId: true },
      })

      if (!pharmacist) {
        return res.status(404).json({
          success: false,
          error: "Pharmacist not found",
        } as ApiResponse)
      }

      const updatedUser = await prisma.user.update({
        where: { id: pharmacist.userId },
        data: {
          firstName,
          lastName,
          phone,
          email,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      })

      return res.json({
        success: true,
        data: updatedUser,
        message: "Profile updated successfully",
      } as ApiResponse)
    } catch (error) {
      console.error("Update pharmacy profile error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Helper method to get pharmacist ID from user ID
  private static async getPharmacistId(userId: string): Promise<string> {
    const pharmacist = await prisma.pharmacist.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!pharmacist) {
      throw new Error("Pharmacist not found")
    }

    return pharmacist.id
  }
}
