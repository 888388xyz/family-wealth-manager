// Export all data from SQLite
// Run with: npx tsx scripts/export-data.ts

import { createClient } from "@libsql/client";
import * as fs from "fs";

const client = createClient({
    url: "file:sqlite.db",
});

async function exportData() {
    console.log("Exporting data from SQLite...\n");

    // Export users
    const usersResult = await client.execute("SELECT * FROM user");
    const users = usersResult.rows;
    console.log(`Found ${users.length} users`);

    // Export bank accounts
    const bankAccountsResult = await client.execute("SELECT * FROM bank_account");
    const bankAccounts = bankAccountsResult.rows;
    console.log(`Found ${bankAccounts.length} bank accounts`);

    // Export balance history
    const balanceHistoryResult = await client.execute("SELECT * FROM balance_history");
    const balanceHistory = balanceHistoryResult.rows;
    console.log(`Found ${balanceHistory.length} balance history records`);

    // Export exchange rates
    const exchangeRatesResult = await client.execute("SELECT * FROM exchange_rates");
    const exchangeRates = exchangeRatesResult.rows;
    console.log(`Found ${exchangeRates.length} exchange rates`);

    const exportedData = {
        exportedAt: new Date().toISOString(),
        users,
        bankAccounts,
        balanceHistory,
        exchangeRates,
    };

    fs.writeFileSync(
        "scripts/exported-data.json",
        JSON.stringify(exportedData, null, 2)
    );

    console.log("\n✅ Data exported to scripts/exported-data.json");
    process.exit(0);
}

exportData().catch(console.error);
