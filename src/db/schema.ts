import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

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

// --- Application Logic ---

export const assets = sqliteTable("asset", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // e.g., "CMB Savings"
    type: text("type", {
        enum: ["CASH", "REAL_ESTATE", "STOCK", "FUND", "INSURANCE", "SAVINGS", "OTHER"]
    }).notNull(),
    value: integer("value").notNull(), // stored in cents
    currency: text("currency").default("CNY"),
    purchasePrice: integer("purchasePrice"), // stored in cents
    purchaseDate: integer("purchaseDate", { mode: "timestamp" }),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$onUpdate(() => new Date()),
});

export const investments = sqliteTable("investment", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // e.g., "Kweichow Moutai"
    symbol: text("symbol"), // e.g., "600519"
    type: text("type", { enum: ["STOCK", "FUND", "BOND", "OTHER"] }).notNull(),
    quantity: real("quantity").notNull(), // e.g., 100.5 shares
    costBasis: integer("costBasis").notNull(), // Total cost in cents
    currentPrice: integer("currentPrice").notNull(), // Per unit in cents (updated manually or auto)
    marketValue: integer("marketValue").notNull(), // Cache: qty * currentPrice (cents)
    purchaseDate: integer("purchaseDate", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$onUpdate(() => new Date()),
});
