"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Check, X, Pencil } from "lucide-react"
import { deleteAccountAction, updateBalanceAction } from "@/actions/account-actions"
import { BANKS, ACCOUNT_TYPES } from "@/lib/constants"
import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"

interface Account {
    id: string
    bankName: string
    accountName: string
    accountType: string
    balance: number
    updatedAt: Date | null
}

function getBankLabel(value: string) {
    return BANKS.find(b => b.value === value)?.label || value
}

function getTypeLabel(value: string) {
    return ACCOUNT_TYPES.find(t => t.value === value)?.label || value
}

function formatBalance(cents: number) {
    return (cents / 100).toLocaleString("zh-CN", { minimumFractionDigits: 2 })
}

export function AccountTable({ accounts }: { accounts: Account[] }) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValue, setEditValue] = useState("")

    const handleEdit = (account: Account) => {
        setEditingId(account.id)
        setEditValue((account.balance / 100).toString())
    }

    const handleSave = async (accountId: string) => {
        const newBalance = parseFloat(editValue)
        if (!isNaN(newBalance) && newBalance >= 0) {
            await updateBalanceAction(accountId, newBalance)
        }
        setEditingId(null)
    }

    const handleCancel = () => {
        setEditingId(null)
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>银行</TableHead>
                        <TableHead>账户名称</TableHead>
                        <TableHead>类型</TableHead>
                        <TableHead className="text-right">余额</TableHead>
                        <TableHead>更新时间</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {accounts.map((account) => (
                        <TableRow key={account.id}>
                            <TableCell className="font-medium">{getBankLabel(account.bankName)}</TableCell>
                            <TableCell>{account.accountName}</TableCell>
                            <TableCell>{getTypeLabel(account.accountType)}</TableCell>
                            <TableCell className="text-right">
                                {editingId === account.id ? (
                                    <div className="flex items-center justify-end gap-1">
                                        <span>¥</span>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="w-32 h-8"
                                            autoFocus
                                        />
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleSave(account.id)}>
                                            <Check className="h-4 w-4 text-green-600" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancel}>
                                            <X className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-end gap-1">
                                        <span>¥{formatBalance(account.balance)}</span>
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(account)}>
                                            <Pencil className="h-3 w-3 text-muted-foreground" />
                                        </Button>
                                    </div>
                                )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {account.updatedAt
                                    ? formatDistanceToNow(new Date(account.updatedAt), { addSuffix: true, locale: zhCN })
                                    : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={async () => {
                                        if (confirm("确定删除此账户吗？")) {
                                            await deleteAccountAction(account.id)
                                        }
                                    }}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {accounts.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                暂无账户，点击右上角"添加账户"开始记录
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
