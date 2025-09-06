import { Router } from "express"
import { DoctorController } from "../controllers/doctorController"
import { authenticate, requireDoctor } from "../middleware/auth"
import { validate, createAppointmentSchema, createMedicalRecordSchema } from "../middleware/validation"

const router = Router()

// Apply authentication and doctor role check to all routes
router.use(authenticate, requireDoctor)

/**
 * @swagger
 * /api/doctor/patients:
 *   get:
 *     tags: [Doctor]
 *     summary: Get all patients
 *     description: Retrieves a list of patients assigned to the doctor
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of patients
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "pat123"
 *                   name:
 *                     type: string
 *                     example: "Jane Doe"
 *                   email:
 *                     type: string
 *                     example: "jane.doe@example.com"
 *                   dateOfBirth:
 *                     type: string
 *                     format: date
 *                     example: "1990-01-01"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a doctor)
 */
router.get("/patients", DoctorController.getPatients)

/**
 * @swagger
 * /api/doctor/patients/{id}:
 *   get:
 *     tags: [Doctor]
 *     summary: Get patient details
 *     description: Retrieves details of a specific patient
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "pat123"
 *                 name:
 *                   type: string
 *                   example: "Jane Doe"
 *                 email:
 *                   type: string
 *                   example: "jane.doe@example.com"
 *                 dateOfBirth:
 *                   type: string
 *                   format: date
 *                   example: "1990-01-01"
 *                 medicalHistory:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       recordId:
 *                         type: string
 *                         example: "rec123"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a doctor)
 *       404:
 *         description: Patient not found
 */
router.get("/patients/:id", DoctorController.getPatientDetails)

/**
 * @swagger
 * /api/doctor/appointments:
 *   get:
 *     tags: [Doctor]
 *     summary: Get all appointments
 *     description: Retrieves a list of the doctor's appointments
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
 *                   patientId:
 *                     type: string
 *                     example: "pat123"
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
 *         description: Forbidden (not a doctor)
 */
router.get("/appointments", DoctorController.getAppointments)

/**
 * @swagger
 * /api/doctor/appointments:
 *   post:
 *     tags: [Doctor]
 *     summary: Create a new appointment
 *     description: Creates a new appointment for a patient
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - date
 *             properties:
 *               patientId:
 *                 type: string
 *                 example: "pat123"
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-09-10T10:00:00Z"
 *               notes:
 *                 type: string
 *                 example: "Routine checkup"
 *     responses:
 *       201:
 *         description: Appointment created successfully
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
 *                     patientId:
 *                       type: string
 *                     date:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a doctor)
 */
router.post("/appointments", validate(createAppointmentSchema), DoctorController.createAppointment)

/**
 * @swagger
 * /api/doctor/appointments/{id}:
 *   put:
 *     tags: [Doctor]
 *     summary: Update an appointment
 *     description: Updates details of a specific appointment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-09-10T11:00:00Z"
 *               status:
 *                 type: string
 *                 example: "rescheduled"
 *               notes:
 *                 type: string
 *                 example: "Rescheduled due to patient request"
 *     responses:
 *       200:
 *         description: Appointment updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a doctor)
 *       404:
 *         description: Appointment not found
 */
router.put("/appointments/:id", DoctorController.updateAppointment)

/**
 * @swagger
 * /api/doctor/lab-requests:
 *   post:
 *     tags: [Doctor]
 *     summary: Create a lab request
 *     description: Creates a new lab request for a patient
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - testType
 *             properties:
 *               patientId:
 *                 type: string
 *                 example: "pat123"
 *               testType:
 *                 type: string
 *                 example: "blood_test"
 *               notes:
 *                 type: string
 *                 example: "Check for anemia"
 *     responses:
 *       201:
 *         description: Lab request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 labRequest:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     patientId:
 *                       type: string
 *                     testType:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: "pending"
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a doctor)
 */
router.post("/lab-requests", DoctorController.createLabRequest)

/**
 * @swagger
 * /api/doctor/records:
 *   post:
 *     tags: [Doctor]
 *     summary: Create a medical record
 *     description: Creates a new medical record for a patient
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - diagnosis
 *             properties:
 *               patientId:
 *                 type: string
 *                 example: "pat123"
 *               diagnosis:
 *                 type: string
 *                 example: "Hypertension"
 *               notes:
 *                 type: string
 *                 example: "Prescribed medication"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2025-09-06"
 *     responses:
 *       201:
 *         description: Medical record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 record:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     patientId:
 *                       type: string
 *                     diagnosis:
 *                       type: string
 *                     date:
 *                       type: string
 *                       format: date
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a doctor)
 */
router.post("/records", validate(createMedicalRecordSchema), DoctorController.createMedicalRecord)

/**
 * @swagger
 * /api/doctor/stats:
 *   get:
 *     tags: [Doctor]
 *     summary: Get dashboard statistics
 *     description: Retrieves statistics for the doctor's dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalPatients:
 *                   type: number
 *                   example: 50
 *                 totalAppointments:
 *                   type: number
 *                   example: 100
 *                 pendingLabRequests:
 *                   type: number
 *                   example: 5
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a doctor)
 */
router.get("/stats", DoctorController.getDashboardStats)

export default router