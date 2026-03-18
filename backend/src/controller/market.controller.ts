import { Request, Response } from "express";
import { getAllMarketsdata, getMarketBySlugData, getMarketsDataForUser } from "../service/market.service";

/**
 * Fetches all markets from the database.
 */
export const getAllMarkets = async (req: Request, res: Response) => {
  try {
    const markets = await getAllMarketsdata();
    // Returning the array directly as expected by the current frontend implementation
    res.status(200).json(markets);
  } catch (error) {
    console.error("Error in getAllMarkets controller:", error);
    res.status(500).json({ message: "Failed to fetch markets" });
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
