"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus, Calendar, History } from "lucide-react"

interface SnapshotData {
  snapshotDate: string
  totalBalance: number
}

interface HistoricalComparisonProps {
  currentBalance: number // 当前总资产（分）
  snapshots: SnapshotData[]
}

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
  })
}

function formatPercent(value: number) {
  const sign = value >= 0 ? "+" : ""
  return `${sign}${value.toFixed(2)}%`
}

function formatChange(cents: number) {
  const sign = cents >= 0 ? "+" : ""
  return `${sign}${formatCurrency(cents)}`
}

// 获取指定日期的快照
function getSnapshotForDate(snapshots: SnapshotData[], targetDate: Date): SnapshotData | null {
  const targetDateStr = targetDate.toISOString().split('T')[0]
  
  // 首先尝试精确匹配
  const exactMatch = snapshots.find(s => s.snapshotDate === targetDateStr)
  if (exactMatch) return exactMatch
  
  // 如果没有精确匹配，找最接近的之前的日期
  const sortedSnapshots = [...snapshots].sort((a, b) => 
    b.snapshotDate.localeCompare(a.snapshotDate)
  )
  
  for (const snapshot of sortedSnapshots) {
    if (snapshot.snapshotDate <= targetDateStr) {
      return snapshot
    }
  }
  
  return null
}

export function HistoricalComparison({ currentBalance, snapshots }: HistoricalComparisonProps) {
  const today = new Date()
  
  // 计算上月同期日期
  const lastMonth = new Date(today)
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  
  // 计算去年同期日期
  const lastYear = new Date(today)
  lastYear.setFullYear(lastYear.getFullYear() - 1)
  
  // 获取对应日期的快照
  const lastMonthSnapshot = getSnapshotForDate(snapshots, lastMonth)
  const lastYearSnapshot = getSnapshotForDate(snapshots, lastYear)
  
  // 计算变化
  const monthChange = lastMonthSnapshot 
    ? currentBalance - lastMonthSnapshot.totalBalance 
    : null
  const monthChangePercent = lastMonthSnapshot && lastMonthSnapshot.totalBalance > 0
    ? ((currentBalance - lastMonthSnapshot.totalBalance) / lastMonthSnapshot.totalBalance) * 100
    : null
    
  const yearChange = lastYearSnapshot 
    ? currentBalance - lastYearSnapshot.totalBalance 
    : null
  const yearChangePercent = lastYearSnapshot && lastYearSnapshot.totalBalance > 0
    ? ((currentBalance - lastYearSnapshot.totalBalance) / lastYearSnapshot.totalBalance) * 100
    : null

  const getChangeIcon = (change: number | null) => {
    if (change === null) return <Minus className="h-4 w-4 text-muted-foreground" />
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const getChangeColor = (change: number | null) => {
    if (change === null) return "text-muted-foreground"
    if (change > 0) return "text-green-600"
    if (change < 0) return "text-red-600"
    return "text-muted-foreground"
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            与上月对比
          </CardTitle>
          {getChangeIcon(monthChange)}
        </CardHeader>
        <CardContent>
          {monthChange !== null && monthChangePercent !== null ? (
            <>
              <div className={`text-2xl font-bold ${getChangeColor(monthChange)}`}>
                {formatChange(monthChange)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-sm font-medium ${getChangeColor(monthChangePercent)}`}>
                  {formatPercent(monthChangePercent)}
                </span>
                <span className="text-xs text-muted-foreground">
                  对比 {lastMonth.toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                上月: {formatCurrency(lastMonthSnapshot!.totalBalance)}
              </p>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              暂无上月数据
              <p className="text-xs mt-1">系统将自动记录每日资产快照</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <History className="h-4 w-4" />
            与去年同期对比
          </CardTitle>
          {getChangeIcon(yearChange)}
        </CardHeader>
        <CardContent>
          {yearChange !== null && yearChangePercent !== null ? (
            <>
              <div className={`text-2xl font-bold ${getChangeColor(yearChange)}`}>
                {formatChange(yearChange)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-sm font-medium ${getChangeColor(yearChangePercent)}`}>
                  {formatPercent(yearChangePercent)}
                </span>
                <span className="text-xs text-muted-foreground">
                  对比 {lastYear.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                去年同期: {formatCurrency(lastYearSnapshot!.totalBalance)}
              </p>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              暂无去年同期数据
              <p className="text-xs mt-1">系统将自动记录每日资产快照</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
