import { Router } from "express"
import { AdminController } from "../controllers/adminController"
import { authenticate, requireHospitalAdmin } from "../middleware/auth"

const router = Router()

// Apply authentication and admin role check to all routes
router.use(authenticate, requireHospitalAdmin)

/**
 * @swagger
 * /api/admin/hospital:
 *   get:
 *     tags: [Admin]
 *     summary: Get hospital information
 *     description: Retrieves details of the hospital managed by the admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hospital details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "hosp123"
 *                 name:
 *                   type: string
 *                   example: "City Hospital"
 *                 address:
 *                   type: string
 *                   example: "123 Health St, City"
 *                 contactNumber:
 *                   type: string
 *                   example: "+1234567890"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a hospital admin)
 */
router.get("/hospital", AdminController.getHospitalInfo)

/**
 * @swagger
 * /api/admin/hospital:
 *   put:
 *     tags: [Admin]
 *     summary: Update hospital information
 *     description: Updates details of the hospital managed by the admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "City Hospital Updated"
 *               address:
 *                 type: string
 *                 example: "456 Health St, City"
 *               contactNumber:
 *                 type: string
 *                 example: "+1234567890"
 *     responses:
 *       200:
 *         description: Hospital updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 hospital:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     address:
 *                       type: string
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a hospital admin)
 */
router.put("/hospital", AdminController.updateHospitalInfo)

/**
 * @swagger
 * /api/admin/doctors:
 *   get:
 *     tags: [Admin]
 *     summary: Get all doctors
 *     description: Retrieves a list of doctors in the hospital
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of doctors
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
 *                   email:
 *                     type: string
 *                     example: "john.doe@example.com"
 *                   specialty:
 *                     type: string
 *                     example: "Cardiology"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a hospital admin)
 */
router.get("/doctors", AdminController.getDoctors)

/**
 * @swagger
 * /api/admin/doctors:
 *   post:
 *     tags: [Admin]
 *     summary: Add a new doctor
 *     description: Creates a new doctor account in the hospital
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - specialty
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Dr. John Doe"
 *               email:
 *                 type: string
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 example: "doctor123"
 *               specialty:
 *                 type: string
 *                 example: "Cardiology"
 *     responses:
 *       201:
 *         description: Doctor added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 doctor:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     specialty:
 *                       type: string
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a hospital admin)
 */
router.post("/doctors", AdminController.addDoctor)

/**
 * @swagger
 * /api/admin/doctors/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update doctor details
 *     description: Updates details of a specific doctor in the hospital
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Dr. John Doe Updated"
 *               email:
 *                 type: string
 *                 example: "john.doe.updated@example.com"
 *               specialty:
 *                 type: string
 *                 example: "Neurology"
 *     responses:
 *       200:
 *         description: Doctor updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a hospital admin)
 *       404:
 *         description: Doctor not found
 */
router.put("/doctors/:id", AdminController.updateDoctor)

/**
 * @swagger
 * /api/admin/lab-techs:
 *   get:
 *     tags: [Admin]
 *     summary: Get all lab technicians
 *     description: Retrieves a list of lab technicians in the hospital
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of lab technicians
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "lab123"
 *                   name:
 *                     type: string
 *                     example: "Jane Smith"
 *                   email:
 *                     type: string
 *                     example: "jane.smith@example.com"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a hospital admin)
 */
router.get("/lab-techs", AdminController.getLabTechs)

/**
 * @swagger
 * /api/admin/lab-techs:
 *   post:
 *     tags: [Admin]
 *     summary: Add a new lab technician
 *     description: Creates a new lab technician account in the hospital
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Jane Smith"
 *               email:
 *                 type: string
 *                 example: "jane.smith@example.com"
 *               password:
 *                 type: string
 *                 example: "labtech123"
 *     responses:
 *       201:
 *         description: Lab technician added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 labTech:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a hospital admin)
 */
router.post("/lab-techs", AdminController.addLabTech)

/**
 * @swagger
 * /api/admin/lab-techs/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update lab technician details
 *     description: Updates details of a specific lab technician in the hospital
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lab Technician ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Jane Smith Updated"
 *               email:
 *                 type: string
 *                 example: "jane.smith.updated@example.com"
 *     responses:
 *       200:
 *         description: Lab technician updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a hospital admin)
 *       404:
 *         description: Lab technician not found
 */
router.put("/lab-techs/:id", AdminController.updateLabTech)

/**
 * @swagger
 * /api/admin/reports/generate:
 *   post:
 *     tags: [Admin]
 *     summary: Generate a report
 *     description: Generates a report based on specified criteria
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reportType
 *               - startDate
 *               - endDate
 *             properties:
 *               reportType:
 *                 type: string
 *                 example: "patient_activity"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-09-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-09-30"
 *     responses:
 *       200:
 *         description: Report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 report:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "rep123"
 *                     type:
 *                       type: string
 *                       example: "patient_activity"
 *                     data:
 *                       type: object
 *                       example: {}
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a hospital admin)
 */
router.post("/reports/generate", AdminController.generateReport)

/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     tags: [Admin]
 *     summary: Get hospital settings
 *     description: Retrieves the hospital's configuration settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hospital settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hospitalId:
 *                   type: string
 *                   example: "hosp123"
 *                 appointmentDuration:
 *                   type: number
 *                   example: 30
 *                 maxPatientsPerSlot:
 *                   type: number
 *                   example: 5
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a hospital admin)
 */
router.get("/settings", AdminController.getSettings)

/**
 * @swagger
 * /api/admin/settings:
 *   put:
 *     tags: [Admin]
 *     summary: Update hospital settings
 *     description: Updates the hospital's configuration settings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               appointmentDuration:
 *                 type: number
 *                 example: 30
 *               maxPatientsPerSlot:
 *                 type: number
 *                 example: 5
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 settings:
 *                   type: object
 *                   properties:
 *                     hospitalId:
 *                       type: string
 *                     appointmentDuration:
 *                       type: number
 *                     maxPatientsPerSlot:
 *                       type: number
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a hospital admin)
 */
router.put("/settings", AdminController.updateSettings)

export default router