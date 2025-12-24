"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { addAccountAction } from "@/actions/account-actions"
import { BANKS, PRODUCT_TYPES, CURRENCIES } from "@/lib/constants"
import { Plus } from "lucide-react"

export function AddAccountDialog() {
    const [open, setOpen] = useState(false)

    async function handleSubmit(formData: FormData) {
        const res = await addAccountAction(formData)
        if (res?.success) {
            setOpen(false)
        } else {
            alert(JSON.stringify(res?.error))
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> 添加账户
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>添加新账户</DialogTitle>
                    <DialogDescription>
                        填写账户信息，点击保存添加到列表。
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="bankName" className="text-right">
                            平台
                        </Label>
                        <Select name="bankName" required>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="选择银行/平台" />
                            </SelectTrigger>
                            <SelectContent>
                                {BANKS.map((bank) => (
                                    <SelectItem key={bank.value} value={bank.value}>
                                        {bank.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="productType" className="text-right">
                            产品类型
                        </Label>
                        <Select name="productType" defaultValue="DEMAND_DEPOSIT">
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="选择产品类型" />
                            </SelectTrigger>
                            <SelectContent>
                                {PRODUCT_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="accountName" className="text-right">
                            产品名
                        </Label>
                        <Input
                            id="accountName"
                            name="accountName"
                            placeholder="如：博时主题基金"
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="currency" className="text-right">
                            货币
                        </Label>
                        <Select name="currency" defaultValue="CNY">
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="选择货币" />
                            </SelectTrigger>
                            <SelectContent>
                                {CURRENCIES.map((curr) => (
                                    <SelectItem key={curr.value} value={curr.value}>
                                        {curr.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="balance" className="text-right">
                            余额
                        </Label>
                        <Input
                            id="balance"
                            name="balance"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="expectedYield" className="text-right">
                            收益率%
                        </Label>
                        <Input
                            id="expectedYield"
                            name="expectedYield"
                            type="number"
                            step="0.01"
                            placeholder="如 2.50"
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
                            placeholder="可选"
                            className="col-span-3"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit">保存</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
