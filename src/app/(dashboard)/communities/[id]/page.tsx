"use client";

import { useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Home, MessageSquare, Calendar, Route, User, Camera,
  Trophy, Activity, FileText, Info, Settings, Share2,
  LogOut, Shield, MapPin, ChevronLeft, Loader2, AlertCircle,
  RefreshCw, Verified,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useFetch } from "@/hooks/use-fetch";
import { actions } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";

import { CommunityHome } from "@/components/community/community-home";
import { CommunityFeed } from "@/components/community/community-feed";
import { CommunityEvents } from "@/components/community/community-events";
import { CommunityRoutes } from "@/components/community/community-routes";
import { CommunityMembers } from "@/components/community/community-members";
import { CommunityGallery } from "@/components/community/community-gallery";
import { CommunityLeaderboard } from "@/components/community/community-leaderboard";
import { CommunityChallenges } from "@/components/community/community-challenges";
import { CommunityChat } from "@/components/community/community-chat";
import { CommunityFiles } from "@/components/community/community-files";
import { CommunityAbout } from "@/components/community/community-about";
import { CommunityOwnerDashboard } from "@/components/community/community-owner-dashboard";
import { CommunityRuns } from "@/components/community/community-runs";
import { CommunitySettings } from "@/components/community/community-settings";

interface ClubDetail {
  id: string; name: string; description: string; avatar: string; coverImage: string;
  location: string; memberCount: number; activityCount: number; isMember: boolean;
  memberRole?: string | null;
  createdBy: string; createdByName: string; category: string; tags: string[];
  createdAt: string; members: any[];
  isVerified?: boolean; joinType?: string; rules?: string[];
  welcomeMessage?: string; chatEnabled?: boolean; galleryEnabled?: boolean;
  eventsEnabled?: boolean; runsEnabled?: boolean; routesEnabled?: boolean;
}

interface TabConfig {
  key: string; label: string; icon: any; requiresMember?: boolean;
}

const TABS: TabConfig[] = [
  { key: "home", label: "Home", icon: Home },
  { key: "feed", label: "Feed", icon: MessageSquare, requiresMember: true },
  { key: "events", label: "Events", icon: Calendar },
  { key: "runs", label: "Runs", icon: Users, requiresMember: true },
  { key: "routes", label: "Routes", icon: Route },
  { key: "members", label: "Members", icon: User },
  { key: "gallery", label: "Gallery", icon: Camera, requiresMember: true },
  { key: "leaderboard", label: "Leaderboard", icon: Trophy, requiresMember: true },
  { key: "challenges", label: "Challenges", icon: Activity, requiresMember: true },
  { key: "chat", label: "Chat", icon: MessageSquare, requiresMember: true },
  { key: "files", label: "Files", icon: FileText },
  { key: "about", label: "About", icon: Info },
  { key: "settings", label: "Settings", icon: Settings },
];

const MOBILE_TABS = TABS.slice(0, 5);

export default function CommunityDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const clubId = params.id as string;
  const { isAuthenticated, profile } = useAuth();

  const { data: apiData, loading, error, refetch } = useFetch<{ data: ClubDetail }>(`/api/clubs/${clubId}`);
  const club = apiData?.data;

  const [isJoining, setIsJoining] = useState(false);
  const [coverError, setCoverError] = useState(false);

  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl || "home");
  const [mobileTabOpen, setMobileTabOpen] = useState(false);

  const isOwner = club?.memberRole === "owner";
  const isModerator = club?.memberRole === "moderator";
  const isAdmin = isOwner || isModerator;

  const handleJoin = useCallback(async () => {
    if (!isAuthenticated) { toast.error("Sign in to join"); return; }
    setIsJoining(true);
    try {
      await actions.joinClub(clubId);
      toast.success("Joined community!");
      refetch();
    } catch (err: any) { toast.error(err.message); }
    finally { setIsJoining(false); }
  }, [clubId, isAuthenticated, refetch]);

  const handleLeave = useCallback(async () => {
    if (!confirm("Leave this community?")) return;
    setIsJoining(true);
    try {
      await actions.leaveClub(clubId);
      toast.success("Left community");
      router.push("/communities");
    } catch (err: any) { toast.error(err.message); }
    finally { setIsJoining(false); }
  }, [clubId, router]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setMobileTabOpen(false);
    router.replace(`/communities/${clubId}?tab=${tab}`, { scroll: false });
  }, [clubId, router]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "home": return <CommunityHome clubId={clubId} club={club || null} />;
      case "feed": return club?.isMember ? <CommunityFeed clubId={clubId} isAdmin={isAdmin} /> : <NotMemberView />;
      case "events": return <CommunityEvents clubId={clubId} />;
      case "runs": return club?.isMember ? <CommunityRuns clubId={clubId} isAdmin={isOwner} /> : <NotMemberView />;
      case "routes": return <CommunityRoutes clubId={clubId} isAdmin={isAdmin} />;
      case "members": return <CommunityMembers clubId={clubId} isAdmin={isAdmin} />;
      case "gallery": return club?.isMember ? <CommunityGallery clubId={clubId} /> : <NotMemberView />;
      case "leaderboard": return club?.isMember ? <CommunityLeaderboard clubId={clubId} /> : <NotMemberView />;
      case "challenges": return club?.isMember ? <CommunityChallenges clubId={clubId} isAdmin={isAdmin} /> : <NotMemberView />;
      case "chat": return club?.isMember ? <CommunityChat clubId={clubId} isAdmin={isAdmin} /> : <NotMemberView />;
      case "files": return <CommunityFiles clubId={clubId} />;
      case "about": return <CommunityAbout club={club || null} />;
      case "owner": return club?.isMember ? <CommunityOwnerDashboard clubId={clubId} /> : <NotMemberView />;
      case "settings": return isOwner ? <CommunitySettings clubId={clubId} /> : <NotMemberView />;
      default: return <CommunityHome clubId={clubId} club={club || null} />;
    }
  };

  const NotMemberView = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
      <p className="text-base font-medium text-foreground">Join this community</p>
      <p className="text-sm text-muted-foreground mt-1 mb-4">Become a member to access this section</p>
      <Button onClick={handleJoin} disabled={isJoining} className="gap-2 bg-primary hover:bg-primary/90 rounded-xl">
        {isJoining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
        Join Community
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen -m-4 sm:-m-6 lg:-m-8">
        <Skeleton className="h-48 sm:h-64 rounded-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
          <div className="flex items-end gap-4 mb-6">
            <Skeleton className="w-20 h-20 rounded-2xl" />
            <div className="space-y-2"><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-24" /></div>
          </div>
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
        </div>
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] -m-4 sm:-m-6 lg:-m-8">
        <AlertCircle className="h-12 w-12 text-red-400 mb-3" />
        <p className="text-base font-medium text-foreground">Community not found</p>
        <p className="text-sm text-muted-foreground mt-1 mb-4">This community may have been removed or doesn't exist</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={refetch} className="gap-2"><RefreshCw className="h-4 w-4" /> Retry</Button>
          <Link href="/communities"><Button className="gap-2">← Back to Communities</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen -m-4 sm:-m-6 lg:-m-8 bg-card">
      {/* Hero Section */}
      <div className="relative h-48 sm:h-64 overflow-hidden">
        {club.coverImage && !coverError ? (
          <img src={club.coverImage} alt={club.name} className="w-full h-full object-cover"
            onError={() => setCoverError(true)} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-purple-500/20 to-blue-500/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/40 to-transparent" />

        {/* Back Button */}
        <Link href="/communities" className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur text-[11px] text-foreground/80 hover:text-foreground transition-all">
          <ChevronLeft className="h-3.5 w-3.5" /> Communities
        </Link>

        {/* Hero Actions */}
        <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}
            className="h-8 w-8 p-0 rounded-xl bg-black/40 backdrop-blur text-muted-foreground hover:text-foreground">
            <Share2 className="h-4 w-4" />
          </Button>
          {isOwner && (
            <Button variant="ghost" size="sm" onClick={() => handleTabChange("owner")}
              className="h-8 w-8 p-0 rounded-xl bg-black/40 backdrop-blur text-muted-foreground hover:text-foreground">
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Profile Header */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-16 mb-4">
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-4 ring-[#0A0A0F] shadow-xl">
              {club.avatar ? (
                <img src={club.avatar} alt={club.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/40 to-purple-500/40 flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
              )}
            </div>
            {club.isVerified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center ring-2 ring-[#0A0A0F]">
                <Verified className="h-3.5 w-3.5 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{club.name}</h1>
                  {club.isVerified && <Verified className="h-5 w-5 text-cyan-400 hidden sm:block" />}
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <MapPin className="h-3.5 w-3.5" /> {club.location || "India"}
                  <span className="mx-1.5">·</span>
                  <Badge variant="secondary" className="text-[10px] capitalize">{club.category}</Badge>
                  {club.memberCount > 0 && <><span className="mx-1.5">·</span><Users className="h-3.5 w-3.5" /> {club.memberCount} members</>}
                </p>
              </div>
              {/* Join/Leave Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {club.isMember ? (
                  <>
                    {isOwner && (
                      <Button onClick={() => handleTabChange("owner")}
                        className={cn("h-9 gap-2 text-xs rounded-xl", activeTab === "owner" ? "bg-primary/20 text-primary" : "bg-secondary/50 hover:bg-white/20 text-white")}>
                        <Shield className="h-3.5 w-3.5" /> Owner Dashboard
                      </Button>
                    )}
                    <Button onClick={handleLeave} disabled={isJoining} variant="ghost"
                      className="h-9 gap-2 text-xs rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10">
                      {isJoining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                      Leave
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleJoin} disabled={isJoining}
                    className="h-9 gap-2 text-xs rounded-xl bg-primary hover:bg-primary/90 text-white">
                    {isJoining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Users className="h-3.5 w-3.5" />}
                    Join Community
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Tabs */}
        <div className="hidden sm:flex items-center gap-1 border-b border-border mb-6 overflow-x-auto">
          {TABS.filter(tab => tab.key !== "settings" || isOwner).map((tab) => {
            const Icon = tab.icon;
            const isDisabled = tab.requiresMember && !club.isMember;
            return (
              <button key={tab.key} onClick={() => !isDisabled && handleTabChange(tab.key)}
                disabled={isDisabled}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer",
                  activeTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-muted-foreground hover:border-border",
                  isDisabled && "opacity-30 cursor-not-allowed"
                )}>
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
          {isOwner && (
            <button onClick={() => handleTabChange("owner")}
              className={cn("flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer",
                activeTab === "owner" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-muted-foreground hover:border-border")}>
              <Shield className="h-4 w-4" /> Owner
            </button>
          )}
        </div>

        {/* Mobile Tab Bar */}
        <div className="sm:hidden flex gap-1 overflow-x-auto mb-4 pb-2 -mx-4 px-4">
          {MOBILE_TABS.filter(tab => tab.key !== "settings" || isOwner).map((tab) => {
            const Icon = tab.icon;
            const isDisabled = tab.requiresMember && !club.isMember;
            return (
              <button key={tab.key} onClick={() => !isDisabled && handleTabChange(tab.key)} disabled={isDisabled}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all whitespace-nowrap cursor-pointer",
                  activeTab === tab.key ? "bg-primary/20 text-primary border-primary/30" : "bg-secondary/30 text-muted-foreground border-border hover:text-muted-foreground",
                  isDisabled && "opacity-30 cursor-not-allowed")}>
                <Icon className="h-3 w-3" /> {tab.label}
              </button>
            );
          })}
          <button onClick={() => setMobileTabOpen(!mobileTabOpen)}
            className="px-3 py-1.5 rounded-lg text-[10px] font-medium border border-border text-muted-foreground hover:text-muted-foreground cursor-pointer">
            More +
          </button>
        </div>

        {/* Mobile More Tabs */}
        <AnimatePresence>
          {mobileTabOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="sm:hidden overflow-hidden">
              <div className="flex flex-wrap gap-1.5 mb-4">
                {TABS.filter(t => !MOBILE_TABS.find(mt => mt.key === t.key) && (t.key !== "settings" || isOwner)).map((tab) => {
                  const Icon = tab.icon;
                  const isDisabled = tab.requiresMember && !club.isMember;
                  return (
                    <button key={tab.key} onClick={() => !isDisabled && handleTabChange(tab.key)} disabled={isDisabled}
                      className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all cursor-pointer",
                        activeTab === tab.key ? "bg-primary/20 text-primary border-primary/30" : "bg-secondary/30 text-muted-foreground border-border",
                        isDisabled && "opacity-30 cursor-not-allowed")}>
                      <Icon className="h-3 w-3" /> {tab.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Content */}
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
          className="pb-8 sm:pb-12">
          {renderTabContent()}
        </motion.div>
      </div>
    </div>
  );
}
