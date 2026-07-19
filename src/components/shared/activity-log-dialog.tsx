"use client";

import React, { useState } from "react";
import { Activity as ActivityIcon, MapPin, Clock, Flame, Mountain, Heart, Footprints } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ACTIVITY_TYPES } from "@/lib/constants";
import { activitySchema } from "@/lib/validations";
import { useActivities } from "@/hooks/use-activities";
import type { ActivityType } from "@/types";

interface ActivityLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ActivityLogDialog({ open, onOpenChange }: ActivityLogDialogProps) {
  const { createActivity } = useActivities();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    type: "run" as ActivityType,
    title: "",
    description: "",
    distance: "",
    duration: "",
    pace: "",
    calories: "",
    elevationGain: "",
    heartRateAvg: "",
    heartRateMax: "",
    cadenceAvg: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // Validate
      const validated = activitySchema.parse({
        type: formData.type,
        title: formData.title,
        description: formData.description,
        distance: parseFloat(formData.distance),
        duration: parseInt(formData.duration),
        date: new Date().toISOString(),
      });

      setIsLoading(true);

      const activityData = {
        type: validated.type,
        title: validated.title,
        description: validated.description,
        distance: validated.distance,
        duration: validated.duration,
        pace: formData.pace ? parseFloat(formData.pace) : 0,
        calories: formData.calories ? parseInt(formData.calories) : 0,
        elevationGain: formData.elevationGain ? parseFloat(formData.elevationGain) : 0,
        heartRateAvg: formData.heartRateAvg ? parseInt(formData.heartRateAvg) : null,
        heartRateMax: formData.heartRateMax ? parseInt(formData.heartRateMax) : null,
        cadenceAvg: formData.cadenceAvg ? parseInt(formData.cadenceAvg) : null,
      };

      await createActivity(activityData);
      onOpenChange(false);
      
      // Reset form
      setFormData({
        type: "run",
        title: "",
        description: "",
        distance: "",
        duration: "",
        pace: "",
        calories: "",
        elevationGain: "",
        heartRateAvg: "",
        heartRateMax: "",
        cadenceAvg: "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to log activity. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Log Activity</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Error */}
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          {/* Activity Type */}
          <div>
            <Label className="text-sm font-medium">Activity Type</Label>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ACTIVITY_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.value as ActivityType })}
                  className={`flex items-center gap-2 rounded-xl border p-3 text-sm transition-all ${
                    formData.type === type.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card hover:bg-secondary"
                  }`}
                >
                  <span className="text-lg">{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Morning run in the park"
              className="mt-1.5"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium">Description (optional)</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="How was your run? Any notes..."
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary placeholder:text-muted-foreground min-h-[80px] resize-none"
              maxLength={500}
            />
          </div>

          {/* Distance, Duration, Pace */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="distance" className="text-sm font-medium flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Distance (km)
              </Label>
              <Input
                id="distance"
                type="number"
                step="0.01"
                value={formData.distance}
                onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                placeholder="5.0"
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="duration" className="text-sm font-medium flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Duration (min)
              </Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="30"
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="pace" className="text-sm font-medium">Pace (min/km)</Label>
              <Input
                id="pace"
                type="number"
                step="0.01"
                value={formData.pace}
                onChange={(e) => setFormData({ ...formData, pace: e.target.value })}
                placeholder="6:00"
                className="mt-1.5"
              />
            </div>
          </div>

          {/* Calories, Elevation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="calories" className="text-sm font-medium flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5" /> Calories
              </Label>
              <Input
                id="calories"
                type="number"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                placeholder="300"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="elevation" className="text-sm font-medium flex items-center gap-1.5">
                <Mountain className="h-3.5 w-3.5" /> Elevation Gain (m)
              </Label>
              <Input
                id="elevation"
                type="number"
                value={formData.elevationGain}
                onChange={(e) => setFormData({ ...formData, elevationGain: e.target.value })}
                placeholder="50"
                className="mt-1.5"
              />
            </div>
          </div>

          {/* Heart Rate, Cadence */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="heartRateAvg" className="text-sm font-medium flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5" /> Avg HR
              </Label>
              <Input
                id="heartRateAvg"
                type="number"
                value={formData.heartRateAvg}
                onChange={(e) => setFormData({ ...formData, heartRateAvg: e.target.value })}
                placeholder="145"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="heartRateMax" className="text-sm font-medium flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5" /> Max HR
              </Label>
              <Input
                id="heartRateMax"
                type="number"
                value={formData.heartRateMax}
                onChange={(e) => setFormData({ ...formData, heartRateMax: e.target.value })}
                placeholder="165"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="cadence" className="text-sm font-medium flex items-center gap-1.5">
                <Footprints className="h-3.5 w-3.5" /> Cadence (spm)
              </Label>
              <Input
                id="cadence"
                type="number"
                value={formData.cadenceAvg}
                onChange={(e) => setFormData({ ...formData, cadenceAvg: e.target.value })}
                placeholder="170"
                className="mt-1.5"
              />
            </div>
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
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <ActivityIcon className="h-4 w-4" /> Log Activity
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
