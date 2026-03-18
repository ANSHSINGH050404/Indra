'use client';

import React, { useState, ReactNode, useEffect } from "react";
import { loginUser } from "@/services/auth";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

const EyeOpen = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeClosed = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const MailIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const LockIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);

interface FieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

function Field({ label, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold tracking-widest uppercase text-zinc-500">{label}</label>
      {children}
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">⚠ {error}</p>
      )}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { setIsLoggedIn, refreshUser } = useAuth();
  const [form, setForm]       = useState({ email: "", password: "" });
  const [errors, setErrors]   = useState<Record<string, string | undefined>>({});
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  

  const set = (k: string) => (v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))  e.email = "Enter a valid email address";
    if (!form.password)                                  e.password = "Password is required";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setLoading(true);
    try {
      const data = await loginUser(form.email, form.password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("fullname", data.fullname);
      await refreshUser();
      setIsLoggedIn(true);
      router.push("/");
      setLoading(false);
      setDone(true);
    } catch (err: any) {
      setLoading(false);
      setErrors({ form: err.response?.data?.message || "Invalid credentials" });
    }
  };

  const handleGoogleSignIn = () => {
    const baseUrl = api.defaults.baseURL || "http://localhost:8000";
    window.location.href = `${baseUrl}/auth/google?redirect=${encodeURIComponent("/")}`;
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/");
    }
  }, [router]);

  const inputClass = (field: string) =>
    `w-full bg-white/[0.04] border rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all duration-200 ` +
    (errors[field]
      ? "border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
      : "border-white/[0.07] focus:border-lime-400/50 focus:ring-2 focus:ring-lime-400/10 focus:bg-lime-400/[0.03]");

  return (
    <div className="min-h-screen bg-[#080a10] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 right-0 w-[600px] h-[500px] rounded-full bg-lime-400 opacity-[0.04] blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-indigo-500 opacity-[0.05] blur-[120px]" />
      </div>

      {/* Dot grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="relative bg-[#0d0f17] border border-white/[0.07] rounded-3xl px-10 py-10 shadow-2xl overflow-hidden">

          {/* Top highlight line */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-lime-400/40 to-transparent" />

          {done ? (
            /* ── Success ── */
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-3xl">
                🚀
              </div>
              <h2 className="text-2xl font-extrabold text-white mb-2">Welcome Back!</h2>
              <p className="text-zinc-500 text-sm">You have successfully signed in.</p>
            </div>
          ) : (
            <>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-lime-400/10 border border-lime-400/20 text-lime-400 text-[10px] font-bold tracking-[0.1em] uppercase px-3 py-1.5 rounded-full mb-5">
                <span className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-pulse" />
                Secure Access
              </div>

              {/* Headline */}
              <h1 className="text-[1.9rem] font-extrabold leading-tight tracking-tight text-white mb-1.5">
                Sign in to your<br />
                <span className="text-lime-400">account.</span>
              </h1>
              <p className="text-zinc-500 text-sm mb-8">Enter your credentials to continue.</p>

              {errors.form && (
                <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 text-center">
                   {errors.form}
                </div>
              )}

              {/* ── Fields ── */}
              {/* Google */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border border-white/[0.07] bg-white/[0.03] text-white font-bold text-sm tracking-wide hover:bg-white/[0.06] hover:border-white/[0.12] transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.02 1.53 7.4 2.82l5.1-5.1C33.4 4.1 29.1 2 24 2 14.7 2 6.9 7.4 3.2 15.2l6.1 4.7C11.1 13.4 17 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.1 24.5c0-1.7-.15-2.95-.47-4.25H24v8.05h12.62c-.25 2-1.6 5-4.6 7.05l7.1 5.5c4.25-3.92 6.98-9.7 6.98-16.4z" />
                  <path fill="#FBBC05" d="M9.3 28.95c-.45-1.35-.7-2.8-.7-4.3s.25-2.95.68-4.3l-6.1-4.7C1.8 18.35 1 21.15 1 24.65s.8 6.3 2.2 9l6.1-4.7z" />
                  <path fill="#34A853" d="M24 47c6.1 0 11.2-2 14.93-5.4l-7.1-5.5c-1.9 1.33-4.48 2.28-7.83 2.28-7 0-12.9-3.9-14.7-9.35l-6.1 4.7C6.9 40.6 14.7 47 24 47z" />
                  <path fill="none" d="M1 1h46v46H1z" />
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-zinc-600 text-xs whitespace-nowrap">or</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              <div className="flex flex-col gap-4">

                {/* Email */}
                <Field label="Email Address" error={errors.email}>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-zinc-600 pointer-events-none"><MailIcon /></span>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={e => set("email")(e.target.value)}
                      autoComplete="email"
                      className={inputClass("email")}
                    />
                  </div>
                </Field>

                {/* Password */}
                <Field label="Password" error={errors.password}>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-zinc-600 pointer-events-none"><LockIcon /></span>
                    <input
                      type={showPw ? "text" : "password"}
                      placeholder="Your password"
                      value={form.password}
                      onChange={e => set("password")(e.target.value)}
                      autoComplete="current-password"
                      className={inputClass("password") + " pr-11"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showPw ? <EyeClosed /> : <EyeOpen />}
                    </button>
                  </div>
                </Field>
              </div>

              {/* CTA */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="mt-8 w-full py-3.5 bg-lime-400 text-zinc-900 rounded-xl font-bold text-sm tracking-wide
                  hover:bg-lime-300 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(163,230,53,0.3)]
                  active:translate-y-0 transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Signing in…
                  </span>
                ) : "Sign In →"}
              </button>

              {/* Sign up */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-zinc-600 text-xs whitespace-nowrap">Don't have an account?</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>
              <p className="text-center text-sm text-zinc-500">
                <button
                  onClick={() => router.push("/auth/register")}
                  className="text-lime-400 font-medium hover:underline"
                >
                  Create an account instead
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
