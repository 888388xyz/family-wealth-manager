"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn } from "next-auth/react"
import Link from "next/link"
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
                            <div className="flex items-center">
                                <Label htmlFor="password">密码</Label>
                                <Link href="#" className="ml-auto inline-block text-sm underline-offset-4 hover:underline">
                                    忘记密码？
                                </Link>
                            </div>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <Button type="submit" className="w-full">
                            登录
                        </Button>
                    </div>
                    <div className="mt-4 text-center text-sm">
                        没有账号？{" "}
                        <Link href="/register" className="underline underline-offset-4">
                            立即注册
                        </Link>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
