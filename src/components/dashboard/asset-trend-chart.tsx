"use client"

import * as React from "react"
import { Line, LineChart as ReLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const data = [
    { name: "Jan", value: 800000 },
    { name: "Feb", value: 820000 },
    { name: "Mar", value: 790000 },
    { name: "Apr", value: 850000 },
    { name: "May", value: 900000 },
    { name: "Jun", value: 920000 },
]

export function AssetTrendChart() {
    return (
        <Card className="col-span-2">
            <CardHeader>
                <CardTitle>Asset Growth Trend</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ReLineChart data={data}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `¥${value / 1000}k`}
                            />
                            <Tooltip />
                            <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                        </ReLineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
