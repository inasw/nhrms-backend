import { Router } from "express"
import { PatientController } from "../controllers/patientController"
import { authenticate, requirePatient } from "../middleware/auth"

const router = Router()

// Apply authentication and patient role check to all routes
router.use(authenticate, requirePatient)

// Health monitoring
router.post("/vitals", PatientController.submitVitals)
router.get("/vitals", PatientController.getVitals)
router.get("/vitals/latest", PatientController.getLatestVitals)

// Appointment management
router.get("/appointments", PatientController.getAppointments)
router.post("/appointments", PatientController.requestAppointment)

// Medical records
router.get("/records", PatientController.getMedicalRecords)

// Search functionality
router.get("/doctors", PatientController.searchDoctors)

// Health alerts
router.get("/alerts", PatientController.getHealthAlerts)

export default router
