"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const labTechController_1 = require("../controllers/labTechController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get("/patients/search", labTechController_1.LabTechController.searchPatient);
router.get("/lab-requests", labTechController_1.LabTechController.getLabRequests);
router.put("/lab-requests/:id", labTechController_1.LabTechController.updateLabRequest);
exports.default = router;
//# sourceMappingURL=labTech.js.map