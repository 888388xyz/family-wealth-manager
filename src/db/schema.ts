import { pgTable, text, integer, timestamp, bigint, date, boolean, jsonb } from "drizzle-orm/pg-core";
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
    twoFactorSecret: text("two_factor_secret"),
    twoFactorEnabled: boolean("two_factor_enabled").default(false),
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

// --- 2FA Pending Sessions ---

export const pending2FASessions = pgTable("pending_2fa_sessions", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// --- 银行账户 ---

export const bankAccounts = pgTable("bank_account", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    bankName: text("bankName").notNull(),
    accountName: text("accountName").notNull(),
    productType: text("productType").notNull().default("DEMAND_DEPOSIT"),
    accountType: text("accountType").notNull().default("OTHER"),
    balance: bigint("balance", { mode: "number" }).notNull().default(0),
    currency: text("currency").default("CNY"),
    expectedYield: integer("expectedYield"),
    maturityDate: date("maturity_date", { mode: "string" }), // 到期日期
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

// --- 系统配置表 ---

export const systemBanks = pgTable("system_banks", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull().unique(),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const systemProductTypes = pgTable("system_product_types", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    value: text("value").notNull().unique(),
    label: text("label").notNull(),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const systemCurrencies = pgTable("system_currencies", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    code: text("code").notNull().unique(),
    label: text("label").notNull(),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// --- 审计日志 ---

export const auditLogs = pgTable("audit_logs", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    targetType: text("targetType").notNull(),
    targetId: text("targetId"),
    details: text("details"), // JSON string
    ipAddress: text("ipAddress"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// --- 通知表 ---

export const notifications = pgTable("notifications", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // 'BALANCE_CHANGE' | 'MATURITY_REMINDER' | 'SYSTEM'
    title: text("title").notNull(),
    content: text("content").notNull(),
    isRead: boolean("is_read").default(false),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// --- 系统设置 ---

export const systemSettings = pgTable("system_settings", {
    key: text("key").primaryKey(),
    value: text("value").notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().$onUpdate(() => new Date()),
});

// --- 每日资产快照 ---

export const dailySnapshots = pgTable("daily_snapshots", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    totalBalance: bigint("total_balance", { mode: "number" }).notNull(),
    currency: text("currency").default("CNY"),
    snapshotDate: date("snapshot_date", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// --- 资产目标 ---

export const assetGoals = pgTable("asset_goals", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    targetAmount: bigint("target_amount", { mode: "number" }).notNull(),
    currentAmount: bigint("current_amount", { mode: "number" }).default(0),
    currency: text("currency").default("CNY"),
    deadline: date("deadline", { mode: "string" }),
    category: text("category"), // savings/investment/emergency/other
    linkedAccountIds: jsonb("linked_account_ids").$type<string[]>().default([]),
    notes: text("notes"),
    isCompleted: boolean("is_completed").default(false),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(() => new Date()),
});

// --- 账户标签 ---

export const accountTags = pgTable("account_tags", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").default("#3b82f6"),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// --- 账户-标签关联（多对多） ---

export const accountTagRelations = pgTable("account_tag_relations", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    accountId: text("accountId").notNull().references(() => bankAccounts.id, { onDelete: "cascade" }),
    tagId: text("tagId").notNull().references(() => accountTags.id, { onDelete: "cascade" }),
});

// --- Relations ---

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
    user: one(users, {
        fields: [auditLogs.userId],
        references: [users.id],
    }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
    user: one(users, {
        fields: [notifications.userId],
        references: [users.id],
    }),
}));

export const dailySnapshotsRelations = relations(dailySnapshots, ({ one }) => ({
    user: one(users, {
        fields: [dailySnapshots.userId],
        references: [users.id],
    }),
}));

export const bankAccountsRelations = relations(bankAccounts, ({ one, many }) => ({
    user: one(users, {
        fields: [bankAccounts.userId],
        references: [users.id],
    }),
    history: many(balanceHistory),
    tagRelations: many(accountTagRelations),
}));

export const balanceHistoryRelations = relations(balanceHistory, ({ one }) => ({
    account: one(bankAccounts, {
        fields: [balanceHistory.accountId],
        references: [bankAccounts.id],
    }),
}));

export const pending2FASessionsRelations = relations(pending2FASessions, ({ one }) => ({
    user: one(users, {
        fields: [pending2FASessions.userId],
        references: [users.id],
    }),
}));

export const assetGoalsRelations = relations(assetGoals, ({ one }) => ({
    user: one(users, {
        fields: [assetGoals.userId],
        references: [users.id],
    }),
}));

export const accountTagsRelations = relations(accountTags, ({ one, many }) => ({
    user: one(users, {
        fields: [accountTags.userId],
        references: [users.id],
    }),
    accountRelations: many(accountTagRelations),
}));

export const accountTagRelationsRelations = relations(accountTagRelations, ({ one }) => ({
    account: one(bankAccounts, {
        fields: [accountTagRelations.accountId],
        references: [bankAccounts.id],
    }),
    tag: one(accountTags, {
        fields: [accountTagRelations.tagId],
        references: [accountTags.id],
    }),
}));
