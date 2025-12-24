"use server"

import { db } from "@/db"
import { auth } from "@/auth"

// Only ADMIN can see all members. Members can only see basic info? 
// For now, let's assume Members page is for ADMIN to manage others, 
// OR for everyone to see who is in the family.

export async function getMembersAction() {
    const session = await auth()
    if (!session?.user) return null

    // In a real app, check role: if (session.user.role !== 'ADMIN') ...

    const allUsers = await db.query.users.findMany({
        columns: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
            createdAt: true
        }
    })

    return allUsers
}
