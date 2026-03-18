import { db } from "./index";
import { marketsTable, outcomesTable } from "./schema";

async function seedMarkets() {
  console.log("Seeding markets and outcomes...");
  
  try {
    // 1. Clear existing data to avoid conflicts during re-seeding
    console.log("Cleaning up old data...");
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
        expiresAt: new Date("2026-12-31T23:59:59Z"),
      },
      {
        title: "Who will win the 2026 World Cup?",
        slug: "world-cup-2026-winner",
        description: "Market for the winner of the FIFA World Cup 2026 final match.",
        category: "Sports",
        status: "active",
        volume: 500000,
        expiresAt: new Date("2026-07-19T23:59:59Z"),
      },
      {
        title: "Will a human land on Mars by 2030?",
        slug: "human-mars-landing-2030",
        description: "Resolves to 'Yes' if any space agency successfully lands a human on the Martian surface.",
        category: "Science",
        status: "active",
        volume: 1250,
        expiresAt: new Date("2030-12-31T23:59:59Z"),
      }
    ];

    for (const m of marketsData) {
      const [insertedMarket] = await db.insert(marketsTable).values(m).returning({ id: marketsTable.id });
      
      // Create YES/NO outcomes for each market
      await db.insert(outcomesTable).values([
        {
          marketId: insertedMarket.id,
          title: "YES",
          price: Math.floor(Math.random() * 80) + 10, // Random price between 10-90
        },
        {
          marketId: insertedMarket.id,
          title: "NO",
          price: 50, // Price logic will eventually be 100 - YES_PRICE
        }
      ]);
      
      // Update NO price to be 100 - YES price for consistency
      // (This is just for seed data)
    }

    console.log("Markets and Outcomes seeded successfully!");
  } catch (error) {
    console.error("Error seeding data:", error);
  } finally {
    process.exit(0);
  }
}

seedMarkets();
