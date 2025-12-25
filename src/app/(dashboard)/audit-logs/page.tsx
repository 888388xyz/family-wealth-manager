import { getAuditLogsAction, getAuditActionsAction, getAuditTargetTypesAction } from "@/actions/audit-actions"
import { getUsersAction } from "@/actions/user-actions"
import { getCurrentUserAction } from "@/actions/settings-actions"
import { redirect } from "next/navigation"
import { AuditLogTable } from "@/components/audit-logs/audit-log-table"

interface AuditLogsPageProps {
    searchParams: Promise<{
        page?: string
        action?: string
        targetType?: string
        userId?: string
        startDate?: string
        endDate?: string
    }>
}

export default async function AuditLogsPage({ searchParams }: AuditLogsPageProps) {
    const currentUser = await getCurrentUserAction()

    if (!currentUser) {
        redirect("/login")
    }

    if (currentUser.role !== "ADMIN") {
        redirect("/dashboard")
    }

    const params = await searchParams
    const page = parseInt(params.page || "1", 10)

    const [logsResult, actions, targetTypes, users] = await Promise.all([
        getAuditLogsAction({
            page,
            pageSize: 20,
            action: params.action,
            targetType: params.targetType,
            userId: params.userId,
            startDate: params.startDate,
            endDate: params.endDate,
        }),
        getAuditActionsAction(),
        getAuditTargetTypesAction(),
        getUsersAction(),
    ])

    if (!logsResult) {
        redirect("/dashboard")
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">审计日志</h2>
                    <p className="text-muted-foreground">共 {logsResult.total} 条记录</p>
                </div>
            </div>
            <AuditLogTable
                logs={logsResult.logs}
                total={logsResult.total}
                page={logsResult.page}
                pageSize={logsResult.pageSize}
                totalPages={logsResult.totalPages}
                actions={actions || []}
                targetTypes={targetTypes || []}
                users={users || []}
                currentFilters={{
                    action: params.action,
                    targetType: params.targetType,
                    userId: params.userId,
                    startDate: params.startDate,
                    endDate: params.endDate,
                }}
            />
        </div>
    )
}
