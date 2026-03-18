// services/trade.ts
import { api } from "../lib/api";

export const createTrade = async (outcomeId: string, amount: number, type: "BUY" | "SELL") => {
  const res = await api.post("/api/trades", {
    outcomeId,
    amount,
    type,
  });
  return res.data;
};
