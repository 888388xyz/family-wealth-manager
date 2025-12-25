"use client"

import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { cn } from "@/lib/utils"

interface PieChartDataItem {
  name: string
  value: number
  color?: string
  [key: string]: string | number | undefined
}

interface PieChartProps {
  data: PieChartDataItem[]
  onSliceClick?: (name: string) => void
  showPercentage?: boolean
  showValue?: boolean
  className?: string
}

// 默认颜色调色板
const DEFAULT_COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
  "#84cc16", // lime-500
  "#ec4899", // pink-500
  "#6366f1", // indigo-500
]

// 格式化数值显示
function formatValue(value: number): string {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(2)}万`
  }
  return value.toLocaleString("zh-CN", { maximumFractionDigits: 2 })
}

// 自定义 Tooltip
interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    payload: PieChartDataItem & { percent: number }
  }>
  showPercentage?: boolean
  showValue?: boolean
  total: number
}

function CustomTooltip({ active, payload, showPercentage, showValue, total }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0]
  const percent = total > 0 ? ((data.value / total) * 100).toFixed(1) : "0"

  return (
    <div className="bg-popover text-popover-foreground rounded-md border px-3 py-2 shadow-md">
      <p className="font-medium">{data.name}</p>
      <div className="text-sm text-muted-foreground">
        {showValue && <p>金额: ¥{formatValue(data.value)}</p>}
        {showPercentage && <p>占比: {percent}%</p>}
      </div>
    </div>
  )
}

// 自定义标签渲染
interface LabelProps {
  cx?: number
  cy?: number
  midAngle?: number
  innerRadius?: number
  outerRadius?: number
  percent?: number
  name?: string
  value?: number
  showPercentage?: boolean
  showValue?: boolean
}

function renderCustomLabel({
  cx = 0,
  cy = 0,
  midAngle = 0,
  innerRadius = 0,
  outerRadius = 0,
  percent = 0,
  showPercentage,
}: LabelProps) {
  if (!showPercentage || percent < 0.05) return null // 小于5%不显示标签

  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function PieChart({
  data,
  onSliceClick,
  showPercentage = true,
  showValue = true,
  className,
}: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  const handleClick = (entry: PieChartDataItem) => {
    if (onSliceClick) {
      onSliceClick(entry.name)
    }
  }

  if (data.length === 0 || total === 0) {
    return (
      <div className={cn("flex h-[300px] items-center justify-center text-muted-foreground", className)}>
        暂无数据
      </div>
    )
  }

  return (
    <div className={cn("h-[300px] w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            onClick={handleClick}
            cursor={onSliceClick ? "pointer" : "default"}
            label={(props) =>
              renderCustomLabel({
                ...props,
                showPercentage,
                showValue,
              })
            }
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                className="transition-opacity hover:opacity-80"
              />
            ))}
          </Pie>
          <Tooltip
            content={
              <CustomTooltip
                showPercentage={showPercentage}
                showValue={showValue}
                total={total}
              />
            }
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string) => {
              const item = data.find((d) => d.name === value)
              if (!item) return value
              const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0"
              return (
                <span className="text-sm">
                  {value} ({percent}%)
                </span>
              )
            }}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  )
}

export type { PieChartProps, PieChartDataItem }
