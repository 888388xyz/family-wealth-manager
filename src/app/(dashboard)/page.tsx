import { OverviewCards } from "@/components/dashboard/overview-cards"
import { RecentActivity } from "@/components/dashboard/recent-activity"

export default function Page() {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <OverviewCards
                totalAssets={125000000}
                myAssets={45000000}
                totalReturn={5000000}
                categoryCount={6}
            />
            <RecentActivity />
        </div>
    )
}
