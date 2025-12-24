// Seed script to import Excel data
// Run with: npx tsx scripts/seed-data.ts

import { db } from "../src/db"
import { bankAccounts, users } from "../src/db/schema"
import { eq } from "drizzle-orm"

const data = [
    // 人民币资产
    { currency: "CNY", productType: "FUND", bankName: "京东", accountName: "小金保", expectedYield: 250, balance: 1000300 },
    { currency: "CNY", productType: "FUND", bankName: "京东", accountName: "华夏中短债债券", expectedYield: 400, balance: 11111600 },
    { currency: "CNY", productType: "FIXED_DEPOSIT", bankName: "京东", accountName: "东家-东升", expectedYield: 0, balance: 100000000 },
    { currency: "CNY", productType: "FUND", bankName: "博时", accountName: "博时天颐债券", expectedYield: null, balance: 1032300 },
    { currency: "CNY", productType: "FUND", bankName: "博时", accountName: "专精特新主题", expectedYield: null, balance: 10007500 },
    { currency: "CNY", productType: "FUND", bankName: "博时", accountName: "博时主题", expectedYield: null, balance: 9991800 },
    { currency: "CNY", productType: "DEMAND_DEPOSIT", bankName: "工商银行", accountName: "工行活期", expectedYield: 30, balance: 3000000 },
    { currency: "CNY", productType: "DEMAND_WEALTH", bankName: "工商银行", accountName: "工行理财", expectedYield: 200, balance: 25748000 },
    { currency: "CNY", productType: "PRECIOUS_METAL", bankName: "工商银行", accountName: "工行黄金", expectedYield: null, balance: 39319200 },
    { currency: "CNY", productType: "FUND", bankName: "工商银行", accountName: "博时主题", expectedYield: null, balance: 15875300 },
    { currency: "CNY", productType: "FUND", bankName: "支付宝", accountName: "基金汇总", expectedYield: null, balance: 4175400 },
    { currency: "CNY", productType: "DEMAND_DEPOSIT", bankName: "汇丰中国", accountName: "汇丰活期", expectedYield: 30, balance: 1000500 },
    { currency: "CNY", productType: "FUND", bankName: "汇丰中国", accountName: "平安货币", expectedYield: null, balance: 50748100 },
    { currency: "CNY", productType: "FIXED_DEPOSIT", bankName: "浦发银行", accountName: "浦发银行理财", expectedYield: 250, balance: 189895700 },
    { currency: "CNY", productType: "DEMAND_DEPOSIT", bankName: "浦发银行", accountName: "浦发活期", expectedYield: 30, balance: 1968500 },
    { currency: "CNY", productType: "FIXED_DEPOSIT", bankName: "浦发银行", accountName: "养老存款", expectedYield: 325, balance: 4800000 },
    { currency: "CNY", productType: "STOCK", bankName: "股市", accountName: "股票", expectedYield: null, balance: 90000000 },
    // 美元资产
    { currency: "USD", productType: "DEMAND_DEPOSIT", bankName: "工商银行", accountName: "工行活期", expectedYield: 30, balance: 10757500 },
    { currency: "USD", productType: "DEMAND_DEPOSIT", bankName: "汇丰美国", accountName: "活期", expectedYield: null, balance: 1430974 },
    { currency: "USD", productType: "FIXED_DEPOSIT", bankName: "汇丰美国", accountName: "CD", expectedYield: 400, balance: 79777698 },
    { currency: "USD", productType: "FIXED_DEPOSIT", bankName: "汇丰香港", accountName: "美金", expectedYield: null, balance: 14314846 },
    { currency: "USD", productType: "DEMAND_DEPOSIT", bankName: "浦发银行", accountName: "浦发活期", expectedYield: null, balance: 1191500 },
]

async function seed() {
    console.log("Finding admin user...")

    // Find the first user (admin)
    const user = await db.query.users.findFirst()

    if (!user) {
        console.error("No user found! Please register first.")
        process.exit(1)
    }

    console.log(`Found user: ${user.email}`)
    console.log(`Importing ${data.length} accounts...`)

    for (const item of data) {
        await db.insert(bankAccounts).values({
            userId: user.id,
            bankName: item.bankName,
            accountName: item.accountName,
            productType: item.productType as "FUND" | "FIXED_DEPOSIT" | "DEMAND_DEPOSIT" | "DEMAND_WEALTH" | "PRECIOUS_METAL" | "STOCK" | "OTHER",
            accountType: "OTHER",
            currency: item.currency,
            balance: item.balance,
            expectedYield: item.expectedYield,
        })
        console.log(`✓ ${item.bankName} - ${item.accountName}`)
    }

    console.log("\n✅ Import complete!")
    process.exit(0)
}

seed().catch(console.error)
