import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  boolean,
  text,
  unique,
} from "drizzle-orm/pg-core";

// ─── USERS ───────────────────────────────────────────────────────────────────
export const usersTable = pgTable(
  "users",
  {
    // Matching the actual DB schema discovered via introspection
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    fullname: varchar("fullname", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    password: varchar("password", { length: 255 }).notNull(),
    isAdmin: boolean("isAdmin").default(false).notNull(),

    points: integer("points").default(1000).notNull(),
    isVerified: boolean("isVerified").default(false).notNull(),

    lastFaucetClaimedAt: timestamp("last_faucet_claimed_at"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [unique("users_email_unique").on(table.email)],
);

// ─── COMMENTS ───────────────────────────────────────────────────────────────
export const commentsTable = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  marketId: uuid("market_id").notNull(),
  userId: integer("user_id").notNull(),

  content: text("content").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── MARKETS ─────────────────────────────────────────────────────────────────
export const marketsTable = pgTable("markets", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),

  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).unique().notNull(),
  description: text("description"),
  imageUrl: varchar("image_url", { length: 500 }),

  category: varchar("category", { length: 100 }).notNull(),

  status: varchar("status", { length: 50 }).default("active").notNull(),
  resolvedOutcomeId: uuid("resolved_outcome_id"),

  volume: integer("volume").default(0).notNull(),
  
  // AMM Pools (Initial liquidity)
  yesPool: integer("yes_pool").default(500).notNull(),
  noPool: integer("no_pool").default(500).notNull(),

  expiresAt: timestamp("expires_at").notNull(),

  createdBy: integer("created_by"), // Removed reference temporarily if types mismatch
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── OUTCOMES ────────────────────────────────────────────────────────────────
export const outcomesTable = pgTable("outcomes", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  marketId: uuid("market_id").notNull(),

  title: varchar("title", { length: 255 }).notNull(),
  price: integer("price").default(50).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── TRADES ──────────────────────────────────────────────────────────────────
export const tradesTable = pgTable("trades", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  userId: integer("user_id").notNull(),
  outcomeId: uuid("outcome_id").notNull(),

  type: varchar("type", { length: 50 }).notNull(), 
  amount: integer("amount").notNull(),
  shares: integer("shares").notNull(),
  priceAtPurchase: integer("price_at_purchase").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── POSITIONS ───────────────────────────────────────────────────────────────
export const positionsTable = pgTable("positions", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  userId: integer("user_id").notNull(),
  outcomeId: uuid("outcome_id").notNull(),

  shares: integer("shares").default(0).notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── TRANSACTIONS ────────────────────────────────────────────────────────────
export const transactionsTable = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  userId: integer("user_id").notNull(),

  type: varchar("type", { length: 50 }).notNull(), 
  amount: integer("amount").notNull(),

  metadata: text("metadata"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── MARKET RESOLUTIONS ──────────────────────────────────────────────────────
export const marketResolutionsTable = pgTable("market_resolutions", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  marketId: uuid("market_id").notNull(),
  winningOutcomeId: uuid("winning_outcome_id").notNull(),

  resolvedAt: timestamp("resolved_at").defaultNow().notNull(),
});

// ─── PRICE HISTORY ────────────────────────────────────────────────────────────
export const priceHistoryTable = pgTable("price_history", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  marketId: uuid("market_id").notNull(),
  outcomeId: uuid("outcome_id").notNull(),

  price: integer("price").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// ─── RELATIONS ───────────────────────────────────────────────────────────────
import { relations } from "drizzle-orm";

export const marketsRelations = relations(marketsTable, ({ many }) => ({
  outcomes: many(outcomesTable),
  priceHistory: many(priceHistoryTable),
}));

export const outcomesRelations = relations(outcomesTable, ({ one, many }) => ({
  market: one(marketsTable, {
    fields: [outcomesTable.marketId],
    references: [marketsTable.id],
  }),
  trades: many(tradesTable),
  priceHistory: many(priceHistoryTable),
}));

export const tradesRelations = relations(tradesTable, ({ one }) => ({
  outcome: one(outcomesTable, {
    fields: [tradesTable.outcomeId],
    references: [outcomesTable.id],
  }),
  user: one(usersTable, {
    fields: [tradesTable.userId],
    references: [usersTable.id],
  }),
}));

export const positionsRelations = relations(positionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [positionsTable.userId],
    references: [usersTable.id],
  }),
  outcome: one(outcomesTable, {
    fields: [positionsTable.outcomeId],
    references: [outcomesTable.id],
  }),
}));

export const commentsRelations = relations(commentsTable, ({ one }) => ({
  market: one(marketsTable, {
    fields: [commentsTable.marketId],
    references: [marketsTable.id],
  }),
  user: one(usersTable, {
    fields: [commentsTable.userId],
    references: [usersTable.id],
  }),
}));

export const priceHistoryRelations = relations(priceHistoryTable, ({ one }) => ({
  market: one(marketsTable, {
    fields: [priceHistoryTable.marketId],
    references: [marketsTable.id],
  }),
  outcome: one(outcomesTable, {
    fields: [priceHistoryTable.outcomeId],
    references: [outcomesTable.id],
  }),
}));

