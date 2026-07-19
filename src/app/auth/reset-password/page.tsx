"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle, Sparkles } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (updateError) {
        setError(updateError.message);
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white overflow-hidden relative">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-white/[0.02] rounded-full blur-[80px]" />
      </div>

      {/* Logo */}
      <div className="fixed top-6 left-6 md:top-8 md:left-8 z-20">
        <Link href="/" className="text-lg font-bold tracking-tight">
          ZERO<span className="text-primary">6</span>
        </Link>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <div className="glass-strong p-8 sm:p-10">
            {success ? (
              <div className="text-center space-y-4">
                <CheckCircle className="mx-auto h-12 w-12 text-success" />
                <h1 className="heading-xl text-2xl">Password Updated</h1>
                <p className="text-sm text-muted">
                  You can now sign in with your new password.
                </p>
                <p className="text-xs text-muted">Redirecting to login...</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="badge inline-flex items-center gap-2 mb-4">
                    <Sparkles className="w-3 h-3" />
                    Reset Password
                  </div>
                  <h1 className="heading-xl text-2xl mb-2">Set new password</h1>
                  <p className="text-sm text-muted">
                    Enter your new password below
                  </p>
                </div>

                {error && (
                  <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="label block mb-2">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Minimum 8 characters"
                        className="input w-full h-12 pl-12 pr-12 text-sm"
                        required
                        minLength={8}
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

                  <div>
                    <label className="label block mb-2">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="Confirm your password"
                        className="input w-full h-12 pl-12 pr-12 text-sm"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full h-12 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Update Password <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <p className="mt-6 text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:opacity-80 transition-opacity"
                  >
                    <ArrowLeft className="w-3 h-3" /> Back to Sign In
                  </Link>
                </p>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
