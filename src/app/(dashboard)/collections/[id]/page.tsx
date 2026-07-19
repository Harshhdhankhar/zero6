"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, Plus, Loader2, FolderOpen, Clock } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistance, formatDuration, formatRelativeTime } from "@/lib/utils";
import type { Activity } from "@/types";

interface CollectionItem {
  id: string;
  collectionId: string;
  routeId: string;
  notes: string | null;
  sortOrder: number;
  route: Activity | null;
}

interface CollectionDetail {
  id: string;
  title: string;
  description: string | null;
  coverPhotoUrl: string | null;
  isPublic: boolean;
  type: string;
  items: CollectionItem[];
}

const typeEmoji: Record<string, string> = {
  run: "🏃",
  walk: "🚶",
  trail: "⛰️",
  treadmill: "🏋️",
};

export default function CollectionDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: collection, loading, error, refetch } = useFetch<CollectionDetail>(
    `/api/collections/${id}`
  );

  const handleRemove = async (itemId: string) => {
    try {
      const res = await fetch(`/api/collections/${id}/items/${itemId}`, {
        method: "DELETE",
      });
      if (res.ok) refetch();
    } catch {}
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <Loader2 className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{error || "Collection not found"}</p>
        <Link href="/collections">
          <Button variant="outline" size="sm" className="mt-3">
            Back to Collections
          </Button>
        </Link>
      </div>
    );
  }

  const activities = collection.items
    .filter((item) => item.route)
    .map((item) => ({ item, activity: item.route! }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/collections"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {collection.title}
          </h1>
          {collection.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {collection.description}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground capitalize">
            {collection.type?.replace(/_/g, " ")} · {collection.items.length}{" "}
            {collection.items.length === 1 ? "activity" : "activities"}
          </p>
        </div>
        <Link href="/activities">
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Activity
          </Button>
        </Link>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <FolderOpen className="mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No activities saved yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Start adding activities to this collection
          </p>
          <Link href="/activities">
            <Button variant="outline" size="sm" className="mt-3 gap-2">
              <Plus className="h-4 w-4" />
              Browse Activities
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map(({ item, activity }) => (
            <div key={item.id} className="relative">
              <Link href={`/activities/${activity.id}`}>
                <div className="rounded-xl border border-border bg-secondary/30 p-4 transition-colors hover:bg-secondary/50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{typeEmoji[activity.type] || "🏃"}</span>
                      <div>
                        <h4 className="text-sm font-semibold">{activity.title}</h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{formatRelativeTime(activity.date)}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(activity.duration)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatDistance(activity.distance)}</p>
                      <p className="text-xs text-muted-foreground">Distance</p>
                    </div>
                  </div>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(item.id)}
                className="absolute top-3 right-3 z-10 h-8 w-8 p-0 rounded-full bg-black/50 hover:bg-red-500/80 text-white"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
