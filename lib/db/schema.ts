import { pgTable, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  imageUrl: text("image_url"),
  credits: integer("credits").notNull().default(60), // Free tier gets 60 credits
  subscriptionTier: text("subscription_tier").default("free"), // free, starter, pro, master, studio
  subscriptionStatus: text("subscription_status").default("active"), // active, cancelled, expired
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  isAdmin: boolean("is_admin").default(false), // Admin access
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const creditTransactions = pgTable("credit_transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // Positive for additions, negative for deductions
  type: text("type").notNull(), // purchase, subscription, feature_use, refund
  description: text("description"),
  featureName: text("feature_name"), // depth_map, vectorize, ai_upscale, etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  originalImageUrl: text("original_image_url"),
  currentImageUrl: text("current_image_url"),
  thumbnail: text("thumbnail"),
  width: integer("width"),
  height: integer("height"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(creditTransactions),
  projects: many(projects),
}));

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(users, {
    fields: [creditTransactions.userId],
    references: [users.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
}));

