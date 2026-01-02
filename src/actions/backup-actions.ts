"use server"

import { db } from "@/db"
import {
    users,
    bankAccounts,
    balanceHistory,
    dailySnapshots,
    systemBanks,
    systemProductTypes,
    systemCurrencies,
    notifications,
    auditLogs
} from "@/db/schema"
import { auth } from "@/auth"
import { eq } from "drizzle-orm"
import { adminAction } from "@/lib/action-utils"
import { encryptData, decryptData } from "@/lib/crypto"
import { logAudit } from "@/lib/audit-logger"

const BACKUP_VERSION = "2.0"

/**
 * 用户导出自己的账户数据（不加密）
 */
export async function exportDataAction() {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "未登录" }
    }

    const accounts = await db.query.bankAccounts.findMany({
        where: eq(bankAccounts.userId, session.user.id),
        with: {
            history: true
        }
    })

    const exportData = {
        exportedAt: new Date().toISOString(),
        version: "1.0",
        accounts: accounts.map(acc => ({
            bankName: acc.bankName,
            accountName: acc.accountName,
            accountType: acc.accountType,
            balance: acc.balance,
            currency: acc.currency,
            notes: acc.notes,
            createdAt: acc.createdAt?.toISOString(),
            history: acc.history.map(h => ({
                balance: h.balance,
                recordedAt: h.recordedAt?.toISOString(),
            }))
        }))
    }

    return { data: exportData }
}

/**
 * 管理员完整备份（加密）
 */
export async function adminFullBackupAction(password: string) {
    return adminAction(async (user) => {
        if (!password || password.length < 8) {
            return { error: "备份密码至少需要8位" }
        }

        try {
            // 导出所有核心数据
            const [
                allUsers,
                allBankAccounts,
                allBalanceHistory,
                allDailySnapshots,
                allSystemBanks,
                allSystemProductTypes,
                allSystemCurrencies,
                allNotifications,
                allExchangeRates,
            ] = await Promise.all([
                db.query.users.findMany(),
                db.query.bankAccounts.findMany(),
                db.query.balanceHistory.findMany(),
                db.query.dailySnapshots.findMany(),
                db.query.systemBanks.findMany(),
                db.query.systemProductTypes.findMany(),
                db.query.systemCurrencies.findMany(),
                db.query.notifications.findMany(),
                db.query.exchangeRates.findMany(),
            ])

            const backupData = {
                version: BACKUP_VERSION,
                exportedAt: new Date().toISOString(),
                exportedBy: user?.email,
                data: {
                    // 用户数据（排除敏感字段）
                    users: allUsers.map(u => ({
                        id: u.id,
                        name: u.name,
                        email: u.email,
                        role: u.role,
                        twoFactorEnabled: u.twoFactorEnabled,
                        createdAt: u.createdAt?.toISOString(),
                        // 注意：不导出 password 和 twoFactorSecret
                    })),
                    bankAccounts: allBankAccounts.map(acc => ({
                        id: acc.id,
                        userId: acc.userId,
                        bankName: acc.bankName,
                        accountName: acc.accountName,
                        productType: acc.productType,
                        accountType: acc.accountType,
                        balance: acc.balance,
                        currency: acc.currency,
                        expectedYield: acc.expectedYield,
                        maturityDate: acc.maturityDate,
                        notes: acc.notes,
                        createdAt: acc.createdAt?.toISOString(),
                        updatedAt: acc.updatedAt?.toISOString(),
                    })),
                    balanceHistory: allBalanceHistory.map(h => ({
                        id: h.id,
                        accountId: h.accountId,
                        balance: h.balance,
                        recordedAt: h.recordedAt?.toISOString(),
                        createdAt: h.createdAt?.toISOString(),
                    })),
                    dailySnapshots: allDailySnapshots.map(s => ({
                        id: s.id,
                        userId: s.userId,
                        totalBalance: s.totalBalance,
                        currency: s.currency,
                        snapshotDate: s.snapshotDate,
                        createdAt: s.createdAt?.toISOString(),
                    })),
                    systemBanks: allSystemBanks,
                    systemProductTypes: allSystemProductTypes,
                    systemCurrencies: allSystemCurrencies,
                    notifications: allNotifications.map(n => ({
                        id: n.id,
                        userId: n.userId,
                        type: n.type,
                        title: n.title,
                        content: n.content,
                        isRead: n.isRead,
                        createdAt: n.createdAt?.toISOString(),
                    })),
                    exchangeRates: allExchangeRates,
                },
                stats: {
                    users: allUsers.length,
                    bankAccounts: allBankAccounts.length,
                    balanceHistory: allBalanceHistory.length,
                    dailySnapshots: allDailySnapshots.length,
                }
            }

            // 加密备份数据
            const jsonData = JSON.stringify(backupData)
            const encryptedData = await encryptData(jsonData, password)

            // 记录审计日志
            await logAudit({
                userId: user?.id || null,
                action: "ADMIN_BACKUP",
                targetType: "system",
                details: {
                    stats: backupData.stats,
                    encrypted: true
                },
            })

            return {
                success: true,
                data: encryptedData,
                filename: `backup-${new Date().toISOString().split('T')[0]}.enc`,
                stats: backupData.stats
            }
        } catch (error) {
            console.error("Backup error:", error)
            return { error: "备份失败，请重试" }
        }
    })
}

/**
 * 验证备份文件（不恢复，只检查）
 */
export async function verifyBackupAction(encryptedData: string, password: string) {
    return adminAction(async () => {
        try {
            const jsonData = await decryptData(encryptedData, password)
            const backupData = JSON.parse(jsonData)

            if (!backupData.version || !backupData.data) {
                return { error: "无效的备份文件格式" }
            }

            return {
                success: true,
                version: backupData.version,
                exportedAt: backupData.exportedAt,
                exportedBy: backupData.exportedBy,
                stats: backupData.stats,
            }
        } catch (error) {
            return { error: "解密失败，请检查密码是否正确" }
        }
    })
}

/**
 * 管理员恢复备份（危险操作，会覆盖现有数据）
 */
export async function adminRestoreBackupAction(
    encryptedData: string,
    password: string,
    options: {
        restoreUsers?: boolean
        restoreAccounts?: boolean
        restoreConfig?: boolean
        clearExisting?: boolean
    } = {}
) {
    return adminAction(async (user) => {
        const {
            restoreUsers = false,
            restoreAccounts = true,
            restoreConfig = true,
            clearExisting = false
        } = options

        try {
            // 解密备份数据
            const jsonData = await decryptData(encryptedData, password)
            const backupData = JSON.parse(jsonData)

            if (backupData.version !== BACKUP_VERSION) {
                return { error: `备份版本不兼容。期望 ${BACKUP_VERSION}，实际 ${backupData.version}` }
            }

            const restored = {
                users: 0,
                bankAccounts: 0,
                balanceHistory: 0,
                dailySnapshots: 0,
                systemConfig: 0,
            }

            // 恢复系统配置
            if (restoreConfig && backupData.data.systemBanks) {
                if (clearExisting) {
                    await db.delete(systemBanks)
                    await db.delete(systemProductTypes)
                    await db.delete(systemCurrencies)
                }

                for (const bank of backupData.data.systemBanks) {
                    await db.insert(systemBanks).values(bank).onConflictDoNothing()
                }
                for (const type of backupData.data.systemProductTypes) {
                    await db.insert(systemProductTypes).values(type).onConflictDoNothing()
                }
                for (const currency of backupData.data.systemCurrencies) {
                    await db.insert(systemCurrencies).values(currency).onConflictDoNothing()
                }
                restored.systemConfig = 1
            }

            // 恢复用户（谨慎操作）
            if (restoreUsers && backupData.data.users) {
                for (const userData of backupData.data.users) {
                    // 只恢复基本信息，不恢复密码
                    await db.insert(users).values({
                        id: userData.id,
                        name: userData.name,
                        email: userData.email,
                        role: userData.role,
                        twoFactorEnabled: false, // 重置 2FA
                        createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
                    }).onConflictDoNothing()
                    restored.users++
                }
            }

            // 恢复账户数据
            if (restoreAccounts && backupData.data.bankAccounts) {
                if (clearExisting) {
                    await db.delete(balanceHistory)
                    await db.delete(bankAccounts)
                    await db.delete(dailySnapshots)
                }

                for (const acc of backupData.data.bankAccounts) {
                    await db.insert(bankAccounts).values({
                        id: acc.id,
                        userId: acc.userId,
                        bankName: acc.bankName,
                        accountName: acc.accountName,
                        productType: acc.productType,
                        accountType: acc.accountType,
                        balance: acc.balance,
                        currency: acc.currency,
                        expectedYield: acc.expectedYield,
                        maturityDate: acc.maturityDate,
                        notes: acc.notes,
                        createdAt: acc.createdAt ? new Date(acc.createdAt) : new Date(),
                    }).onConflictDoNothing()
                    restored.bankAccounts++
                }

                // 恢复余额历史
                for (const h of backupData.data.balanceHistory || []) {
                    await db.insert(balanceHistory).values({
                        id: h.id,
                        accountId: h.accountId,
                        balance: h.balance,
                        recordedAt: h.recordedAt ? new Date(h.recordedAt) : new Date(),
                        createdAt: h.createdAt ? new Date(h.createdAt) : new Date(),
                    }).onConflictDoNothing()
                    restored.balanceHistory++
                }

                // 恢复每日快照
                for (const s of backupData.data.dailySnapshots || []) {
                    await db.insert(dailySnapshots).values({
                        id: s.id,
                        userId: s.userId,
                        totalBalance: s.totalBalance,
                        currency: s.currency,
                        snapshotDate: s.snapshotDate,
                        createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
                    }).onConflictDoNothing()
                    restored.dailySnapshots++
                }
            }

            // 记录审计日志
            await logAudit({
                userId: user?.id || null,
                action: "ADMIN_RESTORE",
                targetType: "system",
                details: {
                    restored,
                    options,
                    backupDate: backupData.exportedAt
                },
            })

            return {
                success: true,
                restored,
                message: "备份恢复完成"
            }
        } catch (error) {
            console.error("Restore error:", error)
            return { error: "恢复失败，请检查密码和备份文件" }
        }
    })
}
