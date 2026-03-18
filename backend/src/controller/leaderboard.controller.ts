import { Request, Response } from "express";
import { getLeaderboardData, LeaderboardQuery } from "../service/leaderboard.service";

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const limitRaw = typeof req.query.limit === "string" ? Number.parseInt(req.query.limit, 10) : undefined;

    const query: LeaderboardQuery = {
      q,
      limit: Number.isFinite(limitRaw) ? limitRaw : undefined,
    };

    const rows = await getLeaderboardData(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error in getLeaderboard controller:", error);
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
};

