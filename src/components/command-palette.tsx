"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Activity,
  Calendar,
  Users,
  Flame,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCommandPalette } from "@/contexts/command-palette-context";

export function CommandPalette() {
  const { isOpen, close } = useCommandPalette();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searching, setSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Mock search results
  const [searchResults, setSearchResults] = useState({
    users: [] as any[],
    clubs: [] as any[],
    events: [] as any[],
    activities: [] as any[],
    routes: [] as any[],
  });

  const recentSearches = ["Mumbai Marathon", "Delhi Run Club", "5K Challenge"];

  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery) {
      setSearching(true);
      // Simulate search delay
      const timer = setTimeout(() => {
        setSearching(false);
        setSearchResults({
          users: [
            { id: 1, name: "John Doe", username: "johndoe", location: "Mumbai" },
            { id: 2, name: "Jane Smith", username: "janesmith", location: "Delhi" },
          ],
          clubs: [
            { id: 1, name: "Mumbai Run Club", location: "Mumbai" },
            { id: 2, name: "Delhi Runners", location: "Delhi" },
          ],
          events: [
            { id: 1, title: "Mumbai Marathon 2024", location: "Mumbai", date: "2024-01-15" },
            { id: 2, title: "Delhi Half Marathon", location: "Delhi", date: "2024-02-20" },
          ],
          activities: [
            { id: 1, title: "Morning Run", distance: "5.2", type: "Running", date: "Today" },
            { id: 2, title: "Evening Jog", distance: "3.1", type: "Running", date: "Yesterday" },
          ],
          routes: [
            { id: 1, name: "Marine Drive Loop", distance: "5.5 km" },
            { id: 2, name: "India Gate Route", distance: "3.2 km" },
          ],
        });
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults({
        users: [],
        clubs: [],
        events: [],
        activities: [],
        routes: [],
      });
      setSelectedIndex(0);
    }
  }, [searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      close();
      setSearchQuery("");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const totalItems = searchQuery
        ? 4 +
          searchResults.users.length +
          searchResults.clubs.length +
          searchResults.events.length +
          searchResults.activities.length +
          searchResults.routes.length
        : 4 + recentSearches.length + 3;
      setSelectedIndex((prev) => (prev + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const totalItems = searchQuery
        ? 4 +
          searchResults.users.length +
          searchResults.clubs.length +
          searchResults.events.length +
          searchResults.activities.length +
          searchResults.routes.length
        : 4 + recentSearches.length + 3;
      setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
    } else if (e.key === "Enter") {
      // Handle Enter key to navigate to selected item
      // This would need to be implemented based on the selected index
      close();
      setSearchQuery("");
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] bg-black/45 backdrop-blur-[8px]"
            onClick={close}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[10000] flex items-start justify-center pt-[8%] px-4 pointer-events-none"
          >
            <div
              className="w-full max-w-[760px] pointer-events-auto bg-card/95 backdrop-blur-xl rounded-3xl border border-border shadow-2xl overflow-hidden"
              style={{ maxHeight: "75vh" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Input */}
              <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-card/95 px-5 py-4">
                <Search className="h-5 w-5 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search runners, communities, events, routes..."
                  className="flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
                  onKeyDown={handleKeyDown}
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      searchInputRef.current?.focus();
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground border border-border">
                  ESC
                </kbd>
              </div>

              {/* Scrollable Results */}
              <div className="overflow-y-auto" style={{ maxHeight: "calc(75vh - 73px)" }}>
                {searchQuery ? (
                  searching ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-primary" />
                      <p className="mt-4 text-sm text-muted-foreground">Searching...</p>
                    </div>
                  ) : (
                    <>
                      {/* Quick Actions */}
                      <div className="px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest bg-muted/30 border-b border-white/5">
                        Quick Actions
                      </div>
                      <div className="py-1">
                        {[
                          { icon: Activity, label: "Log Activity", desc: "Record your run or workout", href: "/activities" },
                          { icon: Calendar, label: "Browse Events", desc: "Find races and meetups", href: "/events" },
                          { icon: Users, label: "Find Clubs", desc: "Connect with runners", href: "/communities" },
                          { icon: Flame, label: "Join Challenge", desc: "Push your limits", href: "/challenges" },
                        ].map((action, idx) => (
                          <Link
                            key={action.label}
                            href={action.href}
                            onClick={() => {
                              close();
                              setSearchQuery("");
                              setSelectedIndex(0);
                            }}
                            className={cn(
                              "flex items-center gap-3.5 px-5 py-3 transition-colors cursor-pointer",
                              idx === selectedIndex ? "bg-primary/10" : "hover:bg-white/5"
                            )}
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-2 ring-white/10">
                              <action.icon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground">{action.label}</p>
                              <p className="text-[13px] text-muted-foreground">{action.desc}</p>
                            </div>
                          </Link>
                        ))}
                      </div>

                      {/* Users */}
                      {searchResults.users.length > 0 && (
                        <>
                          <div className="px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest bg-muted/30 border-b border-white/5 border-t border-white/5">
                            Runners
                          </div>
                          {searchResults.users.map((u, idx) => {
                            const globalIndex = 4 + idx;
                            return (
                              <Link
                                key={u.id}
                                href={`/profile/${u.username}`}
                                onClick={() => {
                                  close();
                                  setSearchQuery("");
                                  setSelectedIndex(0);
                                }}
                                className={cn(
                                  "flex items-center gap-3.5 px-5 py-3 transition-colors cursor-pointer",
                                  globalIndex === selectedIndex ? "bg-primary/10" : "hover:bg-white/5"
                                )}
                              >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-sm font-bold text-foreground ring-2 ring-white/10">
                                  {u.name.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                                  <p className="text-[13px] text-muted-foreground truncate">@{u.username}{u.location ? ` · ${u.location}` : ""}</p>
                                </div>
                              </Link>
                            );
                          })}
                        </>
                      )}

                      {/* Clubs */}
                      {searchResults.clubs.length > 0 && (
                        <>
                          <div className="px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest bg-muted/30 border-b border-white/5 border-t border-white/5">
                            Communities
                          </div>
                          {searchResults.clubs.map((c, idx) => {
                            const globalIndex = 4 + searchResults.users.length + idx;
                            return (
                              <Link
                                key={c.id}
                                href={`/communities/${c.id}`}
                                onClick={() => {
                                  close();
                                  setSearchQuery("");
                                  setSelectedIndex(0);
                                }}
                                className={cn(
                                  "flex items-center gap-3.5 px-5 py-3 transition-colors cursor-pointer",
                                  globalIndex === selectedIndex ? "bg-primary/10" : "hover:bg-white/5"
                                )}
                              >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 ring-2 ring-white/10">
                                  <Users className="h-5 w-5 text-blue-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                                  <p className="text-[13px] text-muted-foreground truncate">{c.location || "Global"}</p>
                                </div>
                              </Link>
                            );
                          })}
                        </>
                      )}

                      {/* Events */}
                      {searchResults.events.length > 0 && (
                        <>
                          <div className="px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest bg-muted/30 border-b border-white/5 border-t border-white/5">
                            Events
                          </div>
                          {searchResults.events.map((e, idx) => {
                            const globalIndex = 4 + searchResults.users.length + searchResults.clubs.length + idx;
                            return (
                              <Link
                                key={e.id}
                                href={`/events/${e.id}`}
                                onClick={() => {
                                  close();
                                  setSearchQuery("");
                                  setSelectedIndex(0);
                                }}
                                className={cn(
                                  "flex items-center gap-3.5 px-5 py-3 transition-colors cursor-pointer",
                                  globalIndex === selectedIndex ? "bg-primary/10" : "hover:bg-white/5"
                                )}
                              >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 ring-2 ring-white/10">
                                  <Calendar className="h-5 w-5 text-purple-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-foreground truncate">{e.title}</p>
                                  <p className="text-[13px] text-muted-foreground truncate">{e.location} · {new Date(e.date).toLocaleDateString()}</p>
                                </div>
                              </Link>
                            );
                          })}
                        </>
                      )}

                      {/* Activities */}
                      {searchResults.activities.length > 0 && (
                        <>
                          <div className="px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest bg-muted/30 border-b border-white/5 border-t border-white/5">
                            Activities
                          </div>
                          {searchResults.activities.map((a, idx) => {
                            const globalIndex = 4 + searchResults.users.length + searchResults.clubs.length + searchResults.events.length + idx;
                            return (
                              <Link
                                key={a.id}
                                href={`/activities/${a.id}`}
                                onClick={() => {
                                  close();
                                  setSearchQuery("");
                                  setSelectedIndex(0);
                                }}
                                className={cn(
                                  "flex items-center gap-3.5 px-5 py-3 transition-colors cursor-pointer",
                                  globalIndex === selectedIndex ? "bg-primary/10" : "hover:bg-white/5"
                                )}
                              >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-2 ring-white/10">
                                  <Activity className="h-5 w-5 text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-foreground truncate">{a.title || "Activity"}</p>
                                  <p className="text-[13px] text-muted-foreground truncate">{a.distance} km · {a.type}</p>
                                </div>
                              </Link>
                            );
                          })}
                        </>
                      )}

                      {/* Routes */}
                      {searchResults.routes.length > 0 && (
                        <>
                          <div className="px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest bg-muted/30 border-b border-white/5 border-t border-white/5">
                            Routes
                          </div>
                          {searchResults.routes.map((r, idx) => {
                            const globalIndex = 4 + searchResults.users.length + searchResults.clubs.length + searchResults.events.length + searchResults.activities.length + idx;
                            return (
                              <Link
                                key={r.id}
                                href={`/routes/${r.id}`}
                                onClick={() => {
                                  close();
                                  setSearchQuery("");
                                  setSelectedIndex(0);
                                }}
                                className={cn(
                                  "flex items-center gap-3.5 px-5 py-3 transition-colors cursor-pointer",
                                  globalIndex === selectedIndex ? "bg-primary/10" : "hover:bg-white/5"
                                )}
                              >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 ring-2 ring-white/10">
                                  <TrendingUp className="h-5 w-5 text-green-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                                  <p className="text-[13px] text-muted-foreground truncate">{r.distance || "Route"}</p>
                                </div>
                              </Link>
                            );
                          })}
                        </>
                      )}

                      {/* No Results */}
                      {searchResults.users.length === 0 &&
                       searchResults.clubs.length === 0 &&
                       searchResults.events.length === 0 &&
                       searchResults.activities.length === 0 &&
                       searchResults.routes.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20">
                          <Search className="h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-base font-medium mb-1 text-foreground">No results found</p>
                          <p className="text-sm text-muted-foreground">Try a different search term</p>
                        </div>
                      )}
                    </>
                  )
                ) : (
                  /* Empty State */
                  <div>
                    {/* Quick Actions */}
                    <div className="px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest bg-muted/30 border-b border-white/5">
                      Quick Actions
                    </div>
                    <div className="py-1">
                      {[
                        { icon: Activity, label: "Log Activity", desc: "Record your run or workout", href: "/activities" },
                        { icon: Calendar, label: "Browse Events", desc: "Find races and meetups", href: "/events" },
                        { icon: Users, label: "Find Clubs", desc: "Connect with runners", href: "/communities" },
                        { icon: Flame, label: "Join Challenge", desc: "Push your limits", href: "/challenges" },
                      ].map((action, idx) => (
                        <Link
                          key={action.label}
                          href={action.href}
                          onClick={() => {
                            close();
                            setSearchQuery("");
                            setSelectedIndex(0);
                          }}
                          className={cn(
                            "flex items-center gap-3.5 px-5 py-3 transition-colors cursor-pointer",
                            idx === selectedIndex ? "bg-primary/10" : "hover:bg-white/5"
                          )}
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-2 ring-white/10">
                            <action.icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">{action.label}</p>
                            <p className="text-[13px] text-muted-foreground">{action.desc}</p>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <>
                        <div className="px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest bg-muted/30 border-t border-white/5 border-b border-white/5">
                          Recent Searches
                        </div>
                        <div className="py-1">
                          {recentSearches.slice(0, 3).map((search, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSearchQuery(search)}
                              className="flex w-full items-center gap-3.5 px-5 py-3 hover:bg-white/5 transition-colors cursor-pointer"
                            >
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
                                <Search className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground truncate">{search}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Trending */}
                    <div className="px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest bg-muted/30 border-t border-white/5 border-b border-white/5">
                      Trending
                    </div>
                    <div className="py-1">
                      {[
                        { icon: Flame, label: "Mumbai Marathon", desc: "Popular event in India", query: "Mumbai Marathon" },
                        { icon: Users, label: "Delhi Run Club", desc: "Trending community", query: "Delhi Run Club" },
                        { icon: Flame, label: "5K Challenge", desc: "Weekly challenge", query: "5K Challenge" },
                      ].map((item, idx) => (
                        <button
                          key={item.label}
                          onClick={() => setSearchQuery(item.query)}
                          className="flex w-full items-center gap-3.5 px-5 py-3 hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-2 ring-white/10">
                            <item.icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">{item.label}</p>
                            <p className="text-[13px] text-muted-foreground">{item.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border bg-muted/30 px-5 py-2.5">
                <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <kbd className="rounded bg-white/5 px-1.5 py-0.5 text-[11px] border border-border">↑</kbd>
                    <kbd className="rounded bg-white/5 px-1.5 py-0.5 text-[11px] border border-border">↓</kbd>
                    <span className="ml-1">Navigate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="rounded bg-white/5 px-1.5 py-0.5 text-[11px] border border-border">↵</kbd>
                    <span className="ml-1">Open</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="rounded bg-white/5 px-1.5 py-0.5 text-[11px] border border-border">esc</kbd>
                    <span className="ml-1">Close</span>
                  </div>
                </div>
                <div className="text-[12px] text-muted-foreground">ZERO6</div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
