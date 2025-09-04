import Joi from "joi"
import type { Request, Response, NextFunction } from "express"

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction):  Response | void  => {
    console.log("Request body:", req.body);
    const { error } = schema.validate(req.body)

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      })
    }

    next()
  }
}

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
  bloodType: Joi.string().optional(),
  height: Joi.number().optional(),
  weight: Joi.number().optional(),
})

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


