import { db } from "../db/index";
import { usersTable, tradesTable, positionsTable, transactionsTable, outcomesTable, marketsTable, priceHistoryTable } from "../db/schema";
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

    // 2. AMM Price Calculation
    const r_y = market.yesPool;
    const r_n = market.noPool;
    
    // Spot Price Calculation (Before Trade)
    const p_y_old = (r_y / (r_y + r_n)) * 100;
    const p_n_old = (r_n / (r_y + r_n)) * 100;
    
    const isYes = outcome.title.toUpperCase() === "YES";
    const currentPrice = isYes ? p_y_old : p_n_old;

    // 2. Get User
    const user = await tx.query.usersTable.findFirst({
      where: eq(usersTable.id, userId),
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (type === "BUY") {
      if (user.points < amount) {
        throw new Error("Insufficient balance");
      }

      // Calculate Price Impact and Shares
      let r_y_new = r_y;
      let r_n_new = r_n;
      
      if (isYes) r_y_new += amount;
      else r_n_new += amount;

      const p_y_new = (r_y_new / (r_y_new + r_n_new)) * 100;
      const p_n_new = (r_n_new / (r_y_new + r_n_new)) * 100;

      const avgPrice = isYes ? (p_y_old + p_y_new) / 2 : (p_n_old + p_n_new) / 2;
      const shares = Math.floor((amount / avgPrice) * 100);

      // Update Market Pools
      await tx
        .update(marketsTable)
        .set({ 
            yesPool: r_y_new, 
            noPool: r_n_new,
            volume: market.volume + amount,
            updatedAt: new Date() 
        })
        .where(eq(marketsTable.id, market.id));

      // Update Outcome Prices in DB for display
      const allOutcomes = await tx.query.outcomesTable.findMany({
        where: eq(outcomesTable.marketId, market.id)
      });

      for (const o of allOutcomes) {
          const newPrice = o.title.toUpperCase() === "YES" ? Math.round(p_y_new) : Math.round(p_n_new);
          await tx.update(outcomesTable).set({ price: newPrice }).where(eq(outcomesTable.id, o.id));
          
          // Record Price History
          await tx.insert(priceHistoryTable).values({
            marketId: market.id,
            outcomeId: o.id,
            price: newPrice,
          });
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
        priceAtPurchase: Math.round(avgPrice),
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

      return { success: true, sharesBought: shares, newBalance: user.points - amount };
    } else {
      // SELL Logic
      const existingPosition = await tx.query.positionsTable.findFirst({
        where: and(
          eq(positionsTable.userId, userId),
          eq(positionsTable.outcomeId, outcomeId)
        ),
      });

      const sharesToSell = amount; 

      if (!existingPosition || existingPosition.shares < sharesToSell) {
        throw new Error("Insufficient shares to sell");
      }

      // Selling Yes removes liquidity from Yes pool
      // Calculate how much points they get back
      let r_y_new = r_y;
      let r_n_new = r_n;

      // When selling YES, we calculate how many points are worth 'sharesToSell'
      // Based on current price impact
      // We'll use the average price again to find the exit value
      // This is a bit tricky for selling - usually we'd use the pool ratio.
      
      // Let's simplify: They get back points based on (avgPrice / 100) * sharesToSell
      // But this exit also pushes the price down.
      
      // For selling X shares, they remove points such that price reflects the new pool.
      // In a binary market: P = r_y / (r_y + r_n)
      // To Sell shares is to extract 'points' from the respective pool.
      
      // Simplified Sell Price Discovery:
      // We calculate the potential proceeds and then update pools.
      const proceeds = Math.floor((sharesToSell * currentPrice) / 100);

      if (isYes) r_y_new = Math.max(1, r_y - proceeds); // Floor at 1 for stability
      else r_n_new = Math.max(1, r_n - proceeds);

      const p_y_new = (r_y_new / (r_y_new + r_n_new)) * 100;
      const p_n_new = (r_n_new / (r_y_new + r_n_new)) * 100;

      // Update Market Pools
      await tx
        .update(marketsTable)
        .set({ 
            yesPool: r_y_new, 
            noPool: r_n_new,
            volume: market.volume + proceeds,
            updatedAt: new Date() 
        })
        .where(eq(marketsTable.id, market.id));

      // Update Outcome Prices
      const allOutcomes = await tx.query.outcomesTable.findMany({
        where: eq(outcomesTable.marketId, market.id)
      });
      for (const o of allOutcomes) {
          const newPrice = o.title.toUpperCase() === "YES" ? Math.round(p_y_new) : Math.round(p_n_new);
          await tx.update(outcomesTable).set({ price: newPrice }).where(eq(outcomesTable.id, o.id));
          
          // Record Price History
          await tx.insert(priceHistoryTable).values({
            marketId: market.id,
            outcomeId: o.id,
            price: newPrice,
          });
      }

      // Add points to user
      await tx
        .update(usersTable)
        .set({ points: user.points + proceeds })
        .where(eq(usersTable.id, userId));

      // Create Trade record
      await tx.insert(tradesTable).values({
        userId,
        outcomeId,
        type: "SELL",
        amount: proceeds,
        shares: sharesToSell,
        priceAtPurchase: Math.round(currentPrice),
      });

      // Update Position
      await tx
        .update(positionsTable)
        .set({ 
          shares: existingPosition.shares - sharesToSell, 
          updatedAt: new Date() 
        })
        .where(eq(positionsTable.id, existingPosition.id));

      // Record Transaction
      await tx.insert(transactionsTable).values({
        userId,
        type: "TRADE",
        amount: proceeds,
        metadata: JSON.stringify({ outcomeId, type: "SELL", shares: sharesToSell }),
      });

      return { success: true, sharesSold: sharesToSell, proceeds, newBalance: user.points + proceeds };
    }
  });
};

export const getPositionsByUser = async (userId: number) => {
  return await db.query.positionsTable.findMany({
    where: eq(positionsTable.userId, userId),
    with: {
      outcome: {
        with: {
          market: true
        }
      }
    }
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
