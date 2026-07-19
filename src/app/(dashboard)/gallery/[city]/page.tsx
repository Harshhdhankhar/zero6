"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { Button } from "@/components/ui/button";
import { CommunityGallery } from "@/components/maps/community-gallery";

interface GalleryData {
  city: string;
  topPhotos: any[];
  trendingRoutes: any[];
  popularParks: any[];
  activeClubs: any[];
  upcomingEvents: any[];
}

export default function GalleryCityPage() {
  const params = useParams();
  const city = params.city as string;
  const decodedCity = decodeURIComponent(city);

  const { data, loading, error } = useFetch<GalleryData>(
    `/api/galleries/${city}`
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Link
          href="/gallery"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Galleries
        </Link>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <Loader2 className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {error || `No gallery data for ${decodedCity}`}
        </p>
        <Link href="/gallery">
          <Button variant="outline" size="sm" className="mt-3">
            Back to Galleries
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/gallery"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Galleries
      </Link>
      <CommunityGallery city={decodedCity} />
    </div>
  );
}
