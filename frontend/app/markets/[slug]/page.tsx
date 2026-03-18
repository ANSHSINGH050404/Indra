"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Market } from "@/components/card";

export default function MarketDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-black py-4 rounded-2xl transition-all active:scale-95 text-lg">
              Buy YES
            </button>
            <button className="bg-red-500 hover:bg-red-400 text-white font-black py-4 rounded-2xl transition-all active:scale-95 text-lg">
              Buy NO
            </button>
          </div>

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
