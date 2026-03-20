"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user, isLoggedIn, refreshUser, isAuthLoaded } = useAuth();
  const router = useRouter();
  
  const [markets, setMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"create" | "manage">("manage");
  
  // Create Market State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Politics");
  const [expiresAt, setExpiresAt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isAuthLoaded) {
      if (!isLoggedIn) {
        router.push("/auth/login");
      } else if (user && !user.isAdmin) {
        router.push("/");
      }
    }
  }, [isLoggedIn, user, router, isAuthLoaded]);

  useEffect(() => {
    if (user?.isAdmin) {
      fetchMarkets();
    }
  }, [user]);

  const fetchMarkets = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/markets", { params: { limit: 100 } });
      setMarkets(res.data);
    } catch (err) {
      console.error("Error fetching markets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    const toastId = toast.loading("Creating market...");
    try {
      // Ensure expiresAt is sent in UTC
      const expiresAtUTC = new Date(expiresAt).toISOString();

      await api.post("/api/admin/markets", {
        title,
        description,
        category,
        expiresAt: expiresAtUTC,
        imageUrl,
        outcomes: [
          { title: "Yes", price: 50 },
          { title: "No", price: 50 }
        ]
      });
      toast.success("Market created successfully!", { id: toastId });
      setTitle("");
      setDescription("");
      setExpiresAt("");
      setImageUrl("");
      setActiveTab("manage");
      fetchMarkets();
    } catch (err: any) {
      toast.error("Failed to create market: " + (err.response?.data?.message || err.message), { id: toastId });
    } finally {
      setIsCreating(false);
    }
  };

  const handleResolve = async (marketId: string, winningOutcomeId: string, outcomeTitle: string) => {
    if (!confirm(`Resolve this market to "${outcomeTitle}"? This is permanent.`)) return;
    
    const toastId = toast.loading("Resolving market...");
    try {
      await api.post("/api/admin/markets/resolve", { marketId, winningOutcomeId });
      toast.success("Market resolved!", { id: toastId });
      fetchMarkets();
    } catch (err: any) {
      toast.error("Failed to resolve market: " + (err.response?.data?.message || err.message), { id: toastId });
    }
  };

  const handleDelete = async (marketId: string) => {
    if (!confirm("Delete this market? This will erase all trades and history.")) return;
    
    const toastId = toast.loading("Deleting market...");
    try {
      await api.delete(`/api/admin/markets/${marketId}`);
      toast.success("Market deleted!", { id: toastId });
      fetchMarkets();
    } catch (err: any) {
      toast.error("Failed to delete market: " + (err.response?.data?.message || err.message), { id: toastId });
    }
  };

  const filteredMarkets = useMemo(() => {
    return markets.filter(m => 
      m.title.toLowerCase().includes(query.toLowerCase()) || 
      m.category.toLowerCase().includes(query.toLowerCase())
    );
  }, [markets, query]);

  const stats = useMemo(() => {
    const active = markets.filter(m => m.status === 'active').length;
    const resolved = markets.filter(m => m.status === 'resolved').length;
    const totalVol = markets.reduce((acc, m) => acc + (m.volume || 0), 0);
    return { active, resolved, totalVol };
  }, [markets]);

  if (!isAuthLoaded || !user?.isAdmin) {
    return (
      <div className="min-h-screen bg-[#080a10] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-lime-400/20 border-t-lime-400 rounded-full animate-spin" />
          <div className="text-zinc-500 font-black tracking-widest uppercase text-xs">
            Authenticating...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080a10] text-white">
      <div className="max-w-7xl mx-auto p-6 md:p-12 pt-24">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 bg-lime-400/10 border border-lime-400/20 px-3 py-1 rounded-full mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-lime-400">Control Center</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
              ADMIN <span className="text-lime-400">PANEL</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 bg-[#0d0f17] border border-white/5 p-1 rounded-2xl">
            <button 
              onClick={() => setActiveTab("manage")}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "manage" ? "bg-white text-zinc-900" : "text-zinc-500 hover:text-white"}`}
            >
              Manage
            </button>
            <button 
              onClick={() => setActiveTab("create")}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "create" ? "bg-lime-400 text-zinc-900" : "text-zinc-500 hover:text-white"}`}
            >
              Create
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: "Active Markets", val: stats.active, color: "text-emerald-400" },
            { label: "Resolved", val: stats.resolved, color: "text-zinc-400" },
            { label: "Total Platform Volume", val: `₹${stats.totalVol.toLocaleString()}`, color: "text-lime-400" }
          ].map((s, i) => (
            <div key={i} className="bg-[#0d0f17] border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.02] rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150" />
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">{s.label}</p>
              <p className={`text-3xl font-black ${s.color}`}>{s.val}</p>
            </div>
          ))}
        </div>

        {activeTab === "create" ? (
          /* Create Market Form */
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#0d0f17] border border-white/5 p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-lime-400 to-emerald-500" />
              
              <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-lime-400 flex items-center justify-center text-zinc-900 text-sm">
                  +
                </span>
                Launch New Market
              </h2>

              <form onSubmit={handleCreateMarket} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Market Question</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-lime-400 transition-all text-lg font-bold"
                    placeholder="e.g. Will India win the next T20 World Cup?"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Context / Rules</label>
                  <textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-lime-400 transition-all min-h-[120px] text-zinc-300"
                    placeholder="Provide details about resolution sources and specific conditions..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Category</label>
                    <select 
                      value={category} 
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[#1c1f26] border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-lime-400 appearance-none font-bold"
                    >
                      {["Politics", "Crypto", "Sports", "Tech", "Science", "Entertainment"].map(c => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Expiration Deadline (UTC)</label>
                    <input 
                      type="datetime-local" 
                      value={expiresAt} 
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-lime-400 transition-all font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Cover Image URL (Optional)</label>
                  <input 
                    type="text" 
                    value={imageUrl} 
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-lime-400 transition-all"
                    placeholder="https://..."
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isCreating}
                  className="w-full bg-lime-400 hover:bg-lime-300 text-zinc-900 font-black py-5 rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-lime-400/10 disabled:opacity-50 mt-4"
                >
                  {isCreating ? "Deploying Market..." : "DEPLOY MARKET"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Manage Markets Section */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1 group">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M21 21l-4.3-4.3" />
                    <circle cx="11" cy="11" r="7" />
                  </svg>
                </span>
                <input 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-[#0d0f17] border border-white/10 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:border-white/20 transition-all font-medium"
                  placeholder="Filter by title or category..."
                />
              </div>
              <button 
                onClick={fetchMarkets}
                className="bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-2xl transition-all"
                title="Refresh Markets"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className={loading ? "animate-spin" : ""}>
                  <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loading && Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-48 bg-white/[0.02] border border-white/5 rounded-3xl animate-pulse" />
              ))}
              
              {!loading && filteredMarkets.map((market) => (
                <div key={market.id} className="bg-[#0d0f17] border border-white/5 rounded-[2rem] p-6 relative group hover:border-white/10 transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1 pr-8">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 px-2 py-0.5 border border-white/5 rounded-md">
                          {market.category}
                        </span>
                        {market.status === 'resolved' && (
                          <span className="text-[9px] font-black uppercase tracking-widest text-lime-400 px-2 py-0.5 bg-lime-400/10 rounded-md">
                            Resolved
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg leading-tight group-hover:text-lime-400 transition-colors">{market.title}</h3>
                    </div>
                    <button 
                      onClick={() => handleDelete(market.id)}
                      className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-zinc-600 hover:text-red-400 hover:border-red-400/30 transition-all"
                      title="Delete Market"
                    >
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-6 border-y border-white/5 py-3">
                    <span>Vol: ₹{market.volume.toLocaleString()}</span>
                    <span>Ends: {new Date(market.expiresAt).toLocaleDateString()}</span>
                  </div>

                  {market.status === 'active' ? (
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2 text-center">Select Winning Outcome</p>
                      <div className="flex gap-2">
                        {market.outcomes.map((outcome: any) => (
                          <button
                            key={outcome.id}
                            onClick={() => handleResolve(market.id, outcome.id, outcome.title)}
                            className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase hover:bg-white/10 hover:border-lime-400/50 transition-all active:scale-[0.97]"
                          >
                            {outcome.title} Wins
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-2 opacity-60">
                      <div className="w-8 h-8 rounded-full bg-lime-400 flex items-center justify-center text-zinc-900 mb-2">
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                      <p className="text-xs font-black uppercase tracking-widest text-lime-400">Archived</p>
                    </div>
                  )}
                </div>
              ))}
              
              {!loading && filteredMarkets.length === 0 && (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
                  <p className="text-zinc-500 font-medium">No markets found matching your criteria.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
