"use client"

import { useState, useEffect } from "react"
import { Bell, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { NotificationList } from "./notification-list"
import {
    getNotificationsAction,
    getUnreadCountAction,
    markAllAsReadAction,
    type Notification,
} from "@/actions/notification-actions"

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const fetchNotifications = async () => {
        setIsLoading(true)
        try {
            const [notifs, count] = await Promise.all([
                getNotificationsAction(20),
                getUnreadCountAction(),
            ])
            setNotifications(notifs || [])
            setUnreadCount(count)
        } catch (error) {
            console.error("Failed to fetch notifications:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchNotifications()
        // 每30秒刷新一次
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [])

    const handleMarkAllAsRead = async () => {
        const result = await markAllAsReadAction()
        if (result.success) {
            setNotifications(prev =>
                prev.map(n => ({ ...n, isRead: true }))
            )
            setUnreadCount(0)
        }
    }

    const handleNotificationRead = (notificationId: string) => {
        setNotifications(prev =>
            prev.map(n =>
                n.id === notificationId ? { ...n, isRead: true } : n
            )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                        >
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h4 className="font-semibold">通知</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                            onClick={handleMarkAllAsRead}
                        >
                            <CheckCheck className="h-4 w-4 mr-1" />
                            全部已读
                        </Button>
                    )}
                </div>
                <NotificationList
                    notifications={notifications}
                    isLoading={isLoading}
                    onNotificationRead={handleNotificationRead}
                />
            </PopoverContent>
        </Popover>
    )
}
