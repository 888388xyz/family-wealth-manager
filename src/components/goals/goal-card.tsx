"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Target, Calendar, CheckCircle2 } from "lucide-react"
import { deleteGoalAction, updateGoalAction } from "@/actions/goal-actions"
import { GoalDialog } from "./goal-dialog"

interface Goal {
    id: string
    name: string
    targetAmount: number
    currentAmount: number | null
    currency: string | null
    deadline: string | null
    category: string | null
    notes: string | null
    isCompleted: boolean | null
    createdAt: Date | null
    linkedAccountIds: string[] | null
}

interface GoalCardProps {
    goal: Goal
}

const categoryLabels: Record<string, string> = {
    savings: "储蓄",
    investment: "投资",
    emergency: "应急",
    other: "其他",
}

const categoryColors: Record<string, string> = {
    savings: "bg-blue-100 text-blue-800",
    investment: "bg-green-100 text-green-800",
    emergency: "bg-orange-100 text-orange-800",
    other: "bg-gray-100 text-gray-800",
}

export function GoalCard({ goal }: GoalCardProps) {
    const [isPending, startTransition] = useTransition()
    const [editOpen, setEditOpen] = useState(false)

    const current = goal.currentAmount || 0
    const target = goal.targetAmount || 1
    const progress = Math.min((current / target) * 100, 100)
    const isCompleted = goal.isCompleted || progress >= 100

    const formatAmount = (cents: number) => {
        return (cents / 100).toLocaleString("zh-CN", { minimumFractionDigits: 2 })
    }

    const handleDelete = () => {
        if (!confirm("确定要删除这个目标吗？")) return
        startTransition(async () => {
            await deleteGoalAction(goal.id)
        })
    }

    const handleToggleComplete = () => {
        startTransition(async () => {
            await updateGoalAction(goal.id, { isCompleted: !isCompleted })
        })
    }

    return (
        <>
            <Card className={`relative ${isCompleted ? "opacity-60" : ""}`}>
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">{goal.name}</CardTitle>
                        </div>
                        <div className="flex items-center gap-1">
                            {goal.category && (
                                <Badge variant="secondary" className={categoryColors[goal.category] || ""}>
                                    {categoryLabels[goal.category] || goal.category}
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">进度</span>
                            <span className="font-medium">{progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="flex justify-between text-sm">
                            <span>¥{formatAmount(current)}</span>
                            <span className="text-muted-foreground">目标: ¥{formatAmount(target)}</span>
                        </div>
                    </div>

                    {goal.deadline && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>截止日期: {goal.deadline}</span>
                        </div>
                    )}

                    {goal.notes && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{goal.notes}</p>
                    )}

                    <div className="flex items-center justify-between pt-2">
                        <Button
                            variant={isCompleted ? "outline" : "secondary"}
                            size="sm"
                            onClick={handleToggleComplete}
                            disabled={isPending}
                        >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            {isCompleted ? "标记未完成" : "标记完成"}
                        </Button>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)} disabled={isPending}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isPending}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <GoalDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                goal={goal}
                mode="edit"
            />
        </>
    )
}
