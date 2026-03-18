import { Request, Response } from "express";
import { db } from "../db/index";
import { marketsTable, outcomesTable, marketResolutionsTable } from "../db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export const createMarketAdmin = async (req: any, res: Response) => {
  const { title, description, category, outcomes, expiresAt, imageUrl } = req.body;
  const adminId = req.user.id;

  if (!title || !category || !outcomes || outcomes.length < 2) {
    return res.status(400).json({ message: "Invalid market data. At least 2 outcomes required." });
  }

  try {
    const slug = title.toLowerCase().replace(/ /g, "-") + "-" + crypto.randomBytes(3).toString("hex");

    const result = await db.transaction(async (tx) => {
      // 1. Create Market
      const [newMarket] = await tx.insert(marketsTable).values({
        title,
        description,
        category,
        slug,
        imageUrl,
        expiresAt: new Date(expiresAt),
        createdBy: adminId,
      }).returning();

      // 2. Create Outcomes (e.g., "Yes", "No")
      const outcomePromises = outcomes.map((o: any) => 
        tx.insert(outcomesTable).values({
          marketId: newMarket.id,
          title: o.title,
          price: o.price || 50,
        }).returning()
      );
      
      const createdOutcomes = await Promise.all(outcomePromises);

      return { ...newMarket, outcomes: createdOutcomes.flat() };
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating market:", error);
    res.status(500).json({ message: "Failed to create market" });
  }
};

export const resolveMarketAdmin = async (req: any, res: Response) => {
  const { marketId, winningOutcomeId } = req.body;

  if (!marketId || !winningOutcomeId) {
    return res.status(400).json({ message: "marketId and winningOutcomeId are required" });
  }

  try {
    await db.transaction(async (tx) => {
      // 1. Check if market exists and is active
      const market = await tx.query.marketsTable.findFirst({
        where: eq(marketsTable.id, marketId),
      });

      if (!market || market.status !== "active") {
        throw new Error("Market not found or already resolved");
      }

      // 2. Update Market Status
      await tx.update(marketsTable)
        .set({ 
            status: "resolved", 
            resolvedOutcomeId: winningOutcomeId,
            updatedAt: new Date() 
        })
        .where(eq(marketsTable.id, marketId));

      // 3. Record Resolution
      await tx.insert(marketResolutionsTable).values({
        marketId,
        winningOutcomeId,
      });
      
      // TODO: Implement actual payout logic here in next step
    });

    res.status(200).json({ message: "Market resolved successfully" });
  } catch (error: any) {
    console.error("Error resolving market:", error);
    res.status(400).json({ message: error.message || "Failed to resolve market" });
  }
};

export const deleteMarketAdmin = async (req: Request, res: Response) => {
  const marketId = req.params.id as string;

  try {
    await db.transaction(async (tx) => {
      // 1. Delete associated outcomes first
      await tx.delete(outcomesTable).where(eq(outcomesTable.marketId, marketId));
      
      // 2. Delete the market
      const result = await tx.delete(marketsTable).where(eq(marketsTable.id, marketId)).returning();
      
      if (result.length === 0) {
        throw new Error("Market not found");
      }
    });

    res.status(200).json({ message: "Market deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting market:", error);
    res.status(400).json({ message: error.message || "Failed to delete market" });
  }
};
