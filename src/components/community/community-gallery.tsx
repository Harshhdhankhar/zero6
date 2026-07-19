"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { useAuth } from "@/hooks/use-auth";
import {
  Camera, Heart, Image, Play, Loader2, AlertCircle, RefreshCw,
  FolderOpen, Plus, ArrowLeft, Grid3X3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { actions } from "@/lib/actions";

interface Album {
  id: string; title: string; description: string; coverUrl: string;
  photoCount: number; createdAt: string;
  createdBy: { id: string; name: string; avatar: string } | null;
}

interface GalleryItem {
  id: string; url: string; thumbnailUrl: string; caption: string;
  mediaType: string; likesCount: number; createdAt: string;
  user: { id: string; name: string; username: string; avatar: string } | null;
  isLiked: boolean;
}

interface AlbumPhoto {
  id: string; photoUrl: string; thumbnailUrl: string; caption: string;
  position: number; createdAt: string;
  uploadedBy: { id: string; name: string; avatar: string } | null;
}

export function CommunityGallery({ clubId }: { clubId: string }) {
  const { isAuthenticated } = useAuth();
  const [view, setView] = useState<"albums" | "photos">("albums");
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  const { data: albumsData, loading: albumsLoading, refetch: refetchAlbums } = useFetch<{ data: Album[] }>(
    `/api/clubs/${clubId}/albums`
  );
  const albums = albumsData?.data || [];

  const { data, loading, error, refetch } = useFetch<{ data: GalleryItem[]; meta: any }>(
    `/api/clubs/${clubId}/community?resource=gallery`
  );
  const items = data?.data || [];

  const { data: photosData, loading: photosLoading, refetch: refetchPhotos } = useFetch<{ data: AlbumPhoto[] }>(
    selectedAlbum ? `/api/clubs/${clubId}/albums/photos?albumId=${selectedAlbum.id}` : ""
  );
  const photos = photosData?.data || [];

  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [likingId, setLikingId] = useState<string | null>(null);

  const handleLike = async (item: GalleryItem) => {
    if (!isAuthenticated) { toast.error("Sign in to like"); return; }
    setLikingId(item.id);
    try {
      await fetch(`/api/clubs/${clubId}/community`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resource: "gallery_like", galleryId: item.id }),
      });
      refetch();
    } catch { } finally { setLikingId(null); }
  };

  if (loading || albumsLoading) return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center py-12 text-center">
      <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
      <p className="text-sm text-white/60">Failed to load gallery</p>
      <Button variant="secondary" size="sm" onClick={refetch} className="mt-3 gap-2"><RefreshCw className="h-3 w-3" /> Retry</Button>
    </div>
  );

  // Album detail view
  if (view === "photos" && selectedAlbum) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => { setView("albums"); setSelectedAlbum(null); }}
            className="p-1.5 rounded-lg bg-secondary/30 hover:bg-secondary text-white/40 hover:text-white/60 transition-all cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h3 className="text-sm font-medium text-white">{selectedAlbum.title}</h3>
            <p className="text-[10px] text-white/30">{selectedAlbum.photoCount} photos</p>
          </div>
        </div>

        {photosLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Camera className="h-10 w-10 text-white/20 mb-2" />
            <p className="text-sm text-white/40">No photos in this album yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((photo, i) => (
              <motion.div key={photo.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                className="aspect-square rounded-2xl overflow-hidden border border-border">
                <img src={photo.thumbnailUrl || photo.photoUrl} alt={photo.caption || ""}
                  className="w-full h-full object-cover" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {/* View Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setView("albums")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all cursor-pointer",
            view === "albums" ? "bg-primary text-white" : "bg-secondary/30 text-white/40 hover:text-white/60"
          )}>
          <FolderOpen className="h-3 w-3" /> Albums
        </button>
        <button onClick={() => setView("photos")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all cursor-pointer",
            view === "photos" ? "bg-primary text-white" : "bg-secondary/30 text-white/40 hover:text-white/60"
          )}>
          <Grid3X3 className="h-3 w-3" /> All Photos
        </button>
      </div>

      {view === "albums" ? (
        albums.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <FolderOpen className="h-10 w-10 text-white/20 mb-2" />
            <p className="text-sm text-white/40">No albums yet. Create one to organize photos!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {albums.map((album, i) => (
              <motion.div key={album.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                className="group relative aspect-square rounded-2xl overflow-hidden border border-border cursor-pointer"
                onClick={() => { setSelectedAlbum(album); setView("photos"); }}>
                {album.coverUrl ? (
                  <img src={album.coverUrl} alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full bg-secondary/30 flex items-center justify-center">
                    <FolderOpen className="h-12 w-12 text-white/10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-xs font-medium text-white truncate">{album.title}</p>
                  <p className="text-[9px] text-white/40">{album.photoCount} photos</p>
                </div>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        items.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Camera className="h-10 w-10 text-white/20 mb-2" />
            <p className="text-sm text-white/40">No photos yet. Share your moments!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                className="group relative aspect-square rounded-2xl overflow-hidden border border-border cursor-pointer"
                onClick={() => setSelected(item)}>
                <img src={item.thumbnailUrl || item.url} alt={item.caption || ""}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <p className="text-[10px] text-white truncate">{item.caption || ""}</p>
                    <button onClick={(e) => { e.stopPropagation(); handleLike(item); }}
                      className={cn("flex items-center gap-1 text-[10px] transition-all cursor-pointer",
                        item.isLiked ? "text-red-400" : "text-white/60 hover:text-white")}>
                      {likingId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Heart className={cn("h-3 w-3", item.isLiked && "fill-current")} />}
                      {item.likesCount || 0}
                    </button>
                  </div>
                </div>
                {item.mediaType === "video" && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-black/60 flex items-center justify-center">
                    <Play className="h-3 w-3 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )
      )}

      {/* Lightbox */}
      {selected && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}>
          <div className="max-w-3xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <img src={selected.url} alt="" className="max-w-full max-h-[80vh] rounded-2xl object-contain" />
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                {selected.user?.avatar && <img src={selected.user.avatar} alt="" className="w-6 h-6 rounded-lg object-cover" />}
                <span className="text-xs text-white/60">{selected.user?.name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/40">
                <span>{new Date(selected.createdAt).toLocaleDateString()}</span>
                <span>{selected.likesCount} likes</span>
              </div>
            </div>
          </div>
          <button onClick={() => setSelected(null)} className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl cursor-pointer">✕</button>
        </motion.div>
      )}
    </>
  );
}
