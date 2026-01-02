"use client"

import { useState, useEffect, useTransition } from "react"
import { Label } from "@/components/ui/label"
import { getTagsAction, getAccountTagsAction, setAccountTagsAction } from "@/actions/tag-actions"

interface Tag {
    id: string
    name: string
    color: string | null
}

interface TagSelectorProps {
    accountId?: string  // If provided, will load and save tags for this account
    selectedTagIds?: string[]  // For controlled mode (new accounts)
    onTagsChange?: (tagIds: string[]) => void  // Callback when tags change
}

export function TagSelector({ accountId, selectedTagIds: controlledTagIds, onTagsChange }: TagSelectorProps) {
    const [availableTags, setAvailableTags] = useState<Tag[]>([])
    const [selectedIds, setSelectedIds] = useState<string[]>(controlledTagIds || [])
    const [isPending, startTransition] = useTransition()
    const [loading, setLoading] = useState(true)

    const isControlled = controlledTagIds !== undefined

    useEffect(() => {
        async function loadData() {
            setLoading(true)
            try {
                const [tags, accountTags] = await Promise.all([
                    getTagsAction(),
                    accountId ? getAccountTagsAction(accountId) : Promise.resolve([])
                ])
                setAvailableTags(tags)
                if (accountId && accountTags.length > 0) {
                    setSelectedIds(accountTags.map(t => t.id))
                }
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [accountId])

    // Sync with controlled value
    useEffect(() => {
        if (isControlled && controlledTagIds) {
            setSelectedIds(controlledTagIds)
        }
    }, [controlledTagIds, isControlled])

    const toggleTag = (tagId: string) => {
        const newSelected = selectedIds.includes(tagId)
            ? selectedIds.filter(id => id !== tagId)
            : [...selectedIds, tagId]

        setSelectedIds(newSelected)

        // If we have an accountId, save immediately
        if (accountId) {
            startTransition(async () => {
                await setAccountTagsAction(accountId, newSelected)
            })
        }

        // Notify parent
        onTagsChange?.(newSelected)
    }

    if (loading) {
        return (
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">标签</Label>
                <div className="col-span-3 text-sm text-muted-foreground">加载中...</div>
            </div>
        )
    }

    if (availableTags.length === 0) {
        return (
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">标签</Label>
                <div className="col-span-3 text-sm text-muted-foreground">
                    暂无标签，请在设置页创建
                </div>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">标签</Label>
            <div className="col-span-3 flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                    const isSelected = selectedIds.includes(tag.id)
                    return (
                        <button
                            key={tag.id}
                            type="button"
                            disabled={isPending}
                            onClick={() => toggleTag(tag.id)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all border-2 ${isSelected
                                    ? 'text-white border-transparent'
                                    : 'bg-transparent border-current opacity-60 hover:opacity-100'
                                }`}
                            style={{
                                backgroundColor: isSelected ? (tag.color || '#3b82f6') : 'transparent',
                                color: isSelected ? 'white' : (tag.color || '#3b82f6'),
                                borderColor: isSelected ? 'transparent' : (tag.color || '#3b82f6')
                            }}
                        >
                            {tag.name}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
