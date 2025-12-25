"use server"

import { db } from "@/db"
import { auditLogs } from "@/db/schema"

/**
 * 审计操作类型
 */
export type AuditAction =
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILED'
    | 'ACCOUNT_CREATE'
    | 'ACCOUNT_UPDATE'
    | 'ACCOUNT_DELETE'
    | 'BALANCE_UPDATE'
    | 'USER_CREATE'
    | 'USER_DELETE'
    | 'USER_ROLE_UPDATE'
    | 'PASSWORD_RESET'
    | 'USER_NAME_UPDATE'

/**
 * 审计目标类型
 */
export type AuditTargetType = 'user' | 'account' | 'balance' | 'config' | 'auth'

/**
 * 审计日志条目接口
 */
export interface AuditLogEntry {
    userId: string | null
    action: AuditAction
    targetType: AuditTargetType
    targetId?: string | null
    details?: Record<string, unknown>
    ipAddress?: string | null
}

/**
 * 记录审计日志
 * @param entry 审计日志条目
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
    try {
        await db.insert(auditLogs).values({
            userId: entry.userId,
            action: entry.action,
            targetType: entry.targetType,
            targetId: entry.targetId || null,
            details: entry.details ? JSON.stringify(entry.details) : null,
            ipAddress: entry.ipAddress || null,
        })
    } catch (error) {
        // 审计日志记录失败不应影响主业务流程
        console.error('[AuditLogger] Failed to log audit entry:', error)
    }
}

/**
 * 获取操作描述（用于显示）
 */
export function getActionDescription(action: AuditAction): string {
    const descriptions: Record<AuditAction, string> = {
        LOGIN_SUCCESS: '登录成功',
        LOGIN_FAILED: '登录失败',
        ACCOUNT_CREATE: '创建账户',
        ACCOUNT_UPDATE: '更新账户',
        ACCOUNT_DELETE: '删除账户',
        BALANCE_UPDATE: '更新余额',
        USER_CREATE: '创建用户',
        USER_DELETE: '删除用户',
        USER_ROLE_UPDATE: '修改用户角色',
        PASSWORD_RESET: '重置密码',
        USER_NAME_UPDATE: '修改用户昵称',
    }
    return descriptions[action] || action
}

/**
 * 获取目标类型描述（用于显示）
 */
export function getTargetTypeDescription(targetType: AuditTargetType): string {
    const descriptions: Record<AuditTargetType, string> = {
        user: '用户',
        account: '账户',
        balance: '余额',
        config: '配置',
        auth: '认证',
    }
    return descriptions[targetType] || targetType
}
