"use client"

import { LogOut, User } from "lucide-react"
import { signOut } from "next-auth/react"
import { Button } from "./button"

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
        <div className="flex flex-col gap-2 px-2 py-2">
            <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium truncate">{displayName}</span>
                    {user.name && (
                        <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                    )}
                </div>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">v{version}</span>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                >
                    <LogOut className="h-3 w-3 mr-1" />
                    退出登录
                </Button>
            </div>
        </div>
    )
}
