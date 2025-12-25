"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { loginAction, verifyTOTPAction } from "@/actions/auth-actions"

type LoginStep = 'credentials' | 'totp'

export function LoginForm() {
    const router = useRouter()
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [step, setStep] = useState<LoginStep>('credentials')
    const [tempToken, setTempToken] = useState<string>("")
    const [totpCode, setTotpCode] = useState("")

    async function handleCredentialsSubmit(formData: FormData) {
        setError("")
        setIsLoading(true)

        try {
            const result = await loginAction(formData)

            if (result.success) {
                router.push("/dashboard")
                router.refresh()
            } else if (result.requires2FA && result.tempToken) {
                // 需要两步验证
                setTempToken(result.tempToken)
                setStep('totp')
            } else {
                setError(result.error || "登录失败")
            }
        } catch (err) {
            setError("登录失败，请稍后再试")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleTOTPSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            const result = await verifyTOTPAction(tempToken, totpCode)

            if (result.success) {
                router.push("/dashboard")
                router.refresh()
            } else {
                setError(result.error || "验证失败")
            }
        } catch (err) {
            setError("验证失败，请稍后再试")
        } finally {
            setIsLoading(false)
        }
    }

    function handleBackToCredentials() {
        setStep('credentials')
        setTempToken("")
        setTotpCode("")
        setError("")
    }

    // 两步验证输入界面
    if (step === 'totp') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>两步验证</CardTitle>
                    <CardDescription>请输入您的身份验证器应用中显示的验证码</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleTOTPSubmit}>
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="totpCode">验证码</Label>
                                <Input 
                                    id="totpCode" 
                                    name="totpCode" 
                                    type="text" 
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={6}
                                    placeholder="000000" 
                                    value={totpCode}
                                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    autoComplete="one-time-code"
                                    autoFocus
                                    required 
                                />
                                <p className="text-xs text-muted-foreground">
                                    请输入6位数字验证码
                                </p>
                            </div>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <Button type="submit" className="w-full" disabled={isLoading || totpCode.length !== 6}>
                                {isLoading ? "验证中..." : "验证"}
                            </Button>
                            <Button 
                                type="button" 
                                variant="ghost" 
                                className="w-full" 
                                onClick={handleBackToCredentials}
                                disabled={isLoading}
                            >
                                返回登录
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        )
    }

    // 凭证输入界面
    return (
        <Card>
            <CardHeader>
                <CardTitle>登录</CardTitle>
                <CardDescription>欢迎回到家庭财富管家</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={handleCredentialsSubmit}>
                    <div className="flex flex-col gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="email">邮箱</Label>
                            <Input id="email" name="email" type="email" placeholder="example@email.com" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">密码</Label>
                            <Input id="password" name="password" type="password" required />
                            <p className="text-xs text-muted-foreground">忘记密码请联系管理员重置</p>
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "登录中..." : "登录"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
