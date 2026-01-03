"use server"

import { db } from "@/db"
import { notifications, users, bankAccounts } from "@/db/schema"
import { auth } from "@/auth"
import { eq, desc, and, sql, isNotNull, lte, gte, inArray } from "drizzle-orm"
import { sendEmail } from "@/lib/brevo-utils"
import { logger } from "@/lib/logger"

export interface Notification {
    id: string
    userId: string
    type: string
    title: string
    content: string
    isRead: boolean | null
    createdAt: Date | null
}

export interface CreateNotificationData {
    userId: string
    type: 'BALANCE_CHANGE' | 'MATURITY_REMINDER' | 'SYSTEM'
    title: string
    content: string
}

// 创建通知
export async function createNotificationAction(
    data: CreateNotificationData
): Promise<{ success: boolean; error?: string }> {
    // 安全检查：验证调用者身份
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: "未登录" }
    }

    // 权限检查：只能为自己创建通知，除非是管理员
    if (data.userId !== session.user.id) {
        const currentUser = await db.query.users.findFirst({
            where: eq(users.id, session.user.id)
        })
        if (currentUser?.role !== "ADMIN") {
            return { success: false, error: "无权为其他用户创建通知" }
        }
    }

    try {
        // 插入通知到数据库
        await db.insert(notifications).values({
            userId: data.userId,
            type: data.type,
            title: data.title,
            content: data.content,
            isRead: false,
        })

        // 发送邮件通知
        const user = await db.query.users.findFirst({
            where: eq(users.id, data.userId)
        })

        if (user?.email) {
            await sendEmail({
                to: user.email,
                subject: data.title,
                textContent: data.content
            })
        }

        return { success: true }
    } catch (error) {
        logger.error("Failed to create notification", error instanceof Error ? error : new Error(String(error)))
        return { success: false, error: "创建通知失败" }
    }
}

// 获取当前用户的通知列表
export async function getNotificationsAction(
    limit: number = 20
): Promise<Notification[] | null> {
    const session = await auth()
    if (!session?.user?.id) return null

    const result = await db.query.notifications.findMany({
        where: eq(notifications.userId, session.user.id),
        orderBy: [desc(notifications.createdAt)],
        limit: limit,
    })

    return result as Notification[]
}


// 获取未读通知列表
export async function getUnreadNotificationsAction(): Promise<Notification[] | null> {
    const session = await auth()
    if (!session?.user?.id) return null

    const result = await db.query.notifications.findMany({
        where: and(
            eq(notifications.userId, session.user.id),
            eq(notifications.isRead, false)
        ),
        orderBy: [desc(notifications.createdAt)],
    })

    return result as Notification[]
}

// 获取未读通知数量
export async function getUnreadCountAction(): Promise<number> {
    const session = await auth()
    if (!session?.user?.id) return 0

    const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(
            eq(notifications.userId, session.user.id),
            eq(notifications.isRead, false)
        ))

    return Number(result[0]?.count || 0)
}

// 标记单条通知为已读
export async function markAsReadAction(
    notificationId: string
): Promise<{ success: boolean; error?: string }> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: "未登录" }
    }

    try {
        // 验证通知属于当前用户
        const notification = await db.query.notifications.findFirst({
            where: eq(notifications.id, notificationId),
        })

        if (!notification) {
            return { success: false, error: "通知不存在" }
        }

        if (notification.userId !== session.user.id) {
            return { success: false, error: "无权操作此通知" }
        }

        await db
            .update(notifications)
            .set({ isRead: true })
            .where(eq(notifications.id, notificationId))

        return { success: true }
    } catch (error) {
        logger.error("Failed to mark notification as read", error instanceof Error ? error : new Error(String(error)))
        return { success: false, error: "操作失败" }
    }
}

// 标记所有通知为已读
export async function markAllAsReadAction(): Promise<{ success: boolean; error?: string }> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: "未登录" }
    }

    try {
        await db
            .update(notifications)
            .set({ isRead: true })
            .where(and(
                eq(notifications.userId, session.user.id),
                eq(notifications.isRead, false)
            ))

        return { success: true }
    } catch (error) {
        logger.error("Failed to mark all notifications as read", error instanceof Error ? error : new Error(String(error)))
        return { success: false, error: "操作失败" }
    }
}


// 检查即将到期的账户并发送提醒
export async function checkMaturityRemindersAction(): Promise<{
    success: boolean
    remindersCreated: number
    error?: string
}> {
    try {
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]

        // 计算7天后和1天后的日期
        const sevenDaysLater = new Date(today)
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)
        const sevenDaysLaterStr = sevenDaysLater.toISOString().split('T')[0]

        const oneDayLater = new Date(today)
        oneDayLater.setDate(oneDayLater.getDate() + 1)
        const oneDayLaterStr = oneDayLater.toISOString().split('T')[0]

        // 查找所有设置了到期日期的账户，并包含用户信息
        const accountsWithMaturity = await db.query.bankAccounts.findMany({
            where: isNotNull(bankAccounts.maturityDate),
            with: {
                user: true
            }
        })

        let remindersCreated = 0

        for (const account of accountsWithMaturity) {
            if (!account.maturityDate) continue

            const maturityDateStr = account.maturityDate
            const maturityDate = new Date(maturityDateStr)

            // 计算距离到期还有多少天
            const diffTime = maturityDate.getTime() - today.getTime()
            const daysUntilMaturity = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            // 只提醒 7 天内到期的账户（包括已过期的）
            if (daysUntilMaturity > 7 || daysUntilMaturity < 0) continue

            // 检查是否已经发送过相同类型的提醒
            const existingReminder = await db.query.notifications.findFirst({
                where: and(
                    eq(notifications.userId, account.userId),
                    eq(notifications.type, 'MATURITY_REMINDER'),
                    sql`${notifications.content} LIKE ${`%${account.id}%`}`,
                    sql`DATE(${notifications.createdAt}) = ${todayStr}`
                ),
            })

            if (existingReminder) continue

            // 格式化余额显示
            const balanceDisplay = (account.balance / 100).toLocaleString('zh-CN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })

            // 格式化到期日期
            const maturityDateDisplay = maturityDate.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            })

            let title: string
            let content: string

            if (daysUntilMaturity === 0) {
                title = `【今日到期】${account.accountName}`
                content = `您的理财产品"${account.accountName}"（${account.bankName}）今日到期，当前余额 ¥${balanceDisplay}，请及时处理。[账户ID:${account.id}]`
            } else if (daysUntilMaturity === 1) {
                title = `【明日到期】${account.accountName}`
                content = `您的理财产品"${account.accountName}"（${account.bankName}）将于明日（${maturityDateDisplay}）到期，当前余额 ¥${balanceDisplay}，请提前做好准备。[账户ID:${account.id}]`
            } else {
                title = `【${daysUntilMaturity}天后到期】${account.accountName}`
                content = `您的理财产品"${account.accountName}"（${account.bankName}）将于${daysUntilMaturity}天后（${maturityDateDisplay}）到期，当前余额 ¥${balanceDisplay}，请提前规划。[账户ID:${account.id}]`
            }

            await db.insert(notifications).values({
                userId: account.userId,
                type: 'MATURITY_REMINDER',
                title,
                content,
                isRead: false,
            })

            // 发送邮件提醒
            if (account.user?.email) {
                await sendEmail({
                    to: account.user.email,
                    subject: title,
                    textContent: content
                })
            }

            remindersCreated++
        }

        return { success: true, remindersCreated }
    } catch (error) {
        logger.error("Failed to check maturity reminders", error instanceof Error ? error : new Error(String(error)))
        return { success: false, remindersCreated: 0, error: "检查到期提醒失败" }
    }
}

// 获取用户即将到期的账户列表
export async function getUpcomingMaturitiesAction(
    daysAhead: number = 30
): Promise<Array<{
    id: string
    accountName: string
    bankName: string
    balance: number
    maturityDate: string
    daysUntilMaturity: number
}> | null> {
    const session = await auth()
    if (!session?.user?.id) return null

    try {
        const today = new Date()
        const futureDate = new Date(today)
        futureDate.setDate(futureDate.getDate() + daysAhead)

        const todayStr = today.toISOString().split('T')[0]
        const futureDateStr = futureDate.toISOString().split('T')[0]

        // 获取当前用户角色
        const currentUser = await db.query.users.findFirst({
            where: eq(users.id, session.user.id)
        })

        const isAdmin = currentUser?.role === "ADMIN"

        // 查询即将到期的账户
        const accounts = await db.query.bankAccounts.findMany({
            where: and(
                isAdmin ? undefined : eq(bankAccounts.userId, session.user.id),
                isNotNull(bankAccounts.maturityDate),
                gte(bankAccounts.maturityDate, todayStr),
                lte(bankAccounts.maturityDate, futureDateStr)
            ),
        })

        return accounts.map(account => {
            const maturityDate = new Date(account.maturityDate!)
            const diffTime = maturityDate.getTime() - today.getTime()
            const daysUntilMaturity = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            return {
                id: account.id,
                accountName: account.accountName,
                bankName: account.bankName,
                balance: account.balance / 100,
                maturityDate: account.maturityDate!,
                daysUntilMaturity,
            }
        }).sort((a, b) => a.daysUntilMaturity - b.daysUntilMaturity)
    } catch (error) {
        logger.error("Failed to get upcoming maturities", error instanceof Error ? error : new Error(String(error)))
        return null
    }
}
