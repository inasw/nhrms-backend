"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const swagger_1 = require("./swagger");
const auth_1 = __importDefault(require("./routes/auth"));
const doctor_1 = __importDefault(require("./routes/doctor"));
const patient_1 = __importDefault(require("./routes/patient"));
const admin_1 = __importDefault(require("./routes/admin"));
const superAdmin_1 = __importDefault(require("./routes/superAdmin"));
const labTech_1 = __importDefault(require("./routes/labTech"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/api/docs", swagger_1.swaggerUi.serve, swagger_1.swaggerUi.setup(swagger_1.swaggerSpec));
app.get("/api/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swagger_1.swaggerSpec);
});
app.use("/api/auth", auth_1.default);
app.use("/api/doctor", doctor_1.default);
app.use("/api/patient", patient_1.default);
app.use("/api/admin", admin_1.default);
app.use("/api/superadmin", superAdmin_1.default);
app.use("/api/labtech", labTech_1.default);
app.use("*", (req, res) => {
    res.status(404).json({
        success: false,
        error: "Route not found",
    });
});
app.use((error, req, res, next) => {
    console.error("Global error:", error);
    res.status(error.status || 500).json({
        success: false,
        error: error.message || "Internal server error",
    });
});
exports.default = app;
//# sourceMappingURL=app.js.map