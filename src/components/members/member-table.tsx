"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"

interface Member {
    id: string
    name: string | null
    email: string
    role: "ADMIN" | "MEMBER" | null
    image: string | null
    createdAt: Date | null
}

function getRoleLabel(role: string | null) {
    return role === "ADMIN" ? "管理员" : "成员"
}

export function MemberTable({ members }: { members: Member[] }) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">头像</TableHead>
                        <TableHead>姓名</TableHead>
                        <TableHead>邮箱</TableHead>
                        <TableHead>角色</TableHead>
                        <TableHead className="text-right">加入时间</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {members.map((member) => (
                        <TableRow key={member.id}>
                            <TableCell>
                                <Avatar>
                                    <AvatarImage src={member.image || ""} />
                                    <AvatarFallback>{member.email.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </TableCell>
                            <TableCell className="font-medium">{member.name || "未设置"}</TableCell>
                            <TableCell>{member.email}</TableCell>
                            <TableCell>
                                <Badge variant={member.role === "ADMIN" ? "default" : "secondary"}>
                                    {getRoleLabel(member.role)}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                {member.createdAt
                                    ? formatDistanceToNow(new Date(member.createdAt), { addSuffix: true, locale: zhCN })
                                    : "-"}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
