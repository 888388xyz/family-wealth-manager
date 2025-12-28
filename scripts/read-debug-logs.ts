import { db } from "../src/db";
import { auditLogs, users } from "../src/db/schema";
import { eq, desc } from "drizzle-orm";

async function main() {
    const logs = await db.query.auditLogs.findMany({
        where: eq(auditLogs.action, 'DEBUG_TRENDS_FETCH'),
        orderBy: [desc(auditLogs.createdAt)],
        limit: 10,
        with: {
            user: {
                columns: {
                    email: true,
                    name: true,
                    role: true
                }
            }
        }
    });

    console.log("Recent Trends Debug Logs:");
    for (const log of logs) {
        console.log(`--- ${log.createdAt?.toLocaleString()} ---`);
        console.log(`User: ${log.user?.email || "Unknown"} (${log.user?.role})`);
        console.log(`Details: ${log.details}`);
    }
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
