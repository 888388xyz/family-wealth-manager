"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { addAccountAction } from "@/actions/account-actions"
import { getBanksAction, getProductTypesAction, getCurrenciesAction } from "@/actions/config-actions"
import { Plus } from "lucide-react"
import type { CloneData } from "@/lib/account-utils"

interface Bank { id: string; name: string }
interface ProductType { id: string; value: string; label: string }
interface Currency { id: string; code: string; label: string }

interface AddAccountDialogProps {
    cloneFrom?: CloneData
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function AddAccountDialog({ cloneFrom, open: controlledOpen, onOpenChange }: AddAccountDialogProps = {}) {
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen
    const [banks, setBanks] = useState<Bank[]>([])
    const [productTypes, setProductTypes] = useState<ProductType[]>([])
    const [currencies, setCurrencies] = useState<Currency[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (open) {
            setLoading(true)
            Promise.all([getBanksAction(), getProductTypesAction(), getCurrenciesAction()])
                .then(([b, p, c]) => {
                    setBanks(b)
                    setProductTypes(p)
                    setCurrencies(c)
                })
                .finally(() => setLoading(false))
        }
    }, [open])

    async function handleSubmit(formData: FormData) {
        const res = await addAccountAction(formData)
        if (res?.success) setOpen(false)
        else alert(JSON.stringify(res?.error))
    }

    const isCloneMode = !!cloneFrom
    const dialogTitle = isCloneMode ? "克隆账户" : "添加新账户"
    const dialogDescription = isCloneMode 
        ? "基于现有账户创建新账户，请修改产品名称。" 
        : "填写账户信息，点击保存添加到列表。"

    // Get default values for selects
    const defaultBankName = cloneFrom?.bankName || ""
    const defaultProductType = cloneFrom?.productType || productTypes[0]?.value || ""
    const defaultCurrency = cloneFrom?.currency || currencies[0]?.code || "CNY"
    const defaultExpectedYield = cloneFrom?.expectedYield !== null && cloneFrom?.expectedYield !== undefined 
        ? (cloneFrom.expectedYield / 100).toString() 
        : ""
    const defaultNotes = cloneFrom?.notes || ""

    const dialogContent = (
        <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
                <DialogTitle>{dialogTitle}</DialogTitle>
                <DialogDescription>{dialogDescription}</DialogDescription>
            </DialogHeader>
            {loading ? (
                <div className="py-8 text-center text-muted-foreground">加载中...</div>
            ) : (
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="bankName" className="text-right">平台</Label>
                        <Select name="bankName" required defaultValue={defaultBankName}>
                            <SelectTrigger className="col-span-3"><SelectValue placeholder="选择银行/平台" /></SelectTrigger>
                            <SelectContent>
                                {banks.map((bank) => (
                                    <SelectItem key={bank.id} value={bank.name}>{bank.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="productType" className="text-right">产品类型</Label>
                        <Select name="productType" defaultValue={defaultProductType}>
                            <SelectTrigger className="col-span-3"><SelectValue placeholder="选择产品类型" /></SelectTrigger>
                            <SelectContent>
                                {productTypes.map((type) => (
                                    <SelectItem key={type.id} value={type.value}>{type.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="accountName" className="text-right">产品名</Label>
                        <Input 
                            id="accountName" 
                            name="accountName" 
                            placeholder="如：博时主题基金" 
                            className="col-span-3" 
                            required 
                            autoFocus={isCloneMode}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="currency" className="text-right">货币</Label>
                        <Select name="currency" defaultValue={defaultCurrency}>
                            <SelectTrigger className="col-span-3"><SelectValue placeholder="选择货币" /></SelectTrigger>
                            <SelectContent>
                                {currencies.map((curr) => (
                                    <SelectItem key={curr.id} value={curr.code}>{curr.label} ({curr.code})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="balance" className="text-right">余额</Label>
                        <Input 
                            id="balance" 
                            name="balance" 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            defaultValue="0"
                            className="col-span-3" 
                            required 
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="expectedYield" className="text-right">收益率%</Label>
                        <Input 
                            id="expectedYield" 
                            name="expectedYield" 
                            type="number" 
                            step="0.01" 
                            placeholder="如 2.50" 
                            defaultValue={defaultExpectedYield}
                            className="col-span-3" 
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="maturityDate" className="text-right">到期日期</Label>
                        <Input id="maturityDate" name="maturityDate" type="date" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="notes" className="text-right">备注</Label>
                        <Textarea 
                            id="notes" 
                            name="notes" 
                            placeholder="可选" 
                            defaultValue={defaultNotes}
                            className="col-span-3" 
                        />
                    </div>
                    <DialogFooter><Button type="submit">保存</Button></DialogFooter>
                </form>
            )}
        </DialogContent>
    )

    // If controlled (clone mode), don't render trigger
    if (isControlled) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                {dialogContent}
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> 添加账户</Button>
            </DialogTrigger>
            {dialogContent}
        </Dialog>
    )
}
