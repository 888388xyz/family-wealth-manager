import { getAccountsAction } from "@/actions/account-actions"
import { getExchangeRatesAction } from "@/actions/currency-actions"
import { getDailySnapshotsAction } from "@/actions/snapshot-actions"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
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

    // 获取当前用户详细信息。
    const userProfile = await db.query.users.findFirst({
        where: eq(users.id, session?.user?.id || "")
    })

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
                initialData={snapshotsData.map((s: any) => ({
                    date: s.snapshotDate,
                    value: s.totalBalance / 100
                }))}
            />

            <YieldAnalysis accounts={accountsData} ratesMap={ratesMap} />

            <HistoricalComparison
                currentBalance={totalBalanceInCNY}
                snapshots={snapshotsData}
            />

            {/* 诊断信息 - 仅用于调试 */}
            <div className="mt-8 p-4 border rounded-lg bg-slate-50 text-xs font-mono text-slate-500">
                <p className="font-bold mb-2">调试诊断信息 (Diagnostic Info):</p>
                <div className="grid grid-cols-2 gap-2">
                    <p>用户ID: {session?.user?.id || "未知"}</p>
                    <p>角色: {userProfile?.role || "MEMBER"}</p>
                    <p>账户总数: {accounts?.length || 0}</p>
                    <p>快照条数: {snapshotsData?.length || 0}</p>
                    <p>首条快照: {snapshotsData?.[0] ? `${snapshotsData[0].snapshotDate} - ${snapshotsData[0].totalBalance}` : "无"}</p>
                    <p>总资产基准: {totalBalanceInCNY}</p>
                </div>
                {snapshotsData?.length === 0 && (
                    <p className="mt-2 text-red-400">警告: 快照数据为空，请检查数据库 daily_snapshots 表。</p>
                )}
            </div>
        </div>
    )
}
