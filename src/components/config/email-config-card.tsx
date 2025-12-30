"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Save, CheckCircle2, Send } from "lucide-react"
import { updateSystemSettingAction, testEmailAction } from "@/actions/config-actions"

interface EmailConfigProps {
    initialSettings: Record<string, string>
}

export function EmailConfigCard({ initialSettings }: EmailConfigProps) {
    const [apiKey, setApiKey] = useState(initialSettings.BREVO_API_KEY || "")
    const [emailFrom, setEmailFrom] = useState(initialSettings.EMAIL_FROM || "")
    const [isSaving, setIsSaving] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
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

    async function handleTest() {
        setIsTesting(true)
        try {
            const result = await testEmailAction()
            if (result.error) alert(`测试失败: ${result.error}`)
            else alert("测试邮件已发送到你的注册邮箱，请查收！")
        } catch (error) {
            alert("测试请求失败")
        } finally {
            setIsTesting(false)
        }
    }

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" /> 邮件通知配置
                </CardTitle>
                <CardDescription>配置 Brevo API 以发送系统通知</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="api-key">Brevo API Key</Label>
                        <Input
                            id="api-key"
                            type="password"
                            placeholder="xkeysib-..."
                            value={apiKey}
                            onChange={(e: any) => setApiKey(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email-from">发件人邮箱</Label>
                        <Input
                            id="email-from"
                            placeholder="wealth-manager@oheng.com"
                            value={emailFrom}
                            onChange={(e: any) => setEmailFrom(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                    <Button onClick={handleSave} disabled={isSaving} size="sm" className="gap-2">
                        {isSaving ? "正在保存..." : <><Save className="h-4 w-4" /> 保存</>}
                    </Button>
                    <Button variant="outline" onClick={handleTest} disabled={isTesting || isSaving} size="sm" className="gap-2">
                        {isTesting ? "测试中..." : <><Send className="h-4 w-4" /> 测试</>}
                    </Button>
                    {lastSaved && (
                        <span className="flex items-center gap-1 text-sm text-green-600 animate-in fade-in slide-in-from-left-2 ml-auto">
                            <CheckCircle2 className="h-4 w-4" /> 已保存
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
