"use client";

import React, { useState } from "react";
import { Calendar, MapPin, Users, DollarSign, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EVENT_TYPES } from "@/lib/constants";
import { createEventSchema } from "@/lib/validations";
import { actions } from "@/lib/actions";
import type { EventType } from "@/types";

interface EventCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventCreateDialog({ open, onOpenChange }: EventCreateDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    distance: "",
    type: "5k" as EventType,
    maxParticipants: "",
    price: "",
    tags: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // Validate
      const validated = createEventSchema.parse({
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        distance: parseFloat(formData.distance),
        type: formData.type,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
      });

      setIsLoading(true);

      const eventData = {
        title: validated.title,
        description: validated.description,
        date: validated.date,
        time: validated.time,
        location: validated.location,
        distance: validated.distance,
        type: validated.type,
        maxParticipants: validated.maxParticipants || 100,
        price: validated.price || 0,
        tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
      };

      await actions.createEvent(eventData);
      onOpenChange(false);
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        distance: "",
        type: "5k",
        maxParticipants: "",
        price: "",
        tags: "",
      });

      // Refresh the page to show new event
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to create event. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Create Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Error */}
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium">Event Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Summer 5K Run"
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
              placeholder="Describe your event, route details, what to expect..."
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary placeholder:text-muted-foreground min-h-[100px] resize-none"
              required
            />
          </div>

          {/* Event Type */}
          <div>
            <Label className="text-sm font-medium">Event Type</Label>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EVENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.value as EventType })}
                  className={`rounded-xl border p-3 text-sm transition-all ${
                    formData.type === type.value
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border bg-card hover:bg-secondary"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date, Time, Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date" className="text-sm font-medium flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Date
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="time" className="text-sm font-medium">Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="mt-1.5"
                required
              />
            </div>
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
          </div>

          {/* Distance, Max Participants, Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="distance" className="text-sm font-medium">Distance (km)</Label>
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
              <Label htmlFor="maxParticipants" className="text-sm font-medium flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Max Participants
              </Label>
              <Input
                id="maxParticipants"
                type="number"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                placeholder="100"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="price" className="text-sm font-medium flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5" /> Price (USD)
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0"
                className="mt-1.5"
              />
            </div>
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
              placeholder="scenic, flat, beginner-friendly"
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
              className="flex-1 rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                "Create Event"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
