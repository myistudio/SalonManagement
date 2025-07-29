// SQLite database connection using better-sqlite3
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@shared/schema";

// Create database instance
const sqlite = new Database("salon.db");
export const db = drizzle(sqlite, { schema });