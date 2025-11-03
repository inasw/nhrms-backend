import express from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth';
import * as regionAdminController from '../controllers/regionAdminController';

const router = express.Router();

// All routes require region_admin role
router.use(authenticate);
router.use(authorizeRoles(['region_admin']));

// Dashboard
router.get('/dashboard', regionAdminController.getDashboardStats);

// Facilities (Hospitals/Clinics) Management
router.get('/facilities', regionAdminController.getFacilities);
router.post('/facilities', regionAdminController.createFacility);
router.put('/facilities/:id', regionAdminController.updateFacility);
router.delete('/facilities/:id', regionAdminController.deleteFacility);

// Pharmacy Management
router.get('/pharmacies', regionAdminController.getPharmacies);
router.post('/pharmacies', regionAdminController.createPharmacy);
router.put('/pharmacies/:id', regionAdminController.updatePharmacy);
router.delete('/pharmacies/:id', regionAdminController.deletePharmacy);

// Pharmacist Management
router.get('/pharmacists', regionAdminController.getPharmacists);
router.post('/pharmacists', regionAdminController.addPharmacist);

// Hospital Admin Management
router.get('/admins', regionAdminController.getHospitalAdmins);
router.post('/admins', regionAdminController.createHospitalAdmin);
router.put('/admins/:id', regionAdminController.updateHospitalAdmin);

// Activity Logs & Reports
router.get('/activity-logs', regionAdminController.getActivityLogs);
router.get('/reports', regionAdminController.generateReport);

export default router;