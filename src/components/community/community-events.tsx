"use client";

import { useFetch } from "@/hooks/use-fetch";
import { useAuth } from "@/hooks/use-auth";
import { Calendar, MapPin, Users, Clock, Cloud, QrCode, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { cn, formatDistance } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import { useState, useCallback } from "react";

export function CommunityEvents({ clubId }: { clubId: string }) {
  const { isAuthenticated } = useAuth();
  const { data, loading, error, refetch } = useFetch<{ data: any[] }>(`/api/events?clubId=${clubId}`);
  const events = data?.data || [];
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  const handleRegister = useCallback(async (eventId: string, isRegistered: boolean) => {
    if (!isAuthenticated) { toast.error("Sign in to register"); return; }
    setRegisteringId(eventId);
    try {
      const res = await fetch("/api/events/register", {
        method: isRegistered ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(isRegistered ? "Unregistered" : "Registered!");
      refetch();
    } catch (err: any) { toast.error(err.message); }
    finally { setRegisteringId(null); }
  }, [isAuthenticated, refetch]);

  const handleQR = useCallback(async (eventId: string) => {
    if (!isAuthenticated) { toast.error("Sign in to generate QR"); return; }
    try {
      const res = await fetch(`/api/clubs/${clubId}/qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("QR Code generated!");
    } catch { toast.error("Failed to generate QR"); }
  }, [clubId, isAuthenticated]);

  if (loading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>;

  if (error) return (
    <div className="flex flex-col items-center py-12 text-center">
      <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
      <p className="text-sm text-white/60">Failed to load events</p>
      <Button variant="secondary" size="sm" onClick={refetch} className="mt-3 gap-2"><RefreshCw className="h-3 w-3" /> Retry</Button>
    </div>
  );

  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Calendar className="h-10 w-10 text-white/20 mb-2" />
          <p className="text-sm text-white/40">No events scheduled yet</p>
        </div>
      ) : (
        events.map((event: any, i: number) => {
          const eventDate = new Date(event.date || event.date);
          const daysUntil = Math.ceil((eventDate.getTime() - Date.now()) / 86400000);
          const isPast = daysUntil < 0;
          const isRegistered = event.isRegistered;

          return (
            <motion.div key={event.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={cn("rounded-2xl border border-border bg-white/[0.03] overflow-hidden hover:border-border transition-all",
                isPast && "opacity-50")}>
              <div className="p-4">
                <div className="flex items-start gap-4">
                  {/* Date Badge */}
                  <div className="w-14 h-14 shrink-0 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-medium text-white/60 uppercase">{eventDate.toLocaleDateString("en-US", { month: "short" })}</span>
                    <span className="text-lg font-bold text-white">{eventDate.getDate()}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link href={`/events/${event.id}`}>
                          <h3 className="text-sm font-semibold text-white hover:text-primary transition-colors">{event.title}</h3>
                        </Link>
                        <p className="text-[11px] text-white/40 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" /> {event.location || "TBD"}
                        </p>
                      </div>
                      <Badge variant="secondary" className={cn("text-[10px] capitalize shrink-0",
                        daysUntil <= 1 ? "bg-emerald-500/20 text-emerald-400" : daysUntil <= 7 ? "bg-amber-500/20 text-amber-400" : "")}>
                        {isPast ? "Past" : daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil}d left`}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-[10px] text-white/40">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {event.time || "06:00"}</span>
                      {event.distance && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDistance(event.distance)}</span>}
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {event.registeredCount || 0}/{event.maxParticipants || "∞"}</span>
                      {event.weather && <span className="flex items-center gap-1"><Cloud className="h-3 w-3" /> {event.weather}</span>}
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <Button onClick={() => handleRegister(event.id, isRegistered)} disabled={registeringId === event.id || isPast}
                        size="sm" className={cn("h-8 text-xs rounded-xl gap-1.5",
                          isRegistered ? "bg-secondary/50 text-white hover:bg-white/20" : "bg-primary hover:bg-primary/90 text-white")}>
                        {registeringId === event.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        {isRegistered ? "Registered" : "Register"}
                      </Button>
                      {isRegistered && (
                        <Button onClick={() => handleQR(event.id)} variant="ghost" size="sm"
                          className="h-8 text-xs rounded-xl gap-1.5 text-white/40 hover:text-white">
                          <QrCode className="h-3.5 w-3.5" /> QR
                        </Button>
                      )}
                      <Link href={`/events/${event.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 text-xs rounded-xl text-white/40 hover:text-white">Details</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  );
}
