"use server"

import { db } from "@/db"
import { users } from "@/db/schema"
import { auth } from "@/auth"
import { hashPassword, verifyPassword } from "@/lib/hash"
import { generateSecret, generateQRCodeUrl, verifyTOTP } from "@/lib/totp"
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


// 临时存储 2FA secret（在验证前）
// 注意：生产环境应使用 Redis 或数据库临时存储
const pendingSecrets = new Map<string, { secret: string; expiresAt: number }>()

/**
 * 生成 2FA secret 和 QR 码 URL
 * 用于用户启用 2FA 时显示 QR 码
 */
export async function generate2FASecretAction(): Promise<{
    secret: string
    qrCodeUrl: string
} | { error: string }> {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "未登录" }
    }

    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id)
    })

    if (!user) {
        return { error: "用户不存在" }
    }

    if (user.twoFactorEnabled) {
        return { error: "两步验证已启用" }
    }

    const secret = generateSecret()
    const qrCodeUrl = generateQRCodeUrl(secret, user.email)

    // 临时存储 secret，5分钟后过期
    pendingSecrets.set(session.user.id, {
        secret,
        expiresAt: Date.now() + 5 * 60 * 1000
    })

    return { secret, qrCodeUrl }
}

/**
 * 验证 TOTP 码并启用 2FA
 * @param code 用户输入的 6 位验证码
 */
export async function enable2FAAction(code: string): Promise<{
    success: boolean
} | { error: string }> {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "未登录" }
    }

    // 验证码格式检查
    if (!code || !/^\d{6}$/.test(code)) {
        return { error: "验证码必须是6位数字" }
    }

    const pending = pendingSecrets.get(session.user.id)
    if (!pending) {
        return { error: "请先生成 QR 码" }
    }

    if (Date.now() > pending.expiresAt) {
        pendingSecrets.delete(session.user.id)
        return { error: "设置超时，请重新开始" }
    }

    const isValid = verifyTOTP(pending.secret, code)
    if (!isValid) {
        return { error: "验证码错误，请重试" }
    }

    // 验证通过，保存 secret 并启用 2FA
    await db.update(users)
        .set({
            twoFactorSecret: pending.secret,
            twoFactorEnabled: true
        })
        .where(eq(users.id, session.user.id))

    // 清除临时存储
    pendingSecrets.delete(session.user.id)

    revalidatePath("/settings")
    return { success: true }
}

/**
 * 禁用 2FA
 * @param password 用户当前密码（用于确认身份）
 */
export async function disable2FAAction(password: string): Promise<{
    success: boolean
} | { error: string }> {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "未登录" }
    }

    if (!password) {
        return { error: "请输入密码" }
    }

    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id)
    })

    if (!user || !user.password) {
        return { error: "用户不存在或无法验证" }
    }

    if (!user.twoFactorEnabled) {
        return { error: "两步验证未启用" }
    }

    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
        return { error: "密码错误" }
    }

    // 禁用 2FA
    await db.update(users)
        .set({
            twoFactorSecret: null,
            twoFactorEnabled: false
        })
        .where(eq(users.id, session.user.id))

    revalidatePath("/settings")
    return { success: true }
}

/**
 * 获取当前用户的 2FA 状态
 */
export async function get2FAStatusAction(): Promise<{
    enabled: boolean
}> {
    const session = await auth()
    if (!session?.user?.id) {
        return { enabled: false }
    }

    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: {
            twoFactorEnabled: true
        }
    })

    return { enabled: user?.twoFactorEnabled ?? false }
}
