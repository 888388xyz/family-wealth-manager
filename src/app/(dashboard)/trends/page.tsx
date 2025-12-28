import { getAccountsAction } from "@/actions/account-actions"
import { getExchangeRatesAction } from "@/actions/currency-actions"
import { getDailySnapshotsAction } from "@/actions/snapshot-actions"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { TrendChart } from "@/components/dashboard/trend-chart"
import { YieldAnalysis } from "@/components/dashboard/yield-analysis"
import { HistoricalComparison } from "@/components/dashboard/historical-comparison"

export default async function TrendsPage() {
    const session = await auth()
    const [accounts, exchangeRates, snapshots] = await Promise.all([
        getAccountsAction(),
        getExchangeRatesAction(),
        getDailySnapshotsAction(-1), // 获取所有历史数据
    ])

    if (!accounts || !session?.user) {
        redirect("/login")
    }

    // 创建汇率映射
    const ratesMap = new Map<string, number>(exchangeRates.map((r: any) => [r.code, parseFloat(r.rate)]))
    ratesMap.set("CNY", 1.0)

    // 计算当前总资产（折算为CNY，单位：分）
    const totalBalanceInCNY = accounts.reduce((sum: number, acc: any) => {
        const currency = acc.currency || "CNY"
        const rate = ratesMap.get(currency) || 1.0
        return sum + (currency === "CNY" ? (acc.balance as number) : (acc.balance as number) * rate)
    }, 0)

    // 准备账户数据用于收益分析
    const accountsData = accounts.map((acc: any) => ({
        id: acc.id,
        accountName: acc.accountName,
        bankName: acc.bankName,
        balance: acc.balance,
        expectedYield: acc.expectedYield,
        currency: acc.currency,
    }))

    // 准备快照数据用于历史对比
    const snapshotsData = (snapshots || []).map((s: any) => ({
        snapshotDate: s.snapshotDate,
        totalBalance: s.totalBalance,
    }))

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">趋势分析</h1>
            </div>

            <TrendChart
                className="w-full"
                initialData={snapshotsData.slice(-30).map((s: any) => ({
                    date: s.snapshotDate,
                    value: s.totalBalance / 100
                }))}
            />

            <YieldAnalysis accounts={accountsData} ratesMap={ratesMap} />

            <HistoricalComparison
                currentBalance={totalBalanceInCNY}
                snapshots={snapshotsData}
            />
        </div>
    )
}
