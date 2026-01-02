"use client"

import { useState, useEffect } from "react"
import { getAccountTagsAction } from "@/actions/tag-actions"

interface Tag {
    id: string
    name: string
    color: string | null
}

interface AccountTagBadgesProps {
    accountId: string
}

export function AccountTagBadges({ accountId }: AccountTagBadgesProps) {
    const [tags, setTags] = useState<Tag[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getAccountTagsAction(accountId)
            .then(setTags)
            .finally(() => setLoading(false))
    }, [accountId])

    if (loading) {
        return <span className="text-xs text-muted-foreground">...</span>
    }

    if (tags.length === 0) {
        return <span className="text-xs text-muted-foreground">-</span>
    }

    return (
        <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
                <span
                    key={tag.id}
                    className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: tag.color || '#3b82f6' }}
                >
                    {tag.name}
                </span>
            ))}
        </div>
    )
}
