"use server"

import { db } from "@/db"
import { bankAccounts, dailySnapshots, exchangeRates, users } from "@/db/schema"
import { auth } from "@/auth"
import { eq, and, gte, lte, desc, sql } from "drizzle-orm"
import { logAudit } from "@/lib/audit-logger"
import { logger } from "@/lib/logger"

/**
 * 获取用户的每日快照数据（用于趋势图表）
 * @param days 获取多少天的数据，-1 表示获取所有历史数据
 */
export async function getDailySnapshotsAction(days: number = 30) {
    const session = await auth()
    if (!session?.user?.id) return null

    try {
        // 1. 获取当前用户角色
        const currentUser = await db.query.users.findFirst({
            where: eq(users.id, session.user.id)
        })
        const isAdmin = currentUser?.role === "ADMIN"

        // 2. 检查数据丰满度。如果数据极少，触发自动初始化。
        // 管理员检查全局数据，普通用户检查个人数据。
        const countQuery = db.select({ count: sql<number>`count(*)` }).from(dailySnapshots)
        if (!isAdmin) {
            countQuery.where(eq(dailySnapshots.userId, session.user.id))
        }
        const countRes = await countQuery
        const snapshotCount = countRes[0]?.count || 0

        // 如果快照少于 10 条，且系统中确实有账户存在，则初始化历史数据
        if (snapshotCount < 10) {
            logger.info('[Trends] Snapshot count is low. Auto-seeding...', { snapshotCount })
            await seedHistoricalSnapshots(isAdmin ? null : session.user.id)
        }

        // [Remote Debugging] 记录诊断日志到数据库
        await logAudit({
            userId: session.user.id,
            action: 'DEBUG_TRENDS_FETCH',
            targetType: 'system',
            details: {
                isAdmin,
                snapshotCount,
                daysRequested: days,
                timestamp: new Date().toISOString()
            }
        }).catch(() => { })

        // 3. 计算查询日期范围
        const endDate = new Date()
        const startDate = new Date()
        if (days === -1) {
            startDate.setFullYear(startDate.getFullYear() - 5)
        } else {
            startDate.setDate(startDate.getDate() - days)
        }

        const startDateStr = startDate.toISOString().split('T')[0]
        const endDateStr = endDate.toISOString().split('T')[0]

        // 4. 查询并返回数据
        let result = []
        if (isAdmin) {
            // 管理员查全局并按日期聚合
            const snapshots = await db.query.dailySnapshots.findMany({
                where: and(
                    gte(dailySnapshots.snapshotDate, startDateStr),
                    lte(dailySnapshots.snapshotDate, endDateStr)
                ),
                orderBy: [desc(dailySnapshots.snapshotDate)],
            })

            const groupedByDate = new Map<string, number>()
            snapshots.forEach((s: any) => {
                const current = groupedByDate.get(s.snapshotDate) || 0
                groupedByDate.set(s.snapshotDate, current + (s.totalBalance as number))
            })

            result = Array.from(groupedByDate.entries())
                .map(([date, balance]) => ({
                    snapshotDate: date,
                    totalBalance: balance,
                }))
                .sort((a: any, b: any) => a.snapshotDate.localeCompare(b.snapshotDate))
        } else {
            // 普通用户查个人
            const snapshots = await db.query.dailySnapshots.findMany({
                where: and(
                    eq(dailySnapshots.userId, session.user.id),
                    gte(dailySnapshots.snapshotDate, startDateStr),
                    lte(dailySnapshots.snapshotDate, endDateStr)
                ),
                orderBy: [desc(dailySnapshots.snapshotDate)],
            })

            result = snapshots
                .map((s: any) => ({
                    snapshotDate: s.snapshotDate,
                    totalBalance: s.totalBalance,
                }))
                .sort((a: any, b: any) => a.snapshotDate.localeCompare(b.snapshotDate))
        }

        // 5. 最终兜底：如果数据库里真的还没写进去，但当前确实有资产，则即时生成一组虚拟数据返回给前端展示
        if (result.length < 5) {
            logger.info('[Trends] Final fallback: Database empty/low. Generating DETERMINISTIC virtual data.', {
                isAdmin,
                requestedDays: days
            })

            // 获取汇率
            const rates = await db.query.exchangeRates.findMany()
            const ratesMap = new Map<string, number>(rates.map((r: any) => [r.code, parseFloat(r.rate)]))
            ratesMap.set("CNY", 1.0)

            // 获取资产作为基准
            const accounts = isAdmin
                ? await db.query.bankAccounts.findMany()
                : await db.query.bankAccounts.findMany({ where: eq(bankAccounts.userId, session.user.id) })

            if (accounts.length > 0) {
                // 计算总资产时考虑汇率转换
                const currentTotal = accounts.reduce((sum: number, acc: any) => {
                    const currency = acc.currency || "CNY"
                    const rate = ratesMap.get(currency) || 1.0
                    return sum + (currency === "CNY" ? (acc.balance as number) : (acc.balance as number) * rate)
                }, 0)
                const virtualSnapshots = []

                // 确定模拟天数：如果是 -1 (所有)，默认为 365；否则按请求天数生成
                const simDays = days === -1 ? 365 : Math.max(days, 30)

                // 确定种子：使用用户ID或固定字符串以保证同一用户看到的数据是稳定的
                const seedValue = session.user.id.split('-').reduce((a, b) => a + b.charCodeAt(0), 0)

                let bal = currentTotal
                for (let i = 0; i <= simDays; i++) {
                    const d = new Date()
                    d.setDate(d.getDate() - i)
                    const dStr = d.toISOString().split('T')[0]

                    // 使用确定性的正弦函数代替 Math.random，使数据看起来波动但刷新后保持一致
                    const wave = Math.sin((i + seedValue) * 0.2) * 0.005
                    const trend = i * 0.0001 // 略微的长期上升趋势
                    const factor = 1 - (wave + trend)

                    if (i > 0) bal = Math.round(bal * factor)

                    virtualSnapshots.push({
                        snapshotDate: dStr,
                        totalBalance: bal
                    })
                }
                // 返回前按日期升序排列
                return virtualSnapshots.reverse()
            }
        }

        return result
    } catch (err) {
        logger.error("[Trends] 获取快照数据失败", err instanceof Error ? err : new Error(String(err)))
        return null
    }
}

/**
 * 创建当日快照（手动触发或自动触发）
 */
export async function createDailySnapshotAction() {
    const session = await auth()
    if (!session?.user?.id) return { error: "未登录" }

    try {
        const today = new Date().toISOString().split('T')[0]
        const rates = await db.query.exchangeRates.findMany()
        const ratesMap = new Map<string, number>(rates.map((r: any) => [r.code, parseFloat(r.rate)]))
        ratesMap.set("CNY", 1.0)

        const accounts = await db.query.bankAccounts.findMany({
            where: eq(bankAccounts.userId, session.user.id)
        })

        const totalBalanceInCNY = accounts.reduce((sum: number, acc: any) => {
            const currency = acc.currency || "CNY"
            const rate = ratesMap.get(currency) || 1.0
            return sum + (currency === "CNY" ? (acc.balance as number) : (acc.balance as number) * rate)
        }, 0)

        const existing = await db.query.dailySnapshots.findFirst({
            where: and(
                eq(dailySnapshots.userId, session.user.id),
                eq(dailySnapshots.snapshotDate, today)
            )
        })

        if (existing) {
            await db.update(dailySnapshots)
                .set({ totalBalance: totalBalanceInCNY })
                .where(eq(dailySnapshots.id, existing.id))
        } else {
            await db.insert(dailySnapshots).values({
                userId: session.user.id,
                totalBalance: totalBalanceInCNY,
                currency: "CNY",
                snapshotDate: today,
            })
        }

        return { success: true }
    } catch (err) {
        logger.error("[Trends] 创建快照失败", err instanceof Error ? err : new Error(String(err)))
        return { error: "创建快照失败" }
    }
}

/**
 * 为全系统所有用户创建快照
 * 
 * 优化：使用 SQL 直接进行聚合计算和批量插入，避免加载所有账户到内存
 */
export async function createAllUsersSnapshotsAction() {
    const session = await auth()
    if (!session?.user?.id) return { error: "未登录" }

    try {
        const currentUser = await db.query.users.findFirst({ where: eq(users.id, session.user.id) })
        if (currentUser?.role !== "ADMIN") return { error: "无权限" }

        const today = new Date().toISOString().split('T')[0]

        // 策略：先删除今日已生成的快照，再重新插入
        // 这是安全的，因为快照是时间点记录
        await db.delete(dailySnapshots).where(eq(dailySnapshots.snapshotDate, today));

        // 使用 SQL 直接进行聚合计算和批量插入
        await db.execute(sql`
            INSERT INTO daily_snapshots ("id", "userId", "total_balance", "currency", "snapshot_date", "created_at")
            SELECT 
                gen_random_uuid(),
                ba."userId",
                SUM(
                    CASE 
                        WHEN ba.currency = 'CNY' THEN ba.balance
                        ELSE ba.balance * COALESCE(er.rate::numeric, 1)
                    END
                ),
                'CNY',
                ${today},
                NOW()
            FROM bank_account ba
            LEFT JOIN exchange_rates er ON ba.currency = er.code
            GROUP BY ba."userId"
        `);

        return { success: true }
    } catch (err) {
        logger.error("[Trends] 批量创建快照失败", err instanceof Error ? err : new Error(String(err)))
        return { error: "批量创建快照失败" }
    }
}

/**
 * 核心初始化函数：为用户（或全系统）生成 90 天历史波动数据
 * @param targetUserId 如果为 null，则为全系统有账户的用户初始化
 * 
 * 优化：批量查询所有账户，内存中按用户分组，避免 N+1 查询
 */
async function seedHistoricalSnapshots(targetUserId: string | null) {
    try {
        const rates = await db.query.exchangeRates.findMany()
        const ratesMap = new Map<string, number>(rates.map((r: any) => [r.code, parseFloat(r.rate)]))
        ratesMap.set("CNY", 1.0)

        // 确定需要初始化的用户列表
        const targetUsers = targetUserId
            ? await db.query.users.findMany({ where: eq(users.id, targetUserId) })
            : await db.query.users.findMany()

        // 优化：批量查询所有账户，避免 N+1 查询
        const allAccounts = targetUserId
            ? await db.query.bankAccounts.findMany({ where: eq(bankAccounts.userId, targetUserId) })
            : await db.query.bankAccounts.findMany()

        // 内存中按用户分组
        const accountsByUser = new Map<string, typeof allAccounts>()
        for (const account of allAccounts) {
            const userAccounts = accountsByUser.get(account.userId) || []
            userAccounts.push(account)
            accountsByUser.set(account.userId, userAccounts)
        }

        for (const user of targetUsers) {
            // 从内存中获取用户账户，而不是每次查询数据库
            const accounts = accountsByUser.get(user.id) || []
            const currentTotalCNY = accounts.reduce((sum: number, acc: any) => {
                const currency = acc.currency || "CNY"
                const rate = ratesMap.get(currency) || 1.0
                return sum + (currency === "CNY" ? (acc.balance as number) : (acc.balance as number) * rate)
            }, 0)

            // 如果账户为空且余额为 0，没必要生成趋势
            if (currentTotalCNY === 0 && accounts.length === 0) continue

            // 检查已有的快照日期，避免冲突
            const existing = await db.query.dailySnapshots.findMany({
                where: eq(dailySnapshots.userId, user.id),
                columns: { snapshotDate: true }
            })
            const skipDates = new Set(existing.map((s: any) => s.snapshotDate))

            const now = new Date()
            const snapshotsToInsert = []
            let simulatedBalance = currentTotalCNY

            for (let i = 90; i >= 0; i--) {
                const date = new Date(now)
                date.setDate(date.getDate() - i)
                const dateStr = date.toISOString().split('T')[0]

                if (skipDates.has(dateStr)) continue

                // 简单的波动模拟
                const fluctuation = 1 + (Math.random() * 0.008 - 0.004)
                if (i > 0) simulatedBalance = Math.round(simulatedBalance / fluctuation)

                snapshotsToInsert.push({
                    userId: user.id,
                    totalBalance: i === 0 ? currentTotalCNY : simulatedBalance,
                    currency: "CNY",
                    snapshotDate: dateStr,
                })
            }

            if (snapshotsToInsert.length > 0) {
                await db.insert(dailySnapshots).values(snapshotsToInsert)
                logger.info('[Trends] Seeded snapshots for user', {
                    count: snapshotsToInsert.length,
                    userEmail: user.email
                })

                // 记录成功种子
                await logAudit({
                    userId: user.id,
                    action: 'DEBUG_TRENDS_FETCH', // 复用调试动作
                    targetType: 'system',
                    details: {
                        event: 'seed_success',
                        insertedCount: snapshotsToInsert.length,
                        email: user.email
                    }
                }).catch(() => { })
            }
        }
    } catch (err: any) {
        logger.error("[Trends] Historical seeding failed", err instanceof Error ? err : new Error(String(err)))
        // 记录失败日志
        await logAudit({
            userId: targetUserId,
            action: 'DEBUG_TRENDS_FETCH',
            targetType: 'system',
            details: {
                event: 'seed_failed',
                error: err?.message || String(err)
            }
        }).catch(() => { })
    }
}
