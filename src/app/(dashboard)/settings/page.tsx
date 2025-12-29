import { getCurrentUserAction } from "@/actions/settings-actions"
import { SettingsForm } from "@/components/settings/settings-form"
import { BackupManager } from "@/components/settings/backup-manager"
import { redirect } from "next/navigation"

export default async function SettingsPage() {
    const user = await getCurrentUserAction()

    if (!user) {
        redirect("/login")
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <h2 className="text-3xl font-bold tracking-tight">设置</h2>
            <SettingsForm user={user} />
            <BackupManager isAdmin={user.role === "ADMIN"} />
        </div>
    )
}
