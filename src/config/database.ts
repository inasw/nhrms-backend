import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
  errorFormat: 'pretty',
})

// Test database connection
prisma.$connect()
  .then(() => {
    console.log('✅ Database connected successfully')
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error)
    console.error('Please check your DATABASE_URL and internet connection')
  })

export default prisma
