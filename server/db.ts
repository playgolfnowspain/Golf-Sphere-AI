import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Export pool and db as null initially, and only initialize if DATABASE_URL is set
export let pool: pg.Pool | null = null;
export let db: ReturnType<typeof drizzle> | null = null;

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool, { schema });
    console.log("[db] Database connected successfully.");
  } catch (error) {
    console.error("[db] Failed to connect to database:", error);
    // Allow the application to continue with mock storage
  }
} else {
  console.log("[db] DATABASE_URL not set. Database connection skipped.");
}
