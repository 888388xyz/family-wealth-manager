// Import data to PostgreSQL
// Run with: npx tsx scripts/import-to-postgres.ts

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import * as fs from "fs";

if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is required");
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function importData() {
    console.log("Reading exported data...\n");
    
    const data = JSON.parse(
        fs.readFileSync("scripts/exported-data.json", "utf-8")
    );

    console.log(`Importing ${data.users.length} users...`);
    for (const user of data.users) {
        await db.insert(schema.users).values({
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
            image: user.image,
            password: user.password,
            role: user.role || "MEMBER",
            createdAt: user.created_at ? new Date(user.created_at * 1000) : new Date(),
        }).onConflictDoNothing();
    }
    console.log("✓ Users imported");

    console.log(`Importing ${data.bankAccounts.length} bank accounts...`);
    for (const acc of data.bankAccounts) {
        await db.insert(schema.bankAccounts).values({
            id: acc.id,
            userId: acc.userId,
            bankName: acc.bankName,
            accountName: acc.accountName,
            productType: acc.productType || "DEMAND_DEPOSIT",
            accountType: acc.accountType || "OTHER",
            balance: Number(acc.balance) || 0,
            currency: acc.currency || "CNY",
            expectedYield: acc.expectedYield ? Number(acc.expectedYield) : null,
            notes: acc.notes,
            createdAt: acc.created_at ? new Date(acc.created_at * 1000) : new Date(),
            updatedAt: acc.updated_at ? new Date(acc.updated_at * 1000) : null,
        }).onConflictDoNothing();
    }
    console.log("✓ Bank accounts imported");

    if (data.balanceHistory.length > 0) {
        console.log(`Importing ${data.balanceHistory.length} balance history records...`);
        for (const h of data.balanceHistory) {
            await db.insert(schema.balanceHistory).values({
                id: h.id,
                accountId: h.accountId,
                balance: Number(h.balance) || 0,
                recordedAt: h.recorded_at ? new Date(h.recorded_at * 1000) : new Date(),
                createdAt: h.created_at ? new Date(h.created_at * 1000) : new Date(),
            }).onConflictDoNothing();
        }
        console.log("✓ Balance history imported");
    }

    if (data.exchangeRates.length > 0) {
        console.log(`Importing ${data.exchangeRates.length} exchange rates...`);
        for (const rate of data.exchangeRates) {
            await db.insert(schema.exchangeRates).values({
                code: rate.code,
                rate: rate.rate,
                updatedAt: rate.updated_at ? new Date(rate.updated_at * 1000) : new Date(),
            }).onConflictDoNothing();
        }
        console.log("✓ Exchange rates imported");
    }

    console.log("\n✅ All data imported successfully!");
    process.exit(0);
}

importData().catch(console.error);
