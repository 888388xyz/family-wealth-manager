"use server"

import { db } from "@/db"
import { systemBanks, systemProductTypes, systemCurrencies, systemSettings } from "@/db/schema"
import { eq, asc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { adminAction } from "@/lib/action-utils"

// --- Banks ---
export async function getBanksAction() {
    const banks = await db.query.systemBanks.findMany({ orderBy: [asc(systemBanks.sortOrder)] })
    return banks
}

export async function addBankAction(name: string) {
    return adminAction(async () => {
        if (!name.trim()) return { error: "名称不能为空" }
        try {
            await db.insert(systemBanks).values({ name: name.trim() })
            revalidatePath("/config")
            return { success: true }
        } catch (err: any) {
            if (err.message?.includes("unique") || err.message?.includes("UNIQUE")) return { error: "该平台已存在" }
            return { error: "添加失败" }
        }
    })
}

export async function deleteBankAction(id: string) {
    return adminAction(async () => {
        try {
            await db.delete(systemBanks).where(eq(systemBanks.id, id))
            revalidatePath("/config")
            return { success: true }
        } catch (err) {
            return { error: "删除失败" }
        }
    })
}

// --- Product Types ---
export async function getProductTypesAction() {
    const types = await db.query.systemProductTypes.findMany({ orderBy: [asc(systemProductTypes.sortOrder)] })
    return types
}

export async function addProductTypeAction(value: string, label: string) {
    return adminAction(async () => {
        if (!value.trim() || !label.trim()) return { error: "值和标签不能为空" }
        try {
            await db.insert(systemProductTypes).values({ value: value.trim().toUpperCase(), label: label.trim() })
            revalidatePath("/config")
            return { success: true }
        } catch (err: any) {
            if (err.message?.includes("unique") || err.message?.includes("UNIQUE")) return { error: "该类型已存在" }
            return { error: "添加失败" }
        }
    })
}

export async function deleteProductTypeAction(id: string) {
    return adminAction(async () => {
        try {
            await db.delete(systemProductTypes).where(eq(systemProductTypes.id, id))
            revalidatePath("/config")
            return { success: true }
        } catch (err) {
            return { error: "删除失败" }
        }
    })
}

// --- Currencies ---
export async function getCurrenciesAction() {
    const currencies = await db.query.systemCurrencies.findMany({ orderBy: [asc(systemCurrencies.sortOrder)] })
    return currencies
}

export async function addCurrencyAction(code: string, label: string) {
    return adminAction(async () => {
        if (!code.trim() || !label.trim()) return { error: "代码和标签不能为空" }
        try {
            await db.insert(systemCurrencies).values({ code: code.trim().toUpperCase(), label: label.trim() })
            revalidatePath("/config")
            return { success: true }
        } catch (err: any) {
            if (err.message?.includes("unique") || err.message?.includes("UNIQUE")) return { error: "该货币已存在" }
            return { error: "添加失败" }
        }
    })
}

export async function deleteCurrencyAction(id: string) {
    return adminAction(async () => {
        try {
            await db.delete(systemCurrencies).where(eq(systemCurrencies.id, id))
            revalidatePath("/config")
            return { success: true }
        } catch (err) {
            return { error: "删除失败" }
        }
    })
}

// --- System Settings ---
export async function getSystemSettingsAction() {
    try {
        const settings = await db.query.systemSettings.findMany()
        // Convert array to object for easier use: { key: value }
        return settings.reduce<Record<string, string>>((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {})
    } catch (err) {
        console.warn("[Config] Failed to fetch settings, table might not exist yet:", err)
        return {}
    }
}

export async function updateSystemSettingAction(key: string, value: string) {
    return adminAction(async () => {
        try {
            await db.insert(systemSettings)
                .values({ key, value })
                .onConflictDoUpdate({
                    target: systemSettings.key,
                    set: { value, updatedAt: new Date() }
                })
            revalidatePath("/config")
            return { success: true }
        } catch (err) {
            console.error("[Settings] Update failed:", err)
            return { error: "更新设置失败" }
        }
    })
}

import { sendEmail } from "@/lib/brevo-utils"
import { getCurrentUserAction } from "./settings-actions"

export async function testEmailAction(toEmail?: string) {
    return adminAction(async () => {
        const user = await getCurrentUserAction()
        const recipient = toEmail || user?.email
        if (!recipient) return { error: "未指定测试收件人，且当前用户无邮箱" }

        const result = await sendEmail({
            to: recipient,
            subject: "Family Wealth Manager - 邮件通知测试",
            textContent: "这是一封测试邮件，证明你的 Brevo 邮件通知配置已生效。",
            htmlContent: "<h1>测试成功</h1><p>这是一封测试邮件，证明你的 Brevo 邮件通知配置已生效。</p>"
        })

        if (!result.success) return { error: result.error }
        return { success: true }
    })
}

// --- Initialize default config (called during page render, no revalidation) ---
export async function initializeConfigAction() {
    return adminAction(async () => {
        try {
            const existingBanks = await db.query.systemBanks.findMany()
            if (existingBanks.length === 0) {
                const defaultBanks = ["工商银行", "建设银行", "农业银行", "中国银行", "招商银行", "浦发银行", "汇丰中国", "汇丰香港", "汇丰美国", "京东", "博时", "支付宝", "微信", "股市", "其他"]
                for (let i = 0; i < defaultBanks.length; i++) {
                    await db.insert(systemBanks).values({ name: defaultBanks[i], sortOrder: i }).onConflictDoNothing()
                }
            }

            const existingTypes = await db.query.systemProductTypes.findMany()
            if (existingTypes.length === 0) {
                const defaultTypes = [
                    { value: "FUND", label: "基金" },
                    { value: "FIXED_DEPOSIT", label: "定期理财" },
                    { value: "DEMAND_DEPOSIT", label: "活期存款" },
                    { value: "DEMAND_WEALTH", label: "活期理财" },
                    { value: "PRECIOUS_METAL", label: "贵金属" },
                    { value: "STOCK", label: "股票" },
                    { value: "OTHER", label: "其他" },
                ]
                for (let i = 0; i < defaultTypes.length; i++) {
                    await db.insert(systemProductTypes).values({ ...defaultTypes[i], sortOrder: i }).onConflictDoNothing()
                }
            }

            const existingCurrencies = await db.query.systemCurrencies.findMany()
            if (existingCurrencies.length === 0) {
                const defaultCurrencies = [
                    { code: "CNY", label: "人民币" },
                    { code: "USD", label: "美元" },
                    { code: "HKD", label: "港币" },
                    { code: "EUR", label: "欧元" },
                ]
                for (let i = 0; i < defaultCurrencies.length; i++) {
                    await db.insert(systemCurrencies).values({ ...defaultCurrencies[i], sortOrder: i }).onConflictDoNothing()
                }
            }

            // Seed default email settings
            try {
                const existingSettings = await db.query.systemSettings.findMany()
                if (existingSettings.length === 0) {
                    const defaultSettings = [
                        { key: "BREVO_API_KEY", value: process.env.BREVO_API_KEY || "" },
                        { key: "EMAIL_FROM", value: process.env.EMAIL_FROM || "wealth-manager@oheng.com" },
                    ]
                    for (const setting of defaultSettings) {
                        await db.insert(systemSettings).values(setting).onConflictDoNothing()
                    }
                }
            } catch (err) {
                console.warn("[Config] Skipping settings seed, table might not exist yet:", err)
            }

            return { success: true }
        } catch (err) {
            console.error("[Config] Initialize failed:", err)
            return { error: "初始化配置失败" }
        }
    })
}
