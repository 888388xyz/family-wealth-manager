"use server"

import { db } from "@/db"
import { bankAccounts, balanceHistory, users } from "@/db/schema"
import { auth } from "@/auth"
import { eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { logAudit } from "@/lib/audit-logger"
import { createDailySnapshotAction } from "./snapshot-actions"
import { validateUUID } from "@/lib/validators"
import { CENTS_PER_UNIT, YIELD_MULTIPLIER } from "@/lib/constants"

const accountSchema = z.object({
    bankName: z.string().min(1, "请选择银行/平台"),
    accountName: z.string().min(1, "请输入产品名称"),
    productType: z.string().min(1, "请选择产品类型"),
    currency: z.string().default("CNY"),
    balance: z.coerce.number().min(0, "余额不能为负"),
    expectedYield: z.coerce.number().optional().nullable(),
    maturityDate: z.string().optional().nullable(),
    notes: z.string().optional(),
})

const updateAccountSchema = z.object({
    bankName: z.string().min(1, "请选择平台"),
    accountName: z.string().min(1, "请输入产品名称"),
    productType: z.string().min(1, "请选择产品类型"),
    currency: z.string().default("CNY"),
    expectedYield: z.coerce.number().optional().nullable(),
    maturityDate: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
})

// 获取账户列表
export async function getAccountsAction() {
    const session = await auth()
    if (!session?.user) return null

    // 获取当前用户详细信息（包括角色）
    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id!)
    })

    if (!user) return null

    const isAdmin = user.role === "ADMIN"

    // 如果是管理员，获取所有人的账户；否则只获取自己的
    const data = await db.query.bankAccounts.findMany({
        where: isAdmin ? undefined : eq(bankAccounts.userId, user.id),
        with: {
            user: isAdmin ? {
                columns: {
                    name: true,
                    email: true
                }
            } : undefined,
            tagRelations: {
                with: {
                    tag: true
                }
            }
        },
        orderBy: [desc(bankAccounts.updatedAt)],
    })

    return data.map(account => ({
        ...account,
        tags: account.tagRelations.map(tr => tr.tag)
    }))
}

// 添加账户
export async function addAccountAction(formData: FormData) {
    const session = await auth()
    if (!session?.user) return { error: "未登录" }

    const expectedYieldRaw = formData.get("expectedYield")
    const expectedYieldValue = expectedYieldRaw ? parseFloat(expectedYieldRaw as string) : null
    const maturityDateRaw = formData.get("maturityDate") as string
    const maturityDateValue = maturityDateRaw && maturityDateRaw.trim() !== "" ? maturityDateRaw : null

    const parsed = accountSchema.safeParse({
        bankName: formData.get("bankName"),
        accountName: formData.get("accountName"),
        productType: formData.get("productType") || "DEMAND_DEPOSIT",
        currency: formData.get("currency") || "CNY",
        balance: formData.get("balance"),
        expectedYield: expectedYieldValue,
        maturityDate: maturityDateValue,
        notes: formData.get("notes"),
    })

    if (!parsed.success) {
        return { error: parsed.error.flatten().fieldErrors }
    }

    try {
        const data = parsed.data
        const balanceInCents = Math.round(data.balance * CENTS_PER_UNIT)
        // 收益率以万分之一存储，如 2.50% -> 250
        const yieldValue = data.expectedYield ? Math.round(data.expectedYield * YIELD_MULTIPLIER) : null

        // 插入账户
        const [newAccount] = await db.insert(bankAccounts).values({
            userId: session.user.id!,
            bankName: data.bankName,
            accountName: data.accountName,
            productType: data.productType,
            accountType: "OTHER", // 保留兼容性
            currency: data.currency,
            balance: balanceInCents,
            expectedYield: yieldValue,
            maturityDate: data.maturityDate || null,
            notes: data.notes || null,
        }).returning()

        // 记录初始余额到历史
        await db.insert(balanceHistory).values({
            accountId: newAccount.id,
            balance: balanceInCents,
        })

        // 记录审计日志
        await logAudit({
            userId: session.user.id!,
            action: 'ACCOUNT_CREATE',
            targetType: 'account',
            targetId: newAccount.id,
            details: {
                bankName: data.bankName,
                accountName: data.accountName,
                productType: data.productType,
                currency: data.currency,
                balance: data.balance,
                maturityDate: data.maturityDate,
            },
        })

        revalidatePath("/accounts")
        revalidatePath("/dashboard")
        revalidatePath("/trends")
        createDailySnapshotAction().catch(e => console.error("Snapshot error:", e))
        return { success: true }
    } catch (err) {
        console.error(err)
        return { error: "创建账户失败" }
    }
}

// 更新账户信息（不包括余额）
export async function updateAccountAction(
    accountId: string,
    data: {
        bankName: string
        accountName: string
        productType: string
        currency: string
        expectedYield: number | null
        maturityDate: string | null
        notes: string | null
    }
): Promise<{ success?: boolean; error?: string | Record<string, string[]> }> {
    const session = await auth()
    if (!session?.user?.id) return { error: "未登录" }

    // 验证输入数据
    const parsed = updateAccountSchema.safeParse(data)
    if (!parsed.success) {
        return { error: parsed.error.flatten().fieldErrors }
    }

    try {
        // 获取账户信息以进行权限检查
        const account = await db.query.bankAccounts.findFirst({
            where: eq(bankAccounts.id, accountId)
        })

        if (!account) {
            return { error: "账户不存在" }
        }

        // 权限校验：只能编辑自己的账户（管理员也不能编辑他人账户）
        if (account.userId !== session.user.id) {
            return { error: "无权编辑他人账户" }
        }

        const validData = parsed.data
        // 收益率以万分之一存储，如 2.50% -> 250
        const yieldValue = validData.expectedYield ? Math.round(validData.expectedYield * YIELD_MULTIPLIER) : null

        // 更新账户信息
        await db.update(bankAccounts)
            .set({
                bankName: validData.bankName,
                accountName: validData.accountName,
                productType: validData.productType,
                currency: validData.currency,
                expectedYield: yieldValue,
                maturityDate: validData.maturityDate || null,
                notes: validData.notes || null,
            })
            .where(eq(bankAccounts.id, accountId))

        // 记录审计日志
        await logAudit({
            userId: session.user.id!,
            action: 'ACCOUNT_UPDATE',
            targetType: 'account',
            targetId: accountId,
            details: {
                bankName: validData.bankName,
                accountName: validData.accountName,
                productType: validData.productType,
                currency: validData.currency,
                expectedYield: validData.expectedYield,
                maturityDate: validData.maturityDate,
            },
        })

        revalidatePath("/accounts")
        revalidatePath("/dashboard")
        revalidatePath("/trends")
        createDailySnapshotAction().catch(e => console.error("Snapshot error:", e))
        return { success: true }
    } catch (err) {
        console.error(err)
        return { error: "更新账户失败" }
    }
}

// 更新余额
export async function updateBalanceAction(accountId: string, newBalance: number) {
    const session = await auth()
    if (!session?.user?.id) return { error: "未登录" }

    // 验证 accountId 格式
    if (!validateUUID(accountId)) {
        return { error: "无效的账户 ID 格式" }
    }

    try {
        // 获取账户信息以进行权限检查
        const account = await db.query.bankAccounts.findFirst({
            where: eq(bankAccounts.id, accountId)
        })

        if (!account) {
            return { error: "账户不存在" }
        }

        // 获取当前用户角色
        const currentUser = await db.query.users.findFirst({
            where: eq(users.id, session.user.id)
        })

        const isAdmin = currentUser?.role === "ADMIN"

        // 权限校验：只能更新自己的账户余额，除非是管理员
        if (account.userId !== session.user.id && !isAdmin) {
            return { error: "无权修改他人账户余额" }
        }

        const balanceInCents = Math.round(newBalance * CENTS_PER_UNIT)

        // 更新账户余额
        await db.update(bankAccounts)
            .set({ balance: balanceInCents })
            .where(eq(bankAccounts.id, accountId))

        // 记录到历史
        await db.insert(balanceHistory).values({
            accountId: accountId,
            balance: balanceInCents,
        })

        // 记录审计日志
        await logAudit({
            userId: session.user.id!,
            action: 'BALANCE_UPDATE',
            targetType: 'balance',
            targetId: accountId,
            details: {
                accountName: account.accountName,
                oldBalance: account.balance / CENTS_PER_UNIT,
                newBalance: newBalance,
                changedBy: isAdmin && account.userId !== session.user.id ? 'admin' : 'owner',
            },
        })

        revalidatePath("/accounts")
        revalidatePath("/dashboard")
        revalidatePath("/trends")
        createDailySnapshotAction().catch(e => console.error("Snapshot error:", e))
        return { success: true }
    } catch (err) {
        console.error(err)
        return { error: "更新余额失败" }
    }
}

// 删除账户
export async function deleteAccountAction(accountId: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "未登录" }

    // 验证 accountId 格式
    if (!validateUUID(accountId)) {
        return { error: "无效的账户 ID 格式" }
    }

    try {

        // 获取账户信息以进行权限检查
        const account = await db.query.bankAccounts.findFirst({
            where: eq(bankAccounts.id, accountId)
        })

        if (!account) {
            return { error: "账户不存在" }
        }

        // 获取当前用户角色
        const currentUser = await db.query.users.findFirst({
            where: eq(users.id, session.user.id!)
        })

        const isAdmin = currentUser?.role === "ADMIN"

        // 权限校验：只能删除自己的账户，除非是管理员
        if (account.userId !== session.user.id && !isAdmin) {
            return { error: "无权删除他人账户" }
        }

        await db.delete(bankAccounts).where(eq(bankAccounts.id, accountId))

        // 记录审计日志
        await logAudit({
            userId: session.user.id!,
            action: 'ACCOUNT_DELETE',
            targetType: 'account',
            targetId: accountId,
            details: {
                bankName: account.bankName,
                accountName: account.accountName,
                balance: account.balance / CENTS_PER_UNIT,
                deletedBy: isAdmin && account.userId !== session.user.id ? 'admin' : 'owner',
            },
        })

        revalidatePath("/accounts")
        revalidatePath("/dashboard")
        revalidatePath("/trends")
        createDailySnapshotAction().catch(e => console.error("Snapshot error:", e))
        return { success: true }
    } catch (err) {
        console.error(err)
        return { error: "删除账户失败，可能存在数据关联限制" }
    }
}

// 获取账户历史（用于图表）
export async function getAccountHistoryAction(accountId: string) {
    const session = await auth()
    if (!session?.user?.id) return null

    try {
        // 获取账户信息以进行权限检查
        const account = await db.query.bankAccounts.findFirst({
            where: eq(bankAccounts.id, accountId)
        })

        if (!account) {
            return null
        }

        // 获取当前用户角色
        const currentUser = await db.query.users.findFirst({
            where: eq(users.id, session.user.id)
        })

        const isAdmin = currentUser?.role === "ADMIN"

        // 权限校验：只能查看自己的账户历史，除非是管理员
        if (account.userId !== session.user.id && !isAdmin) {
            return null // 非所有者非管理员返回空结果
        }

        const history = await db.query.balanceHistory.findMany({
            where: eq(balanceHistory.accountId, accountId),
            orderBy: [desc(balanceHistory.recordedAt)],
        })

        return history
    } catch (err) {
        console.error(err)
        return null
    }
}
