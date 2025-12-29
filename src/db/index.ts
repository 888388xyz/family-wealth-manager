import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";
import { env } from "@/lib/env-validator";

const sql = neon(env.DATABASE_URL);

export const db = drizzle(sql, { schema });
