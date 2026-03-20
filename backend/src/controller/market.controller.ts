import { Request, Response } from "express";
import { getAllMarketsdata, getMarketBySlugData, getMarketsDataForUser, getMarketCategoriesData, MarketListQuery } from "../service/market.service";
import { db } from "../db/index";
import { tradesTable, outcomesTable, priceHistoryTable } from "../db/schema";
import { eq, asc } from "drizzle-orm";

export const getMarketPriceHistory = async (req: Request, res: Response) => {
  const slug = req.params.slug as string;

  try {
    const market = await getMarketBySlugData(slug);
    if (!market) return res.status(404).json({ message: "Market not found" });

    const history = await db.query.priceHistoryTable.findMany({
      where: eq(priceHistoryTable.marketId, market.id),
      orderBy: [asc(priceHistoryTable.timestamp)],
    }).catch(err => {
      console.error("Drizzle history query failed:", err);
      return [];
    });

    console.log(`Found ${history.length} history points for market ${market.id}`);

    // Group by outcome
    const results = ((market as any).outcomes || []).map((outcome: any) => {
      const outcomeHistory = (history || []).filter(h => h.outcomeId === outcome.id);
      return {
        outcomeId: outcome.id,
        outcomeTitle: outcome.title,
        history: outcomeHistory.map(h => ({
          price: h.price,
          timestamp: h.timestamp,
        }))
      };
    });

    res.status(200).json(results);
  } catch (error) {
    console.error("Price history error:", error);
    res.status(500).json({ message: "Failed to fetch price history" });
  }
};

/**
 * Fetches all markets from the database.
 */
export const getAllMarkets = async (req: Request, res: Response) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const statusParam = typeof req.query.status === "string" ? req.query.status : undefined;
    const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;
    const order = typeof req.query.order === "string" ? req.query.order : undefined;

    const limitRaw = typeof req.query.limit === "string" ? Number.parseInt(req.query.limit, 10) : undefined;
    const offsetRaw = typeof req.query.offset === "string" ? Number.parseInt(req.query.offset, 10) : undefined;

    const query: MarketListQuery = {
      q,
      category: category && category !== "all" ? category : undefined,
      status: statusParam === "active" || statusParam === "resolved" || statusParam === "closed" ? statusParam : undefined,
      sort: sort === "createdAt" || sort === "expiresAt" || sort === "volume" ? sort : undefined,
      order: order === "asc" || order === "desc" ? order : undefined,
      limit: Number.isFinite(limitRaw) && limitRaw! > 0 ? Math.min(limitRaw!, 200) : undefined,
      offset: Number.isFinite(offsetRaw) && offsetRaw! >= 0 ? offsetRaw! : undefined,
    };

    const markets = await getAllMarketsdata(query);
    // Returning the array directly as expected by the current frontend implementation
    res.status(200).json(markets);
  } catch (error) {
    console.error("Error in getAllMarkets controller:", error);
    res.status(500).json({ message: "Failed to fetch markets" });
  }
};

export const getMarketCategories = async (req: Request, res: Response) => {
  try {
    const categories = await getMarketCategoriesData();
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error in getMarketCategories controller:", error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};

/**
 * Fetches a single market by its unique slug.
 */
export const getMarketBySlug = async (req: Request, res: Response) => {
  const slug = req.params.slug as string;

  try {
    const market = await getMarketBySlugData(slug);

    if (!market) {
      return res.status(404).json({ message: "Market not found" });
    }

    res.status(200).json(market);
  } catch (error) {
    console.error("Error in getMarketBySlug controller:", error);
    res.status(500).json({ message: "Failed to fetch market details" });
  }
};

export const userMarket = async (req: any, res: Response) => {
  try {
    const markets = await getMarketsDataForUser(req.user.id);
    res.status(200).json(markets);
  } catch (error) {
    console.error("Error in userMarket controller:", error);
    res.status(500).json({ message: "Failed to fetch markets for user" });
  }
}
