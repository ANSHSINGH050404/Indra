"use client";

import MarketCard from "@/components/card";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { log } from "console";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [markets, setMarkets] = useState([]);

  // ✅ redirect effect
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login");
    }
  }, [isLoggedIn, router]);

  
  useEffect(() => {
    if (!isLoggedIn) return; // condition INSIDE

    const fetchMarkets = async () => {
      try {
        const response = await api.get("/api/markets/");
        const data = response.data;
        console.log("Fetched markets:", data);
        setMarkets(data);
      } catch (error) {
        console.error("Error fetching markets:", error);
      }
    };

    fetchMarkets();
  }, [isLoggedIn]);

  
  if (!isLoggedIn) return null;

  const fullname =
    typeof window !== "undefined"
      ? localStorage.getItem("fullname")
      : "";

  return (
    <div className="min-h-screen bg-[#080a10] text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto pt-8">
        <div className="mb-12">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
            Welcome back, <span className="text-lime-400">{fullname || "User"}</span>
          </h1>
          <p className="text-zinc-500 text-lg max-w-2xl">
            Explore the latest prediction markets.
          </p>
        </div>

        {markets.length === 0 ? (
          <div className="text-center py-20 bg-[#111318] rounded-3xl border border-white/5">
             <p className="text-zinc-500">Loading markets or no markets found...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {markets.map((market: any) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}