"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppStore } from "@/store/app-store";

export function MobileNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const user = useAppStore((s) => s.profile);

  // Bottom tabs (show top 5 most important items)
  const bottomTabs = NAV_ITEMS.slice(0, 5);

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card/80 backdrop-blur-xl px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="ZERO6" className="h-12 w-auto" />
        </div>

        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar} alt={user?.name || "User"} />
            <AvatarFallback>{user?.name?.slice(0, 2).toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          <button
            onClick={() => setIsOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-secondary cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Full Navigation Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 z-50 h-full w-[280px] border-l border-border bg-card lg:hidden"
            >
              <div className="flex h-14 items-center justify-between px-4 border-b border-border">
                <span className="text-sm font-semibold">Menu</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-secondary cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="px-3 py-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
                <ul className="flex flex-col gap-1">
                  {NAV_ITEMS.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* User section */}
              <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.avatar} alt={user?.name || "User"} />
                    <AvatarFallback>{user?.name?.slice(0, 2).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{user?.name || "User"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Level {user?.level || 1} Runner
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/80 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-around px-2 py-1.5">
          {bottomTabs.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {item.badge && (
                    <span className="absolute -right-1.5 -top-1 h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
