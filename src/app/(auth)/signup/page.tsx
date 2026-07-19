"use client";

import { useState, useRef, Suspense } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import Turnstile from "@/components/ui/turnstile";
import { isCaptchaEnabled } from "@/lib/captcha";
import {
  Mail, Lock, Eye, EyeOff, ArrowRight,
  User, AtSign, Sparkles,
} from "lucide-react";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "";
  const { signup } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const usernameTimer = useRef<number>(0);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.email || !formData.password || !formData.username) {
      setError("Please fill in all fields.");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (formData.username.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError("Username can only contain letters, numbers, and underscores.");
      return;
    }

    if (isCaptchaEnabled() && !captchaToken) {
      setError("Please complete the CAPTCHA verification.");
      return;
    }

    if (captchaToken) {
      try {
        const res = await fetch("/api/captcha/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: captchaToken }),
        });
        if (!res.ok) {
          setError("CAPTCHA verification failed. Please try again.");
          return;
        }
      } catch {
        setError("CAPTCHA verification failed. Please try again.");
        return;
      }
    }

    setIsLoading(true);
    try {
      const data = await signup(formData.email, formData.password, formData.name, formData.username);

      if (data.user && !data.session) {
        setError("Check your email for a confirmation link!");
        setIsLoading(false);
        return;
      }

      const welcomeUrl = redirectTo ? `/auth/welcome?redirect=${encodeURIComponent(redirectTo)}` : "/auth/welcome";
      router.push(welcomeUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  }

  async function checkUsername(username: string) {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    setCheckingUsername(true);
    try {
      const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      setUsernameAvailable(data.available);
    } catch {
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  }

  function handleUsernameChange(value: string) {
    const clean = value.replace(/[^a-zA-Z0-9_]/g, "");
    setFormData((prev) => ({ ...prev, username: clean }));
    if (usernameTimer.current) window.clearTimeout(usernameTimer.current);
    if (clean.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    usernameTimer.current = window.setTimeout(() => checkUsername(clean), 400);
  }

  async function handleGoogleSignup() {
    setIsLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const callbackUrl = `${window.location.origin}/auth/callback${redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ""}`;
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl },
      });
    } catch {
      setError("Google signup failed.");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-white overflow-hidden">
      {/* Hero Background */}
      <div className="absolute inset-0">
        <div
          className="hero-bg"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=2000&q=80')" }}
        />
        <div className="auth-overlay" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">

          {/* Left Side - Hero Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:block"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
              className="mb-8"
            >
              <img src="/logo.png" alt="ZERO6" className="w-48 h-auto" />
            </motion.div>

            <h1 className="display-heading text-5xl lg:text-6xl mb-6">
              Start Your
              <br />
              <span className="text-gradient">Journey.</span>
            </h1>

            <p className="text-base text-muted-foreground mb-8 max-w-md leading-relaxed">
              Join India&apos;s fastest-growing running community. Track runs, join clubs, and compete with friends.
            </p>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              {["Track Progress", "Join Challenges", "Build Community"].map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {item}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Side - Signup Card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md mx-auto"
          >
            <div className="glass-strong p-8 sm:p-10">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="badge inline-flex items-center gap-2 mb-4">
                  <Sparkles className="w-3 h-3" />
                  Join the Movement
                </div>
                <h2 className="heading-xl text-3xl mb-2">Create Account</h2>
                <p className="text-muted text-sm">
                  Already a runner?{" "}
                  <Link href="/login" className="text-primary hover:opacity-80 transition-opacity font-medium">
                    Sign in
                  </Link>
                </p>
              </div>

              {/* Google */}
              <button
                onClick={handleGoogleSignup}
                disabled={isLoading}
                className="w-full h-12 flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 text-white/70 text-sm font-medium hover:bg-white/10 hover:border-white/20 hover:text-white transition-all mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign up with Google
              </button>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 text-xs text-muted uppercase tracking-widest bg-[#0A0A0F]">or with email</span>
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive mb-4"
                >
                  {error}
                </motion.p>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label block mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Alex Rivera"
                      required
                      className="input w-full h-12 pl-12 pr-4 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="label block mb-2">Username</label>
                  <div className="relative">
                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="alexrivera"
                      required
                      minLength={3}
                      className="input w-full h-12 pl-12 pr-10 text-sm"
                    />
                    {formData.username.length >= 3 && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2">
                        {checkingUsername ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
                        ) : usernameAvailable === true ? (
                          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        ) : usernameAvailable === false ? (
                          <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        ) : null}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="label block mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@example.com"
                      required
                      className="input w-full h-12 pl-12 pr-4 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="label block mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Minimum 8 characters"
                      required
                      minLength={8}
                      className="input w-full h-12 pl-12 pr-12 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Turnstile
                  onVerify={setCaptchaToken}
                  onExpire={() => setCaptchaToken("")}
                />

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full h-12 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-muted">
                By creating an account you agree to ZERO6&apos;s Terms and Privacy Policy.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-5 h-5 border border-primary border-t-transparent rounded-full" /></div>}>
      <SignupContent />
    </Suspense>
  );
}
