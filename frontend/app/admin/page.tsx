"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user, isLoggedIn, refreshUser } = useAuth();
  const router = useRouter();
  
  const [markets, setMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  
  // Create Market State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Politics");
  const [expiresAt, setExpiresAt] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      if (!user && localStorage.getItem("token")) {
        await refreshUser();
      }
      setAuthChecking(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!authChecking) {
      if (!isLoggedIn) {
        router.push("/auth/login");
      } else if (user && !user.isAdmin) {
        router.push("/");
      }
    }
  }, [isLoggedIn, user, router, authChecking]);

  useEffect(() => {
    if (user?.isAdmin) {
      fetchMarkets();
    }
  }, [user]);

  const fetchMarkets = async () => {
    try {
      const res = await api.get("/api/markets");
      setMarkets(res.data);
    } catch (err) {
      console.error("Error fetching markets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/admin/markets", {
        title,
        description,
        category,
        expiresAt,
        imageUrl,
        outcomes: [
          { title: "Yes", price: 50 },
          { title: "No", price: 50 }
        ]
      });
      toast.success("Market created successfully!");
      setTitle("");
      setDescription("");
      fetchMarkets();
    } catch (err: any) {
      toast.error("Failed to create market: " + (err.response?.data?.message || err.message));
    }
  };

  const handleResolve = async (marketId: string, winningOutcomeId: string) => {
    if (!confirm("Are you sure you want to resolve this market? This action is irreversible.")) return;
    
    try {
      await api.post("/api/admin/markets/resolve", { marketId, winningOutcomeId });
      toast.success("Market resolved!");
      fetchMarkets();
    } catch (err: any) {
      toast.error("Failed to resolve market: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (marketId: string) => {
    if (!confirm("Are you sure you want to delete this market? This will remove all associated data.")) return;
    
    try {
      await api.delete(`/api/admin/markets/${marketId}`);
      toast.success("Market deleted!");
      fetchMarkets();
    } catch (err: any) {
      toast.error("Failed to delete market: " + (err.response?.data?.message || err.message));
    }
  };

  if (authChecking || !user?.isAdmin) {
    return (
      <div className="min-h-screen bg-[#080a10] flex items-center justify-center">
        <div className="text-zinc-500 animate-pulse font-bold tracking-widest uppercase">
          Verifying Admin Access...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080a10] text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto pt-8">
        <h1 className="text-3xl font-black mb-8">Admin <span className="text-lime-400">Dashboard</span></h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Create Market Section */}
          <section className="bg-[#111318] p-8 rounded-3xl border border-white/5">
            <h2 className="text-xl font-bold mb-6">Create New Market</h2>
            <form onSubmit={handleCreateMarket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Market Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-lime-400"
                  placeholder="e.g. Will Bitcoin reach $100k?"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Description</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-lime-400 h-24"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Category</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#1c1f26] border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-lime-400"
                  >
                    <option>Politics</option>
                    <option>Crypto</option>
                    <option>Sports</option>
                    <option>Tech</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Expires At</label>
                  <input 
                    type="datetime-local" 
                    value={expiresAt} 
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-lime-400"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Image URL</label>
                <input 
                  type="text" 
                  value={imageUrl} 
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-lime-400"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-lime-400 text-zinc-900 font-bold py-3 rounded-xl hover:bg-lime-300 transition-all"
              >
                Create Market
              </button>
            </form>
          </section>

          {/* Resolve Markets Section */}
          <section>
            <h2 className="text-xl font-bold mb-6">Manage Markets</h2>
            <div className="space-y-4">
              {loading ? <p>Loading...</p> : markets.map((market) => (
                <div key={market.id} className="bg-[#111318] p-6 rounded-2xl border border-white/5">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold">{market.title}</h3>
                    <button 
                      onClick={() => handleDelete(market.id)}
                      className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                      title="Delete Market"
                    >
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </div>
                  
                  {market.status === 'active' ? (
                    <div className="flex gap-2">
                      {market.outcomes.map((outcome: any) => (
                        <button
                          key={outcome.id}
                          onClick={() => handleResolve(market.id, outcome.id)}
                          className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase hover:bg-white/10 hover:border-lime-400/50 transition-all"
                        >
                          Resolve {outcome.title}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs font-bold text-lime-400 uppercase tracking-widest bg-lime-400/10 py-2 rounded-lg text-center">
                      Resolved
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
