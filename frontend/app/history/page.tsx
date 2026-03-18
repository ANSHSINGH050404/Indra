"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

interface Trade {
  id: string;
  type: string;
  amount: number;
  shares: number;
  priceAtPurchase: number;
  createdAt: string;
  outcome: {
    title: string;
    market: {
      title: string;
      imageUrl?: string;
    };
  };
}

export default function HistoryPage() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat("en-IN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch (e) {
      return dateStr;
    }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login");
    }
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchTrades = async () => {
      try {
        const response = await api.get("/api/trades");
        setTrades(response.data);
      } catch (error) {
        console.error("Error fetching trades:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, [isLoggedIn]);

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-[#080a10] text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto pt-8">
        <div className="mb-10">
          <h1 className="text-3xl font-black tracking-tight mb-2">
            Activity <span className="text-lime-400">History</span>
          </h1>
          <p className="text-zinc-500">
            View all your past trades and market predictions.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 bg-[#111318] rounded-3xl border border-white/5">
            <p className="text-zinc-500">Loading your activity...</p>
          </div>
        ) : trades.length === 0 ? (
          <div className="text-center py-20 bg-[#111318] rounded-3xl border border-white/5">
            <p className="text-zinc-500 mb-4">No activity recorded yet.</p>
            <button 
                onClick={() => router.push('/')}
                className="bg-lime-400 text-zinc-900 px-6 py-2 rounded-xl text-sm font-bold hover:bg-lime-300 transition-all"
            >
                Explore Markets
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/5 bg-[#111318]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Market & Outcome</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 text-center">Type</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 text-right">Shares</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 text-right">Avg. Price</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 text-right">Total</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {trades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {trade.outcome.market.imageUrl && (
                          <img 
                            src={trade.outcome.market.imageUrl} 
                            alt="" 
                            className="w-8 h-8 rounded-lg object-cover bg-white/5"
                          />
                        )}
                        <div className="flex flex-col">
                          <span className="font-bold text-white mb-0.5 line-clamp-1">
                            {trade.outcome.market.title}
                          </span>
                          <span className="text-xs text-zinc-400 font-medium">
                            Outcome: <span className={trade.outcome.title === "Yes" ? "text-lime-400" : "text-red-400"}>
                              {trade.outcome.title}
                            </span>
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                        trade.type === "BUY" ? "bg-lime-400/10 text-lime-400" : "bg-red-400/10 text-red-400"
                      }`}>
                        {trade.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-sm text-zinc-300">
                      {trade.shares}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-sm text-zinc-300">
                      ₹{trade.priceAtPurchase}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-white">
                      ₹{trade.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-zinc-500 whitespace-nowrap">
                      {formatDate(trade.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
