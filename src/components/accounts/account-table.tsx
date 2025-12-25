"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Check, X, Pencil } from "lucide-react"
import { deleteAccountAction, updateBalanceAction } from "@/actions/account-actions"
import { PRODUCT_TYPES } from "@/lib/constants"
import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"

interface Account {
    id: string
    bankName: string
    accountName: string
    productType: string | null
    accountType: string
    currency: string | null
    balance: number
    expectedYield: number | null
    updatedAt: Date | null
    user?: { name: string | null; email: string }
}

function getProductTypeLabel(value: string | null) {
    if (!value) return "-"
    return PRODUCT_TYPES.find(t => t.value === value)?.label || value
}

function getCurrencySymbol(currency: string | null) {
    switch (currency) {
        case "USD": return "$"
        case "HKD": return "HK$"
        case "EUR": return "€"
        default: return "¥"
    }
}

function formatBalance(cents: number) {
    return (cents / 100).toLocaleString("zh-CN", { minimumFractionDigits: 2 })
}

function formatYield(yieldValue: number | null) {
    if (yieldValue === null) return "-"
    return (yieldValue / 100).toFixed(2) + "%"
}

export function AccountTable({ accounts, isAdmin }: { accounts: Account[]; isAdmin?: boolean }) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValue, setEditValue] = useState("")
    const [mounted, setMounted] = useState(false)

    useEffect(() => { setMounted(true) }, [])

    if (!mounted) {
        return <div className="rounded-md border p-8 text-center text-muted-foreground">正在加载账户数据...</div>
    }

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

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        {isAdmin && <TableHead>所有者</TableHead>}
                        <TableHead>平台</TableHead>
                        <TableHead>产品名</TableHead>
                        <TableHead>类型</TableHead>
                        <TableHead>货币</TableHead>
                        <TableHead className="text-right">余额</TableHead>
                        <TableHead className="text-right">收益率</TableHead>
                        <TableHead>更新时间</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {accounts.map((account) => (
                        <TableRow key={account.id}>
                            {isAdmin && (
                                <TableCell>
                                    <span className="text-sm font-medium">{account.user?.name || "未知"}</span>
                                </TableCell>
                            )}
                            <TableCell className="font-medium">{account.bankName}</TableCell>
                            <TableCell>{account.accountName}</TableCell>
                            <TableCell><Badge variant="secondary">{getProductTypeLabel(account.productType)}</Badge></TableCell>
                            <TableCell><Badge variant="outline">{account.currency || "CNY"}</Badge></TableCell>
                            <TableCell className="text-right">
                                {editingId === account.id ? (
                                    <div className="flex items-center justify-end gap-1">
                                        <span>{getCurrencySymbol(account.currency)}</span>
                                        <Input type="number" step="0.01" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-32 h-8" autoFocus />
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleSave(account.id)}><Check className="h-4 w-4 text-green-600" /></Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}><X className="h-4 w-4 text-muted-foreground" /></Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-end gap-1">
                                        <span>{getCurrencySymbol(account.currency)}{formatBalance(account.balance)}</span>
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(account)}><Pencil className="h-3 w-3 text-muted-foreground" /></Button>
                                    </div>
                                )}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">{formatYield(account.expectedYield)}</TableCell>
                            <TableCell className="text-muted-foreground">
                                {account.updatedAt ? formatDistanceToNow(new Date(account.updatedAt), { addSuffix: true, locale: zhCN }) : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={async () => {
                                    if (confirm("确定删除此账户吗？")) {
                                        const result = await deleteAccountAction(account.id)
                                        if (result?.error) alert(result.error)
                                    }
                                }}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {accounts.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={isAdmin ? 9 : 8} className="text-center h-24 text-muted-foreground">
                                暂无账户，点击右上角"添加账户"开始记录
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
