"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Market } from "@/components/card";
import { createTrade, getPositions } from "@/services/trade";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

export default function MarketDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { user, isLoggedIn, refreshUser } = useAuth();
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState<number>(100);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [tradeType, setTradeType] = useState<"BUY" | "SELL">("BUY");
  const [userPositions, setUserPositions] = useState<any[]>([]);

  const [historyData, setHistoryData] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [commentContent, setCommentContent] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [marketRes, posRes, historyRes, commentsRes] = await Promise.all([
          api.get(`/api/markets/${slug}`),
          getPositions(),
          api.get(`/api/markets/${slug}/history`),
          api.get(`/api/comments/${slug}`)
        ]);
        
        setMarket(marketRes.data);
        setUserPositions(posRes);
        setComments(commentsRes.data || []);
        
        // Transform history data for Recharts
        // Find longest history
        const yesHist = historyRes.data.find((h: any) => h.outcomeTitle === "YES")?.history || [];
        const noHist = historyRes.data.find((h: any) => h.outcomeTitle === "NO")?.history || [];
        
        // Merge histories by timestamp or simply map by index for a simplified view
        const merged = yesHist.map((h: any, i: number) => ({
          time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          yes: h.price,
          no: noHist[i]?.price || (100 - h.price)
        }));

        // Add current spot price as last point
        const yesOutcome = marketRes.data.outcomes?.find((o: any) => o.title === "YES");
        const noOutcome = marketRes.data.outcomes?.find((o: any) => o.title === "NO");
        if (yesOutcome) {
            merged.push({
                time: "Now",
                yes: yesOutcome.price,
                no: noOutcome?.price || (100 - yesOutcome.price)
            });
        }

        setHistoryData(merged);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug, isLoggedIn, router]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || !market) return;
    
    setCommentLoading(true);
    try {
      const res = await api.post("/api/comments", {
        marketId: market.id,
        content: commentContent
      });
      setComments([res.data, ...comments]);
      setCommentContent("");
      toast.success("Comment posted!");
    } catch (err) {
      toast.error("Failed to post comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleTrade = async (title: "YES" | "NO") => {
    const outcome = market?.outcomes?.find(o => o.title === title);
    if (!outcome) return;

    setTradeLoading(true);
    setStatus(null);
    const toastId = toast.loading(`${tradeType === "BUY" ? "Buying" : "Selling"} shares...`);
    try {
      if (tradeType === "BUY") {
        await createTrade(outcome.id, amount, "BUY");
        const msg = `Successfully bought ${title} shares!`;
        setStatus({ type: "success", msg });
        toast.success(msg, { id: toastId });
      } else {
        await createTrade(outcome.id, amount, "SELL");
        const msg = `Successfully sold ${amount} shares of ${title}!`;
        setStatus({ type: "success", msg });
        toast.success(msg, { id: toastId });
      }
      
      await refreshUser();
      
      // Refresh market and positions data
      const [marketRes, posRes] = await Promise.all([
        api.get(`/api/markets/${slug}`),
        getPositions()
      ]);
      setMarket(marketRes.data);
      setUserPositions(posRes);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Trade failed";
      setStatus({ 
        type: "error", 
        msg: msg
      });
      toast.error(msg, { id: toastId });
    } finally {
      setTradeLoading(false);
    }
  };

  const getHoldingForOutcome = (outcomeId: string) => {
    const pos = userPositions.find(p => p.outcomeId === outcomeId);
    return pos ? pos.shares : 0;
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
    <div className="min-h-screen bg-[#080a10] text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6 md:p-12 pt-24">
        
        {/* Back Button */}
        <button 
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
        >
          ← Back to markets
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          <div className="lg:col-span-2 space-y-8">
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

              <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
                {market.description}
              </p>

              {/* Price Chart */}
              <div className="bg-black/20 border border-white/5 rounded-2xl p-6 mb-10 h-[300px]">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Price History</h3>
                <ResponsiveContainer width="100%" height="90%">
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[0, 100]} stroke="#52525b" fontSize={10} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: "#1c1f26", border: "none", borderRadius: "12px", color: "white", fontSize: "12px" }}
                        itemStyle={{ color: "white" }}
                    />
                    <Line type="monotone" dataKey="yes" stroke="#a3e635" strokeWidth={3} dot={false} animationDuration={1000} />
                    <Line type="monotone" dataKey="no" stroke="#f43f5e" strokeWidth={3} dot={false} animationDuration={1000} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-wrap gap-8">
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

            {/* Comments Section */}
            <div className="bg-[#0d0f17] border border-white/5 rounded-3xl p-8 md:p-12">
                <h3 className="text-xl font-bold mb-8">Discussions</h3>
                <form onSubmit={handlePostComment} className="mb-10">
                    <textarea 
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        placeholder="Share your thoughts or alpha..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm focus:outline-none focus:border-lime-400/50 min-h-[100px] mb-4"
                    />
                    <button 
                        disabled={commentLoading || !commentContent.trim()}
                        className="bg-zinc-100 hover:bg-white disabled:opacity-50 text-zinc-900 font-bold px-8 py-3 rounded-xl transition-all"
                    >
                        {commentLoading ? "Posting..." : "Post Comment"}
                    </button>
                </form>

                <div className="space-y-6">
                    {comments.length === 0 ? (
                        <p className="text-zinc-500 text-center py-10 italic">No comments yet. Be the first to start the discussion!</p>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className="border-b border-white/5 pb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <button 
                                        onClick={() => router.push(`/profile/${comment.user.id}`)}
                                        className="font-black text-lime-400 text-xs uppercase tracking-widest hover:underline"
                                    >
                                        {comment.user.fullname}
                                    </button>
                                    <span className="text-[10px] text-zinc-600">{new Date(comment.createdAt).toLocaleString()}</span>
                                </div>
                                <p className="text-zinc-300 text-sm leading-relaxed">{comment.content}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
          </div>

          {/* Side Trading Panel */}
          <div className="lg:col-span-1">
            <div className="bg-[#111318] border border-white/5 rounded-3xl p-8 sticky top-24">
              <h2 className="text-xl font-bold mb-8">Place Trade</h2>
              
              <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-2xl w-fit mx-auto">
                <button 
                  type="button"
                  onClick={() => { setTradeType("BUY"); setAmount(100); }}
                  className={`px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer ${tradeType === "BUY" ? "bg-lime-400 text-zinc-900 shadow-xl" : "text-zinc-500 hover:text-white"}`}
                >
                  Buy
                </button>
                <button 
                  type="button"
                  onClick={() => { setTradeType("SELL"); setAmount(100); }}
                  className={`px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer ${tradeType === "SELL" ? "bg-white text-zinc-900 shadow-xl" : "text-zinc-500 hover:text-white"}`}
                >
                  Sell
                </button>
              </div>

              <div className="mb-10">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block text-center">
                  {tradeType === "BUY" ? "Investment Amount" : "Shares to Sell"}
                </label>
                <div className="relative">
                  {tradeType === "BUY" && <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xl">₹</span>}
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className={`w-full bg-white/5 border border-white/10 rounded-2xl py-5 pr-6 text-2xl font-black text-white text-center focus:outline-none focus:border-lime-400/50 transition-all ${tradeType === "BUY" ? "pl-10" : "pl-6"}`}
                    placeholder="0"
                  />
                </div>
                {tradeType === "SELL" && (
                    <div className="mt-4 flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-white/5 p-4 rounded-xl">
                        <div className="flex justify-between">
                            <span>YES Holdings</span>
                            <span className="text-emerald-400">{getHoldingForOutcome(market.outcomes?.find(o => o.title === "YES")?.id || "")} shares</span>
                        </div>
                        <div className="flex justify-between">
                            <span>NO Holdings</span>
                            <span className="text-red-400">{getHoldingForOutcome(market.outcomes?.find(o => o.title === "NO")?.id || "")} shares</span>
                        </div>
                    </div>
                )}
              </div>

              {market.outcomes && market.outcomes.length > 0 && (
                <div className="space-y-4">
                    <button 
                        type="button"
                        onClick={() => {
                            console.log("Trade button clicked YES", amount, tradeType);
                            handleTrade("YES");
                        }}
                        disabled={tradeLoading || !amount || amount <= 0 || (tradeType === "SELL" && amount > getHoldingForOutcome(market.outcomes.find(o => o.title === "YES")?.id || ""))}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-900 font-black py-5 rounded-2xl transition-all active:scale-95 text-xl flex flex-col items-center justify-center leading-none cursor-pointer"
                    >
                        <span className="flex items-center gap-2">
                            {tradeLoading && (
                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                </svg>
                            )}
                            {tradeLoading ? (tradeType === "BUY" ? "Buying..." : "Selling...") : (tradeType === "BUY" ? `Buy YES` : `Sell YES`)}
                        </span>
                        {tradeType === "BUY" && <span className="text-[10px] mt-2 opacity-60">@ ₹{market.outcomes.find(o => o.title === "YES")?.price} per share</span>}
                    </button>
                    
                    <button 
                        type="button"
                        onClick={() => {
                            console.log("Trade button clicked NO", amount, tradeType);
                            handleTrade("NO");
                        }}
                        disabled={tradeLoading || !amount || amount <= 0 || (tradeType === "SELL" && amount > getHoldingForOutcome(market.outcomes.find(o => o.title === "NO")?.id || ""))}
                        className="w-full bg-red-500 hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-5 rounded-2xl transition-all active:scale-95 text-xl flex flex-col items-center justify-center leading-none cursor-pointer"
                    >
                        <span className="flex items-center gap-2">
                            {tradeLoading && (
                                <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                </svg>
                            )}
                            {tradeLoading ? (tradeType === "BUY" ? "Buying..." : "Selling...") : (tradeType === "BUY" ? `Buy NO` : `Sell NO`)}
                        </span>
                        {tradeType === "BUY" && <span className="text-[10px] mt-2 opacity-60">@ ₹{market.outcomes.find(o => o.title === "NO")?.price} per share</span>}
                    </button>
                </div>
              )}

              {status && (
                <div className={`mt-8 p-5 rounded-2xl border text-center font-bold animate-in zoom-in duration-300 ${
                  status.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}>
                  {status.msg}
                </div>
              )}

              <div className="mt-8 bg-zinc-900/50 p-6 rounded-2xl border border-white/5">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-4">Portfolio Context</p>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Buying Power</span>
                    <span className="font-bold">₹{user?.points?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
