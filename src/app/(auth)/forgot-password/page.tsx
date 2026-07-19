"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-md"
    >
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 sm:p-10">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5A1F]/10 border border-[#FF5A1F]/20 text-[#FF5A1F] text-xs font-medium mb-4">
            <Sparkles className="w-3 h-3" />
            Coming Soon
          </div>
          <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
          <p className="text-sm text-gray-400 mb-8">
            Password reset will be available once authentication launches.
          </p>

          <div className="rounded-xl bg-white/[0.02] border border-white/5 p-6 mb-6">
            <p className="text-sm text-gray-300 leading-relaxed">
              In the meantime, if you need help with your account, reach out to us and we&apos;ll get you sorted.
            </p>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-white/10 bg-white/5 text-sm text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Sign In
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
