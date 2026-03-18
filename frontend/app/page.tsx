"use client";

import MarketCard from "@/components/card";
import type { Market } from "@/components/card";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [sortKey, setSortKey] = useState<"newest" | "volume" | "expiring">("newest");
  const [categories, setCategories] = useState<string[]>([]);

  // ✅ redirect effect
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login");
    }
  }, [isLoggedIn, router]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!isLoggedIn) return;

    api
      .get("/api/markets/categories")
      .then((res) => setCategories(res.data || []))
      .catch(() => setCategories([]));
  }, [isLoggedIn]);

  
  useEffect(() => {
    if (!isLoggedIn) return; // condition INSIDE

    const fetchMarkets = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};

        if (debouncedQuery.trim()) params.q = debouncedQuery.trim();
        if (category !== "all") params.category = category;
        if (status !== "all") params.status = status;

        if (sortKey === "newest") {
          params.sort = "createdAt";
          params.order = "desc";
        } else if (sortKey === "volume") {
          params.sort = "volume";
          params.order = "desc";
        } else if (sortKey === "expiring") {
          params.sort = "expiresAt";
          params.order = "asc";
        }

        const response = await api.get("/api/markets", { params });
        setMarkets(response.data);
      } catch (error) {
        console.error("Error fetching markets:", error);
        setMarkets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();
  }, [isLoggedIn, debouncedQuery, category, status, sortKey]);

  
  if (!isLoggedIn) return null;

  const fullname = typeof window !== "undefined" ? localStorage.getItem("fullname") : "";

  const filtersActive = useMemo(() => {
    return !!debouncedQuery.trim() || category !== "all" || status !== "all" || sortKey !== "newest";
  }, [debouncedQuery, category, status, sortKey]);

  const resetFilters = () => {
    setQuery("");
    setDebouncedQuery("");
    setCategory("all");
    setStatus("all");
    setSortKey("newest");
  };

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

        <div className="mb-8 bg-[#0d0f17] border border-white/5 rounded-3xl p-4 md:p-6">
          <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 21l-4.3-4.3" />
                  <circle cx="11" cy="11" r="7" />
                </svg>
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search markets..."
                className="w-full bg-white/[0.04] border border-white/[0.07] rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-zinc-600 outline-none focus:border-lime-400/50 focus:ring-2 focus:ring-lime-400/10 transition-all"
              />
            </div>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.07] rounded-2xl py-3.5 px-4 text-sm text-white outline-none focus:border-lime-400/50 focus:ring-2 focus:ring-lime-400/10 transition-all"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.07] rounded-2xl py-3.5 px-4 text-sm text-white outline-none focus:border-lime-400/50 focus:ring-2 focus:ring-lime-400/10 transition-all"
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as "newest" | "volume" | "expiring")}
              className="bg-white/[0.04] border border-white/[0.07] rounded-2xl py-3.5 px-4 text-sm text-white outline-none focus:border-lime-400/50 focus:ring-2 focus:ring-lime-400/10 transition-all"
            >
              <option value="newest">Newest</option>
              <option value="volume">Top volume</option>
              <option value="expiring">Expiring soon</option>
            </select>

            <button
              type="button"
              onClick={resetFilters}
              disabled={!filtersActive}
              className="py-3.5 px-5 rounded-2xl border border-white/[0.07] bg-white/[0.03] text-sm font-bold text-zinc-200 hover:bg-white/[0.06] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
            <span>{loading ? "Loading..." : `${markets.length} markets`}</span>
            {filtersActive && !loading && markets.length === 0 && (
              <span className="text-zinc-400">No matches. Try clearing filters.</span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 bg-[#111318] rounded-3xl border border-white/5">
            <p className="text-zinc-500">Loading markets...</p>
          </div>
        ) : markets.length === 0 ? (
          <div className="text-center py-20 bg-[#111318] rounded-3xl border border-white/5">
            <p className="text-zinc-500">
              {filtersActive ? "No markets match your search." : "No markets found yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {markets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
