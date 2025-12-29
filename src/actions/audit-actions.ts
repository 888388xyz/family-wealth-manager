"use server"

import { db } from "@/db"
import { auditLogs } from "@/db/schema"
import { eq, desc, and, gte, lte, sql } from "drizzle-orm"
import { adminAction } from "@/lib/action-utils"

export interface AuditLogWithUser {
    id: string
    userId: string | null
    action: string
    targetType: string
    targetId: string | null
    details: string | null
    ipAddress: string | null
    createdAt: Date | null
    user: {
        name: string | null
        email: string
    } | null
}

export interface GetAuditLogsParams {
    page?: number
    pageSize?: number
    action?: string
    targetType?: string
    userId?: string
    startDate?: string
    endDate?: string
}

export interface GetAuditLogsResult {
    logs: AuditLogWithUser[]
    total: number
    page: number
    pageSize: number
    totalPages: number
}

export async function getAuditLogsAction(
    params: GetAuditLogsParams = {}
): Promise<GetAuditLogsResult | null> {
    const result = await adminAction(async () => {
        const {
            page = 1,
            pageSize = 20,
            action,
            targetType,
            userId,
            startDate,
            endDate,
        } = params

        const offset = (page - 1) * pageSize

        // 构建查询条件
        const conditions = []
        
        if (action) {
            conditions.push(eq(auditLogs.action, action))
        }
        
        if (targetType) {
            conditions.push(eq(auditLogs.targetType, targetType))
        }
        
        if (userId) {
            conditions.push(eq(auditLogs.userId, userId))
        }
        
        if (startDate) {
            conditions.push(gte(auditLogs.createdAt, new Date(startDate)))
        }
        
        if (endDate) {
            const endDateTime = new Date(endDate)
            endDateTime.setHours(23, 59, 59, 999)
            conditions.push(lte(auditLogs.createdAt, endDateTime))
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined

        // 获取总数
        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(auditLogs)
            .where(whereClause)
        
        const total = Number(countResult[0]?.count || 0)

        // 获取分页数据
        const logs = await db.query.auditLogs.findMany({
            where: whereClause,
            with: {
                user: {
                    columns: {
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: [desc(auditLogs.createdAt)],
            limit: pageSize,
            offset: offset,
        })

        return {
            success: true,
            logs: logs as AuditLogWithUser[],
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        }
    })

    // 保持原有返回 null 的行为
    if (!result.success) {
        return null
    }
    return {
        logs: result.logs,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
    }
}

// 获取所有操作类型（用于筛选下拉框）
export async function getAuditActionsAction(): Promise<string[] | null> {
    const result = await adminAction(async () => {
        const queryResult = await db
            .selectDistinct({ action: auditLogs.action })
            .from(auditLogs)
            .orderBy(auditLogs.action)

        return {
            success: true,
            actions: queryResult.map(r => r.action)
        }
    })

    // 保持原有返回 null 的行为
    if (!result.success) {
        return null
    }
    return result.actions
}

// 获取所有目标类型（用于筛选下拉框）
export async function getAuditTargetTypesAction(): Promise<string[] | null> {
    const result = await adminAction(async () => {
        const queryResult = await db
            .selectDistinct({ targetType: auditLogs.targetType })
            .from(auditLogs)
            .orderBy(auditLogs.targetType)

        return {
            success: true,
            targetTypes: queryResult.map(r => r.targetType)
        }
    })

    // 保持原有返回 null 的行为
    if (!result.success) {
        return null
    }
    return result.targetTypes
}
