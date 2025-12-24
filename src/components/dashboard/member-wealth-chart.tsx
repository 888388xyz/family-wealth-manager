"use client"

import * as React from "react"
import { Bar, BarChart as ReBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const data = [
    { name: "Alice", value: 450000 },
    { name: "Bob", value: 320000 },
    { name: "Charlie", value: 150000 },
]

export function MemberWealthChart() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Member Wealth</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ReBarChart data={data}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `¥${value / 1000}k`}
                            />
                            <Tooltip cursor={{ fill: "transparent" }} />
                            <Bar dataKey="value" fill="#adfa1d" radius={[4, 4, 0, 0]} />
                        </ReBarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
