/* ================================================================
   ZERO6 — Application Constants
   ================================================================ */

import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Activity,
  Map,
  Users,
  Calendar,
  Trophy,
  Award,
  MessageSquare,
  Bell,
  Settings,
  Bot,
  Gift,
  Bookmark,
  Camera,
} from "lucide-react";

// ----------------------------------------------------------------
// Navigation
// ----------------------------------------------------------------

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Activities",
    href: "/activities",
    icon: Activity,
  },
  {
    label: "Explore",
    href: "/explore",
    icon: Map,
  },
  {
    label: "Clubs",
    href: "/clubs",
    icon: Users,
  },
  {
    label: "Events",
    href: "/events",
    icon: Calendar,
  },
  {
    label: "Challenges",
    href: "/challenges",
    icon: Trophy,
  },
  {
    label: "Achievements",
    href: "/achievements",
    icon: Award,
  },
  {
    label: "Collections",
    href: "/collections",
    icon: Bookmark,
  },
  {
    label: "Gallery",
    href: "/gallery",
    icon: Camera,
  },
  {
    label: "Messages",
    href: "/messages",
    icon: MessageSquare,
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
  {
    label: "AI Coach",
    href: "/coach",
    icon: Bot,
  },
  {
    label: "Rewards",
    href: "/rewards",
    icon: Gift,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

// ----------------------------------------------------------------
// Activity Types
// ----------------------------------------------------------------

export const ACTIVITY_TYPES = [
  { value: "run", label: "Run", icon: "🏃" },
  { value: "walk", label: "Walk", icon: "🚶" },
  { value: "trail", label: "Trail Run", icon: "⛰️" },
  { value: "treadmill", label: "Treadmill", icon: "🏋️" },
] as const;

// ----------------------------------------------------------------
// Event Types
// ----------------------------------------------------------------

export const EVENT_TYPES = [
  { value: "5k", label: "5K" },
  { value: "10k", label: "10K" },
  { value: "half_marathon", label: "Half Marathon" },
  { value: "marathon", label: "Marathon" },
  { value: "ultra", label: "Ultra Marathon" },
  { value: "trail_race", label: "Trail Race" },
  { value: "fun_run", label: "Fun Run" },
  { value: "virtual", label: "Virtual Race" },
] as const;

// ----------------------------------------------------------------
// Challenge Difficulties
// ----------------------------------------------------------------

export const CHALLENGE_DIFFICULTIES = [
  {
    value: "beginner",
    label: "Beginner",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
  },
  {
    value: "advanced",
    label: "Advanced",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
  },
  {
    value: "elite",
    label: "Elite",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
  },
] as const;
