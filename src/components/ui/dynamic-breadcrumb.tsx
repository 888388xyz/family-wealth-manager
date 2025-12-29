"use client"

import { usePathname } from "next/navigation"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const routeNames: Record<string, string> = {
    "/dashboard": "仪表面板",
    "/accounts": "账户管理",
    "/trends": "趋势分析",
    "/users": "用户管理",
    "/audit-logs": "审计日志",
    "/config": "系统配置",
    "/settings": "用户设置",
}

export function DynamicBreadcrumb() {
    const pathname = usePathname()
    const currentPageName = routeNames[pathname]

    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    {pathname === "/dashboard" ? (
                        <BreadcrumbPage>首页</BreadcrumbPage>
                    ) : (
                        <BreadcrumbLink href="/dashboard">首页</BreadcrumbLink>
                    )}
                </BreadcrumbItem>
                {pathname !== "/dashboard" && currentPageName && (
                    <>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{currentPageName}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </>
                )}
            </BreadcrumbList>
        </Breadcrumb>
    )
}
