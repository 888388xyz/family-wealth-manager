import { getAccountsAction } from "@/actions/account-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Wallet, Building2, TrendingUp } from "lucide-react"
import { redirect } from "next/navigation"

function formatCurrency(cents: number) {
    return (cents / 100).toLocaleString("zh-CN", {
        style: "currency",
        currency: "CNY",
        minimumFractionDigits: 2,
    })
}

export default async function DashboardPage() {
    const accounts = await getAccountsAction()

    if (!accounts) {
        redirect("/login")
    }

    // 计算统计数据
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)
    const accountCount = accounts.length
    const bankCount = new Set(accounts.map(acc => acc.bankName)).size

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <h2 className="text-3xl font-bold tracking-tight">仪表盘</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">总资产</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
                        <p className="text-xs text-muted-foreground">
                            所有账户余额总和
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
                            已记录账户
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">银行/平台</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{bankCount}</div>
                        <p className="text-xs text-muted-foreground">
                            不同银行或平台
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">平均余额</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {accountCount > 0 ? formatCurrency(Math.round(totalBalance / accountCount)) : "¥0.00"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            每账户平均
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* 账户列表预览 */}
            {accounts.length > 0 && (
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle>账户概览</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {accounts.slice(0, 5).map((account) => (
                                <div key={account.id} className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{account.accountName}</p>
                                        <p className="text-sm text-muted-foreground">{account.bankName}</p>
                                    </div>
                                    <div className="text-right font-medium">
                                        {formatCurrency(account.balance)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
