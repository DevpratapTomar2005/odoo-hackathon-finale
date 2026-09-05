import { envConfig } from "../config/env.config.js";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: envConfig.DATABASE_URL,
});

const db = drizzle({ client: pool });

const connectDB = async () => {
  try {
    const client = await pool.connect();
    client.query("select 1");
    client.release();
    console.log("Database Connected Successfully");
  } catch (err) {
    console.error("Error connecting to database:", err);
    process.exit(1);
  }
};

export { db, connectDB };
