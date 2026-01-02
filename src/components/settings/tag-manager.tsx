"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Tag } from "lucide-react"
import { createTagAction, updateTagAction, deleteTagAction } from "@/actions/tag-actions"

interface TagItem {
    id: string
    name: string
    color: string | null
    sortOrder: number | null
}

interface TagManagerProps {
    initialTags: TagItem[]
}

const presetColors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#84cc16", // lime
]

export function TagManager({ initialTags }: TagManagerProps) {
    const [tags, setTags] = useState<TagItem[]>(initialTags)
    const [isPending, startTransition] = useTransition()
    const [editingTag, setEditingTag] = useState<TagItem | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [name, setName] = useState("")
    const [color, setColor] = useState(presetColors[0])

    const openCreateDialog = () => {
        setEditingTag(null)
        setName("")
        setColor(presetColors[0])
        setDialogOpen(true)
    }

    const openEditDialog = (tag: TagItem) => {
        setEditingTag(tag)
        setName(tag.name)
        setColor(tag.color || presetColors[0])
        setDialogOpen(true)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        startTransition(async () => {
            if (editingTag) {
                const result = await updateTagAction(editingTag.id, { name, color })
                if (result.success) {
                    setTags(tags.map(t => t.id === editingTag.id ? { ...t, name, color } : t))
                }
            } else {
                const result = await createTagAction({ name, color })
                if (result.success && result.tag) {
                    setTags([...tags, result.tag])
                }
            }
            setDialogOpen(false)
        })
    }

    const handleDelete = (id: string) => {
        if (!confirm("确定要删除这个标签吗？关联的账户将失去此标签。")) return
        startTransition(async () => {
            const result = await deleteTagAction(id)
            if (result.success) {
                setTags(tags.filter(t => t.id !== id))
            }
        })
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Tag className="h-5 w-5" />
                            标签管理
                        </CardTitle>
                        <CardDescription>创建和管理账户标签，用于分类和筛选</CardDescription>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" onClick={openCreateDialog}>
                                <Plus className="h-4 w-4 mr-1" />
                                新建标签
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[350px]">
                            <form onSubmit={handleSubmit}>
                                <DialogHeader>
                                    <DialogTitle>{editingTag ? "编辑标签" : "新建标签"}</DialogTitle>
                                    <DialogDescription>
                                        {editingTag ? "修改标签信息" : "创建一个新的账户标签"}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="tagName">标签名称</Label>
                                        <Input
                                            id="tagName"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="例如：应急资金"
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>标签颜色</Label>
                                        <div className="flex gap-2 flex-wrap">
                                            {presetColors.map((c) => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? "border-primary scale-110" : "border-transparent"}`}
                                                    style={{ backgroundColor: c }}
                                                    onClick={() => setColor(c)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                        取消
                                    </Button>
                                    <Button type="submit" disabled={isPending}>
                                        {isPending ? "保存中..." : "保存"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {tags.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        暂无标签，点击右上角按钮创建
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                            <div
                                key={tag.id}
                                className="group flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-white"
                                style={{ backgroundColor: tag.color || presetColors[0] }}
                            >
                                <span>{tag.name}</span>
                                <div className="hidden group-hover:flex gap-1">
                                    <button
                                        onClick={() => openEditDialog(tag)}
                                        className="p-0.5 rounded hover:bg-white/20"
                                        disabled={isPending}
                                    >
                                        <Pencil className="h-3 w-3" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(tag.id)}
                                        className="p-0.5 rounded hover:bg-white/20"
                                        disabled={isPending}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
