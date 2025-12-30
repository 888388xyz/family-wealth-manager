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
    const [testRecipient, setTestRecipient] = useState("")
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
            const result = await testEmailAction(testRecipient || undefined)
            if (result.error) alert(`测试失败: ${result.error}`)
            else alert(`测试邮件已发送至: ${testRecipient || "你的注册邮箱"}，请查收！`)
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

                    <div className="pt-2 border-t">
                        <div className="flex items-center justify-between mb-2">
                            <Label htmlFor="test-recipient" className="text-sm font-medium">配置测试</Label>
                        </div>
                        <div className="flex gap-2">
                            <Input
                                id="test-recipient"
                                placeholder="测试收件邮箱（可选）"
                                value={testRecipient}
                                className="h-9 text-sm flex-1"
                                onChange={(e: any) => setTestRecipient(e.target.value)}
                            />
                            <Button
                                variant="outline"
                                onClick={handleTest}
                                disabled={isTesting || isSaving}
                                size="sm"
                                className="h-9 gap-1"
                            >
                                {isTesting ? "发送中..." : <><Send className="h-4 w-4" /> 测试</>}
                            </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                            提示：该地址仅用于本次测试，正式通知将发送至用户注册邮箱。
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                    <Button onClick={handleSave} disabled={isSaving} className="flex-1 gap-2">
                        {isSaving ? "正在保存..." : <><Save className="h-4 w-4" /> 保存配置</>}
                    </Button>
                    {lastSaved && (
                        <div className="flex items-center gap-1 text-sm text-green-600 animate-in fade-in slide-in-from-right-2">
                            <CheckCircle2 className="h-4 w-4" /> 已保存
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
