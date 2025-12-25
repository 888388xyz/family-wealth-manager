import { getAccountsAction } from "@/actions/account-actions"
import { getExchangeRatesAction } from "@/actions/currency-actions"
import { getProductTypesAction } from "@/actions/config-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Wallet, Globe, RefreshCw } from "lucide-react"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { DistributionCharts } from "@/components/dashboard/distribution-charts"

function formatCurrency(cents: number, currency: string = "CNY") {
    return (cents / 100).toLocaleString("zh-CN", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
    })
}

export default async function DashboardPage() {
    const session = await auth()
    const [accounts, exchangeRates, productTypes] = await Promise.all([
        getAccountsAction(),
        getExchangeRatesAction(),
        getProductTypesAction(),
    ])

    if (!accounts || !session?.user) {
        redirect("/login")
    }

    // Create a map for product type labels
    const productTypeMap = new Map(productTypes.map(t => [t.value, t.label]))
    const getProductTypeLabel = (type: string) => productTypeMap.get(type) || type

    const ratesMap = new Map(exchangeRates.map(r => [r.code, parseFloat(r.rate)]))
    ratesMap.set("CNY", 1.0)

    const isAdmin = session.user.role === "ADMIN" || accounts.some(acc => (acc as any).user)

    const totalBalanceInCNY = accounts.reduce((sum, acc) => {
        const currency = acc.currency || "CNY"
        const rate = ratesMap.get(currency) || 1.0
        return sum + (currency === "CNY" ? acc.balance : acc.balance * rate)
    }, 0)

    const accountCount = accounts.length
    const bankCount = new Set(accounts.map(acc => acc.bankName)).size

    const groupedByCurrency: Record<string, { balanceInCNY: number; originalBalance: number }> = {}
    accounts.forEach(acc => {
        const curr = acc.currency || "CNY"
        const rate = ratesMap.get(curr) || 1.0
        if (!groupedByCurrency[curr]) groupedByCurrency[curr] = { balanceInCNY: 0, originalBalance: 0 }
        groupedByCurrency[curr].balanceInCNY += curr === "CNY" ? acc.balance : acc.balance * rate
        groupedByCurrency[curr].originalBalance += acc.balance
    })

    const groupedByBank: Record<string, { count: number; balanceInCNY: number }> = {}
    accounts.forEach(acc => {
        const currency = acc.currency || "CNY"
        const rate = ratesMap.get(currency) || 1.0
        if (!groupedByBank[acc.bankName]) groupedByBank[acc.bankName] = { count: 0, balanceInCNY: 0 }
        groupedByBank[acc.bankName].count++
        groupedByBank[acc.bankName].balanceInCNY += currency === "CNY" ? acc.balance : acc.balance * rate
    })

    const groupedByType: Record<string, { count: number; balanceInCNY: number }> = {}
    accounts.forEach(acc => {
        const type = acc.productType || "OTHER"
        const currency = acc.currency || "CNY"
        const rate = ratesMap.get(currency) || 1.0
        if (!groupedByType[type]) groupedByType[type] = { count: 0, balanceInCNY: 0 }
        groupedByType[type].count++
        groupedByType[type].balanceInCNY += currency === "CNY" ? acc.balance : acc.balance * rate
    })

    const hasOwnerInfo = isAdmin || accounts.some(acc => (acc as any).user)
    const usedCurrencies = [...new Set(accounts.map(acc => acc.currency || "CNY"))]
    const usedRates = usedCurrencies.filter(c => c !== "CNY").map(code => ({ code, rate: ratesMap.get(code) || 0 }))
    const latestRateUpdate = exchangeRates[0]?.updatedAt

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {hasOwnerInfo && (
                <div className="flex items-center justify-end">
                    <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20">
                        管理员视图 (家族汇总)
                    </span>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">总资产 (折算 CNY)</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{formatCurrency(totalBalanceInCNY)}</div>
                        <p className="text-xs text-muted-foreground">按当前汇率折算后的境内外资产总和</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">账户数量</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{accountCount}</div>
                        <p className="text-xs text-muted-foreground">跨越 {bankCount} 个银行/平台</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">外币账户</CardTitle>
                        <Globe className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{Object.keys(groupedByCurrency).filter(c => c !== "CNY").length}</div>
                        <p className="text-xs text-muted-foreground">包含 {Object.keys(groupedByCurrency).filter(c => c !== "CNY").join(", ") || "无"}</p>
                    </CardContent>
                </Card>
            </div>

            {usedRates.length > 0 && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base">当前汇率 (1 外币 = X 人民币)</CardTitle>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <RefreshCw className="h-3 w-3" />
                            {latestRateUpdate ? new Date(latestRateUpdate).toLocaleString("zh-CN") : "暂无"}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4">
                            {usedRates.map(({ code, rate }) => (
                                <div key={code} className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-md">
                                    <span className="font-medium">{code}</span>
                                    <span className="text-muted-foreground">=</span>
                                    <span className="text-primary font-mono">{rate.toFixed(4)}</span>
                                    <span className="text-muted-foreground text-xs">CNY</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <DistributionCharts
                currencyData={Object.entries(groupedByCurrency)
                    .sort((a, b) => b[1].balanceInCNY - a[1].balanceInCNY)
                    .map(([code, data]) => ({
                        name: code,
                        value: data.balanceInCNY / 100,
                        originalValue: data.originalBalance / 100,
                    }))}
                bankData={Object.entries(groupedByBank)
                    .sort((a, b) => b[1].balanceInCNY - a[1].balanceInCNY)
                    .map(([bank, data]) => ({
                        name: bank,
                        value: data.balanceInCNY / 100,
                        count: data.count,
                    }))}
                typeData={Object.entries(groupedByType)
                    .sort((a, b) => b[1].balanceInCNY - a[1].balanceInCNY)
                    .map(([type, data]) => ({
                        name: getProductTypeLabel(type),
                        value: data.balanceInCNY / 100,
                        count: data.count,
                        originalType: type,
                    }))}
            />
        </div>
    )
}
