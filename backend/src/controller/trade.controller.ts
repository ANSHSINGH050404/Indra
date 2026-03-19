import { Request, Response } from "express";
import { executeTrade } from "../service/trade.service";
import { getTradesByUser, getPositionsByUser } from "../service/trade.service";

export const createTrade = async (req: any, res: Response) => {
  const { outcomeId, amount, type } = req.body;
  const userId = req.user.id;

  if (!outcomeId || !amount || !type) {
    return res.status(400).json({ message: "outcomeId, amount, and type are required" });
  }

  if (amount <= 0) {
    return res.status(400).json({ message: "Amount must be greater than zero" });
  }

  try {
    const result = await executeTrade(userId, outcomeId, amount, type);
    res.status(200).json(result);
  } catch (error: any) {
    console.error("Error creating trade:", error);
    res.status(400).json({ message: error.message || "Failed to execute trade" });
  }
};


export const getALLTradesByUser = async (req: any, res: Response) => {
  const userId = req.user.id;

  try {
    const trades = await getTradesByUser(userId);
    res.status(200).json(trades);
  } catch (error: any) {
    console.error("Error fetching trades:", error);
    res.status(400).json({ message: error.message || "Failed to fetch trades" });
  }
}

export const getPositions = async (req: any, res: Response) => {
  const userId = req.user.id;

  try {
    const positions = await getPositionsByUser(userId);
    res.status(200).json(positions);
  } catch (error: any) {
    console.error("Error fetching positions:", error);
    res.status(400).json({ message: error.message || "Failed to fetch positions" });
  }
};
