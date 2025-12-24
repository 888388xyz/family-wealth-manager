"use server"

import { db } from "@/db"
import { assets } from "@/db/schema"
import { auth } from "@/auth"
import { eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const assetSchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: z.enum(["CASH", "REAL_ESTATE", "STOCK", "FUND", "INSURANCE", "SAVINGS", "OTHER"]),
    value: z.coerce.number().min(0, "Value must be positive"), // Input in Yuan
    currency: z.string().default("CNY"),
    ownerId: z.string().min(1, "Owner is required"),
})

export async function addAssetAction(formData: FormData) {
    const session = await auth()
    if (!session?.user) return { error: "Not authenticated" }

    const parsed = assetSchema.safeParse({
        name: formData.get("name"),
        type: formData.get("type"),
        value: formData.get("value"),
        ownerId: formData.get("ownerId") || session.user.id, // Only admin can set other owners? For now let's say self or anyone if admin. logic later.
    })

    if (!parsed.success) {
        return { error: parsed.error.flatten().fieldErrors }
    }

    try {
        const data = parsed.data
        // TODO: Verify if user is allowed to add for ownerId if ownerId != session.user.id (RBAC)

        await db.insert(assets).values({
            name: data.name,
            type: data.type,
            value: Math.round(data.value * 100), // Convert to cents
            currency: data.currency,
            userId: data.ownerId,
            purchasePrice: 0, // Optional, can add later
        })

        revalidatePath("/assets")
        revalidatePath("/dashboard")
        return { success: true }
    } catch (err) {
        console.error(err)
        return { error: "Failed to create asset" }
    }
}

export async function deleteAssetAction(assetId: string) {
    const session = await auth()
    if (!session?.user) return { error: "Not authenticated" }

    // TODO: RBAC check

    await db.delete(assets).where(eq(assets.id, assetId))
    revalidatePath("/assets")
    revalidatePath("/dashboard")
}
