import { useState } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Market {
  id: string;
  title: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  category: string;
  status: "active" | "resolved" | "closed";
  resolvedOutcomeId: string | null;
  volume: number;
  expiresAt: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { bg: string; text: string; dot: string; emoji: string }> = {
  Crypto:   { bg: "bg-amber-500/15",  text: "text-amber-400",  dot: "bg-amber-400",  emoji: "₿"  },
  Sports:   { bg: "bg-sky-500/15",    text: "text-sky-400",    dot: "bg-sky-400",    emoji: "⚽" },
  Science:  { bg: "bg-violet-500/15", text: "text-violet-400", dot: "bg-violet-400", emoji: "🚀" },
  Politics: { bg: "bg-rose-500/15",   text: "text-rose-400",   dot: "bg-rose-400",   emoji: "🏛️" },
  default:  { bg: "bg-zinc-500/15",   text: "text-zinc-400",   dot: "bg-zinc-400",   emoji: "📊" },
};

// Seeded yes-probability — replace with real API data as needed
const SEED_PROB: Record<string, number> = {
  "25c7e6c3-27fc-4fc9-acf4-f836bd848b20": 68,
  "c2e8012d-c5a3-437f-9bc8-4fb9d875ed1d": 34,
  "37ce2975-2aa7-4d1b-b0e4-71965245aad8": 19,
};

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `₹${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `₹${(v / 1_000).toFixed(1)}K`;
  return `₹${v}`;
}

function daysLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  const days = Math.ceil(diff / 86_400_000);
  if (days <= 0)  return "Expired";
  if (days === 1) return "1 day left";
  if (days < 30)  return `${days}d left`;
  return `${Math.round(days / 30)}mo left`;
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ prob, seed }: { prob: number; seed: string }) {
  const hash = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const pts = Array.from({ length: 7 }, (_, i) => {
    const noise = ((hash * (i + 3) * 17) % 18) - 9;
    return Math.min(95, Math.max(5, prob + noise));
  });
  pts[6] = prob;

  const W = 56, H = 22;
  const xs = pts.map((_, i) => (i / 6) * W);
  const ys = pts.map((p) => H - (p / 100) * H);
  const d    = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const fill = `${d} L${W},${H} L0,${H} Z`;

  const isUp      = pts[6] >= pts[0];
  const stroke    = isUp ? "#34d399" : "#f87171";
  const fillColor = isUp ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)";

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
      <path d={fill} fill={fillColor} />
      <path d={d} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── MarketCard ───────────────────────────────────────────────────────────────

interface MarketCardProps {
  market: Market;
  /** Override yes probability (0–100). Falls back to SEED_PROB then 50. */
  yesProbability?: number;
}

export default function MarketCard({ market, yesProbability }: MarketCardProps) {
  const [pick, setPick]   = useState<"yes" | "no" | null>(null);
  const [saved, setSaved] = useState(false);

  if (!market) return null;

  const meta = CATEGORY_META[market.category] ?? CATEGORY_META.default;
  const yesP = yesProbability ?? SEED_PROB[market.id] ?? 50;
  const noP  = 100 - yesP;

  return (
    <div className="relative bg-[#111318] border border-white/[0.07] rounded-2xl overflow-hidden
      hover:border-white/[0.15] hover:shadow-[0_4px_40px_rgba(0,0,0,0.5)]
      transition-all duration-300 flex flex-col w-full max-w-sm font-sans">

      {/* Top shimmer */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Body */}
      <div className="p-5 flex flex-col gap-4 flex-1">

        {/* Category + Bookmark */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-1 rounded-full ${meta.bg} ${meta.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
            {market.category}
          
          </span>

          <button
            onClick={() => setSaved((s) => !s)}
            className="w-7 h-7 rounded-lg border border-white/[0.08] bg-white/[0.03]
              hover:bg-white/[0.09] flex items-center justify-center transition-colors duration-150"
            aria-label="Bookmark"
          >
            <svg width="13" height="13" viewBox="0 0 24 24"
              fill={saved ? "currentColor" : "none"}
              stroke="currentColor" strokeWidth="2"
              className={saved ? "text-amber-400" : "text-zinc-500"}>
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
          </button>
        </div>

        {/* Emoji + Title */}
        <Link href={`/markets/${market.slug}`} className="group/link flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.07]
            flex items-center justify-center text-xl flex-shrink-0 select-none group-hover/link:border-lime-400/30 transition-colors">
            {meta.emoji}
          </div>
          <h2 className="text-white font-bold text-[15px] leading-snug tracking-tight line-clamp-2 group-hover/link:text-lime-400 transition-colors">
            {market.title}
          </h2>
        </Link>

        {/* Description */}
        <p className="text-zinc-500 text-[12px] leading-relaxed line-clamp-2">
          {market.description}
        </p>

        {/* YES / NO rows */}
        <div className="space-y-2">
          {/* YES */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setPick(pick === "yes" ? null : "yes")}
            onKeyDown={(e) => e.key === "Enter" && setPick(pick === "yes" ? null : "yes")}
            className={`cursor-pointer rounded-xl border p-3 transition-all duration-200
              ${pick === "yes"
                ? "border-emerald-500/40 bg-emerald-500/[0.06] ring-1 ring-emerald-500/20"
                : "border-white/[0.07] hover:border-white/[0.14] bg-white/[0.02] hover:bg-white/[0.04]"}`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold text-xs tracking-widest">YES</span>
                <Sparkline prob={yesP} seed={market.id + "y"} />
              </div>
              <span className="text-white font-black text-lg tabular-nums">₹{yesP}</span>
            </div>
            <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                style={{ width: `${yesP}%` }}
              />
            </div>
          </div>

          {/* NO */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setPick(pick === "no" ? null : "no")}
            onKeyDown={(e) => e.key === "Enter" && setPick(pick === "no" ? null : "no")}
            className={`cursor-pointer rounded-xl border p-3 transition-all duration-200
              ${pick === "no"
                ? "border-red-500/40 bg-red-500/[0.06] ring-1 ring-red-500/20"
                : "border-white/[0.07] hover:border-white/[0.14] bg-white/[0.02] hover:bg-white/[0.04]"}`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-red-400 font-bold text-xs tracking-widest">NO</span>
                <Sparkline prob={noP} seed={market.id + "n"} />
              </div>
              <span className="text-white font-black text-lg tabular-nums">₹{noP}</span>
            </div>
            <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-500"
                style={{ width: `${noP}%` }}
              />
            </div>
          </div>
        </div>

        {/* Conditional Buy CTA */}
        {pick && (
          <button
            className={`w-full py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-150
              ${pick === "yes"
                ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-900"
                : "bg-red-500 hover:bg-red-400 text-white"}`}
          >
            Buy {pick === "yes" ? "YES" : "NO"} @ ₹{pick === "yes" ? yesP : noP}
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-3 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            {formatVolume(market.volume)} vol
          </span>
          <span className="w-px h-3 bg-white/[0.1]" />
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {market.status}
          </span>
        </div>

        <span className="text-[11px] text-zinc-500 flex items-center gap-1">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          {daysLeft(market.expiresAt)}
        </span>
      </div>
    </div>
  );
}

