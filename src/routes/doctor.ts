import { Router } from "express"
import { DoctorController } from "../controllers/doctorController"
import { authenticate, requireDoctor } from "../middleware/auth"
import { validate, createAppointmentSchema, createMedicalRecordSchema } from "../middleware/validation"

const router = Router()

// Apply authentication and doctor role check to all routes
router.use(authenticate, requireDoctor)

// Patient management
router.get("/patients", DoctorController.getPatients)
router.get("/patients/:id", DoctorController.getPatientDetails)

// Appointment management
router.get("/appointments", DoctorController.getAppointments)
router.post("/appointments", validate(createAppointmentSchema), DoctorController.createAppointment)
router.put("/appointments/:id", DoctorController.updateAppointment)

router.post("/lab-requests", DoctorController.createLabRequest)

// Medical records
router.post("/records", validate(createMedicalRecordSchema), DoctorController.createMedicalRecord)

// Dashboard
router.get("/stats", DoctorController.getDashboardStats)



export default router
