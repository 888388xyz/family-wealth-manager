import { db } from "@/db"
import { assets } from "@/db/schema"
import { desc } from "drizzle-orm"
import { AssetTable } from "@/components/assets/asset-table"
import { AddAssetDialog } from "@/components/assets/add-asset-dialog"

export default async function AssetsPage() {
    const data = await db.query.assets.findMany({
        orderBy: [desc(assets.updatedAt)],
    })

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Assets</h2>
                <div className="flex items-center space-x-2">
                    <AddAssetDialog />
                </div>
            </div>
            <AssetTable assets={data} />
        </div>
    )
}
