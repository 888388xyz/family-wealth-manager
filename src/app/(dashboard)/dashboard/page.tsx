import { getAccountsAction } from "@/actions/account-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Wallet, Building2, TrendingUp } from "lucide-react"
import { redirect } from "next/navigation"
import { PRODUCT_TYPES } from "@/lib/constants"
import { auth } from "@/auth"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

function formatCurrency(cents: number) {
    return (cents / 100).toLocaleString("zh-CN", {
        style: "currency",
        currency: "CNY",
        minimumFractionDigits: 2,
    })
}

function getProductTypeLabel(type: string) {
    return PRODUCT_TYPES.find(t => t.value === type)?.label || type
}

export default async function DashboardPage() {
    const session = await auth()
    const accounts = await getAccountsAction()

    if (!accounts || !session?.user) {
        redirect("/login")
    }

    const isAdmin = session.user.role === "ADMIN" || accounts.some(acc => (acc as any).user)

    // 计算统计数据
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)
    const accountCount = accounts.length
    const bankCount = new Set(accounts.map(acc => acc.bankName)).size

    // 按银行分组
    const groupedByBank: Record<string, { count: number; balance: number }> = {}
    accounts.forEach(acc => {
        if (!groupedByBank[acc.bankName]) {
            groupedByBank[acc.bankName] = { count: 0, balance: 0 }
        }
        groupedByBank[acc.bankName].count++
        groupedByBank[acc.bankName].balance += acc.balance
    })

    // 按产品类型分组
    const groupedByType: Record<string, { count: number; balance: number }> = {}
    accounts.forEach(acc => {
        const type = acc.productType || "OTHER"
        if (!groupedByType[type]) {
            groupedByType[type] = { count: 0, balance: 0 }
        }
        groupedByType[type].count++
        groupedByType[type].balance += acc.balance
    })

    // 再次确认是否有所有者信息（通过 isAdmin 模式获取的）
    const hasOwnerInfo = isAdmin || accounts.some(acc => (acc as any).user)

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">仪表盘</h2>
                {hasOwnerInfo && (
                    <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20">
                        管理员视图 (家族汇总)
                    </span>
                )}
            </div>

            {/* 统计卡片 */}
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

            {/* 分类统计 */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* 按银行分组 */}
                <Card>
                    <CardHeader>
                        <CardTitle>按银行/平台分布</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {Object.keys(groupedByBank).length === 0 ? (
                            <p className="text-sm text-muted-foreground">暂无数据</p>
                        ) : (
                            <div className="space-y-3">
                                {Object.entries(groupedByBank)
                                    .sort((a, b) => b[1].balance - a[1].balance)
                                    .map(([bank, data]) => (
                                        <div key={bank} className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{bank}</p>
                                                <p className="text-xs text-muted-foreground">{data.count} 个账户</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">{formatCurrency(data.balance)}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {totalBalance > 0 ? ((data.balance / totalBalance) * 100).toFixed(1) : 0}%
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 按类型分组 */}
                <Card>
                    <CardHeader>
                        <CardTitle>按账户类型分布</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {Object.keys(groupedByType).length === 0 ? (
                            <p className="text-sm text-muted-foreground">暂无数据</p>
                        ) : (
                            <div className="space-y-3">
                                {Object.entries(groupedByType)
                                    .sort((a, b) => b[1].balance - a[1].balance)
                                    .map(([type, data]) => (
                                        <div key={type} className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{getProductTypeLabel(type)}</p>
                                                <p className="text-xs text-muted-foreground">{data.count} 个账户</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">{formatCurrency(data.balance)}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {totalBalance > 0 ? ((data.balance / totalBalance) * 100).toFixed(1) : 0}%
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* 账户列表预览 */}
            {accounts.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>账户概览</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {accounts.slice(0, 5).map((account: any) => (
                                <div key={account.id} className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <p className="font-medium">{account.accountName}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {account.bankName} · {getProductTypeLabel(account.productType || "OTHER")}
                                            {hasOwnerInfo && (
                                                <span className="ml-2 text-xs opacity-70">
                                                    ({account.user?.name || account.user?.email})
                                                </span>
                                            )}
                                        </p>
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
