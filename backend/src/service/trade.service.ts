import { db } from "../db/index";
import { usersTable, tradesTable, positionsTable, transactionsTable, outcomesTable, marketsTable } from "../db/schema";
import { eq, and, sql } from "drizzle-orm";

export const executeTrade = async (
  userId: number,
  outcomeId: string,
  amount: number,
  type: "BUY" | "SELL"
) => {
  return await db.transaction(async (tx) => {
    // 1. Get Outcome and its Market
    const outcome = await tx.query.outcomesTable.findFirst({
      where: eq(outcomesTable.id, outcomeId),
    });

    if (!outcome) {
      throw new Error("Outcome not found");
    }

    const market = await tx.query.marketsTable.findFirst({
      where: eq(marketsTable.id, outcome.marketId),
    });

    if (!market || market.status !== "active") {
      throw new Error("Market is not active");
    }

    // 2. Get User
    const user = await tx.query.usersTable.findFirst({
      where: eq(usersTable.id, userId),
    });

    if (!user) {
      throw new Error("User not found");
    }

    const price = outcome.price;
    const shares = Math.floor((amount / price) * 100);

    if (type === "BUY") {
      if (user.points < amount) {
        throw new Error("Insufficient balance");
      }

      // Deduct points
      await tx
        .update(usersTable)
        .set({ points: user.points - amount })
        .where(eq(usersTable.id, userId));

      // Create Trade record
      await tx.insert(tradesTable).values({
        userId,
        outcomeId,
        type: "BUY",
        amount,
        shares,
        priceAtPurchase: price,
      });

      // Upsert Position
      const existingPosition = await tx.query.positionsTable.findFirst({
        where: and(
          eq(positionsTable.userId, userId),
          eq(positionsTable.outcomeId, outcomeId)
        ),
      });

      if (existingPosition) {
        await tx
          .update(positionsTable)
          .set({ shares: existingPosition.shares + shares, updatedAt: new Date() })
          .where(eq(positionsTable.id, existingPosition.id));
      } else {
        await tx.insert(positionsTable).values({
          userId,
          outcomeId,
          shares,
        });
      }

      // Record Transaction
      await tx.insert(transactionsTable).values({
        userId,
        type: "TRADE",
        amount: -amount,
        metadata: JSON.stringify({ outcomeId, type: "BUY", shares }),
      });
    } else {
      // SELL Logic (simplified: sell all or specific amount of shares)
      // For now, let's just implement BUY to keep it focused
      throw new Error("Sell not implemented yet");
    }

    // 3. Update Market Volume
    await tx
      .update(marketsTable)
      .set({ volume: market.volume + amount })
      .where(eq(marketsTable.id, market.id));

    return { success: true, sharesBought: shares, newBalance: user.points - amount };
  });
};



export const getTradesByUser = async (userId: number) => {
  const trades = await db.query.tradesTable.findMany({
    where: eq(tradesTable.userId, userId),
    with: {
      outcome: {
        with: {
          market: true,
        },
      },
    },
    orderBy: sql`${tradesTable.createdAt} DESC`,
  });

  return trades;
};
