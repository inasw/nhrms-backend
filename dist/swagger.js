"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = exports.swaggerUi = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
exports.swaggerUi = swagger_ui_express_1.default;
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "NHRMS API Documentation",
            version: "1.0.0",
            description: "API documentation for the National Healthcare Resource Management System (NHRMS)",
        },
        servers: [
            {
                url: "http://localhost:5000/api",
                description: "Development server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
        tags: [
            { name: "Auth", description: "Authentication and authorization endpoints" },
            { name: "SuperAdmin", description: "Super admin management endpoints" },
        ],
    },
    apis: ["./src/routes/auth.ts", "./src/routes/superAdmin.ts", "./src/routes/admin.ts", "./src/routes/doctor.ts", "./src/routes/labTech.ts", "./src/routes/patient.ts"],
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
exports.swaggerSpec = swaggerSpec;
//# sourceMappingURL=swagger.js.map