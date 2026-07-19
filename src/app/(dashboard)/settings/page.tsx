"use client";

import { motion } from "framer-motion";
import { Settings, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-md"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
          <Settings className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Settings</h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          Manage your account, preferences, and notifications. Coming soon.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all"
        >
          Back to Dashboard <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </div>
  );
}
