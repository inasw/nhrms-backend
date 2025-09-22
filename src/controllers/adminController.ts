import type { Response } from "express"
import bcrypt from "bcryptjs"
import prisma from "../config/database"
import type { AuthenticatedRequest, ApiResponse } from "../types"
import { PrismaClient } from "@prisma/client"

export class AdminController {
  // Get hospital information
  static async getHospitalInfo(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const hospitalId = req.user!.hospitalId

      if (!hospitalId) {
        return res.status(400).json({
          success: false,
          error: "Hospital ID not found",
        } as ApiResponse)
      }

      const hospital = await prisma.hospital.findUnique({
        where: { id: hospitalId },
        include: {
          doctors: {
            where: { isActive: true },
            include: {
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
          _count: {
            select: {
              doctors: true,
              appointments: true,
            },
          },
        },
      })

      return res.json({
        success: true,
        data: hospital,
      } as ApiResponse)
    } catch (error) {
      console.error("Get hospital info error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Update hospital information
  static async updateHospitalInfo(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const hospitalId = req.user!.hospitalId
      const updates = req.body

      if (!hospitalId) {
        return res.status(400).json({
          success: false,
          error: "Hospital ID not found",
        } as ApiResponse)
      }

      const hospital = await prisma.hospital.update({
        where: { id: hospitalId },
        data: updates,
      })

      // Log the update
      await prisma.auditLog.create({
        data: {
          action: "hospital_updated",
          entityType: "Hospital",
          entityId: hospitalId,
          performedBy: req.user!.id,
          metadata: { updates },
        },
      })

      return res.json({
        success: true,
        data: hospital,
      } as ApiResponse)
    } catch (error) {
      console.error("Update hospital info error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Get all doctors
  static async getDoctors(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const hospitalId = req.user!.hospitalId
      const { page = 1, limit = 10, status, specialty } = req.query

      const skip = (Number(page) - 1) * Number(limit)

      const whereClause: any = { hospitalId }

      if (status) {
        whereClause.isActive = status === "active"
      }

      if (specialty) {
        whereClause.specialization = {
          contains: specialty as string,
          mode: "insensitive",
        }
      }

      const [doctors, total] = await Promise.all([
        prisma.doctor.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                lastLogin: true,
              },
            },
            _count: {
              select: {
                doctorPatientAssignments: {
                  where: { status: "active" },
                },
                appointments: {
                  where: {
                    scheduledTime: {
                      gte: new Date(),
                    },
                  },
                },
              },
            },
          },
          skip,
          take: Number(limit),
          orderBy: { createdAt: "desc" },
        }),
        prisma.doctor.count({ where: whereClause }),
      ])

      return res.json({
        success: true,
        data: doctors,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      } as ApiResponse)
    } catch (error) {
      console.error("Get doctors error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Add new doctor

  // static async addDoctor(req: AuthenticatedRequest, res: Response): Promise<Response> {
  //   try {
  //     const hospitalId = req.user!.hospitalId
  //     const { firstName, lastName, email, phone, licenseNumber, specialization, password } = req.body

        

  //     // Check if user already exists
  //     const existingUser = await prisma.user.findFirst({
  //       where: {
  //         OR: [{ email }, { phone }],
  //       },
  //     })

  //     if (existingUser) {
  //       return res.status(400).json({
  //         success: false,
  //         error: "User with this email or phone already exists",
  //       } as ApiResponse)
  //     }

  //     // Check if license number already exists
  //     const existingDoctor = await prisma.doctor.findUnique({
  //       where: { licenseNumber },
  //     })

  //     if (existingDoctor) {
  //       return res.status(400).json({
  //         success: false,
  //         error: "Doctor with this license number already exists",
  //       } as ApiResponse)
  //     }

  //     // Hash password
  //     const hashedPassword = await bcrypt.hash(password, 12)

  //     // Create user and doctor in transaction
  //     const result = await prisma.$transaction(async (tx) => {
  //       const user = await tx.user.create({
  //         data: {
  //           nationalId: licenseNumber,
  //           firstName,
  //           lastName,
  //           email,
  //           phone,
  //           password: hashedPassword,
  //           role: "doctor",
  //           createdBy: req.user!.id,
  //         },
  //       })

  //       const doctor = await tx.doctor.create({
  //         data: {
  //           userId: user.id,
  //           licenseNumber,
  //           specialization,
  //           hospitalId: hospitalId!,
  //         },
  //       })

  //       return { user, doctor }
  //     })

  //     // Log the action
  //     await prisma.auditLog.create({
  //       data: {
  //         action: "doctor_added",
  //         entityType: "Doctor",
  //         entityId: result.doctor.id,
  //         performedBy: req.user!.id,
  //         metadata: { licenseNumber, specialization },
  //       },
  //     })

  //     return res.status(201).json({
  //       success: true,
  //       data: {
  //         message: "Doctor added successfully",
  //         doctorId: result.doctor.id,
  //       },
  //     } as ApiResponse)
  //   } catch (error) {
  //     console.error("Add doctor error:", error)
  //     return res.status(500).json({
  //       success: false,
  //       error: "Internal server error",
  //     } as ApiResponse)
  //   }
  // }
//   static async addDoctor(req: AuthenticatedRequest, res: Response): Promise<Response> {
//   try {
//     const hospitalId = req.user!.hospitalId;
//     const { firstName, lastName, email, phone, licenseNumber, specialization, password } = req.body;

//     // Validate required fields
//     if (!firstName || !lastName || !email || !phone || !licenseNumber || !specialization || !password) {
//       return res.status(400).json({
//         success: false,
//         error: `Missing required fields: ${[
//           !firstName && 'firstName',
//           !lastName && 'lastName',
//           !email && 'email',
//           !phone && 'phone',
//           !licenseNumber && 'licenseNumber',
//           !specialization && 'specialization',
//           !password && 'password',
//         ].filter(Boolean).join(', ')}`,
//       } as ApiResponse);
//     }

//     // Check if hospitalId exists
//     if (!hospitalId) {
//       return res.status(400).json({
//         success: false,
//         error: "Hospital ID not found",
//       } as ApiResponse);
//     }

//     // Check if user already exists
//     const existingUser = await prisma.user.findFirst({
//       where: {
//         OR: [{ email }, { phone }],
//       },
//     });

//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         error: "User with this email or phone already exists",
//       } as ApiResponse);
//     }

//     // Check if license number already exists
//     const existingDoctor = await prisma.doctor.findUnique({
//       where: { licenseNumber },
//     });

//     if (existingDoctor) {
//       return res.status(400).json({
//         success: false,
//         error: "Doctor with this license number already exists",
//       } as ApiResponse);
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 12);

//     // Create user and doctor in transaction
//     const result = await prisma.$transaction(async (tx) => {
//       const user = await tx.user.create({
//         data: {
//           nationalId: licenseNumber,
//           firstName,
//           lastName,
//           email,
//           phone,
//           password: hashedPassword,
//           role: "doctor",
//           createdBy: req.user!.id,
//         },
//       });

//       const doctor = await tx.doctor.create({
//         data: {
//           userId: user.id,
//           licenseNumber,
//           specialization,
//           hospitalId: hospitalId!,
//         },
//       });

//       return { user, doctor };
//     });

//     // Log the action
//     await prisma.auditLog.create({
//       data: {
//         action: "doctor_added",
//         entityType: "Doctor",
//         entityId: result.doctor.id,
//         performedBy: req.user!.id,
//         metadata: { licenseNumber, specialization },
//       },
//     });

//     return res.status(201).json({
//       success: true,
//       data: {
//         message: "Doctor added successfully",
//         doctorId: result.doctor.id,
//       },
//     } as ApiResponse);
//   } catch (error) {
//     console.error("Add doctor error:", error);
//     return res.status(500).json({
//       success: false,
//       error: "Internal server error",
//     } as ApiResponse);
//   }
// }

  // Update doctor
  static async addDoctor(req: AuthenticatedRequest, res: Response): Promise<Response> {
  try {
    const hospitalId = req.user!.hospitalId;
    const { firstName, lastName, email, phone, licenseNumber, specialization, password } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !licenseNumber || !specialization || !password) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${[
          !firstName && 'firstName',
          !lastName && 'lastName',
          !email && 'email',
          !phone && 'phone',
          !licenseNumber && 'licenseNumber',
          !specialization && 'specialization',
          !password && 'password',
        ].filter(Boolean).join(', ')}`,
      } as ApiResponse);
    }

    if (!hospitalId) {
      return res.status(400).json({
        success: false,
        error: "Hospital ID not found",
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

    // Check if license number already exists
    const existingDoctor = await prisma.doctor.findUnique({
      where: { licenseNumber },
    });

    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        error: "Doctor with this license number already exists",
      } as ApiResponse);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user and doctor in transaction
    const result = await prisma.$transaction(
      async (
        tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">
      ): Promise<{ user: any; doctor: any }> => {
        const user = await tx.user.create({
          data: {
            nationalId: licenseNumber,
            firstName,
            lastName,
            email,
            phone,
            password: hashedPassword,
            role: "doctor",
            createdBy: req.user!.id,
          },
        });

        const doctor = await tx.doctor.create({
          data: {
            userId: user.id,
            licenseNumber,
            specialization,
            hospitalId: hospitalId!,
          },
        });

        return { user, doctor };
      }
    );

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: "doctor_added",
        entityType: "Doctor",
        entityId: result.doctor.id,
        performedBy: req.user!.id,
        metadata: { licenseNumber, specialization },
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        message: "Doctor added successfully",
        doctorId: result.doctor.id,
      },
    } as ApiResponse);
  } catch (error) {
    console.error("Add doctor error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ApiResponse);
  }
}
  
  
  // static async updateDoctor(req: AuthenticatedRequest, res: Response): Promise<Response> {
  //   try {
  //     const { id } = req.params
  //     const hospitalId = req.user!.hospitalId
  //     const updates = req.body

  //     // Verify doctor belongs to hospital
  //     const doctor = await prisma.doctor.findFirst({
  //       where: { id, hospitalId },
  //     })

  //     if (!doctor) {
  //       return res.status(404).json({
  //         success: false,
  //         error: "Doctor not found",
  //       } as ApiResponse)
  //     }

  //     // Separate user updates from doctor updates
  //     const { firstName, lastName, email, phone, ...doctorUpdates } = updates

  //     const userUpdates: any = {}
  //     if (firstName) userUpdates.firstName = firstName
  //     if (lastName) userUpdates.lastName = lastName
  //     if (email) userUpdates.email = email
  //     if (phone) userUpdates.phone = phone

  //     // Update in transaction
  //     const result = await prisma.$transaction(async (tx) => {
  //       if (Object.keys(userUpdates).length > 0) {
  //         await tx.user.update({
  //           where: { id: doctor.userId },
  //           data: { ...userUpdates, updatedBy: req.user!.id },
  //         })
  //       }

  //       if (Object.keys(doctorUpdates).length > 0) {
  //         await tx.doctor.update({
  //           where: { id },
  //           data: doctorUpdates,
  //         })
  //       }

  //       return await tx.doctor.findUnique({
  //         where: { id },
  //         include: {
  //           user: {
  //             select: { firstName: true, lastName: true, email: true, phone: true },
  //           },
  //         },
  //       })
  //     })

  //     // Log the action
  //     await prisma.auditLog.create({
  //       data: {
  //         action: "doctor_updated",
  //         entityType: "Doctor",
  //         entityId: id,
  //         performedBy: req.user!.id,
  //         metadata: { updates },
  //       },
  //     })

  //     return res.json({
  //       success: true,
  //       data: result,
  //     } as ApiResponse)
  //   } catch (error) {
  //     console.error("Update doctor error:", error)
  //     return res.status(500).json({
  //       success: false,
  //       error: "Internal server error",
  //     } as ApiResponse)
  //   }
  // }

  // Generate reports
 static async updateDoctor(req: AuthenticatedRequest, res: Response): Promise<Response> {
  try {
    const { id } = req.params;
    const hospitalId = req.user!.hospitalId;
    const updates = req.body;

    // Verify doctor belongs to hospital
    const doctor = await prisma.doctor.findFirst({
      where: { id, hospitalId },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: "Doctor not found",
      } as ApiResponse);
    }

    // Separate user updates from doctor updates
    const { firstName, lastName, email, phone, ...doctorUpdates } = updates;

    const userUpdates: any = {};
    if (firstName) userUpdates.firstName = firstName;
    if (lastName) userUpdates.lastName = lastName;
    if (email) userUpdates.email = email;
    if (phone) userUpdates.phone = phone;

    // Update in transaction
    const result = await prisma.$transaction(
      async (
        tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">
      ): Promise<any> => {
        if (Object.keys(userUpdates).length > 0) {
          await tx.user.update({
            where: { id: doctor.userId },
            data: { ...userUpdates, updatedBy: req.user!.id },
          });
        }

        if (Object.keys(doctorUpdates).length > 0) {
          await tx.doctor.update({
            where: { id },
            data: doctorUpdates,
          });
        }

        return await tx.doctor.findUnique({
          where: { id },
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true, phone: true },
            },
          },
        });
      }
    );

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: "doctor_updated",
        entityType: "Doctor",
        entityId: id,
        performedBy: req.user!.id,
        metadata: { updates },
      },
    });

    return res.json({
      success: true,
      data: result,
    } as ApiResponse);
  } catch (error) {
    console.error("Update doctor error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ApiResponse);
  }
}
 
  static async generateReport(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const hospitalId = req.user!.hospitalId
      const { type, title, parameters } = req.body

      const report = await prisma.report.create({
        data: {
          hospitalId: hospitalId!,
          type,
          title,
          generatedBy: req.user!.id,
          parameters,
          status: "pending",
        },
      })

      // In a real implementation, you would trigger report generation here
      // For now, we'll just mark it as completed
      setTimeout(async () => {
        await prisma.report.update({
          where: { id: report.id },
          data: {
            status: "completed",
            completedAt: new Date(),
            fileUrl: `/reports/${report.id}.pdf`,
          },
        })
      }, 2000)

      return res.status(201).json({
        success: true,
        data: report,
      } as ApiResponse)
    } catch (error) {
      console.error("Generate report error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Get system settings
  static async getSettings(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const hospitalId = req.user!.hospitalId
      const { type } = req.query

      const whereClause: any = { hospitalId }

      if (type) {
        whereClause.settingType = type
      }

      const settings = await prisma.systemSetting.findMany({
        where: whereClause,
        orderBy: { key: "asc" },
      })

      return res.json({
        success: true,
        data: settings,
      } as ApiResponse)
    } catch (error) {
      console.error("Get settings error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Update settings
  static async updateSettings(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const hospitalId = req.user!.hospitalId
      const { settings } = req.body

      const updatePromises = settings.map((setting: any) =>
        prisma.systemSetting.upsert({
          where: {
            hospitalId_key: {
              hospitalId: hospitalId!,
              key: setting.key,
            },
          },
          update: {
            value: setting.value,
            updatedBy: req.user!.id,
          },
          create: {
            hospitalId: hospitalId!,
            settingType: setting.settingType,
            key: setting.key,
            value: setting.value,
            updatedBy: req.user!.id,
          },
        }),
      )

      await Promise.all(updatePromises)

      // Log the action
      await prisma.auditLog.create({
        data: {
          action: "settings_updated",
          entityType: "SystemSetting",
          entityId: hospitalId!,
          performedBy: req.user!.id,
          metadata: { settingsCount: settings.length },
        },
      })

      return res.json({
        success: true,
        message: "Settings updated successfully",
      } as ApiResponse)
    } catch (error) {
      console.error("Update settings error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }


static async getLabTechs(req: AuthenticatedRequest, res: Response): Promise<Response> {
      try {
        const hospitalId = req.user!.hospitalId
        const { page = 1, limit = 10, status } = req.query
  
        const skip = (Number(page) - 1) * Number(limit)
  
        const whereClause: any = { hospitalId }
  
        if (status) {
          whereClause.isActive = status === "active"
        }
  
        const [labTechs, total] = await Promise.all([
          prisma.labTech.findMany({
            where: whereClause,
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                  lastLogin: true,
                },
              },
              _count: {
                select: {
                  labRequests: true,
                },
              },
            },
            skip,
            take: Number(limit),
            orderBy: { createdAt: "desc" },
          }),
          prisma.labTech.count({ where: whereClause }),
        ])
  
        return res.json({
          success: true,
          data: labTechs,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
          },
        } as ApiResponse)
      } catch (error) {
        console.error("Get lab techs error:", error)
        return res.status(500).json({
          success: false,
          error: "Internal server error",
        } as ApiResponse)
      }
    }

// static async addLabTech(req: AuthenticatedRequest, res: Response): Promise<Response> {
//     try {
//       const hospitalId = req.user!.hospitalId
//       const { firstName, lastName, email, phone, licenseNumber, password } = req.body

//       if (!hospitalId) {
//         return res.status(400).json({
//           success: false,
//           error: "Hospital ID not found",
//         } as ApiResponse)
//       }

//       // Check if user already exists
//       const existingUser = await prisma.user.findFirst({
//         where: {
//           OR: [{ email }, { phone }],
//         },
//       })

//       if (existingUser) {
//         return res.status(400).json({
//           success: false,
//           error: "User with this email or phone already exists",
//         } as ApiResponse)
//       }

//       // Check if license number already exists if provided
//       if (licenseNumber) {
//         const existingLabTech = await prisma.labTech.findUnique({
//           where: { licenseNumber },
//         })

//         if (existingLabTech) {
//           return res.status(400).json({
//             success: false,
//             error: "Lab tech with this license number already exists",
//           } as ApiResponse)
//         }
//       }

//       // Hash password
//       const hashedPassword = await bcrypt.hash(password, 12)

//       // Create user and lab tech in transaction
//       const result = await prisma.$transaction(async (tx) => {
//         const user = await tx.user.create({
//           data: {
//             nationalId: licenseNumber || `LT-${Date.now()}`,
//             firstName,
//             lastName,
//             email,
//             phone,
//             password: hashedPassword,
//             role: "lab_tech",
//             createdBy: req.user!.id,
//           },
//         })

//         const labTech = await tx.labTech.create({
//           data: {
//             userId: user.id,
//             licenseNumber,
//             hospitalId,
//           },
//         })

//         return { user, labTech }
//       })

//       // Log the action
//       await prisma.auditLog.create({
//         data: {
//           action: "lab_tech_added",
//           entityType: "LabTech",
//           entityId: result.labTech.id,
//           performedBy: req.user!.id,
//           metadata: { firstName, lastName, email },
//         },
//       })

//       return res.status(201).json({
//         success: true,
//         data: {
//           message: "Lab tech added successfully",
//           labTechId: result.labTech.id,
//         },
//       } as ApiResponse)
//     } catch (error) {
//       console.error("Add lab tech error:", error)
//       return res.status(500).json({
//         success: false,
//         error: "Internal server error",
//       } as ApiResponse)
//     }
//   }
static async addLabTech(req: AuthenticatedRequest, res: Response): Promise<Response> {
  try {
    const hospitalId = req.user!.hospitalId;
    const { firstName, lastName, email, phone, licenseNumber, password } = req.body;

    if (!hospitalId) {
      return res.status(400).json({
        success: false,
        error: "Hospital ID not found",
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

    // Check if license number already exists if provided
    if (licenseNumber) {
      const existingLabTech = await prisma.labTech.findUnique({
        where: { licenseNumber },
      });

      if (existingLabTech) {
        return res.status(400).json({
          success: false,
          error: "Lab tech with this license number already exists",
        } as ApiResponse);
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user and lab tech in transaction
    const result = await prisma.$transaction(
      async (
        tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">
      ): Promise<{ user: any; labTech: any }> => {
        const user = await tx.user.create({
          data: {
            nationalId: licenseNumber || `LT-${Date.now()}`,
            firstName,
            lastName,
            email,
            phone,
            password: hashedPassword,
            role: "lab_tech",
            createdBy: req.user!.id,
          },
        });

        const labTech = await tx.labTech.create({
          data: {
            userId: user.id,
            licenseNumber,
            hospitalId,
          },
        });

        return { user, labTech };
      }
    );

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: "lab_tech_added",
        entityType: "LabTech",
        entityId: result.labTech.id,
        performedBy: req.user!.id,
        metadata: { firstName, lastName, email },
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        message: "Lab tech added successfully",
        labTechId: result.labTech.id,
      },
    } as ApiResponse);
  } catch (error) {
    console.error("Add lab tech error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ApiResponse);
  }
}

  
// static async updateLabTech(req: AuthenticatedRequest, res: Response): Promise<Response> {
//     try {
//       const { id } = req.params
//       const hospitalId = req.user!.hospitalId
//       const updates = req.body

//       // Verify lab tech belongs to hospital
//       const labTech = await prisma.labTech.findFirst({
//         where: { id, hospitalId },
//       })

//       if (!labTech) {
//         return res.status(404).json({
//           success: false,
//           error: "Lab tech not found",
//         } as ApiResponse)
//       }

//       // Separate user updates from lab tech updates
//       const { firstName, lastName, email, phone, ...labTechUpdates } = updates

//       const userUpdates: any = {}
//       if (firstName) userUpdates.firstName = firstName
//       if (lastName) userUpdates.lastName = lastName
//       if (email) userUpdates.email = email
//       if (phone) userUpdates.phone = phone

//       // Update in transaction
//       const result = await prisma.$transaction(async (tx) => {
//         if (Object.keys(userUpdates).length > 0) {
//           await tx.user.update({
//             where: { id: labTech.userId },
//             data: { ...userUpdates, updatedBy: req.user!.id },
//           })
//         }

//         if (Object.keys(labTechUpdates).length > 0) {
//           await tx.labTech.update({
//             where: { id },
//             data: labTechUpdates,
//           })
//         }

//         return await tx.labTech.findUnique({
//           where: { id },
//           include: {
//             user: {
//               select: { firstName: true, lastName: true, email: true, phone: true },
//             },
//           },
//         })
//       })

//       // Log the action
//       await prisma.auditLog.create({
//         data: {
//           action: "lab_tech_updated",
//           entityType: "LabTech",
//           entityId: id,
//           performedBy: req.user!.id,
//           metadata: { updates },
//         },
//       })

//       return res.json({
//         success: true,
//         data: result,
//       } as ApiResponse)
//     } catch (error) {
//       console.error("Update lab tech error:", error)
//       return res.status(500).json({
//         success: false,
//         error: "Internal server error",
//       } as ApiResponse)
//     }
//   }
static async updateLabTech(req: AuthenticatedRequest, res: Response): Promise<Response> {
  try {
    const { id } = req.params;
    const hospitalId = req.user!.hospitalId;
    const updates = req.body;

    // Verify lab tech belongs to hospital
    const labTech = await prisma.labTech.findFirst({
      where: { id, hospitalId },
    });

    if (!labTech) {
      return res.status(404).json({
        success: false,
        error: "Lab tech not found",
      } as ApiResponse);
    }

    // Separate user updates from lab tech updates
    const { firstName, lastName, email, phone, ...labTechUpdates } = updates;

    const userUpdates: any = {};
    if (firstName) userUpdates.firstName = firstName;
    if (lastName) userUpdates.lastName = lastName;
    if (email) userUpdates.email = email;
    if (phone) userUpdates.phone = phone;

    // Update in transaction
    const result = await prisma.$transaction(
      async (
        tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">
      ): Promise<any> => {
        if (Object.keys(userUpdates).length > 0) {
          await tx.user.update({
            where: { id: labTech.userId },
            data: { ...userUpdates, updatedBy: req.user!.id },
          });
        }

        if (Object.keys(labTechUpdates).length > 0) {
          await tx.labTech.update({
            where: { id },
            data: labTechUpdates,
          });
        }

        return await tx.labTech.findUnique({
          where: { id },
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true, phone: true },
            },
          },
        });
      }
    );

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: "lab_tech_updated",
        entityType: "LabTech",
        entityId: id,
        performedBy: req.user!.id,
        metadata: { updates },
      },
    });

    return res.json({
      success: true,
      data: result,
    } as ApiResponse);
  } catch (error) {
    console.error("Update lab tech error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ApiResponse);
  }
}
}


  
  