"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart } from "@/components/charts/pie-chart"

interface DistributionData {
  name: string
  value: number
  originalValue?: number
  count?: number
  color?: string
  originalType?: string
  [key: string]: string | number | undefined
}

interface DistributionChartsProps {
  currencyData: DistributionData[]
  bankData: DistributionData[]
  typeData: DistributionData[]
}

// 格式化货币显示
function formatCurrency(cents: number, currency: string = "CNY") {
  return (cents / 100).toLocaleString("zh-CN", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  })
}

export function DistributionCharts({
  currencyData,
  bankData,
  typeData,
}: DistributionChartsProps) {
  const router = useRouter()

  const handleCurrencyClick = (name: string) => {
    router.push(`/accounts?currency=${encodeURIComponent(name)}`)
  }

  const handleBankClick = (name: string) => {
    router.push(`/accounts?bank=${encodeURIComponent(name)}`)
  }

  const handleTypeClick = (name: string) => {
    // Find the original type value from the typeData
    const typeItem = typeData.find(item => item.name === name)
    const typeValue = typeItem?.originalType || name
    router.push(`/accounts?type=${encodeURIComponent(typeValue)}`)
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">币种分布</CardTitle>
        </CardHeader>
        <CardContent>
          <PieChart
            data={currencyData}
            onSliceClick={handleCurrencyClick}
            showPercentage={true}
            showValue={true}
            className="h-[280px]"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">银行/平台分布</CardTitle>
        </CardHeader>
        <CardContent>
          <PieChart
            data={bankData}
            onSliceClick={handleBankClick}
            showPercentage={true}
            showValue={true}
            className="h-[280px]"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">资产类型分布</CardTitle>
        </CardHeader>
        <CardContent>
          <PieChart
            data={typeData}
            onSliceClick={handleTypeClick}
            showPercentage={true}
            showValue={true}
            className="h-[280px]"
          />
        </CardContent>
      </Card>
    </div>
  )
}
