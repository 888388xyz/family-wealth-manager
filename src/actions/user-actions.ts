"use server"

import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { hashPassword } from "@/lib/hash"
import { logAudit } from "@/lib/audit-logger"
import { adminAction } from "@/lib/action-utils"
import { validatePassword } from "@/lib/password-validator"
import { validateRole, validateUUID } from "@/lib/validators"

export async function createUserAction(formData: FormData) {
    return adminAction(async (sessionUser) => {
        const email = formData.get("email") as string
        const name = formData.get("name") as string
        const password = formData.get("password") as string
        const role = formData.get("role") as "ADMIN" | "MEMBER"

        if (!email || !password || !role) {
            return { error: "缺少必填项" }
        }

        // 使用密码验证器检查密码策略
        const passwordValidation = validatePassword(password)
        if (!passwordValidation.isValid) {
            return { error: passwordValidation.errors.join('；') }
        }

        try {
            const existing = await db.query.users.findFirst({
                where: eq(users.email, email)
            })

            if (existing) {
                return { error: "邮箱已存在" }
            }

            const hashedPassword = await hashPassword(password)

            const [newUser] = await db.insert(users).values({
                email,
                name: name || email.split("@")[0],
                password: hashedPassword,
                role,
            }).returning()

            // 记录审计日志
            await logAudit({
                userId: sessionUser.id!,
                action: 'USER_CREATE',
                targetType: 'user',
                targetId: newUser.id,
                details: {
                    email,
                    name: name || email.split("@")[0],
                    role,
                },
            })

            revalidatePath("/users")
            return { success: true }
        } catch (err) {
            console.error("[CreateUser] Error:", err)
            return { error: "创建用户失败" }
        }
    })
}

export async function getUsersAction() {
    // Note: adminAction automatically returns { error } if check fails, 
    // but this function needs to return null or array.
    // We'll trust the caller handles null, or slight behavior change is acceptable.
    // However, to match exact return type signature:
    return adminAction(async () => {
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
    }).catch(() => null)
}

export async function updateUserRoleAction(userId: string, role: "ADMIN" | "MEMBER") {
    return adminAction(async (sessionUser) => {
        // 验证角色参数
        if (!validateRole(role)) {
            return { error: "无效的角色" }
        }

        // Can't change own role
        if (userId === sessionUser.id) {
            return { error: "不能修改自己的角色" }
        }

        // 获取目标用户信息
        const targetUser = await db.query.users.findFirst({
            where: eq(users.id, userId)
        })

        await db.update(users)
            .set({ role })
            .where(eq(users.id, userId))

        // 记录审计日志
        await logAudit({
            userId: sessionUser.id!,
            action: 'USER_ROLE_UPDATE',
            targetType: 'user',
            targetId: userId,
            details: {
                email: targetUser?.email,
                oldRole: targetUser?.role,
                newRole: role,
            },
        })

        revalidatePath("/users")
        return { success: true }
    })
}

export async function deleteUserAction(userId: string) {
    return adminAction(async (sessionUser) => {
        // 验证 userId 格式
        if (!validateUUID(userId)) {
            return { error: "无效的用户 ID 格式" }
        }

        if (userId === sessionUser.id) {
            return { error: "不能删除自己" }
        }

        // 获取目标用户信息
        const targetUser = await db.query.users.findFirst({
            where: eq(users.id, userId)
        })

        try {
            await db.delete(users).where(eq(users.id, userId))

            // 记录审计日志
            await logAudit({
                userId: sessionUser.id!,
                action: 'USER_DELETE',
                targetType: 'user',
                targetId: userId,
                details: {
                    email: targetUser?.email,
                    name: targetUser?.name,
                    role: targetUser?.role,
                },
            })

            revalidatePath("/users")
            return { success: true }
        } catch (err: any) {
            console.error(err)
            return { error: `删除失败: ${err.message || '未知数据库错误'}` }
        }
    })
}

export async function resetUserPasswordAction(userId: string, newPassword: string) {
    return adminAction(async (sessionUser) => {
        // 使用密码验证器检查密码策略
        const passwordValidation = validatePassword(newPassword)
        if (!passwordValidation.isValid) {
            return { error: passwordValidation.errors.join('；') }
        }

        // 获取目标用户信息
        const targetUser = await db.query.users.findFirst({
            where: eq(users.id, userId)
        })

        try {
            const hashedPassword = await hashPassword(newPassword)
            await db.update(users)
                .set({ password: hashedPassword })
                .where(eq(users.id, userId))

            // 记录审计日志
            await logAudit({
                userId: sessionUser.id!,
                action: 'PASSWORD_RESET',
                targetType: 'user',
                targetId: userId,
                details: {
                    email: targetUser?.email,
                    resetBy: 'admin',
                },
            })

            revalidatePath("/users")
            return { success: true }
        } catch (err) {
            console.error("[ResetPassword] Error:", err)
            return { error: "重置密码失败" }
        }
    })
}

export async function updateUserNameAction(userId: string, name: string) {
    return adminAction(async (sessionUser) => {
        if (!name || name.trim().length === 0) {
            return { error: "昵称不能为空" }
        }

        // 获取目标用户信息
        const targetUser = await db.query.users.findFirst({
            where: eq(users.id, userId)
        })

        try {
            await db.update(users)
                .set({ name: name.trim() })
                .where(eq(users.id, userId))

            // 记录审计日志
            await logAudit({
                userId: sessionUser.id!,
                action: 'USER_NAME_UPDATE',
                targetType: 'user',
                targetId: userId,
                details: {
                    email: targetUser?.email,
                    oldName: targetUser?.name,
                    newName: name.trim(),
                },
            })

            revalidatePath("/users")
            return { success: true }
        } catch (err) {
            console.error("[UpdateUserName] Error:", err)
            return { error: "修改昵称失败" }
        }
    })
}
