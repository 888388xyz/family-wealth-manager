/**
 * 请求频率限制器
 * 使用内存存储（Map）实现
 */

import { LOGIN_RATE_LIMIT, API_RATE_LIMIT } from "@/lib/constants"

interface RateLimiterConfig {
    windowMs: number      // 时间窗口（毫秒）
    maxRequests: number   // 最大请求数
}

interface RateLimitEntry {
    count: number
    resetAt: Date
}

interface RateLimitResult {
    remaining: number
    resetAt: Date
}

export class RateLimiter {
    private store: Map<string, RateLimitEntry> = new Map()
    private config: RateLimiterConfig

    constructor(config: RateLimiterConfig) {
        this.config = config
    }

    /**
     * 检查是否允许请求
     * @param key 限制键（如 IP 地址）
     * @returns 剩余次数和重置时间，如果被限制则返回 null
     */
    check(key: string): RateLimitResult | null {
        const now = new Date()
        const entry = this.store.get(key)

        // 如果没有记录或已过期，创建新记录
        if (!entry || entry.resetAt <= now) {
            const resetAt = new Date(now.getTime() + this.config.windowMs)
            this.store.set(key, { count: 1, resetAt })
            return { remaining: this.config.maxRequests - 1, resetAt }
        }

        // 检查是否超过限制
        if (entry.count >= this.config.maxRequests) {
            return null // 被限制
        }

        // 增加计数
        entry.count++
        this.store.set(key, entry)
        return { remaining: this.config.maxRequests - entry.count, resetAt: entry.resetAt }
    }

    /**
     * 重置指定键的计数
     * @param key 限制键
     */
    reset(key: string): void {
        this.store.delete(key)
    }

    /**
     * 获取当前状态（用于调试）
     * @param key 限制键
     */
    getStatus(key: string): RateLimitEntry | undefined {
        return this.store.get(key)
    }

    /**
     * 清理过期的记录（可选，用于内存管理）
     */
    cleanup(): void {
        const now = new Date()
        for (const [key, entry] of this.store.entries()) {
            if (entry.resetAt <= now) {
                this.store.delete(key)
            }
        }
    }
}

// 登录限制器：5分钟内最多10次尝试
export const loginLimiter = new RateLimiter(LOGIN_RATE_LIMIT)

// API限制器：1分钟内最多100次请求
export const apiLimiter = new RateLimiter(API_RATE_LIMIT)
