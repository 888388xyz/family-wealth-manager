"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { registerAction } from "@/actions/auth-actions"
import Link from "next/link"
import { useState } from "react"

export function RegisterForm() {
    const [error, setError] = useState("")

    async function handleSubmit(formData: FormData) {
        const res = await registerAction(formData)
        if (res?.error) {
            setError(res.error)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>注册</CardTitle>
                <CardDescription>创建您的家庭财富管家账号</CardDescription>
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
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <Button type="submit" className="w-full">
                            注册
                        </Button>
                    </div>
                    <div className="mt-4 text-center text-sm">
                        已有账号？{" "}
                        <Link href="/login" className="underline underline-offset-4">
                            立即登录
                        </Link>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
