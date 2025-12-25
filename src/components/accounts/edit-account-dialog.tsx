"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { updateAccountAction } from "@/actions/account-actions"

interface Bank {
    id: string
    name: string
}

interface ProductType {
    id: string
    value: string
    label: string
}

interface Currency {
    id: string
    code: string
    label: string
}

interface Account {
    id: string
    bankName: string
    accountName: string
    productType: string | null
    currency: string | null
    expectedYield: number | null
    maturityDate: string | null
    notes: string | null
}

interface EditAccountDialogProps {
    account: Account
    open: boolean
    onOpenChange: (open: boolean) => void
    banks: Bank[]
    productTypes: ProductType[]
    currencies: Currency[]
}

export function EditAccountDialog({
    account,
    open,
    onOpenChange,
    banks,
    productTypes,
    currencies,
}: EditAccountDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true)
        try {
            const expectedYieldRaw = formData.get("expectedYield") as string
            const expectedYieldValue = expectedYieldRaw ? parseFloat(expectedYieldRaw) : null
            const maturityDateRaw = formData.get("maturityDate") as string
            const maturityDateValue = maturityDateRaw && maturityDateRaw.trim() !== "" ? maturityDateRaw : null

            const data = {
                bankName: formData.get("bankName") as string,
                accountName: formData.get("accountName") as string,
                productType: formData.get("productType") as string,
                currency: formData.get("currency") as string,
                expectedYield: expectedYieldValue,
                maturityDate: maturityDateValue,
                notes: (formData.get("notes") as string) || null,
            }

            const result = await updateAccountAction(account.id, data)
            if (result?.success) {
                onOpenChange(false)
            } else {
                alert(typeof result?.error === "string" ? result.error : JSON.stringify(result?.error))
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    // Convert expectedYield from storage format (basis points) to display format (percentage)
    const displayYield = account.expectedYield !== null ? (account.expectedYield / 100).toFixed(2) : ""

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>编辑账户</DialogTitle>
                    <DialogDescription>
                        修改账户信息，点击保存更新。
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="bankName" className="text-right">
                            平台
                        </Label>
                        <Select name="bankName" defaultValue={account.bankName} required>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="选择银行/平台" />
                            </SelectTrigger>
                            <SelectContent>
                                {banks.map((bank) => (
                                    <SelectItem key={bank.id} value={bank.name}>
                                        {bank.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="accountName" className="text-right">
                            产品名称
                        </Label>
                        <Input
                            id="accountName"
                            name="accountName"
                            defaultValue={account.accountName}
                            placeholder="如：博时主题基金"
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="productType" className="text-right">
                            产品类型
                        </Label>
                        <Select
                            name="productType"
                            defaultValue={account.productType || productTypes[0]?.value}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="选择产品类型" />
                            </SelectTrigger>
                            <SelectContent>
                                {productTypes.map((type) => (
                                    <SelectItem key={type.id} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="currency" className="text-right">
                            币种
                        </Label>
                        <Select
                            name="currency"
                            defaultValue={account.currency || currencies[0]?.code || "CNY"}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="选择货币" />
                            </SelectTrigger>
                            <SelectContent>
                                {currencies.map((curr) => (
                                    <SelectItem key={curr.id} value={curr.code}>
                                        {curr.label} ({curr.code})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="expectedYield" className="text-right">
                            预期收益率%
                        </Label>
                        <Input
                            id="expectedYield"
                            name="expectedYield"
                            type="number"
                            step="0.01"
                            defaultValue={displayYield}
                            placeholder="如 2.50"
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="maturityDate" className="text-right">
                            到期日期
                        </Label>
                        <Input
                            id="maturityDate"
                            name="maturityDate"
                            type="date"
                            defaultValue={account.maturityDate || ""}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="notes" className="text-right">
                            备注
                        </Label>
                        <Textarea
                            id="notes"
                            name="notes"
                            defaultValue={account.notes || ""}
                            placeholder="可选"
                            className="col-span-3"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            取消
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "保存中..." : "保存"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
