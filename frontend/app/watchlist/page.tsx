"use client";

import MarketCard from "@/components/card";
import type { Market } from "@/components/card";
import { useAuth } from "@/context/AuthContext";
import { useBookmarks } from "@/context/BookmarksContext";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function WatchlistPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { bookmarks, isLoaded, clearBookmarks } = useBookmarks();

  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  const slugs = useMemo(() => bookmarks.map((b) => b.slug), [bookmarks]);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login");
    }
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (!isLoaded) return;

    if (slugs.length === 0) {
      setMarkets([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all(
      slugs.map((slug) =>
        api
          .get(`/api/markets/${slug}`)
          .then((res) => res.data as Market)
          .catch(() => null),
      ),
    )
      .then((rows) => {
        if (cancelled) return;

        const seen = new Set<string>();
        const ordered: Market[] = [];
        for (const row of rows) {
          if (!row || typeof row.id !== "string") continue;
          if (seen.has(row.id)) continue;
          seen.add(row.id);
          ordered.push(row);
        }
        setMarkets(ordered);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isLoggedIn, slugs]);

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-[#080a10] text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto pt-8">
        <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3">
              Your <span className="text-lime-400">Watchlist</span>
            </h1>
            <p className="text-zinc-500 text-lg max-w-2xl">
              Saved markets, synced to this browser.
            </p>
          </div>

          {bookmarks.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm("Clear all saved markets?")) clearBookmarks();
              }}
              className="py-3 px-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] text-sm font-bold text-zinc-200 hover:bg-white/[0.06] transition-all"
            >
              Clear Watchlist
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20 bg-[#111318] rounded-3xl border border-white/5">
            <p className="text-zinc-500">Loading your watchlist...</p>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-20 bg-[#111318] rounded-3xl border border-white/5">
            <p className="text-zinc-500 mb-5">No saved markets yet.</p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="bg-lime-400 text-zinc-900 px-6 py-3 rounded-2xl text-sm font-bold hover:bg-lime-300 transition-all"
            >
              Explore Markets
            </button>
          </div>
        ) : markets.length === 0 ? (
          <div className="text-center py-20 bg-[#111318] rounded-3xl border border-white/5">
            <p className="text-zinc-500">
              Saved markets could not be loaded (they may have been deleted).
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

