import { db } from "../src/db";
import { dailySnapshots } from "../src/db/schema";
import { sql } from "drizzle-orm";

async function main() {
    const res = await db.select({ count: sql<number>`count(*)` }).from(dailySnapshots);
    console.log(`GLOBAL_SNAPSHOT_COUNT: ${res[0].count}`);

    // Also check audit logs
    const logs = await db.execute(sql`SELECT action, details, created_at FROM audit_log WHERE action = 'DEBUG_TRENDS_FETCH' ORDER BY created_at DESC LIMIT 5`);
    console.log("RECENT_DEBUG_LOGS:");
    console.log(JSON.stringify(logs, null, 2));

    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
