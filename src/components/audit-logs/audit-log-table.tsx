"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Filter, X } from "lucide-react"
import type { AuditLogWithUser } from "@/actions/audit-actions"

interface AuditLogTableProps {
    logs: AuditLogWithUser[]
    total: number
    page: number
    pageSize: number
    totalPages: number
    actions: string[]
    targetTypes: string[]
    users: Array<{ id: string; name: string | null; email: string }>
    currentFilters: {
        action?: string
        targetType?: string
        userId?: string
        startDate?: string
        endDate?: string
    }
}

const actionLabels: Record<string, string> = {
    LOGIN_SUCCESS: "登录成功",
    LOGIN_FAILED: "登录失败",
    ACCOUNT_CREATE: "创建账户",
    ACCOUNT_UPDATE: "更新账户",
    ACCOUNT_DELETE: "删除账户",
    BALANCE_UPDATE: "更新余额",
    USER_CREATE: "创建用户",
    USER_DELETE: "删除用户",
    USER_ROLE_UPDATE: "修改角色",
    PASSWORD_RESET: "重置密码",
    USER_NAME_UPDATE: "修改昵称",
}

const targetTypeLabels: Record<string, string> = {
    user: "用户",
    account: "账户",
    balance: "余额",
    config: "配置",
    auth: "认证",
}

function getActionBadgeVariant(action: string): "default" | "secondary" | "destructive" | "outline" {
    if (action.includes("DELETE") || action === "LOGIN_FAILED") return "destructive"
    if (action.includes("CREATE")) return "default"
    if (action.includes("UPDATE") || action === "PASSWORD_RESET") return "secondary"
    if (action === "LOGIN_SUCCESS") return "outline"
    return "secondary"
}

export function AuditLogTable({
    logs,
    total,
    page,
    totalPages,
    actions,
    targetTypes,
    users,
    currentFilters,
}: AuditLogTableProps) {
    const router = useRouter()

    const [filters, setFilters] = useState({
        action: currentFilters.action || "",
        targetType: currentFilters.targetType || "",
        userId: currentFilters.userId || "",
        startDate: currentFilters.startDate || "",
        endDate: currentFilters.endDate || "",
    })

    const updateUrl = (newFilters: typeof filters, newPage?: number) => {
        const params = new URLSearchParams()
        if (newFilters.action) params.set("action", newFilters.action)
        if (newFilters.targetType) params.set("targetType", newFilters.targetType)
        if (newFilters.userId) params.set("userId", newFilters.userId)
        if (newFilters.startDate) params.set("startDate", newFilters.startDate)
        if (newFilters.endDate) params.set("endDate", newFilters.endDate)
        if (newPage && newPage > 1) params.set("page", newPage.toString())
        
        router.push(`/audit-logs?${params.toString()}`)
    }

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        const newFilters = { ...filters, [key]: value }
        setFilters(newFilters)
    }

    const applyFilters = () => {
        updateUrl(filters, 1)
    }

    const clearFilters = () => {
        const emptyFilters = {
            action: "",
            targetType: "",
            userId: "",
            startDate: "",
            endDate: "",
        }
        setFilters(emptyFilters)
        router.push("/audit-logs")
    }

    const goToPage = (newPage: number) => {
        updateUrl(filters, newPage)
    }

    const formatDate = (date: Date | null) => {
        if (!date) return "-"
        return new Date(date).toLocaleString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        })
    }

    const parseDetails = (details: string | null): Record<string, string | number | boolean | null> => {
        if (!details) return {}
        try {
            return JSON.parse(details)
        } catch {
            return {}
        }
    }

    const hasActiveFilters = Object.values(currentFilters).some(v => v)

    return (
        <div className="space-y-4">
            {/* 筛选器 */}
            <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
                <Select
                    value={filters.action}
                    onValueChange={(v) => handleFilterChange("action", v)}
                >
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="操作类型" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">全部操作</SelectItem>
                        {actions.map((action) => (
                            <SelectItem key={action} value={action}>
                                {actionLabels[action] || action}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.targetType}
                    onValueChange={(v) => handleFilterChange("targetType", v)}
                >
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="目标类型" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">全部类型</SelectItem>
                        {targetTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                                {targetTypeLabels[type] || type}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.userId}
                    onValueChange={(v) => handleFilterChange("userId", v)}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="操作用户" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">全部用户</SelectItem>
                        {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                                {user.name || user.email}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Input
                    type="date"
                    placeholder="开始日期"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange("startDate", e.target.value)}
                    className="w-[160px]"
                />

                <Input
                    type="date"
                    placeholder="结束日期"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange("endDate", e.target.value)}
                    className="w-[160px]"
                />

                <Button onClick={applyFilters} size="sm">
                    <Filter className="h-4 w-4 mr-1" />
                    筛选
                </Button>

                {hasActiveFilters && (
                    <Button onClick={clearFilters} variant="outline" size="sm">
                        <X className="h-4 w-4 mr-1" />
                        清除
                    </Button>
                )}
            </div>

            {/* 表格 */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[180px]">时间</TableHead>
                            <TableHead className="w-[120px]">操作用户</TableHead>
                            <TableHead className="w-[120px]">操作类型</TableHead>
                            <TableHead className="w-[100px]">目标类型</TableHead>
                            <TableHead>详情</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    暂无审计日志
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => {
                                const details = parseDetails(log.details)
                                return (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-mono text-sm">
                                            {formatDate(log.createdAt)}
                                        </TableCell>
                                        <TableCell>
                                            {log.user?.name || log.user?.email || "-"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getActionBadgeVariant(log.action)}>
                                                {actionLabels[log.action] || log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {targetTypeLabels[log.targetType] || log.targetType}
                                        </TableCell>
                                        <TableCell className="max-w-[400px]">
                                            <div className="text-sm text-muted-foreground truncate">
                                                {Object.entries(details)
                                                    .filter(([k]) => k !== "reason")
                                                    .map(([k, v]) => `${k}: ${v}`)
                                                    .join(", ") || "-"}
                                            </div>
                                            {details.reason && (
                                                <div className="text-xs text-destructive mt-1">
                                                    原因: {details.reason}
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        第 {page} 页，共 {totalPages} 页（{total} 条记录）
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(page - 1)}
                            disabled={page <= 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            上一页
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(page + 1)}
                            disabled={page >= totalPages}
                        >
                            下一页
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
