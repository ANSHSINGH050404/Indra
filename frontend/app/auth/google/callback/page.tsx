"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const safeRedirectPath = (value: string | null) => {
  if (!value) return "/";
  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//")) return "/";
  return value;
};

export default function GoogleOAuthCallbackPage() {
  const router = useRouter();
  const { refreshUser, setIsLoggedIn } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const hashParams = useMemo(() => {
    if (typeof window === "undefined") return new URLSearchParams();
    const hash = window.location.hash || "";
    return new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  }, []);

  useEffect(() => {
    const token = hashParams.get("token");
    const redirect = safeRedirectPath(hashParams.get("redirect"));
    const err = hashParams.get("error");

    if (err) {
      const msg = decodeURIComponent(err);
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!token) {
      const msg = "Google sign-in failed (missing token).";
      setError(msg);
      toast.error(msg);
      return;
    }

    localStorage.setItem("token", token);
    setIsLoggedIn(true);

    refreshUser()
      .then(() => router.push(redirect))
      .catch(() => {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        const msg = "Failed to fetch user after Google sign-in.";
        setError(msg);
        toast.error(msg);
      });
  }, [hashParams, refreshUser, router, setIsLoggedIn]);

  return (
    <div className="min-h-screen bg-[#080a10] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0d0f17] border border-white/[0.07] rounded-3xl px-10 py-10 shadow-2xl">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-lime-400/40 to-transparent" />

        {error ? (
          <div className="text-center">
            <div className="mb-4 text-red-400 font-bold">Sign-in failed</div>
            <p className="text-sm text-zinc-500 mb-6">{error}</p>
            <button
              onClick={() => router.push("/auth/login")}
              className="w-full py-3.5 bg-lime-400 text-zinc-900 rounded-xl font-bold text-sm tracking-wide hover:bg-lime-300 transition-all"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-lime-400/10 border border-lime-400/20 flex items-center justify-center">
              <svg className="animate-spin w-6 h-6 text-lime-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
            <h2 className="text-xl font-extrabold text-white mb-2">Signing you in…</h2>
            <p className="text-zinc-500 text-sm">Completing Google authentication.</p>
          </div>
        )}
      </div>
    </div>
  );
}

