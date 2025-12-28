import { db } from "../src/db";
import { users, dailySnapshots } from "../src/db/schema";
import { eq, sql } from "drizzle-orm";

async function main() {
    const allUsers = await db.select().from(users);
    console.log("Database Diagnostics:");
    for (const u of allUsers) {
        const countRes = await db.select({ count: sql<number>`count(*)` })
            .from(dailySnapshots)
            .where(eq(dailySnapshots.userId, u.id));
        console.log(`- User: ${u.name} (${u.email}), ID: ${u.id}, Snapshot Count: ${countRes[0].count}`);
    }
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
