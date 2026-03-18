import { db } from "../db/index";
import { marketsTable } from "../db/schema";
import { eq } from "drizzle-orm";

export const getAllMarketsdata = async () => {
  const data = await db.select().from(marketsTable);
  return data;
};

export const getMarketBySlugData = async (slug: string) => {
  const data = await db.select().from(marketsTable).where(eq(marketsTable.slug, slug)).limit(1);
  return data[0];
};
