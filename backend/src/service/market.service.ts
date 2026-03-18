import { db } from "../db/index";
import { marketsTable } from "../db/schema";
import { and, asc, eq, ilike, or, sql } from "drizzle-orm";

export type MarketListQuery = {
  q?: string;
  category?: string;
  status?: "active" | "resolved" | "closed";
  sort?: "createdAt" | "expiresAt" | "volume";
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
};

export const getAllMarketsdata = async (query: MarketListQuery = {}) => {
  const whereClauses = [];

  const q = query.q?.trim();
  if (q) {
    const pattern = `%${q}%`;
    whereClauses.push(or(ilike(marketsTable.title, pattern), ilike(marketsTable.description, pattern)));
  }

  if (query.category) {
    whereClauses.push(eq(marketsTable.category, query.category));
  }

  if (query.status) {
    whereClauses.push(eq(marketsTable.status, query.status));
  }

  const where = whereClauses.length > 0 ? and(...whereClauses) : undefined;

  const sort = query.sort || "createdAt";
  const order = query.order || "desc";

  let orderBy = sql`${marketsTable.createdAt} DESC`;
  if (sort === "volume") {
    orderBy = order === "asc" ? sql`${marketsTable.volume} ASC` : sql`${marketsTable.volume} DESC`;
  } else if (sort === "expiresAt") {
    orderBy = order === "asc" ? sql`${marketsTable.expiresAt} ASC` : sql`${marketsTable.expiresAt} DESC`;
  } else if (sort === "createdAt") {
    orderBy = order === "asc" ? sql`${marketsTable.createdAt} ASC` : sql`${marketsTable.createdAt} DESC`;
  }

  const data = await db.query.marketsTable.findMany({
    where,
    with: {
      outcomes: true,
    },
    orderBy,
    limit: query.limit,
    offset: query.offset,
  });
  return data;
};

export const getMarketBySlugData = async (slug: string) => {
  const data = await db.query.marketsTable.findFirst({
    where: eq(marketsTable.slug, slug),
    with: {
      outcomes: true,
    },
  });
  return data;
};

export const getMarketsDataForUser = async (userId: number) => {
  const data = await db.query.marketsTable.findMany({
    where: eq(marketsTable.createdBy, userId),
    with: {
      outcomes: true,
    },
  });
  return data;
};

export const getMarketCategoriesData = async () => {
  const rows = await db
    .select({ category: marketsTable.category })
    .from(marketsTable)
    .groupBy(marketsTable.category)
    .orderBy(asc(marketsTable.category));

  return rows.map((r) => r.category).filter((c): c is string => !!c);
};
