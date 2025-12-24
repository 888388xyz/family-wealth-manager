"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateUserRoleAction, deleteUserAction } from "@/actions/user-actions"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Trash2, UserCog, Mail, Calendar as CalendarIcon, Loader2 } from "lucide-react"

interface User {
    id: string
    name: string | null
    email: string
    role: string | null
    createdAt: Date | null
}

export function UserTable({ users, currentUserId }: { users: User[]; currentUserId: string }) {
    const [loading, setLoading] = useState<string | null>(null)
    const [mounted, setMounted] = useState(false)
    const [resetCounter, setResetCounter] = useState(0)

    useEffect(() => {
        setMounted(true)
    }, [])

    async function handleRoleChange(userId: string, role: "ADMIN" | "MEMBER") {
        if (!confirm(`确定要将该用户的角色更改为 ${role === "ADMIN" ? "管理员" : "普通用户"} 吗？`)) {
            setResetCounter(c => c + 1)
            return
        }
        setLoading(userId)
        try {
            const result = await updateUserRoleAction(userId, role)
            if (result?.error) {
                alert(result.error)
            }
        } catch (err) {
            alert("操作失败，请重试")
        } finally {
            setLoading(null)
        }
    }

    async function handleDelete(userId: string) {
        if (!confirm("确定要删除此用户吗？\n删除后该用户的所有资产数据也将被永久删除，此操作不可撤销。")) return

        setLoading(userId)
        try {
            const result = await deleteUserAction(userId)
            if (result?.error) {
                alert(result.error)
            } else {
                alert("用户及相关数据已成功删除")
            }
        } catch (err) {
            alert("删除过程中出现错误，请刷新页面重试")
        } finally {
            setLoading(null)
        }
    }

    if (!mounted) {
        return (
            <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-12 text-muted-foreground bg-muted/5">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>正在加载用户列表...</p>
            </div>
        )
    }

    return (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="py-4"><div className="flex items-center gap-2"><Mail className="h-4 w-4" /> 邮箱</div></TableHead>
                        <TableHead><div className="flex items-center gap-2"><UserCog className="h-4 w-4" /> 昵称</div></TableHead>
                        <TableHead>角色</TableHead>
                        <TableHead><div className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> 注册时间</div></TableHead>
                        <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="font-medium py-4">{user.email}</TableCell>
                            <TableCell>{user.name || "-"}</TableCell>
                            <TableCell>
                                {user.id === currentUserId ? (
                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-100">管理员 (你)</Badge>
                                ) : (
                                    <Select
                                        key={`${user.id}-${user.role}-${resetCounter}`}
                                        defaultValue={user.role || "MEMBER"}
                                        onValueChange={(value) => handleRoleChange(user.id, value as "ADMIN" | "MEMBER")}
                                        disabled={loading === user.id}
                                    >
                                        <SelectTrigger className="w-[110px] h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ADMIN">管理员</SelectItem>
                                            <SelectItem value="MEMBER">普通用户</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {user.createdAt ? format(user.createdAt, "yyyy-MM-dd HH:mm") : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                                {user.id !== currentUserId && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => handleDelete(user.id)}
                                        disabled={loading === user.id}
                                    >
                                        {loading === user.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                    {users.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">
                                暂无其他用户
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
