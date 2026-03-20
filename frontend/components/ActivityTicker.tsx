"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface TradeActivity {
  id: string;
  type: string;
  amount: number;
  shares: number;
  user: { fullname: string };
  outcome: {
    title: string;
    market: { title: string };
  };
}

export default function ActivityTicker() {
  const [activities, setActivities] = useState<TradeActivity[]>([]);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await api.get("/api/user/activity");
        setActivities(res.data);
      } catch (err) {
        console.error("Activity fetch failed", err);
      }
    };
    fetchActivity();
    const interval = setInterval(fetchActivity, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (activities.length === 0) return null;

  return (
    <div className="bg-lime-400/5 border-b border-lime-400/10 py-2.5 overflow-hidden whitespace-nowrap">
      <div className="flex animate-marquee gap-8 items-center px-6">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            <span className="text-lime-400">{activity.user?.fullname || "Anonymous"}</span>
            <span className={activity.type === "BUY" ? "text-emerald-400" : "text-rose-400"}>
              {activity.type === "BUY" ? "Bought" : "Sold"}
            </span>
            <span className="text-white">₹{activity.amount.toLocaleString()}</span>
            <span>on</span>
            <span className="text-zinc-300 max-w-[150px] truncate inline-block align-bottom">
              {activity.outcome?.market?.title || "Deleted Market"}
            </span>
            <span className="text-zinc-600 font-black">/</span>
          </div>
        ))}
        {/* Duplicate for infinite effect */}
        {activities.map((activity) => (
          <div key={activity.id + "-dup"} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            <span className="text-lime-400">{activity.user?.fullname || "Anonymous"}</span>
            <span className={activity.type === "BUY" ? "text-emerald-400" : "text-rose-400"}>
              {activity.type === "BUY" ? "Bought" : "Sold"}
            </span>
            <span className="text-white">₹{activity.amount.toLocaleString()}</span>
            <span>on</span>
            <span className="text-zinc-300 max-w-[150px] truncate inline-block align-bottom">
              {activity.outcome?.market?.title || "Deleted Market"}
            </span>
            <span className="text-zinc-600 font-black">/</span>
          </div>
        ))}
      </div>
    </div>
  );
}
