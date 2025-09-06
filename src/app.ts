import express from "express"
import cors from "cors"
import helmet from "helmet"
import compression from "compression"
import { generalLimiter } from "./middleware/rateLimiter"
import { swaggerUi, swaggerSpec } from "./swagger";

// Import routes
import authRoutes from "./routes/auth"
import doctorRoutes from "./routes/doctor"
import patientRoutes from "./routes/patient"
import adminRoutes from "./routes/admin"
import superAdminRoutes from "./routes/superAdmin"
import labTechRoutes from "./routes/labTech"

const app = express()

// Security middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
)

// General middleware
app.use(compression())
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Rate limiting
// app.use(generalLimiter)

// swagger
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api/docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// API routes
app.use("/api/auth", authRoutes)
app.use("/api/doctor", doctorRoutes)
app.use("/api/patient", patientRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/superadmin", superAdminRoutes)
app.use("/api/labtech", labTechRoutes)


app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  })
})

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global error:", error)

  res.status(error.status || 500).json({
    success: false,
    error: error.message || "Internal server error",
  })
})

export default app
