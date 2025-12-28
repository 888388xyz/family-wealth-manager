"use client"

import { LogOut, User } from "lucide-react"
import { signOut } from "next-auth/react"
import {
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar"

interface UserInfoProps {
    user: {
        name: string | null
        email: string
    }
    version: string
}

export function UserInfo({ user, version }: UserInfoProps) {
    const displayName = user.name || user.email

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <div className="flex w-full items-center gap-2 p-2 text-sm text-sidebar-foreground font-medium">
                    <User className="size-4 shrink-0" />
                    <span className="truncate">{displayName}</span>
                </div>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                    <LogOut />
                    <span>退出登录</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <div className="px-2 py-1 text-xs text-muted-foreground">
                    v{version}
                </div>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
