"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Market } from "@/components/card";
import { createTrade } from "@/services/trade";

export default function MarketDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState<number>(100);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }

    const fetchMarket = async () => {
      try {
        const response = await api.get(`/api/markets/${slug}`);
        setMarket(response.data);
      } catch (error) {
        console.error("Error fetching market details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchMarket();
    }
  }, [slug, isLoggedIn, router]);

  const handleTrade = async (title: "YES" | "NO") => {
    const outcome = market?.outcomes?.find(o => o.title === title);
    if (!outcome) return;

    setTradeLoading(true);
    setStatus(null);
    try {
      await createTrade(outcome.id, amount, "BUY");
      setStatus({ type: "success", msg: `Successfully bought ${title} shares!` });
      // Refresh market data to show updated volume (optional)
      const response = await api.get(`/api/markets/${slug}`);
      setMarket(response.data);
    } catch (err: any) {
      setStatus({ 
        type: "error", 
        msg: err.response?.data?.message || "Trade failed" 
      });
    } finally {
      setTradeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080a10] flex items-center justify-center text-white">
        <p className="animate-pulse">Loading market details...</p>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-[#080a10] flex items-center justify-center text-white">
        <p>Market not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080a10] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto pt-8">
        {/* Back Button */}
        <button 
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
        >
          ← Back to markets
        </button>

        <div className="bg-[#0d0f17] border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-lime-400/10 text-lime-400 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-lime-400/20">
              {market.category}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-500 text-xs font-medium">₹{market.volume.toLocaleString()} volume</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-6 leading-tight">
            {market.title}
          </h1>

          <p className="text-zinc-400 text-lg mb-10 leading-relaxed max-w-2xl">
            {market.description}
          </p>

          <div className="mb-8 max-w-xs">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Investment Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-8 pr-4 text-xl font-bold text-white focus:outline-none focus:border-lime-400/50 transition-all"
                placeholder="0"
              />
            </div>
          </div>

          {market.outcomes && market.outcomes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => handleTrade("YES")}
                disabled={tradeLoading || amount <= 0}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-900 font-black py-4 rounded-2xl transition-all active:scale-95 text-lg"
              >
                {tradeLoading ? "Buying..." : `Buy YES @ ₹${market.outcomes.find(o => o.title === "YES")?.price}`}
              </button>
              <button 
                onClick={() => handleTrade("NO")}
                disabled={tradeLoading || amount <= 0}
                className="bg-red-500 hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl transition-all active:scale-95 text-lg"
              >
                {tradeLoading ? "Buying..." : `Buy NO @ ₹${market.outcomes.find(o => o.title === "NO")?.price}`}
              </button>
            </div>
          )}

          {status && (
            <div className={`mt-6 p-4 rounded-2xl border text-center font-bold animate-in zoom-in duration-300 ${
              status.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}>
              {status.msg}
            </div>
          )}

          <div className="mt-12 pt-12 border-t border-white/5 flex flex-wrap gap-8">
             <div>
                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1">Expires On</p>
                <p className="font-bold">{new Date(market.expiresAt).toLocaleDateString()}</p>
             </div>
             <div>
                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1">Status</p>
                <p className="font-bold capitalize text-emerald-400">{market.status}</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
