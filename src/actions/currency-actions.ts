"use server"

import { db } from "@/db"
import { exchangeRates } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

const CACHE_DURATION = 6 * 60 * 60 * 1000 // 6 hours

export async function getExchangeRatesAction() {
    try {
        const now = new Date()
        const rates = await db.query.exchangeRates.findMany()

        // Check if we need to refresh (if no rates or any rate is stale)
        const isStale = rates.length === 0 || rates.some(r => {
            if (!r.updatedAt) return true
            return (now.getTime() - r.updatedAt.getTime()) > CACHE_DURATION
        })

        if (isStale) {
            await refreshExchangeRates()
            return await db.query.exchangeRates.findMany()
        }

        return rates
    } catch (err) {
        console.error("[Currency] Failed to get rates:", err)
        return []
    }
}

export async function refreshExchangeRates() {
    try {
        // Fetch rates from Frankfurter (CNY as base)
        const response = await fetch("https://api.frankfurter.app/latest?from=CNY")
        if (!response.ok) throw new Error("API response not ok")

        const data = await response.json()
        const apiRates = data.rates // { "USD": 0.13, "HKD": 1.05... }

        // We want to store 1 Unit = X CNY
        // So rate_in_cny = 1 / api_rate

        const currenciesToUpdate = Object.keys(apiRates)

        for (const code of currenciesToUpdate) {
            const rateInCNY = (1 / apiRates[code]).toFixed(6)

            // Upsert
            const existing = await db.query.exchangeRates.findFirst({
                where: eq(exchangeRates.code, code)
            })

            if (existing) {
                await db.update(exchangeRates)
                    .set({ rate: rateInCNY, updatedAt: new Date() })
                    .where(eq(exchangeRates.code, code))
            } else {
                await db.insert(exchangeRates)
                    .values({ code, rate: rateInCNY, updatedAt: new Date() })
            }
        }

        // Always ensure CNY:CNY is 1
        const cnyExisting = await db.query.exchangeRates.findFirst({
            where: eq(exchangeRates.code, "CNY")
        })
        if (!cnyExisting) {
            await db.insert(exchangeRates).values({ code: "CNY", rate: "1.000000", updatedAt: new Date() })
        } else {
            await db.update(exchangeRates).set({ rate: "1.000000", updatedAt: new Date() }).where(eq(exchangeRates.code, "CNY"))
        }

        revalidatePath("/dashboard")
        return { success: true }
    } catch (err) {
        console.error("[Currency] Refresh failed:", err)
        return { error: "无法获取最新汇率" }
    }
}
