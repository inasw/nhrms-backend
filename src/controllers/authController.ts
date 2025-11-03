import type { Request, Response } from "express"
import bcrypt from "bcryptjs"
import prisma from "../config/database"
import { generateAccessToken, generateRefreshToken, verifyToken } from "../config/jwt"
import type { ApiResponse } from "../types"
import type { PrismaClient } from "@prisma/client";

export class AuthController {
  // Generic login for all user types
  static async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body

      // Find user with related data
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          doctor: { include: { hospital: true } },
          patient: true,
          adminUser: { include: { hospital: true } },
          labTech: { include: { hospital: true } },
          pharmacist: { include: { pharmacy: true } },
          regionAdmin: true,
        },
      })

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: "Invalid credentials or inactive account",
        } as ApiResponse)
      }

      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: "Invalid credentials",
        } as ApiResponse)
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      })

      // Generate tokens
      const tokenPayload = {
        userId: user.id,
        role: user.role,
        hospitalId: user.doctor?.hospitalId || user.adminUser?.hospitalId,
        pharmacyId: user.pharmacist?.pharmacyId,
        region: user.regionAdmin?.region,
      }

      const accessToken = generateAccessToken(tokenPayload)
      const refreshToken = generateRefreshToken(tokenPayload)

      // Prepare user data based on role
      const userData: any = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      }

      if (user.doctor) {
        userData.doctor = {
          id: user.doctor.id,
          licenseNumber: user.doctor.licenseNumber,
          specialization: user.doctor.specialization,
          hospital: user.doctor.hospital,
        }
      }

      if (user.patient) {
        userData.patient = {
          id: user.patient.id,
          faydaId: user.patient.faydaId,
          dateOfBirth: user.patient.dateOfBirth,
          gender: user.patient.gender,
        }
      }

      if (user.adminUser) {
        userData.admin = {
          id: user.adminUser.id,
          role: user.adminUser.role,
          permissions: user.adminUser.permissions,
          hospital: user.adminUser.hospital,
        }
      }

      if (user.labTech) { 
        userData.labTech = {
          id: user.labTech.id,
          licenseNumber: user.labTech.licenseNumber,
          hospital: user.labTech.hospital,
        }
      }

      if (user.pharmacist) {
        userData.pharmacist = {
          id: user.pharmacist.id,
          licenseNumber: user.pharmacist.licenseNumber,
          pharmacy: user.pharmacist.pharmacy,
        }
      }

      if (user.regionAdmin) {
        userData.regionAdmin = {
          id: user.regionAdmin.id,
          region: user.regionAdmin.region,
          permissions: user.regionAdmin.permissions,
        }
      }

      return res.json({
        success: true,
        data: {
          user: userData,
          accessToken,
          refreshToken,
        },
      } as ApiResponse)
    } catch (error) {
      console.error("Login error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Patient registration
  // static async registerPatient(req: Request, res: Response): Promise<Response> {
  //   try {
  //     const { firstName, lastName, email, phone, password, faydaId, dateOfBirth, gender, bloodType, height, weight } =
  //       req.body

  //     // Check if user already exists
  //     const existingUser = await prisma.user.findFirst({
  //       where: {
  //         OR: [{ email }, { phone }, { nationalId: faydaId }],
  //       },
  //     })

  //     if (existingUser) {
  //       return res.status(400).json({
  //         success: false,
  //         error: "User with this email, phone, or Fayda ID already exists",
  //       } as ApiResponse)
  //     }

  //     // Hash password
  //     const hashedPassword = await bcrypt.hash(password, 12)

  //     // Create user and patient in transaction
  //     const result = await prisma.$transaction(async (tx) => {
  //       const user = await tx.user.create({
  //         data: {
  //           nationalId: faydaId,
  //           firstName,
  //           lastName,
  //           email,
  //           phone,
  //           password: hashedPassword,
  //           role: "patient",
  //         },
  //       })

  //       const patient = await tx.patient.create({
  //         data: {
  //           userId: user.id,
  //           faydaId,
  //           dateOfBirth: new Date(dateOfBirth),
  //           gender,
  //           bloodType,
  //           height,
  //           weight,
  //         },
  //       })

  //       return { user, patient }
  //     })

  //     return res.status(201).json({
  //       success: true,
  //       data: {
  //         message: "Patient registered successfully",
  //         userId: result.user.id,
  //         patientId: result.patient.id,
  //       },
  //     } as ApiResponse)
  //   } catch (error) {
  //     console.error("Patient registration error:", error)
  //     return res.status(500).json({
  //       success: false,
  //       error: "Internal server error",
  //     } as ApiResponse)
  //   }
  // }
// Patient registration
static async registerPatient(req: Request, res: Response): Promise<Response> {
  try {
    const { firstName, lastName, email, phone, password, faydaId, dateOfBirth, gender, bloodType, height, weight,region,city } =
      req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }, { nationalId: faydaId }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User with this email, phone, or Fayda ID already exists",
      } as ApiResponse);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user and patient in transaction
    const result = await prisma.$transaction(
      async (
        tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">
      ): Promise<{ user: any; patient: any }> => {
        const user = await tx.user.create({
          data: {
            nationalId: faydaId,
            firstName,
            lastName,
            email,
            phone,
            password: hashedPassword,
            role: "patient",
          },
        });

        const patient = await tx.patient.create({
          data: {
            userId: user.id,
            faydaId,
            dateOfBirth: new Date(dateOfBirth),
            gender,
            bloodType,
            height,
            weight,
            region,
            city
          },
        });

        return { user, patient };
      }
    );

    return res.status(201).json({
      success: true,
      data: {
        message: "Patient registered successfully",
        userId: result.user.id,
        patientId: result.patient.id,
      },
    } as ApiResponse);
  } catch (error) {
    console.error("Patient registration error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ApiResponse);
  }
}
 
// Doctor registration (by admin)
static async registerDoctor(req: Request, res: Response): Promise<Response> {
  try {
    const { firstName, lastName, email, phone, password, licenseNumber, specialization, hospitalId } = req.body;

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
            nationalId: licenseNumber, // Using license as national ID for doctors
            firstName,
            lastName,
            email,
            phone,
            password: hashedPassword,
            role: "doctor",
          },
        });

        const doctor = await tx.doctor.create({
          data: {
            userId: user.id,
            licenseNumber,
            specialization,
            hospitalId,
            // createdBy,
          },
        });

        return { user, doctor };
      }
    );

    return res.status(201).json({
      success: true,
      data: {
        message: "Doctor registered successfully",
        userId: result.user.id,
        doctorId: result.doctor.id,
      },
    } as ApiResponse);
  } catch (error) {
    console.error("Doctor registration error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ApiResponse);
  }
}
  // Refresh token
  static async refreshToken(req: Request, res: Response): Promise<Response> {
    try {
      const { refreshToken } = req.body

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          error: "Refresh token required",
        } as ApiResponse)
      }

      // Verify refresh token
      const decoded = verifyToken(refreshToken)

      // Generate new access token
      const newAccessToken = generateAccessToken({
        userId: decoded.userId,
        role: decoded.role,
        hospitalId: decoded.hospitalId,
      })

      return res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
        },
      } as ApiResponse)
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: "Invalid refresh token",
      } as ApiResponse)
    }
  }

  // Get current user info
  static async me(req: any, res: Response): Promise<Response> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          doctor: { include: { hospital: true } },
          patient: true,
          adminUser: { include: { hospital: true } },
          labTech: { include: { hospital: true } },
          pharmacist: { include: { pharmacy: true } },
          regionAdmin: true,
        },
      })

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        } as ApiResponse)
      }

      // Prepare user data based on role
      const userData: any = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      }

      if (user.labTech) { 
        userData.labTech = {
          id: user.labTech.id,
          licenseNumber: user.labTech.licenseNumber,
          hospital: user.labTech.hospital,
          user: {
            firstName: user.firstName,
            lastName: user.lastName,
          },
        }
      }

      return res.json({
        success: true,
        data: userData,
      } as ApiResponse)
    } catch (error) {
      console.error("Get user info error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Logout
  static async logout(req: Request, res: Response): Promise<Response> {
    // In a production app, you'd want to blacklist the token
    return res.json({
      success: true,
      message: "Logged out successfully",
    } as ApiResponse)
  }

  // Pharmacist registration (by admin)
  static async registerPharmacist(req: Request, res: Response): Promise<Response> {
    try {
      const { firstName, lastName, email, phone, password, licenseNumber, pharmacyId } = req.body

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { phone }],
        },
      })

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: "User with this email or phone already exists",
        } as ApiResponse)
      }

      // Check if license number already exists
      const existingPharmacist = await prisma.pharmacist.findUnique({
        where: { licenseNumber },
      })

      if (existingPharmacist) {
        return res.status(400).json({
          success: false,
          error: "Pharmacist with this license number already exists",
        } as ApiResponse)
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12)

      // Create user and pharmacist in transaction
      const result = await prisma.$transaction(
        async (
          tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">
        ): Promise<{ user: any; pharmacist: any }> => {
          const user = await tx.user.create({
            data: {
              nationalId: licenseNumber,
              firstName,
              lastName,
              email,
              phone,
              password: hashedPassword,
              role: "pharmacist",
            },
          })

          const pharmacist = await tx.pharmacist.create({
            data: {
              userId: user.id,
              licenseNumber,
              pharmacyId,
            },
          })

          return { user, pharmacist }
        }
      )

      return res.status(201).json({
        success: true,
        data: {
          message: "Pharmacist registered successfully",
          userId: result.user.id,
          pharmacistId: result.pharmacist.id,
        },
      } as ApiResponse)
    } catch (error) {
      console.error("Pharmacist registration error:", error)
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }
}