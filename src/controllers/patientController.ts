import type { Response } from "express"
import prisma from "../config/database"
import type { AuthenticatedRequest, ApiResponse } from "../types"

export class PatientController {
  // Submit vitals
  // static async submitVitals(req: AuthenticatedRequest, res: Response) {
  //   try {
  //     const patientId = await PatientController.getPatientId(req.user!.id)
  //     const {
  //       heartRate,
  //       bloodPressure,
  //       temperature,
  //       bloodSugar,
  //       oxygenSaturation,
  //       weight,
  //       notes,
  //       source = "manual",
  //       deviceId,
  //     } = req.body

  //     const vital = await prisma.patientVital.create({
  //       data: {
  //         patientId,
  //         heartRate,
  //         bloodPressure,
  //         temperature,
  //         bloodSugar,
  //         oxygenSaturation,
  //         weight,
  //         notes,
  //         source,
  //         deviceId,
  //       },
  //     })

  //     // Check for alerts based on vital signs
  //     await PatientController.checkVitalAlerts(patientId, vital)

  //     res.status(201).json({
  //       success: true,
  //       data: vital,
  //     } as ApiResponse)
  //   } catch (error) {
  //     console.error("Submit vitals error:", error)
  //     res.status(500).json({
  //       success: false,
  //       error: "Internal server error",
  //     } as ApiResponse)
  //   }
  // }
  static async submitVitals(req: AuthenticatedRequest, res: Response) {
    try {
      const patientId = await PatientController.getPatientId(req.user!.id);
      const {
        heartRate,
        bloodPressure,
        temperature,
        bloodSugar,
        oxygenSaturation,
        weight,
        notes,
        source = "manual",
        deviceId,
      } = req.body;

      // Create an array of PatientVital records
      const vitalRecords: Array<{
        patientId: string;
        type: string;
        value: number;
        unit: string;
        timestamp: Date;
        source?: string;
        deviceId?: string;
        notes?: string;
      }> = [];

      // Map input fields to PatientVital records
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
        vitalRecords.push(
          {
            patientId,
            type: "bloodPressureSystolic",
            value: systolic,
            unit: "mmHg",
            timestamp: new Date(),
            source,
            deviceId,
            notes,
          },
          {
            patientId,
            type: "bloodPressureDiastolic",
            value: diastolic,
            unit: "mmHg",
            timestamp: new Date(),
            source,
            deviceId,
            notes,
          }
        );
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

      // Create all vital records in a single transaction
      const createdVitals = await prisma.patientVital.createMany({
        data: vitalRecords,
      });

      // Fetch created vitals for alert checking
      const newVitals = await prisma.patientVital.findMany({
        where: {
          patientId,
          timestamp: { gte: new Date(Date.now() - 1000) }, // Vitals from this request
        },
      });

      // Check for alerts based on vital signs
      await PatientController.checkVitalAlerts(patientId, newVitals);

      res.status(201).json({
        success: true,
        data: newVitals,
      } as ApiResponse);
    } catch (error) {
      console.error("Submit vitals error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse);
    }
  }

  // Get vital history
  // static async getVitals(req: AuthenticatedRequest, res: Response) {
  //   try {
  //     const patientId = await PatientController.getPatientId(req.user!.id)
  //     const { page = 1, limit = 20, startDate, endDate } = req.query

  //     const skip = (Number(page) - 1) * Number(limit)

  //     const whereClause: any = { patientId }

  //     if (startDate && endDate) {
  //       whereClause.recordedAt = {
  //         gte: new Date(startDate as string),
  //         lte: new Date(endDate as string),
  //       }
  //     }

  //     const [vitals, total] = await Promise.all([
  //       prisma.patientVital.findMany({
  //         where: whereClause,
  //         skip,
  //         take: Number(limit),
  //         orderBy: { recordedAt: "desc" },
  //       }),
  //       prisma.patientVital.count({ where: whereClause }),
  //     ])

  //     res.json({
  //       success: true,
  //       data: vitals,
  //       pagination: {
  //         page: Number(page),
  //         limit: Number(limit),
  //         total,
  //         totalPages: Math.ceil(total / Number(limit)),
  //       },
  //     } as ApiResponse)
  //   } catch (error) {
  //     console.error("Get vitals error:", error)
  //     res.status(500).json({
  //       success: false,
  //       error: "Internal server error",
  //     } as ApiResponse)
  //   }
  // }

  // Get latest vitals
  // static async getLatestVitals(req: AuthenticatedRequest, res: Response) {
  //   try {
  //     const patientId = await PatientController.getPatientId(req.user!.id)

  //     const latestVitals = await prisma.patientVital.findFirst({
  //       where: { patientId },
  //       orderBy: { recordedAt: "desc" },
  //     })

  //     res.json({
  //       success: true,
  //       data: latestVitals,
  //     } as ApiResponse)
  //   } catch (error) {
  //     console.error("Get latest vitals error:", error)
  //     res.status(500).json({
  //       success: false,
  //       error: "Internal server error",
  //     } as ApiResponse)
  //   }
  // }

  static async getVitals(req: AuthenticatedRequest, res: Response) {
    try {
      const patientId = await PatientController.getPatientId(req.user!.id);
      const { page = 1, limit = 20, startDate, endDate } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const whereClause: any = { patientId };

      if (startDate && endDate) {
        whereClause.timestamp = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        };
      }

      const [vitals, total] = await Promise.all([
        prisma.patientVital.findMany({
          where: whereClause,
          skip,
          take: Number(limit),
          orderBy: { timestamp: "desc" }, // Changed from recordedAt to timestamp
        }),
        prisma.patientVital.count({ where: whereClause }),
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
      } as ApiResponse);
    } catch (error) {
      console.error("Get vitals error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse);
    }
  }

  // Get latest vitals
  static async getLatestVitals(req: AuthenticatedRequest, res: Response) {
    try {
      const patientId = await PatientController.getPatientId(req.user!.id);

      const latestVitals = await prisma.patientVital.findMany({
        where: { patientId },
        orderBy: { timestamp: "desc" }, // Changed from recordedAt to timestamp
        take: 10, // Adjust based on how many vitals you want to return
      });

      res.json({
        success: true,
        data: latestVitals,
      } as ApiResponse);
    } catch (error) {
      console.error("Get latest vitals error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse);
    }
  }

  // Get appointments
  static async getAppointments(req: AuthenticatedRequest, res: Response) {
    try {
      const patientId = await PatientController.getPatientId(req.user!.id)
      const { status, upcoming, page = 1, limit = 10 } = req.query

      const skip = (Number(page) - 1) * Number(limit)

      const whereClause: any = { patientId }

      if (status) {
        whereClause.status = status
      }

      if (upcoming === "true") {
        whereClause.scheduledTime = {
          gte: new Date(),
        }
      }

      const [appointments, total] = await Promise.all([
        prisma.appointment.findMany({
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
        prisma.appointment.count({ where: whereClause }),
      ])

      res.json({
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
      res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Request appointment
  static async requestAppointment(req: AuthenticatedRequest, res: Response) {
    try {
      const patientId = await PatientController.getPatientId(req.user!.id)
      const { doctorId, hospitalId, requestedDate, preferredTime, reason, notes } = req.body

      const appointmentRequest = await prisma.appointmentRequest.create({
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
      })

      res.status(201).json({
        success: true,
        data: appointmentRequest,
      } as ApiResponse)
    } catch (error) {
      console.error("Request appointment error:", error)
      res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Get medical records
  static async getMedicalRecords(req: AuthenticatedRequest, res: Response) {
    try {
      const patientId = await PatientController.getPatientId(req.user!.id)
      const { type, page = 1, limit = 20 } = req.query

      const skip = (Number(page) - 1) * Number(limit)

      const whereClause: any = { patientId }

      if (type) {
        whereClause.recordType = type
      }

      const [records, total] = await Promise.all([
        prisma.medicalRecord.findMany({
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
        prisma.medicalRecord.count({ where: whereClause }),
      ])

      res.json({
        success: true,
        data: records,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      } as ApiResponse)
    } catch (error) {
      console.error("Get medical records error:", error)
      res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Search doctors
  static async searchDoctors(req: AuthenticatedRequest, res: Response) {
    try {
      const { specialty, region, name, page = 1, limit = 10 } = req.query

      const skip = (Number(page) - 1) * Number(limit)

      const whereClause: any = { isActive: true }

      if (specialty) {
        whereClause.specialization = {
          contains: specialty as string,
          mode: "insensitive",
        }
      }

      if (region) {
        whereClause.hospital = {
          region: {
            contains: region as string,
            mode: "insensitive",
          },
        }
      }

      if (name) {
        whereClause.user = {
          OR: [
            { firstName: { contains: name as string, mode: "insensitive" } },
            { lastName: { contains: name as string, mode: "insensitive" } },
          ],
        }
      }

      const [doctors, total] = await Promise.all([
        prisma.doctor.findMany({
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
        prisma.doctor.count({ where: whereClause }),
      ])

      res.json({
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
      console.error("Search doctors error:", error)
      res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Get health alerts
  static async getHealthAlerts(req: AuthenticatedRequest, res: Response) {
    try {
      const patientId = await PatientController.getPatientId(req.user!.id)
      const { isRead, page = 1, limit = 20 } = req.query

      const skip = (Number(page) - 1) * Number(limit)

      const whereClause: any = { patientId }

      if (isRead !== undefined) {
        whereClause.isRead = isRead === "true"
      }

      const [alerts, total] = await Promise.all([
        prisma.healthAlert.findMany({
          where: whereClause,
          skip,
          take: Number(limit),
          orderBy: { createdAt: "desc" },
        }),
        prisma.healthAlert.count({ where: whereClause }),
      ])

      res.json({
        success: true,
        data: alerts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      } as ApiResponse)
    } catch (error) {
      console.error("Get health alerts error:", error)
      res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse)
    }
  }

  // Helper method to get patient ID from user ID
  private static async getPatientId(userId: string): Promise<string> {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!patient) {
      throw new Error("Patient not found")
    }

    return patient.id
  }

  // Helper method to check for vital alerts
  private static async checkVitalAlerts(patientId: string, vital: any) {
    const alerts: {
      patientId: string
      type: 'vital' | 'medication' | 'appointment' | 'general'
      message: string
      severity: 'low' | 'medium' | 'high'
      relatedRecordId?: string
    }[] = []

    // Check blood pressure
    if (vital.bloodPressure) {
      const [systolic, diastolic] = vital.bloodPressure.split("/").map(Number)
      if (systolic > 140 || diastolic > 90) {
        alerts.push({
          patientId,
          type: 'vital',
          message: "High blood pressure detected",
          severity: systolic > 160 || diastolic > 100 ? 'high' : 'medium',
          relatedRecordId: vital.id
        })
      }
    }

    // Check heart rate
    if (vital.heartRate && (vital.heartRate < 60 || vital.heartRate > 100)) {
      alerts.push({
        patientId,
        type: 'vital',
        message: vital.heartRate < 60 ? "Low heart rate detected" : "High heart rate detected",
        severity: 'medium',
        relatedRecordId: vital.id
      })
    }

    // Check blood sugar
    if (vital.bloodSugar && (vital.bloodSugar < 70 || vital.bloodSugar > 200)) {
      alerts.push({
        patientId,
        type: 'vital',
        message: vital.bloodSugar < 70 ? "Low blood sugar detected" : "High blood sugar detected",
        severity: 'high',
        relatedRecordId: vital.id
      })
    }

    // Create alerts if any
    if (alerts.length > 0) {
      await prisma.healthAlert.createMany({
        data: alerts,
      })
    }
  }
}
