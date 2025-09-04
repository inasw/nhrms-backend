// New file: labTechController.ts

import type { Response } from "express"
import prisma from "../config/database"
import type { AuthenticatedRequest, ApiResponse } from "../types"

export class LabTechController {
  private static async getLabTechId(userId: string): Promise<string> {
    const labTech = await prisma.labTech.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!labTech) {
      throw new Error("Lab tech not found")
    }

    return labTech.id
  }

  // Search patient by Fayda ID
  static async searchPatient(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { faydaId } = req.query

      if (!faydaId) {
        return res.status(400).json({
          success: false,
          error: "Fayda ID required",
        } as ApiResponse)
      }

      const patient = await prisma.patient.findUnique({
        where: { faydaId: faydaId as string },
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
      })

      if (!patient) {
        return res.status(404).json({
          success: false,
          error: "Patient not found",
        } as ApiResponse)
      }

      // Verify if the patient has a doctor in the same hospital as the lab tech
      const labTech = await prisma.labTech.findUnique({
        where: { userId: req.user!.id },
        select: { hospitalId: true },
      })

      const hasAccess = patient.doctorPatientAssignments.some(
        (assignment) => assignment.doctor.hospitalId === labTech?.hospitalId
      )

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: "No access to this patient",
        } as ApiResponse)
      }

      return res.json({
        success: true,
        data: patient,
      } as ApiResponse)
    } catch (error) {
      console.error("Search patient error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Get lab requests
  static async getLabRequests(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const labTechId = await LabTechController.getLabTechId(req.user!.id)
      const { status, patientId, page = 1, limit = 10 } = req.query

      const skip = (Number(page) - 1) * Number(limit)

      const whereClause: any = {}

      if (status) {
        whereClause.status = status as string
      }

      if (patientId) {
        whereClause.patientId = patientId as string
      }

      // Get requests assigned to this lab tech or unassigned in the same hospital
      const labTech = await prisma.labTech.findUnique({ where: { id: labTechId }, select: { hospitalId: true } })

      whereClause.OR = [
        { labTechId: labTechId },
        { labTechId: null, doctor: { hospitalId: labTech?.hospitalId } },
      ]

      const [requests, total] = await Promise.all([
        prisma.labRequest.findMany({
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
        prisma.labRequest.count({ where: whereClause }),
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
      console.error("Get lab requests error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Update lab request (upload results)
  static async updateLabRequest(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const labTechId = await LabTechController.getLabTechId(req.user!.id)
      const { results, attachments, status } = req.body

      // Find the request
      const labRequest = await prisma.labRequest.findUnique({
        where: { id },
        include: { doctor: true },
      })

      if (!labRequest) {
        return res.status(404).json({
          success: false,
          error: "Lab request not found",
        } as ApiResponse)
      }

      // Verify access: assigned to this lab tech or unassigned in same hospital
      const labTech = await prisma.labTech.findUnique({ where: { id: labTechId }, select: { hospitalId: true } })

      if (labRequest.labTechId !== labTechId && (labRequest.labTechId || labRequest.doctor.hospitalId !== labTech?.hospitalId)) {
        return res.status(403).json({
          success: false,
          error: "No access to this lab request",
        } as ApiResponse)
      }

      const updateData: any = {}
      if (results) updateData.results = results
      if (attachments) updateData.attachments = { push: attachments }
      if (status) updateData.status = status
      if (status === "completed") updateData.completedAt = new Date()
      if (!labRequest.labTechId) updateData.labTechId = labTechId // Assign to self if unassigned

      const updatedRequest = await prisma.labRequest.update({
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
      })

      // Optional: Create alert for doctor or patient

      return res.json({
        success: true,
        data: updatedRequest,
      } as ApiResponse)
    } catch (error) {
      console.error("Update lab request error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }
}