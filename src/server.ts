import app from "./app"
import prisma from "./config/database"

const PORT = process.env.PORT || 5001

// Database connection test
async function connectDatabase() {
  try {
    await prisma.$connect()
    console.log("Database connected successfully")
  } catch (error) {
    console.error("Database connection failed:", error)
    process.exit(1)
  }
}

// Graceful shutdown
async function gracefulShutdown() {
  console.log("Shutting down gracefully...")

  try {
    await prisma.$disconnect()
    console.log("Database disconnected")
    process.exit(0)
  } catch (error) {
    console.error(" Error during shutdown:", error)
    process.exit(1)
  }
}

// Start server
async function startServer() {
  await connectDatabase()

  const server = app.listen(PORT, () => {
    console.log(` NHRMS API Server running on port ${PORT}`)
    
  })

  // Handle shutdown signals
  process.on("SIGTERM", gracefulShutdown)
  process.on("SIGINT", gracefulShutdown)

  return server
}

// Start the application
startServer().catch((error) => {
  console.error(" Failed to start server:", error)
  process.exit(1)
})
