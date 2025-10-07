import type { Response } from "express"
import bcrypt from "bcryptjs"
import prisma from "../config/database"
import type { AuthenticatedRequest, ApiResponse } from "../types"
import type { PrismaClient } from "@prisma/client";
import crypto from "crypto"
import { sendSmsTwilio } from "../services/smsService"

export class SuperAdminController {
  // Get all facilities
  static async getFacilities(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { page = 1, limit = 10, region, type, status } = req.query

      const skip = (Number(page) - 1) * Number(limit)

      const whereClause: any = {}

      if (region) {
        whereClause.region = {
          contains: region as string,
          mode: "insensitive",
        }
      }

      if (type) {
        whereClause.type = type
      }

      if (status) {
        whereClause.status = status
      }

      const [facilities, total] = await Promise.all([
        prisma.hospital.findMany({
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
        prisma.hospital.count({ where: whereClause }),
      ])

      return res.json({
        success: true,
        data: facilities,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      } as ApiResponse)
    } catch (error) {
      console.error("Get facilities error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Register new facility
  static async registerFacility(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { name, code, address, phone, email, region, type, operatingHours } = req.body

      // Check if facility code already exists
      const existingFacility = await prisma.hospital.findUnique({
        where: { code },
      })

      if (existingFacility) {
        return res.status(400).json({
          success: false,
          error: "Facility with this code already exists",
        } as ApiResponse)
      }

      const facility = await prisma.hospital.create({
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
          createdBy: req.user!.id, // Super admin who created this facility
        },
      })

      // Log the action
      await prisma.auditLog.create({
        data: {
          action: "facility_registered",
          entityType: "Hospital",
          entityId: facility.id,
          performedBy: req.user!.id,
          metadata: { name, code, region, type },
        },
      })

      return res.status(201).json({
        success: true,
        data: facility,
      } as ApiResponse)
    } catch (error) {
      console.error("Register facility error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Get facility details
  static async getFacilityDetails(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params

      const facility = await prisma.hospital.findUnique({
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
      })

      if (!facility) {
        return res.status(404).json({
          success: false,
          error: "Facility not found",
        } as ApiResponse)
      }

      return res.json({
        success: true,
        data: facility,
      } as ApiResponse)
    } catch (error) {
      console.error("Get facility details error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Update facility
  static async updateFacility(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const updates = req.body

      const facility = await prisma.hospital.update({
        where: { id },
        data: updates,
      })

      // Log the action
      await prisma.auditLog.create({
        data: {
          action: "facility_updated",
          entityType: "Hospital",
          entityId: id,
          performedBy: req.user!.id,
          metadata: { updates },
        },
      })

      return res.json({
        success: true,
        data: facility,
      } as ApiResponse)
    } catch (error) {
      console.error("Update facility error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }
  
  // Get all facility administrators
  static async getFacilityAdmins(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { page = 1, limit = 10, hospitalId, status } = req.query

      const skip = (Number(page) - 1) * Number(limit)

      const whereClause: any = { role: "hospital_admin" }

      if (hospitalId) {
        whereClause.hospitalId = hospitalId
      }

      if (status) {
        whereClause.user = {
          isActive: status === "active",
        }
      }

      const [admins, total] = await Promise.all([
        prisma.adminUser.findMany({
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
        prisma.adminUser.count({ where: whereClause }),
      ])

      return res.json({
        success: true,
        data: admins,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      } as ApiResponse)
    } catch (error) {
      console.error("Get facility admins error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Create facility administrator
  static async createFacilityAdmin(req: AuthenticatedRequest, res: Response): Promise<Response> {
  try {
    const { user, hospitalId, permissions } = req.body;
    const { firstName, lastName, email, phone, password } = user;

    const inviteToken = crypto.randomBytes(32).toString("hex")
    const inviteExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

    if (!hospitalId) {
      return res.status(400).json({
        success: false,
        error: "hospitalId is required",
      } as ApiResponse);
    }

    const existingHospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
    });

    if (!existingHospital) {
      return res.status(400).json({
        success: false,
        error: "Invalid hospitalId: Hospital not found",
      } as ApiResponse);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User with this email or phone already exists",
      } as ApiResponse);
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        error: "Password is required",
      } as ApiResponse);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user and admin in transaction
    const result = await prisma.$transaction(
      async (
        tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">
      ): Promise<{ user: any; admin: any }> => {
        const user = await tx.user.create({
          data: {
            nationalId: crypto.randomBytes(8).toString("hex"), // Using email as national ID for admins
            firstName,
            lastName,
            email,
            phone,
            password: hashedPassword,
            role: "hospital_admin",
            inviteToken,
            inviteExpiresAt,
            createdBy: req.user!.id,
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
      }
    );

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: "admin_created",
        entityType: "AdminUser",
        entityId: result.admin.id,
        performedBy: req.user!.id,
        metadata: { email, hospitalId },
      },
    });

    const inviteLink = `${process.env.FRONTEND_URL}/invite?token=${inviteToken}`;

    // Send invitation SMS using Twilio
    try {
      await sendSmsTwilio(phone, `Hello ${firstName}, you have been added as a hospital admin. Click to set up your account: ${inviteLink}`);
    } catch (smsError) {
      console.error("Failed to send Twilio SMS:", smsError);
    }


    return res.status(201).json({
      success: true,
      data: {
        message: "Facility administrator created successfully",
        adminId: result.admin.id,
      },
    } as ApiResponse);
  } catch (error) {
    console.error("Create facility admin error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ApiResponse);
  }
}

    // Update facility administrator
// static async updateFacilityAdmin(req: AuthenticatedRequest, res: Response): Promise<Response> {
//   try {
//     const { id } = req.params;
//     const { user, hospitalId, permissions, isActive } = req.body;
//     const { firstName, lastName, email, phone, password } = user || {};

//     // Check if admin exists
//     const existingAdmin = await prisma.adminUser.findUnique({
//       where: { id },
//       include: { user: true },
//     });

//     if (!existingAdmin) {
//       return res.status(404).json({
//         success: false,
//         error: "Administrator not found",
//       } as ApiResponse);
//     }

//     const existingHospital = await prisma.hospital.findUnique({
//       where: { id: hospitalId },
//     });

//     if (!existingHospital) {
//       return res.status(400).json({
//         success: false,
//         error: "Invalid hospitalId: Hospital not found",
//       } as ApiResponse);
//     }

//     // Check if new email/phone is already in use by another user
//     if (email || phone) {
//       const existingUser = await prisma.user.findFirst({
//         where: {
//           OR: [
//             { email: email || undefined, id: { not: existingAdmin.userId } },
//             { phone: phone || undefined, id: { not: existingAdmin.userId } },
//           ],
//         },
//       });

//       if (existingUser) {
//         return res.status(400).json({
//           success: false,
//           error: "Email or phone already in use by another user",
//         } as ApiResponse);
//       }
//     }

//     // Prepare update data
//     const userUpdateData: any = {};
//     if (firstName) userUpdateData.firstName = firstName;
//     if (lastName) userUpdateData.lastName = lastName;
//     if (email) userUpdateData.email = email;
//     if (phone) userUpdateData.phone = phone;
//     if (password) userUpdateData.password = await bcrypt.hash(password, 12);
//     if (isActive !== undefined) userUpdateData.isActive = isActive;

//     const adminUpdateData: any = {};
//     if (hospitalId) adminUpdateData.hospitalId = hospitalId;
//     if (permissions) adminUpdateData.permissions = permissions;

//     // Update user and admin in transaction
//     const result = await prisma.$transaction(
//       async (
//         tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">
//       ): Promise<{ user: any; admin: any }> => {
//         let updatedUser = existingAdmin.user;
//         if (Object.keys(userUpdateData).length > 0) {
//           updatedUser = await tx.user.update({
//             where: { id: existingAdmin.userId },
//             data: userUpdateData,
//           });
//         }

//         let updatedAdmin = existingAdmin;
//         if (Object.keys(adminUpdateData).length > 0) {
//           updatedAdmin = await tx.adminUser.update({
//             where: { id },
//             data: adminUpdateData,
//             include: { user: true },
//           });
//         } else {
//           // If not updated, fetch with user relation
//           updatedAdmin = await tx.adminUser.findUnique({
//             where: { id },
//             include: { user: true },
//           }) as typeof existingAdmin;
//         }

//         return { user: updatedUser, admin: updatedAdmin };
//       }
//     );

//     // Log the action
//     await prisma.auditLog.create({
//       data: {
//         action: "admin_updated",
//         entityType: "AdminUser",
//         entityId: id,
//         performedBy: req.user!.id,
//         metadata: {
//           updatedFields: {
//             user: userUpdateData,
//             admin: adminUpdateData,
//           },
//         },
//       },
//     });

//     return res.json({
//       success: true,
//       data: {
//         message: "Facility administrator updated successfully",
//         adminId: result.admin.id,
//       },
//     } as ApiResponse);
//   } catch (error) {
//     console.error("Update facility admin error:", error);
//     return res.status(500).json({
//       success: false,
//       error: "Internal server error",
//     } as ApiResponse);
//   }
// }
static async updateFacilityAdmin(req: AuthenticatedRequest, res: Response): Promise<Response> {
  try {
    const { id } = req.params;
    const { user, adminUser } = req.body;

    // Validate input
    if (!user || !adminUser) {
      return res.status(400).json({
        success: false,
        error: "User and adminUser objects are required",
      } as ApiResponse);
    }

    const { firstName, lastName, email, phone, isActive } = user;
    const { hospitalId, permissions, role } = adminUser;

    // Validate hospitalId
    if (!hospitalId || typeof hospitalId !== 'string' || hospitalId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: "A valid hospitalId is required",
      } as ApiResponse);
    }

    // Check if admin exists
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingAdmin) {
      return res.status(404).json({
        success: false,
        error: "Admin not found",
      } as ApiResponse);
    }

    // Check if hospital exists
    const existingHospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
    });

    if (!existingHospital) {
      return res.status(400).json({
        success: false,
        error: "Invalid hospitalId: Hospital not found",
      } as ApiResponse);
    }

    // Check if email is taken by another user
    if (email && email !== existingAdmin.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: "Email is already in use by another user",
        } as ApiResponse);
      }
    }

    // Prepare update data
    const userUpdateData: any = {};
    if (firstName) userUpdateData.firstName = firstName;
    if (lastName) userUpdateData.lastName = lastName;
    if (email) userUpdateData.email = email;
    if (phone) userUpdateData.phone = phone;
    if (isActive !== undefined) userUpdateData.isActive = isActive;

    const adminUpdateData: any = {};
    if (hospitalId) adminUpdateData.hospitalId = hospitalId;
    if (permissions) adminUpdateData.permissions = permissions;
    if (role) adminUpdateData.role = role;

    // Update user and admin in transaction
    const result = await prisma.$transaction(async (tx) => {
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
      } else {
        updatedAdmin = await tx.adminUser.findUnique({
          where: { id },
          include: { user: true },
        }) as typeof existingAdmin;
      }

      return { user: updatedUser, admin: updatedAdmin };
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: "admin_updated",
        entityType: "AdminUser",
        entityId: id,
        performedBy: req.user!.id,
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
    } as ApiResponse);
  } catch (error) {
    console.error("Update facility admin error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ApiResponse);
  }
}

// Get national dashboard stats
static async getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<Response> {
  try {
    const [
      totalFacilities, 
      activeFacilities, 
      totalDoctors, 
      totalLabTechs,     // Count lab technicians
      totalPharmacists,  // Count pharmacists
      totalPatients, 
      totalAppointments, 
      totalAdmins,
      recentActivity
    ] = await Promise.all([
      prisma.hospital.count(),
      prisma.hospital.count({ where: { status: "active" } }),
      // Count active doctors
      prisma.doctor.count({ where: { isActive: true } }),
      // Count active lab technicians
      prisma.labTech.count({ where: { isActive: true } }),
      // Count active pharmacists
      prisma.pharmacist.count({ where: { isActive: true } }),
      prisma.patient.count(),
      prisma.appointment.count({
        where: {
          scheduledTime: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.adminUser.count({
        where: { role: "hospital_admin" }
      }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { timestamp: "desc" },
        select: {
          action: true,
          entityType: true,
          timestamp: true,
          metadata: true,
        },
      }),
    ])

    // Calculate total medical staff (doctors + lab techs + pharmacists)
    const totalMedicalStaff = totalDoctors + totalLabTechs + totalPharmacists

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
          labTechnicians: totalLabTechs,
          pharmacists: totalPharmacists,
          total: totalMedicalStaff,
        },
        patients: {
          total: totalPatients,
        },
        appointments: {
          today: totalAppointments,
        },
        totalAdmins: totalAdmins,
        recentActivity,
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

  // Get audit logs
  static async getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { page = 1, limit = 50, action, entityType, startDate, endDate } = req.query

      const skip = (Number(page) - 1) * Number(limit)

      const whereClause: any = {}

      if (action) {
        whereClause.action = {
          contains: action as string,
          mode: "insensitive",
        }
      }

      if (entityType) {
        whereClause.entityType = entityType
      }

      if (startDate && endDate) {
        whereClause.timestamp = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        }
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where: whereClause,
          skip,
          take: Number(limit),
          orderBy: { timestamp: "desc" },
        }),
        prisma.auditLog.count({ where: whereClause }),
      ])

      return res.json({
        success: true,
        data: logs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      } as ApiResponse)
    } catch (error) {
      console.error("Get audit logs error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }
}