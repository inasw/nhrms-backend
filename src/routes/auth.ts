import { Router } from "express"
import { AuthController } from "../controllers/authController"
import { validate, loginSchema, registerPatientSchema } from "../middleware/validation"
import { authLimiter } from "../middleware/rateLimiter"

const router = Router()

// Apply rate limiting to all auth routes
// router.use(authLimiter)

// Authentication routes
// router.post("/login", validate(loginSchema), AuthController.login)
// router.post("/register/patient", validate(registerPatientSchema), AuthController.registerPatient)
// router.post("/register/doctor", AuthController.registerDoctor) // Admin only
// router.post("/refresh", AuthController.refreshToken)
// router.post("/logout", AuthController.logout)

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: User login
 *     description: Authenticates a user and returns a JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Invalid email or password
 */
router.post("/login", validate(loginSchema), AuthController.login)

/**
 * @swagger
 * /api/auth/register/patient:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new patient
 *     description: Creates a new patient account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 example: patient@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *               name:
 *                 type: string
 *                 example: John Doe
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: 1990-01-01
 *     responses:
 *       201:
 *         description: Patient registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *       400:
 *         description: Invalid input data
 */
router.post("/register/patient", validate(registerPatientSchema), AuthController.registerPatient)

/**
 * @swagger
 * /api/auth/register/doctor:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new doctor (Admin only)
 *     description: Creates a new doctor account, restricted to admin users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - licenseNumber
 *             properties:
 *               email:
 *                 type: string
 *                 example: doctor@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *               name:
 *                 type: string
 *                 example: Dr. Jane Smith
 *               licenseNumber:
 *                 type: string
 *                 example: DOC12345
 *     responses:
 *       201:
 *         description: Doctor registered successfully
 *       403:
 *         description: Unauthorized (not an admin)
 *       400:
 *         description: Invalid input data
 */
router.post("/register/doctor", AuthController.registerDoctor) // Admin only

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh JWT token
 *     description: Generates a new JWT token using a refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid refresh token
 */
router.post("/refresh", AuthController.refreshToken)

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out user
 *     description: Invalidates the user's refresh token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/logout", AuthController.logout)

export default router
