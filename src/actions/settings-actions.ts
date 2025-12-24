"use server"

import { db } from "@/db"
import { users } from "@/db/schema"
import { auth } from "@/auth"
import { hashPassword, verifyPassword } from "@/lib/hash"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function updateProfileAction(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "未登录" }
    }

    const name = formData.get("name") as string
    if (!name || name.trim().length === 0) {
        return { error: "昵称不能为空" }
    }

    await db.update(users)
        .set({ name: name.trim() })
        .where(eq(users.id, session.user.id))

    revalidatePath("/settings")
    return { success: true }
}

export async function changePasswordAction(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "未登录" }
    }

    const currentPassword = formData.get("currentPassword") as string
    const newPassword = formData.get("newPassword") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (!currentPassword || !newPassword || !confirmPassword) {
        return { error: "请填写所有字段" }
    }

    if (newPassword !== confirmPassword) {
        return { error: "两次输入的新密码不一致" }
    }

    if (newPassword.length < 6) {
        return { error: "新密码长度至少为6位" }
    }

    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id)
    })

    if (!user?.password) {
        return { error: "用户不存在或无法验证" }
    }

    const isValid = await verifyPassword(currentPassword, user.password)
    if (!isValid) {
        return { error: "当前密码错误" }
    }

    const hashedPassword = await hashPassword(newPassword)
    await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, session.user.id))

    return { success: true }
}

export async function getCurrentUserAction() {
    const session = await auth()
    if (!session?.user?.id) {
        return null
    }

    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id)
    })

    if (!user) return null

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    }
}
