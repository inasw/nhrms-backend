import { Router } from "express"
import { AdminController } from "../controllers/adminController"
import { authenticate, requireHospitalAdmin } from "../middleware/auth"

const router = Router()

// Apply authentication and admin role check to all routes
router.use(authenticate, requireHospitalAdmin)

// Hospital management
router.get("/hospital", AdminController.getHospitalInfo)
router.put("/hospital", AdminController.updateHospitalInfo)

// Staff management
router.get("/doctors", AdminController.getDoctors)
router.post("/doctors", AdminController.addDoctor)
router.put("/doctors/:id", AdminController.updateDoctor)

router.get("/lab-techs", AdminController.getLabTechs)
router.post("/lab-techs", AdminController.addLabTech)
router.put("/lab-techs/:id", AdminController.updateLabTech)

// Reports
router.post("/reports/generate", AdminController.generateReport)

// Settings
router.get("/settings", AdminController.getSettings)
router.put("/settings", AdminController.updateSettings)

export default router
