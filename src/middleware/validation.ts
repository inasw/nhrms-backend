
import Joi from "joi"
import type { Request, Response, NextFunction } from "express"

// Define ApiResponse type if not already defined
interface ApiResponse {
  success: boolean;
  error?: string;
  data?: any;
}

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    console.log("Request body:", req.body)
    const { error } = schema.validate(req.body)

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      } as ApiResponse)
    }

    next()
  }
}

// List of valid regions (matching frontend)
const validRegions = [
  "addis ababa",
  "oromia",
  "amhara",
  "tigray",
  "snnp",
  "somali",
  "benishangul-gumuz",
  "gambela",
  "harari",
  "afar",
  "dire dawa",
]

// Common validation schemas
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
})

export const registerPatientSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  password: Joi.string().min(8).required(),
  faydaId: Joi.string().required(),
  dateOfBirth: Joi.date().required(),
  gender: Joi.string().valid("male", "female", "other").required(),
  region: Joi.string().valid(...validRegions).required(),
  city: Joi.string().required(),
  bloodType: Joi.string().optional(),
  height: Joi.number().optional(),
  weight: Joi.number().optional(),
  allowDataSharing: Joi.boolean().required(),
}).options({ allowUnknown: false });

export const createAppointmentSchema = Joi.object({
  patientId: Joi.string().required(),
  doctorId: Joi.string().required(),
  scheduledTime: Joi.date().required(),
  duration: Joi.number().default(30),
  type: Joi.string().valid("new", "checkup", "consultation", "followup").required(),
  reason: Joi.string().optional(),
  notes: Joi.string().optional(),
})

export const createMedicalRecordSchema = Joi.object({
  patientId: Joi.string().required(),
  recordType: Joi.string().valid("consultation", "prescription", "lab_order", "diagnosis").required(),
  title: Joi.string().required(),
  content: Joi.object().required(),
  status: Joi.string().optional(),
  attachments: Joi.array().items(Joi.string()).optional(),
})

export const createPrescriptionSchema = Joi.object({
  patientId: Joi.string().required(),
  medications: Joi.array().items(Joi.object({
    drug: Joi.string().required(),
    dosage: Joi.string().required(),
    frequency: Joi.string().required(),
    duration: Joi.string().required(),
    instructions: Joi.string().optional()
  })).required(),
  instructions: Joi.string().optional(),
})

export const createLabRequestSchema = Joi.object({
  patientId: Joi.string().required(),
  testType: Joi.string().required(),
  instructions: Joi.string().optional(),
  labTechId: Joi.string().optional(),
  priority: Joi.string().valid("routine", "urgent", "stat").default("routine")
})

export const approveAppointmentSchema = Joi.object({
  scheduledTime: Joi.date().optional(),
  duration: Joi.number().default(30),
  notes: Joi.string().optional()
})

export const rejectAppointmentSchema = Joi.object({
  reason: Joi.string().required()
})

export const dispensePrescriptionSchema = Joi.object({
  notes: Joi.string().optional()
})

export const cancelPrescriptionSchema = Joi.object({
  reason: Joi.string().required()
})

export const updatePharmacyProfileSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  phone: Joi.string().optional(),
  email: Joi.string().email().optional()
})

export const createPharmacistSchema = Joi.object({
  user: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    password: Joi.string().min(8).required(),
    nationalId: Joi.string().required()
  }).required(),
  licenseNumber: Joi.string().required(),
  pharmacyId: Joi.string().required()
})

export const createPharmacySchema = Joi.object({
  name: Joi.string().required(),
  code: Joi.string().required(),
  address: Joi.string().required(),
  phone: Joi.string().required(),
  email: Joi.string().email().required(),
  region: Joi.string().valid(...validRegions).required(),
  type: Joi.string().valid("public", "private").required()
})

// Export additional schemas
export const vitalSchema = Joi.object({
  heartRate: Joi.number().optional(),
  bloodPressure: Joi.string().pattern(/^\d+\/\d+$/).optional(),
  temperature: Joi.number().optional(),
  bloodSugar: Joi.number().optional(),
  oxygenSaturation: Joi.number().optional(),
  weight: Joi.number().optional(),
  notes: Joi.string().optional().allow(""),
  source: Joi.string().valid("manual", "device").optional().default("manual"),
  deviceId: Joi.string().optional(),
})

// Create a specific validation middleware for vitals
export const validateVitals = (req: Request, res: Response, next: NextFunction): Response | void => {
  const { error } = vitalSchema.validate(req.body)
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message,
    } as ApiResponse)
  }
  next()
}
