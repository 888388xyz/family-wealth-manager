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
import { Plus } from "lucide-react"
import { createGoalAction, updateGoalAction } from "@/actions/goal-actions"

interface Goal {
    id: string
    name: string
    targetAmount: number
    currentAmount: number | null
    currency: string | null
    deadline: string | null
    category: string | null
    notes: string | null
}

interface GoalDialogProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    goal?: Goal
    mode?: "create" | "edit"
}

export function GoalDialog({ open, onOpenChange, goal, mode = "create" }: GoalDialogProps) {
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

    const resetForm = () => {
        if (!goal) {
            setName("")
            setTargetAmount("")
            setCurrentAmount("0")
            setDeadline("")
            setCategory("savings")
            setNotes("")
        }
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
                })
            } else {
                await createGoalAction({
                    name,
                    targetAmount: parseFloat(targetAmount) || 0,
                    deadline: deadline || undefined,
                    category: category || undefined,
                    notes: notes || undefined,
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
            <DialogContent className="sm:max-w-[425px]">
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
                                    />
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
