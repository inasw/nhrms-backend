import swaggerJSDoc, { Options } from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options: Options = {
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
  apis: ["./src/routes/auth.ts", "./src/routes/superAdmin.ts","./src/routes/admin.ts","./src/routes/doctor.ts","./src/routes/labTech.ts","./src/routes/patient.ts" ],
};

const swaggerSpec = swaggerJSDoc(options);

export { swaggerUi, swaggerSpec };