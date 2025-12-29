import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/db"
import { eq } from "drizzle-orm"
import { users } from "@/db/schema"
import { verifyPassword } from "@/lib/hash"
import { z } from "zod"
import authConfig from "./auth.config"
import { logAudit } from "@/lib/audit-logger"

const signInSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6).optional(),
    skip2FAVerified: z.string().optional(), // Flag for 2FA verified login
})

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: DrizzleAdapter(db),
    session: { strategy: "jwt" }, // Credentials provider requires JWT strategy
    ...authConfig,
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                skip2FAVerified: { label: "Skip 2FA Verified", type: "text" },
            },
            authorize: async (credentials) => {
                const { email, password, skip2FAVerified } = await signInSchema.parseAsync(credentials)

                const user = await db.query.users.findFirst({
                    where: eq(users.email, email)
                })

                if (!user) {
                    // 记录登录失败（用户不存在）
                    await logAudit({
                        userId: null,
                        action: 'LOGIN_FAILED',
                        targetType: 'auth',
                        details: { email, reason: '用户不存在' },
                    })
                    return null
                }

                // If skip2FAVerified is set, this is a post-2FA login - skip password verification
                if (skip2FAVerified === "true") {
                    // 记录 2FA 登录成功
                    await logAudit({
                        userId: user.id,
                        action: 'LOGIN_SUCCESS',
                        targetType: 'auth',
                        targetId: user.id,
                        details: { email, with2FA: true },
                    })
                    return user
                }

                // Normal login flow - verify password
                if (!user.password || !password) {
                    await logAudit({
                        userId: null,
                        action: 'LOGIN_FAILED',
                        targetType: 'auth',
                        details: { email, reason: '用户不存在或无密码' },
                    })
                    return null
                }

                const isValid = await verifyPassword(password, user.password)

                if (!isValid) {
                    // 记录登录失败（密码错误）
                    await logAudit({
                        userId: user.id,
                        action: 'LOGIN_FAILED',
                        targetType: 'auth',
                        targetId: user.id,
                        details: { email, reason: '密码错误' },
                    })
                    return null
                }

                // 记录登录成功
                await logAudit({
                    userId: user.id,
                    action: 'LOGIN_SUCCESS',
                    targetType: 'auth',
                    targetId: user.id,
                    details: { email },
                })

                return user
            },
        }),
    ],
})
