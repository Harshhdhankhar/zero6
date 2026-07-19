"use client";

import React, { useState } from "react";
import { Users, MapPin, Tag, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createClubSchema } from "@/lib/validations";
import { actions } from "@/lib/actions";
import { ImageUpload } from "@/components/shared/image-upload";
import { processImageUpload, getDefaultLogo, DEFAULT_BANNER } from "@/lib/upload-image";
import { useAuth } from "@/hooks/use-auth";
import type { ClubCategory } from "@/types";

interface ClubCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categories: { value: ClubCategory; label: string }[] = [
  { value: "road", label: "Road" },
  { value: "trail", label: "Trail" },
  { value: "track", label: "Track" },
  { value: "social", label: "Social" },
  { value: "competitive", label: "Competitive" },
  { value: "casual", label: "Casual" },
];

export function ClubCreateDialog({ open, onOpenChange }: ClubCreateDialogProps) {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState<{ logo: number; banner: number }>({ logo: 0, banner: 0 });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    category: "social" as ClubCategory,
    tags: "",
  });

  const uploadFile = async (file: File, bucket: "community-logos" | "community-banners", onProgress: (pct: number) => void): Promise<string> => {
    onProgress(15);
    const maxSizeMB = bucket === "community-banners" ? 10 : 5;
    const aspectRatio = bucket === "community-banners" ? { w: 16, h: 9 } : { w: 1, h: 1 };
    const processed = await processImageUpload(file, {
      maxWidth: 1200,
      maxHeight: 1200,
      aspectRatio,
      maxSizeMB,
    });
    onProgress(40);

    const formData = new FormData();
    formData.append("file", processed.file, file.name);
    formData.append("bucket", bucket);
    formData.append("userId", profile?.id || "anonymous");

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Upload failed");
    }

    onProgress(90);
    const { url } = await res.json();
    onProgress(100);
    return url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const validated = createClubSchema.parse({
        name: formData.name,
        description: formData.description,
        location: formData.location,
        category: formData.category,
      });

      setIsLoading(true);

      let avatarUrl = getDefaultLogo(formData.name);
      let coverUrl = DEFAULT_BANNER;

      // Upload logo if selected
      if (logoFile) {
        try {
          avatarUrl = await uploadFile(logoFile, "community-logos", (pct) =>
            setUploadProgress(prev => ({ ...prev, logo: pct }))
          );
        } catch (err: any) {
          setError(`Logo upload failed: ${err.message}`);
          setIsLoading(false);
          setUploadProgress({ logo: 0, banner: 0 });
          return;
        }
      }

      // Upload banner if selected
      if (bannerFile) {
        try {
          coverUrl = await uploadFile(bannerFile, "community-banners", (pct) =>
            setUploadProgress(prev => ({ ...prev, banner: pct }))
          );
        } catch (err: any) {
          setError(`Banner upload failed: ${err.message}`);
          setIsLoading(false);
          setUploadProgress({ logo: 0, banner: 0 });
          return;
        }
      }

      const clubData = {
        name: validated.name,
        description: validated.description,
        location: validated.location,
        category: validated.category,
        avatar: avatarUrl,
        coverImage: coverUrl,
        tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
      };

      await actions.createClub(clubData);
      onOpenChange(false);

      setFormData({ name: "", description: "", location: "", category: "social", tags: "" });
      setLogoFile(null);
      setBannerFile(null);
      setUploadProgress({ logo: 0, banner: 0 });

      window.location.reload();
    } catch (err: any) {
      if (err?.issues) {
        setError(err.issues.map((i: any) => i.message).join(". "));
      } else if (err?.errors) {
        setError(err.errors.map((e: any) => e.message).join(". "));
      } else {
        setError(err?.message || "Failed to create club. Please try again.");
      }
      setIsLoading(false);
      setUploadProgress({ logo: 0, banner: 0 });
    }
  };

  const canSubmit = formData.name.trim() && formData.description.trim() && formData.location.trim() && !isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Create Club</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-xs text-red-400"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </motion.div>
          )}

          {/* Image Uploads */}
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
            <ImageUpload
              value={logoFile}
              onChange={setLogoFile}
              aspectRatio={{ w: 1, h: 1 }}
              maxSizeMB={5}
              shape="circle"
              label="Community Logo"
              placeholder="Upload Logo"
            />
            <div className="flex-1 w-full min-w-0">
              <ImageUpload
                value={bannerFile}
                onChange={setBannerFile}
                aspectRatio={{ w: 16, h: 9 }}
                maxSizeMB={10}
                shape="rectangle"
                label="Community Banner"
                placeholder="Upload Banner"
              />
            </div>
          </div>

          {/* Upload progress */}
          <AnimatePresence>
            {isLoading && (uploadProgress.logo > 0 || uploadProgress.banner > 0) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                {logoFile && (
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-white/50 w-12 shrink-0">Logo</span>
                    <div className="flex-1 h-1.5 rounded-full bg-secondary/50 overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress.logo}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-white/40 w-8 text-right">{uploadProgress.logo}%</span>
                  </div>
                )}
                {bannerFile && (
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-white/50 w-12 shrink-0">Banner</span>
                    <div className="flex-1 h-1.5 rounded-full bg-secondary/50 overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress.banner}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-white/40 w-8 text-right">{uploadProgress.banner}%</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Club Name */}
          <div>
            <Label htmlFor="name" className="text-sm font-medium">Club Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="SF Morning Runners"
              className="mt-1.5"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your club, what type of runs you do, who should join..."
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary placeholder:text-muted-foreground min-h-[100px] resize-none"
              required
            />
          </div>

          {/* Category */}
          <div>
            <Label className="text-sm font-medium">Club Category</Label>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.value })}
                  className={`rounded-xl border p-3 text-sm transition-all cursor-pointer ${
                    formData.category === cat.value
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border bg-card hover:bg-secondary"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location" className="text-sm font-medium flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Location
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="San Francisco, CA"
              className="mt-1.5"
              required
            />
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags" className="text-sm font-medium flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" /> Tags (comma-separated)
            </Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="morning, beginner-friendly, social"
              className="mt-1.5"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-xl"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-xl gap-2"
              disabled={!canSubmit}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  Create Club
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
