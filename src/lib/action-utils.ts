import { auth } from "@/auth"
import { Session } from "next-auth"

type ActionState = {
    error?: string
    success?: boolean
    [key: string]: any
}

type User = Session["user"]

/**
 * Wrapper for actions that require authentication
 */
export async function authenticatedAction<T extends ActionState>(
    action: (user: User, formData?: FormData) => Promise<T>,
    formData?: FormData
): Promise<T> {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "未登录" } as T
    }
    return action(session.user, formData)
}

/**
 * Wrapper for actions that require ADMIN role
 * Uses session-based role check for performance
 */
export async function adminAction<T extends ActionState>(
    action: (user: User, formData?: FormData) => Promise<T>,
    formData?: FormData
): Promise<T> {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "未登录" } as T
    }

    // Optimistic check using session claim
    if (session.user.role !== "ADMIN") {
        return { error: "无权限" } as T
    }

    return action(session.user, formData)
}
