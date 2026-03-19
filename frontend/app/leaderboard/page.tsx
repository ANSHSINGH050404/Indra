"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

type LeaderboardEntry = {
  id: number;
  fullname: string;
  points: number;
};

export default function LeaderboardPage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

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

    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/leaderboard", {
          params: {
            q: debouncedQuery.trim() ? debouncedQuery.trim() : undefined,
            limit: 100,
          },
        });
        setEntries(res.data || []);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [isLoggedIn, debouncedQuery]);

  const top3 = useMemo(() => entries.slice(0, 3), [entries]);

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-[#080a10] text-white p-6 md:p-12">
      <div className="max-w-5xl mx-auto pt-8">
        <div className="mb-10">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3">
            Leader<span className="text-lime-400">board</span>
          </h1>
          <p className="text-zinc-500 text-lg">
            Top traders ranked by points.
          </p>
        </div>

        <div className="mb-6 bg-[#0d0f17] border border-white/5 rounded-3xl p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
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
                placeholder="Search by name..."
                className="w-full bg-white/[0.04] border border-white/[0.07] rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-zinc-600 outline-none focus:border-lime-400/50 focus:ring-2 focus:ring-lime-400/10 transition-all"
              />
            </div>
            <div className="text-xs text-zinc-500 md:text-right">
              {loading ? "Loading..." : `${entries.length} shown`}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 bg-[#111318] rounded-3xl border border-white/5">
            <p className="text-zinc-500">Loading leaderboard...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 bg-[#111318] rounded-3xl border border-white/5">
            <p className="text-zinc-500">No users found.</p>
          </div>
        ) : (
          <>
            {/* Podium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {top3.map((e, idx) => (
                <div
                  key={e.id}
                  className="bg-[#0d0f17] border border-white/5 rounded-3xl p-6 relative overflow-hidden"
                >
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-lime-400/30 to-transparent" />
                  <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-3">
                    Rank {idx + 1}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center font-black text-zinc-200">
                      {e.fullname?.trim()?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-white truncate">{e.fullname}</div>
                      <div className="text-xs text-zinc-500 font-semibold">
                        â‚¹{Number(e.points).toLocaleString()} pts
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-3xl border border-white/5 bg-[#111318]">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  Rankings
                </div>
                {user && (
                  <div className="text-xs text-zinc-500">
                    Your points: <span className="text-white font-bold">â‚¹{user.points.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="divide-y divide-white/5">
                {entries.map((e, index) => {
                  const isMe = user?.id === e.id;
                  return (
                    <div
                      key={e.id}
                      onClick={() => router.push(`/profile/${e.id}`)}
                      className={`px-6 py-4 flex items-center gap-4 cursor-pointer hover:bg-white/[0.05] transition-colors ${
                        isMe ? "bg-lime-400/[0.04]" : ""
                      }`}
                    >
                      <div className="w-10 text-sm font-black text-zinc-500 tabular-nums">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold truncate ${isMe ? "text-lime-400" : "text-white"}`}>
                          {e.fullname}
                        </div>
                        {isMe && <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">You</div>}
                      </div>
                      <div className="text-sm font-black text-white tabular-nums">
                        â‚¹{Number(e.points).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

