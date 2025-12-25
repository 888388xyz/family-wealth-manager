import { getAccountsAction } from "@/actions/account-actions"
import { getProductTypesAction, getBanksAction, getCurrenciesAction } from "@/actions/config-actions"
import { getExchangeRatesAction } from "@/actions/currency-actions"
import { AccountTable } from "@/components/accounts/account-table"
import { AddAccountDialog } from "@/components/accounts/add-account-dialog"
import { redirect } from "next/navigation"
import { getCurrentUserAction } from "@/actions/settings-actions"

export default async function AccountsPage() {
    const [accounts, user, productTypes, exchangeRates, banks, currencies] = await Promise.all([
        getAccountsAction(),
        getCurrentUserAction(),
        getProductTypesAction(),
        getExchangeRatesAction(),
        getBanksAction(),
        getCurrenciesAction()
    ])

    if (!accounts || !user) {
        redirect("/login")
    }

    const isAdmin = user.role === "ADMIN"

    // 汇率映射
    const ratesMap = new Map(exchangeRates.map(r => [r.code, parseFloat(r.rate)]))
    ratesMap.set("CNY", 1.0)

    // 计算折算后的总余额（按汇率转换为CNY）
    const totalBalanceInCNY = accounts.reduce((sum, acc) => {
        const currency = acc.currency || "CNY"
        const rate = ratesMap.get(currency) || 1.0
        return sum + (currency === "CNY" ? acc.balance : acc.balance * rate)
    }, 0)

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">账户管理</h2>
                    <p className="text-muted-foreground">
                        共 {accounts.length} 个账户，总资产 ¥{(totalBalanceInCNY / 100).toLocaleString("zh-CN", { minimumFractionDigits: 2 })} (折算CNY)
                    </p>
                </div>
                <AddAccountDialog />
            </div>
            <AccountTable accounts={accounts as any} isAdmin={isAdmin} productTypes={productTypes} banks={banks} currencies={currencies} exchangeRates={exchangeRates} />
        </div>
    )
}
