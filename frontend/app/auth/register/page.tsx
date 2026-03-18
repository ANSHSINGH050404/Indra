'use client';

import React, { useState, ReactNode, useEffect } from "react";
import { registerUser } from "@/services/auth";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

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
const UserIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
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
const CheckIcon = () => (
  <svg width="11" height="11" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

function getStrength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

const strengthMeta = [
  { label: "Weak",   color: "bg-red-500",    text: "text-red-400" },
  { label: "Fair",   color: "bg-orange-400", text: "text-orange-400" },
  { label: "Good",   color: "bg-yellow-400", text: "text-yellow-400" },
  { label: "Strong", color: "bg-lime-400",   text: "text-lime-400" },
];

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

export default function RegisterPage() {
  const router = useRouter();
  const { setIsLoggedIn, refreshUser } = useAuth();
  const [form, setForm]       = useState({ name: "", email: "", password: "" });
  const [errors, setErrors]   = useState<Record<string, string | undefined>>({});
  const [showPw, setShowPw]   = useState(false);
  const [agreed, setAgreed]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  const strength = getStrength(form.password);
  const meta     = strengthMeta[strength - 1];

  const set = (k: string) => (v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = "Enter your full name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))  e.email = "Enter a valid email address";
    if (form.password.length < 8)                          e.password = "Password must be at least 8 characters";
    if (!agreed)                                           e.terms = "You must accept the terms to continue";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setLoading(true);
    try {
      const data = await registerUser(form.name, form.email, form.password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("fullname", data.fullname);
      await refreshUser();
      setIsLoggedIn(true);
      setLoading(false);
      setDone(true);
      router.push("/");
    } catch (err: any) {
      setLoading(false);
      setErrors({ form: err.response?.data?.message || "Registration failed" });
    }
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
                🎉
              </div>
              <h2 className="text-2xl font-extrabold text-white mb-2">You're in!</h2>
              <p className="text-zinc-500 text-sm">Welcome aboard. Your account is ready to go.</p>
            </div>
          ) : (
            <>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-lime-400/10 border border-lime-400/20 text-lime-400 text-[10px] font-bold tracking-[0.1em] uppercase px-3 py-1.5 rounded-full mb-5">
                <span className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-pulse" />
                Free Forever
              </div>

              {/* Headline */}
              <h1 className="text-[1.9rem] font-extrabold leading-tight tracking-tight text-white mb-1.5">
                Create your<br />
                <span className="text-lime-400">workspace.</span>
              </h1>
              <p className="text-zinc-500 text-sm mb-8">Sign up in seconds. No credit card required.</p>

              {/* ── Fields ── */}
              <div className="flex flex-col gap-4">

                {/* Full Name */}
                <Field label="Full Name" error={errors.name}>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-zinc-600 pointer-events-none"><UserIcon /></span>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={form.name}
                      onChange={e => set("name")(e.target.value)}
                      autoComplete="name"
                      className={inputClass("name")}
                    />
                  </div>
                </Field>

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
                      placeholder="Min. 8 characters"
                      value={form.password}
                      onChange={e => set("password")(e.target.value)}
                      autoComplete="new-password"
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

                  {/* Strength meter */}
                  {form.password.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[0,1,2,3].map(i => (
                          <div
                            key={i}
                            className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${i < strength && meta ? meta.color : "bg-white/10"}`}
                          />
                        ))}
                      </div>
                      {meta && <p className={`text-[11px] font-medium ${meta.text}`}>{meta.label}</p>}
                    </div>
                  )}
                </Field>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => { setAgreed(a => !a); setErrors(e => ({...e, terms: undefined})); }}
                  className={`mt-0.5 w-[18px] h-[18px] flex-shrink-0 rounded-md border flex items-center justify-center transition-all duration-200
                    ${agreed ? "bg-lime-400 border-lime-400" : "bg-white/[0.04] border-white/10 hover:border-white/25"}`}
                >
                  {agreed && <CheckIcon />}
                </button>
                <div>
                  <p className="text-zinc-500 text-sm leading-relaxed">
                    I agree to the{" "}
                    <a href="#" className="text-lime-400 hover:underline">Terms of Service</a>
                    {" "}and{" "}
                    <a href="#" className="text-lime-400 hover:underline">Privacy Policy</a>
                  </p>
                  {errors.terms && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">⚠ {errors.terms}</p>
                  )}
                </div>
              </div>

              {/* CTA */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="mt-6 w-full py-3.5 bg-lime-400 text-zinc-900 rounded-xl font-bold text-sm tracking-wide
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
                    Creating account…
                  </span>
                ) : "Create Account →"}
              </button>

              {/* Sign in */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-zinc-600 text-xs whitespace-nowrap">Already have an account?</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>
              <p className="text-center text-sm text-zinc-500">
                <button
                  onClick={() => router.push("/auth/login")}
                  className="text-lime-400 font-medium hover:underline"
                >
                  Sign in instead
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
