import { db } from "./index";
import { marketsTable } from "./schema";

async function seedMarkets() {
  console.log("Seeding markets...");
  
  try {
    await db.insert(marketsTable).values([
      {
        title: "Will Bitcoin hit $100,000 by end of 2026?",
        slug: "will-bitcoin-hit-100k-2026",
        description: "This market resolves to 'Yes' if BTC reaches $100,000 USD on Coinbase at any point before Dec 31, 2026.",
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
    ]);

    console.log("Dummy markets seeded successfully!");
  } catch (error) {
    console.error("Error seeding markets:", error);
  } finally {
    // Neon connection closes automatically as it is HTTP based
    process.exit(0);
  }
}

seedMarkets();
