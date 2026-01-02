"use server"

import { db } from "@/db"
import { assetGoals } from "@/db/schema"
import { auth } from "@/auth"
import { eq, and, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { validateUUID } from "@/lib/validators"

// 获取当前用户的所有目标
export async function getGoalsAction() {
    const session = await auth()
    if (!session?.user?.id) return []

    const goals = await db.query.assetGoals.findMany({
        where: eq(assetGoals.userId, session.user.id),
        orderBy: [desc(assetGoals.createdAt)],
    })

    return goals
}

// 创建新目标
export async function createGoalAction(data: {
    name: string
    targetAmount: number  // 单位：元
    currency?: string
    deadline?: string
    category?: string
    notes?: string
}) {
    const session = await auth()
    if (!session?.user?.id) return { error: "未登录" }

    const goal = await db.insert(assetGoals).values({
        userId: session.user.id,
        name: data.name,
        targetAmount: Math.round(data.targetAmount * 100), // 转换为分
        currentAmount: 0,
        currency: data.currency || "CNY",
        deadline: data.deadline || null,
        category: data.category || null,
        notes: data.notes || null,
    }).returning()

    revalidatePath("/goals")
    revalidatePath("/dashboard")
    return { success: true, goal: goal[0] }
}

// 更新目标
export async function updateGoalAction(id: string, data: {
    name?: string
    targetAmount?: number
    currentAmount?: number
    currency?: string
    deadline?: string | null
    category?: string | null
    notes?: string | null
    isCompleted?: boolean
}) {
    const session = await auth()
    if (!session?.user?.id) return { error: "未登录" }
    if (!validateUUID(id)) return { error: "无效的目标ID" }

    // 验证目标属于当前用户
    const existing = await db.query.assetGoals.findFirst({
        where: and(eq(assetGoals.id, id), eq(assetGoals.userId, session.user.id)),
    })
    if (!existing) return { error: "目标不存在" }

    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.targetAmount !== undefined) updateData.targetAmount = Math.round(data.targetAmount * 100)
    if (data.currentAmount !== undefined) updateData.currentAmount = Math.round(data.currentAmount * 100)
    if (data.currency !== undefined) updateData.currency = data.currency
    if (data.deadline !== undefined) updateData.deadline = data.deadline
    if (data.category !== undefined) updateData.category = data.category
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.isCompleted !== undefined) updateData.isCompleted = data.isCompleted

    await db.update(assetGoals).set(updateData).where(eq(assetGoals.id, id))

    revalidatePath("/goals")
    revalidatePath("/dashboard")
    return { success: true }
}

// 删除目标
export async function deleteGoalAction(id: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "未登录" }
    if (!validateUUID(id)) return { error: "无效的目标ID" }

    // 验证目标属于当前用户
    const existing = await db.query.assetGoals.findFirst({
        where: and(eq(assetGoals.id, id), eq(assetGoals.userId, session.user.id)),
    })
    if (!existing) return { error: "目标不存在" }

    await db.delete(assetGoals).where(eq(assetGoals.id, id))

    revalidatePath("/goals")
    revalidatePath("/dashboard")
    return { success: true }
}

// 获取目标摘要（用于仪表面板）
export async function getGoalsSummaryAction() {
    const session = await auth()
    if (!session?.user?.id) return null

    const goals = await db.query.assetGoals.findMany({
        where: and(
            eq(assetGoals.userId, session.user.id),
            eq(assetGoals.isCompleted, false)
        ),
        orderBy: [desc(assetGoals.createdAt)],
    })

    const total = goals.length
    const totalTarget = goals.reduce((sum, g) => sum + (g.targetAmount || 0), 0)
    const totalCurrent = goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0)
    const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0

    return {
        total,
        totalTarget,
        totalCurrent,
        overallProgress,
        goals: goals.slice(0, 3), // 只返回前3个用于展示
    }
}
