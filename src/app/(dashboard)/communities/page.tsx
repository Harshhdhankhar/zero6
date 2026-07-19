"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, MapPin, Search, Filter, X, ChevronDown, Star,
  Shield, ArrowRight, Loader2, AlertCircle, RefreshCw,
  Sun, Moon, Activity,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useFetch } from "@/hooks/use-fetch";
import { actions } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ClubCreateDialog } from "@/components/shared/club-create-dialog";

interface CommunityClub {
  id: string; name: string; description: string; avatar: string; coverImage: string;
  location: string; city: string; latitude: number | null; longitude: number | null;
  memberCount: number; activityCount: number; isJoined: boolean;
  createdBy: string; category: string; tags: string[]; createdAt: string;
  activeMembersToday: number; nextRun: string; rating: number;
  runningType: string; isWomenOnly: boolean; isBeginnerFriendly: boolean;
  morningRuns: boolean; eveningRuns: boolean; isVerified: boolean;
}

const RUNNING_TYPES = ["road", "trail", "marathon", "casual"] as const;
const SORT_OPTIONS = ["popular", "newest", "nearby"] as const;

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function CommunitiesPageContent() {
  const { isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: apiData, loading, error, refetch } = useFetch<{ data: CommunityClub[]; meta: { total: number } }>("/api/clubs");
  const clubs = apiData?.data || [];

  const [createOpen, setCreateOpen] = useState(false);
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {} // silently ignore
      );
    }
  }, []);

  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setCreateOpen(true);
      router.replace("/communities", { scroll: false });
    }
  }, [searchParams, router]);

  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [distanceFilter, setDistanceFilter] = useState<number | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [showWomenOnly, setShowWomenOnly] = useState(false);
  const [showBeginner, setShowBeginner] = useState(false);
  const [showVerified, setShowVerified] = useState(false);
  const [morningOnly, setMorningOnly] = useState(false);
  const [eveningOnly, setEveningOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"popular" | "newest" | "nearby">("popular");
  const [showFilters, setShowFilters] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 12;

  const cities = useMemo(() => {
    const set = new Set(clubs.filter(c => c.city).map(c => c.city));
    return Array.from(set).sort();
  }, [clubs]);

  const filtered = useMemo(() => {
    let result = [...clubs];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }
    if (cityFilter) result = result.filter(c => c.city === cityFilter);
    if (selectedTypes.size > 0) result = result.filter(c => selectedTypes.has(c.runningType || c.category));
    if (showWomenOnly) result = result.filter(c => c.isWomenOnly);
    if (showBeginner) result = result.filter(c => c.isBeginnerFriendly);
    if (showVerified) result = result.filter(c => c.isVerified);
    if (morningOnly) result = result.filter(c => c.morningRuns);
    if (eveningOnly) result = result.filter(c => c.eveningRuns);

    if (sortBy === "popular") result.sort((a, b) => b.memberCount - a.memberCount);
    else if (sortBy === "newest") result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else if (sortBy === "nearby" && userPosition) {
      result.sort((a, b) => {
        const distA = haversine(userPosition.lat, userPosition.lng, a.latitude || 0, a.longitude || 0);
        const distB = haversine(userPosition.lat, userPosition.lng, b.latitude || 0, b.longitude || 0);
        return distA - distB;
      });
    }

    return result;
  }, [clubs, search, cityFilter, selectedTypes, showWomenOnly, showBeginner, showVerified, morningOnly, eveningOnly, sortBy, userPosition]);

  const paginated = filtered.slice(0, page * perPage);
  const hasMore = paginated.length < filtered.length;

  const toggleType = (t: string) => {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  };

  const handleJoin = useCallback(async (clubId: string) => {
    if (!isAuthenticated) { toast.error("Sign in to join clubs"); return; }
    setJoiningId(clubId);
    try {
      await actions.joinClub(clubId);
      toast.success("Joined community!");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to join");
    } finally {
      setJoiningId(null);
    }
  }, [isAuthenticated, refetch]);

  const handleLeave = useCallback(async (clubId: string) => {
    setJoiningId(clubId);
    try {
      await actions.leaveClub(clubId);
      toast.success("Left community");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to leave");
    } finally {
      setJoiningId(null);
    }
  }, [refetch]);

  return (
    <div className="min-h-screen -m-4 sm:-m-6 lg:-m-8">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-b from-card via-background to-background px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pt-12 lg:pt-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-3 mb-3">
              <Users className="h-6 w-6 text-primary" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Running Communities</h1>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
              Find your tribe. Join local running communities, participate in events, track challenges, and connect with fellow runners.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search communities by name or description..."
                className="w-full h-11 sm:h-12 pl-10 pr-4 rounded-xl border border-border bg-secondary/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all" />
            </div>
            <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}
              className={cn("h-11 sm:h-12 gap-2 rounded-xl px-4", showFilters && "bg-primary/10 text-primary border-primary/30")}>
              <Filter className="h-4 w-4" /> Filters
              {(selectedTypes.size > 0 || showWomenOnly || showBeginner || showVerified || morningOnly || eveningOnly || cityFilter) && (
                <span className="w-2 h-2 rounded-full bg-primary" />
              )}
            </Button>
          </motion.div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }} className="overflow-hidden">
                <div className="mt-4 p-4 sm:p-5 rounded-2xl border border-border bg-white/[0.03] backdrop-blur">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 block">City</label>
                      <select value={cityFilter} onChange={e => { setCityFilter(e.target.value); setPage(1); }}
                        className="w-full h-9 rounded-lg border border-border bg-secondary/30 text-xs text-white px-2 focus:outline-none focus:border-primary/50">
                        <option value="">All Cities</option>
                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Running Type</label>
                      <div className="flex flex-wrap gap-1.5">
                        {RUNNING_TYPES.map(t => (
                          <button key={t} onClick={() => toggleType(t)}
                            className={cn("px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all cursor-pointer",
                              selectedTypes.has(t) ? "bg-primary/20 text-primary border-primary/30" : "bg-secondary/30 text-muted-foreground border-border hover:text-muted-foreground")}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Time</label>
                      <div className="flex gap-1.5">
                        <button onClick={() => { setMorningOnly(!morningOnly); setPage(1); }}
                          className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all cursor-pointer",
                            morningOnly ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-secondary/30 text-muted-foreground border-border")}>
                          <Sun className="h-3 w-3" /> Morning
                        </button>
                        <button onClick={() => { setEveningOnly(!eveningOnly); setPage(1); }}
                          className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all cursor-pointer",
                            eveningOnly ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" : "bg-secondary/30 text-muted-foreground border-border")}>
                          <Moon className="h-3 w-3" /> Evening
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Type</label>
                      <div className="flex flex-wrap gap-1.5">
                        {[{ key: "showWomenOnly", label: "Women Only", icon: Shield }, { key: "showBeginner", label: "Beginner", icon: Activity }].map(({ key, label, icon: Icon }) => (
                          <button key={key} onClick={() => { key === "showWomenOnly" ? (setShowWomenOnly(!showWomenOnly), setPage(1)) : (setShowBeginner(!showBeginner), setPage(1)); }}
                            className={cn("flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all cursor-pointer",
                              (key === "showWomenOnly" ? showWomenOnly : showBeginner) ? "bg-primary/20 text-primary border-primary/30" : "bg-secondary/30 text-muted-foreground border-border")}>
                            <Icon className="h-3 w-3" /> {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Sort By</label>
                      <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                        className="w-full h-9 rounded-lg border border-border bg-secondary/30 text-xs text-white px-2 focus:outline-none focus:border-primary/50">
                        <option value="popular">Most Popular</option>
                        <option value="newest">Newest</option>
                        <option value="nearby">Nearest</option>
                      </select>
                    </div>
                  </div>
                  {(selectedTypes.size > 0 || showWomenOnly || showBeginner || showVerified || morningOnly || eveningOnly || cityFilter) && (
                    <button onClick={() => { setSelectedTypes(new Set()); setShowWomenOnly(false); setShowBeginner(false); setShowVerified(false); setMorningOnly(false); setEveningOnly(false); setCityFilter(""); setPage(1); }}
                      className="mt-3 text-[11px] text-primary hover:text-primary/80 transition-colors flex items-center gap-1 cursor-pointer">
                      <X className="h-3 w-3" /> Clear all filters
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-white/[0.03] overflow-hidden">
                <Skeleton className="h-36 sm:h-44 rounded-none" />
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <div className="space-y-1.5 flex-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-16" /></div>
                  </div>
                  <div className="flex gap-2"><Skeleton className="h-6 w-16 rounded-lg" /><Skeleton className="h-6 w-20 rounded-lg" /></div>
                  <Skeleton className="h-9 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
            <p className="text-sm font-medium text-foreground">Failed to load communities</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Check your connection and try again</p>
            <Button variant="secondary" size="sm" onClick={refetch} className="gap-2"><RefreshCw className="h-4 w-4" /> Retry</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-base font-medium text-foreground">No communities found</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Try adjusting your filters or create a new community</p>
            <Link href="/communities?create=true">
              <Button className="gap-2 rounded-xl bg-primary hover:bg-primary/90"><Users className="h-4 w-4" /> Create Community</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-muted-foreground"><span className="text-white font-medium">{filtered.length}</span> communities found</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <AnimatePresence mode="popLayout">
                {paginated.map((club, index) => (
                  <CommunityCard key={club.id} club={club} index={index}
                    isJoining={joiningId === club.id}
                    onJoin={() => handleJoin(club.id)}
                    onLeave={() => handleLeave(club.id)}
                    isAuthenticated={isAuthenticated} />
                ))}
              </AnimatePresence>
            </div>
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button variant="ghost" onClick={() => setPage(p => p + 1)} className="gap-2 rounded-xl text-muted-foreground">
                  Show More <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <ClubCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

export default function CommunitiesPage() {
  return (
    <Suspense fallback={null}>
      <CommunitiesPageContent />
    </Suspense>
  );
}

function CommunityCard({ club, index, isJoining, onJoin, onLeave, isAuthenticated }: {
  club: CommunityClub; index: number; isJoining: boolean;
  onJoin: () => void; onLeave: () => void; isAuthenticated: boolean;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group relative rounded-2xl border border-border bg-gradient-to-b from-white/[0.04] to-white/[0.01] overflow-hidden hover:border-border transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
      {/* Cover Image */}
      <Link href={`/communities/${club.id}`} className="block relative h-36 sm:h-44 overflow-hidden">
        {club.coverImage && !imgError ? (
          <img src={club.coverImage} alt={club.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-[#FF5A1F]/5 to-purple-500/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-transparent to-transparent" />
        {/* Verified Badge */}
        {club.isVerified && (
          <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-cyan-500/90 text-[10px] font-semibold text-white flex items-center gap-1 backdrop-blur">
            <Shield className="h-3 w-3" /> Verified
          </div>
        )}
        {/* Rating */}
        {club.rating > 0 && (
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/60 text-[10px] font-medium text-white flex items-center gap-1 backdrop-blur">
            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" /> {club.rating.toFixed(1)}
          </div>
        )}
      </Link>

      <div className="p-4">
        {/* Avatar + Name */}
        <div className="flex items-start gap-3 mb-3">
          <Link href={`/communities/${club.id}`}>
            {club.avatar ? (
              <img src={club.avatar} alt={club.name} className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/10" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/communities/${club.id}`}>
              <h3 className="text-sm font-semibold text-white truncate group-hover:text-primary transition-colors">{club.name}</h3>
            </Link>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" /> {club.city || club.location || "India"}
            </p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-lg capitalize">{club.runningType || club.category}</Badge>
          {club.activeMembersToday > 0 && (
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-lg text-emerald-400 border-emerald-500/30">
              <Activity className="h-3 w-3 mr-1" /> {club.activeMembersToday} today
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-1.5 rounded-lg bg-secondary/30">
            <p className="text-xs font-bold text-foreground">{club.memberCount}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Members</p>
          </div>
          <div className="text-center p-1.5 rounded-lg bg-secondary/30">
            <p className="text-xs font-bold text-foreground">{club.activityCount}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Activities</p>
          </div>
          <div className="text-center p-1.5 rounded-lg bg-secondary/30">
            <p className="text-xs font-bold text-foreground">{club.nextRun ? new Date(club.nextRun).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "TBD"}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Next Run</p>
          </div>
        </div>

        {/* Action Button */}
        {club.isJoined ? (
          <div className="flex gap-2">
            <Link href={`/communities/${club.id}`} className="flex-1">
              <Button className="w-full h-9 text-xs rounded-xl bg-secondary/50 hover:bg-white/20 text-white gap-2">
                <ArrowRight className="h-3.5 w-3.5" /> Dashboard
              </Button>
            </Link>
            <Button onClick={onLeave} disabled={isJoining}
              className="h-9 px-3 text-xs rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10">
              {isJoining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Leave"}
            </Button>
          </div>
        ) : (
          <Button onClick={onJoin} disabled={isJoining}
            className="w-full h-9 text-xs rounded-xl bg-primary hover:bg-primary/90 text-white gap-2">
            {isJoining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Users className="h-3.5 w-3.5" />}
            {isJoining ? "Joining..." : "Join Community"}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
