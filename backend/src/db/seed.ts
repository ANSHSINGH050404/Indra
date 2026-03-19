import { db } from "./index";
import { marketsTable, outcomesTable, tradesTable, positionsTable, transactionsTable, marketResolutionsTable, priceHistoryTable } from "./schema";

async function seedMarkets() {
  console.log("Seeding markets and outcomes...");
  
  try {
    // 1. Clear existing data to avoid conflicts during re-seeding
    console.log("Cleaning up old data...");
    await db.delete(marketResolutionsTable);
    await db.delete(priceHistoryTable);
    await db.delete(tradesTable);
    await db.delete(positionsTable);
    await db.delete(transactionsTable);
    await db.delete(outcomesTable);
    await db.delete(marketsTable);
    
    const marketsData = [
      {
        title: "Will Bitcoin hit ₹1,00,00,000 by end of 2026?",
        slug: "will-bitcoin-hit-1cr-2026",
        description: "This market resolves to 'Yes' if BTC reaches ₹1,00,00,000 INR on any major exchange at any point before Dec 31, 2026.",
        category: "Crypto",
        status: "active",
        volume: 150230,
        yesPool: 750,
        noPool: 250,
        expiresAt: new Date("2026-12-31T23:59:59Z"),
      },
      {
        title: "Who will win the 2026 World Cup?",
        slug: "world-cup-2026-winner",
        description: "Market for the winner of the FIFA World Cup 2026 final match.",
        category: "Sports",
        status: "active",
        volume: 500000,
        yesPool: 500,
        noPool: 500,
        expiresAt: new Date("2026-07-19T23:59:59Z"),
      },
      {
        title: "Will a human land on Mars by 2030?",
        slug: "human-mars-landing-2030",
        description: "Resolves to 'Yes' if any space agency successfully lands a human on the Martian surface.",
        category: "Science",
        status: "active",
        volume: 1250,
        yesPool: 500,
        noPool: 500,
        expiresAt: new Date("2030-12-31T23:59:59Z"),
      }
    ];

    for (const m of marketsData) {
      const [insertedMarket] = await db.insert(marketsTable).values(m).returning({ id: marketsTable.id });
      
      const p_yes = Math.round((m.yesPool / (m.yesPool + m.noPool)) * 100);
      const p_no = 100 - p_yes;

      // Create YES/NO outcomes for each market
      const [yes, no] = await db.insert(outcomesTable).values([
        {
          marketId: insertedMarket.id,
          title: "YES",
          price: p_yes,
        },
        {
          marketId: insertedMarket.id,
          title: "NO",
          price: p_no,
        }
      ]).returning();

      // Seed some random history points
      const historyPoints = 5;
      for (let i = 0; i < historyPoints; i++) {
        const timestamp = new Date();
        timestamp.setHours(timestamp.getHours() - (historyPoints - i) * 2);
        
        const randomFluctuation = Math.floor(Math.random() * 10) - 5;
        const historicalYesPrice = Math.max(1, Math.min(99, p_yes + randomFluctuation));
        
        await db.insert(priceHistoryTable).values([
            { marketId: insertedMarket.id, outcomeId: yes.id, price: historicalYesPrice, timestamp },
            { marketId: insertedMarket.id, outcomeId: no.id, price: 100 - historicalYesPrice, timestamp }
        ]);
      }
    }

    console.log("Markets and Outcomes seeded successfully!");
  } catch (error) {
    console.error("Error seeding data:", error);
  } finally {
    process.exit(0);
  }
}

seedMarkets();
