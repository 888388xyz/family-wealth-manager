import { getCurrentUserAction } from "@/actions/settings-actions"
import { SettingsForm } from "@/components/settings/settings-form"
import { BackupManager } from "@/components/settings/backup-manager"
import { redirect } from "next/navigation"

export default async function SettingsPage() {
    const user = await getCurrentUserAction()

    if (!user) {
        redirect("/login")
    }

    const isAdmin = user.role === "ADMIN"

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
            <h2 className="text-3xl font-bold tracking-tight">设置</h2>
            
            {/* 用户设置 */}
            <SettingsForm user={user} />
            
            {/* 管理员备份区域 - 仅管理员可见 */}
            {isAdmin && (
                <div className="pt-4 border-t">
                    <h3 className="text-xl font-semibold mb-4">管理员功能</h3>
                    <BackupManager isAdmin={isAdmin} />
                </div>
            )}
        </div>
    )
}
