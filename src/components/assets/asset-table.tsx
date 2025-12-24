"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Trash2 } from "lucide-react"
import { deleteAssetAction } from "@/actions/asset-actions"

interface Asset {
    id: string
    name: string
    type: string
    value: number
    userId: string
    updatedAt: Date | null
}

export function AssetTable({ assets }: { assets: Asset[] }) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {assets.map((asset) => (
                        <TableRow key={asset.id}>
                            <TableCell className="font-medium">{asset.name}</TableCell>
                            <TableCell>{asset.type}</TableCell>
                            <TableCell>¥{(asset.value / 100).toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={async () => {
                                        if (confirm("Delete this asset?")) {
                                            await deleteAssetAction(asset.id)
                                        }
                                    }}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {assets.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center h-24">
                                No assets found. Add one to get started.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
