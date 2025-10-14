import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create the connection
const client = postgres(process.env.DATABASE_URL);

// Create the drizzle instance
export const db = drizzle(client, { schema });

// Export types
export type User = typeof schema.users.$inferSelect;
export type NewUser = typeof schema.users.$inferInsert;
export type CreditTransaction = typeof schema.creditTransactions.$inferSelect;
export type NewCreditTransaction = typeof schema.creditTransactions.$inferInsert;
export type Project = typeof schema.projects.$inferSelect;
export type NewProject = typeof schema.projects.$inferInsert;

