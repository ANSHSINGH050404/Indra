import { Request, Response } from "express";
import {getAllMarketsdata} from "../service/market.service";

export const getAllMarkets = async (req: Request, res: Response) => {
  try {
    const markets = await getAllMarketsdata();
    res.status(200).json(markets);
  } catch (error) {
    console.error("Error in getAllMarkets controller:", error);
    res.status(500).json({ message: "Failed to fetch markets" });
  }
};


