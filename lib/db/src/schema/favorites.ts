import { pgTable, varchar, timestamp, primaryKey } from "drizzle-orm/pg-core";

export const favoritesTable = pgTable("favorites", {
  userId: varchar("user_id").notNull(),
  characterSlug: varchar("character_slug").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.characterSlug] }),
]);

export type Favorite = typeof favoritesTable.$inferSelect;
