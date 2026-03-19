import { Request, Response } from "express";
import { db } from "../db/index";
import { usersTable, transactionsTable, tradesTable, marketsTable, outcomesTable, positionsTable } from "../db/schema";
import { eq, sql, desc, and, gt } from "drizzle-orm";

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

export const getUserProfile = async (req: Request, res: Response) => {
  const userId = Number.parseInt(req.params.id as string);

  if (Number.isNaN(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, userId),
      columns: {
        password: false,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch stats
    const tradesCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(tradesTable)
      .where(eq(tradesTable.userId, userId));

    const totalVolume = await db
      .select({ sum: sql<number>`sum(${tradesTable.amount})` })
      .from(tradesTable)
      .where(eq(tradesTable.userId, userId));

    const activePositions = await db.query.positionsTable.findMany({
      where: and(eq(positionsTable.userId, userId), gt(positionsTable.shares, 0)),
      with: {
        outcome: {
          with: {
            market: true,
          },
        },
      },
    });

    res.status(200).json({
      ...user,
      stats: {
        tradesCount: tradesCount[0]?.count || 0,
        totalVolume: totalVolume[0]?.sum || 0,
      },
      activePositions,
    });
  } catch (error) {
    console.error("User profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUserProfile = async (req: any, res: Response) => {
  const userId = req.user.id;
  const { bio, avatarUrl, fullname } = req.body;

  try {
    await db.update(usersTable)
      .set({
        bio,
        avatarUrl,
        fullname,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, userId));

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update profile error:", error);
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
