"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { getPositions } from "@/services/trade";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { toast } from "sonner";


interface Position {
  id: string;
  shares: number;
  outcome: {
    id: string;
    title: string;
    price: number;
    market: {
      id: string;
      title: string;
      category: string;
    };
  };
}

const COLORS = ["#84cc16", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6"];

export default function PortfolioPage() {
  const { user, isLoggedIn, refreshUser } = useAuth();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [faucetLoading, setFaucetLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      const fetchPositions = async () => {
        try {
          const data = await getPositions();
          setPositions(data.filter((p: Position) => p.shares > 0));
        } catch (err) {
          console.error("Failed to fetch positions", err);
        } finally {
          setLoading(false);
        }
      };
      fetchPositions();
    }
  }, [isLoggedIn]);

  const stats = useMemo(() => {
    const portfolioValue = positions.reduce((acc, p) => acc + (p.shares * p.outcome.price) / 100, 0);
    const netWorth = (user?.points || 0) + portfolioValue;

    const categoryAllocation: Record<string, number> = {};
    positions.forEach((p) => {
      const cat = p.outcome.market.category;
      const val = (p.shares * p.outcome.price) / 100;
      categoryAllocation[cat] = (categoryAllocation[cat] || 0) + val;
    });

    const pieData = Object.entries(categoryAllocation).map(([name, value]) => ({ name, value }));
    
    return { portfolioValue, netWorth, pieData };
  }, [positions, user]);

  const handleClaimFaucet = async () => {
    setFaucetLoading(true);
    try {
      const res = await api.post("/api/user/faucet");
      toast.success(res.data.message);
      await refreshUser();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Faucet claim failed");
    } finally {
      setFaucetLoading(false);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-[#080a10] text-white">
      
      <div className="max-w-7xl mx-auto p-6 md:p-12 pt-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2">
              Your <span className="text-lime-400">Portfolio</span>
            </h1>
            <p className="text-zinc-500">Track your performance and investments across markets.</p>
          </div>
          <button
            onClick={handleClaimFaucet}
            disabled={faucetLoading}
            className="bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-zinc-900 font-bold px-6 py-3 rounded-2xl transition-all shadow-lg shadow-lime-400/10"
          >
            {faucetLoading ? "Claiming..." : "Claim Daily Faucet (₹500)"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#111318] p-8 rounded-3xl border border-white/5">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Net Worth</p>
            <p className="text-4xl font-black text-white">₹{stats.netWorth.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          </div>
          <div className="bg-[#111318] p-8 rounded-3xl border border-white/5">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Available Balance</p>
            <p className="text-4xl font-black text-lime-400">₹{user?.points?.toLocaleString()}</p>
          </div>
          <div className="bg-[#111318] p-8 rounded-3xl border border-white/5">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Portfolio Value</p>
            <p className="text-4xl font-black text-white">₹{stats.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#111318] p-8 rounded-3xl border border-white/5">
            <h2 className="text-xl font-bold mb-8">Asset Allocation</h2>
            {stats.pieData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: "#1c1f26", border: "none", borderRadius: "12px", color: "white" }}
                      itemStyle={{ color: "white" }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-zinc-500 italic">
                No active investments yet.
              </div>
            )}
          </div>

          <div className="bg-[#111318] p-8 rounded-3xl border border-white/5">
            <h2 className="text-xl font-bold mb-8">Active Positions</h2>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {positions.length === 0 ? (
                <p className="text-zinc-500 text-center py-20">You don't have any open positions.</p>
              ) : (
                positions.map((pos) => (
                  <div key={pos.id} className="bg-white/5 rounded-2xl p-5 border border-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-sm line-clamp-1 flex-1">{pos.outcome.market.title}</h3>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ml-2 ${pos.outcome.title === "YES" ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"}`}>
                        {pos.outcome.title}
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Shares Owned</p>
                        <p className="font-mono font-bold">{pos.shares}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Current Value</p>
                        <p className="font-bold text-lg text-white">₹{((pos.shares * pos.outcome.price) / 100).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
