"use client"

import {
    LineChart as RechartsLineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts"
import { cn } from "@/lib/utils"

interface LineChartDataItem {
    date: string
    value: number
    [key: string]: string | number
}

interface LineChartProps {
    data: LineChartDataItem[]
    className?: string
    showGrid?: boolean
    color?: string
}

// 格式化数值显示
function formatValue(value: number): string {
    if (value >= 100000000) {
        return `${(value / 100000000).toFixed(2)}亿`
    }
    if (value >= 10000) {
        return `${(value / 10000).toFixed(2)}万`
    }
    return value.toLocaleString("zh-CN", { maximumFractionDigits: 2 })
}

// 格式化日期显示
function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
}

// 格式化完整日期
function formatFullDate(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })
}

// 自定义 Tooltip
interface CustomTooltipProps {
    active?: boolean
    payload?: Array<{
        value: number
        payload: LineChartDataItem
    }>
    label?: string
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
    if (!active || !payload || !payload.length) return null

    const data = payload[0]

    return (
        <div className="bg-popover text-popover-foreground rounded-md border px-3 py-2 shadow-md">
            <p className="font-medium text-sm">{formatFullDate(data.payload.date)}</p>
            <p className="text-sm text-muted-foreground">
                总资产: <span className="text-primary font-medium">¥{formatValue(data.value)}</span>
            </p>
        </div>
    )
}

export function LineChart({
    data,
    className,
    showGrid = true,
    color = "#3b82f6",
}: LineChartProps) {
    if (data.length === 0) {
        return (
            <div className={cn("flex h-[300px] items-center justify-center text-muted-foreground", className)}>
                暂无数据
            </div>
        )
    }

    // 计算Y轴范围
    const values = data.map(d => d.value)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const padding = (maxValue - minValue) * 0.1 || maxValue * 0.1
    const yMin = Math.max(0, minValue - padding)
    const yMax = maxValue + padding

    return (
        <div className={cn("h-[300px] w-full", className)}>
            <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart
                    data={data}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    {showGrid && (
                        <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-muted"
                            vertical={false}
                        />
                    )}
                    <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        className="text-muted-foreground"
                    />
                    <YAxis
                        tickFormatter={(value) => formatValue(value)}
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        domain={[yMin, yMax]}
                        className="text-muted-foreground"
                        width={80}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6, fill: color }}
                    />
                </RechartsLineChart>
            </ResponsiveContainer>
        </div>
    )
}

export type { LineChartProps, LineChartDataItem }
