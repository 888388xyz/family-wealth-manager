import { cache } from 'react'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/auth'

/**
 * 缓存当前用户信息（同一请求内复用）
 * 
 * React cache 确保在同一个 React 渲染周期内，
 * 多次调用此函数只会执行一次数据库查询。
 */
export const getCurrentUser = cache(async () => {
    const session = await auth()
    if (!session?.user?.id) return null

    return db.query.users.findFirst({
        where: eq(users.id, session.user.id)
    })
})

/**
 * 缓存汇率数据（同一请求内复用）
 * 
 * 返回一个 Map，key 为货币代码，value 为汇率（相对于 CNY）
 */
export const getExchangeRatesMap = cache(async () => {
    const rates = await db.query.exchangeRates.findMany()
    const ratesMap = new Map<string, number>()
    rates.forEach(r => ratesMap.set(r.code, parseFloat(r.rate)))
    ratesMap.set("CNY", 1.0)
    return ratesMap
})
