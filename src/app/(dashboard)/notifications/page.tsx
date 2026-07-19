"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  UserPlus,
  Trophy,
  Calendar,
  Users,
  Settings,
  Award,
  CheckCheck,
} from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { useAppStore } from "@/store/app-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import type { Notification, NotificationType } from "@/types";

const typeIcons: Record<NotificationType, React.ElementType> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  achievement: Award,
  challenge: Trophy,
  event: Calendar,
  club: Users,
  system: Settings,
};

const typeColors: Record<NotificationType, string> = {
  like: "text-red-500 bg-red-500/10",
  comment: "text-blue-500 bg-blue-500/10",
  follow: "text-primary bg-primary/10",
  achievement: "text-amber-500 bg-amber-500/10",
  challenge: "text-purple-500 bg-purple-500/10",
  event: "text-emerald-500 bg-emerald-500/10",
  club: "text-indigo-500 bg-indigo-500/10",
  system: "text-muted-foreground bg-secondary",
};

export default function NotificationsPage() {
  const [filter, setFilter] = useState<string>("all");
  const { data: apiNotifs, loading } = useFetch<Notification[]>("/api/notifications");
  const setUnreadNotifications = useAppStore((s) => s.setUnreadNotifications);
  const [notifs, setNotifs] = useState<Notification[]>([]);

  useEffect(() => {
    if (apiNotifs && apiNotifs.length > 0) {
      setNotifs(apiNotifs);
    }
  }, [apiNotifs]);

  const unreadCount = notifs.filter((n) => !n.isRead).length;

  const filteredNotifs = notifs.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.isRead;
    return n.type === filter;
  });

  const markAllRead = async () => {
    setNotifs(notifs.map((n) => ({ ...n, isRead: true })));
    setUnreadNotifications(0);
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
  };

  const markRead = async (id: string) => {
    setNotifs(notifs.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadNotifications(Math.max(unreadCount - 1, 0));
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-lg text-xs"
            onClick={markAllRead}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: "all", label: "All" },
          { value: "unread", label: `Unread (${unreadCount})` },
          { value: "like", label: "Likes" },
          { value: "comment", label: "Comments" },
          { value: "follow", label: "Follows" },
          { value: "achievement", label: "Achievements" },
          { value: "event", label: "Events" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer",
              filter === f.value
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 rounded-xl p-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))
        ) : filteredNotifs.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No notifications yet
          </p>
        ) : (
          filteredNotifs.map((notif, index) => {
            const Icon = typeIcons[notif.type];
            const colorClasses = typeColors[notif.type];

            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Link
                  href={notif.actionUrl || "#"}
                  onClick={() => !notif.isRead && markRead(notif.id)}
                  className={cn(
                    "flex items-start gap-4 rounded-xl p-4 transition-all hover:bg-secondary/50",
                    !notif.isRead && "bg-primary/[0.03] border border-primary/10"
                  )}
                >
                  <div className="shrink-0">
                    {notif.avatar ? (
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={notif.avatar} />
                        <AvatarFallback>N</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full",
                          colorClasses
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm", !notif.isRead && "font-semibold")}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-muted-foreground mt-1 inline-block">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>

                  {!notif.isRead && (
                    <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                  )}
                </Link>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
