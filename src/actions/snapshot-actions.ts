"use server"

import { db } from "@/db"
import { bankAccounts, dailySnapshots, exchangeRates, users } from "@/db/schema"
import { auth } from "@/auth"
import { eq, and, gte, lte, desc } from "drizzle-orm"

// 获取用户的每日快照数据（用于趋势图表）
// days 参数可以设置为 -1 表示获取所有历史数据
export async function getDailySnapshotsAction(days: number = 30) {
    const session = await auth()
    if (!session?.user?.id) return null

    try {
        // 获取当前用户角色
        const currentUser = await db.query.users.findFirst({
            where: eq(users.id, session.user.id)
        })

        const isAdmin = currentUser?.role === "ADMIN"

        // 计算日期范围
        const endDate = new Date()
        const startDate = new Date()
        
        // 如果 days 为 -1，获取所有历史数据（设置为5年前）
        if (days === -1) {
            startDate.setFullYear(startDate.getFullYear() - 5)
        } else {
            startDate.setDate(startDate.getDate() - days)
        }

        const startDateStr = startDate.toISOString().split('T')[0]
        const endDateStr = endDate.toISOString().split('T')[0]

        // 如果是管理员，获取所有用户的快照汇总；否则只获取自己的
        if (isAdmin) {
            // 获取所有快照并按日期汇总
            const snapshots = await db.query.dailySnapshots.findMany({
                where: and(
                    gte(dailySnapshots.snapshotDate, startDateStr),
                    lte(dailySnapshots.snapshotDate, endDateStr)
                ),
                orderBy: [desc(dailySnapshots.snapshotDate)],
            })

            // 按日期汇总所有用户的资产
            const groupedByDate = new Map<string, number>()
            snapshots.forEach(snapshot => {
                const current = groupedByDate.get(snapshot.snapshotDate) || 0
                groupedByDate.set(snapshot.snapshotDate, current + snapshot.totalBalance)
            })

            return Array.from(groupedByDate.entries())
                .map(([date, balance]) => ({
                    snapshotDate: date,
                    totalBalance: balance,
                }))
                .sort((a, b) => a.snapshotDate.localeCompare(b.snapshotDate))
        } else {
            // 普通用户只获取自己的快照
            const snapshots = await db.query.dailySnapshots.findMany({
                where: and(
                    eq(dailySnapshots.userId, session.user.id),
                    gte(dailySnapshots.snapshotDate, startDateStr),
                    lte(dailySnapshots.snapshotDate, endDateStr)
                ),
                orderBy: [desc(dailySnapshots.snapshotDate)],
            })

            return snapshots
                .map(s => ({
                    snapshotDate: s.snapshotDate,
                    totalBalance: s.totalBalance,
                }))
                .sort((a, b) => a.snapshotDate.localeCompare(b.snapshotDate))
        }
    } catch (err) {
        console.error("获取快照数据失败:", err)
        return null
    }
}

// 创建当日快照（可由定时任务或手动触发）
export async function createDailySnapshotAction() {
    const session = await auth()
    if (!session?.user?.id) return { error: "未登录" }

    try {
        const today = new Date().toISOString().split('T')[0]

        // 获取汇率
        const rates = await db.query.exchangeRates.findMany()
        const ratesMap = new Map(rates.map(r => [r.code, parseFloat(r.rate)]))
        ratesMap.set("CNY", 1.0)

        // 获取当前用户的所有账户
        const accounts = await db.query.bankAccounts.findMany({
            where: eq(bankAccounts.userId, session.user.id)
        })

        // 计算总资产（折算为CNY）
        const totalBalanceInCNY = accounts.reduce((sum, acc) => {
            const currency = acc.currency || "CNY"
            const rate = ratesMap.get(currency) || 1.0
            return sum + (currency === "CNY" ? acc.balance : acc.balance * rate)
        }, 0)

        // 检查今天是否已有快照
        const existingSnapshot = await db.query.dailySnapshots.findFirst({
            where: and(
                eq(dailySnapshots.userId, session.user.id),
                eq(dailySnapshots.snapshotDate, today)
            )
        })

        if (existingSnapshot) {
            // 更新现有快照
            await db.update(dailySnapshots)
                .set({ totalBalance: totalBalanceInCNY })
                .where(eq(dailySnapshots.id, existingSnapshot.id))
        } else {
            // 创建新快照
            await db.insert(dailySnapshots).values({
                userId: session.user.id,
                totalBalance: totalBalanceInCNY,
                currency: "CNY",
                snapshotDate: today,
            })
        }

        return { success: true }
    } catch (err) {
        console.error("创建快照失败:", err)
        return { error: "创建快照失败" }
    }
}

// 为所有用户创建快照（管理员功能，用于定时任务）
export async function createAllUsersSnapshotsAction() {
    const session = await auth()
    if (!session?.user?.id) return { error: "未登录" }

    try {
        // 验证是否为管理员
        const currentUser = await db.query.users.findFirst({
            where: eq(users.id, session.user.id)
        })

        if (currentUser?.role !== "ADMIN") {
            return { error: "无权限" }
        }

        const today = new Date().toISOString().split('T')[0]

        // 获取汇率
        const rates = await db.query.exchangeRates.findMany()
        const ratesMap = new Map(rates.map(r => [r.code, parseFloat(r.rate)]))
        ratesMap.set("CNY", 1.0)

        // 获取所有用户
        const allUsers = await db.query.users.findMany()

        // 为每个用户创建快照
        for (const user of allUsers) {
            const accounts = await db.query.bankAccounts.findMany({
                where: eq(bankAccounts.userId, user.id)
            })

            // 计算总资产（折算为CNY）
            const totalBalanceInCNY = accounts.reduce((sum, acc) => {
                const currency = acc.currency || "CNY"
                const rate = ratesMap.get(currency) || 1.0
                return sum + (currency === "CNY" ? acc.balance : acc.balance * rate)
            }, 0)

            // 检查今天是否已有快照
            const existingSnapshot = await db.query.dailySnapshots.findFirst({
                where: and(
                    eq(dailySnapshots.userId, user.id),
                    eq(dailySnapshots.snapshotDate, today)
                )
            })

            if (existingSnapshot) {
                await db.update(dailySnapshots)
                    .set({ totalBalance: totalBalanceInCNY })
                    .where(eq(dailySnapshots.id, existingSnapshot.id))
            } else {
                await db.insert(dailySnapshots).values({
                    userId: user.id,
                    totalBalance: totalBalanceInCNY,
                    currency: "CNY",
                    snapshotDate: today,
                })
            }
        }

        return { success: true, count: allUsers.length }
    } catch (err) {
        console.error("批量创建快照失败:", err)
        return { error: "批量创建快照失败" }
    }
}
