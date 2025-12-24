"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { updateProfileAction, changePasswordAction } from "@/actions/settings-actions"
import { exportDataAction } from "@/actions/backup-actions"
import { Badge } from "@/components/ui/badge"
import { Download } from "lucide-react"

interface User {
    id: string
    name: string | null
    email: string
    role: string | null
}

export function SettingsForm({ user }: { user: User }) {
    const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
    const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [isExporting, setIsExporting] = useState(false)

    async function handleProfileSubmit(formData: FormData) {
        setIsUpdatingProfile(true)
        setProfileMessage(null)
        const result = await updateProfileAction(formData)
        setIsUpdatingProfile(false)

        if (result.error) {
            setProfileMessage({ type: "error", text: result.error })
        } else {
            setProfileMessage({ type: "success", text: "昵称已更新" })
        }
    }

    async function handlePasswordSubmit(formData: FormData) {
        setIsChangingPassword(true)
        setPasswordMessage(null)
        const result = await changePasswordAction(formData)
        setIsChangingPassword(false)

        if (result.error) {
            setPasswordMessage({ type: "error", text: result.error })
        } else {
            setPasswordMessage({ type: "success", text: "密码已更新" })
        }
    }

    async function handleExport() {
        setIsExporting(true)
        const result = await exportDataAction()
        setIsExporting(false)

        if (result.error) {
            alert(result.error)
            return
        }

        // Download as JSON file
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `family-wealth-backup-${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    return (
        <div className="grid gap-6 max-w-2xl">
            {/* 个人信息 */}
            <Card>
                <CardHeader>
                    <CardTitle>个人信息</CardTitle>
                    <CardDescription>管理您的个人资料</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleProfileSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">邮箱</Label>
                            <Input id="email" value={user.email} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">角色</Label>
                            <div>
                                <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                                    {user.role === "ADMIN" ? "管理员" : "普通用户"}
                                </Badge>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">昵称</Label>
                            <Input id="name" name="name" defaultValue={user.name || ""} placeholder="输入昵称" />
                        </div>
                        {profileMessage && (
                            <p className={profileMessage.type === "error" ? "text-destructive text-sm" : "text-green-600 text-sm"}>
                                {profileMessage.text}
                            </p>
                        )}
                        <Button type="submit" disabled={isUpdatingProfile}>
                            {isUpdatingProfile ? "保存中..." : "保存"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* 修改密码 */}
            <Card>
                <CardHeader>
                    <CardTitle>修改密码</CardTitle>
                    <CardDescription>更新您的登录密码</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handlePasswordSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">当前密码</Label>
                            <Input id="currentPassword" name="currentPassword" type="password" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">新密码</Label>
                            <Input id="newPassword" name="newPassword" type="password" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">确认新密码</Label>
                            <Input id="confirmPassword" name="confirmPassword" type="password" />
                        </div>
                        {passwordMessage && (
                            <p className={passwordMessage.type === "error" ? "text-destructive text-sm" : "text-green-600 text-sm"}>
                                {passwordMessage.text}
                            </p>
                        )}
                        <Button type="submit" disabled={isChangingPassword}>
                            {isChangingPassword ? "更新中..." : "更新密码"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* 数据备份 */}
            <Card>
                <CardHeader>
                    <CardTitle>数据备份</CardTitle>
                    <CardDescription>导出您的数据以便备份</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            导出所有账户数据为 JSON 文件，可用于备份或迁移。
                        </p>
                        <Button onClick={handleExport} disabled={isExporting} variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            {isExporting ? "导出中..." : "导出数据"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
