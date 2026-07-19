"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  Share2,
  Heart,
  Mountain,
  Check,
  X,
  ChevronDown,
  ClipboardList,
  Download,
  Edit3,
  AlertTriangle,
} from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { actions } from "@/lib/actions";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistance, formatRelativeTime } from "@/lib/utils";
import type { Event } from "@/types";

interface Participant {
  userId: string;
  name: string;
  avatar: string;
  registeredAt: string;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, profile } = useAuth();
  const { data: apiEvents, refetch: refetchEvents } = useFetch<Event[]>("/api/events");
  const events = apiEvents || [];
  const event = events.find((e) => e.id === params.id);
  const [registering, setRegistering] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const { data: participantsData, loading: loadingParticipants } = useFetch<Participant[]>(
    showParticipants ? `/api/events/${params.id}/participants` : ""
  );
  const [showOrganizerMenu, setShowOrganizerMenu] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-bold">Event not found</h2>
        <Link href="/events" className="mt-4 text-sm text-primary hover:underline">
          ← Back to events
        </Link>
      </div>
    );
  }

  const e = event;
  const eventDate = new Date(e.date);
  const spotsLeft = e.maxParticipants - e.registeredCount;
  const fillPercentage = (e.registeredCount / e.maxParticipants) * 100;
  const isOrganizer = !!(profile && (profile.name === e.organizer || profile.id === e.organizerId));
  const participants = participantsData || [];

  async function handleRegister() {
    if (!isAuthenticated) { router.push("/login"); return; }
    setRegistering(true);
    try {
      if (e.isRegistered) {
        await actions.unregisterEvent(e.id);
      } else {
        await actions.registerEvent(e.id);
      }
      await refetchEvents();
    } catch (err) {
    } finally {
      setRegistering(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // fallback
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    try {
      await navigator.share({
        title: e.title,
        text: `${e.title} on ZERO6`,
        url: window.location.href,
      });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
    }
  }

  async function handleCancelEvent() {
    setCancelling(true);
    try {
      await actions.updateEvent(e.id, { status: "cancelled" });
      setShowCancelConfirm(false);
      setShowOrganizerMenu(false);
      await refetchEvents();
    } catch (err) {
    } finally {
      setCancelling(false);
    }
  }

  async function handleExportParticipants() {
    if (participants.length === 0) return;
    const header = "Name,Registered At";
    const rows = participants.map((p) => `"${p.name}","${new Date(p.registeredAt).toLocaleDateString()}"`);
    const csv = [header, ...rows].join("\n");
    await navigator.clipboard.writeText(csv);
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Events
      </Link>

      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl"
      >
        <div
          className={"h-56 sm:h-72 bg-cover bg-center" + (e.status === "cancelled" ? " opacity-50" : "")}
          style={{ backgroundImage: `url(${e.coverImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className="bg-white/20 text-white backdrop-blur text-xs">
                {e.type.replace("_", " ").toUpperCase()}
              </Badge>
              <Badge className="bg-white/20 text-white backdrop-blur text-xs">
                {formatDistance(e.distance)}
              </Badge>
              {e.isRegistered && (
                <Badge className="bg-success/80 text-white text-xs">
                  ✓ You&apos;re Registered
                </Badge>
              )}
              {e.status === "cancelled" && (
                <Badge className="bg-destructive/80 text-white text-xs">
                  Cancelled
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {e.title}
            </h1>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <h2 className="text-lg font-semibold">About This Event</h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              {e.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {e.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          </motion.div>

          {/* Event Details Grid */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {[
              {
                icon: Calendar,
                label: "Date",
                value: eventDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }),
              },
              { icon: Clock, label: "Start Time", value: e.time },
              {
                icon: Mountain,
                label: "Distance",
                value: formatDistance(e.distance),
              },
              { icon: DollarSign, label: "Price", value: e.price === 0 ? "Free" : `$${e.price}` },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-card p-4 text-center"
                >
                  <Icon className="mx-auto h-5 w-5 text-primary" />
                  <p className="mt-2 text-sm font-bold">{item.value}</p>
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                </div>
              );
            })}
          </motion.div>

          {/* Location */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <h2 className="text-lg font-semibold">Location</h2>
            <div className="mt-3 flex items-start gap-3">
              <MapPin className="h-5 w-5 shrink-0 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">{e.location}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Exact start location and course map will be emailed to registered participants.
                </p>
              </div>
            </div>
            {/* Map Placeholder */}
            <div className="mt-4 h-40 rounded-xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
              <div className="text-center">
                <MapPin className="mx-auto h-8 w-8 text-muted-foreground/30" />
                <p className="mt-2 text-xs text-muted-foreground">
                  Map requires Mapbox token
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Registration Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="sticky top-20 rounded-2xl border border-border bg-card p-5"
          >
            <div className="text-center">
              <p className="text-3xl font-bold">
                {e.price === 0 ? "Free" : `$${e.price}`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">per participant</p>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">
                  {e.registeredCount.toLocaleString()} registered
                </span>
                <span className="font-medium">
                  {spotsLeft.toLocaleString()} spots left
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                  style={{ width: `${fillPercentage}%` }}
                />
              </div>
            </div>

            {/* View Participants */}
            <Button
              variant="ghost"
              className="w-full mt-3 rounded-xl h-9 text-xs"
              onClick={() => setShowParticipants(true)}
            >
              <Users className="h-3.5 w-3.5 mr-1.5" />
              View Participants ({e.registeredCount})
            </Button>

            {/* Registered status & Unregister */}
            {e.isRegistered ? (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                  <Check className="h-4 w-4" />
                  <span className="font-medium">You&apos;re Registered</span>
                </div>
                {e.registeredAt && (
                  <p className="text-[10px] text-center text-muted-foreground">
                    Registered {formatRelativeTime(e.registeredAt)}
                  </p>
                )}
                <Button
                  className="w-full rounded-xl h-10"
                  variant="secondary"
                  size="lg"
                  onClick={handleRegister}
                  disabled={registering}
                >
                  {registering ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    "Unregister"
                  )}
                </Button>
              </div>
            ) : (
              <Button
                className="w-full mt-4 rounded-xl h-11"
                variant="default"
                size="lg"
                onClick={handleRegister}
                disabled={registering || e.status === "cancelled"}
              >
                {registering ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  "Register Now"
                )}
              </Button>
            )}

            <div className="mt-3 flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl" size="sm" onClick={handleSave} disabled={saving}>
                <Heart className={`h-4 w-4 mr-1.5 ${saving ? "text-primary" : ""}`} /> {saving ? "Copied!" : "Save"}
              </Button>
              <Button variant="outline" className="flex-1 rounded-xl" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-1.5" /> Share
              </Button>
            </div>

            {/* Organizer */}
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-xs text-muted-foreground mb-2">Organized by</p>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={e.organizerAvatar} />
                  <AvatarFallback>
                    {e.organizer.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{e.organizer}</p>
                  <p className="text-[10px] text-muted-foreground">Event Organizer</p>
                </div>
              </div>
            </div>

            {/* Organizer Controls */}
            {isOrganizer && (
              <div className="mt-4 border-t border-border pt-4 relative">
                <Button
                  variant="outline"
                  className="w-full rounded-xl"
                  size="sm"
                  onClick={() => setShowOrganizerMenu(!showOrganizerMenu)}
                >
                  <ClipboardList className="h-4 w-4 mr-1.5" />
                  Manage Event
                  <ChevronDown className="h-3.5 w-3.5 ml-auto" />
                </Button>
                {showOrganizerMenu && (
                  <div className="absolute bottom-full left-0 right-0 mb-1 rounded-xl border border-border bg-card shadow-lg p-1.5 space-y-1 z-10">
                    <button
                      onClick={() => {
                        setShowOrganizerMenu(false);
                        router.push(`/events/${e.id}/edit`);
                      }}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-secondary transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit Event
                    </button>
                    <button
                      onClick={() => {
                        setShowOrganizerMenu(false);
                        handleExportParticipants();
                      }}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-secondary transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export Participants
                    </button>
                    <button
                      onClick={() => {
                        setShowOrganizerMenu(false);
                        setShowCancelConfirm(true);
                      }}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Cancel Event
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Participants Modal */}
      {showParticipants && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
            onClick={() => setShowParticipants(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-50 w-full max-w-md rounded-2xl border bg-background p-6 shadow-lg animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200 max-h-[80vh] flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                Participants ({e.registeredCount})
              </h2>
              <button
                onClick={() => setShowParticipants(false)}
                className="rounded-lg p-1.5 hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {loadingParticipants ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : participants.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No participants yet.
                </p>
              ) : (
                participants.map((p) => (
                  <div
                    key={p.userId}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={p.avatar} />
                      <AvatarFallback className="text-xs">
                        {p.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Registered {formatRelativeTime(p.registeredAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
            onClick={() => setShowCancelConfirm(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-50 w-full max-w-sm rounded-2xl border bg-background p-6 shadow-lg animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200"
          >
            <h2 className="text-lg font-semibold">Cancel Event</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to cancel this event? This action cannot be undone.
            </p>
            <div className="mt-4 flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setShowCancelConfirm(false)}
                disabled={cancelling}
              >
                Keep Event
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl"
                onClick={handleCancelEvent}
                disabled={cancelling}
              >
                {cancelling ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  "Yes, Cancel"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
