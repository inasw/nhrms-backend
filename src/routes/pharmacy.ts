import { Router } from "express"
import { PharmacyController } from "../controllers/pharmacyController"
import { authenticate, requirePharmacist } from "../middleware/auth"

const router = Router()

// Apply authentication and pharmacist role check to all routes
router.use(authenticate, requirePharmacist)

// Pharmacy profile routes
router.get("/profile", PharmacyController.getPharmacyProfile)
router.put("/profile", PharmacyController.updatePharmacyProfile)

// Prescription routes
router.get("/prescriptions", PharmacyController.getPrescriptions)
router.get("/prescriptions/:id", PharmacyController.getPrescriptionDetails)
router.post("/prescriptions/:id/dispense", PharmacyController.dispensePrescription)
router.post("/prescriptions/:id/cancel", PharmacyController.cancelPrescription)

// Patient search
router.get("/patients/search", PharmacyController.searchPatients)

// Dashboard
router.get("/dashboard", PharmacyController.getDashboardStats)

export default router
