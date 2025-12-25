// Create admin user script
// Run with: npx tsx scripts/create-admin.ts

import { db } from "../src/db"
import { users } from "../src/db/schema"
import { hash } from "bcryptjs"

async function createAdmin() {
    const email = "admin@test.com"
    const password = "123456"
    
    console.log("Creating admin user...")
    
    const hashedPassword = await hash(password, 12)
    
    try {
        await db.insert(users).values({
            email,
            name: "Admin",
            password: hashedPassword,
            role: "ADMIN",
        })
        
        console.log("\n✅ Admin user created!")
        console.log(`   Email: ${email}`)
        console.log(`   Password: ${password}`)
    } catch (err: any) {
        if (err.message?.includes("UNIQUE constraint")) {
            console.log("Admin user already exists!")
        } else {
            throw err
        }
    }
    
    process.exit(0)
}

createAdmin().catch(console.error)
