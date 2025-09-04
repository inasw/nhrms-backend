import bcrypt from "bcryptjs"
import prisma from "../src/config/database" // adjust your import path

async function main() {
  const email = process.env.SUPERADMIN_EMAIL || "superadmin@moh.gov"
  const password = process.env.SUPERADMIN_PASSWORD || "ChangeMeNow_2025!"

  // check if already exists
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log("Superadmin already exists:", email)
    return
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: {
      nationalId: "MOH-ROOT-0001",
      firstName: "System",
      lastName: "Owner",
      email,
      phone: "+251000000000",
      password: hashedPassword,
      role: "super_admin", 
    },
  })

  // console.log("Superadmin seeded:", email)
}

main()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
