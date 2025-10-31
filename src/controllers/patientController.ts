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
        doctorId,
      } = req.body;

      const validSources = ["manual", "device"] as const;
      if (!validSources.includes(source as any)) {
        return res.status(400).json({
          success: false,
          error: "Invalid source. Must be 'manual' or 'device'.",
        } as ApiResponse);
      }

      let assignedDoctorId: string | undefined = doctorId;
      if (!assignedDoctorId) {
        const latestAppointment = await prisma.appointment.findFirst({
          where: { patientId },
          orderBy: { scheduledTime: "desc" },
          select: { doctorId: true },
        });
        assignedDoctorId = latestAppointment?.doctorId;
      }

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

      await prisma.vital.createMany({
        data: vitalRecords,
      });

      const newVitals = await prisma.vital.findMany({
        where: {
          patientId,
          recordedAt: { gte: new Date(Date.now() - 1000) },
        },
      });

      await PatientController.checkVitalAlerts(patientId, newVitals);

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
      const appointmentWhereClause: any = { patientId };
      const requestWhereClause: any = { patientId };

      if (status) {
        appointmentWhereClause.status = status;
        requestWhereClause.status = status;
      }

      if (upcoming === "true") {
        appointmentWhereClause.scheduledTime = {
          gte: new Date(),
        };
        requestWhereClause.requestedDate = {
          gte: new Date(),
        };
      }

      // Get both confirmed appointments and appointment requests
      const [appointments, appointmentRequests, appointmentTotal, requestTotal] = await Promise.all([
        prisma.appointment.findMany({
          where: appointmentWhereClause,
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
          skip: 0,
          take: Number(limit) * 2, // Get more to account for both types
          orderBy: { scheduledTime: "desc" },
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
              select: { name: true, address: true, phone: true },
            },
          },
          skip: 0,
          take: Number(limit) * 2,
          orderBy: { requestedDate: "desc" },
        }),
        prisma.appointment.count({ where: appointmentWhereClause }),
        prisma.appointmentRequest.count({ where: requestWhereClause }),
      ]);

      // Format appointment requests to match appointment structure
      const formattedRequests = appointmentRequests.map(request => {
        // Try to get doctor info if doctorId exists
        let doctorInfo = null;
        if (request.doctorId) {
          // We'll need to fetch doctor info separately since it's not included in the request
          doctorInfo = {
            user: {
              firstName: "Doctor", // Placeholder - will be updated below
              lastName: "TBD"
            }
          };
        }

        return {
          id: request.id,
          scheduledTime: request.requestedDate,
          duration: 30,
          type: "consultation",
          status: request.status,
          notes: request.notes,
          reason: request.reason,
          doctor: doctorInfo,
          hospital: request.hospital,
          isRequest: true, // Flag to identify this as a request
          preferredTime: request.preferredTime,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt
        };
      });

      // Fetch doctor info for requests that have doctorId
      const doctorIds = appointmentRequests
        .filter(req => req.doctorId)
        .map(req => req.doctorId!);
      
      if (doctorIds.length > 0) {
        const doctors = await prisma.doctor.findMany({
          where: { id: { in: doctorIds } },
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        });

        // Update formatted requests with actual doctor info
        formattedRequests.forEach(request => {
          const originalRequest = appointmentRequests.find(r => r.id === request.id);
          if (originalRequest?.doctorId) {
            const doctor = doctors.find(d => d.id === originalRequest.doctorId);
            if (doctor) {
              request.doctor = {
                user: {
                  firstName: doctor.user.firstName,
                  lastName: doctor.user.lastName,
                },
              };
            }
          }
        });
      }

      // Combine and sort all appointments by date
      const allAppointments = [...appointments, ...formattedRequests]
        .sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime())
        .slice(skip, skip + Number(limit)); // Apply pagination after combining

      const total = appointmentTotal + requestTotal;

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
        include: {
          hospital: {
            select: { name: true, address: true, phone: true },
          },
        },
      });

      return res.status(201).json({
        success: true,
        data: appointmentRequest,
        message: "Appointment request submitted successfully. You can view it in your appointments page.",
      } as ApiResponse);
    } catch (error) {
      console.error("Request appointment error:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
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

  static async getPrescriptions(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const patientId = await PatientController.getPatientId(req.user!.id);
      const { page = 1, limit = 20, status } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      const whereClause: any = { patientId };

      if (status) {
        whereClause.status = status;
      }

      const [prescriptions, total] = await Promise.all([
        prisma.prescription.findMany({
          where: whereClause,
          include: {
            doctor: {
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
      ]);

      return res.json({
        success: true,
        data: prescriptions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Get prescriptions error:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse);
    }
  }

  static async getLabResults(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const patientId = await PatientController.getPatientId(req.user!.id);
      const { page = 1, limit = 20, testType } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      const whereClause: any = { patientId, status: "completed" };

      if (testType) {
        whereClause.testType = testType;
      }

      const [labResults, total] = await Promise.all([
        prisma.labRequest.findMany({
          where: whereClause,
          include: {
            doctor: {
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
          orderBy: { completedAt: "desc" },
        }),
        prisma.labRequest.count({ where: whereClause }),
      ]);

      return res.json({
        success: true,
        data: labResults,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Get lab results error:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse);
    }
  }

  static async requestRefill(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const patientId = await PatientController.getPatientId(req.user!.id);
      const { id } = req.params;
      const { reason, notes } = req.body;

      const prescription = await prisma.prescription.findFirst({
        where: { id, patientId },
        include: {
          doctor: true,
        },
      });

      if (!prescription) {
        return res.status(404).json({
          success: false,
          error: "Prescription not found",
        } as ApiResponse);
      }

      const refillRequest = await prisma.prescription.create({
        data: {
          patientId,
          doctorId: prescription.doctorId,
          pharmacyId: prescription.pharmacyId,
          medications: prescription.medications as any,
          instructions: `REFILL REQUEST: ${prescription.instructions}\nReason: ${reason || "Medication refill request"}\nNotes: ${notes || ""}`,
          status: "pending",
        },
      });

      return res.status(201).json({
        success: true,
        data: refillRequest,
        message: "Refill request submitted successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Request refill error:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse);
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

      const appointment = await prisma.appointment.findFirst({
        where: { id, patientId },
      });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          error: "Appointment not found",
        } as ApiResponse);
      }

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

      if (vital.type === "heartRate" && (vital.value < 60 || vital.value > 100)) {
        alerts.push({
          patientId,
          type: "vital",
          message: vital.value < 60 ? "Low heart rate detected" : "High heart rate detected",
          severity: "medium",
          relatedRecordId: vital.id,
        });
      }

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

    if (alerts.length > 0) {
      await prisma.healthAlert.createMany({
        data: alerts,
      });
    }
  }
}