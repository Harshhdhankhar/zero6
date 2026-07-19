"use client";

import { motion } from "framer-motion";
import { Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EventDetailPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-md"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
          <Calendar className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Event Details</h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          Event details and registration will be available soon.
        </p>
        <Link
          href="/events"
          className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Link>
      </motion.div>
    </div>
  );
}
