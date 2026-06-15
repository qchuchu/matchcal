import { int, text, sqliteTable } from "drizzle-orm/sqlite-core";

export const clicks = sqliteTable("clicks", {
  id: int("id").primaryKey({ autoIncrement: true }),
  createdAt: text("created_at").notNull(),
  teams: text("teams").notNull(),    // comma-separated: "FRA,ARG"
  country: text("country").notNull(), // "fr"
  action: text("action").notNull(),  // "google" | "apple" | "copy"
});
