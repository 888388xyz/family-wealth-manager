import { getMembersAction } from "@/actions/member-actions"
import { MemberTable } from "@/components/members/member-table"
import { redirect } from "next/navigation"

export default async function MembersPage() {
    const members = await getMembersAction()

    if (!members) {
        redirect("/login")
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Family Members</h2>
            </div>
            <MemberTable members={members} />
        </div>
    )
}
