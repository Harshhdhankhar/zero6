import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names with Tailwind CSS conflict resolution.
 * Combines clsx for conditional classes and twMerge for deduplication.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a distance in meters to a human-readable string.
 * Shows km with 2 decimal places if >= 1000m, otherwise shows meters.
 *
 * @example formatDistance(5420) → "5.42 km"
 * @example formatDistance(800) → "800 m"
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Format pace from seconds per km to M:SS /km format.
 *
 * @example formatPace(330) → "5:30 /km"
 * @example formatPace(265) → "4:25 /km"
 */
export function formatPace(secondsPerKm: number): string {
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")} /km`;
}

/**
 * Format a duration in seconds to a human-readable string.
 * Omits zero-value segments (e.g. no hours if < 1h).
 *
 * @example formatDuration(3725) → "1h 2m 5s"
 * @example formatDuration(145) → "2m 25s"
 * @example formatDuration(45) → "45s"
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.round(seconds % 60);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(" ");
}

/**
 * Format a date to "Month Day, Year" format.
 *
 * @example formatDate(new Date("2026-07-04")) → "July 4, 2026"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a date as relative time from now.
 *
 * @example formatRelativeTime(justNow) → "just now"
 * @example formatRelativeTime(fiveMinutesAgo) → "5m ago"
 * @example formatRelativeTime(twoHoursAgo) → "2h ago"
 * @example formatRelativeTime(threeDaysAgo) → "3d ago"
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

/**
 * Get initials from a full name (max 2 characters).
 *
 * @example getInitials("Alex Rivera") → "AR"
 * @example getInitials("Sarah Jane Chen") → "SC"
 * @example getInitials("Madonna") → "M"
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Generate a random ID string.
 * Uses crypto.randomUUID when available, falls back to a manual implementation.
 *
 * @example generateId() → "a1b2c3d4e5f6"
 */
export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
