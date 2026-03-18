import { pgTable, unique, integer, varchar, timestamp, boolean, uuid, text } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const users = pgTable("users", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "users_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	fullname: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	isVerified: boolean().default(false),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const marketResolutions = pgTable("market_resolutions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	marketId: uuid("market_id").notNull(),
	winningOutcomeId: uuid("winning_outcome_id").notNull(),
	resolvedAt: timestamp("resolved_at", { mode: 'string' }).defaultNow().notNull(),
});

export const markets = pgTable("markets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 500 }).notNull(),
	slug: varchar({ length: 500 }).notNull(),
	description: text(),
	imageUrl: varchar("image_url", { length: 500 }),
	category: varchar({ length: 100 }).notNull(),
	status: varchar({ length: 50 }).default('active').notNull(),
	resolvedOutcomeId: uuid("resolved_outcome_id"),
	volume: integer().default(0).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("markets_slug_unique").on(table.slug),
]);

export const outcomes = pgTable("outcomes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	marketId: uuid("market_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	price: integer().default(50).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const positions = pgTable("positions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	outcomeId: uuid("outcome_id").notNull(),
	shares: integer().default(0).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const trades = pgTable("trades", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	outcomeId: uuid("outcome_id").notNull(),
	type: varchar({ length: 50 }).notNull(),
	amount: integer().notNull(),
	shares: integer().notNull(),
	priceAtPurchase: integer("price_at_purchase").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	type: varchar({ length: 50 }).notNull(),
	amount: integer().notNull(),
	metadata: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});
