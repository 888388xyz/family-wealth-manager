import { getAccountsAction } from "@/actions/account-actions"
import { getExchangeRatesAction } from "@/actions/currency-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Wallet, Building2, TrendingUp, Globe } from "lucide-react"
import { redirect } from "next/navigation"
import { PRODUCT_TYPES } from "@/lib/constants"
import { auth } from "@/auth"

function formatCurrency(cents: number, currency: string = "CNY") {
    return (cents / 100).toLocaleString("zh-CN", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
    })
}

function getProductTypeLabel(type: string) {
    return PRODUCT_TYPES.find(t => t.value === type)?.label || type
}

export default async function DashboardPage() {
    const session = await auth()
    const [accounts, exchangeRates] = await Promise.all([
        getAccountsAction(),
        getExchangeRatesAction()
    ])

    if (!accounts || !session?.user) {
        redirect("/login")
    }

    const ratesMap = new Map(exchangeRates.map(r => [r.code, parseFloat(r.rate)]))
    ratesMap.set("CNY", 1.0)

    const isAdmin = session.user.role === "ADMIN" || accounts.some(acc => (acc as any).user)

    // 计算统计数据 (折算为 CNY)
    const totalBalanceInCNY = accounts.reduce((sum, acc) => {
        const rate = ratesMap.get(acc.currency || "CNY") || 1.0
        return sum + (acc.balance * rate)
    }, 0)

    const accountCount = accounts.length
    const bankCount = new Set(accounts.map(acc => acc.bankName)).size

    // 按币种分组
    const groupedByCurrency: Record<string, { balance: number; originalBalance: number }> = {}
    accounts.forEach(acc => {
        const curr = acc.currency || "CNY"
        const rate = ratesMap.get(curr) || 1.0
        if (!groupedByCurrency[curr]) {
            groupedByCurrency[curr] = { balance: 0, originalBalance: 0 }
        }
        groupedByCurrency[curr].balance += acc.balance * rate
        groupedByCurrency[curr].originalBalance += acc.balance
    })

    // 按银行分组
    const groupedByBank: Record<string, { count: number; balance: number }> = {}
    accounts.forEach(acc => {
        const rate = ratesMap.get(acc.currency || "CNY") || 1.0
        if (!groupedByBank[acc.bankName]) {
            groupedByBank[acc.bankName] = { count: 0, balance: 0 }
        }
        groupedByBank[acc.bankName].count++
        groupedByBank[acc.bankName].balance += acc.balance * rate
    })

    // 按产品类型分组
    const groupedByType: Record<string, { count: number; balance: number }> = {}
    accounts.forEach(acc => {
        const type = acc.productType || "OTHER"
        const rate = ratesMap.get(acc.currency || "CNY") || 1.0
        if (!groupedByType[type]) {
            groupedByType[type] = { count: 0, balance: 0 }
        }
        groupedByType[type].count++
        groupedByType[type].balance += acc.balance * rate
    })

    const hasOwnerInfo = isAdmin || accounts.some(acc => (acc as any).user)

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">仪表盘</h2>
                    <p className="text-sm text-muted-foreground">
                        汇率更新时间: {exchangeRates[0]?.updatedAt ? new Date(exchangeRates[0].updatedAt).toLocaleString() : "暂无"}
                    </p>
                </div>
                {hasOwnerInfo && (
                    <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20">
                        管理员视图 (家族汇总)
                    </span>
                )}
            </div>

            {/* 统计卡片 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">总资产 (折算 CNY)</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{formatCurrency(totalBalanceInCNY)}</div>
                        <p className="text-xs text-muted-foreground">
                            按当前汇率折算后的境内外资产总和
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">账户数量</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{accountCount}</div>
                        <p className="text-xs text-muted-foreground">
                            跨越 {bankCount} 个银行/平台
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">外币账户</CardTitle>
                        <Globe className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Object.keys(groupedByCurrency).filter(c => c !== "CNY").length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            包含 {Object.keys(groupedByCurrency).filter(c => c !== "CNY").join(", ") || "无"}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">平均余额 (CNY)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {accountCount > 0 ? formatCurrency(Math.round(totalBalanceInCNY / accountCount)) : "¥0.00"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            单个账户平均价值
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* 分类统计 */}
            <div className="grid gap-4 md:grid-cols-3">
                {/* 币种分布 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">币种分布</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Object.entries(groupedByCurrency)
                                .sort((a, b) => b[1].balance - a[1].balance)
                                .map(([code, data]) => (
                                    <div key={code} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium">{code}</span>
                                            <span className="text-muted-foreground">
                                                {formatCurrency(data.originalBalance, code)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>折算: {formatCurrency(data.balance)}</span>
                                            <span>{(data.balance / totalBalanceInCNY * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-secondary rounded-full h-1">
                                            <div
                                                className="bg-primary h-1 rounded-full"
                                                style={{ width: `${(data.balance / totalBalanceInCNY * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>

                {/* 按银行分组 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">银行/平台分布</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {Object.entries(groupedByBank)
                                .sort((a, b) => b[1].balance - a[1].balance)
                                .slice(0, 6)
                                .map(([bank, data]) => (
                                    <div key={bank} className="flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{bank}</p>
                                            <p className="text-[10px] text-muted-foreground">{data.count} 个账户</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium">{formatCurrency(data.balance)}</p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {((data.balance / totalBalanceInCNY) * 100).toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>

                {/* 按类型分组 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">资产类型分布</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {Object.entries(groupedByType)
                                .sort((a, b) => b[1].balance - a[1].balance)
                                .map(([type, data]) => (
                                    <div key={type} className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium">{getProductTypeLabel(type)}</p>
                                            <p className="text-[10px] text-muted-foreground">{data.count} 个资产</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium">{formatCurrency(data.balance)}</p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {((data.balance / totalBalanceInCNY) * 100).toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 账户列表预览 */}
            {accounts.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">最新变动账户</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {accounts.slice(0, 5).map((account: any) => {
                                const rate = ratesMap.get(account.currency || "CNY") || 1.0
                                return (
                                    <div key={account.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                        <div className="flex flex-col min-w-0">
                                            <p className="font-medium truncate">{account.accountName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {account.bankName} · {getProductTypeLabel(account.productType || "OTHER")}
                                                {hasOwnerInfo && (
                                                    <span className="ml-2 opacity-70">
                                                        ({account.user?.name || account.user?.email})
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="text-right ml-4">
                                            <div className="font-bold">{formatCurrency(account.balance, account.currency || "CNY")}</div>
                                            {account.currency !== "CNY" && (
                                                <div className="text-[10px] text-muted-foreground">
                                                    ≈ {formatCurrency(account.balance * rate)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
