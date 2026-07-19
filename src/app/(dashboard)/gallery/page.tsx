"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Camera, Route, Users, Loader2 } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CityGallery {
  id: string;
  city: string;
  state: string;
  coverPhotoUrl: string | null;
  totalRoutes: number;
  totalPhotos: number;
  totalRunners: number;
  activeClubs: number;
  upcomingEvents: number;
}

export default function GalleryPage() {
  const { data: cities, loading, error } = useFetch<CityGallery[]>("/api/galleries");

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Community Gallery</h1>
          <p className="mt-1 text-sm text-muted-foreground">Explore running communities around India</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <Loader2 className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!cities || cities.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <Camera className="mb-3 h-12 w-12 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No galleries available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Community Gallery</h1>
        <p className="mt-1 text-sm text-muted-foreground">Explore running communities around India</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cities.map((city) => (
          <Link key={city.id} href={`/gallery/${encodeURIComponent(city.city)}`}>
            <motion.div
              whileHover={{ y: -4 }}
              className="group rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20"
            >
              <div className="relative h-36 bg-gradient-to-br from-secondary to-muted flex items-center justify-center overflow-hidden">
                {city.coverPhotoUrl ? (
                  <img
                    src={city.coverPhotoUrl}
                    alt={city.city}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <Camera className="h-10 w-10 text-muted-foreground/40" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <h3 className="text-lg font-bold text-white">{city.city}</h3>
                  {city.state && (
                    <p className="text-xs text-muted-foreground">{city.state}</p>
                  )}
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-xs font-semibold">
                      <Route className="h-3 w-3 text-muted-foreground" />
                      {city.totalRoutes}
                    </div>
                    <p className="text-[10px] text-muted-foreground">Routes</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-xs font-semibold">
                      <Camera className="h-3 w-3 text-muted-foreground" />
                      {city.totalPhotos}
                    </div>
                    <p className="text-[10px] text-muted-foreground">Photos</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-xs font-semibold">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      {city.totalRunners}
                    </div>
                    <p className="text-[10px] text-muted-foreground">Runners</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
