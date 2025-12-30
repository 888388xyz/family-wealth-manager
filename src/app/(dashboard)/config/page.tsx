import { getCurrentUserAction } from "@/actions/settings-actions"
import { getBanksAction, getProductTypesAction, getCurrenciesAction, initializeConfigAction, getSystemSettingsAction } from "@/actions/config-actions"
import { redirect } from "next/navigation"
import { ConfigManager } from "@/components/config/config-manager"
import { BackupManager } from "@/components/settings/backup-manager"
import { EmailConfigCard } from "@/components/config/email-config-card"

export default async function ConfigPage() {
    const user = await getCurrentUserAction()
    if (!user) redirect("/login")
    if (user.role !== "ADMIN") redirect("/dashboard")

    // Initialize default config if empty
    await initializeConfigAction()

    const [banks, productTypes, currencies, settings] = await Promise.all([
        getBanksAction(),
        getProductTypesAction(),
        getCurrenciesAction(),
        getSystemSettingsAction(),
    ])

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">系统配置</h2>
                <p className="text-muted-foreground">管理平台、产品类型、货币选项、邮件通知及系统备份</p>
            </div>
            <EmailConfigCard initialSettings={settings} />
            <ConfigManager banks={banks} productTypes={productTypes} currencies={currencies} />
            <BackupManager isAdmin={true} />
        </div>
    )
}
