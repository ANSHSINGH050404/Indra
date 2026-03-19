"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

interface UserProfile {
  id: number;
  fullname: string;
  points: number;
  isVerified: boolean;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  stats: {
    tradesCount: number;
    totalVolume: number;
  };
  activePositions: any[];
}

export default function ProfilePage() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    fullname: "",
    bio: "",
    avatarUrl: ""
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/api/user/profile/${id}`);
        setProfile(res.data);
        setEditData({
          fullname: res.data.fullname,
          bio: res.data.bio || "",
          avatarUrl: res.data.avatarUrl || ""
        });
      } catch (err) {
        console.error("Profile fetch failed", err);
        toast.error("User not found");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProfile();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch("/api/user/profile", editData);
      toast.success("Profile updated!");
      setIsEditing(false);
      // Refresh
      const res = await api.get(`/api/user/profile/${id}`);
      setProfile(res.data);
    } catch (err) {
      toast.error("Update failed");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#080a10] flex items-center justify-center text-zinc-500 uppercase tracking-widest font-black">
      Loading Profile...
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-[#080a10] flex items-center justify-center text-zinc-500 uppercase tracking-widest font-black">
      User Not Found
    </div>
  );

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="min-h-screen bg-[#080a10] text-white">
      <Navbar />
      <div className="max-w-5xl mx-auto p-6 md:p-12 pt-24">
        
        <div className="bg-[#111318] rounded-[40px] border border-white/5 overflow-hidden mb-12">
            <div className="h-32 bg-gradient-to-r from-lime-400/20 to-emerald-500/20"></div>
            <div className="px-8 pb-12 -mt-12">
                <div className="flex flex-col md:flex-row gap-8 items-end justify-between">
                    <div className="flex gap-6 items-end">
                        <div className="w-32 h-32 rounded-3xl bg-[#1c1f26] border-4 border-[#111318] overflow-hidden flex items-center justify-center shadow-2xl">
                            {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt={profile.fullname} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl font-black text-lime-400">{profile.fullname[0]}</span>
                            )}
                        </div>
                        <div className="mb-2">
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-3xl font-black">{profile.fullname}</h1>
                                {profile.isVerified && (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#84cc16">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                    </svg>
                                )}
                            </div>
                            <p className="text-zinc-500 text-sm">Joined {new Date(profile.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                    {isOwnProfile && !isEditing && (
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="bg-white/5 hover:bg-white/10 text-white font-bold px-6 py-2.5 rounded-xl border border-white/10 transition-all text-xs uppercase tracking-widest"
                        >
                            Edit Profile
                        </button>
                    )}
                </div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="md:col-span-2">
                        {isEditing ? (
                            <form onSubmit={handleUpdate} className="space-y-6 bg-black/20 p-8 rounded-3xl border border-white/5">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2">Display Name</label>
                                    <input 
                                        type="text" 
                                        value={editData.fullname}
                                        onChange={(e) => setEditData({...editData, fullname: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-lime-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2">Bio</label>
                                    <textarea 
                                        value={editData.bio}
                                        onChange={(e) => setEditData({...editData, bio: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-lime-400 h-24"
                                        placeholder="Tell us about your trading strategy..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2">Avatar URL</label>
                                    <input 
                                        type="text" 
                                        value={editData.avatarUrl}
                                        onChange={(e) => setEditData({...editData, avatarUrl: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-lime-400"
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button 
                                        type="submit"
                                        className="bg-lime-400 text-zinc-900 font-black px-8 py-3 rounded-xl hover:bg-lime-300 transition-all text-xs uppercase"
                                    >
                                        Save Changes
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="bg-white/5 text-white font-bold px-8 py-3 rounded-xl hover:bg-white/10 transition-all text-xs uppercase"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-3">About</h3>
                                    <p className="text-zinc-300 leading-relaxed text-lg">
                                        {profile.bio || "This user hasn't added a bio yet."}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-5">Active Stakes</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {profile.activePositions.length === 0 ? (
                                            <p className="text-zinc-600 italic text-sm py-4">No active positions.</p>
                                        ) : (
                                            profile.activePositions.map((pos) => (
                                                <div key={pos.id} className="bg-white/5 border border-white/5 rounded-2xl p-4">
                                                    <p className="text-[10px] font-bold text-zinc-500 uppercase truncate mb-1">{pos.outcome.market.title}</p>
                                                    <div className="flex justify-between items-end">
                                                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${pos.outcome.title === "YES" ? "bg-emerald-400/10 text-emerald-400" : "bg-rose-400/10 text-rose-400"}`}>
                                                            {pos.outcome.title}
                                                        </span>
                                                        <span className="font-mono font-bold text-white">{pos.shares} SHARES</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white/5 border border-white/5 rounded-3xl p-6">
                            <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-6">Trading Stats</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-400 text-sm">Portfolio Worth</span>
                                    <span className="font-bold text-white">₹{profile.points.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-400 text-sm">Total Trades</span>
                                    <span className="font-bold text-white">{profile.stats.tradesCount}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-400 text-sm">Total Volume</span>
                                    <span className="font-bold text-lime-400">₹{profile.stats.totalVolume.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-lime-400/5 border border-lime-400/10 rounded-3xl p-6">
                             <p className="text-[10px] font-black uppercase text-lime-400 tracking-widest mb-2">Performance Rank</p>
                             <p className="text-3xl font-black text-white">Top 10%</p>
                             <p className="text-[10px] text-lime-400/60 font-bold mt-1 uppercase">based on overall ROI</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}
