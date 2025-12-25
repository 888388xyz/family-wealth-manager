"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function LoginForm() {
    const router = useRouter()
    const [error, setError] = useState("")

    async function handleSubmit(formData: FormData) {
        const email = formData.get("email") as string
        const password = formData.get("password") as string

        const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
        })

        if (res?.error) {
            setError("邮箱或密码错误")
        } else {
            router.push("/dashboard")
            router.refresh()
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
                        <Button type="submit" className="w-full">
                            登录
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
