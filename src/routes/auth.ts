import { Router } from "express"
import { AuthController } from "../controllers/authController"
import { validate, loginSchema, registerPatientSchema } from "../middleware/validation"
import { authLimiter } from "../middleware/rateLimiter"

const router = Router()

// Apply rate limiting to all auth routes
// router.use(authLimiter)

// Authentication routes
router.post("/login", validate(loginSchema), AuthController.login)
router.post("/register/patient", validate(registerPatientSchema), AuthController.registerPatient)
router.post("/register/doctor", AuthController.registerDoctor) // Admin only
router.post("/refresh", AuthController.refreshToken)
router.post("/logout", AuthController.logout)

export default router
