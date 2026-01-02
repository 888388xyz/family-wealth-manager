"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus, Check, ChevronsUpDown } from "lucide-react"
import { createGoalAction, updateGoalAction } from "@/actions/goal-actions"
import { cn } from "@/lib/utils"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

interface Account {
    id: string
    bankName: string
    accountName: string
}

interface Goal {
    id: string
    name: string
    targetAmount: number
    currentAmount: number | null
    currency: string | null
    deadline: string | null
    category: string | null
    notes: string | null
    linkedAccountIds: string[] | null
}

interface GoalDialogProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    goal?: Goal
    mode?: "create" | "edit"
    accounts?: Account[]
}

export function GoalDialog({ open, onOpenChange, goal, mode = "create", accounts = [] }: GoalDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    const isOpen = open !== undefined ? open : internalOpen
    const setIsOpen = onOpenChange || setInternalOpen

    const [name, setName] = useState(goal?.name || "")
    const [targetAmount, setTargetAmount] = useState(goal ? (goal.targetAmount / 100).toString() : "")
    const [currentAmount, setCurrentAmount] = useState(goal?.currentAmount ? (goal.currentAmount / 100).toString() : "0")
    const [deadline, setDeadline] = useState(goal?.deadline || "")
    const [category, setCategory] = useState(goal?.category || "savings")
    const [notes, setNotes] = useState(goal?.notes || "")
    const [linkedAccountIds, setLinkedAccountIds] = useState<string[]>(goal?.linkedAccountIds || [])
    const [openCombobox, setOpenCombobox] = useState(false)

    const resetForm = () => {
        if (!goal) {
            setName("")
            setTargetAmount("")
            setCurrentAmount("0")
            setDeadline("")
            setCategory("savings")
            setNotes("")
            setLinkedAccountIds([])
        }
    }

    const toggleAccount = (accountId: string) => {
        setLinkedAccountIds(current =>
            current.includes(accountId)
                ? current.filter(id => id !== accountId)
                : [...current, accountId]
        )
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        startTransition(async () => {
            if (mode === "edit" && goal) {
                await updateGoalAction(goal.id, {
                    name,
                    targetAmount: parseFloat(targetAmount) || 0,
                    currentAmount: parseFloat(currentAmount) || 0,
                    deadline: deadline || null,
                    category: category || null,
                    notes: notes || null,
                    linkedAccountIds: linkedAccountIds.length > 0 ? linkedAccountIds : null,
                })
            } else {
                await createGoalAction({
                    name,
                    targetAmount: parseFloat(targetAmount) || 0,
                    deadline: deadline || undefined,
                    category: category || undefined,
                    notes: notes || undefined,
                    linkedAccountIds: linkedAccountIds.length > 0 ? linkedAccountIds : undefined,
                })
            }
            setIsOpen(false)
            resetForm()
        })
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {mode === "create" && !open && (
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        新建目标
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{mode === "edit" ? "编辑目标" : "新建目标"}</DialogTitle>
                        <DialogDescription>
                            {mode === "edit" ? "修改您的财富目标" : "创建一个新的财富目标来追踪您的储蓄进度"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">目标名称</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="例如：购房首付"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>关联账户 (自动计算当前金额)</Label>
                            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openCombobox}
                                        className="justify-between"
                                    >
                                        {linkedAccountIds.length > 0
                                            ? `已选择 ${linkedAccountIds.length} 个账户`
                                            : "选择账户..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0">
                                    <Command>
                                        <CommandInput placeholder="搜索账户..." />
                                        <CommandList>
                                            <CommandEmpty>未找到账户</CommandEmpty>
                                            <CommandGroup>
                                                {accounts.map((account) => (
                                                    <CommandItem
                                                        key={account.id}
                                                        value={account.bankName + " " + account.accountName}
                                                        onSelect={() => toggleAccount(account.id)}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                linkedAccountIds.includes(account.id)
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                        {account.bankName} - {account.accountName}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            {linkedAccountIds.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {linkedAccountIds.map(id => {
                                        const acc = accounts.find(a => a.id === id)
                                        if (!acc) return null
                                        return (
                                            <Badge key={id} variant="secondary" className="px-2 py-0.5 text-xs">
                                                {acc.bankName}-{acc.accountName}
                                            </Badge>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="targetAmount">目标金额 (元)</Label>
                                <Input
                                    id="targetAmount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={targetAmount}
                                    onChange={(e) => setTargetAmount(e.target.value)}
                                    placeholder="100000"
                                    required
                                />
                            </div>
                            {mode === "edit" && (
                                <div className="grid gap-2">
                                    <Label htmlFor="currentAmount">当前金额 (元)</Label>
                                    <Input
                                        id="currentAmount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={currentAmount}
                                        onChange={(e) => setCurrentAmount(e.target.value)}
                                        placeholder="50000"
                                        disabled={linkedAccountIds.length > 0}
                                        className={cn(linkedAccountIds.length > 0 && "bg-muted")}
                                    />
                                    {linkedAccountIds.length > 0 && (
                                        <p className="text-[10px] text-muted-foreground">已关联账户，自动计算</p>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="category">目标类别</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="选择类别" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="savings">储蓄</SelectItem>
                                        <SelectItem value="investment">投资</SelectItem>
                                        <SelectItem value="emergency">应急</SelectItem>
                                        <SelectItem value="other">其他</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="deadline">截止日期</Label>
                                <Input
                                    id="deadline"
                                    type="date"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="notes">备注</Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="目标备注..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                            取消
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "保存中..." : "保存"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
