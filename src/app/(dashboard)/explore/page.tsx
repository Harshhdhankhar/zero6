"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Users, Calendar, TrendingUp, SlidersHorizontal } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistance } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

type TabType = "runners" | "clubs" | "events" | "routes";

const CLUB_CATEGORIES = ["all", "road", "trail", "track", "social", "competitive", "casual"] as const;
const EVENT_TYPES = ["all", "5k", "10k", "half_marathon", "marathon", "ultra", "trail_race", "fun_run", "virtual"] as const;

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
        <Skeleton className="h-8 rounded-lg" />
        <Skeleton className="h-8 rounded-lg" />
        <Skeleton className="h-8 rounded-lg" />
      </div>
      <Skeleton className="h-9 w-full rounded-lg" />
    </div>
  );
}

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<TabType>("runners");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [clubFilter, setClubFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");

  const { data: apiUsers, loading: loadingUsers } = useFetch<any[]>("/api/users");
  const { data: apiClubs, loading: loadingClubs, refetch: refetchClubs } = useFetch<any[]>("/api/clubs");
  const { data: apiEvents, loading: loadingEvents, refetch: refetchEvents } = useFetch<any[]>("/api/events");

  const users = apiUsers || [];
  const clubs = apiClubs || [];
  const events = apiEvents || [];

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.bio?.toLowerCase().includes(q) ||
        u.location?.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const filteredClubs = useMemo(() => {
    let result = clubs;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.location?.toLowerCase().includes(q)
      );
    }
    if (clubFilter !== "all") {
      result = result.filter((c) => c.category === clubFilter);
    }
    return result;
  }, [clubs, searchQuery, clubFilter]);

  const filteredEvents = useMemo(() => {
    let result = events;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
          e.location?.toLowerCase().includes(q) ||
          e.type?.toLowerCase().includes(q)
      );
    }
    if (eventFilter !== "all") {
      result = result.filter((e) => e.type === eventFilter);
    }
    return result;
  }, [events, searchQuery, eventFilter]);

  const tabs: { id: TabType; label: string; icon: React.ElementType; count: number }[] = [
    { id: "runners", label: "Runners", icon: Users, count: users.length },
    { id: "clubs", label: "Clubs", icon: Users, count: clubs.length },
    { id: "events", label: "Events", icon: Calendar, count: events.length },
    { id: "routes", label: "Routes", icon: TrendingUp, count: 6 },
  ];

  async function handleJoinClub(e: React.MouseEvent, clubId: string, isJoined: boolean) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await fetch("/api/clubs/join", {
        method: isJoined ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId }),
      });
      refetchClubs();
    } catch {
      // ignore
    }
  }

  const loading = activeTab === "runners" ? loadingUsers : activeTab === "clubs" ? loadingClubs : loadingEvents;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Explore</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Discover runners, clubs, events, and routes
        </p>
      </div>

      {/* Search + Filter */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search runners, clubs, events..."
          className="w-full rounded-xl border border-border bg-card px-10 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 transition-colors cursor-pointer",
            showFilters ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:text-foreground"
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filters</p>
                <button onClick={() => { setClubFilter("all"); setEventFilter("all"); }} className="text-xs text-primary hover:underline cursor-pointer">Reset</button>
              </div>
              {activeTab === "clubs" && (
                <div className="flex flex-wrap gap-1.5">
                  {CLUB_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setClubFilter(cat)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer",
                        clubFilter === cat
                          ? "bg-primary text-white"
                          : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                      )}
                    >
                      {cat === "all" ? "All Categories" : cat.replace("_", " ")}
                    </button>
                  ))}
                </div>
              )}
              {activeTab === "events" && (
                <div className="flex flex-wrap gap-1.5">
                  {EVENT_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setEventFilter(type)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer",
                        eventFilter === type
                          ? "bg-primary text-white"
                          : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                      )}
                    >
                      {type === "all" ? "All Events" : type.replace("_", " ")}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-secondary/50 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all cursor-pointer",
                activeTab === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="explore-tab"
                  className="absolute inset-0 rounded-lg bg-background shadow-sm"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <Badge variant="secondary" className="relative z-10 h-5 min-w-5 px-1 text-[10px]">
                  {tab.count}
                </Badge>
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : activeTab === "runners" && filteredUsers.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No runners found{searchQuery ? ` for "${searchQuery}"` : ""}</p>
          </div>
        ) : activeTab === "clubs" && filteredClubs.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No clubs found{searchQuery ? ` for "${searchQuery}"` : ""}</p>
          </div>
        ) : activeTab === "events" && filteredEvents.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No events found{searchQuery ? ` for "${searchQuery}"` : ""}</p>
          </div>
        ) : activeTab === "runners" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.map((user) => (
              <Link href={`/profile/${user.username}`} key={user.id}>
                <div className="group rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-0.5">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 shrink-0 ring-2 ring-border ring-offset-2 ring-offset-background">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{user.name}</h3>
                        <Badge variant="secondary" className="text-[10px] shrink-0">Lv {user.level}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{user.bio || "No bio yet"}</p>
                  {user.location && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {user.location}
                    </div>
                  )}
                  <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3">
                    <div className="text-center">
                      <p className="text-sm font-bold">{formatDistance(user.totalDistance)}</p>
                      <p className="text-[10px] text-muted-foreground">Total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold">{user.totalRuns}</p>
                      <p className="text-[10px] text-muted-foreground">Runs</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold">{user.currentStreak}d</p>
                      <p className="text-[10px] text-muted-foreground">Streak</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : activeTab === "clubs" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClubs.map((club) => (
              <Link href={`/clubs`} key={club.id}>
                <div className="group overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-0.5">
                  <div
                    className="h-32 bg-cover bg-center relative"
                    style={{ backgroundImage: club.coverImage ? `url(${club.coverImage})` : undefined }}
                  >
                    {!club.coverImage && (
                      <div className="absolute inset-0 bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
                        <Users className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 shrink-0 -mt-8 ring-2 ring-background">
                        <AvatarImage src={club.avatar} alt={club.name} />
                        <AvatarFallback>{club.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 pt-1">
                        <h3 className="font-semibold text-sm truncate">{club.name}</h3>
                        {club.location && <p className="text-xs text-muted-foreground truncate">{club.location}</p>}
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{club.description || "No description yet"}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {club.memberCount} members
                      </span>
                      <Badge variant="secondary" className="text-[10px]">{club.category}</Badge>
                    </div>
                    <Button
                      size="sm"
                      variant={club.isJoined ? "secondary" : "default"}
                      className="w-full mt-3 rounded-lg text-xs"
                      onClick={(e) => handleJoinClub(e, club.id, club.isJoined)}
                    >
                      {club.isJoined ? "Joined" : "Join Club"}
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : activeTab === "events" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <Link href={`/events/${event.id}`} key={event.id}>
                <div className="group overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-0.5">
                  <div
                    className="h-36 bg-cover bg-center relative"
                    style={{ backgroundImage: event.coverImage ? `url(${event.coverImage})` : undefined }}
                  >
                    {!event.coverImage && (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary flex items-center justify-center">
                        <Calendar className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-card/80 backdrop-blur text-foreground text-xs border-0">
                        {event.type?.replace("_", " ").toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm line-clamp-1">{event.title}</h3>
                    <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{event.location || "TBD"}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-bold text-primary">
                        {event.price > 0 ? `$${event.price}` : "Free"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {event.registeredCount ?? 0} registered
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Marine Drive Loop", distance: 7200, elevation: 25, city: "Mumbai", rating: 4.9 },
              { name: "Cubbon Park Trail", distance: 4500, elevation: 15, city: "Bangalore", rating: 4.7 },
              { name: "Sukhna Lake Path", distance: 5200, elevation: 8, city: "Chandigarh", rating: 4.8 },
              { name: "Necklace Road Run", distance: 8800, elevation: 30, city: "Hyderabad", rating: 4.6 },
              { name: "India Gate Loop", distance: 8500, elevation: 12, city: "Delhi", rating: 4.8 },
              { name: "Miramar Beach Run", distance: 6000, elevation: 5, city: "Goa", rating: 4.5 },
            ]
              .filter((r) => !searchQuery || r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.city.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((route, i) => (
                <div key={i} className="group rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-0.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{route.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-yellow-500">⭐ {route.rating}</div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {route.city}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-secondary/50 p-2.5 text-center">
                      <p className="text-sm font-bold">{formatDistance(route.distance)}</p>
                      <p className="text-[10px] text-muted-foreground">Distance</p>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-2.5 text-center">
                      <p className="text-sm font-bold">{route.elevation}m</p>
                      <p className="text-[10px] text-muted-foreground">Elevation</p>
                    </div>
                  </div>
                  <div className="mt-3 h-20 rounded-lg bg-gradient-to-br from-secondary to-muted flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full bg-[length:200%_200%] bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.1),transparent_50%),radial-gradient(circle_at_70%_50%,hsl(var(--primary)/0.05),transparent_50%)]" />
                  </div>
                </div>
              ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
