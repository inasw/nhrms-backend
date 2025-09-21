"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.post("/login", (0, validation_1.validate)(validation_1.loginSchema), authController_1.AuthController.login);
router.post("/register/patient", (0, validation_1.validate)(validation_1.registerPatientSchema), authController_1.AuthController.registerPatient);
router.post("/register/doctor", authController_1.AuthController.registerDoctor);
router.post("/refresh", authController_1.AuthController.refreshToken);
router.post("/logout", authController_1.AuthController.logout);
exports.default = router;
//# sourceMappingURL=auth.js.map