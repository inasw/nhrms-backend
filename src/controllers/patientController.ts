// import type { Response } from "express"
// import prisma from "../config/database"
// import type { AuthenticatedRequest, ApiResponse } from "../types"

// export class PatientController {
//   // static async submitVitals(req: AuthenticatedRequest, res: Response) {
//   //   try {
//   //     const patientId = await PatientController.getPatientId(req.user!.id);
//   //     const {
//   //       heartRate,
//   //       bloodPressure,
//   //       temperature,
//   //       bloodSugar,
//   //       oxygenSaturation,
//   //       weight,
//   //       notes,
//   //       source = "manual",
//   //       deviceId,
//   //     } = req.body;

//   //     // Create an array of PatientVital records
//   //     const vitalRecords: Array<{
//   //       patientId: string;
//   //       type: string;
//   //       value: number;
//   //       unit: string;
//   //       timestamp: Date;
//   //       source?: string;
//   //       deviceId?: string;
//   //       notes?: string;
//   //     }> = [];

//   //     // Map input fields to PatientVital records
//   //     if (heartRate !== undefined) {
//   //       vitalRecords.push({
//   //         patientId,
//   //         type: "heartRate",
//   //         value: Number(heartRate),
//   //         unit: "bpm",
//   //         timestamp: new Date(),
//   //         source,
//   //         deviceId,
//   //         notes,
//   //       });
//   //     }
//   //     if (bloodPressure !== undefined) {
//   //       const [systolic, diastolic] = bloodPressure.split("/").map(Number);
//   //       vitalRecords.push(
//   //         {
//   //           patientId,
//   //           type: "bloodPressureSystolic",
//   //           value: systolic,
//   //           unit: "mmHg",
//   //           timestamp: new Date(),
//   //           source,
//   //           deviceId,
//   //           notes,
//   //         },
//   //         {
//   //           patientId,
//   //           type: "bloodPressureDiastolic",
//   //           value: diastolic,
//   //           unit: "mmHg",
//   //           timestamp: new Date(),
//   //           source,
//   //           deviceId,
//   //           notes,
//   //         }
//   //       );
//   //     }
//   //     if (temperature !== undefined) {
//   //       vitalRecords.push({
//   //         patientId,
//   //         type: "temperature",
//   //         value: Number(temperature),
//   //         unit: "C",
//   //         timestamp: new Date(),
//   //         source,
//   //         deviceId,
//   //         notes,
//   //       });
//   //     }
//   //     if (bloodSugar !== undefined) {
//   //       vitalRecords.push({
//   //         patientId,
//   //         type: "bloodSugar",
//   //         value: Number(bloodSugar),
//   //         unit: "mg/dL",
//   //         timestamp: new Date(),
//   //         source,
//   //         deviceId,
//   //         notes,
//   //       });
//   //     }
//   //     if (oxygenSaturation !== undefined) {
//   //       vitalRecords.push({
//   //         patientId,
//   //         type: "oxygenSaturation",
//   //         value: Number(oxygenSaturation),
//   //         unit: "%",
//   //         timestamp: new Date(),
//   //         source,
//   //         deviceId,
//   //         notes,
//   //       });
//   //     }
//   //     if (weight !== undefined) {
//   //       vitalRecords.push({
//   //         patientId,
//   //         type: "weight",
//   //         value: Number(weight),
//   //         unit: "kg",
//   //         timestamp: new Date(),
//   //         source,
//   //         deviceId,
//   //         notes,
//   //       });
//   //     }

//   //     // Create all vital records in a single transaction
//   //     const createdVitals = await prisma.patientVital.createMany({
//   //       data: vitalRecords,
//   //     });

//   //     // Fetch created vitals for alert checking
//   //     const newVitals = await prisma.patientVital.findMany({
//   //       where: {
//   //         patientId,
//   //         timestamp: { gte: new Date(Date.now() - 1000) }, // Vitals from this request
//   //       },
//   //     });

//   //     // Check for alerts based on vital signs
//   //     await PatientController.checkVitalAlerts(patientId, newVitals);

//   //     res.status(201).json({
//   //       success: true,
//   //       data: newVitals,
//   //     } as ApiResponse);
//   //   } catch (error) {
//   //     console.error("Submit vitals error:", error);
//   //     res.status(500).json({
//   //       success: false,
//   //       error: "Internal server error",
//   //     } as ApiResponse);
//   //   }
//   // }

//   // Get vital history
//   // static async getVitals(req: AuthenticatedRequest, res: Response) {
//   //   try {
//   //     const patientId = await PatientController.getPatientId(req.user!.id)
//   //     const { page = 1, limit = 20, startDate, endDate } = req.query

//   //     const skip = (Number(page) - 1) * Number(limit)

//   //     const whereClause: any = { patientId }

//   //     if (startDate && endDate) {
//   //       whereClause.recordedAt = {
//   //         gte: new Date(startDate as string),
//   //         lte: new Date(endDate as string),
//   //       }
//   //     }

//   //     const [vitals, total] = await Promise.all([
//   //       prisma.patientVital.findMany({
//   //         where: whereClause,
//   //         skip,
//   //         take: Number(limit),
//   //         orderBy: { recordedAt: "desc" },
//   //       }),
//   //       prisma.patientVital.count({ where: whereClause }),
//   //     ])

//   //     res.json({
//   //       success: true,
//   //       data: vitals,
//   //       pagination: {
//   //         page: Number(page),
//   //         limit: Number(limit),
//   //         total,
//   //         totalPages: Math.ceil(total / Number(limit)),
//   //       },
//   //     } as ApiResponse)
//   //   } catch (error) {
//   //     console.error("Get vitals error:", error)
//   //     res.status(500).json({
//   //       success: false,
//   //       error: "Internal server error",
//   //     } as ApiResponse)
//   //   }
//   // }

//   // Get latest vitals
//   // static async getLatestVitals(req: AuthenticatedRequest, res: Response) {
//   //   try {
//   //     const patientId = await PatientController.getPatientId(req.user!.id)

//   //     const latestVitals = await prisma.patientVital.findFirst({
//   //       where: { patientId },
//   //       orderBy: { recordedAt: "desc" },
//   //     })

//   //     res.json({
//   //       success: true,
//   //       data: latestVitals,
//   //     } as ApiResponse)
//   //   } catch (error) {
//   //     console.error("Get latest vitals error:", error)
//   //     res.status(500).json({
//   //       success: false,
//   //       error: "Internal server error",
//   //     } as ApiResponse)
//   //   }
//   // }
//    static async submitVitals(req: AuthenticatedRequest, res: Response) {
//     try {
//       const patientId = await PatientController.getPatientId(req.user!.id);
//       const {
//         heartRate,
//         bloodPressure,
//         temperature,
//         bloodSugar,
//         oxygenSaturation,
//         weight,
//         notes,
//         source = "manual",
//         deviceId,
//       } = req.body;

//       // Validate deviceId if provided
//       if (deviceId) {
//         const device = await prisma.patientDevice.findUnique({ where: { deviceId } });
//         if (!device || device.patientId !== patientId) {
//           return res.status(400).json({
//             success: false,
//             error: "Invalid or unauthorized device",
//           } as ApiResponse);
//         }
//       }

//       // Create an array of Vital records
//       const vitalRecords: Array<{
//         patientId: string;
//         type: string;
//         value: number;
//         unit: string;
//         recordedAt: Date;
//         source: string;
//         deviceId?: string;
//         notes?: string;
//       }> = [];

//       // Map input fields to Vital records
//       if (heartRate !== undefined) {
//         vitalRecords.push({
//           patientId,
//           type: "heartRate",
//           value: Number(heartRate),
//           unit: "bpm",
//           recordedAt: new Date(),
//           source,
//           deviceId,
//           notes,
//         });
//       }
//       if (bloodPressure !== undefined) {
//         const [systolic, diastolic] = bloodPressure.split("/").map(Number);
//         vitalRecords.push(
//           {
//             patientId,
//             type: "bloodPressureSystolic",
//             value: systolic,
//             unit: "mmHg",
//             recordedAt: new Date(),
//             source,
//             deviceId,
//             notes,
//           },
//           {
//             patientId,
//             type: "bloodPressureDiastolic",
//             value: diastolic,
//             unit: "mmHg",
//             recordedAt: new Date(),
//             source,
//             deviceId,
//             notes,
//           }
//         );
//       }
//       if (temperature !== undefined) {
//         vitalRecords.push({
//           patientId,
//           type: "temperature",
//           value: Number(temperature),
//           unit: "C",
//           recordedAt: new Date(),
//           source,
//           deviceId,
//           notes,
//         });
//       }
//       if (bloodSugar !== undefined) {
//         vitalRecords.push({
//           patientId,
//           type: "bloodSugar",
//           value: Number(bloodSugar),
//           unit: "mg/dL",
//           recordedAt: new Date(),
//           source,
//           deviceId,
//           notes,
//         });
//       }
//       if (oxygenSaturation !== undefined) {
//         vitalRecords.push({
//           patientId,
//           type: "oxygenSaturation",
//           value: Number(oxygenSaturation),
//           unit: "%",
//           recordedAt: new Date(),
//           source,
//           deviceId,
//           notes,
//         });
//       }
//       if (weight !== undefined) {
//         vitalRecords.push({
//           patientId,
//           type: "weight",
//           value: Number(weight),
//           unit: "kg",
//           recordedAt: new Date(),
//           source,
//           deviceId,
//           notes,
//         });
//       }

//       // Create all vital records in a single transaction
//       const createdVitals = await prisma.vital.createMany({
//         data: vitalRecords,
//       });

//       // Fetch created vitals for alert checking
//       const newVitals = await prisma.vital.findMany({
//         where: {
//           patientId,
//           recordedAt: { gte: new Date(Date.now() - 1000) }, // Vitals from this request
//         },
//       });

//       // Check for alerts based on vital signs
//       await PatientController.checkVitalAlerts(patientId, newVitals);

//       res.status(201).json({
//         success: true,
//         data: newVitals,
//       } as ApiResponse);
//     } catch (error) {
//       console.error("Submit vitals error:", error);
//       res.status(500).json({
//         success: false,
//         error: "Internal server error",
//       } as ApiResponse);
//     }
//   }

//   static async getVitals(req: AuthenticatedRequest, res: Response) {
//     try {
//       const patientId = await PatientController.getPatientId(req.user!.id);
//       const { page = 1, limit = 20, startDate, endDate } = req.query;

//       const skip = (Number(page) - 1) * Number(limit);

//       const whereClause: any = { patientId };

//       if (startDate && endDate) {
//         whereClause.timestamp = {
//           gte: new Date(startDate as string),
//           lte: new Date(endDate as string),
//         };
//       }

//       const [vitals, total] = await Promise.all([
//         prisma.patientVital.findMany({
//           where: whereClause,
//           skip,
//           take: Number(limit),
//           orderBy: { timestamp: "desc" }, // Changed from recordedAt to timestamp
//         }),
//         prisma.patientVital.count({ where: whereClause }),
//       ]);

//       res.json({
//         success: true,
//         data: vitals,
//         pagination: {
//           page: Number(page),
//           limit: Number(limit),
//           total,
//           totalPages: Math.ceil(total / Number(limit)),
//         },
//       } as ApiResponse);
//     } catch (error) {
//       console.error("Get vitals error:", error);
//       res.status(500).json({
//         success: false,
//         error: "Internal server error",
//       } as ApiResponse);
//     }
//   }

//   // Get latest vitals
//   static async getLatestVitals(req: AuthenticatedRequest, res: Response) {
//     try {
//       const patientId = await PatientController.getPatientId(req.user!.id);

//       const latestVitals = await prisma.patientVital.findMany({
//         where: { patientId },
//         orderBy: { timestamp: "desc" }, // Changed from recordedAt to timestamp
//         take: 10, // Adjust based on how many vitals you want to return
//       });

//       res.json({
//         success: true,
//         data: latestVitals,
//       } as ApiResponse);
//     } catch (error) {
//       console.error("Get latest vitals error:", error);
//       res.status(500).json({
//         success: false,
//         error: "Internal server error",
//       } as ApiResponse);
//     }
//   }

//   // Get appointments
//   static async getAppointments(req: AuthenticatedRequest, res: Response) {
//     try {
//       const patientId = await PatientController.getPatientId(req.user!.id)
//       const { status, upcoming, page = 1, limit = 10 } = req.query

//       const skip = (Number(page) - 1) * Number(limit)

//       const whereClause: any = { patientId }

//       if (status) {
//         whereClause.status = status
//       }

//       if (upcoming === "true") {
//         whereClause.scheduledTime = {
//           gte: new Date(),
//         }
//       }

//       const [appointments, total] = await Promise.all([
//         prisma.appointment.findMany({
//           where: whereClause,
//           include: {
//             doctor: {
//               include: {
//                 user: {
//                   select: { firstName: true, lastName: true },
//                 },
//               },
//             },
//             hospital: {
//               select: { name: true, address: true, phone: true },
//             },
//           },
//           skip,
//           take: Number(limit),
//           orderBy: { scheduledTime: "desc" },
//         }),
//         prisma.appointment.count({ where: whereClause }),
//       ])

//       res.json({
//         success: true,
//         data: appointments,
//         pagination: {
//           page: Number(page),
//           limit: Number(limit),
//           total,
//           totalPages: Math.ceil(total / Number(limit)),
//         },
//       } as ApiResponse)
//     } catch (error) {
//       console.error("Get appointments error:", error)
//       res.status(500).json({
//         success: false,
//         error: "Internal server error",
//       } as ApiResponse)
//     }
//   }

//   // Request appointment
//   static async requestAppointment(req: AuthenticatedRequest, res: Response) {
//     try {
//       const patientId = await PatientController.getPatientId(req.user!.id)
//       const { doctorId, hospitalId, requestedDate, preferredTime, reason, notes } = req.body

//       const appointmentRequest = await prisma.appointmentRequest.create({
//         data: {
//           patientId,
//           doctorId,
//           hospitalId,
//           requestedDate: new Date(requestedDate),
//           preferredTime,
//           reason,
//           notes,
//         },
//         include: {
//           hospital: {
//             select: { name: true },
//           },
//         },
//       })

//       res.status(201).json({
//         success: true,
//         data: appointmentRequest,
//       } as ApiResponse)
//     } catch (error) {
//       console.error("Request appointment error:", error)
//       res.status(500).json({
//         success: false,
//         error: "Internal server error",
//       } as ApiResponse)
//     }
//   }

//   // Get medical records
//   static async getMedicalRecords(req: AuthenticatedRequest, res: Response) {
//     try {
//       const patientId = await PatientController.getPatientId(req.user!.id)
//       const { type, page = 1, limit = 20 } = req.query

//       const skip = (Number(page) - 1) * Number(limit)

//       const whereClause: any = { patientId }

//       if (type) {
//         whereClause.recordType = type
//       }

//       const [records, total] = await Promise.all([
//         prisma.medicalRecord.findMany({
//           where: whereClause,
//           include: {
//             doctor: {
//               include: {
//                 user: {
//                   select: { firstName: true, lastName: true },
//                 },
//                 hospital: {
//                   select: { name: true },
//                 },
//               },
//             },
//           },
//           skip,
//           take: Number(limit),
//           orderBy: { date: "desc" },
//         }),
//         prisma.medicalRecord.count({ where: whereClause }),
//       ])

//       res.json({
//         success: true,
//         data: records,
//         pagination: {
//           page: Number(page),
//           limit: Number(limit),
//           total,
//           totalPages: Math.ceil(total / Number(limit)),
//         },
//       } as ApiResponse)
//     } catch (error) {
//       console.error("Get medical records error:", error)
//       res.status(500).json({
//         success: false,
//         error: "Internal server error",
//       } as ApiResponse)
//     }
//   }

//   // Search doctors
//   static async searchDoctors(req: AuthenticatedRequest, res: Response) {
//     try {
//       const { specialty, region, name, page = 1, limit = 10 } = req.query

//       const skip = (Number(page) - 1) * Number(limit)

//       const whereClause: any = { isActive: true }

//       if (specialty) {
//         whereClause.specialization = {
//           contains: specialty as string,
//           mode: "insensitive",
//         }
//       }

//       if (region) {
//         whereClause.hospital = {
//           region: {
//             contains: region as string,
//             mode: "insensitive",
//           },
//         }
//       }

//       if (name) {
//         whereClause.user = {
//           OR: [
//             { firstName: { contains: name as string, mode: "insensitive" } },
//             { lastName: { contains: name as string, mode: "insensitive" } },
//           ],
//         }
//       }

//       const [doctors, total] = await Promise.all([
//         prisma.doctor.findMany({
//           where: whereClause,
//           include: {
//             user: {
//               select: { firstName: true, lastName: true },
//             },
//             hospital: {
//               select: { name: true, address: true, region: true },
//             },
//           },
//           skip,
//           take: Number(limit),
//         }),
//         prisma.doctor.count({ where: whereClause }),
//       ])

//       res.json({
//         success: true,
//         data: doctors,
//         pagination: {
//           page: Number(page),
//           limit: Number(limit),
//           total,
//           totalPages: Math.ceil(total / Number(limit)),
//         },
//       } as ApiResponse)
//     } catch (error) {
//       console.error("Search doctors error:", error)
//       res.status(500).json({
//         success: false,
//         error: "Internal server error",
//       } as ApiResponse)
//     }
//   }

//   // Get health alerts
//   static async getHealthAlerts(req: AuthenticatedRequest, res: Response) {
//     try {
//       const patientId = await PatientController.getPatientId(req.user!.id)
//       const { isRead, page = 1, limit = 20 } = req.query

//       const skip = (Number(page) - 1) * Number(limit)

//       const whereClause: any = { patientId }

//       if (isRead !== undefined) {
//         whereClause.isRead = isRead === "true"
//       }

//       const [alerts, total] = await Promise.all([
//         prisma.healthAlert.findMany({
//           where: whereClause,
//           skip,
//           take: Number(limit),
//           orderBy: { createdAt: "desc" },
//         }),
//         prisma.healthAlert.count({ where: whereClause }),
//       ])

//       res.json({
//         success: true,
//         data: alerts,
//         pagination: {
//           page: Number(page),
//           limit: Number(limit),
//           total,
//           totalPages: Math.ceil(total / Number(limit)),
//         },
//       } as ApiResponse)
//     } catch (error) {
//       console.error("Get health alerts error:", error)
//       res.status(500).json({
//         success: false,
//         error: "Internal server error",
//       } as ApiResponse)
//     }
//   }

//   // Helper method to get patient ID from user ID
//   private static async getPatientId(userId: string): Promise<string> {
//     const patient = await prisma.patient.findUnique({
//       where: { userId },
//       select: { id: true },
//     })

//     if (!patient) {
//       throw new Error("Patient not found")
//     }

//     return patient.id
//   }

//   // Helper method to check for vital alerts
//   // private static async checkVitalAlerts(patientId: string, vital: any) {
//   //   const alerts: {
//   //     patientId: string
//   //     type: 'vital' | 'medication' | 'appointment' | 'general'
//   //     message: string
//   //     severity: 'low' | 'medium' | 'high'
//   //     relatedRecordId?: string
//   //   }[] = []

//   //   // Check blood pressure
//   //   if (vital.bloodPressure) {
//   //     const [systolic, diastolic] = vital.bloodPressure.split("/").map(Number)
//   //     if (systolic > 140 || diastolic > 90) {
//   //       alerts.push({
//   //         patientId,
//   //         type: 'vital',
//   //         message: "High blood pressure detected",
//   //         severity: systolic > 160 || diastolic > 100 ? 'high' : 'medium',
//   //         relatedRecordId: vital.id
//   //       })
//   //     }
//   //   }

//   //   // Check heart rate
//   //   if (vital.heartRate && (vital.heartRate < 60 || vital.heartRate > 100)) {
//   //     alerts.push({
//   //       patientId,
//   //       type: 'vital',
//   //       message: vital.heartRate < 60 ? "Low heart rate detected" : "High heart rate detected",
//   //       severity: 'medium',
//   //       relatedRecordId: vital.id
//   //     })
//   //   }

//   //   // Check blood sugar
//   //   if (vital.bloodSugar && (vital.bloodSugar < 70 || vital.bloodSugar > 200)) {
//   //     alerts.push({
//   //       patientId,
//   //       type: 'vital',
//   //       message: vital.bloodSugar < 70 ? "Low blood sugar detected" : "High blood sugar detected",
//   //       severity: 'high',
//   //       relatedRecordId: vital.id
//   //     })
//   //   }

//   //   // Create alerts if any
//   //   if (alerts.length > 0) {
//   //     await prisma.healthAlert.createMany({
//   //       data: alerts,
//   //     })
//   //   }
//   // }
//     private static async checkVitalAlerts(patientId: string, vitals: any[]) {
//     const alerts: {
//       patientId: string;
//       type: "vital" | "medication" | "appointment" | "general";
//       message: string;
//       severity: "low" | "medium" | "high";
//       relatedRecordId?: string;
//     }[] = [];

//     for (const vital of vitals) {
//       // Check blood pressure
//       if (vital.type === "bloodPressureSystolic") {
//         const systolic = vital.value;
//         const diastolicVital = vitals.find(v => v.type === "bloodPressureDiastolic");
//         const diastolic = diastolicVital ? diastolicVital.value : undefined;
//         if (systolic > 140 || (diastolic && diastolic > 90)) {
//           alerts.push({
//             patientId,
//             type: "vital",
//             message: "High blood pressure detected",
//             severity: systolic > 160 || (diastolic && diastolic > 100) ? "high" : "medium",
//             relatedRecordId: vital.id,
//           });
//         }
//       }

//       // Check heart rate
//       if (vital.type === "heartRate" && (vital.value < 60 || vital.value > 100)) {
//         alerts.push({
//           patientId,
//           type: "vital",
//           message: vital.value < 60 ? "Low heart rate detected" : "High heart rate detected",
//           severity: "medium",
//           relatedRecordId: vital.id,
//         });
//       }

//       // Check blood sugar
//       if (vital.type === "bloodSugar" && (vital.value < 70 || vital.value > 200)) {
//         alerts.push({
//           patientId,
//           type: "vital",
//           message: vital.value < 70 ? "Low blood sugar detected" : "High blood sugar detected",
//           severity: "high",
//           relatedRecordId: vital.id,
//         });
//       }
//     }

//     // Create alerts if any
//     if (alerts.length > 0) {
//       await prisma.healthAlert.createMany({
//         data: alerts,
//       });
//     }
//   }
// }
import type { Response } from "express"
import prisma from "../config/database"
import type { AuthenticatedRequest, ApiResponse } from "../types"

export class PatientController {
  static async submitVitals(req: AuthenticatedRequest, res: Response): Promise<Response> {
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
        doctorId, // Optional doctorId from request body
      } = req.body;

      // Validate source
      const validSources = ["manual", "device"] as const;
      if (!validSources.includes(source as any)) {
        return res.status(400).json({
          success: false,
          error: "Invalid source. Must be 'manual' or 'device'.",
        } as ApiResponse);
      }

      // If no doctorId provided, try to get from latest appointment
      let assignedDoctorId: string | undefined = doctorId;
      if (!assignedDoctorId) {
        const latestAppointment = await prisma.appointment.findFirst({
          where: { patientId },
          orderBy: { scheduledTime: "desc" },
          select: { doctorId: true },
        });
        assignedDoctorId = latestAppointment?.doctorId;
      }

      // Create an array of Vital records
      const vitalRecords: Array<{
        patientId: string;
        type: string;
        value: number;
        unit: string;
        recordedAt: Date;
        source: "manual" | "device";
        doctorId?: string;
        notes?: string;
      }> = [];

      // Map input fields to Vital records
      if (heartRate !== undefined) {
        vitalRecords.push({
          patientId,
          type: "heartRate",
          value: Number(heartRate),
          unit: "bpm",
          recordedAt: new Date(),
          source,
          doctorId: assignedDoctorId,
          notes,
        });
      }
      if (bloodPressure !== undefined) {
        const [systolic, diastolic] = bloodPressure.split("/").map(Number);
        if (isNaN(systolic) || isNaN(diastolic)) {
          return res.status(400).json({
            success: false,
            error: "Invalid blood pressure format. Use 'systolic/diastolic'.",
          } as ApiResponse);
        }
        vitalRecords.push(
          {
            patientId,
            type: "bloodPressureSystolic",
            value: systolic,
            unit: "mmHg",
            recordedAt: new Date(),
            source,
            doctorId: assignedDoctorId,
            notes,
          },
          {
            patientId,
            type: "bloodPressureDiastolic",
            value: diastolic,
            unit: "mmHg",
            recordedAt: new Date(),
            source,
            doctorId: assignedDoctorId,
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
          recordedAt: new Date(),
          source,
          doctorId: assignedDoctorId,
          notes,
        });
      }
      if (bloodSugar !== undefined) {
        vitalRecords.push({
          patientId,
          type: "bloodSugar",
          value: Number(bloodSugar),
          unit: "mg/dL",
          recordedAt: new Date(),
          source,
          doctorId: assignedDoctorId,
          notes,
        });
      }
      if (oxygenSaturation !== undefined) {
        vitalRecords.push({
          patientId,
          type: "oxygenSaturation",
          value: Number(oxygenSaturation),
          unit: "%",
          recordedAt: new Date(),
          source,
          doctorId: assignedDoctorId,
          notes,
        });
      }
      if (weight !== undefined) {
        vitalRecords.push({
          patientId,
          type: "weight",
          value: Number(weight),
          unit: "kg",
          recordedAt: new Date(),
          source,
          doctorId: assignedDoctorId,
          notes,
        });
      }

      // Create all vital records in a single transaction
      const createdVitals = await prisma.vital.createMany({
        data: vitalRecords,
      });

      // Fetch created vitals for alert checking and response
      const newVitals = await prisma.vital.findMany({
        where: {
          patientId,
          recordedAt: { gte: new Date(Date.now() - 1000) },
        },
      });

      // Check for alerts based on vital signs
      await PatientController.checkVitalAlerts(patientId, newVitals);

      // Format response to match frontend expectations
      const vitalsResponse = {
        id: newVitals[0]?.id || "",
        heartRate: newVitals.find(v => v.type === "heartRate")?.value || null,
        bloodPressure: newVitals.find(v => v.type === "bloodPressureSystolic")
          ? `${newVitals.find(v => v.type === "bloodPressureSystolic")?.value}/${newVitals.find(v => v.type === "bloodPressureDiastolic")?.value}`
          : null,
        temperature: newVitals.find(v => v.type === "temperature")?.value || null,
        bloodSugar: newVitals.find(v => v.type === "bloodSugar")?.value || null,
        oxygenSaturation: newVitals.find(v => v.type === "oxygenSaturation")?.value || null,
        weight: newVitals.find(v => v.type === "weight")?.value || null,
        timestamp: newVitals[0]?.recordedAt?.toISOString() || new Date().toISOString(),
        source,
      };

      return res.status(201).json({
        success: true,
        data: vitalsResponse,
        vitals: vitalsResponse,
      } as ApiResponse);
    } catch (error) {
      console.error("Submit vitals error:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse);
    }
  }

  static async getVitals(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const patientId = await PatientController.getPatientId(req.user!.id);
      const { page = 1, limit = 20, startDate, endDate } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const whereClause: any = { patientId };

      if (startDate && endDate) {
        whereClause.recordedAt = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        };
      }

      const [vitals, total] = await Promise.all([
        prisma.vital.findMany({
          where: whereClause,
          skip,
          take: Number(limit),
          orderBy: { recordedAt: "desc" },
        }),
        prisma.vital.count({ where: whereClause }),
      ]);

      return res.json({
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
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse);
    }
  }

  static async getLatestVitals(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const patientId = await PatientController.getPatientId(req.user!.id);

      const latestVitals = await prisma.vital.findMany({
        where: { patientId },
        orderBy: { recordedAt: "desc" },
        take: 10,
      });

      // Format vitals for frontend
      const formattedVitals = {
        id: latestVitals[0]?.id || "",
        heartRate: latestVitals.find(v => v.type === "heartRate")?.value || null,
        bloodPressure: latestVitals.find(v => v.type === "bloodPressureSystolic")
          ? `${latestVitals.find(v => v.type === "bloodPressureSystolic")?.value}/${latestVitals.find(v => v.type === "bloodPressureDiastolic")?.value}`
          : null,
        temperature: latestVitals.find(v => v.type === "temperature")?.value || null,
        timestamp: latestVitals[0]?.recordedAt?.toISOString() || null,
      };

      return res.json({
        success: true,
        data: formattedVitals,
      } as ApiResponse);
    } catch (error) {
      console.error("Get latest vitals error:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse);
    }
  }

  static async getAppointments(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const patientId = await PatientController.getPatientId(req.user!.id);
      const { status, upcoming, page = 1, limit = 10 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const whereClause: any = { patientId };

      if (status) {
        whereClause.status = status;
      }

      if (upcoming === "true") {
        whereClause.scheduledTime = {
          gte: new Date(),
        };
      }

      // Get both appointments and appointment requests
      const [appointments, appointmentRequests, appointmentTotal, requestTotal] = await Promise.all([
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
        prisma.appointmentRequest.findMany({
          where: { patientId },
          include: {
            hospital: {
              select: { name: true, address: true, phone: true },
            },
          },
          skip,
          take: Number(limit),
          orderBy: { requestedDate: "desc" },
        }),
        prisma.appointment.count({ where: whereClause }),
        prisma.appointmentRequest.count({ where: { patientId } }),
      ]);

      const total = appointmentTotal + requestTotal;

      // Format appointments for frontend
      const formattedAppointments = appointments.map(apt => ({
        id: apt.id,
        doctor: `${apt.doctor.user.firstName} ${apt.doctor.user.lastName}`,
        specialty: apt.doctor.specialization,
        hospital: apt.hospital.name,
        date: apt.scheduledTime.toISOString().split('T')[0],
        time: apt.scheduledTime.toTimeString().slice(0, 5),
        status: apt.status,
        duration: `${apt.duration} minutes`,
        location: apt.hospital.address,
        contact: apt.hospital.phone,
        email: `${apt.doctor.user.firstName.toLowerCase()}.${apt.doctor.user.lastName.toLowerCase()}@${apt.hospital.name.toLowerCase().replace(/\s+/g, '')}.com`,
        notes: apt.notes,
        reason: apt.reason
      }));

      // Get doctor info for appointment requests that have doctorId
      const doctorIds = appointmentRequests.filter(req => req.doctorId).map(req => req.doctorId!);
      const doctors = doctorIds.length > 0 ? await prisma.doctor.findMany({
        where: { id: { in: doctorIds } },
        include: {
          user: {
            select: { firstName: true, lastName: true },
          },
          hospital: {
            select: { name: true, address: true, phone: true },
          },
        },
      }) : [];

      // Format appointment requests
      const formattedRequests = appointmentRequests.map(req => {
        const doctor = doctors.find(d => d.id === req.doctorId);
        return {
          id: req.id,
          doctor: doctor ? `${doctor.user.firstName} ${doctor.user.lastName}` : "Doctor TBD",
          specialty: doctor?.specialization || "General",
          hospital: doctor?.hospital.name || req.hospital?.name || "Hospital TBD",
          date: req.requestedDate.toISOString().split('T')[0],
          time: req.preferredTime || "TBD",
          status: req.status,
          duration: "30 minutes",
          location: doctor?.hospital.address || req.hospital?.address || "TBD",
          contact: doctor?.hospital.phone || req.hospital?.phone || "TBD",
          email: doctor ? `${doctor.user.firstName.toLowerCase()}.${doctor.user.lastName.toLowerCase()}@${(doctor.hospital.name || req.hospital?.name || 'hospital').toLowerCase().replace(/\s+/g, '')}.com` : "contact@hospital.com",
          notes: req.notes,
          reason: req.reason
        };
      });

      const allAppointments = [...formattedAppointments, ...formattedRequests];

      return res.json({
        success: true,
        data: allAppointments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Get appointments error:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse);
    }
  }

  static async requestAppointment(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const patientId = await PatientController.getPatientId(req.user!.id);
      const { doctorId, hospitalId, requestedDate, preferredTime, reason, notes } = req.body;

      if (!requestedDate) {
        return res.status(400).json({
          success: false,
          error: "Missing required field: requestedDate",
        } as ApiResponse);
      }

      // Create appointment request first (safer approach)
      const appointmentRequest = await prisma.appointmentRequest.create({
        data: {
          patientId,
          doctorId: doctorId || null,
          hospitalId: hospitalId || null,
          requestedDate: new Date(requestedDate),
          preferredTime: preferredTime || "09:00",
          reason: reason || "General consultation",
          notes: notes || "",
          status: 'pending',
        },
      });

      return res.status(201).json({
        success: true,
        data: {
          id: appointmentRequest.id,
          status: 'pending',
          message: 'Appointment request submitted successfully'
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Request appointment error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to create appointment request",
      } as ApiResponse);
    }
  }

  static async getMedicalRecords(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const patientId = await PatientController.getPatientId(req.user!.id);
      const { type, page = 1, limit = 20 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const whereClause: any = { patientId };

      if (type) {
        whereClause.recordType = type;
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
      ]);

      return res.json({
        success: true,
        data: records,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Get medical records error:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse);
    }
  }

  static async searchDoctors(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { specialty, region, name, page = 1, limit = 10 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const whereClause: any = { isActive: true };

      if (specialty) {
        whereClause.specialization = {
          contains: specialty as string,
          mode: "insensitive",
        };
      }

      if (region) {
        whereClause.hospital = {
          region: {
            contains: region as string,
            mode: "insensitive",
          },
        };
      }

      if (name) {
        whereClause.user = {
          OR: [
            { firstName: { contains: name as string, mode: "insensitive" } },
            { lastName: { contains: name as string, mode: "insensitive" } },
          ],
        };
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
      ]);

      return res.json({
        success: true,
        data: doctors,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Search doctors error:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse);
    }
  }

  static async getHealthAlerts(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const patientId = await PatientController.getPatientId(req.user!.id);
      const { isRead, page = 1, limit = 20 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const whereClause: any = { patientId };

      if (isRead !== undefined) {
        whereClause.isRead = isRead === "true";
      }

      const [alerts, total] = await Promise.all([
        prisma.healthAlert.findMany({
          where: whereClause,
          skip,
          take: Number(limit),
          orderBy: { createdAt: "desc" },
        }),
        prisma.healthAlert.count({ where: whereClause }),
      ]);

      return res.json({
        success: true,
        data: alerts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Get health alerts error:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse);
    }
  }

  private static async getPatientId(userId: string): Promise<string> {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!patient) {
      throw new Error("Patient not found");
    }

    return patient.id;
  }

  private static async checkVitalAlerts(patientId: string, vitals: any[]) {
    const alerts: {
      patientId: string;
      type: "vital" | "medication" | "appointment" | "general";
      message: string;
      severity: "low" | "medium" | "high";
      relatedRecordId?: string;
    }[] = [];

    for (const vital of vitals) {
      // Check blood pressure
      if (vital.type === "bloodPressureSystolic") {
        const systolic = vital.value;
        const diastolicVital = vitals.find(v => v.type === "bloodPressureDiastolic");
        const diastolic = diastolicVital ? diastolicVital.value : undefined;
        if (systolic > 140 || (diastolic && diastolic > 90)) {
          alerts.push({
            patientId,
            type: "vital",
            message: "High blood pressure detected",
            severity: systolic > 160 || (diastolic && diastolic > 100) ? "high" : "medium",
            relatedRecordId: vital.id,
          });
        }
      }

      // Check heart rate
      if (vital.type === "heartRate" && (vital.value < 60 || vital.value > 100)) {
        alerts.push({
          patientId,
          type: "vital",
          message: vital.value < 60 ? "Low heart rate detected" : "High heart rate detected",
          severity: "medium",
          relatedRecordId: vital.id,
        });
      }

      // Check blood sugar
      if (vital.type === "bloodSugar" && (vital.value < 70 || vital.value > 200)) {
        alerts.push({
          patientId,
          type: "vital",
          message: vital.value < 70 ? "Low blood sugar detected" : "High blood sugar detected",
          severity: "high",
          relatedRecordId: vital.id,
        });
      }
    }

    // Create alerts if any
    if (alerts.length > 0) {
      await prisma.healthAlert.createMany({
        data: alerts,
      });
    }
  }

  static async rescheduleAppointment(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const patientId = await PatientController.getPatientId(req.user!.id);
      const { id } = req.params;
      const { date, time, reason } = req.body;

      if (!date || !time) {
        return res.status(400).json({
          success: false,
          error: "Date and time are required",
        } as ApiResponse);
      }

      // Verify appointment belongs to patient
      const appointment = await prisma.appointment.findFirst({
        where: { id, patientId },
      });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          error: "Appointment not found",
        } as ApiResponse);
      }

      // Create reschedule request
      const rescheduleRequest = await prisma.appointmentRequest.create({
        data: {
          patientId,
          doctorId: appointment.doctorId,
          hospitalId: appointment.hospitalId,
          requestedDate: new Date(`${date}T${time}`),
          reason: reason || "Reschedule request",
          notes: `Reschedule from ${appointment.scheduledTime}`,
        },
      });

      return res.json({
        success: true,
        message: "Reschedule request submitted successfully",
        data: rescheduleRequest,
      } as ApiResponse);
    } catch (error) {
      console.error("Reschedule appointment error:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse);
    }
  }

  static async cancelAppointment(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const patientId = await PatientController.getPatientId(req.user!.id);
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: "Cancellation reason is required",
        } as ApiResponse);
      }

      // Verify appointment belongs to patient and update status
      const appointment = await prisma.appointment.updateMany({
        where: { id, patientId },
        data: {
          status: "cancelled",
          notes: `Cancelled by patient. Reason: ${reason}`,
        },
      });

      if (appointment.count === 0) {
        return res.status(404).json({
          success: false,
          error: "Appointment not found",
        } as ApiResponse);
      }

      return res.json({
        success: true,
        message: "Appointment cancelled successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Cancel appointment error:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse);
    }
  }

  static async registerDevice(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const patientId = await PatientController.getPatientId(req.user!.id);
      const { deviceId, deviceType, manufacturer, model } = req.body;

      if (!deviceId || !deviceType) {
        return res.status(400).json({
          success: false,
          error: "deviceId and deviceType are required",
        } as ApiResponse);
      }

      // Check for duplicates
      const existingDevice = await prisma.patientDevice.findUnique({ where: { deviceId } });
      if (existingDevice) {
        return res.status(409).json({
          success: false,
          error: "Device ID already registered",
        } as ApiResponse);
      }

      const device = await prisma.patientDevice.create({
        data: {
          patientId,
          deviceId,
          deviceType,
          manufacturer,
          model,
          isActive: true,
        },
      });

      return res.status(201).json({
        success: true,
        data: device,
      } as ApiResponse);
    } catch (error) {
      console.error("Register device error:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse);
    }
  }

  static async cancelAppointmentRequest(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const patientId = await PatientController.getPatientId(req.user!.id);
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: "Cancellation reason is required",
        } as ApiResponse);
      }

      // Update appointment request status to cancelled
      const appointmentRequest = await prisma.appointmentRequest.updateMany({
        where: { id, patientId },
        data: {
          status: "cancelled",
          notes: `Cancelled by patient. Reason: ${reason}`,
        },
      });

      if (appointmentRequest.count === 0) {
        return res.status(404).json({
          success: false,
          error: "Appointment request not found",
        } as ApiResponse);
      }

      return res.json({
        success: true,
        message: "Appointment request cancelled successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Cancel appointment request error:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse);
    }
  }

  static async getHospitals(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { page = 1, limit = 20, region, name } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const whereClause: any = {};

      if (region) {
        whereClause.region = {
          contains: region as string,
          mode: "insensitive",
        };
      }

      if (name) {
        whereClause.name = {
          contains: name as string,
          mode: "insensitive",
        };
      }

      const [hospitals, total] = await Promise.all([
        prisma.hospital.findMany({
          where: whereClause,
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            region: true,
            email: true,
          },
          skip,
          take: Number(limit),
          orderBy: { name: "asc" },
        }),
        prisma.hospital.count({ where: whereClause }),
      ]);

      return res.json({
        success: true,
        data: hospitals,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Get hospitals error:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse);
    }
  }
}