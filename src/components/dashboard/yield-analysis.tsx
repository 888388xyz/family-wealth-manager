"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Percent, DollarSign, Award } from "lucide-react"

interface AccountData {
  id: string
  accountName: string
  bankName: string
  balance: number
  expectedYield: number | null
  currency: string | null
}

interface YieldAnalysisProps {
  accounts: AccountData[]
  ratesMap: Map<string, number>
}

function formatCurrency(value: number) {
  return value.toLocaleString("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
  })
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`
}

export function YieldAnalysis({ accounts, ratesMap }: YieldAnalysisProps) {
  // 过滤有收益率的账户
  const accountsWithYield = accounts.filter(acc => acc.expectedYield && acc.expectedYield > 0)
  
  if (accountsWithYield.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            收益分析
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">暂无设置预期收益率的账户</p>
        </CardContent>
      </Card>
    )
  }

  // 计算加权平均收益率（按余额加权，折算为CNY）
  let totalWeightedYield = 0
  let totalBalanceInCNY = 0

  accountsWithYield.forEach(acc => {
    const currency = acc.currency || "CNY"
    const rate = ratesMap.get(currency) || 1.0
    const balanceInCNY = currency === "CNY" ? acc.balance : acc.balance * rate
    const yieldRate = (acc.expectedYield || 0) / 100 // 从万分之一转换为百分比
    
    totalWeightedYield += balanceInCNY * yieldRate
    totalBalanceInCNY += balanceInCNY
  })

  const weightedAverageYield = totalBalanceInCNY > 0 
    ? totalWeightedYield / totalBalanceInCNY 
    : 0

  // 计算预期年收益和月收益（基于所有有收益率的账户）
  const expectedAnnualIncome = totalWeightedYield / 100 // 从分转换为元
  const expectedMonthlyIncome = expectedAnnualIncome / 12

  // 找出收益最高和最低的账户
  const sortedByYield = [...accountsWithYield].sort(
    (a, b) => (b.expectedYield || 0) - (a.expectedYield || 0)
  )
  const highestYieldAccount = sortedByYield[0]
  const lowestYieldAccount = sortedByYield[sortedByYield.length - 1]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">加权平均收益率</CardTitle>
          <Percent className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatPercent(weightedAverageYield)}
          </div>
          <p className="text-xs text-muted-foreground">
            基于 {accountsWithYield.length} 个有收益账户
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">预期年收益</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(expectedAnnualIncome)}</div>
          <p className="text-xs text-muted-foreground">
            月均 {formatCurrency(expectedMonthlyIncome)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">最高收益账户</CardTitle>
          <Award className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold text-amber-600">
            {formatPercent((highestYieldAccount.expectedYield || 0) / 100)}
          </div>
          <p className="text-xs text-muted-foreground truncate" title={highestYieldAccount.accountName}>
            {highestYieldAccount.bankName} - {highestYieldAccount.accountName}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">最低收益账户</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">
            {formatPercent((lowestYieldAccount.expectedYield || 0) / 100)}
          </div>
          <p className="text-xs text-muted-foreground truncate" title={lowestYieldAccount.accountName}>
            {lowestYieldAccount.bankName} - {lowestYieldAccount.accountName}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
