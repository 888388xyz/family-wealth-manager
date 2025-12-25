import { pgTable, text, integer, timestamp, varchar, bigint } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --- Auth (NextAuth.js Standard Schema) ---

export const users = pgTable("user", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    email: text("email").notNull().unique(),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: text("image"),
    password: text("password"),
    role: text("role", { enum: ["ADMIN", "MEMBER"] }).default("MEMBER"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const accounts = pgTable("account", {
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

export const sessions = pgTable("session", {
    sessionToken: text("sessionToken").primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verificationToken", {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
});

// --- 银行账户 ---

export const bankAccounts = pgTable("bank_account", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    bankName: text("bankName").notNull(),
    accountName: text("accountName").notNull(),
    productType: text("productType", {
        enum: ["FUND", "FIXED_DEPOSIT", "DEMAND_DEPOSIT", "DEMAND_WEALTH", "PRECIOUS_METAL", "STOCK", "OTHER"]
    }).notNull().default("DEMAND_DEPOSIT"),
    accountType: text("accountType", {
        enum: ["CHECKING", "SAVINGS", "MONEY_MARKET", "CREDIT", "WEALTH", "OTHER"]
    }).notNull().default("CHECKING"),
    balance: bigint("balance", { mode: "number" }).notNull().default(0),
    currency: text("currency").default("CNY"),
    expectedYield: integer("expectedYield"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(() => new Date()),
});

// --- 余额历史（用于图表） ---

export const balanceHistory = pgTable("balance_history", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    accountId: text("accountId")
        .notNull()
        .references(() => bankAccounts.id, { onDelete: "cascade" }),
    balance: bigint("balance", { mode: "number" }).notNull(),
    recordedAt: timestamp("recorded_at", { mode: "date" }).defaultNow(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// --- 汇率缓存 ---

export const exchangeRates = pgTable("exchange_rates", {
    code: text("code").primaryKey(),
    rate: text("rate").notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(() => new Date()),
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
