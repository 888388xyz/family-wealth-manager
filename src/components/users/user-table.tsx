"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { updateUserRoleAction, deleteUserAction, resetUserPasswordAction, updateUserNameAction } from "@/actions/user-actions"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Trash2, UserCog, Mail, Calendar as CalendarIcon, Loader2, KeyRound, Pencil } from "lucide-react"

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
    const [resetPasswordDialog, setResetPasswordDialog] = useState<{ open: boolean; userId: string; email: string }>({ open: false, userId: "", email: "" })
    const [editNameDialog, setEditNameDialog] = useState<{ open: boolean; userId: string; name: string }>({ open: false, userId: "", name: "" })
    const [newPassword, setNewPassword] = useState("")
    const [newName, setNewName] = useState("")

    useEffect(() => { setMounted(true) }, [])

    async function handleRoleChange(userId: string, role: "ADMIN" | "MEMBER") {
        if (!confirm(`确定要将该用户的角色更改为 ${role === "ADMIN" ? "管理员" : "普通用户"} 吗？`)) {
            setResetCounter(c => c + 1)
            return
        }
        setLoading(userId)
        try {
            const result = await updateUserRoleAction(userId, role)
            if (result?.error) alert(result.error)
        } finally {
            setLoading(null)
        }
    }

    async function handleDelete(userId: string) {
        if (!confirm("确定要删除此用户吗？\n删除后该用户的所有资产数据也将被永久删除，此操作不可撤销。")) return
        setLoading(userId)
        try {
            const result = await deleteUserAction(userId)
            if (result?.error) alert(result.error)
            else alert("用户及相关数据已成功删除")
        } finally {
            setLoading(null)
        }
    }

    async function handleResetPassword() {
        if (!newPassword || newPassword.length < 6) {
            alert("密码长度至少为6位")
            return
        }
        setLoading(resetPasswordDialog.userId)
        try {
            const result = await resetUserPasswordAction(resetPasswordDialog.userId, newPassword)
            if (result?.error) alert(result.error)
            else {
                alert("密码已重置")
                setResetPasswordDialog({ open: false, userId: "", email: "" })
                setNewPassword("")
            }
        } finally {
            setLoading(null)
        }
    }

    async function handleUpdateName() {
        if (!newName.trim()) {
            alert("昵称不能为空")
            return
        }
        setLoading(editNameDialog.userId)
        try {
            const result = await updateUserNameAction(editNameDialog.userId, newName.trim())
            if (result?.error) alert(result.error)
            else {
                setEditNameDialog({ open: false, userId: "", name: "" })
                setNewName("")
            }
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
        <>
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
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <span>{user.name || "-"}</span>
                                        {user.id !== currentUserId && (
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                                                setEditNameDialog({ open: true, userId: user.id, name: user.name || "" })
                                                setNewName(user.name || "")
                                            }}>
                                                <Pencil className="h-3 w-3 text-muted-foreground" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {user.id === currentUserId ? (
                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-100">管理员 (你)</Badge>
                                    ) : (
                                        <Select key={`${user.id}-${user.role}-${resetCounter}`} defaultValue={user.role || "MEMBER"} onValueChange={(value) => handleRoleChange(user.id, value as "ADMIN" | "MEMBER")} disabled={loading === user.id}>
                                            <SelectTrigger className="w-[110px] h-8 text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ADMIN">管理员</SelectItem>
                                                <SelectItem value="MEMBER">普通用户</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">{user.createdAt ? format(user.createdAt, "yyyy-MM-dd HH:mm") : "-"}</TableCell>
                                <TableCell className="text-right">
                                    {user.id !== currentUserId && (
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" title="重置密码" onClick={() => {
                                                setResetPasswordDialog({ open: true, userId: user.id, email: user.email })
                                                setNewPassword("")
                                            }}>
                                                <KeyRound className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(user.id)} disabled={loading === user.id}>
                                                {loading === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {users.length === 0 && (
                            <TableRow><TableCell colSpan={5} className="text-center h-32 text-muted-foreground">暂无其他用户</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={resetPasswordDialog.open} onOpenChange={(open) => setResetPasswordDialog({ ...resetPasswordDialog, open })}>
                <DialogContent>
                    <DialogHeader><DialogTitle>重置密码 - {resetPasswordDialog.email}</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="newPassword">新密码</Label>
                            <Input id="newPassword" type="password" placeholder="至少6位" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setResetPasswordDialog({ open: false, userId: "", email: "" })}>取消</Button>
                        <Button onClick={handleResetPassword} disabled={loading === resetPasswordDialog.userId}>
                            {loading === resetPasswordDialog.userId ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}确认重置
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={editNameDialog.open} onOpenChange={(open) => setEditNameDialog({ ...editNameDialog, open })}>
                <DialogContent>
                    <DialogHeader><DialogTitle>修改昵称</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="newName">新昵称</Label>
                            <Input id="newName" placeholder="输入新昵称" value={newName} onChange={(e) => setNewName(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditNameDialog({ open: false, userId: "", name: "" })}>取消</Button>
                        <Button onClick={handleUpdateName} disabled={loading === editNameDialog.userId}>
                            {loading === editNameDialog.userId ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}保存
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
