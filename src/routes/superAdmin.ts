import { Router } from "express"
import { SuperAdminController } from "../controllers/superAdminController"
import { authenticate, requireSuperAdmin } from "../middleware/auth"
import { strictLimiter } from "../middleware/rateLimiter"
import { validate, createPharmacistSchema, createPharmacySchema } from "../middleware/validation"

const router = Router()

// Apply authentication and super admin role check to all routes
router.use(authenticate, requireSuperAdmin)

// Apply strict rate limiting to sensitive operations
router.use("/facilities", strictLimiter)
router.use("/admins", strictLimiter)

/**
 * @swagger
 * /api/superadmin/facilities:
 *   get:
 *     tags: [SuperAdmin]
 *     summary: Get all facilities
 *     description: Retrieves a list of all healthcare facilities
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of facilities
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "fac123"
 *                   name:
 *                     type: string
 *                     example: "City Hospital"
 *                   address:
 *                     type: string
 *                     example: "123 Health St, City"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a super admin)
 */
router.get("/facilities", SuperAdminController.getFacilities)

/**
 * @swagger
 * /api/superadmin/facilities:
 *   post:
 *     tags: [SuperAdmin]
 *     summary: Register a new facility
 *     description: Creates a new healthcare facility
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
 *               - address
 *             properties:
 *               name:
 *                 type: string
 *                 example: "City Hospital"
 *               address:
 *                 type: string
 *                 example: "123 Health St, City"
 *               contactNumber:
 *                 type: string
 *                 example: "+1234567890"
 *     responses:
 *       201:
 *         description: Facility registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 facility:
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
 *         description: Forbidden (not a super admin)
 */
router.post("/facilities", SuperAdminController.registerFacility)

/**
 * @swagger
 * /api/superadmin/facilities/{id}:
 *   get:
 *     tags: [SuperAdmin]
 *     summary: Get facility details
 *     description: Retrieves details of a specific healthcare facility
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Facility ID
 *     responses:
 *       200:
 *         description: Facility details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "fac123"
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
 *         description: Forbidden (not a super admin)
 *       404:
 *         description: Facility not found
 */
router.get("/facilities/:id", SuperAdminController.getFacilityDetails)

/**
 * @swagger
 * /api/superadmin/facilities/{id}:
 *   put:
 *     tags: [SuperAdmin]
 *     summary: Update facility details
 *     description: Updates details of a specific healthcare facility
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Facility ID
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
 *         description: Facility updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a super admin)
 *       404:
 *         description: Facility not found
 */
router.put("/facilities/:id", SuperAdminController.updateFacility)

/**
 * @swagger
 * /api/superadmin/admins:
 *   get:
 *     tags: [SuperAdmin]
 *     summary: Get facility admins
 *     description: Retrieves a list of all facility administrators
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of facility admins
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "adm123"
 *                   email:
 *                     type: string
 *                     example: "admin@example.com"
 *                   name:
 *                     type: string
 *                     example: "Admin User"
 *                   facilityId:
 *                     type: string
 *                     example: "fac123"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a super admin)
 */
router.get("/admins", SuperAdminController.getFacilityAdmins)

/**
 * @swagger
 * /api/superadmin/admins:
 *   post:
 *     tags: [SuperAdmin]
 *     summary: Create a facility admin
 *     description: Creates a new facility administrator
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
 *               - facilityId
 *             properties:
 *               email:
 *                 type: string
 *                 example: "admin@example.com"
 *               password:
 *                 type: string
 *                 example: "admin123"
 *               name:
 *                 type: string
 *                 example: "Admin User"
 *               facilityId:
 *                 type: string
 *                 example: "fac123"
 *     responses:
 *       201:
 *         description: Facility admin created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 admin:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     facilityId:
 *                       type: string
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a super admin)
 */
router.post("/admins", SuperAdminController.createFacilityAdmin)

// Pharmacy management
router.get("/pharmacies", SuperAdminController.getPharmacies)
router.post("/pharmacies", validate(createPharmacySchema), SuperAdminController.createPharmacy)
router.post("/pharmacists", validate(createPharmacistSchema), SuperAdminController.createPharmacist)

/**
 * @swagger
 * /api/superadmin/admins/{id}:
 *   put:
 *     tags: [SuperAdmin]
 *     summary: Update facility admin
 *     description: Updates details of a specific facility administrator
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "admin.updated@example.com"
 *               name:
 *                 type: string
 *                 example: "Admin User Updated"
 *               facilityId:
 *                 type: string
 *                 example: "fac123"
 *     responses:
 *       200:
 *         description: Admin updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a super admin)
 *       404:
 *         description: Admin not found
 */
router.put("/admins/:id", SuperAdminController.updateFacilityAdmin)

/**
 * @swagger
 * /api/superadmin/dashboard/stats:
 *   get:
 *     tags: [SuperAdmin]
 *     summary: Get dashboard statistics
 *     description: Retrieves statistics for the super admin dashboard
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
 *                 totalFacilities:
 *                   type: number
 *                   example: 10
 *                 totalAdmins:
 *                   type: number
 *                   example: 50
 *                 totalPatients:
 *                   type: number
 *                   example: 1000
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a super admin)
 */
router.get("/dashboard/stats", SuperAdminController.getDashboardStats)

/**
 * @swagger
 * /api/superadmin/audit-logs:
 *   get:
 *     tags: [SuperAdmin]
 *     summary: Get audit logs
 *     description: Retrieves audit logs for super admin actions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of audit logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "log123"
 *                   action:
 *                     type: string
 *                     example: "Facility Created"
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-09-06T13:00:00Z"
 *                   userId:
 *                     type: string
 *                     example: "sa123"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a super admin)
 */
router.get("/audit-logs", SuperAdminController.getAuditLogs)

/**
 * @swagger
 * /api/superadmin/patients:
 *   get:
 *     tags: [SuperAdmin]
 *     summary: Get all patients
 *     description: Retrieves a list of all patients with pagination and filtering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *         description: Filter by region
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [male, female, other]
 *         description: Filter by gender
 *     responses:
 *       200:
 *         description: List of patients
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
 *                       faydaId:
 *                         type: string
 *                       user:
 *                         type: object
 *                         properties:
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           email:
 *                             type: string
 *                           phone:
 *                             type: string
 *                       region:
 *                         type: string
 *                       city:
 *                         type: string
 *                       gender:
 *                         type: string
 *                       dateOfBirth:
 *                         type: string
 *                         format: date-time
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a super admin)
 *       500:
 *         description: Internal server error
 */
router.get("/patients", SuperAdminController.getPatients)

// Region Admin Management
router.get("/regionadmins", SuperAdminController.getRegionAdmins)
router.post("/regionadmins", SuperAdminController.createRegionAdmin)
router.put("/regionadmins/:id", SuperAdminController.updateRegionAdmin)
router.delete("/regionadmins/:id", SuperAdminController.deleteRegionAdmin)
router.get("/regions/statistics", SuperAdminController.getRegionStatistics)

export default router