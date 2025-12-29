"use strict"

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
    level: LogLevel
    message: string
    context?: Record<string, unknown>
    error?: string
    timestamp: string
}

const isProduction = process.env.NODE_ENV === 'production'

// 敏感字段列表
const SENSITIVE_KEYS = ['password', 'secret', 'token', 'email']

/**
 * 过滤敏感信息
 * 将包含敏感关键字的字段值替换为 [REDACTED]
 */
function sanitize(data: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {}
    
    for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase()
        const isSensitive = SENSITIVE_KEYS.some(sk => lowerKey.includes(sk))
        
        if (isSensitive) {
            sanitized[key] = '[REDACTED]'
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            // 递归处理嵌套对象
            sanitized[key] = sanitize(value as Record<string, unknown>)
        } else {
            sanitized[key] = value
        }
    }
    
    return sanitized
}

/**
 * 格式化日志条目为 JSON 字符串
 */
function formatLogEntry(entry: LogEntry): string {
    return JSON.stringify(entry)
}

/**
 * 结构化日志器
 * - 支持 debug, info, warn, error 四个级别
 * - 自动过滤敏感信息
 * - 生产环境隐藏 debug 日志
 * - 输出结构化 JSON 格式
 */
export const logger = {
    /**
     * 调试日志 - 仅在非生产环境输出
     */
    debug(message: string, context?: Record<string, unknown>) {
        if (isProduction) return
        
        const entry: LogEntry = {
            level: 'debug',
            message,
            context: context ? sanitize(context) : undefined,
            timestamp: new Date().toISOString()
        }
        console.log(formatLogEntry(entry))
    },
    
    /**
     * 信息日志
     */
    info(message: string, context?: Record<string, unknown>) {
        const entry: LogEntry = {
            level: 'info',
            message,
            context: context ? sanitize(context) : undefined,
            timestamp: new Date().toISOString()
        }
        console.log(formatLogEntry(entry))
    },
    
    /**
     * 警告日志
     */
    warn(message: string, context?: Record<string, unknown>) {
        const entry: LogEntry = {
            level: 'warn',
            message,
            context: context ? sanitize(context) : undefined,
            timestamp: new Date().toISOString()
        }
        console.warn(formatLogEntry(entry))
    },
    
    /**
     * 错误日志
     * 生产环境仅输出错误消息，开发环境输出完整堆栈
     */
    error(message: string, error?: Error, context?: Record<string, unknown>) {
        const entry: LogEntry = {
            level: 'error',
            message,
            error: error ? (isProduction ? error.message : error.stack) : undefined,
            context: context ? sanitize(context) : undefined,
            timestamp: new Date().toISOString()
        }
        console.error(formatLogEntry(entry))
    }
}

// 导出 sanitize 函数供测试使用
export { sanitize }
