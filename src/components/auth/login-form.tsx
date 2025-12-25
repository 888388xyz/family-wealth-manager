"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { loginAction } from "@/actions/auth-actions"

export function LoginForm() {
    const router = useRouter()
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setError("")
        setIsLoading(true)

        try {
            const result = await loginAction(formData)

            if (result.success) {
                router.push("/dashboard")
                router.refresh()
            } else {
                setError(result.error || "登录失败")
            }
        } catch (err) {
            setError("登录失败，请稍后再试")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>登录</CardTitle>
                <CardDescription>欢迎回到家庭财富管家</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit}>
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
