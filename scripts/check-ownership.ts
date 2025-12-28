import { db } from "../src/db";
import { users, bankAccounts } from "../src/db/schema";
import { sql } from "drizzle-orm";

async function main() {
    const allUsers = await db.select().from(users);
    console.log("User/Account Ownership:");
    for (const u of allUsers) {
        const accounts = await db.select({ count: sql<number>`count(*)` })
            .from(bankAccounts)
            .where(eq(bankAccounts.userId, u.id));
        console.log(`- User: ${u.name} (${u.email}), ID: ${u.id}, Accounts Owned: ${accounts[0].count}`);
    }
    process.exit(0);
}

import { eq } from "drizzle-orm";

main().catch(err => {
    console.error(err);
    process.exit(1);
});
