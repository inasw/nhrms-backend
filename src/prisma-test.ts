import prisma from "./config/database"

async function main() {
  try {
    console.log(" Connecting to MongoDB via Prisma...")
    await prisma.$connect()
    console.log(" Connected successfully")

    // Quick test: count users
    const count = await prisma.user.count()
    console.log(` User count: ${count}`)
  } catch (error) {
    console.error(" Prisma connection failed:", error)
  } finally {
    await prisma.$disconnect()
    console.log(" Disconnected")
  }
}

main()
