import { Router } from "express"
import { PatientController } from "../controllers/patientController"
import { authenticate, requirePatient } from "../middleware/auth"

const router = Router()

// Apply authentication and patient role check to all routes
router.use(authenticate, requirePatient)

/**
 * @swagger
 * /api/patient/vitals:
 *   post:
 *     tags: [Patient]
 *     summary: Submit vitals
 *     description: Allows a patient to submit their vital signs
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - heartRate
 *               - bloodPressure
 *               - temperature
 *             properties:
 *               heartRate:
 *                 type: number
 *                 example: 72
 *               bloodPressure:
 *                 type: string
 *                 example: "120/80"
 *               temperature:
 *                 type: number
 *                 example: 36.6
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-09-06T13:00:00Z"
 *     responses:
 *       201:
 *         description: Vitals submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 vitals:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "vit123"
 *                     heartRate:
 *                       type: number
 *                     bloodPressure:
 *                       type: string
 *                     temperature:
 *                       type: number
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a patient)
 */
router.post("/vitals", PatientController.submitVitals)

/**
 * @swagger
 * /api/patient/vitals:
 *   get:
 *     tags: [Patient]
 *     summary: Get all vitals
 *     description: Retrieves a list of the patient's vital sign records
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of vitals
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "vit123"
 *                   heartRate:
 *                     type: number
 *                     example: 72
 *                   bloodPressure:
 *                     type: string
 *                     example: "120/80"
 *                   temperature:
 *                     type: number
 *                     example: 36.6
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-09-06T13:00:00Z"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a patient)
 */
router.get("/vitals", PatientController.getVitals)

/**
 * @swagger
 * /api/patient/vitals/latest:
 *   get:
 *     tags: [Patient]
 *     summary: Get latest vitals
 *     description: Retrieves the most recent vital sign record for the patient
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Latest vitals
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "vit123"
 *                 heartRate:
 *                   type: number
 *                   example: 72
 *                 bloodPressure:
 *                   type: string
 *                   example: "120/80"
 *                 temperature:
 *                   type: number
 *                   example: 36.6
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-09-06T13:00:00Z"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a patient)
 *       404:
 *         description: No vitals found
 */
router.get("/vitals/latest", PatientController.getLatestVitals)

/**
 * @swagger
 * /api/patient/appointments:
 *   get:
 *     tags: [Patient]
 *     summary: Get all appointments
 *     description: Retrieves a list of the patient's appointments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of appointments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "apt123"
 *                   doctorId:
 *                     type: string
 *                     example: "doc123"
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-09-10T10:00:00Z"
 *                   status:
 *                     type: string
 *                     example: "scheduled"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a patient)
 */
router.get("/appointments", PatientController.getAppointments)

/**
 * @swagger
 * /api/patient/appointments:
 *   post:
 *     tags: [Patient]
 *     summary: Request an appointment
 *     description: Allows a patient to request a new appointment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctorId
 *               - date
 *             properties:
 *               doctorId:
 *                 type: string
 *                 example: "doc123"
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-09-10T10:00:00Z"
 *               reason:
 *                 type: string
 *                 example: "Routine checkup"
 *     responses:
 *       201:
 *         description: Appointment requested successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 appointment:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     doctorId:
 *                       type: string
 *                     date:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *                       example: "pending"
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a patient)
 */
router.post("/appointments", PatientController.requestAppointment)

/**
 * @swagger
 * /api/patient/records:
 *   get:
 *     tags: [Patient]
 *     summary: Get medical records
 *     description: Retrieves the patient's medical records
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of medical records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "rec123"
 *                   diagnosis:
 *                     type: string
 *                     example: "Hypertension"
 *                   date:
 *                     type: string
 *                     format: date
 *                     example: "2025-09-06"
 *                   doctorId:
 *                     type: string
 *                     example: "doc123"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a patient)
 */
router.get("/records", PatientController.getMedicalRecords)

/**
 * @swagger
 * /api/patient/doctors:
 *   get:
 *     tags: [Patient]
 *     summary: Search doctors
 *     description: Searches for doctors by name or specialty
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search term (e.g., doctor name or specialty)
 *         example: "Cardiology"
 *     responses:
 *       200:
 *         description: List of matching doctors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "doc123"
 *                   name:
 *                     type: string
 *                     example: "Dr. John Doe"
 *                   specialty:
 *                     type: string
 *                     example: "Cardiology"
 *       400:
 *         description: Invalid query parameter
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a patient)
 */
router.get("/doctors", PatientController.searchDoctors)

/**
 * @swagger
 * /api/patient/alerts:
 *   get:
 *     tags: [Patient]
 *     summary: Get health alerts
 *     description: Retrieves health alerts or notifications for the patient
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of health alerts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "alert123"
 *                   message:
 *                     type: string
 *                     example: "High blood pressure detected"
 *                   severity:
 *                     type: string
 *                     example: "warning"
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-09-06T13:00:00Z"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a patient)
 */
router.get("/alerts", PatientController.getHealthAlerts)

export default router