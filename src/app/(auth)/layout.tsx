import React from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-white/[0.02] rounded-full blur-[80px]" />
      </div>

      {/* Logo */}
      <div className="fixed top-6 left-6 md:top-8 md:left-8 z-20">
        <Link href="/">
          <img src="/logo.png" alt="ZERO6" className="h-16 w-auto" />
        </Link>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-24">
        {children}
      </div>
    </div>
  );
}
