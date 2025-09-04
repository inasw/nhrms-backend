import swaggerJSDoc, { Options } from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options: Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My API Documentation",
      version: "1.0.0",
      description: "API documentation for NHRMS",
    },
    servers: [
      {
        url: "http://localhost:5000/api",
      },
    ],
  },
  apis: ["./src/routes/*.ts"], // or ./dist/routes/*.js in prod
};

const swaggerSpec = swaggerJSDoc(options);

export { swaggerUi, swaggerSpec };
