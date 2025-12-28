import { db } from "@/db"
import { auditLogs, users } from "@/db/schema"
import { desc, eq } from "drizzle-orm"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DebugLogsPage() {
    const session = await auth()
    if (!session?.user?.id) redirect("/login")

    // 这里可以加一个简单的 Admin 校验，但为了调试，如果是你自己测试，可以先开着
    const logs = await db.query.auditLogs.findMany({
        orderBy: [desc(auditLogs.createdAt)],
        limit: 50,
        with: {
            user: {
                columns: {
                    email: true,
                    role: true
                }
            }
        }
    })

    return (
        <div className="p-8 font-mono text-xs">
            <h1 className="text-xl font-bold mb-4">Remote Debug Logs</h1>
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-slate-100">
                        <th className="border p-2">Time</th>
                        <th className="border p-2">User</th>
                        <th className="border p-2">Action</th>
                        <th className="border p-2">Details</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map(log => (
                        <tr key={log.id}>
                            <td className="border p-2">{log.createdAt?.toLocaleString()}</td>
                            <td className="border p-2">{log.user?.email || "Unknown"} ({log.user?.role})</td>
                            <td className="border p-2 font-bold">{log.action}</td>
                            <td className="border p-2 max-w-md break-all">{log.details}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
