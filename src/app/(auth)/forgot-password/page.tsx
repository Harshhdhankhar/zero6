"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowRight, ArrowLeft, CheckCircle, Sparkles } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        setIsLoading(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-md"
    >
      <div className="glass-strong p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src="/logo.png" alt="ZERO6" className="h-20 w-auto" />
          </div>
          <div className="badge inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-3 h-3" />
            {submitted ? "Check your email" : "Reset password"}
          </div>
          <h1 className="heading-xl text-2xl mb-2">
            {submitted ? "Email Sent" : "Forgot Password?"}
          </h1>
          <p className="text-sm text-muted">
            {submitted
              ? `We've sent a reset link to ${email}`
              : "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {submitted ? (
          <div className="text-center space-y-4">
            <CheckCircle className="mx-auto h-12 w-12 text-success" />
            <p className="text-sm text-muted">
              Didn&apos;t receive the email? Check your spam folder or{" "}
              <button
                onClick={() => setSubmitted(false)}
                className="text-primary hover:underline cursor-pointer bg-transparent border-none p-0 inline"
              >
                try again
              </button>
              .
            </p>
            <Link
              href="/login"
              className="btn-secondary inline-flex items-center justify-center gap-2 w-full h-11 text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label block mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input w-full h-12 pl-12 pr-4 text-sm"
                    required
                  />
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
                    Send Reset Link <ArrowRight className="w-4 h-4" />
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
  );
}
