import { db } from "../src/db";
import { dailySnapshots, users } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Starting exhaustive snapshot seeding...");

    // Get all users
    const allUsers = await db.select().from(users);
    if (allUsers.length === 0) {
        console.error("No users found!");
        process.exit(1);
    }

    const now = new Date();

    for (const user of allUsers) {
        console.log(`Seeding data for user: ${user.name} (${user.email})`);

        const snapshots = [];
        // Base balance around 10M CNY
        let currentBalance = 1000000000; // 10M * 100 (cents)

        for (let i = 90; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // Add some random fluctuation
            const fluctuation = 1 + (Math.random() * 0.025 - 0.01);
            currentBalance = Math.round(currentBalance * fluctuation);

            snapshots.push({
                userId: user.id,
                totalBalance: currentBalance,
                currency: "CNY",
                snapshotDate: dateStr,
                createdAt: date,
            });
        }

        // Insert data for this user
        console.log(`- Inserting ${snapshots.length} snapshots for ${user.email}...`);
        await db.delete(dailySnapshots).where(eq(dailySnapshots.userId, user.id));
        await db.insert(dailySnapshots).values(snapshots);
    }

    console.log("Exhaustive seeding complete!");
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
