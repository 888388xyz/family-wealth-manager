"use server"

import { db } from "@/db"
import { users } from "@/db/schema"
import { hashPassword, verifyPassword } from "@/lib/hash"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { loginLimiter } from "@/lib/rate-limiter"
import { signIn } from "@/auth"
import { logAudit } from "@/lib/audit-logger"
import { headers } from "next/headers"
import { AuthError } from "next-auth"

export async function registerAction(formData: FormData) {
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
 */
export async function loginAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
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

    try {
        // 尝试登录
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
