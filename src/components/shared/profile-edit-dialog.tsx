"use client";

import React, { useState } from "react";
import { User, MapPin, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { updateProfileSchema } from "@/lib/validations";
import { useAuth } from "@/hooks/use-auth";
import { useAppStore } from "@/store/app-store";

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileEditDialog({ open, onOpenChange }: ProfileEditDialogProps) {
  const { updateProfile } = useAuth();
  const profile = useAppStore((s) => s.profile);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: profile?.name || "",
    username: profile?.username || "",
    bio: profile?.bio || "",
    location: profile?.location || "",
    avatar: profile?.avatar || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // Validate
      const validated = updateProfileSchema.parse({
        name: formData.name,
        username: formData.username,
        bio: formData.bio,
        location: formData.location,
      });

      setIsLoading(true);

      await updateProfile({
        name: validated.name,
        username: validated.username,
        bio: validated.bio,
        location: validated.location,
        avatar: formData.avatar,
      });

      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Error */}
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          {/* Avatar Upload */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold">{formData.name.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <button
                type="button"
                className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary/90 cursor-pointer"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex-1">
              <Label className="text-sm font-medium">Avatar URL</Label>
              <Input
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                placeholder="https://example.com/avatar.jpg"
                className="mt-1.5 text-sm"
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="name" className="text-sm font-medium flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Full Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Alex Rivera"
              className="mt-1.5"
              required
            />
          </div>

          {/* Username */}
          <div>
            <Label htmlFor="username" className="text-sm font-medium">Username</Label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="alexrunner"
                className="pl-7"
                required
              />
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
            />
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary placeholder:text-muted-foreground min-h-[80px] resize-none"
              maxLength={200}
            />
            <p className="mt-1 text-[10px] text-muted-foreground text-right">
              {formData.bio.length}/200
            </p>
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
              className="flex-1 rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
