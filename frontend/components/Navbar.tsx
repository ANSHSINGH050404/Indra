"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";

const SearchIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const BellIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
);

export default function Navbar() {
  const { isLoggedIn, setIsLoggedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [fullname, setFullname] = useState("");

  useEffect(() => {
    if (isLoggedIn) {
      setFullname(localStorage.getItem("fullname") || "User");
    }
  }, [isLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("fullname");
    setIsLoggedIn(false);
    router.push("/auth/login");
  };

  const navLinks = [
    { name: "Markets", href: "/" },
    { name: "Activity", href: "#" },
    { name: "Portfolio", href: "#" },
  ];

  // Hide navbar on login/register pages
  if (pathname.startsWith("/auth")) return null;

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#080a10]/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        
        {/* Left Side: Logo & Links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-lime-400 rounded-lg flex items-center justify-center font-black text-zinc-900 text-lg">
              I
            </div>
            <span className="font-bold text-xl tracking-tight text-white hidden sm:block">INDRA</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="hidden lg:flex flex-1 max-w-md mx-8">
          <div className="relative w-full group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-lime-400 transition-colors">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search markets..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400/50 focus:bg-white/[0.08] transition-all"
            />
          </div>
        </div>

        {/* Right Side: Auth & User */}
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              {/* Notification & Balance (Polymarket Style) */}
              <div className="hidden sm:flex items-center gap-4 pr-4 border-r border-white/10">
                 <button className="text-zinc-400 hover:text-white transition-colors">
                    <BellIcon />
                 </button>
                 <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Balance</span>
                    <span className="text-sm font-bold text-white">$0.00</span>
                 </div>
              </div>

              {/* User Menu */}
              <div className="flex items-center gap-3 pl-2">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-semibold text-white truncate max-w-[120px]">
                    {fullname}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-[11px] text-zinc-500 hover:text-red-400 transition-colors font-medium"
                  >
                    Log out
                  </button>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-lime-400 to-indigo-500 p-[1px]">
                   <div className="w-full h-full rounded-full bg-[#0d0f17] flex items-center justify-center text-white">
                      <UserIcon />
                   </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="text-sm font-bold text-white hover:text-lime-400 transition-colors px-4 py-2"
              >
                Log In
              </Link>
              <Link
                href="/auth/register"
                className="bg-lime-400 text-zinc-900 px-5 py-2 rounded-xl text-sm font-bold hover:bg-lime-300 transition-all active:scale-95 shadow-lg shadow-lime-400/20"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}
