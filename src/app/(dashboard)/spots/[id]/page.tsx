"use client";

import React from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  MapPin,
  Star,
  Users,
  Activity,
  Route,
  Shield,
  Clock,
  Phone,
  Droplets,
  Car,
  Lightbulb,
  Building,
  TreePine,
  Coffee,
  Train,
  Hospital,
  ArrowLeft,
} from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistance } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface SpotDetail {
  id: string;
  name: string;
  description: string;
  coverPhotoUrl: string | null;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  spotType: string;
  popularityScore: number;
  averageRating: number;
  totalRuns: number;
  totalRunners: number;
  bestTimeToRun: string | null;
  averagePace: number;
  elevationGain: number;
  distanceRange: string | null;
  surfaceType: string | null;
  safetyRating: number;
  isVerified: boolean;
  tags: string[];
  facilities: {
    id: string;
    facilityType: string;
    description: string;
    isFree: boolean;
    openingHours: string | null;
  }[];
  reviews: {
    id: string;
    userId: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    user: { id: string; name: string; username: string; avatar: string } | null;
  }[];
  reviewCount: number;
  nearbyRoutes: {
    id: string;
    title: string;
    distance: number;
    difficulty: string;
    surfaceType: string;
    averageRating: number;
  }[];
  nearbyPois: {
    id: string;
    name: string;
    category: string;
    distance: number;
    phone: string | null;
  }[];
}

const FACILITY_ICONS: Record<string, React.ElementType> = {
  washroom: Droplets,
  water_point: Droplets,
  parking: Car,
  lighting: Lightbulb,
  changing_room: Building,
  shower: Droplets,
  locker: Building,
  drinking_fountain: Droplets,
  first_aid: Shield,
  seating: Building,
  shade: TreePine,
  bike_rack: Building,
  dog_park: TreePine,
  kids_play_area: Building,
  track: Route,
};

const FACILITY_LABELS: Record<string, string> = {
  washroom: "Washroom",
  water_point: "Water Point",
  parking: "Parking",
  lighting: "Lighting",
  changing_room: "Changing Room",
  shower: "Shower",
  locker: "Locker",
  drinking_fountain: "Drinking Fountain",
  first_aid: "First Aid",
  seating: "Seating",
  shade: "Shade",
  bike_rack: "Bike Rack",
  dog_park: "Dog Park",
  kids_play_area: "Kids Play Area",
  track: "Track",
};

const POI_ICONS: Record<string, React.ElementType> = {
  cafe: Coffee,
  metro: Train,
  hospital: Hospital,
  pharmacy: Hospital,
  running_store: Building,
  sports_shop: Building,
  water_station: Droplets,
  public_toilet: Droplets,
  medical_facility: Hospital,
  police_station: Shield,
};

export default function SpotDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: spot, loading, error } = useFetch<SpotDetail>(`/api/spots/${id}`);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="space-y-4 px-1">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !spot) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <MapPin className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h2 className="text-lg font-semibold">Spot not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {error || "The running spot you're looking for doesn't exist"}
        </p>
        <Link
          href="/spots"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Spots
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Hero */}
      <div className="relative h-48 sm:h-64 overflow-hidden rounded-2xl bg-gradient-to-br from-secondary to-muted">
        {spot.coverPhotoUrl ? (
          <img src={spot.coverPhotoUrl} alt={spot.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <MapPin className="h-16 w-16 text-muted-foreground/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {spot.isVerified && (
                  <Badge className="bg-emerald-500 text-white border-0 text-[10px]">Verified</Badge>
                )}
                <Badge variant="secondary" className="text-[10px] capitalize">
                  {spot.spotType?.replace("_", " ")}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">{spot.name}</h1>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {spot.city}{spot.state ? `, ${spot.state}` : ""}
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-xl bg-black/40 backdrop-blur px-3 py-2">
              <Star className="h-5 w-5 text-yellow-400" />
              <span className="text-lg font-bold text-white">{spot.averageRating.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Activity className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-lg font-bold">{spot.popularityScore?.toFixed(0) || 0}%</p>
          <p className="text-xs text-muted-foreground">Popularity</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Star className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
          <p className="text-lg font-bold">{spot.averageRating.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">Rating</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Route className="h-5 w-5 mx-auto mb-1 text-blue-400" />
          <p className="text-lg font-bold">{spot.totalRuns || 0}</p>
          <p className="text-xs text-muted-foreground">Total Runs</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Users className="h-5 w-5 mx-auto mb-1 text-emerald-400" />
          <p className="text-lg font-bold">{spot.totalRunners || 0}</p>
          <p className="text-xs text-muted-foreground">Runners</p>
        </div>
      </div>

      {/* Description */}
      {spot.description && (
        <div>
          <h2 className="text-lg font-semibold mb-2">About</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{spot.description}</p>
        </div>
      )}

      {/* Best Time to Run */}
      {spot.bestTimeToRun && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <Clock className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Best Time to Run</p>
            <p className="text-sm font-medium">{spot.bestTimeToRun}</p>
          </div>
        </div>
      )}

      {/* Facilities */}
      {spot.facilities.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Facilities</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {spot.facilities.map((facility) => {
              const Icon = FACILITY_ICONS[facility.facilityType] || Building;
              return (
                <div
                  key={facility.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    facility.isFree ? "bg-emerald-500/10" : "bg-amber-500/10"
                  )}>
                    <Icon className={cn(
                      "h-4 w-4",
                      facility.isFree ? "text-emerald-400" : "text-amber-400"
                    )} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {FACILITY_LABELS[facility.facilityType] || facility.facilityType}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {facility.isFree ? "Free" : "Paid"}
                      {facility.openingHours ? ` · ${facility.openingHours}` : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Safety */}
      {spot.safetyRating > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <Shield className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Safety Rating</p>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-4 w-4",
                      i < spot.safetyRating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">{spot.safetyRating}/5</span>
            </div>
          </div>
        </div>
      )}

      {/* Reviews */}
      {spot.reviews.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Reviews</h2>
            <Badge variant="secondary">{spot.reviewCount} reviews</Badge>
          </div>
          <div className="space-y-3">
            {spot.reviews.slice(0, 5).map((review) => (
              <div key={review.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  {review.user && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-medium shrink-0">
                      {review.user.avatar ? (
                        <img src={review.user.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                      ) : (
                        review.user.name?.slice(0, 2).toUpperCase()
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{review.user?.name || "Anonymous"}</p>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="mt-1 text-xs text-muted-foreground">{review.comment}</p>
                    )}
                    <p className="mt-1 text-[10px] text-muted-foreground/50">
                      {new Date(review.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nearby Routes */}
      {spot.nearbyRoutes.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Nearby Routes (within 2km)</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {spot.nearbyRoutes.map((route) => (
              <Link
                key={route.id}
                href={`/routes/${route.id}`}
                className="flex w-48 shrink-0 flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
              >
                <h4 className="text-sm font-medium truncate">{route.title}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDistance(route.distance)}</span>
                  <span>·</span>
                  <span className="capitalize">{route.difficulty}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] capitalize">{route.surfaceType}</Badge>
                  <div className="flex items-center gap-1 text-xs text-yellow-500">
                    <Star className="h-3 w-3" />
                    {route.averageRating.toFixed(1)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Nearby POIs */}
      {spot.nearbyPois.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Nearby Points of Interest (within 1km)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {spot.nearbyPois.map((poi) => {
              const Icon = POI_ICONS[poi.category] || MapPin;
              return (
                <div key={poi.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{poi.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="capitalize">{poi.category.replace("_", " ")}</span>
                      <span>·</span>
                      <span>{poi.distance.toFixed(2)} km</span>
                    </div>
                  </div>
                  {poi.phone && (
                    <a
                      href={`tel:${poi.phone}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
