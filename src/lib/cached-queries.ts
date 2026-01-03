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
