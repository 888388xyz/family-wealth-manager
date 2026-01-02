import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { env } from "@/lib/env-validator";

// Determine if we are running locally or need a persistent TCP connection
// vs the stateless HTTP driver for Neon Serverless
const isLocal = env.DATABASE_URL.includes("localhost") || 
                env.DATABASE_URL.includes("127.0.0.1") || 
                env.DATABASE_URL.includes("postgres:"); // Generic postgres container

let dbInstance;

if (isLocal) {
    const client = postgres(env.DATABASE_URL);
    dbInstance = drizzlePg(client, { schema });
} else {
    const sql = neon(env.DATABASE_URL);
    dbInstance = drizzle(sql, { schema });
}

export const db = dbInstance;
