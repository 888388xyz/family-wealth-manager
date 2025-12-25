"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Check, X, Pencil, ArrowUpDown, ArrowUp, ArrowDown, Search, Settings2 } from "lucide-react"
import { deleteAccountAction, updateBalanceAction } from "@/actions/account-actions"
import { useState, useEffect, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { EditAccountDialog } from "./edit-account-dialog"

interface Account {
    id: string
    bankName: string
    accountName: string
    productType: string | null
    accountType: string
    currency: string | null
    balance: number
    expectedYield: number | null
    notes: string | null
    updatedAt: Date | null
    user?: { name: string | null; email: string }
}

interface ProductType { id: string; value: string; label: string }
interface Bank { id: string; name: string }
interface Currency { id: string; code: string; label: string }

type SortField = "所有者" | "bankName" | "accountName" | "productType" | "币种" | "余额" | "expectedYield"
type SortDirection = "asc" | "desc" | null

function getCurrencySymbol(currency: string | null) {
    switch (currency) {
        case "USD": return "$"
        case "HKD": return "HK$"
        case "EUR": return "E"
        default: return "Y"
    }
}

function formatBalance(cents: number) {
    return (cents / 100).toLocaleString("zh-CN", { minimumFractionDigits: 2 })
}

function formatYield(yieldValue: number | null) {
    if (yieldValue === null) return "-"
    return (yieldValue / 100).toFixed(2) + "%"
}

interface AccountTableProps {
    accounts: Account[]
    isAdmin?: boolean
    productTypes?: ProductType[]
    banks?: Bank[]
    currencies?: Currency[]
}

export function AccountTable({ 
    accounts, 
    isAdmin,
    productTypes = [],
    banks = [],
    currencies = []
}: AccountTableProps) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValue, setEditValue] = useState("")
    const [mounted, setMounted] = useState(false)
    const [searchText, setSearchText] = useState("")
    const [filterBank, setFilterBank] = useState<string>("全部")
    const [filterType, setFilterType] = useState<string>("全部")
    const [filterCurrency, setFilterCurrency] = useState<string>("全部")
    const [filterOwner, setFilterOwner] = useState<string>("全部")
    const [sortField, setSortField] = useState<SortField | null>(null)
    const [sortDirection, setSortDirection] = useState<SortDirection>(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editingAccount, setEditingAccount] = useState<Account | null>(null)

    useEffect(() => { setMounted(true) }, [])

    const uniqueBanks = useMemo(() => [...new Set(accounts.map(a => a.bankName))].sort(), [accounts])
    const uniqueTypes = useMemo(() => [...new Set(accounts.map(a => a.productType).filter(Boolean))].sort(), [accounts])
    const uniqueCurrencies = useMemo(() => [...new Set(accounts.map(a => a.currency || "CNY"))].sort(), [accounts])
    const uniqueOwners = useMemo(() => {
        if (!isAdmin) return []
        return [...new Set(accounts.map(a => a.user?.name || "Unknown"))].sort()
    }, [accounts, isAdmin])

    const productTypeMap = useMemo(() => {
        const map = new Map<string, string>()
        productTypes.forEach(t => map.set(t.value, t.label))
        return map
    }, [productTypes])

    const getProductTypeLabel = (value: string | null) => {
        if (!value) return "-"
        return productTypeMap.get(value) || value
    }

    const filteredAndSortedAccounts = useMemo(() => {
        let result = [...accounts]
        if (searchText) {
            const lower = searchText.toLowerCase()
            result = result.filter(a => 
                a.bankName.toLowerCase().includes(lower) ||
                a.accountName.toLowerCase().includes(lower) ||
                (a.user?.name?.toLowerCase().includes(lower))
            )
        }
        if (filterBank !== "全部") result = result.filter(a => a.bankName === filterBank)
        if (filterType !== "全部") result = result.filter(a => a.productType === filterType)
        if (filterCurrency !== "全部") result = result.filter(a => (a.currency || "CNY") === filterCurrency)
        if (filterOwner !== "全部" && isAdmin) result = result.filter(a => (a.user?.name || "Unknown") === filterOwner)

        if (sortField && sortDirection) {
            result.sort((a, b) => {
                let aVal: any, bVal: any
                switch (sortField) {
                    case "所有者": aVal = a.user?.name || ""; bVal = b.user?.name || ""; break
                    case "bankName": aVal = a.bankName; bVal = b.bankName; break
                    case "accountName": aVal = a.accountName; bVal = b.accountName; break
                    case "productType": aVal = a.productType || ""; bVal = b.productType || ""; break
                    case "币种": aVal = a.currency || "CNY"; bVal = b.currency || "CNY"; break
                    case "余额": aVal = a.balance; bVal = b.balance; break
                    case "expectedYield": aVal = a.expectedYield || 0; bVal = b.expectedYield || 0; break
                    default: return 0
                }
                if (typeof aVal === "string") return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
                return sortDirection === "asc" ? aVal - bVal : bVal - aVal
            })
        }
        return result
    }, [accounts, searchText, filterBank, filterType, filterCurrency, filterOwner, sortField, sortDirection, isAdmin])

    const filteredTotal = useMemo(() => filteredAndSortedAccounts.reduce((sum, a) => sum + a.balance, 0), [filteredAndSortedAccounts])

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            if (sortDirection === "asc") setSortDirection("desc")
            else if (sortDirection === "desc") { setSortField(null); setSortDirection(null) }
            else setSortDirection("asc")
        } else { setSortField(field); setSortDirection("asc") }
    }

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
        if (sortDirection === "asc") return <ArrowUp className="h-3 w-3 ml-1" />
        return <ArrowDown className="h-3 w-3 ml-1" />
    }

    const handleEdit = (account: Account) => { setEditingId(account.id); setEditValue((account.balance / 100).toString()) }
    const handleSave = async (accountId: string) => {
        const newBalance = parseFloat(editValue)
        if (!isNaN(newBalance) && newBalance >= 0) await updateBalanceAction(accountId, newBalance)
        setEditingId(null)
    }
    const handleOpenEditDialog = (account: Account) => {
        setEditingAccount(account)
        setEditDialogOpen(true)
    }
    const clearFilters = () => { setSearchText(""); setFilterBank("全部"); setFilterType("全部"); setFilterCurrency("全部"); setFilterOwner("全部"); setSortField(null); setSortDirection(null) }
    const hasFilters = searchText || filterBank !== "全部" || filterType !== "全部" || filterCurrency !== "全部" || filterOwner !== "全部"

    if (!mounted) return <div className="rounded-md border p-8 text-center text-muted-foreground">加载中...</div>

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="搜索..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="pl-9" />
                </div>
                <Select value={filterBank} onValueChange={setFilterBank}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="平台" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="全部">所有平台</SelectItem>
                        {uniqueBanks.map(bank => <SelectItem key={bank} value={bank}>{bank}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="产品类型" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="全部">所有类型</SelectItem>
                        {uniqueTypes.map(type => <SelectItem key={type!} value={type!}>{getProductTypeLabel(type)}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterCurrency} onValueChange={setFilterCurrency}>
                    <SelectTrigger className="w-[120px]"><SelectValue placeholder="币种" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="全部">All</SelectItem>
                        {uniqueCurrencies.map(curr => <SelectItem key={curr} value={curr}>{curr}</SelectItem>)}
                    </SelectContent>
                </Select>
                {isAdmin && uniqueOwners.length > 1 && (
                    <Select value={filterOwner} onValueChange={setFilterOwner}>
                        <SelectTrigger className="w-[120px]"><SelectValue placeholder="所有者" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="全部">所有用户</SelectItem>
                            {uniqueOwners.map(owner => <SelectItem key={owner} value={owner}>{owner}</SelectItem>)}
                        </SelectContent>
                    </Select>
                )}
                {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters}>Clear</Button>}
            </div>
            {hasFilters && <div className="text-sm text-muted-foreground">筛选结果： {filteredAndSortedAccounts.length} 个账户，合计： {formatBalance(filteredTotal)}</div>}
            <div className="rounded-md border">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            {isAdmin && <TableHead className="cursor-pointer hover:bg-muted/50 font-semibold" onClick={() => handleSort("所有者")}><div className="flex items-center">Owner<SortIcon field="所有者" /></div></TableHead>}
                            <TableHead className="cursor-pointer hover:bg-muted/50 font-semibold" onClick={() => handleSort("bankName")}><div className="flex items-center">Bank<SortIcon field="bankName" /></div></TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50 font-semibold" onClick={() => handleSort("accountName")}><div className="flex items-center">Name<SortIcon field="accountName" /></div></TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50 font-semibold" onClick={() => handleSort("productType")}><div className="flex items-center">Type<SortIcon field="productType" /></div></TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50 font-semibold" onClick={() => handleSort("币种")}><div className="flex items-center">Currency<SortIcon field="币种" /></div></TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50 text-right font-semibold" onClick={() => handleSort("余额")}><div className="flex items-center justify-end">Balance<SortIcon field="余额" /></div></TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50 text-right font-semibold" onClick={() => handleSort("expectedYield")}><div className="flex items-center justify-end">Yield<SortIcon field="expectedYield" /></div></TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedAccounts.map((account) => (
                            <TableRow key={account.id}>
                                {isAdmin && <TableCell><span className="text-sm font-medium">{account.user?.name || "Unknown"}</span></TableCell>}
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
                                            <span>{getCurrencySymbol(account.currency)} {formatBalance(account.balance)}</span>
                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(account)}><Pencil className="h-3 w-3 text-muted-foreground" /></Button>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">{formatYield(account.expectedYield)}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(account)}>
                                        <Settings2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={async () => { if (confirm("确定要删除此账户吗？")) { const result = await deleteAccountAction(account.id); if (result?.error) alert(result.error) } }}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredAndSortedAccounts.length === 0 && (
                            <TableRow><TableCell colSpan={isAdmin ? 8 : 7} className="text-center h-24 text-muted-foreground">{hasFilters ? "没有匹配的账户" : "暂无账户"}</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {editingAccount && (
                <EditAccountDialog
                    account={editingAccount}
                    open={editDialogOpen}
                    onOpenChange={(open) => {
                        setEditDialogOpen(open)
                        if (!open) setEditingAccount(null)
                    }}
                    banks={banks}
                    productTypes={productTypes}
                    currencies={currencies}
                />
            )}
        </div>
    )
}
