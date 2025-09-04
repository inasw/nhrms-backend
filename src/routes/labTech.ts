import { Router } from "express"
import { LabTechController } from "../controllers/labTechController"
import { authenticate, /*requireLabTech */} from "../middleware/auth" 

const router = Router()

router.use(authenticate)
// router.use(authenticate, requireLabTech)

router.get("/patients/search", LabTechController.searchPatient)
router.get("/lab-requests", LabTechController.getLabRequests)
router.put("/lab-requests/:id", LabTechController.updateLabRequest)

export default router