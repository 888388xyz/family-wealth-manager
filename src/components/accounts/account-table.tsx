"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Check, X, Pencil, ArrowUpDown, ArrowUp, ArrowDown, Search, Settings2, Copy } from "lucide-react"
import { deleteAccountAction, updateBalanceAction } from "@/actions/account-actions"
import { useState, useEffect, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EditAccountDialog } from "./edit-account-dialog"
import { AddAccountDialog } from "./add-account-dialog"
import { createCloneData, type CloneData } from "@/lib/account-utils"
import { AccountTagBadges } from "./account-tag-badges"

interface Account {
    id: string
    bankName: string
    accountName: string
    productType: string | null
    accountType: string
    currency: string | null
    balance: number
    expectedYield: number | null
    maturityDate: string | null
    notes: string | null
    updatedAt: Date | null
    user?: { name: string | null; email: string }
}

interface ProductType { id: string; value: string; label: string }
interface Bank { id: string; name: string }
interface Currency { id: string; code: string; label: string }
interface ExchangeRate { code: string; rate: string }

type SortField = "所有者" | "bankName" | "accountName" | "productType" | "币种" | "余额" | "expectedYield"
type SortDirection = "asc" | "desc" | null

function getCurrencySymbol(currency: string | null) {
    switch (currency) {
        case "USD": return "$"
        case "HKD": return "HK$"
        case "EUR": return "€"
        case "CNY":
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

// 骨架屏行组件
function SkeletonRow({ columns }: { columns: number }) {
    return (
        <TableRow>
            {Array.from({ length: columns }).map((_, i) => (
                <TableCell key={i}>
                    <Skeleton className="h-4 w-full" />
                </TableCell>
            ))}
        </TableRow>
    )
}

// 表格骨架屏
function TableSkeleton({ rows = 5, columns = 7 }: { rows?: number; columns?: number }) {
    return (
        <div className="space-y-4">
            {/* 筛选栏骨架 */}
            <div className="flex flex-wrap gap-3 items-center">
                <Skeleton className="h-9 w-[200px]" />
                <Skeleton className="h-9 w-[140px]" />
                <Skeleton className="h-9 w-[140px]" />
                <Skeleton className="h-9 w-[120px]" />
            </div>
            {/* 表格骨架 */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            {Array.from({ length: columns }).map((_, i) => (
                                <TableHead key={i}>
                                    <Skeleton className="h-4 w-16" />
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: rows }).map((_, i) => (
                            <SkeletonRow key={i} columns={columns} />
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

interface AccountTableProps {
    accounts: Account[]
    isAdmin?: boolean
    productTypes?: ProductType[]
    banks?: Bank[]
    currencies?: Currency[]
    exchangeRates?: ExchangeRate[]
}

export function AccountTable({
    accounts,
    isAdmin,
    productTypes = [],
    banks = [],
    currencies = [],
    exchangeRates = []
}: AccountTableProps) {
    const searchParams = useSearchParams()
    const router = useRouter()

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
    const [cloneDialogOpen, setCloneDialogOpen] = useState(false)
    const [cloneData, setCloneData] = useState<CloneData | null>(null)

    // Initialize filters from URL search params
    useEffect(() => {
        const bankParam = searchParams.get("bank")
        const typeParam = searchParams.get("type")
        const currencyParam = searchParams.get("currency")

        if (bankParam) setFilterBank(bankParam)
        if (typeParam) setFilterType(typeParam)
        if (currencyParam) setFilterCurrency(currencyParam)
    }, [searchParams])

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

    // Build exchange rates map for currency conversion
    const ratesMap = useMemo(() => {
        const map = new Map<string, number>()
        map.set("CNY", 1.0)
        exchangeRates.forEach(r => map.set(r.code, parseFloat(r.rate)))
        return map
    }, [exchangeRates])

    const filteredTotal = useMemo(() => {
        return filteredAndSortedAccounts.reduce((sum, a) => {
            const currency = a.currency || "CNY"
            const rate = ratesMap.get(currency) || 1.0
            // Convert to CNY: for foreign currencies, multiply by rate (rate is X CNY per 1 unit)
            const balanceInCNY = currency === "CNY" ? a.balance : a.balance * rate
            return sum + balanceInCNY
        }, 0)
    }, [filteredAndSortedAccounts, ratesMap])

    // Check if filtered results contain any foreign currency accounts
    const hasMultipleCurrencies = useMemo(() => {
        const currencies = new Set(filteredAndSortedAccounts.map(a => a.currency || "CNY"))
        return currencies.size > 1 || (currencies.size === 1 && !currencies.has("CNY"))
    }, [filteredAndSortedAccounts])

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
    const handleClone = (account: Account) => {
        const data = createCloneData(account)
        setCloneData(data)
        setCloneDialogOpen(true)
    }
    const clearFilters = () => {
        setSearchText("");
        setFilterBank("全部");
        setFilterType("全部");
        setFilterCurrency("全部");
        setFilterOwner("全部");
        setSortField(null);
        setSortDirection(null);
        // Clear URL params
        router.push("/accounts")
    }
    const hasFilters = searchText || filterBank !== "全部" || filterType !== "全部" || filterCurrency !== "全部" || filterOwner !== "全部"

    if (!mounted) return <TableSkeleton rows={5} columns={isAdmin ? 8 : 7} />

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
            {hasFilters && <div className="text-sm text-muted-foreground">筛选结果： {filteredAndSortedAccounts.length} 个账户，合计： ¥{formatBalance(filteredTotal)}{hasMultipleCurrencies && " (折算CNY)"}</div>}
            <div className="rounded-md border">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            {isAdmin && <TableHead className="cursor-pointer hover:bg-muted/50 font-semibold" onClick={() => handleSort("所有者")}><div className="flex items-center">所有者<SortIcon field="所有者" /></div></TableHead>}
                            <TableHead className="cursor-pointer hover:bg-muted/50 font-semibold" onClick={() => handleSort("bankName")}><div className="flex items-center">平台<SortIcon field="bankName" /></div></TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50 font-semibold" onClick={() => handleSort("accountName")}><div className="flex items-center">产品名称<SortIcon field="accountName" /></div></TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50 font-semibold" onClick={() => handleSort("productType")}><div className="flex items-center">产品类型<SortIcon field="productType" /></div></TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50 font-semibold" onClick={() => handleSort("币种")}><div className="flex items-center">币种<SortIcon field="币种" /></div></TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50 text-right font-semibold" onClick={() => handleSort("余额")}><div className="flex items-center justify-end">余额<SortIcon field="余额" /></div></TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50 text-right font-semibold" onClick={() => handleSort("expectedYield")}><div className="flex items-center justify-end">预期收益<SortIcon field="expectedYield" /></div></TableHead>
                            <TableHead className="font-semibold">标签</TableHead>
                            <TableHead className="text-right font-semibold">操作</TableHead>
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
                                <TableCell><AccountTagBadges accountId={account.id} /></TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleClone(account)} title="克隆账户">
                                        <Copy className="h-4 w-4 text-muted-foreground" />
                                    </Button>
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
                            <TableRow><TableCell colSpan={isAdmin ? 9 : 8} className="text-center h-24 text-muted-foreground">{hasFilters ? "没有匹配的账户" : "暂无账户"}</TableCell></TableRow>
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
            {cloneData && (
                <AddAccountDialog
                    cloneFrom={cloneData}
                    open={cloneDialogOpen}
                    onOpenChange={(open) => {
                        setCloneDialogOpen(open)
                        if (!open) setCloneData(null)
                    }}
                />
            )}
        </div>
    )
}
