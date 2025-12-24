"use server"

import { db } from "@/db"
import { users } from "@/db/schema"
import { hashPassword } from "@/lib/hash"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"

export async function registerAction(formData: FormData) {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!email || !password) return { error: "Missing fields" }

    const existing = await db.query.users.findFirst({
        where: eq(users.email, email)
    })

    if (existing) {
        return { error: "User already exists" }
    }

    const hashedPassword = await hashPassword(password)

    await db.insert(users).values({
        email,
        password: hashedPassword,
        name: email.split("@")[0], // Default name
    })

    redirect("/login")
}
