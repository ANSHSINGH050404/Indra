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
      <div className="max-w-5xl mx-auto pt-16">
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-lime-400/10 border border-lime-400/20 px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-400">Live Rankings</span>
          </div>
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter mb-6 leading-tight text-white">
            THE HALL OF <span className="text-lime-400">FAME</span>
          </h1>
          <p className="text-zinc-500 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            The world's best prediction traders, ranked by their total profit and strategy.
          </p>
        </div>

        <div className="mb-12 bg-[#0d0f17] border border-white/5 rounded-[2.5rem] p-3 md:p-4 flex flex-col md:flex-row gap-3 items-center backdrop-blur-xl shadow-2xl">
          <div className="flex-1 w-full relative group">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-lime-400 transition-colors">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M21 21l-4.3-4.3" />
                <circle cx="11" cy="11" r="7" />
              </svg>
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a trader..."
              className="w-full bg-white/[0.03] border border-white/[0.05] rounded-[1.8rem] py-4 pl-14 pr-6 text-sm text-white placeholder-zinc-600 outline-none focus:border-lime-400/30 focus:bg-white/[0.06] transition-all"
            />
          </div>
          <div className="px-6 py-2 bg-white/[0.03] border border-white/5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 whitespace-nowrap">
            {loading ? "Searching..." : `${entries.length} Traders Found`}
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
            {/* Elegant Podium */}
            <div className="flex flex-col md:flex-row items-end justify-center gap-4 mb-12 mt-8">
              {/* 2nd Place */}
              {top3[1] && (
                <div 
                  onClick={() => router.push(`/profile/${top3[1].id}`)}
                  className="order-2 md:order-1 flex-1 w-full max-w-[280px] group cursor-pointer"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className={`w-16 h-16 rounded-2xl p-[1px] rotate-3 group-hover:rotate-6 transition-transform ${user?.id === top3[1].id ? "bg-lime-400" : "bg-gradient-to-br from-slate-300 to-slate-500"}`}>
                        <div className="w-full h-full rounded-2xl bg-[#0d0f17] flex items-center justify-center font-black text-xl text-slate-300">
                          2
                        </div>
                      </div>
                      <div className="absolute -top-2 -right-2 bg-slate-400 text-[#080a10] w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-[#080a10]">
                        🥈
                      </div>
                    </div>
                    <div className="text-center mb-2">
                      <div className={`font-bold transition-colors ${user?.id === top3[1].id ? "text-lime-400" : "text-white group-hover:text-slate-300"}`}>{top3[1].fullname}</div>
                      <div className="text-xs text-zinc-500 font-black tracking-widest uppercase">₹{Number(top3[1].points).toLocaleString()}</div>
                    </div>
                    <div className="w-full h-32 bg-white/[0.03] border border-white/5 rounded-t-3xl flex items-end justify-center pb-4 relative overflow-hidden">
                       <div className={`absolute inset-0 bg-gradient-to-t to-transparent ${user?.id === top3[1].id ? "from-lime-400/10" : "from-slate-500/10"}`} />
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {top3[0] && (
                <div 
                  onClick={() => router.push(`/profile/${top3[0].id}`)}
                  className="order-1 md:order-2 flex-1 w-full max-w-[320px] group cursor-pointer z-10"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className={`w-24 h-24 rounded-[2rem] p-[2px] -rotate-3 group-hover:rotate-0 transition-transform shadow-[0_0_40px_rgba(163,230,53,0.2)] ${user?.id === top3[0].id ? "bg-white" : "bg-gradient-to-br from-lime-300 via-lime-400 to-emerald-500"}`}>
                        <div className="w-full h-full rounded-[2rem] bg-[#0d0f17] flex items-center justify-center font-black text-3xl text-lime-400">
                          1
                        </div>
                      </div>
                      <div className="absolute -top-3 -right-3 bg-lime-400 text-[#080a10] w-10 h-10 rounded-full flex items-center justify-center text-xl border-4 border-[#080a10]">
                        👑
                      </div>
                    </div>
                    <div className="text-center mb-2">
                      <div className={`text-xl font-black transition-colors ${user?.id === top3[0].id ? "text-lime-400" : "text-white group-hover:text-lime-400"}`}>{top3[0].fullname}</div>
                      <div className="text-sm text-lime-400 font-black tracking-widest uppercase">₹{Number(top3[0].points).toLocaleString()}</div>
                    </div>
                    <div className="w-full h-48 bg-lime-400/[0.07] border border-lime-400/20 rounded-t-[3rem] flex items-end justify-center pb-6 relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-t from-lime-400/20 to-transparent" />
                       <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-lime-400/10 blur-[60px] rounded-full" />
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {top3[2] && (
                <div 
                  onClick={() => router.push(`/profile/${top3[2].id}`)}
                  className="order-3 flex-1 w-full max-w-[280px] group cursor-pointer"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className={`w-16 h-16 rounded-2xl p-[1px] rotate-6 group-hover:rotate-3 transition-transform ${user?.id === top3[2].id ? "bg-lime-400" : "bg-gradient-to-br from-amber-600 to-orange-800"}`}>
                        <div className="w-full h-full rounded-2xl bg-[#0d0f17] flex items-center justify-center font-black text-xl text-amber-600">
                          3
                        </div>
                      </div>
                      <div className="absolute -top-2 -right-2 bg-amber-700 text-[#080a10] w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-[#080a10]">
                        🥉
                      </div>
                    </div>
                    <div className="text-center mb-2">
                      <div className={`font-bold transition-colors ${user?.id === top3[2].id ? "text-lime-400" : "text-white group-hover:text-amber-600"}`}>{top3[2].fullname}</div>
                      <div className="text-xs text-zinc-500 font-black tracking-widest uppercase">₹{Number(top3[2].points).toLocaleString()}</div>
                    </div>
                    <div className="w-full h-24 bg-white/[0.03] border border-white/5 rounded-t-3xl flex items-end justify-center pb-4 relative overflow-hidden">
                       <div className={`absolute inset-0 bg-gradient-to-t to-transparent ${user?.id === top3[2].id ? "from-lime-400/10" : "from-amber-700/10"}`} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Table Container */}
            <div className="bg-[#0d0f17] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
              <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Current Standings</h3>
                </div>
                {user && (
                  <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 px-4 py-1.5 rounded-full">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">My Points</span>
                    <span className="text-sm font-black text-lime-400">₹{user.points.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="divide-y divide-white/5">
                {entries.slice(3).map((e, index) => {
                  const rank = index + 4;
                  const isMe = user?.id === e.id;
                  
                  return (
                    <div
                      key={e.id}
                      onClick={() => router.push(`/profile/${e.id}`)}
                      className={`group px-8 py-5 flex items-center gap-6 cursor-pointer hover:bg-white/[0.03] transition-all relative ${
                        isMe ? "bg-lime-400/[0.02]" : ""
                      }`}
                    >
                      {isMe && <div className="absolute left-0 top-0 bottom-0 w-1 bg-lime-400 shadow-[0_0_20px_rgba(163,230,53,0.3)]" />}
                      
                      <div className="w-8 text-sm font-black text-zinc-600 group-hover:text-zinc-400 transition-colors tabular-nums">
                        {rank < 10 ? `0${rank}` : rank}
                      </div>
                      
                      <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-center font-black text-zinc-400 group-hover:border-lime-400/30 group-hover:text-white transition-all">
                        {e.fullname?.[0]?.toUpperCase()}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-[15px] truncate transition-colors ${isMe ? "text-lime-400" : "text-zinc-200 group-hover:text-white"}`}>
                            {e.fullname}
                          </span>
                          {isMe && (
                            <span className="text-[9px] font-black uppercase tracking-widest bg-lime-400 text-black px-1.5 py-0.5 rounded-md">
                              You
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-black text-white tabular-nums tracking-wide">
                          ₹{Number(e.points).toLocaleString()}
                        </div>
                        <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                          Points
                        </div>
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
