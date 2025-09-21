"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const doctorController_1 = require("../controllers/doctorController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, auth_1.requireDoctor);
router.get("/patients", doctorController_1.DoctorController.getPatients);
router.get("/patients/:id", doctorController_1.DoctorController.getPatientDetails);
router.get("/appointments", doctorController_1.DoctorController.getAppointments);
router.post("/appointments", (0, validation_1.validate)(validation_1.createAppointmentSchema), doctorController_1.DoctorController.createAppointment);
router.put("/appointments/:id", doctorController_1.DoctorController.updateAppointment);
router.post("/lab-requests", doctorController_1.DoctorController.createLabRequest);
router.post("/records", (0, validation_1.validate)(validation_1.createMedicalRecordSchema), doctorController_1.DoctorController.createMedicalRecord);
router.get("/stats", doctorController_1.DoctorController.getDashboardStats);
exports.default = router;
//# sourceMappingURL=doctor.js.map