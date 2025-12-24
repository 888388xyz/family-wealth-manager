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

interface Member {
    id: string
    name: string | null
    email: string
    role: "ADMIN" | "MEMBER" | null
    image: string | null
    createdAt: Date | null
}

export function MemberTable({ members }: { members: Member[] }) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">Avatar</TableHead>
                        <TableHead>Nam</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Joined</TableHead>
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
                            <TableCell className="font-medium">{member.name || "Unknown"}</TableCell>
                            <TableCell>{member.email}</TableCell>
                            <TableCell>
                                <Badge variant={member.role === "ADMIN" ? "default" : "secondary"}>
                                    {member.role || "MEMBER"}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : "-"}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
