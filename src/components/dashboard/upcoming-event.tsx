"use client";

import React from "react";
import Link from "next/link";
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { formatDistance } from "@/lib/utils";
import type { Event } from "@/types";

export function UpcomingEvent() {
  const { data: apiEvents, error } = useFetch<Event[]>("/api/events");

  if (error) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 h-full">
        <div className="flex items-center justify-center h-full text-center">
          <p className="text-sm text-muted-foreground">Unable to load events</p>
        </div>
      </div>
    );
  }

  const events = apiEvents || [];
  const nextEvent = events.find((e) => e.isRegistered && e.status === "upcoming");

  if (!nextEvent) return null;

  const eventDate = new Date(nextEvent.date);
  const daysUntil = Math.max(
    0,
    Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 h-full">
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Next Event
        </div>
        <div className="flex h-10 w-10 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary">
          <span className="text-xs font-bold leading-none">{daysUntil}</span>
          <span className="text-[8px] uppercase">days</span>
        </div>
      </div>

      <div className="mt-3">
        <h3 className="font-semibold text-sm line-clamp-1">{nextEvent.title}</h3>
        <div className="mt-2 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            {eventDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}{" "}
            at {nextEvent.time}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">{nextEvent.location}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5 shrink-0" />
            {nextEvent.registeredCount.toLocaleString()} registered
          </div>
        </div>
      </div>

      <Link
        href={`/events/${nextEvent.id}`}
        className="mt-3 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        View details <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
