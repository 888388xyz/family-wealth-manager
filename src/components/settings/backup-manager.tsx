"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
    adminFullBackupAction, 
    verifyBackupAction, 
    adminRestoreBackupAction 
} from "@/actions/backup-actions"
import { Download, Upload, Shield, AlertTriangle, CheckCircle } from "lucide-react"

interface BackupManagerProps {
    isAdmin: boolean
}

export function BackupManager({ isAdmin }: BackupManagerProps) {
    const [backupPassword, setBackupPassword] = useState("")
    const [restorePassword, setRestorePassword] = useState("")
    const [backupLoading, setBackupLoading] = useState(false)
    const [restoreLoading, setRestoreLoading] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
    const [backupStats, setBackupStats] = useState<any>(null)
    const [verifyResult, setVerifyResult] = useState<any>(null)

    if (!isAdmin) {
        return null
    }

    const handleBackup = async () => {
        if (!backupPassword || backupPassword.length < 8) {
            setMessage({ type: "error", text: "备份密码至少需要8位" })
            return
        }

        setBackupLoading(true)
        setMessage(null)

        try {
            const result = await adminFullBackupAction(backupPassword)
            
            if (result.error) {
                setMessage({ type: "error", text: result.error })
                return
            }

            if (result.data && result.filename) {
                // 创建下载
                const blob = new Blob([result.data], { type: "application/octet-stream" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = result.filename
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)

                setBackupStats(result.stats)
                setMessage({ type: "success", text: "备份已下载" })
            }
        } catch (error) {
            setMessage({ type: "error", text: "备份失败" })
        } finally {
            setBackupLoading(false)
            setBackupPassword("")
        }
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!restorePassword || restorePassword.length < 8) {
            setMessage({ type: "error", text: "请先输入备份密码" })
            return
        }

        setRestoreLoading(true)
        setMessage(null)
        setVerifyResult(null)

        try {
            const content = await file.text()
            const result = await verifyBackupAction(content, restorePassword)

            if (result.error) {
                setMessage({ type: "error", text: result.error })
                return
            }

            setVerifyResult({
                ...result,
                fileContent: content,
            })
            setMessage({ type: "success", text: "备份文件验证成功，请确认是否恢复" })
        } catch (error) {
            setMessage({ type: "error", text: "文件读取失败" })
        } finally {
            setRestoreLoading(false)
            e.target.value = ""
        }
    }

    const handleRestore = async () => {
        if (!verifyResult?.fileContent) return

        const confirmed = window.confirm(
            "⚠️ 警告：恢复操作将覆盖现有数据！\n\n" +
            "此操作不可撤销，请确保已备份当前数据。\n\n" +
            "确定要继续吗？"
        )

        if (!confirmed) return

        setRestoreLoading(true)
        setMessage(null)

        try {
            const result = await adminRestoreBackupAction(
                verifyResult.fileContent,
                restorePassword,
                {
                    restoreUsers: false, // 默认不恢复用户
                    restoreAccounts: true,
                    restoreConfig: true,
                    clearExisting: false, // 默认不清除现有数据
                }
            )

            if (result.error) {
                setMessage({ type: "error", text: result.error })
                return
            }

            setMessage({ 
                type: "success", 
                text: `恢复完成：${result.restored?.bankAccounts || 0} 个账户，${result.restored?.balanceHistory || 0} 条历史记录` 
            })
            setVerifyResult(null)
        } catch (error) {
            setMessage({ type: "error", text: "恢复失败" })
        } finally {
            setRestoreLoading(false)
            setRestorePassword("")
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    系统备份与恢复
                </CardTitle>
                <CardDescription>
                    管理员专用：导出或恢复完整系统数据（AES-256 加密）
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* 消息提示 */}
                {message && (
                    <div className={`flex items-center gap-2 p-3 rounded-md ${
                        message.type === "success" 
                            ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" 
                            : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                    }`}>
                        {message.type === "success" ? (
                            <CheckCircle className="h-4 w-4" />
                        ) : (
                            <AlertTriangle className="h-4 w-4" />
                        )}
                        {message.text}
                    </div>
                )}

                {/* 备份区域 */}
                <div className="space-y-3">
                    <h4 className="font-medium">创建备份</h4>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <Label htmlFor="backup-password" className="sr-only">备份密码</Label>
                            <Input
                                id="backup-password"
                                type="password"
                                placeholder="设置备份密码（至少8位）"
                                value={backupPassword}
                                onChange={(e) => setBackupPassword(e.target.value)}
                            />
                        </div>
                        <Button 
                            onClick={handleBackup} 
                            disabled={backupLoading || !backupPassword}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            {backupLoading ? "备份中..." : "下载备份"}
                        </Button>
                    </div>
                    {backupStats && (
                        <p className="text-sm text-muted-foreground">
                            上次备份：{backupStats.users} 用户，{backupStats.bankAccounts} 账户，
                            {backupStats.balanceHistory} 历史记录，{backupStats.dailySnapshots} 快照
                        </p>
                    )}
                </div>

                <div className="border-t pt-6 space-y-3">
                    <h4 className="font-medium">恢复备份</h4>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <Label htmlFor="restore-password" className="sr-only">备份密码</Label>
                            <Input
                                id="restore-password"
                                type="password"
                                placeholder="输入备份密码"
                                value={restorePassword}
                                onChange={(e) => setRestorePassword(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" asChild disabled={restoreLoading || !restorePassword}>
                            <label className="cursor-pointer">
                                <Upload className="h-4 w-4 mr-2" />
                                选择备份文件
                                <input
                                    type="file"
                                    accept=".enc"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                    disabled={restoreLoading || !restorePassword}
                                />
                            </label>
                        </Button>
                    </div>

                    {/* 验证结果 */}
                    {verifyResult && (
                        <div className="p-4 border rounded-md space-y-3">
                            <h5 className="font-medium">备份文件信息</h5>
                            <div className="text-sm space-y-1">
                                <p>版本：{verifyResult.version}</p>
                                <p>导出时间：{new Date(verifyResult.exportedAt).toLocaleString()}</p>
                                <p>导出者：{verifyResult.exportedBy}</p>
                                <p>
                                    包含：{verifyResult.stats?.users} 用户，
                                    {verifyResult.stats?.bankAccounts} 账户，
                                    {verifyResult.stats?.balanceHistory} 历史记录
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    variant="destructive" 
                                    onClick={handleRestore}
                                    disabled={restoreLoading}
                                >
                                    {restoreLoading ? "恢复中..." : "确认恢复"}
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={() => setVerifyResult(null)}
                                >
                                    取消
                                </Button>
                            </div>
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                        ⚠️ 恢复操作会将备份数据合并到现有数据中。如需完全覆盖，请先手动清理数据库。
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
