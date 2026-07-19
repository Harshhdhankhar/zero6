"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Users,
  Search,
  Plus,
  DollarSign,
  Flame,
} from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EventCreateDialog } from "@/components/shared/event-create-dialog";
import { formatDistance } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Event, EventType } from "@/types";

const typeLabels: Record<EventType, string> = {
  "5k": "5K",
  "10k": "10K",
  half_marathon: "Half Marathon",
  marathon: "Marathon",
  ultra: "Ultra",
  trail_race: "Trail Race",
  fun_run: "Fun Run",
  virtual: "Virtual",
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function EventsPage() {
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const itemsPerPage = 9;
  const { data: apiEvents, loading } = useFetch<Event[]>("/api/events");

  const events = apiEvents || [];

  const filteredEvents = events.filter((e) => {
    const matchesType = filter === "all" || e.type === filter;
    const matchesSearch =
      !searchQuery ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const paginatedEvents = filteredEvents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

  const handleRegister = async (eventId: string) => {
    setRegisteringId(eventId);
    try {
      const res = await fetch("/api/events/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (res.ok) {
        const event = events.find(e => e.id === eventId);
        if (event) {
          event.isRegistered = true;
          event.registeredCount += 1;
        }
      }
    } catch (error) {
    } finally {
      setRegisteringId(null);
    }
  };

  const filters = [
    { value: "all", label: "All Events" },
    { value: "5k", label: "5K" },
    { value: "10k", label: "10K" },
    { value: "half_marathon", label: "Half Marathon" },
    { value: "marathon", label: "Marathon" },
    { value: "ultra", label: "Ultra" },
    { value: "trail_race", label: "Trail" },
    { value: "virtual", label: "Virtual" },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-2xl overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/50" />
        <div className="relative z-10 p-8 md:p-12">
          <div className="max-w-2xl">
            <div className="badge inline-flex items-center gap-2 mb-4">
              <Calendar className="w-3 h-3" />
              Running Events
            </div>
            <h1 className="display-heading text-4xl md:text-5xl lg:text-6xl mb-4">
              Discover <span className="text-gradient">Races</span>
            </h1>
            <p className="text-lg text-gray-300 mb-6 max-w-lg">
              Find your next challenge. From 5K fun runs to ultra marathons, discover events that push your limits.
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="btn-primary gap-2"
            >
              <Plus className="h-4 w-4" /> Create Event
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative"
      >
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search events by name or location..."
          className="input w-full h-12 pl-12 pr-4 text-sm"
        />
      </motion.div>

      {/* Filter Pills */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex flex-wrap gap-3"
      >
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer",
              filter === f.value
                ? "bg-primary text-white shadow-lg shadow-primary/30"
                : "bg-secondary/30 border border-border text-gray-300 hover:bg-secondary hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </motion.div>

      {/* Registered Events Banner */}
      {events.some((e) => e.isRegistered) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-strong p-6 rounded-2xl"
        >
          <h3 className="heading-md text-lg mb-4">
            Your Upcoming Events ({events.filter((e) => e.isRegistered).length})
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {events
              .filter((e) => e.isRegistered)
              .map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="flex shrink-0 items-center gap-4 rounded-xl bg-secondary/30 border border-border p-4 transition-all hover:bg-secondary hover:border-primary/30"
                >
                  <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-primary/20 border border-primary/30 text-primary">
                    <span className="text-lg font-bold leading-none">
                      {new Date(event.date).getDate()}
                    </span>
                    <span className="text-[10px] uppercase font-medium">
                      {new Date(event.date).toLocaleDateString("en-US", {
                        month: "short",
                      })}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold line-clamp-1">{event.title}</p>
                    <p className="text-sm text-muted">{event.location}</p>
                  </div>
                </Link>
              ))}
          </div>
        </motion.div>
      )}

      {/* Events Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <div className="p-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-3">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </div>
          ))
        ) : filteredEvents.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <Calendar className="mx-auto h-16 w-16 text-muted mb-4" />
            <p className="text-xl font-semibold mb-2">No events found</p>
            <p className="text-muted">
              {searchQuery ? "Try adjusting your search" : "Check back later for upcoming events"}
            </p>
          </div>
        ) : paginatedEvents.map((event) => {
          const eventDate = new Date(event.date);
          const spotsLeft = event.maxParticipants - event.registeredCount;
          const almostFull = spotsLeft / event.maxParticipants < 0.2;

          return (
            <motion.div key={event.id} variants={itemVariants}>
              <Link href={`/events/${event.id}`}>
                <div className="card card-interactive overflow-hidden">
                  {/* Cover Image */}
                  <div
                    className="relative h-48 bg-cover bg-center"
                    style={{ backgroundImage: `url(${event.coverImage})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <Badge className="bg-black/50 backdrop-blur-sm border border-border text-white text-xs font-medium">
                        {typeLabels[event.type]}
                      </Badge>
                      {almostFull && (
                        <Badge className="bg-red-500/90 text-white text-xs font-medium">
                          Almost Full
                        </Badge>
                      )}
                    </div>
                    {event.isRegistered && (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-green-500/90 text-white text-xs font-medium">
                          ✓ Registered
                        </Badge>
                      </div>
                    )}
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="heading-md text-lg text-white line-clamp-1">
                        {event.title}
                      </h3>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-6">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3 text-muted">
                        <Calendar className="h-4 w-4 shrink-0 text-primary" />
                        {eventDate.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        · {event.time}
                      </div>
                      <div className="flex items-center gap-3 text-muted">
                        <MapPin className="h-4 w-4 shrink-0 text-primary" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-4 text-muted">
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          {event.registeredCount.toLocaleString()} /{" "}
                          {event.maxParticipants.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-2">
                          <Flame className="h-4 w-4 text-primary" />
                          {formatDistance(event.distance)}
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted" />
                        <span className="font-bold">
                          {event.price === 0 ? "Free" : `$${event.price}`}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant={event.isRegistered ? "secondary" : "default"}
                        className="rounded-xl text-sm"
                        disabled={registeringId === event.id || event.isRegistered}
                        onClick={(e) => {
                          e.preventDefault();
                          if (!event.isRegistered) handleRegister(event.id);
                        }}
                      >
                        {registeringId === event.id
                          ? "Registering..."
                          : event.isRegistered
                          ? "Registered"
                          : "Register"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="rounded-xl"
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "w-10 h-10 rounded-xl text-sm font-medium transition-colors cursor-pointer",
                  currentPage === page
                    ? "bg-primary text-white"
                    : "bg-secondary/30 text-muted hover:bg-secondary hover:text-foreground"
                )}
              >
                {page}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="rounded-xl"
          >
            Next
          </Button>
        </div>
      )}

      <EventCreateDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </div>
  );
}
