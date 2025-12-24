import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";

// --- Auth (NextAuth.js Standard Schema) ---

export const users = sqliteTable("user", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    email: text("email").notNull().unique(),
    emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
    image: text("image"),
    password: text("password"),
    role: text("role", { enum: ["ADMIN", "MEMBER"] }).default("MEMBER"),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const accounts = sqliteTable("account", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
});

export const sessions = sqliteTable("session", {
    sessionToken: text("sessionToken").primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable("verificationToken", {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

// --- 银行账户 ---

export const bankAccounts = sqliteTable("bank_account", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    bankName: text("bankName").notNull(), // 银行/平台名称
    accountName: text("accountName").notNull(), // 产品名称
    productType: text("productType", {
        enum: ["FUND", "FIXED_DEPOSIT", "DEMAND_DEPOSIT", "DEMAND_WEALTH", "PRECIOUS_METAL", "STOCK", "OTHER"]
    }).notNull().default("DEMAND_DEPOSIT"), // 产品类型：基金/定期理财/活期存款/活期理财/贵金属/股票/其他
    accountType: text("accountType", {
        enum: ["CHECKING", "SAVINGS", "MONEY_MARKET", "CREDIT", "WEALTH", "OTHER"]
    }).notNull().default("CHECKING"),
    balance: integer("balance").notNull().default(0), // 当前余额（分）
    currency: text("currency").default("CNY"), // 货币：CNY/USD
    expectedYield: integer("expectedYield"), // 预期年化收益率（万分之一，如 250 = 2.50%）
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$onUpdate(() => new Date()),
});

// --- 余额历史（用于图表） ---

export const balanceHistory = sqliteTable("balance_history", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    accountId: text("accountId")
        .notNull()
        .references(() => bankAccounts.id, { onDelete: "cascade" }),
    balance: integer("balance").notNull(), // 余额快照（分）
    recordedAt: integer("recorded_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// --- 汇率缓存 ---

export const exchangeRates = sqliteTable("exchange_rates", {
    code: text("code").primaryKey(), // 货币代码，如 USD, HKD
    rate: text("rate").notNull(), // 1 人民币 等于多少该币种 (或者是 1 该币种等于多少人民币，这里定义为 1该币种 = X CNY)
    // 实际上方便计算，还是定义 1 XXX = X CNY
    updatedAt: integer("updated_at", { mode: "timestamp" }).$onUpdate(() => new Date()),
});

// --- Relations ---

export const bankAccountsRelations = relations(bankAccounts, ({ one, many }) => ({
    user: one(users, {
        fields: [bankAccounts.userId],
        references: [users.id],
    }),
    history: many(balanceHistory),
}));

export const balanceHistoryRelations = relations(balanceHistory, ({ one }) => ({
    account: one(bankAccounts, {
        fields: [balanceHistory.accountId],
        references: [bankAccounts.id],
    }),
}));
