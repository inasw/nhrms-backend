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
 * /api/patient/prescriptions:
 *   get:
 *     tags: [Patient]
 *     summary: Get prescriptions
 *     description: Retrieves the patient's prescription history
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of prescriptions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       medication:
 *                         type: string
 *                       dosage:
 *                         type: string
 *                       prescribedBy:
 *                         type: string
 *                       status:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/prescriptions", PatientController.getPrescriptions)

/**
 * @swagger
 * /api/patient/lab-results:
 *   get:
 *     tags: [Patient]
 *     summary: Get lab results
 *     description: Retrieves the patient's laboratory test results
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of lab results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       test:
 *                         type: string
 *                       result:
 *                         type: string
 *                       date:
 *                         type: string
 *                       status:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/lab-results", PatientController.getLabResults)

/**
 * @swagger
 * /api/patient/prescriptions/{id}/refill:
 *   post:
 *     tags: [Patient]
 *     summary: Request prescription refill
 *     description: Request a refill for an existing prescription
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Prescription ID
 *     responses:
 *       200:
 *         description: Refill requested successfully
 *       404:
 *         description: Prescription not found
 *       401:
 *         description: Unauthorized
 */
router.post("/prescriptions/:id/refill", PatientController.requestRefill)

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

/**
 * @swagger
 * /api/patient/hospitals:
 *   get:
 *     tags: [Patient]
 *     summary: Get available hospitals
 *     description: Retrieves a list of hospitals where patients can book appointments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of hospitals
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "hosp123"
 *                   name:
 *                     type: string
 *                     example: "City Hospital"
 *                   address:
 *                     type: string
 *                     example: "123 Health St, City"
 *                   phone:
 *                     type: string
 *                     example: "+1234567890"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a patient)
 */
router.get("/hospitals", PatientController.getHospitals)

/**
 * @swagger
 * /api/patient/appointments/{id}/reschedule:
 *   put:
 *     tags: [Patient]
 *     summary: Reschedule appointment
 *     description: Request to reschedule an existing appointment
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
 *             required:
 *               - date
 *               - time
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2025-09-15"
 *               time:
 *                 type: string
 *                 example: "14:30"
 *               reason:
 *                 type: string
 *                 example: "Schedule conflict"
 *     responses:
 *       200:
 *         description: Reschedule request submitted
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Appointment not found
 */
router.put("/appointments/:id/reschedule", PatientController.rescheduleAppointment)

/**
 * @swagger
 * /api/patient/appointments/{id}/cancel:
 *   put:
 *     tags: [Patient]
 *     summary: Cancel appointment
 *     description: Cancel an existing appointment
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
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Personal emergency"
 *     responses:
 *       200:
 *         description: Appointment cancelled successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Appointment not found
 */
router.put("/appointments/:id/cancel", PatientController.cancelAppointment)

/**
 * @swagger
 * /api/patient/appointment-requests/{id}/cancel:
 *   put:
 *     tags: [Patient]
 *     summary: Cancel appointment request
 *     description: Cancel a pending appointment request
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Personal emergency"
 *     responses:
 *       200:
 *         description: Appointment request cancelled successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Appointment request not found
 */
router.put("/appointment-requests/:id/cancel", PatientController.cancelAppointmentRequest)

export default router