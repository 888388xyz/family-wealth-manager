"use server"

import { db } from "@/db"
import { bankAccounts, balanceHistory } from "@/db/schema"
import { auth } from "@/auth"
import { eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const accountSchema = z.object({
    bankName: z.string().min(1, "请选择银行"),
    accountName: z.string().min(1, "请输入账户名称"),
    accountType: z.enum(["CHECKING", "SAVINGS", "MONEY_MARKET", "CREDIT", "WEALTH", "OTHER"]),
    balance: z.coerce.number().min(0, "余额不能为负"),
    notes: z.string().optional(),
})

// 获取所有账户
export async function getAccountsAction() {
    const session = await auth()
    if (!session?.user) return null

    const data = await db.query.bankAccounts.findMany({
        where: eq(bankAccounts.userId, session.user.id!),
        orderBy: [desc(bankAccounts.updatedAt)],
    })

    return data
}

// 添加账户
export async function addAccountAction(formData: FormData) {
    const session = await auth()
    if (!session?.user) return { error: "未登录" }

    const parsed = accountSchema.safeParse({
        bankName: formData.get("bankName"),
        accountName: formData.get("accountName"),
        accountType: formData.get("accountType"),
        balance: formData.get("balance"),
        notes: formData.get("notes"),
    })

    if (!parsed.success) {
        return { error: parsed.error.flatten().fieldErrors }
    }

    try {
        const data = parsed.data
        const balanceInCents = Math.round(data.balance * 100)

        // 插入账户
        const [newAccount] = await db.insert(bankAccounts).values({
            userId: session.user.id!,
            bankName: data.bankName,
            accountName: data.accountName,
            accountType: data.accountType,
            balance: balanceInCents,
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
    if (!session?.user) return { error: "未登录" }

    await db.delete(bankAccounts).where(eq(bankAccounts.id, accountId))
    revalidatePath("/accounts")
    revalidatePath("/dashboard")
    return { success: true }
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
