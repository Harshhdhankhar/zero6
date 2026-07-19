"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Mail, ArrowRight, Sparkles, Heart, MapPin, Route } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [notified, setNotified] = useState(false);

  function handleNotify(e: React.FormEvent) {
    e.preventDefault();
    if (email) setNotified(true);
  }

  return (
    <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
      {/* Left - Hero */}
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

        <h1 className="text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          START YOUR<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5A1F] to-[#FF8C42]">JOURNEY</span>
        </h1>

        <p className="text-xl text-gray-300 mb-8 max-w-md leading-relaxed">
          India&apos;s fastest-growing running community. Track runs, join clubs, and compete with friends.
        </p>

        <div className="grid grid-cols-3 gap-8">
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
      </motion.div>

      {/* Right - Coming Soon Card */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md mx-auto"
      >
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5A1F]/10 border border-[#FF5A1F]/20 text-[#FF5A1F] text-xs font-medium mb-4">
              <Sparkles className="w-3 h-3" />
              Coming Soon
            </div>
            <h2 className="text-3xl font-bold mb-2">Create Account</h2>
            <p className="text-sm text-gray-400">
              We&apos;re putting the final touches on signup. It&apos;ll be worth the wait.
            </p>
          </div>

          <div className="rounded-xl bg-white/[0.02] border border-white/5 p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#FF5A1F]/10 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🏃</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Be the first to know</p>
                <p className="text-xs text-gray-400">Get notified when we launch</p>
              </div>
            </div>

            {notified ? (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-3"
              >
                <p className="text-sm text-green-400">You&apos;re on the list! We&apos;ll notify you at <strong>{email}</strong></p>
              </motion.div>
            ) : (
              <form onSubmit={handleNotify} className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full h-10 pl-9 pr-3 text-sm rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#FF5A1F]/50 focus:ring-1 focus:ring-[#FF5A1F]/20"
                  />
                </div>
                <button
                  type="submit"
                  className="h-10 px-4 rounded-lg bg-[#FF5A1F] text-white text-sm font-medium hover:bg-[#FF5A1F]/80 transition-colors flex items-center gap-1.5 flex-shrink-0"
                >
                  Notify Me <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>

          <div className="space-y-3">
            <Link
              href="/login"
              className="block w-full h-11 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-sm text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
            >
              Already have an account? Sign In
            </Link>
            <Link
              href="/"
              className="block w-full h-11 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-sm text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
