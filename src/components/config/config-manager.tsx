"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Building2, Tag, Coins } from "lucide-react"
import { addBankAction, deleteBankAction, addProductTypeAction, deleteProductTypeAction, addCurrencyAction, deleteCurrencyAction } from "@/actions/config-actions"

interface Bank { id: string; name: string }
interface ProductType { id: string; value: string; label: string }
interface Currency { id: string; code: string; label: string }

export function ConfigManager({ banks, productTypes, currencies }: { banks: Bank[]; productTypes: ProductType[]; currencies: Currency[] }) {
    const [newBank, setNewBank] = useState("")
    const [newTypeValue, setNewTypeValue] = useState("")
    const [newTypeLabel, setNewTypeLabel] = useState("")
    const [newCurrencyCode, setNewCurrencyCode] = useState("")
    const [newCurrencyLabel, setNewCurrencyLabel] = useState("")

    async function handleAddBank() {
        if (!newBank.trim()) return
        const result = await addBankAction(newBank)
        if (result.error) alert(result.error)
        else setNewBank("")
    }

    async function handleAddType() {
        if (!newTypeValue.trim() || !newTypeLabel.trim()) return
        const result = await addProductTypeAction(newTypeValue, newTypeLabel)
        if (result.error) alert(result.error)
        else { setNewTypeValue(""); setNewTypeLabel("") }
    }

    async function handleAddCurrency() {
        if (!newCurrencyCode.trim() || !newCurrencyLabel.trim()) return
        const result = await addCurrencyAction(newCurrencyCode, newCurrencyLabel)
        if (result.error) alert(result.error)
        else { setNewCurrencyCode(""); setNewCurrencyLabel("") }
    }

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> 平台管理</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input placeholder="新平台名称" value={newBank} onChange={(e) => setNewBank(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddBank()} />
                        <Button size="icon" onClick={handleAddBank}><Plus className="h-4 w-4" /></Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {banks.map((bank) => (
                            <Badge key={bank.id} variant="secondary" className="flex items-center gap-1 pr-1">
                                {bank.name}
                                <Button variant="ghost" size="icon" className="h-4 w-4 hover:bg-destructive/20" onClick={async () => {
                                    if (confirm(`确定删除 "${bank.name}" 吗？`)) {
                                        const result = await deleteBankAction(bank.id)
                                        if (result.error) alert(result.error)
                                    }
                                }}><X className="h-3 w-3" /></Button>
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5" /> 产品类型</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input placeholder="代码 (如 FUND)" value={newTypeValue} onChange={(e) => setNewTypeValue(e.target.value)} className="w-28" />
                        <Input placeholder="显示名称" value={newTypeLabel} onChange={(e) => setNewTypeLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddType()} />
                        <Button size="icon" onClick={handleAddType}><Plus className="h-4 w-4" /></Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {productTypes.map((type) => (
                            <Badge key={type.id} variant="secondary" className="flex items-center gap-1 pr-1">
                                {type.label}
                                <span className="text-xs text-muted-foreground">({type.value})</span>
                                <Button variant="ghost" size="icon" className="h-4 w-4 hover:bg-destructive/20" onClick={async () => {
                                    if (confirm(`确定删除 "${type.label}" 吗？`)) {
                                        const result = await deleteProductTypeAction(type.id)
                                        if (result.error) alert(result.error)
                                    }
                                }}><X className="h-3 w-3" /></Button>
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Coins className="h-5 w-5" /> 货币管理</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input placeholder="代码 (如 USD)" value={newCurrencyCode} onChange={(e) => setNewCurrencyCode(e.target.value)} className="w-24" />
                        <Input placeholder="显示名称" value={newCurrencyLabel} onChange={(e) => setNewCurrencyLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddCurrency()} />
                        <Button size="icon" onClick={handleAddCurrency}><Plus className="h-4 w-4" /></Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {currencies.map((curr) => (
                            <Badge key={curr.id} variant="secondary" className="flex items-center gap-1 pr-1">
                                {curr.label}
                                <span className="text-xs text-muted-foreground">({curr.code})</span>
                                <Button variant="ghost" size="icon" className="h-4 w-4 hover:bg-destructive/20" onClick={async () => {
                                    if (confirm(`确定删除 "${curr.label}" 吗？`)) {
                                        const result = await deleteCurrencyAction(curr.id)
                                        if (result.error) alert(result.error)
                                    }
                                }}><X className="h-3 w-3" /></Button>
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
