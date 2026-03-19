import { Request, Response } from "express";
import { db } from "../db/index";
import { usersTable, transactionsTable, tradesTable, marketsTable, outcomesTable } from "../db/schema";
import { eq, sql, desc } from "drizzle-orm";

export const claimFaucet = async (req: any, res: Response) => {
  const userId = req.user.id;

  try {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, userId),
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const now = new Date();
    const lastClaim = user.lastFaucetClaimedAt;

    if (lastClaim) {
      const diffHours = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
      if (diffHours < 24) {
        return res.status(400).json({ 
          message: `You can claim again in ${Math.ceil(24 - diffHours)} hours.` 
        });
      }
    }

    const FAUCET_AMOUNT = 500;

    await db.transaction(async (tx) => {
      await tx.update(usersTable)
        .set({ 
          points: user.points + FAUCET_AMOUNT,
          lastFaucetClaimedAt: now
        })
        .where(eq(usersTable.id, userId));

      await tx.insert(transactionsTable).values({
        userId,
        type: "FAUCET",
        amount: FAUCET_AMOUNT,
        metadata: "Daily reward claim",
      });
    });

    res.status(200).json({ 
      message: `Successfully claimed ${FAUCET_AMOUNT} points!`,
      newBalance: user.points + FAUCET_AMOUNT 
    });
  } catch (error) {
    console.error("Faucet error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getActivityFeed = async (req: Request, res: Response) => {
  try {
    const recentTrades = await db.query.tradesTable.findMany({
      limit: 10,
      orderBy: [desc(tradesTable.createdAt)],
      with: {
        user: {
            columns: {
                fullname: true
            }
        },
        outcome: {
          with: {
            market: {
                columns: {
                    title: true
                }
            },
          },
        },
      },
    });

    res.status(200).json(recentTrades);
  } catch (error) {
    console.error("Activity feed error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
