"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.priceHistoryRelations = exports.commentsRelations = exports.positionsRelations = exports.tradesRelations = exports.outcomesRelations = exports.marketsRelations = exports.priceHistoryTable = exports.marketResolutionsTable = exports.transactionsTable = exports.positionsTable = exports.tradesTable = exports.outcomesTable = exports.marketsTable = exports.commentsTable = exports.usersTable = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
// ─── USERS ───────────────────────────────────────────────────────────────────
exports.usersTable = (0, pg_core_1.pgTable)("users", {
    // Matching the actual DB schema discovered via introspection
    id: (0, pg_core_1.integer)("id").primaryKey().generatedAlwaysAsIdentity(),
    fullname: (0, pg_core_1.varchar)("fullname", { length: 255 }).notNull(),
    email: (0, pg_core_1.varchar)("email", { length: 255 }).notNull(),
    password: (0, pg_core_1.varchar)("password", { length: 255 }).notNull(),
    isAdmin: (0, pg_core_1.boolean)("isAdmin").default(false).notNull(),
    points: (0, pg_core_1.integer)("points").default(1000).notNull(),
    isVerified: (0, pg_core_1.boolean)("isVerified").default(false).notNull(),
    bio: (0, pg_core_1.text)("bio"),
    avatarUrl: (0, pg_core_1.varchar)("avatar_url", { length: 500 }),
    lastFaucetClaimedAt: (0, pg_core_1.timestamp)("last_faucet_claimed_at"),
    createdAt: (0, pg_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updatedAt").defaultNow().notNull(),
}, (table) => [(0, pg_core_1.unique)("users_email_unique").on(table.email)]);
// ─── COMMENTS ───────────────────────────────────────────────────────────────
exports.commentsTable = (0, pg_core_1.pgTable)("comments", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey().notNull(),
    marketId: (0, pg_core_1.uuid)("market_id").notNull(),
    userId: (0, pg_core_1.integer)("user_id").notNull(),
    content: (0, pg_core_1.text)("content").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// ─── MARKETS ─────────────────────────────────────────────────────────────────
exports.marketsTable = (0, pg_core_1.pgTable)("markets", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey().notNull(),
    title: (0, pg_core_1.varchar)("title", { length: 500 }).notNull(),
    slug: (0, pg_core_1.varchar)("slug", { length: 500 }).unique().notNull(),
    description: (0, pg_core_1.text)("description"),
    imageUrl: (0, pg_core_1.varchar)("image_url", { length: 500 }),
    category: (0, pg_core_1.varchar)("category", { length: 100 }).notNull(),
    status: (0, pg_core_1.varchar)("status", { length: 50 }).default("active").notNull(),
    resolvedOutcomeId: (0, pg_core_1.uuid)("resolved_outcome_id"),
    volume: (0, pg_core_1.integer)("volume").default(0).notNull(),
    // AMM Pools (Initial liquidity)
    yesPool: (0, pg_core_1.integer)("yes_pool").default(500).notNull(),
    noPool: (0, pg_core_1.integer)("no_pool").default(500).notNull(),
    expiresAt: (0, pg_core_1.timestamp)("expires_at").notNull(),
    createdBy: (0, pg_core_1.integer)("created_by"), // Removed reference temporarily if types mismatch
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
// ─── OUTCOMES ────────────────────────────────────────────────────────────────
exports.outcomesTable = (0, pg_core_1.pgTable)("outcomes", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey().notNull(),
    marketId: (0, pg_core_1.uuid)("market_id").notNull(),
    title: (0, pg_core_1.varchar)("title", { length: 255 }).notNull(),
    price: (0, pg_core_1.integer)("price").default(50).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
// ─── TRADES ──────────────────────────────────────────────────────────────────
exports.tradesTable = (0, pg_core_1.pgTable)("trades", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey().notNull(),
    userId: (0, pg_core_1.integer)("user_id").notNull(),
    outcomeId: (0, pg_core_1.uuid)("outcome_id").notNull(),
    type: (0, pg_core_1.varchar)("type", { length: 50 }).notNull(),
    amount: (0, pg_core_1.integer)("amount").notNull(),
    shares: (0, pg_core_1.integer)("shares").notNull(),
    priceAtPurchase: (0, pg_core_1.integer)("price_at_purchase").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// ─── POSITIONS ───────────────────────────────────────────────────────────────
exports.positionsTable = (0, pg_core_1.pgTable)("positions", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey().notNull(),
    userId: (0, pg_core_1.integer)("user_id").notNull(),
    outcomeId: (0, pg_core_1.uuid)("outcome_id").notNull(),
    shares: (0, pg_core_1.integer)("shares").default(0).notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
// ─── TRANSACTIONS ────────────────────────────────────────────────────────────
exports.transactionsTable = (0, pg_core_1.pgTable)("transactions", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey().notNull(),
    userId: (0, pg_core_1.integer)("user_id").notNull(),
    type: (0, pg_core_1.varchar)("type", { length: 50 }).notNull(),
    amount: (0, pg_core_1.integer)("amount").notNull(),
    metadata: (0, pg_core_1.text)("metadata"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// ─── MARKET RESOLUTIONS ──────────────────────────────────────────────────────
exports.marketResolutionsTable = (0, pg_core_1.pgTable)("market_resolutions", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey().notNull(),
    marketId: (0, pg_core_1.uuid)("market_id").notNull(),
    winningOutcomeId: (0, pg_core_1.uuid)("winning_outcome_id").notNull(),
    totalPayout: (0, pg_core_1.integer)("total_payout").default(0).notNull(),
    winnersCount: (0, pg_core_1.integer)("winners_count").default(0).notNull(),
    resolvedAt: (0, pg_core_1.timestamp)("resolved_at").defaultNow().notNull(),
});
// ─── PRICE HISTORY ────────────────────────────────────────────────────────────
exports.priceHistoryTable = (0, pg_core_1.pgTable)("price_history", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey().notNull(),
    marketId: (0, pg_core_1.uuid)("market_id").notNull(),
    outcomeId: (0, pg_core_1.uuid)("outcome_id").notNull(),
    price: (0, pg_core_1.integer)("price").notNull(),
    timestamp: (0, pg_core_1.timestamp)("timestamp").defaultNow().notNull(),
});
// ─── RELATIONS ───────────────────────────────────────────────────────────────
const drizzle_orm_1 = require("drizzle-orm");
exports.marketsRelations = (0, drizzle_orm_1.relations)(exports.marketsTable, ({ many }) => ({
    outcomes: many(exports.outcomesTable),
    priceHistory: many(exports.priceHistoryTable),
}));
exports.outcomesRelations = (0, drizzle_orm_1.relations)(exports.outcomesTable, ({ one, many }) => ({
    market: one(exports.marketsTable, {
        fields: [exports.outcomesTable.marketId],
        references: [exports.marketsTable.id],
    }),
    trades: many(exports.tradesTable),
    priceHistory: many(exports.priceHistoryTable),
}));
exports.tradesRelations = (0, drizzle_orm_1.relations)(exports.tradesTable, ({ one }) => ({
    outcome: one(exports.outcomesTable, {
        fields: [exports.tradesTable.outcomeId],
        references: [exports.outcomesTable.id],
    }),
    user: one(exports.usersTable, {
        fields: [exports.tradesTable.userId],
        references: [exports.usersTable.id],
    }),
}));
exports.positionsRelations = (0, drizzle_orm_1.relations)(exports.positionsTable, ({ one }) => ({
    user: one(exports.usersTable, {
        fields: [exports.positionsTable.userId],
        references: [exports.usersTable.id],
    }),
    outcome: one(exports.outcomesTable, {
        fields: [exports.positionsTable.outcomeId],
        references: [exports.outcomesTable.id],
    }),
}));
exports.commentsRelations = (0, drizzle_orm_1.relations)(exports.commentsTable, ({ one }) => ({
    market: one(exports.marketsTable, {
        fields: [exports.commentsTable.marketId],
        references: [exports.marketsTable.id],
    }),
    user: one(exports.usersTable, {
        fields: [exports.commentsTable.userId],
        references: [exports.usersTable.id],
    }),
}));
exports.priceHistoryRelations = (0, drizzle_orm_1.relations)(exports.priceHistoryTable, ({ one }) => ({
    market: one(exports.marketsTable, {
        fields: [exports.priceHistoryTable.marketId],
        references: [exports.marketsTable.id],
    }),
    outcome: one(exports.outcomesTable, {
        fields: [exports.priceHistoryTable.outcomeId],
        references: [exports.outcomesTable.id],
    }),
}));
