import { NextRequest, NextResponse } from "next/server"
import { checkMaturityRemindersAction } from "@/actions/notification-actions"
import { createAllUsersSnapshotsAction } from "@/actions/snapshot-actions"

// Vercel Cron Jobs 通过这个 header 验证请求
// https://vercel.com/docs/cron-jobs
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
    // 验证请求来源（Vercel Cron 或授权调用）
    const authHeader = request.headers.get("authorization")

    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        // 1. 检查到期提醒并发送邮件
        const reminderResult = await checkMaturityRemindersAction()

        // 2. 为所有用户创建今日快照（传入 true 跳过认证检查）
        const snapshotResult = await createAllUsersSnapshotsAction(true)

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            results: {
                maturityReminders: reminderResult,
                dailySnapshots: snapshotResult
            }
        })
    } catch (error) {
        console.error("[Cron] Daily tasks failed:", error)
        return NextResponse.json(
            { error: "Daily tasks failed", details: String(error) },
            { status: 500 }
        )
    }
}

// 配置 edge runtime 以获得更好的冷启动性能（可选）
// export const runtime = "edge"
