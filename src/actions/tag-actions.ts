"use server"

import { db } from "@/db"
import { accountTags, accountTagRelations, bankAccounts } from "@/db/schema"
import { auth } from "@/auth"
import { eq, and, inArray, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { validateUUID } from "@/lib/validators"

// 获取当前用户的所有标签
export async function getTagsAction() {
    const session = await auth()
    if (!session?.user?.id) return []

    const tags = await db.query.accountTags.findMany({
        where: eq(accountTags.userId, session.user.id),
        orderBy: [desc(accountTags.sortOrder), desc(accountTags.createdAt)],
    })

    return tags
}

// 创建新标签
export async function createTagAction(data: {
    name: string
    color?: string
    sortOrder?: number
}) {
    const session = await auth()
    if (!session?.user?.id) return { error: "未登录" }

    const tag = await db.insert(accountTags).values({
        userId: session.user.id,
        name: data.name,
        color: data.color || "#3b82f6",
        sortOrder: data.sortOrder || 0,
    }).returning()

    revalidatePath("/settings")
    revalidatePath("/accounts")
    return { success: true, tag: tag[0] }
}

// 更新标签
export async function updateTagAction(id: string, data: {
    name?: string
    color?: string
    sortOrder?: number
}) {
    const session = await auth()
    if (!session?.user?.id) return { error: "未登录" }
    if (!validateUUID(id)) return { error: "无效的标签ID" }

    // 验证标签属于当前用户
    const existing = await db.query.accountTags.findFirst({
        where: and(eq(accountTags.id, id), eq(accountTags.userId, session.user.id)),
    })
    if (!existing) return { error: "标签不存在" }

    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.color !== undefined) updateData.color = data.color
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder

    await db.update(accountTags).set(updateData).where(eq(accountTags.id, id))

    revalidatePath("/settings")
    revalidatePath("/accounts")
    return { success: true }
}

// 删除标签
export async function deleteTagAction(id: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "未登录" }
    if (!validateUUID(id)) return { error: "无效的标签ID" }

    // 验证标签属于当前用户
    const existing = await db.query.accountTags.findFirst({
        where: and(eq(accountTags.id, id), eq(accountTags.userId, session.user.id)),
    })
    if (!existing) return { error: "标签不存在" }

    // 删除会自动级联删除关联记录
    await db.delete(accountTags).where(eq(accountTags.id, id))

    revalidatePath("/settings")
    revalidatePath("/accounts")
    return { success: true }
}

// 设置账户的标签（替换现有标签）
export async function setAccountTagsAction(accountId: string, tagIds: string[]) {
    const session = await auth()
    if (!session?.user?.id) return { error: "未登录" }
    if (!validateUUID(accountId)) return { error: "无效的账户ID" }

    // 验证账户属于当前用户
    const account = await db.query.bankAccounts.findFirst({
        where: and(eq(bankAccounts.id, accountId), eq(bankAccounts.userId, session.user.id)),
    })
    if (!account) return { error: "账户不存在" }

    // 验证所有标签都属于当前用户
    if (tagIds.length > 0) {
        const tags = await db.query.accountTags.findMany({
            where: and(
                eq(accountTags.userId, session.user.id),
                inArray(accountTags.id, tagIds)
            ),
        })
        if (tags.length !== tagIds.length) {
            return { error: "部分标签不存在" }
        }
    }

    // 删除现有关联
    await db.delete(accountTagRelations).where(eq(accountTagRelations.accountId, accountId))

    // 创建新关联
    if (tagIds.length > 0) {
        await db.insert(accountTagRelations).values(
            tagIds.map(tagId => ({
                accountId,
                tagId,
            }))
        )
    }

    revalidatePath("/accounts")
    return { success: true }
}

// 获取账户的标签
export async function getAccountTagsAction(accountId: string) {
    const session = await auth()
    if (!session?.user?.id) return []
    if (!validateUUID(accountId)) return []

    const relations = await db.query.accountTagRelations.findMany({
        where: eq(accountTagRelations.accountId, accountId),
        with: {
            tag: true,
        },
    })

    return relations.map(r => r.tag)
}

// 获取所有账户及其标签
export async function getAccountsWithTagsAction() {
    const session = await auth()
    if (!session?.user?.id) return []

    const accounts = await db.query.bankAccounts.findMany({
        where: eq(bankAccounts.userId, session.user.id),
        with: {
            tagRelations: {
                with: {
                    tag: true,
                },
            },
        },
    })

    return accounts.map(acc => ({
        ...acc,
        tags: acc.tagRelations.map(tr => tr.tag),
    }))
}

// 按标签获取账户
export async function getAccountsByTagAction(tagId: string) {
    const session = await auth()
    if (!session?.user?.id) return []
    if (!validateUUID(tagId)) return []

    const relations = await db.query.accountTagRelations.findMany({
        where: eq(accountTagRelations.tagId, tagId),
        with: {
            account: true,
        },
    })

    return relations.map(r => r.account)
}
