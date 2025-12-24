import { getAccountsAction } from "@/actions/account-actions"
import { AccountTable } from "@/components/accounts/account-table"
import { AddAccountDialog } from "@/components/accounts/add-account-dialog"
import { redirect } from "next/navigation"
import { getCurrentUserAction } from "@/actions/settings-actions"

export default async function AccountsPage() {
    const accounts = await getAccountsAction()
    const user = await getCurrentUserAction()

    if (!accounts || !user) {
        redirect("/login")
    }

    const isAdmin = user.role === "ADMIN"

    // 计算总余额
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">账户管理</h2>
                    <p className="text-muted-foreground">
                        共 {accounts.length} 个账户，总余额 ¥{(totalBalance / 100).toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <AddAccountDialog />
            </div>
            <AccountTable accounts={accounts as any} isAdmin={isAdmin} />
        </div>
    )
}
