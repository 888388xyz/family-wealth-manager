"use client"

import { Bell, TrendingUp, Calendar, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { markAsReadAction, type Notification } from "@/actions/notification-actions"

interface NotificationListProps {
    notifications: Notification[]
    isLoading: boolean
    onNotificationRead: (id: string) => void
}

function getNotificationIcon(type: string) {
    switch (type) {
        case "BALANCE_CHANGE":
            return <TrendingUp className="h-4 w-4 text-blue-500" />
        case "MATURITY_REMINDER":
            return <Calendar className="h-4 w-4 text-orange-500" />
        case "SYSTEM":
            return <Info className="h-4 w-4 text-gray-500" />
        default:
            return <Bell className="h-4 w-4 text-gray-500" />
    }
}

function formatTime(date: Date | null): string {
    if (!date) return ""
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "刚刚"
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return new Date(date).toLocaleDateString("zh-CN")
}

export function NotificationList({
    notifications,
    isLoading,
    onNotificationRead,
}: NotificationListProps) {
    const handleClick = async (notification: Notification) => {
        if (!notification.isRead) {
            const result = await markAsReadAction(notification.id)
            if (result.success) {
                onNotificationRead(notification.id)
            }
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">加载中...</div>
            </div>
        )
    }

    if (notifications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8">
                <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <div className="text-sm text-muted-foreground">暂无通知</div>
            </div>
        )
    }

    return (
        <div className="max-h-80 overflow-y-auto">
            {notifications.map((notification) => (
                <div
                    key={notification.id}
                    className={cn(
                        "flex gap-3 px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors border-b last:border-b-0",
                        !notification.isRead && "bg-accent/30"
                    )}
                    onClick={() => handleClick(notification)}
                >
                    <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <p className={cn(
                                "text-sm truncate",
                                !notification.isRead && "font-medium"
                            )}>
                                {notification.title}
                            </p>
                            {!notification.isRead && (
                                <span className="flex-shrink-0 h-2 w-2 rounded-full bg-primary" />
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {notification.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {formatTime(notification.createdAt)}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    )
}
