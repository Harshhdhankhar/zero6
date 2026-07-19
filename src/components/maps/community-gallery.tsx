"use client";

import React, { useState } from "react";
import {
  Camera,
  Route,
  MapPin,
  Users,
  Calendar,
  Star,
  ChevronRight,
} from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime, formatDistance } from "@/lib/utils";
import Link from "next/link";

interface GalleryPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  caption: string;
  likes: number;
  createdAt: string;
  user: { id: string; name: string; avatar: string } | null;
}

interface GalleryRoute {
  id: string;
  title: string;
  distance: number;
  difficulty: string;
  surfaceType: string;
  averageRating: number;
  reviewCount: number;
}

interface GallerySpot {
  id: string;
  name: string;
  spotType: string;
  averageRating: number;
  popularityScore: number;
}

interface GalleryClub {
  id: string;
  name: string;
  avatar: string;
  memberCount: number;
  category: string;
  location: string;
}

interface GalleryEvent {
  id: string;
  title: string;
  date: string;
  type: string;
  location: string;
  registeredCount: number;
  status: string;
}

interface GalleryData {
  city: string;
  topPhotos: GalleryPhoto[];
  trendingRoutes: GalleryRoute[];
  popularParks: GallerySpot[];
  activeClubs: GalleryClub[];
  upcomingEvents: GalleryEvent[];
}

interface CommunityGalleryProps {
  city: string;
  onClose?: () => void;
}

function SectionHeader({ title, icon: Icon }: { title: string; icon: React.ElementType }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <h3 className="text-sm font-semibold text-white">{title}</h3>
    </div>
  );
}

function PhotoGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-xl" />
      ))}
    </div>
  );
}

function RouteCardSkeleton() {
  return (
    <div className="flex gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-44 shrink-0 rounded-xl" />
      ))}
    </div>
  );
}

function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

function PhotosSection({ photos }: { photos: GalleryPhoto[] }) {
  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-white/30">
        <Camera className="mb-2 h-6 w-6" />
        <p className="text-xs">No photos yet</p>
      </div>
    );
  }

  const display = photos.slice(0, 9);
  return (
    <div className="grid grid-cols-3 gap-2">
      {display.map((photo) => (
        <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl bg-white/5">
          <img
            src={photo.thumbnailUrl || photo.url}
            alt={photo.caption || "Photo"}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
            <div className="flex items-center gap-1">
              {photo.user && (
                <Avatar className="h-5 w-5 border border-border">
                  <AvatarImage src={photo.user.avatar} alt={photo.user.name} />
                  <AvatarFallback className="text-[8px]">{photo.user.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
              )}
              <span className="text-[10px] text-white/80 ml-auto">{photo.likes} ❤</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RoutesSection({ routes }: { routes: GalleryRoute[] }) {
  if (routes.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-white/30">
        <Route className="mb-2 h-6 w-6" />
        <p className="text-xs">No routes yet</p>
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
      {routes.map((route) => (
        <Link
          key={route.id}
          href={`/routes/${route.id}`}
          className="flex w-44 shrink-0 flex-col gap-2 rounded-xl border border-border bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.06]"
        >
          <div className="flex items-start justify-between">
            <h4 className="text-sm font-medium text-white truncate">{route.title}</h4>
            <div className="flex items-center gap-0.5 text-xs text-yellow-400 shrink-0 ml-1">
              <Star className="h-3 w-3" />
              {route.averageRating.toFixed(1)}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span>{formatDistance(route.distance)}</span>
            <span>·</span>
            <Badge variant="outline" className="text-[10px] capitalize">{route.difficulty}</Badge>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ParksSection({ spots }: { spots: GallerySpot[] }) {
  if (spots.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-white/30">
        <MapPin className="mb-2 h-6 w-6" />
        <p className="text-xs">No parks listed yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {spots.slice(0, 5).map((spot) => (
        <Link
          key={spot.id}
          href={`/spots/${spot.id}`}
          className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 transition-colors hover:bg-white/[0.06]"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{spot.name}</p>
            <div className="flex items-center gap-2 text-xs text-white/40 capitalize">
              <span>{spot.spotType}</span>
              <span>·</span>
              <span className="flex items-center gap-0.5">
                <Star className="h-3 w-3 text-yellow-400" />
                {spot.averageRating.toFixed(1)}
              </span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />
        </Link>
      ))}
    </div>
  );
}

function ClubsSection({ clubs }: { clubs: GalleryClub[] }) {
  if (clubs.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-white/30">
        <Users className="mb-2 h-6 w-6" />
        <p className="text-xs">No clubs yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {clubs.slice(0, 5).map((club) => (
        <div
          key={club.id}
          className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={club.avatar} alt={club.name} />
            <AvatarFallback className="text-xs">{club.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{club.name}</p>
            <p className="text-xs text-white/40">{club.memberCount} members · {club.category}</p>
          </div>
          <Badge variant="secondary" className="text-[10px]">{club.location}</Badge>
        </div>
      ))}
    </div>
  );
}

function EventsSection({ events }: { events: GalleryEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-white/30">
        <Calendar className="mb-2 h-6 w-6" />
        <p className="text-xs">No upcoming events</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {events.slice(0, 5).map((event) => (
        <Link
          key={event.id}
          href={`/events/${event.id}`}
          className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 transition-colors hover:bg-white/[0.06]"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
            <Calendar className="h-4 w-4 text-white/60" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{event.title}</p>
            <p className="text-xs text-white/40">
              {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              {" · "}
              {event.type?.replace("_", " ")}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />
        </Link>
      ))}
    </div>
  );
}

export function CommunityGallery({ city, onClose }: CommunityGalleryProps) {
  const { data, loading } = useFetch<GalleryData>(
    `/api/galleries/${encodeURIComponent(city)}`
  );

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <Skeleton className="h-6 w-40 rounded-lg" />
        <PhotoGridSkeleton />
        <RouteCardSkeleton />
        <ListSkeleton />
        <ListSkeleton />
        <ListSkeleton />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Camera className="mb-3 h-10 w-10 text-white/20" />
        <p className="text-sm text-white/50">No gallery data for {city}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-4 pt-4">
        <h2 className="text-lg font-bold text-white">{data.city} Gallery</h2>
      </div>

      <div className="space-y-6 px-4 pb-4">
        <section>
          <SectionHeader title="Top Photos" icon={Camera} />
          <PhotosSection photos={data.topPhotos} />
        </section>

        <section>
          <SectionHeader title="Trending Routes" icon={Route} />
          <RoutesSection routes={data.trendingRoutes} />
        </section>

        <section>
          <SectionHeader title="Popular Parks" icon={MapPin} />
          <ParksSection spots={data.popularParks} />
        </section>

        <section>
          <SectionHeader title="Active Clubs" icon={Users} />
          <ClubsSection clubs={data.activeClubs} />
        </section>

        <section>
          <SectionHeader title="Upcoming Events" icon={Calendar} />
          <EventsSection events={data.upcomingEvents} />
        </section>
      </div>
    </div>
  );
}
