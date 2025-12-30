"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Save, CheckCircle2 } from "lucide-react"
import { updateSystemSettingAction } from "@/actions/config-actions"

interface EmailConfigProps {
    initialSettings: Record<string, string>
}

export function EmailConfigCard({ initialSettings }: EmailConfigProps) {
    const [apiKey, setApiKey] = useState(initialSettings.BREVO_API_KEY || "")
    const [emailFrom, setEmailFrom] = useState(initialSettings.EMAIL_FROM || "")
    const [isSaving, setIsSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)

    async function handleSave() {
        setIsSaving(true)
        try {
            await updateSystemSettingAction("BREVO_API_KEY", apiKey)
            await updateSystemSettingAction("EMAIL_FROM", emailFrom)
            setLastSaved(new Date())
            setTimeout(() => setLastSaved(null), 3000)
        } catch (error) {
            alert("保存失败")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Card className="md:col-span-3">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> 邮件通知配置</CardTitle>
                <CardDescription>配置 Brevo API 以通过邮件发送系统通知和到期提醒</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="api-key">Brevo API Key</Label>
                        <Input
                            id="api-key"
                            type="password"
                            placeholder="xkeysib-..."
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">在 Brevo 账户设置 {"->"} SMTP & API 中获取</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email-from">发件人邮箱</Label>
                        <Input
                            id="email-from"
                            placeholder="wealth-manager@oheng.com"
                            value={emailFrom}
                            onChange={(e) => setEmailFrom(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">必须是 Brevo 中已验证的发件人地址</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                        {isSaving ? "正在保存..." : <><Save className="h-4 w-4" /> 保存配置</>}
                    </Button>
                    {lastSaved && (
                        <span className="flex items-center gap-1 text-sm text-green-600 animate-in fade-in slide-in-from-left-2">
                            <CheckCircle2 className="h-4 w-4" /> 已保存于 {lastSaved.toLocaleTimeString()}
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
