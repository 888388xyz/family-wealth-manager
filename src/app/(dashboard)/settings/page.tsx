import { getCurrentUserAction } from "@/actions/settings-actions"
import { getTagsAction } from "@/actions/tag-actions"
import { SettingsForm } from "@/components/settings/settings-form"
import { TagManager } from "@/components/settings/tag-manager"
import { redirect } from "next/navigation"

export default async function SettingsPage() {
    const [user, tags] = await Promise.all([
        getCurrentUserAction(),
        getTagsAction()
    ])

    if (!user) {
        redirect("/login")
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
            <h2 className="text-3xl font-bold tracking-tight">用户设置</h2>
            <SettingsForm user={user}>
                <TagManager initialTags={tags} />
            </SettingsForm>
        </div>
    )
}


