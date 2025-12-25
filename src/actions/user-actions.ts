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
        return { error: "未登录" }
    }

    const userRoleInfo = await db.query.users.findFirst({
        where: eq(users.id, session.user.id)
    })

    if (userRoleInfo?.role !== "ADMIN") {
        return { error: "无权限" }
    }

    if (userId === session.user.id) {
        return { error: "不能删除自己" }
    }

    try {
        await db.delete(users).where(eq(users.id, userId))
        revalidatePath("/users")
        return { success: true }
    } catch (err: any) {
        console.error(err)
        return { error: `删除失败: ${err.message || '未知数据库错误'}` }
    }
}

export async function resetUserPasswordAction(userId: string, newPassword: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "未登录" }

    if (!(await isAdmin())) {
        return { error: "无权限" }
    }

    if (!newPassword || newPassword.length < 6) {
        return { error: "密码长度至少为6位" }
    }

    try {
        const hashedPassword = await hashPassword(newPassword)
        await db.update(users)
            .set({ password: hashedPassword })
            .where(eq(users.id, userId))

        revalidatePath("/users")
        return { success: true }
    } catch (err) {
        console.error("[ResetPassword] Error:", err)
        return { error: "重置密码失败" }
    }
}

export async function updateUserNameAction(userId: string, name: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "未登录" }

    if (!(await isAdmin())) {
        return { error: "无权限" }
    }

    if (!name || name.trim().length === 0) {
        return { error: "昵称不能为空" }
    }

    try {
        await db.update(users)
            .set({ name: name.trim() })
            .where(eq(users.id, userId))

        revalidatePath("/users")
        return { success: true }
    } catch (err) {
        console.error("[UpdateUserName] Error:", err)
        return { error: "修改昵称失败" }
    }
}
