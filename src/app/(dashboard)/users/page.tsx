import { getUsersAction } from "@/actions/user-actions"
import { getCurrentUserAction } from "@/actions/settings-actions"
import { UserTable } from "@/components/users/user-table"
import { redirect } from "next/navigation"
import { AddUserDialog } from "@/components/users/add-user-dialog"

export default async function UsersPage() {
    const currentUser = await getCurrentUserAction()

    if (!currentUser) {
        redirect("/login")
    }

    if (currentUser.role !== "ADMIN") {
        redirect("/dashboard")
    }

    const users = await getUsersAction()

    if (!users) {
        redirect("/dashboard")
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">用户管理</h2>
                    <p className="text-muted-foreground">共 {users.length} 个用户</p>
                </div>
                <AddUserDialog />
            </div>
            <UserTable users={users} currentUserId={currentUser.id} />
        </div>
    )
}
