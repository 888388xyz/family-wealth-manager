"use server"

import { db } from "@/db"
import { users, pending2FASessions } from "@/db/schema"
import { verifyPassword } from "@/lib/hash"
import { eq, lte } from "drizzle-orm"
import { loginLimiter } from "@/lib/rate-limiter"
import { signIn } from "@/auth"
import { logAudit } from "@/lib/audit-logger"
import { headers } from "next/headers"
import { AuthError } from "next-auth"
import { verifyTOTP } from "@/lib/totp"
import { logger } from "@/lib/logger"
import { PENDING_2FA_EXPIRY_MS } from "@/lib/constants"

export async function registerAction(_formData: FormData) {
    return { error: "注册功能已关闭，请联系管理员开通账号" }
}

/**
 * 获取客户端 IP 地址
 */
async function getClientIP(): Promise<string> {
    const headersList = await headers()
    // 尝试从各种头部获取真实 IP
    const forwardedFor = headersList.get("x-forwarded-for")
    if (forwardedFor) {
        return forwardedFor.split(",")[0].trim()
    }
    const realIP = headersList.get("x-real-ip")
    if (realIP) {
        return realIP
    }
    return "unknown"
}

/**
 * 带频率限制的登录操作
 * 支持两步验证流程
 */
export async function loginAction(formData: FormData): Promise<{
    success: boolean;
    error?: string;
    requires2FA?: boolean;
    sessionToken?: string;
}> {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!email || !password) {
        return { success: false, error: "请输入邮箱和密码" }
    }

    // 获取客户端 IP 用于频率限制
    const clientIP = await getClientIP()
    const rateLimitKey = `login:${clientIP}`

    // 检查频率限制
    const rateLimitResult = loginLimiter.check(rateLimitKey)
    if (!rateLimitResult) {
        // 记录频率限制触发
        await logAudit({
            userId: null,
            action: 'LOGIN_FAILED',
            targetType: 'auth',
            details: { email, reason: '登录尝试过于频繁', ip: clientIP },
        })
        return {
            success: false,
            error: "登录尝试过于频繁，请5分钟后再试"
        }
    }

    // 先检查用户是否存在并验证密码
    const user = await db.query.users.findFirst({
        where: eq(users.email, email)
    })

    if (!user || !user.password) {
        await logAudit({
            userId: null,
            action: 'LOGIN_FAILED',
            targetType: 'auth',
            details: { email, reason: '用户不存在或无密码' },
        })
        return { success: false, error: "邮箱或密码错误" }
    }

    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
        await logAudit({
            userId: user.id,
            action: 'LOGIN_FAILED',
            targetType: 'auth',
            targetId: user.id,
            details: { email, reason: '密码错误' },
        })
        return { success: false, error: "邮箱或密码错误" }
    }

    // 检查是否启用了 2FA
    if (user.twoFactorEnabled && user.twoFactorSecret) {
        // 生成随机 UUID 作为 session token，不包含任何敏感信息
        const sessionToken = crypto.randomUUID()
        const expiresAt = new Date(Date.now() + PENDING_2FA_EXPIRY_MS)

        // 存储到数据库
        await db.insert(pending2FASessions).values({
            userId: user.id,
            token: sessionToken,
            expiresAt,
        })

        await logAudit({
            userId: user.id,
            action: 'LOGIN_2FA_REQUIRED',
            targetType: 'auth',
            targetId: user.id,
            details: { email },
        })

        return {
            success: false,
            requires2FA: true,
            sessionToken
        }
    }

    try {
        // 尝试登录（无 2FA）
        await signIn("credentials", {
            email,
            password,
            redirect: false,
        })

        // 登录成功，重置频率限制计数
        loginLimiter.reset(rateLimitKey)

        return { success: true }
    } catch (error) {
        if (error instanceof AuthError) {
            // 登录失败（凭证错误等）
            return { success: false, error: "邮箱或密码错误" }
        }
        // 其他错误
        throw error
    }
}

/**
 * 验证 TOTP 码并完成登录
 */
export async function verifyTOTPAction(
    sessionToken: string,
    totpCode: string
): Promise<{ success: boolean; error?: string }> {
    if (!sessionToken || !totpCode) {
        return { success: false, error: "请输入验证码" }
    }

    // 验证码格式检查
    if (!/^\d{6}$/.test(totpCode)) {
        return { success: false, error: "验证码必须是6位数字" }
    }

    // 获取客户端 IP 用于频率限制
    const clientIP = await getClientIP()
    const rateLimitKey = `login:${clientIP}`

    // 检查频率限制
    const rateLimitResult = loginLimiter.check(rateLimitKey)
    if (!rateLimitResult) {
        return {
            success: false,
            error: "验证尝试过于频繁，请5分钟后再试"
        }
    }

    try {
        // 清理过期的 pending sessions
        await db.delete(pending2FASessions)
            .where(lte(pending2FASessions.expiresAt, new Date()))

        // 从数据库查询 pending session
        const pendingSession = await db.query.pending2FASessions.findFirst({
            where: eq(pending2FASessions.token, sessionToken)
        })

        if (!pendingSession) {
            return { success: false, error: "验证会话不存在或已过期" }
        }

        // 检查是否过期
        if (new Date() > pendingSession.expiresAt) {
            await db.delete(pending2FASessions)
                .where(eq(pending2FASessions.id, pendingSession.id))
            return { success: false, error: "验证已过期，请重新登录" }
        }

        // 获取用户信息
        const user = await db.query.users.findFirst({
            where: eq(users.id, pendingSession.userId)
        })

        if (!user || !user.twoFactorSecret) {
            // 删除无效的 pending session
            await db.delete(pending2FASessions)
                .where(eq(pending2FASessions.id, pendingSession.id))
            return { success: false, error: "验证失败" }
        }

        // 验证 TOTP 码
        const isValidTOTP = verifyTOTP(user.twoFactorSecret, totpCode)
        if (!isValidTOTP) {
            await logAudit({
                userId: user.id,
                action: 'LOGIN_2FA_FAILED',
                targetType: 'auth',
                targetId: user.id,
                details: { email: user.email, reason: 'TOTP验证码错误' },
            })
            return { success: false, error: "验证码错误，请重试" }
        }

        // 删除 pending session（一次性使用）
        await db.delete(pending2FASessions)
            .where(eq(pending2FASessions.id, pendingSession.id))

        // TOTP 验证通过，使用 skip2FAVerified 标志完成登录
        await signIn("credentials", {
            email: user.email,
            skip2FAVerified: "true",
            redirect: false,
        })

        // 登录成功，重置频率限制计数
        loginLimiter.reset(rateLimitKey)

        return { success: true }
    } catch (error) {
        if (error instanceof AuthError) {
            return { success: false, error: "登录失败" }
        }
        logger.error('2FA verification error', error instanceof Error ? error : new Error(String(error)))
        return { success: false, error: "验证失败，请重试" }
    }
}
