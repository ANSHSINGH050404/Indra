import { db } from "../db/index";
import { marketsTable } from "../db/schema";
import { eq } from "drizzle-orm";

export const getAllMarketsdata = async () => {
  const data = await db.query.marketsTable.findMany({
    with: {
      outcomes: true,
    },
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
