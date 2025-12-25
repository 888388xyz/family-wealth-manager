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
import { LayoutDashboard, Wallet, Settings, LogOut, ShieldCheck, Cog } from "lucide-react"
import Link from "next/link"
import { signOut } from "next-auth/react"

const items = [
    { title: "仪表盘", url: "/dashboard", icon: LayoutDashboard },
    { title: "账户管理", url: "/accounts", icon: Wallet },
]

interface AppSidebarProps {
    userRole?: string | null
}

export function AppSidebar({ userRole }: AppSidebarProps) {
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
                                    <SidebarMenuButton asChild>
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
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link href="/users"><ShieldCheck /><span>用户管理</span></Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link href="/config"><Cog /><span>系统配置</span></Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link href="/settings"><Settings /><span>设置</span></Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton className="text-destructive hover:text-destructive" onClick={() => signOut({ callbackUrl: "/login" })}>
                            <LogOut /><span>退出登录</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
