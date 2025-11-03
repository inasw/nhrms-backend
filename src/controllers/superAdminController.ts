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

// Get all patients
static async getPatients(req: AuthenticatedRequest, res: Response): Promise<Response> {
  try {
    const { page = 1, limit = 10, gender } = req.query

    const skip = (Number(page) - 1) * Number(limit)

    const whereClause: any = {}
    
    if (gender && ['male', 'female', 'other'].includes(gender as string)) {
      whereClause.gender = gender
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where: whereClause,
        select: {
          id: true,
          faydaId: true,
          gender: true,
          dateOfBirth: true,
          createdAt: true,
          // Skip region and city fields for now
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              isActive: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
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

// Get national dashboard stats
// static async getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<Response> {
//   try {
//     const [
//       totalFacilities, 
//       activeFacilities, 
//       totalDoctors, 
//       totalLabTechs,     
//       totalPharmacists,  
//       totalPatients, 
//       totalAppointments, 
//       totalAdmins,
//       recentActivity
//     ] = await Promise.all([
//       prisma.hospital.count(),
//       prisma.hospital.count({ where: { status: "active" } }),
//       // Count active doctors
//       prisma.doctor.count({ where: { isActive: true } }),
//       // Count active lab technicians
//       prisma.labTech.count({ where: { isActive: true } }),
//       // Count active pharmacists
//       prisma.pharmacist.count({ where: { isActive: true } }),
//       prisma.patient.count(),
//       prisma.appointment.count({
//         where: {
//           scheduledTime: {
//             gte: new Date(new Date().setHours(0, 0, 0, 0)),
//           },
//         },
//       }),
//       prisma.adminUser.count({
//         where: { role: "hospital_admin" }
//       }),
//       prisma.auditLog.findMany({
//         take: 10,
//         orderBy: { timestamp: "desc" },
//         select: {
//           action: true,
//           entityType: true,
//           timestamp: true,
//           metadata: true,
//         },
//       }),
//     ])

//     // Calculate total medical staff (doctors + lab techs + pharmacists)
//     const totalMedicalStaff = totalDoctors + totalLabTechs + totalPharmacists

//     return res.json({
//       success: true,
//       data: {
//         facilities: {
//           total: totalFacilities,
//           active: activeFacilities,
//           inactive: totalFacilities - activeFacilities,
//         },
//         staff: {
//           doctors: totalDoctors,
//           labTechnicians: totalLabTechs,
//           pharmacists: totalPharmacists,
//           total: totalMedicalStaff,
//         },
//         patients: {
//           total: totalPatients,
//         },
//         appointments: {
//           today: totalAppointments,
//         },
//         totalAdmins: totalAdmins,
//         recentActivity,
//       },
//     } as ApiResponse)
//   } catch (error) {
//     console.error("Get dashboard stats error:", error)
//     return res.status(500).json({
//       success: false,
//       error: "Internal server error",
//     } as ApiResponse)
//   }
// }
static async getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<Response> {
  try {
    const [
      totalFacilities, 
      activeFacilities, 
      totalDoctors, 
      totalLabTechs,
      totalPharmacists, 
      totalPatients, 
      totalAppointments, 
      totalAdmins,
      recentActivity
    ] = await Promise.all([
      prisma.hospital.count(),
      prisma.hospital.count({ where: { status: "active" } }),
      prisma.doctor.count({ where: { isActive: true } }),
      prisma.labTech.count({ where: { isActive: true } }),
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
          total: totalPatients, // Now using actual patient count
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

  // Create pharmacy
  static async createPharmacy(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { name, code, address, phone, email, region, type, licenseNumber } = req.body

      if (!licenseNumber) {
        return res.status(400).json({
          success: false,
          error: "License number is required"
        } as ApiResponse)
      }

      const existingPharmacy = await prisma.pharmacy.findUnique({
        where: { code },
      })

      if (existingPharmacy) {
        return res.status(400).json({
          success: false,
          error: "Pharmacy with this code already exists",
        } as ApiResponse)
      }

      const pharmacy = await prisma.pharmacy.create({
        data: {
          name,
          code,
          address,
          phone,
          email,
          region,
          type,
          licenseNumber,
          status: "active",
          createdBy: req.user!.id,
        },
      })

      return res.status(201).json({
        success: true,
        data: pharmacy,
      } as ApiResponse)
    } catch (error) {
      console.error("Create pharmacy error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Create pharmacist (user + profile)
  static async createPharmacist(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { user, licenseNumber, pharmacyId } = req.body
      const { firstName, lastName, email, phone, password, nationalId } = user

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { phone }, { nationalId }],
        },
      })

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: "User with this email, phone, or national ID already exists",
        } as ApiResponse)
      }

      // Check if pharmacy exists
      const pharmacy = await prisma.pharmacy.findUnique({
        where: { id: pharmacyId },
      })

      if (!pharmacy) {
        return res.status(400).json({
          success: false,
          error: "Pharmacy not found",
        } as ApiResponse)
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12)

      // Create user and pharmacist profile in transaction
      const result = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            nationalId,
            firstName,
            lastName,
            email,
            phone,
            password: hashedPassword,
            role: "pharmacist",
            createdBy: req.user!.id,
          },
        })

        const pharmacist = await tx.pharmacist.create({
          data: {
            userId: newUser.id,
            licenseNumber,
            pharmacyId,
            isActive: true,
          },
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, phone: true },
            },
            pharmacy: {
              select: { name: true, code: true },
            },
          },
        })

        return { user: newUser, pharmacist }
      })

      return res.status(201).json({
        success: true,
        data: result.pharmacist,
        message: "Pharmacist created successfully",
      } as ApiResponse)
    } catch (error) {
      console.error("Create pharmacist error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Get all pharmacies
  static async getPharmacies(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { page = 1, limit = 10, region, status } = req.query
      const skip = (Number(page) - 1) * Number(limit)

      const whereClause: any = {}
      if (region) whereClause.region = region
      if (status) whereClause.status = status

      const [pharmacies, total] = await Promise.all([
        prisma.pharmacy.findMany({
          where: whereClause,
          include: {
            _count: {
              select: { pharmacists: true, prescriptions: true },
            },
          },
          skip,
          take: Number(limit),
          orderBy: { createdAt: "desc" },
        }),
        prisma.pharmacy.count({ where: whereClause }),
      ])

      return res.json({
        success: true,
        data: pharmacies,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      } as ApiResponse)
    } catch (error) {
      console.error("Get pharmacies error:", error)
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

  // ============ REGION ADMIN MANAGEMENT ============

  // Get all region admins
  static async getRegionAdmins(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { page = 1, limit = 20, region } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const whereClause: any = {};
      if (region) {
        whereClause.region = region as string;
      }

      const [regionAdmins, total] = await Promise.all([
        prisma.regionAdmin.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                nationalId: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                isActive: true,
                lastLogin: true,
                createdAt: true
              }
            },
            hospitals: { select: { id: true, name: true } },
            pharmacies: { select: { id: true, name: true } },
            adminUsers: { select: { id: true } }
          },
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.regionAdmin.count({ where: whereClause })
      ]);

      return res.json({
        success: true,
        data: regionAdmins,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      } as ApiResponse);
    } catch (error) {
      console.error('Get region admins error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  }

  // Create a new region admin
  static async createRegionAdmin(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { nationalId, firstName, lastName, email, phone, password, region, permissions } = req.body;

      // Validate required fields
      if (!nationalId || !firstName || !lastName || !email || !phone || !password || !region) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        } as ApiResponse);
      }

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { nationalId },
            { email },
            { phone }
          ]
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'User with this national ID, email, or phone already exists'
        } as ApiResponse);
      }

      // Check if region already has an admin
      const existingRegionAdmin = await prisma.regionAdmin.findFirst({
        where: { region }
      });

      if (existingRegionAdmin) {
        return res.status(400).json({
          success: false,
          error: `Region ${region} already has an admin assigned`
        } as ApiResponse);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user and region admin in transaction
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            nationalId,
            firstName,
            lastName,
            email,
            phone,
            password: hashedPassword,
            role: 'region_admin',
            isActive: true,
            createdBy: req.user!.id
          }
        });

        const regionAdmin = await tx.regionAdmin.create({
          data: {
            userId: user.id,
            region,
            permissions: permissions || []
          }
        });

        return { user, regionAdmin };
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          action: 'region_admin_created',
          entityType: 'RegionAdmin',
          entityId: result.regionAdmin.id,
          performedBy: req.user!.id,
          metadata: { region, name: `${firstName} ${lastName}` }
        }
      });

      return res.status(201).json({
        success: true,
        data: {
          user: {
            id: result.user.id,
            nationalId: result.user.nationalId,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            email: result.user.email,
            phone: result.user.phone
          },
          regionAdmin: result.regionAdmin
        },
        message: 'Region admin created successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Create region admin error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  }

  // Update a region admin
  static async updateRegionAdmin(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { firstName, lastName, email, phone, region, permissions, isActive } = req.body;

      const regionAdmin = await prisma.regionAdmin.findUnique({
        where: { id },
        include: { user: true }
      });

      if (!regionAdmin) {
        return res.status(404).json({
          success: false,
          error: 'Region admin not found'
        } as ApiResponse);
      }

      // If changing region, check if new region already has an admin
      if (region && region !== regionAdmin.region) {
        const existingRegionAdmin = await prisma.regionAdmin.findFirst({
          where: { region, id: { not: id } }
        });

        if (existingRegionAdmin) {
          return res.status(400).json({
            success: false,
            error: `Region ${region} already has an admin assigned`
          } as ApiResponse);
        }
      }

      // Update in transaction
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
          where: { id: regionAdmin.userId },
          data: {
            firstName,
            lastName,
            email,
            phone,
            isActive,
            updatedBy: req.user!.id
          }
        });

        const updatedRegionAdmin = await tx.regionAdmin.update({
          where: { id },
          data: {
            region,
            permissions
          }
        });

        return { user, regionAdmin: updatedRegionAdmin };
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          action: 'region_admin_updated',
          entityType: 'RegionAdmin',
          entityId: id,
          performedBy: req.user!.id,
          metadata: { updates: req.body }
        }
      });

      return res.json({
        success: true,
        data: result,
        message: 'Region admin updated successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Update region admin error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  }

  // Delete a region admin
  static async deleteRegionAdmin(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      const regionAdmin = await prisma.regionAdmin.findUnique({
        where: { id },
        include: { user: true }
      });

      if (!regionAdmin) {
        return res.status(404).json({
          success: false,
          error: 'Region admin not found'
        } as ApiResponse);
      }

      // Delete user (cascade will delete regionAdmin)
      await prisma.user.delete({
        where: { id: regionAdmin.userId }
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          action: 'region_admin_deleted',
          entityType: 'RegionAdmin',
          entityId: id,
          performedBy: req.user!.id,
          metadata: { 
            region: regionAdmin.region,
            name: `${regionAdmin.user.firstName} ${regionAdmin.user.lastName}`
          }
        }
      });

      return res.json({
        success: true,
        message: 'Region admin deleted successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Delete region admin error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  }

  // Get statistics for all regions
  static async getRegionStatistics(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const regions = await prisma.regionAdmin.findMany({
        include: {
          hospitals: { select: { id: true, status: true } },
          pharmacies: { select: { id: true, status: true } },
          adminUsers: { select: { id: true } }
        }
      });

      const statistics = await Promise.all(
        regions.map(async (regionAdmin) => {
          const patientCount = await prisma.patient.count({
            where: { region: regionAdmin.region }
          });

          return {
            region: regionAdmin.region,
            regionAdminId: regionAdmin.id,
            hospitals: regionAdmin.hospitals.length,
            activeHospitals: regionAdmin.hospitals.filter(h => h.status === 'active').length,
            pharmacies: regionAdmin.pharmacies.length,
            activePharmacies: regionAdmin.pharmacies.filter(p => p.status === 'active').length,
            hospitalAdmins: regionAdmin.adminUsers.length,
            patients: patientCount
          };
        })
      );

      return res.json({
        success: true,
        data: statistics
      } as ApiResponse);
    } catch (error) {
      console.error('Get region statistics error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  }

  
}