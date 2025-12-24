"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2 } from "lucide-react"
import { createUserAction } from "@/actions/user-actions"

export function AddUserDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError("")
        try {
            const result = await createUserAction(formData)
            if (result?.error) {
                setError(result.error)
            } else {
                setOpen(false)
            }
        } catch (err) {
            setError("发生未知错误")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    新增用户
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>新增用户</DialogTitle>
                    <DialogDescription>
                        为系统添加新用户。只有通过此处添加的用户才能登录。
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">邮箱</Label>
                            <Input id="email" name="email" type="email" placeholder="example@email.com" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="name">姓名/昵称</Label>
                            <Input id="name" name="name" placeholder="张三" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">初始密码</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="role">角色</Label>
                            <Select name="role" defaultValue="MEMBER">
                                <SelectTrigger>
                                    <SelectValue placeholder="选择角色" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MEMBER">普通用户</SelectItem>
                                    <SelectItem value="ADMIN">管理员</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {error && <p className="text-sm text-destructive mb-4">{error}</p>}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            取消
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            创建用户
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
