"use server"

import { db } from "@/db"
import { exchangeRates, systemCurrencies } from "@/db/schema"
import { inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"

const CACHE_DURATION = 6 * 60 * 60 * 1000 // 6 hours

export async function getExchangeRatesAction() {
    try {
        const now = new Date()
        
        // Get configured currencies from system_currencies table
        const configuredCurrencies = await db.query.systemCurrencies.findMany()
        const configuredCodes = configuredCurrencies.map(c => c.code)
        
        // If no currencies configured, return empty
        if (configuredCodes.length === 0) {
            return []
        }
        
        // Only get rates for configured currencies
        const rates = await db.query.exchangeRates.findMany({
            where: inArray(exchangeRates.code, configuredCodes)
        })

        // Check if we need to refresh (if no rates or any rate is stale)
        const isStale = rates.length === 0 || rates.some(r => {
            if (!r.updatedAt) return true
            return (now.getTime() - r.updatedAt.getTime()) > CACHE_DURATION
        })

        if (isStale) {
            await refreshExchangeRates()
            // Return only configured currencies after refresh
            return await db.query.exchangeRates.findMany({
                where: inArray(exchangeRates.code, configuredCodes)
            })
        }

        return rates
    } catch (err) {
        console.error("[Currency] Failed to get rates:", err)
        return []
    }
}

/**
 * 刷新汇率数据
 * 
 * 优化：使用 onConflictDoUpdate 替代 select-then-update 模式
 */
export async function refreshExchangeRates() {
    try {
        // Get configured currencies from system_currencies table
        const configuredCurrencies = await db.query.systemCurrencies.findMany()
        const configuredCodes = configuredCurrencies.map(c => c.code)
        
        // If no currencies configured, skip refresh
        if (configuredCodes.length === 0) {
            return { success: true }
        }
        
        // Fetch rates from Frankfurter (CNY as base)
        const response = await fetch("https://api.frankfurter.app/latest?from=CNY")
        if (!response.ok) throw new Error("API response not ok")

        const data = await response.json()
        const apiRates = data.rates // { "USD": 0.13, "HKD": 1.05... }

        // We want to store 1 Unit = X CNY
        // So rate_in_cny = 1 / api_rate

        // 优化：使用 onConflictDoUpdate 批量 upsert
        for (const code of configuredCodes) {
            if (code === "CNY") continue // Skip CNY, handle separately
            
            if (apiRates[code]) {
                const rateInCNY = (1 / apiRates[code]).toFixed(6)
                const now = new Date()

                await db.insert(exchangeRates)
                    .values({ code, rate: rateInCNY, updatedAt: now })
                    .onConflictDoUpdate({
                        target: exchangeRates.code,
                        set: { rate: rateInCNY, updatedAt: now }
                    })
            }
        }

        // Always ensure CNY:CNY is 1 if CNY is configured
        if (configuredCodes.includes("CNY")) {
            const now = new Date()
            await db.insert(exchangeRates)
                .values({ code: "CNY", rate: "1.000000", updatedAt: now })
                .onConflictDoUpdate({
                    target: exchangeRates.code,
                    set: { rate: "1.000000", updatedAt: now }
                })
        }

        revalidatePath("/dashboard")
        return { success: true }
    } catch (err) {
        console.error("[Currency] Refresh failed:", err)
        return { error: "无法获取最新汇率" }
    }
}
