import { Router } from "express"
import { SuperAdminController } from "../controllers/superAdminController"
import { authenticate, requireSuperAdmin } from "../middleware/auth"
import { strictLimiter } from "../middleware/rateLimiter"

const router = Router()

// Apply authentication and super admin role check to all routes
router.use(authenticate, requireSuperAdmin)

// Apply strict rate limiting to sensitive operations
router.use("/facilities", strictLimiter)
router.use("/admins", strictLimiter)

// Facility management
router.get("/facilities", SuperAdminController.getFacilities)
router.post("/facilities", SuperAdminController.registerFacility)
router.get("/facilities/:id", SuperAdminController.getFacilityDetails)
router.put("/facilities/:id", SuperAdminController.updateFacility)
// router.patch("/facilities/:id/status", SuperAdminController.changeFacilityStatus)

// Administrator management
router.get("/admins", SuperAdminController.getFacilityAdmins)
router.post("/admins", SuperAdminController.createFacilityAdmin)
router.put("/admins/:id",SuperAdminController.updateFacilityAdmin)

// Dashboard and reporting
router.get("/dashboard/stats", SuperAdminController.getDashboardStats)
router.get("/audit-logs", SuperAdminController.getAuditLogs)

export default router
