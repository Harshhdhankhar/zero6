"use client";

import React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Users, Calendar, Camera, Activity, TreePine, Star, Shield, Flame, Droplet, Car, Zap, Heart, Share2, Navigation, Save } from "lucide-react";

export type SheetContentType = "community" | "spot" | "route" | "event" | "live-run" | "photo" | null;

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  contentType: SheetContentType;
  content: any;
}

export function FloatingBottomSheet({ open, onClose, contentType, content }: BottomSheetProps) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [contentType, content]);

  if (!open || !contentType || !content) return null;

  const getIcon = () => {
    switch (contentType) {
      case "community":
        return Users;
      case "spot":
        return TreePine;
      case "route":
        return MapPin;
      case "event":
        return Calendar;
      case "live-run":
        return Activity;
      case "photo":
        return Camera;
      default:
        return MapPin;
    }
  };

  const Icon = getIcon();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: expanded ? "10%" : "20%" }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50"
          >
            <div className="bg-card border-t border-border rounded-t-3xl shadow-2xl overflow-hidden">
              {/* Handle */}
              <div className="flex justify-center py-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="w-12 h-1.5 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="px-5 pb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">{content.title || content.name || "Details"}</h3>
                    <p className="text-xs text-white/40 mt-0.5">
                      {content.city || content.location || "Near you"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4 text-white/60" />
                </button>
              </div>

              {/* Content */}
              <div className="px-5 pb-6">
                {contentType === "community" && <CommunityContent content={content} />}
                {contentType === "spot" && <SpotContent content={content} />}
                {contentType === "route" && <RouteContent content={content} />}
                {contentType === "event" && <EventContent content={content} />}
                {contentType === "live-run" && <LiveRunContent content={content} />}
                {contentType === "photo" && <PhotoContent content={content} />}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CommunityContent({ content }: { content: any }) {
  return (
    <div className="space-y-4">
      {/* Cover Image */}
      <div className="aspect-video rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center relative overflow-hidden">
        {content.avatar ? (
          <img src={content.avatar} alt={content.name} className="w-full h-full object-cover" />
        ) : (
          <Users className="h-12 w-12 text-white/30" />
        )}
      </div>

      {/* Basic Info */}
      <div>
        <h3 className="text-xl font-bold text-white">{content.name}</h3>
        <p className="text-sm text-white/60 flex items-center gap-1 mt-1">
          <MapPin className="h-3 w-3" /> {content.city || content.location || "India"}
        </p>
        {content.description && (
          <p className="text-sm text-white/70 mt-2 line-clamp-2">{content.description}</p>
        )}
        {content.distance && (
          <p className="text-xs text-white/50 mt-1 flex items-center gap-1">
            <Navigation className="h-3 w-3" /> {content.distance.toFixed(1)} km away
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-white">{content.member_count || content.memberCount || 0}</p>
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Members</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-white">{content.activity_count || content.activityCount || 0}</p>
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Activities</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-yellow-400">
            <Star className="h-3 w-3 fill-current" />
            <span className="text-lg font-bold text-white">{content.rating || "4.5"}</span>
          </div>
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Rating</p>
        </div>
      </div>

      {/* Smart Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors cursor-pointer">
          <Users className="h-4 w-4" /> Join Community
        </button>
        <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-border text-white hover:bg-white/10 transition-colors cursor-pointer">
          <Share2 className="h-4 w-4" /> Share
        </button>
      </div>
    </div>
  );
}

function SpotContent({ content }: { content: any }) {
  return (
    <div className="space-y-4">
      {/* Cover Image */}
      <div className="aspect-video rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center relative overflow-hidden">
        {content.coverPhotoUrl ? (
          <img src={content.coverPhotoUrl} alt={content.name} className="w-full h-full object-cover" />
        ) : (
          <TreePine className="h-12 w-12 text-white/30" />
        )}
        {content.isFeatured && (
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-yellow-500/90 text-white text-xs font-semibold flex items-center gap-1">
            <Star className="h-3 w-3" /> Featured
          </div>
        )}
        {content.isVerified && (
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-cyan-500/90 text-white text-xs font-semibold flex items-center gap-1">
            <Shield className="h-3 w-3" /> Verified
          </div>
        )}
      </div>

      {/* Basic Info */}
      <div>
        <h3 className="text-xl font-bold text-white">{content.name}</h3>
        <p className="text-sm text-white/60 flex items-center gap-1 mt-1">
          <MapPin className="h-3 w-3" /> {content.city || "India"}
        </p>
        {content.description && (
          <p className="text-sm text-white/70 mt-2 line-clamp-2">{content.description}</p>
        )}
        {content.distance && (
          <p className="text-xs text-white/50 mt-1 flex items-center gap-1">
            <Navigation className="h-3 w-3" /> {content.distance.toFixed(1)} km away
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white/5 rounded-xl p-2 text-center">
          <div className="flex items-center justify-center gap-1 text-yellow-400">
            <Star className="h-3 w-3 fill-current" />
            <span className="text-sm font-bold text-white">{content.averageRating || "4.5"}</span>
          </div>
          <p className="text-[8px] text-white/40 uppercase tracking-wider">Rating</p>
        </div>
        <div className="bg-white/5 rounded-xl p-2 text-center">
          <div className="flex items-center justify-center gap-1 text-cyan-400">
            <Shield className="h-3 w-3" />
            <span className="text-sm font-bold text-white">{content.safety_rating || "4.2"}</span>
          </div>
          <p className="text-[8px] text-white/40 uppercase tracking-wider">Safety</p>
        </div>
        <div className="bg-white/5 rounded-xl p-2 text-center">
          <div className="flex items-center justify-center gap-1 text-orange-400">
            <Flame className="h-3 w-3" />
            <span className="text-sm font-bold text-white">{content.popularityScore || "High"}</span>
          </div>
          <p className="text-[8px] text-white/40 uppercase tracking-wider">Popular</p>
        </div>
        <div className="bg-white/5 rounded-xl p-2 text-center">
          <div className="flex items-center justify-center gap-1 text-emerald-400">
            <Users className="h-3 w-3" />
            <span className="text-sm font-bold text-white">{content.average_daily_runners || "50+"}</span>
          </div>
          <p className="text-[8px] text-white/40 uppercase tracking-wider">Daily</p>
        </div>
      </div>

      {/* Live Activity */}
      {(content.live_runners > 0 || content.today_visits > 0) && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-semibold text-emerald-400">Live Activity</span>
            </div>
            <span className="text-xs text-white/60">{content.live_runners || 0} running now</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-white/60">Today's visits: {content.today_visits || 0}</span>
            <span className="text-xs text-white/60">Peak: {content.best_time_to_run || "Morning"}</span>
          </div>
        </div>
      )}

      {/* Running Information */}
      <div className="bg-white/5 rounded-xl p-4">
        <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Running Info</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">Surface:</span>
            <span className="text-xs text-white font-medium">{content.surface_type || "Road"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">Difficulty:</span>
            <span className="text-xs text-white font-medium">{content.difficulty || "Intermediate"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">Terrain:</span>
            <span className="text-xs text-white font-medium">{content.terrain || "Flat"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">Loop:</span>
            <span className="text-xs text-white font-medium">{content.loop_distance ? `${content.loop_distance}km` : "N/A"}</span>
          </div>
        </div>
      </div>

      {/* Facilities */}
      <div className="bg-white/5 rounded-xl p-4">
        <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Facilities</h4>
        <div className="flex flex-wrap gap-2">
          {content.water && <span className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs flex items-center gap-1"><Droplet className="h-3 w-3" /> Water</span>}
          {content.washroom && <span className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-xs flex items-center gap-1"><Shield className="h-3 w-3" /> Washroom</span>}
          {content.parking && <span className="px-2 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs flex items-center gap-1"><Car className="h-3 w-3" /> Parking</span>}
          {content.lighting && <span className="px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs flex items-center gap-1"><Zap className="h-3 w-3" /> Lights</span>}
        </div>
      </div>

      {/* AI Recommendation */}
      {content.ai_recommendation && (
        <div className="bg-gradient-to-r from-primary/20 to-orange-500/20 border border-primary/30 rounded-xl p-3">
          <div className="flex items-start gap-2">
            <Heart className="h-4 w-4 text-primary mt-0.5" />
            <p className="text-xs text-white/90 italic">"{content.ai_recommendation}"</p>
          </div>
        </div>
      )}

      {/* Nearby Counts */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white/5 rounded-xl p-2 text-center">
          <p className="text-sm font-bold text-white">{content.popular_routes_count || 0}</p>
          <p className="text-[8px] text-white/40 uppercase tracking-wider">Routes</p>
        </div>
        <div className="bg-white/5 rounded-xl p-2 text-center">
          <p className="text-sm font-bold text-white">{content.nearby_communities_count || 0}</p>
          <p className="text-[8px] text-white/40 uppercase tracking-wider">Clubs</p>
        </div>
        <div className="bg-white/5 rounded-xl p-2 text-center">
          <p className="text-sm font-bold text-white">{content.nearby_events_count || 0}</p>
          <p className="text-[8px] text-white/40 uppercase tracking-wider">Events</p>
        </div>
      </div>

      {/* Smart Actions */}
      <div className="grid grid-cols-4 gap-2">
        <button className="flex flex-col items-center gap-1 p-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors cursor-pointer">
          <Activity className="h-4 w-4" />
          <span className="text-[8px]">Run</span>
        </button>
        <button className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 border border-border text-white hover:bg-white/10 transition-colors cursor-pointer">
          <Save className="h-4 w-4" />
          <span className="text-[8px]">Save</span>
        </button>
        <button className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 border border-border text-white hover:bg-white/10 transition-colors cursor-pointer">
          <Share2 className="h-4 w-4" />
          <span className="text-[8px]">Share</span>
        </button>
        <button className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 border border-border text-white hover:bg-white/10 transition-colors cursor-pointer">
          <Navigation className="h-4 w-4" />
          <span className="text-[8px]">Navigate</span>
        </button>
      </div>

      {/* Safety Information */}
      {(content.women_safety_rating || content.crowd_level) && (
        <div className="bg-white/5 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Shield className="h-3 w-3" /> Safety
          </h4>
          <div className="space-y-2">
            {content.women_safety_rating && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Women's Safety:</span>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-pink-400 fill-current" />
                  <span className="text-xs text-white font-medium">{content.women_safety_rating}/5</span>
                </div>
              </div>
            )}
            {content.crowd_level && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Crowd Level:</span>
                <span className="text-xs text-white font-medium capitalize">{content.crowd_level}</span>
              </div>
            )}
            {content.open_hours && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Safe Hours:</span>
                <span className="text-xs text-white font-medium">{content.open_hours}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RouteContent({ content }: { content: any }) {
  return (
    <div className="space-y-4">
      {/* Cover Image */}
      <div className="aspect-video rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center relative overflow-hidden">
        <MapPin className="h-12 w-12 text-white/30" />
      </div>

      {/* Basic Info */}
      <div>
        <h3 className="text-xl font-bold text-white">{content.title || content.name}</h3>
        <p className="text-sm text-white/60 flex items-center gap-1 mt-1">
          <MapPin className="h-3 w-3" /> {content.city || "India"}
        </p>
        {content.description && (
          <p className="text-sm text-white/70 mt-2 line-clamp-2">{content.description}</p>
        )}
        {content.distance && (
          <p className="text-xs text-white/50 mt-1 flex items-center gap-1">
            <Navigation className="h-3 w-3" /> {(content.distance / 1000).toFixed(1)} km
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-white">{(content.distance / 1000).toFixed(1)}</p>
          <p className="text-[10px] text-white/40 uppercase tracking-wider">km</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-white capitalize">{content.difficulty || "Mod"}</p>
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Difficulty</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-yellow-400">
            <Star className="h-3 w-3 fill-current" />
            <span className="text-lg font-bold text-white">{content.average_rating || "4.5"}</span>
          </div>
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Rating</p>
        </div>
      </div>

      {/* Smart Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors cursor-pointer">
          <Activity className="h-4 w-4" /> Run Now
        </button>
        <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-border text-white hover:bg-white/10 transition-colors cursor-pointer">
          <Save className="h-4 w-4" /> Save Route
        </button>
      </div>
    </div>
  );
}

function EventContent({ content }: { content: any }) {
  return (
    <div className="space-y-4">
      {/* Cover Image */}
      <div className="aspect-video rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center relative overflow-hidden">
        <Calendar className="h-12 w-12 text-white/30" />
      </div>

      {/* Basic Info */}
      <div>
        <h3 className="text-xl font-bold text-white">{content.title}</h3>
        <p className="text-sm text-white/60 flex items-center gap-1 mt-1">
          <MapPin className="h-3 w-3" /> {content.city || content.location || "India"}
        </p>
        {content.description && (
          <p className="text-sm text-white/70 mt-2 line-clamp-2">{content.description}</p>
        )}
        {content.distance && (
          <p className="text-xs text-white/50 mt-1 flex items-center gap-1">
            <Navigation className="h-3 w-3" /> {content.distance.toFixed(1)} km away
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-white">{content.registered_count || 0}</p>
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Registered</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-white">{content.max_participants || "∞"}</p>
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Capacity</p>
        </div>
      </div>

      {/* Event Details */}
      <div className="bg-white/5 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/40">Date:</span>
          <span className="text-xs text-white font-medium">{new Date(content.date).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40">Type:</span>
          <span className="text-xs text-white font-medium capitalize">{content.type?.replace("_", " ") || "Run"}</span>
        </div>
      </div>

      {/* Smart Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors cursor-pointer">
          <Calendar className="h-4 w-4" /> Register
        </button>
        <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-border text-white hover:bg-white/10 transition-colors cursor-pointer">
          <Share2 className="h-4 w-4" /> Share
        </button>
      </div>
    </div>
  );
}

function LiveRunContent({ content }: { content: any }) {
  return (
    <div className="space-y-4">
      <div className="aspect-video rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
        <Activity className="h-12 w-12 text-white/30" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-white">{(content.distance / 1000).toFixed(1)}</p>
          <p className="text-[10px] text-white/40 uppercase tracking-wider">km</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-white">{content.duration || 0}</p>
          <p className="text-[10px] text-white/40 uppercase tracking-wider">min</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-white">{content.averagePace || "0:00"}</p>
          <p className="text-[10px] text-white/40 uppercase tracking-wider">pace</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button className="flex-1 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors cursor-pointer">
          Cheer
        </button>
        <button className="flex-1 py-3 rounded-xl bg-white/5 border border-border text-white font-medium hover:bg-white/10 transition-colors cursor-pointer">
          View Profile
        </button>
      </div>
    </div>
  );
}

function PhotoContent({ content }: { content: any }) {
  return (
    <div className="space-y-4">
      <div className="aspect-video rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center relative overflow-hidden">
        {content.url ? (
          <img src={content.url} alt={content.caption} className="w-full h-full object-cover" />
        ) : (
          <Camera className="h-12 w-12 text-white/30" />
        )}
      </div>
      <div>
        <p className="text-sm text-white">{content.caption || "Community photo"}</p>
        <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
          <Heart className="h-3 w-3" /> {content.likes || 0} likes
        </p>
      </div>
      <div className="flex gap-2">
        <button className="flex-1 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors cursor-pointer">
          Like
        </button>
        <button className="flex-1 py-3 rounded-xl bg-white/5 border border-border text-white font-medium hover:bg-white/10 transition-colors cursor-pointer">
          Share
        </button>
      </div>
    </div>
  );
}
