"use server"

import { db } from "@/db"
import { bankAccounts, balanceHistory, users } from "@/db/schema"
import { auth } from "@/auth"
import { eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const accountSchema = z.object({
    bankName: z.string().min(1, "请选择银行/平台"),
    accountName: z.string().min(1, "请输入产品名称"),
    productType: z.string().min(1, "请选择产品类型"),
    currency: z.string().default("CNY"),
    balance: z.coerce.number().min(0, "余额不能为负"),
    expectedYield: z.coerce.number().optional().nullable(),
    notes: z.string().optional(),
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
        with: isAdmin ? {
            user: {
                columns: {
                    name: true,
                    email: true
                }
            }
        } : undefined,
        orderBy: [desc(bankAccounts.updatedAt)],
    })

    return data
}

// 添加账户
export async function addAccountAction(formData: FormData) {
    const session = await auth()
    if (!session?.user) return { error: "未登录" }

    const expectedYieldRaw = formData.get("expectedYield")
    const expectedYieldValue = expectedYieldRaw ? parseFloat(expectedYieldRaw as string) : null

    const parsed = accountSchema.safeParse({
        bankName: formData.get("bankName"),
        accountName: formData.get("accountName"),
        productType: formData.get("productType") || "DEMAND_DEPOSIT",
        currency: formData.get("currency") || "CNY",
        balance: formData.get("balance"),
        expectedYield: expectedYieldValue,
        notes: formData.get("notes"),
    })

    if (!parsed.success) {
        return { error: parsed.error.flatten().fieldErrors }
    }

    try {
        const data = parsed.data
        const balanceInCents = Math.round(data.balance * 100)
        // 收益率以万分之一存储，如 2.50% -> 250
        const yieldValue = data.expectedYield ? Math.round(data.expectedYield * 100) : null

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
            notes: data.notes || null,
        }).returning()

        // 记录初始余额到历史
        await db.insert(balanceHistory).values({
            accountId: newAccount.id,
            balance: balanceInCents,
        })

        revalidatePath("/accounts")
        revalidatePath("/dashboard")
        return { success: true }
    } catch (err) {
        console.error(err)
        return { error: "创建账户失败" }
    }
}

// 更新余额
export async function updateBalanceAction(accountId: string, newBalance: number) {
    const session = await auth()
    if (!session?.user) return { error: "未登录" }

    try {
        const balanceInCents = Math.round(newBalance * 100)

        // 更新账户余额
        await db.update(bankAccounts)
            .set({ balance: balanceInCents })
            .where(eq(bankAccounts.id, accountId))

        // 记录到历史
        await db.insert(balanceHistory).values({
            accountId: accountId,
            balance: balanceInCents,
        })

        revalidatePath("/accounts")
        revalidatePath("/dashboard")
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

        revalidatePath("/accounts")
        revalidatePath("/dashboard")
        return { success: true }
    } catch (err) {
        console.error(err)
        return { error: "删除账户失败，可能存在数据关联限制" }
    }
}

// 获取账户历史（用于图表）
export async function getAccountHistoryAction(accountId: string) {
    const session = await auth()
    if (!session?.user) return null

    const history = await db.query.balanceHistory.findMany({
        where: eq(balanceHistory.accountId, accountId),
        orderBy: [desc(balanceHistory.recordedAt)],
    })

    return history
}
