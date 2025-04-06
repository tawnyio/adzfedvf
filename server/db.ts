import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";
import { log } from "./vite";

const { Pool } = pg;

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test connection
pool.connect()
  .then(() => log("Successfully connected to PostgreSQL database", "db"))
  .catch((err) => {
    log(`Error connecting to PostgreSQL database: ${err.message}`, "db");
    process.exit(1);
  });

// Create Drizzle instance
export const db = drizzle(pool, { schema });