"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const markets = [
  {
    title: "Will Bitcoin hit $100k in 2026?",
    volume: "$2.4M",
    chance: "65%",
    color: "text-green-400",
    image: "₿",
  },
  {
    title: "Will the next iPhone have a foldable screen?",
    volume: "$840k",
    chance: "22%",
    color: "text-red-400",
    image: "📱",
  },
  {
    title: "Who will win the next World Cup?",
    volume: "$5.1M",
    chance: "14%",
    color: "text-indigo-400",
    image: "🏆",
  },
];

export default function Home() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login");
    }
  }, [isLoggedIn, router]);

  if (!isLoggedIn) return null;

  const fullname = typeof window !== "undefined" ? localStorage.getItem("fullname") : "";

  return (
    <div className="min-h-screen bg-[#080a10] text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto pt-8">
        
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
            Welcome back, <span className="text-lime-400">{fullname || "User"}</span>
          </h1>
          <p className="text-zinc-500 text-lg max-w-2xl">
            The world's most accurate prediction markets. Bet on politics, entertainment, and crypto.
          </p>
        </div>

        {/* Featured Markets Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {markets.map((market, idx) => (
            <div 
              key={idx} 
              className="group bg-[#0d0f17] border border-white/5 rounded-3xl p-6 hover:border-lime-400/30 transition-all cursor-pointer shadow-xl"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-2xl">
                  {market.image}
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Volume</span>
                  <span className="text-sm font-bold text-white">{market.volume}</span>
                </div>
              </div>

              <h3 className="text-xl font-bold leading-tight mb-8 group-hover:text-lime-400 transition-colors">
                {market.title}
              </h3>

              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Current Chance</span>
                  <span className={`text-2xl font-black ${market.color}`}>{market.chance}</span>
                </div>
                <button className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all active:scale-95">
                  View Market
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info Banner */}
        <div className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-lime-400/20 to-indigo-500/20 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Build your portfolio</h2>
            <p className="text-zinc-400">Trade shares on the world's most highly-anticipated events.</p>
          </div>
          <button className="whitespace-nowrap bg-white text-zinc-900 px-8 py-3 rounded-2xl font-bold hover:bg-zinc-200 transition-all active:scale-95">
            Deposit Funds
          </button>
        </div>

      </div>
    </div>
  );
}
