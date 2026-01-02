"use client"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { LayoutDashboard, Wallet, Settings, ShieldCheck, Cog, FileText, TrendingUp, Target } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserInfo } from "@/components/ui/user-info"

const items = [
    { title: "仪表面板", url: "/dashboard", icon: LayoutDashboard },
    { title: "账户管理", url: "/accounts", icon: Wallet },
    { title: "目标管理", url: "/goals", icon: Target },
    { title: "趋势分析", url: "/trends", icon: TrendingUp },
]

const adminItems = [
    { title: "用户管理", url: "/users", icon: ShieldCheck },
    { title: "审计日志", url: "/audit-logs", icon: FileText },
    { title: "系统配置", url: "/config", icon: Cog },
]

interface AppSidebarProps {
    userRole?: string | null
    userName?: string | null
    userEmail?: string
    version?: string
}

export function AppSidebar({ userRole, userName, userEmail, version = "0.5.0" }: AppSidebarProps) {
    const pathname = usePathname()
    const isAdmin = userRole === "ADMIN"

    return (
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-2 px-4 py-2">
                    <div className="h-6 w-6 rounded bg-primary" />
                    <span className="font-semibold">家庭财富管家</span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>功能</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                                        <Link href={item.url}><item.icon /><span>{item.title}</span></Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                {isAdmin && (
                    <SidebarGroup>
                        <SidebarGroupLabel>管理</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {adminItems.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={pathname === item.url}>
                                            <Link href={item.url}><item.icon /><span>{item.title}</span></Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === "/settings"}>
                            <Link href="/settings"><Settings /><span>用户设置</span></Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                {userEmail && (
                    <UserInfo
                        user={{ name: userName ?? null, email: userEmail }}
                        version={version}
                    />
                )}
            </SidebarFooter>
        </Sidebar>
    )
}
