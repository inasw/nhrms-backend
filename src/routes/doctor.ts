import { Router } from "express"
import { DoctorController } from "../controllers/doctorController"
import { authenticate, requireDoctor } from "../middleware/auth"
import { validate, createAppointmentSchema, createMedicalRecordSchema, createPrescriptionSchema, createLabRequestSchema, approveAppointmentSchema, rejectAppointmentSchema } from "../middleware/validation"

const router = Router()

// Apply authentication and doctor role check to all routes
router.use(authenticate, requireDoctor)

// Patient routes
router.get("/patients", DoctorController.getPatients)
router.get("/patients/:id", DoctorController.getPatientDetails)
router.get("/patients/search", DoctorController.searchPatients)

// Appointment routes
router.get("/appointments", DoctorController.getAppointments)
router.post("/appointments", validate(createAppointmentSchema), DoctorController.createAppointment)
router.put("/appointments/:id", DoctorController.updateAppointment)

// Appointment request routes
router.get("/appointment-requests", DoctorController.getAppointmentRequests)
router.post("/appointment-requests/:id/approve", validate(approveAppointmentSchema), DoctorController.approveAppointmentRequest)
router.post("/appointment-requests/:id/reject", validate(rejectAppointmentSchema), DoctorController.rejectAppointmentRequest)

// Lab routes
router.post("/lab-requests", validate(createLabRequestSchema), DoctorController.createLabRequest)
router.get("/lab-requests", DoctorController.getLabRequests)
router.get("/lab-results", DoctorController.getLabResults)

// Prescription routes
router.post("/prescriptions", validate(createPrescriptionSchema), DoctorController.createPrescription)
router.get("/prescriptions", DoctorController.getPrescriptions)
router.put("/prescriptions/:id", DoctorController.updatePrescription)

// Medical record routes
router.post("/medical-records", validate(createMedicalRecordSchema), DoctorController.createMedicalRecord)
router.get("/medical-records", DoctorController.getMedicalRecords)
router.put("/medical-records/:id", DoctorController.updateMedicalRecord)

// Dashboard route
router.get("/dashboard", DoctorController.getDashboardStats)

export default router