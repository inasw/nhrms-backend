// import { Router } from "express"
// import { SuperAdminController } from "../controllers/superAdminController"
// import { authenticate, requireSuperAdmin } from "../middleware/auth"
// import { strictLimiter } from "../middleware/rateLimiter"

// const router = Router()

// // Apply authentication and super admin role check to all routes
// router.use(authenticate, requireSuperAdmin)

// // Apply strict rate limiting to sensitive operations
// router.use("/facilities", strictLimiter)
// router.use("/admins", strictLimiter)

// // Facility management
// router.get("/facilities", SuperAdminController.getFacilities)
// router.post("/facilities", SuperAdminController.registerFacility)
// router.get("/facilities/:id", SuperAdminController.getFacilityDetails)
// router.put("/facilities/:id", SuperAdminController.updateFacility)
// // router.patch("/facilities/:id/status", SuperAdminController.changeFacilityStatus)

// // Administrator management
// router.get("/admins", SuperAdminController.getFacilityAdmins)
// router.post("/admins", SuperAdminController.createFacilityAdmin)
// router.put("/admins/:id",SuperAdminController.updateFacilityAdmin)

// // Dashboard and reporting
// router.get("/dashboard/stats", SuperAdminController.getDashboardStats)
// router.get("/audit-logs", SuperAdminController.getAuditLogs)

// export default router


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

export default router