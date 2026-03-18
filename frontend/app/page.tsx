"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isLoggedIn, setIsLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login");
    }
  }, [isLoggedIn, router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("fullname");
    setIsLoggedIn(false);
    router.push("/auth/login");
  };

  if (!isLoggedIn) return null;

  const fullname = typeof window !== "undefined" ? localStorage.getItem("fullname") : "";

  return (
    <div className="min-h-screen bg-[#080a10] text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-extrabold mb-4">Welcome, {fullname || "User"}</h1>
      <p className="text-zinc-500 mb-8">You are successfully logged in!</p>
      
      <button
        onClick={handleLogout}
        className="px-6 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl font-semibold hover:bg-red-500/20 transition-all"
      >
        Logout
      </button>
    </div>
  );
}
