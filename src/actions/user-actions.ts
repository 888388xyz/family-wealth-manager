"use server"

import { db } from "@/db"
import { users } from "@/db/schema"
import { auth } from "@/auth"
import { eq, ne } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { hashPassword } from "@/lib/hash"

// Check if current user is admin
async function isAdmin() {
    const session = await auth()
    if (!session?.user?.id) return false

    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id)
    })

    return user?.role === "ADMIN"
}

export async function createUserAction(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { error: "未登录" }

    if (!(await isAdmin())) {
        return { error: "无权限" }
    }

    const email = formData.get("email") as string
    const name = formData.get("name") as string
    const password = formData.get("password") as string
    const role = formData.get("role") as "ADMIN" | "MEMBER"

    if (!email || !password || !role) {
        return { error: "缺少必填项" }
    }

    try {
        const existing = await db.query.users.findFirst({
            where: eq(users.email, email)
        })

        if (existing) {
            return { error: "邮箱已存在" }
        }

        const hashedPassword = await hashPassword(password)

        await db.insert(users).values({
            email,
            name: name || email.split("@")[0],
            password: hashedPassword,
            role,
        })

        revalidatePath("/users")
        return { success: true }
    } catch (err) {
        console.error("[CreateUser] Error:", err)
        return { error: "创建用户失败" }
    }
}

export async function getUsersAction() {
    const session = await auth()
    if (!session?.user?.id) return null

    if (!(await isAdmin())) {
        return null
    }

    const allUsers = await db.query.users.findMany({
        columns: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
        },
        orderBy: (users, { desc }) => [desc(users.createdAt)]
    })

    return allUsers
}

export async function updateUserRoleAction(userId: string, role: "ADMIN" | "MEMBER") {
    const session = await auth()
    if (!session?.user?.id) return { error: "未登录" }

    if (!(await isAdmin())) {
        return { error: "无权限" }
    }

    // Can't change own role
    if (userId === session.user.id) {
        return { error: "不能修改自己的角色" }
    }

    await db.update(users)
        .set({ role })
        .where(eq(users.id, userId))

    revalidatePath("/users")
    return { success: true }
}

export async function deleteUserAction(userId: string) {
    const session = await auth()
    if (!session?.user?.id) {
        console.error("[DeleteUser] No session user found")
        return { error: "未登录" }
    }

    console.log(`[DeleteUser] User ${session.user.id} (${session.user.email}) attempting to delete target user ${userId}`)

    const userRoleInfo = await db.query.users.findFirst({
        where: eq(users.id, session.user.id)
    })

    console.log(`[DeleteUser] Current user role from DB: ${userRoleInfo?.role}`)

    if (userRoleInfo?.role !== "ADMIN") {
        console.warn(`[DeleteUser] Permission denied: user is not an admin`)
        return { error: "无权限" }
    }

    // Can't delete self
    if (userId === session.user.id) {
        console.warn(`[DeleteUser] Prevention: user attempted to delete themselves`)
        return { error: "不能删除自己" }
    }

    try {
        console.log(`[DeleteUser] Executing DB delete for user ${userId}...`)
        const result = await db.delete(users).where(eq(users.id, userId))
        console.log(`[DeleteUser] DB delete result:`, result)

        console.log(`[DeleteUser] Successfully deleted user ${userId}, revalidating path /users`)
        revalidatePath("/users")
        return { success: true }
    } catch (err: any) {
        console.error(`[DeleteUser] CRITICAL ERROR deleting user ${userId}:`, err)
        return { error: `删除失败: ${err.message || '未知数据库错误'}` }
    }
}
