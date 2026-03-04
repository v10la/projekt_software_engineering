import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const persons = sqliteTable("persons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  birthday: text("birthday").notNull(),
  notes: text("notes").default(""),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const occasions = sqliteTable("occasions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  isDefault: integer("is_default", { mode: "boolean" }).default(false),
});

export const gifts = sqliteTable("gifts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  personId: integer("person_id")
    .notNull()
    .references(() => persons.id, { onDelete: "cascade" }),
  occasionId: integer("occasion_id").references(() => occasions.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  description: text("description").default(""),
  link: text("link").default(""),
  imagePath: text("image_path").default(""),
  giftDate: text("gift_date"),
  isIdea: integer("is_idea", { mode: "boolean" }).notNull().default(true),
  isPurchased: integer("is_purchased", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  giftId: integer("gift_id")
    .notNull()
    .references(() => gifts.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  isDone: integer("is_done", { mode: "boolean" }).notNull().default(false),
});

export const giftLinks = sqliteTable("gift_links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  giftId: integer("gift_id")
    .notNull()
    .references(() => gifts.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
});

export const giftImages = sqliteTable("gift_images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  giftId: integer("gift_id")
    .notNull()
    .references(() => gifts.id, { onDelete: "cascade" }),
  imagePath: text("image_path").notNull(),
});

export const shareTokens = sqliteTable("share_tokens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  personId: integer("person_id")
    .notNull()
    .references(() => persons.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const usersRelations = relations(users, ({ many }) => ({
  persons: many(persons),
  occasions: many(occasions),
}));

export const personsRelations = relations(persons, ({ one, many }) => ({
  user: one(users, { fields: [persons.userId], references: [users.id] }),
  gifts: many(gifts),
  shareTokens: many(shareTokens),
}));

export const occasionsRelations = relations(occasions, ({ one, many }) => ({
  user: one(users, { fields: [occasions.userId], references: [users.id] }),
  gifts: many(gifts),
}));

export const giftsRelations = relations(gifts, ({ one, many }) => ({
  person: one(persons, { fields: [gifts.personId], references: [persons.id] }),
  occasion: one(occasions, {
    fields: [gifts.occasionId],
    references: [occasions.id],
  }),
  tasks: many(tasks),
  links: many(giftLinks),
  images: many(giftImages),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  gift: one(gifts, { fields: [tasks.giftId], references: [gifts.id] }),
}));

export const giftLinksRelations = relations(giftLinks, ({ one }) => ({
  gift: one(gifts, { fields: [giftLinks.giftId], references: [gifts.id] }),
}));

export const giftImagesRelations = relations(giftImages, ({ one }) => ({
  gift: one(gifts, { fields: [giftImages.giftId], references: [gifts.id] }),
}));

export const shareTokensRelations = relations(shareTokens, ({ one }) => ({
  person: one(persons, {
    fields: [shareTokens.personId],
    references: [persons.id],
  }),
}));
