"use server"

import { db } from "@/db"
import { systemBanks, systemProductTypes, systemCurrencies, users } from "@/db/schema"
import { auth } from "@/auth"
import { eq, asc } from "drizzle-orm"
import { revalidatePath } from "next/cache"

async function isAdmin() {
    const session = await auth()
    if (!session?.user?.id) return false
    const user = await db.query.users.findFirst({ where: eq(users.id, session.user.id) })
    return user?.role === "ADMIN"
}

// --- Banks ---
export async function getBanksAction() {
    const banks = await db.query.systemBanks.findMany({ orderBy: [asc(systemBanks.sortOrder)] })
    return banks
}

export async function addBankAction(name: string) {
    if (!(await isAdmin())) return { error: "无权限" }
    if (!name.trim()) return { error: "名称不能为空" }
    try {
        await db.insert(systemBanks).values({ name: name.trim() })
        revalidatePath("/config")
        return { success: true }
    } catch (err: any) {
        if (err.message?.includes("unique") || err.message?.includes("UNIQUE")) return { error: "该平台已存在" }
        return { error: "添加失败" }
    }
}

export async function deleteBankAction(id: string) {
    if (!(await isAdmin())) return { error: "无权限" }
    try {
        await db.delete(systemBanks).where(eq(systemBanks.id, id))
        revalidatePath("/config")
        return { success: true }
    } catch (err) {
        return { error: "删除失败" }
    }
}

// --- Product Types ---
export async function getProductTypesAction() {
    const types = await db.query.systemProductTypes.findMany({ orderBy: [asc(systemProductTypes.sortOrder)] })
    return types
}

export async function addProductTypeAction(value: string, label: string) {
    if (!(await isAdmin())) return { error: "无权限" }
    if (!value.trim() || !label.trim()) return { error: "值和标签不能为空" }
    try {
        await db.insert(systemProductTypes).values({ value: value.trim().toUpperCase(), label: label.trim() })
        revalidatePath("/config")
        return { success: true }
    } catch (err: any) {
        if (err.message?.includes("unique") || err.message?.includes("UNIQUE")) return { error: "该类型已存在" }
        return { error: "添加失败" }
    }
}

export async function deleteProductTypeAction(id: string) {
    if (!(await isAdmin())) return { error: "无权限" }
    try {
        await db.delete(systemProductTypes).where(eq(systemProductTypes.id, id))
        revalidatePath("/config")
        return { success: true }
    } catch (err) {
        return { error: "删除失败" }
    }
}

// --- Currencies ---
export async function getCurrenciesAction() {
    const currencies = await db.query.systemCurrencies.findMany({ orderBy: [asc(systemCurrencies.sortOrder)] })
    return currencies
}

export async function addCurrencyAction(code: string, label: string) {
    if (!(await isAdmin())) return { error: "无权限" }
    if (!code.trim() || !label.trim()) return { error: "代码和标签不能为空" }
    try {
        await db.insert(systemCurrencies).values({ code: code.trim().toUpperCase(), label: label.trim() })
        revalidatePath("/config")
        return { success: true }
    } catch (err: any) {
        if (err.message?.includes("unique") || err.message?.includes("UNIQUE")) return { error: "该货币已存在" }
        return { error: "添加失败" }
    }
}

export async function deleteCurrencyAction(id: string) {
    if (!(await isAdmin())) return { error: "无权限" }
    try {
        await db.delete(systemCurrencies).where(eq(systemCurrencies.id, id))
        revalidatePath("/config")
        return { success: true }
    } catch (err) {
        return { error: "删除失败" }
    }
}

// --- Initialize default config ---
export async function initializeConfigAction() {
    if (!(await isAdmin())) return { error: "无权限" }

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

    revalidatePath("/config")
    return { success: true }
}
