"use client"

import { useState, useEffect, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { LineChart } from "@/components/charts/line-chart"
import { getDailySnapshotsAction, createDailySnapshotAction } from "@/actions/snapshot-actions"
import { TrendingUp, RefreshCw } from "lucide-react"
import { CENTS_PER_UNIT } from "@/lib/constants"
import { cn } from "@/lib/utils"

type TimeRange = 30 | 90 | 365

interface TrendChartProps {
    className?: string
    initialData?: Array<{ date: string; value: number }>
}

// 图表骨架屏
function ChartSkeleton() {
    return (
        <div className="h-[300px] flex flex-col gap-4 p-4">
            <div className="flex justify-between items-end h-full">
                {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton
                        key={i}
                        className="w-6"
                        style={{ height: `${30 + Math.random() * 60}%` }}
                    />
                ))}
            </div>
            <div className="flex justify-between">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-3 w-12" />
                ))}
            </div>
        </div>
    )
}

export function TrendChart({ className, initialData }: TrendChartProps) {
    const [timeRange, setTimeRange] = useState<TimeRange>(30)
    const [data, setData] = useState<Array<{ date: string; value: number }>>(initialData || [])
    const [loading, setLoading] = useState(initialData ? false : true)
    const [isPending, startTransition] = useTransition()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 100)
        return () => clearTimeout(timer)
    }, [])

    const fetchData = async (days: number) => {
        // 只有在首次挂载且 days 为默认值 30 时，才可能跳过 fetchData
        if (days === 30 && initialData && data.length === initialData.length && loading === false) {
            return
        }

        setLoading(true)
        try {
            const snapshots = await getDailySnapshotsAction(days)
            if (snapshots) {
                setData(
                    snapshots.map((s: any) => ({
                        date: s.snapshotDate,
                        value: s.totalBalance / CENTS_PER_UNIT, // 转换为元
                    }))
                )
            }
        } catch (err) {
            console.error("获取趋势数据失败:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData(timeRange)
    }, [timeRange])

    const handleRefresh = () => {
        startTransition(async () => {
            await createDailySnapshotAction()
            await fetchData(timeRange)
        })
    }

    const timeRangeOptions: { value: TimeRange; label: string }[] = [
        { value: 30, label: "30天" },
        { value: 90, label: "90天" },
        { value: 365, label: "1年" },
    ]

    return (
        <Card className={cn(className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">资产趋势</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex rounded-md border">
                        {timeRangeOptions.map((option) => (
                            <Button
                                key={option.value}
                                variant={timeRange === option.value ? "secondary" : "ghost"}
                                size="sm"
                                className={cn(
                                    "h-7 px-3 text-xs rounded-none first:rounded-l-md last:rounded-r-md",
                                    timeRange === option.value && "bg-secondary"
                                )}
                                onClick={() => setTimeRange(option.value)}
                            >
                                {option.label}
                            </Button>
                        ))}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2"
                        onClick={handleRefresh}
                        disabled={isPending}
                    >
                        <RefreshCw className={cn("h-3 w-3", isPending && "animate-spin")} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <ChartSkeleton />
                ) : data.length === 0 ? (
                    <div className="flex h-[300px] flex-col items-center justify-center gap-2 text-muted-foreground">
                        <p>暂无趋势数据</p>
                        <p className="text-xs">点击刷新按钮创建今日快照</p>
                    </div>
                ) : !mounted ? (
                    <ChartSkeleton />
                ) : (
                    <LineChart data={data} className="h-[300px]" />
                )}
            </CardContent>
        </Card>
    )
}
