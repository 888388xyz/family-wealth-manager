"use server"

import { db } from "@/db"
import { bankAccounts, balanceHistory } from "@/db/schema"
import { auth } from "@/auth"
import { eq } from "drizzle-orm"

export async function exportDataAction() {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "未登录" }
    }

    // Get all bank accounts for this user
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
