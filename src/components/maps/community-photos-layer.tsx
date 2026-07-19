"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Heart, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface Hotspot {
  lat: number;
  lng: number;
  count: number;
  coverUrl: string;
  city: string;
  topRunners: { name: string; avatar: string }[];
}

interface CommunityPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  caption: string;
  latitude: number;
  longitude: number;
  likes: number;
  createdAt: string;
  user: { id: string; name: string; username: string; avatar: string } | null;
}

interface CommunityPhotosLayerProps {
  center: [number, number];
  zoom: number;
  active: boolean;
  onPhotoClick?: (photo: CommunityPhoto) => void;
}

function latLngToScreenPoint(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  zoom: number,
  width: number,
  height: number
): { x: number; y: number } | null {
  const n = Math.pow(2, zoom);
  const tileSize = 512;
  const toWorld = (la: number, lo: number) => {
    const x = ((lo + 180) / 360) * n * tileSize;
    const y =
      ((1 - Math.log(Math.tan((la * Math.PI) / 180) + 1 / Math.cos((la * Math.PI) / 180)) / Math.PI) / 2) *
      n *
      tileSize;
    return { x, y };
  };
  const c = toWorld(centerLat, centerLng);
  const p = toWorld(lat, lng);
  const sx = width / 2 + (p.x - c.x);
  const sy = height / 2 + (p.y - c.y);
  if (sx < -50 || sx > width + 50 || sy < -50 || sy > height + 50) return null;
  return { x: sx, y: sy };
}

function GalleryModal({
  hotspot,
  onClose,
}: {
  hotspot: Hotspot;
  onClose: () => void;
}) {
  const { data: photos, loading } = useFetch<CommunityPhoto[]>(
    `/api/community-photos?bounds=${hotspot.lat - 0.05},${hotspot.lng - 0.05},${hotspot.lat + 0.05},${hotspot.lng + 0.05}&limit=50`
  );

  const allPhotos = photos || [];
  const [page, setPage] = useState(0);
  const pageSize = 12;
  const totalPages = Math.ceil(allPhotos.length / pageSize);
  const paginated = allPhotos.slice(page * pageSize, (page + 1) * pageSize);

  async function handleLike(photoId: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await fetch(`/api/community-photos/${photoId}/like`, { method: "POST" });
    } catch {}
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">
              {hotspot.city || "Photos"} — {hotspot.count} photos
            </h3>
            <div className="mt-1 flex items-center gap-1.5">
              {hotspot.topRunners.map((runner, i) => (
                <Avatar key={i} className="h-5 w-5 border border-border">
                  <AvatarImage src={runner.avatar} alt={runner.name} />
                  <AvatarFallback className="text-[8px]">{runner.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
              ))}
              <span className="text-xs text-white/50">nearby</span>
            </div>
          </div>
          <button onClick={onClose} className="cursor-pointer rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-white/50">
            <Camera className="mb-2 h-8 w-8" />
            <p className="text-sm">No photos in this area</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              {paginated.map((photo) => (
                <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl bg-white/5">
                  <img
                    src={photo.thumbnailUrl || photo.url}
                    alt={photo.caption || "Community photo"}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  {photo.user && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-5 w-5 border border-border">
                          <AvatarImage src={photo.user.avatar} alt={photo.user.name} />
                          <AvatarFallback className="text-[8px]">{photo.user.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="truncate text-[10px] text-white">{photo.user.name}</span>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={(e) => handleLike(photo.id, e)}
                    className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
                  >
                    <Heart className="h-3 w-3" />
                    {photo.likes}
                  </button>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="cursor-pointer rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-white/50">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="cursor-pointer rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

export function CommunityPhotosLayer({ center, zoom, active, onPhotoClick }: CommunityPhotosLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [loading, setLoading] = useState(false);

  const [centerLat, centerLng] = center;

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSize({ width: Math.round(entry.contentRect.width), height: Math.round(entry.contentRect.height) });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const fetchHotspots = useCallback(async () => {
    if (!active || !size.width || !size.height) return;
    const n = Math.pow(2, zoom);
    const tileSize = 512;
    const halfW = (size.width / 2 / tileSize / n) * 360;
    const halfH = (size.height / 2 / tileSize / n / Math.cos((centerLat * Math.PI) / 180)) * 180;
    const swLat = Math.max(-90, centerLat - halfH);
    const swLng = Math.max(-180, centerLng - halfW);
    const neLat = Math.min(90, centerLat + halfH);
    const neLng = Math.min(180, centerLng + halfW);

    setLoading(true);
    try {
      const params = new URLSearchParams({
        bounds: `${swLat},${swLng},${neLat},${neLng}`,
        zoom: String(zoom),
      });
      const res = await fetch(`/api/community-photos/hotspots?${params}`);
      if (!res.ok) { setHotspots([]); return; }
      const json = await res.json();
      setHotspots(json.data || []);
    } catch { setHotspots([]); } finally { setLoading(false); }
  }, [active, size, centerLat, centerLng, zoom]);

  useEffect(() => { fetchHotspots(); }, [fetchHotspots]);

  useEffect(() => {
    if (!canvasRef.current || !size.width || !size.height) return;
    const canvas = canvasRef.current;
    canvas.width = size.width * devicePixelRatio;
    canvas.height = size.height * devicePixelRatio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.clearRect(0, 0, size.width, size.height);
    if (!active || hotspots.length === 0) return;

    for (const h of hotspots) {
      const pt = latLngToScreenPoint(h.lat, h.lng, centerLat, centerLng, zoom, size.width, size.height);
      if (!pt) continue;

      const radius = Math.max(16, 32 - zoom);
      const gradient = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, radius);
      gradient.addColorStop(0, "rgba(255, 90, 31, 0.6)");
      gradient.addColorStop(0.5, "rgba(255, 90, 31, 0.25)");
      gradient.addColorStop(1, "rgba(255, 90, 31, 0)");
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = "#FF5A1F";
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(h.count), pt.x, pt.y);
    }
  }, [hotspots, size, active, centerLat, centerLng, zoom]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!active || hotspots.length === 0) return;
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      for (const h of hotspots) {
        const pt = latLngToScreenPoint(h.lat, h.lng, centerLat, centerLng, zoom, size.width, size.height);
        if (!pt) continue;
        const radius = Math.max(16, 32 - zoom) * 0.35;
        const dist = Math.sqrt((x - pt.x) ** 2 + (y - pt.y) ** 2);
        if (dist <= radius) {
          setSelectedHotspot(h);
          return;
        }
      }
    },
    [active, hotspots, centerLat, centerLng, zoom, size]
  );

  if (!active) return null;

  return (
    <div ref={containerRef} className="absolute inset-0 z-[5]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full cursor-pointer"
        style={{ width: size.width, height: size.height }}
        onClick={handleCanvasClick}
      />
      {loading && (
        <div className="absolute right-3 top-3">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        </div>
      )}
      <AnimatePresence>
        {selectedHotspot && (
          <GalleryModal hotspot={selectedHotspot} onClose={() => setSelectedHotspot(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
