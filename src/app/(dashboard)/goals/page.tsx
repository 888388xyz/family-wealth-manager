import { getGoalsAction } from "@/actions/goal-actions"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { GoalCard } from "@/components/goals/goal-card"
import { GoalDialog } from "@/components/goals/goal-dialog"

export default async function GoalsPage() {
    const session = await auth()
    if (!session?.user) {
        redirect("/login")
    }

    const goals = await getGoalsAction()

    const activeGoals = goals.filter(g => !g.isCompleted)
    const completedGoals = goals.filter(g => g.isCompleted)

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">目标管理</h2>
                    <p className="text-muted-foreground">
                        追踪您的财富目标进度
                    </p>
                </div>
                <GoalDialog />
            </div>

            {goals.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                    <div className="text-center">
                        <h3 className="text-lg font-semibold">暂无目标</h3>
                        <p className="text-muted-foreground mt-1">点击右上角按钮创建您的第一个财富目标</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {activeGoals.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">进行中 ({activeGoals.length})</h3>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {activeGoals.map((goal) => (
                                    <GoalCard key={goal.id} goal={goal} />
                                ))}
                            </div>
                        </div>
                    )}

                    {completedGoals.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">已完成 ({completedGoals.length})</h3>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {completedGoals.map((goal) => (
                                    <GoalCard key={goal.id} goal={goal} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
