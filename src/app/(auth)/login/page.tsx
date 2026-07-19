"use client";

import { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail, Lock, Eye, EyeOff, ArrowRight,
  Heart, MapPin, Route, Sparkles,
} from "lucide-react";

function LoginContent() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result) {
        router.push(redirectTo);
      } else {
        setError("Invalid email or password.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`;
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl },
      });
    } catch {
      setError("Google login failed.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white overflow-hidden">
      {/* Hero Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/70 to-black/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-transparent to-[#0A0A0F]" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Hero Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
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

            <h1 className="display-heading text-6xl lg:text-7xl mb-6">
              RUN<br />
              <span className="text-gradient">TOGETHER</span>
            </h1>

            <p className="text-xl text-gray-300 mb-8 max-w-md leading-relaxed">
              Join the movement. Track every mile, crush every challenge, and become part of something bigger.
            </p>

            <div className="grid grid-cols-3 gap-8 mb-12">
              {[
                { value: "50K+", label: "Runners", icon: Heart },
                { value: "300+", label: "Clubs", icon: Route },
                { value: "120+", label: "Events", icon: MapPin },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.6 }}
                >
                  <stat.icon className="w-5 h-5 text-[#FF5A1F] mb-2" />
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-400">
              {["Track Progress", "Join Challenges", "Build Community"].map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-[#FF5A1F]" />
                  {item}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Side - Login Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md mx-auto"
          >
            <div className="glass-strong p-8 sm:p-10">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="badge inline-flex items-center gap-2 mb-4">
                  <Sparkles className="w-3 h-3" />
                  Welcome Back
                </div>
                <h2 className="heading-xl text-3xl mb-2">Sign In</h2>
                <p className="text-muted text-sm">
                  Don't have an account?{" "}
                  <Link href="/signup" className="text-primary hover:opacity-80 transition-opacity font-medium">
                    Join ZERO6
                  </Link>
                </p>
              </div>

              {/* Google Login */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-12 flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 text-white/70 text-sm font-medium hover:bg-white/10 hover:border-white/20 hover:text-white transition-all mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 text-xs text-muted uppercase tracking-widest bg-[#0A0A0F]">or</span>
                </div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="label block mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="input w-full h-12 pl-12 pr-4 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="label">Password</label>
                    <Link href="/forgot-password" className="text-xs text-primary hover:opacity-80 transition-opacity">
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
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

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-sm text-red-400"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full h-12 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="flex justify-between mt-6">
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted hover:text-white transition-colors"
                >
                  Forgot password?
                </Link>
                <Link
                  href="/signup"
                  className="text-xs text-primary hover:opacity-80 transition-opacity lg:hidden"
                >
                  Create account
                </Link>
              </div>

              <p className="mt-8 text-center text-xs text-muted">
                By continuing, you agree to ZERO6's Terms and Privacy Policy.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center"><div className="animate-spin w-5 h-5 border border-primary border-t-transparent rounded-full" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
