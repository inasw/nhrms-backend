"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const patientController_1 = require("../controllers/patientController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, auth_1.requirePatient);
router.post("/vitals", patientController_1.PatientController.submitVitals);
router.get("/vitals", patientController_1.PatientController.getVitals);
router.get("/vitals/latest", patientController_1.PatientController.getLatestVitals);
router.get("/appointments", patientController_1.PatientController.getAppointments);
router.post("/appointments", patientController_1.PatientController.requestAppointment);
router.get("/records", patientController_1.PatientController.getMedicalRecords);
router.get("/doctors", patientController_1.PatientController.searchDoctors);
router.get("/alerts", patientController_1.PatientController.getHealthAlerts);
exports.default = router;
//# sourceMappingURL=patient.js.map