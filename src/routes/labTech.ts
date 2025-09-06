import { Router } from "express"
import { LabTechController } from "../controllers/labTechController"
import { authenticate /*, requireLabTech */ } from "../middleware/auth"

const router = Router()

router.use(authenticate)
// router.use(authenticate, requireLabTech)

/**
 * @swagger
 * /api/labtech/patients/search:
 *   get:
 *     tags: [LabTech]
 *     summary: Search patients
 *     description: Searches for patients by name or ID for lab-related tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search term (e.g., patient name or ID)
 *         example: "Jane Doe"
 *     responses:
 *       200:
 *         description: List of matching patients
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
 *       400:
 *         description: Invalid query parameter
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a lab technician)
 */
router.get("/patients/search", LabTechController.searchPatient)

/**
 * @swagger
 * /api/labtech/lab-requests:
 *   get:
 *     tags: [LabTech]
 *     summary: Get lab requests
 *     description: Retrieves a list of lab requests assigned to the lab technician
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of lab requests
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
 *                   patientId:
 *                     type: string
 *                     example: "pat123"
 *                   testType:
 *                     type: string
 *                     example: "blood_test"
 *                   status:
 *                     type: string
 *                     example: "pending"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-09-06T13:00:00Z"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a lab technician)
 */
router.get("/lab-requests", LabTechController.getLabRequests)

/**
 * @swagger
 * /api/labtech/lab-requests/{id}:
 *   put:
 *     tags: [LabTech]
 *     summary: Update lab request
 *     description: Updates the status or details of a specific lab request
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lab Request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 example: "completed"
 *               results:
 *                 type: object
 *                 example: { "result": "Normal" }
 *     responses:
 *       200:
 *         description: Lab request updated successfully
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
 *                     results:
 *                       type: object
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a lab technician)
 *       404:
 *         description: Lab request not found
 */
router.put("/lab-requests/:id", LabTechController.updateLabRequest)

export default router